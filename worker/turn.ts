import { DurableObject } from 'cloudflare:workers';

// https://developers.cloudflare.com/realtime/turn/generate-credentials/
const TURN_KEYS_API = 'https://rtc.live.cloudflare.com/v1/turn/keys';
// Cloudflare drops a relayed connection shortly after its credential expires, so the
// TTL has to outlast a long session of rounds. A room asks for new ones every time two players meet.
const CREDENTIALS_TTL_SECONDS = 4 * 60 * 60;
// TURN is billed by usage and the account has no hard spending cap (#59). A game relays
// well under 1 MB, so this many meetings a day stay far inside the 1,000 GB free tier.
export const DAILY_CREDENTIALS_CAP = 100;

interface DailyCount {
  day: string;
  count: number;
}

// One object for the whole Worker. Calls run one at a time, so two rooms can't both take the last credential.
export class TurnBudget extends DurableObject<Env> {
  take(): boolean {
    const day = new Date().toISOString().slice(0, 10);
    const stored = this.ctx.storage.kv.get<DailyCount>('daily-count');
    const count = stored?.day === day ? stored.count : 0;
    if (count >= DAILY_CREDENTIALS_CAP) return false;

    this.ctx.storage.kv.put<DailyCount>('daily-count', { day, count: count + 1 });
    return true;
  }
}

// The TURN key stays here as a Worker secret; players only get credentials
// that expire (decision 001). Null past the daily cap or when Cloudflare can't make them.
export async function createIceServers(env: Env): Promise<object | null> {
  if (!(await env.TURN_BUDGET.getByName('daily').take())) return null;

  const response = await fetch(
    `${TURN_KEYS_API}/${env.TURN_KEY_ID}/credentials/generate-ice-servers`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.TURN_KEY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ttl: CREDENTIALS_TTL_SECONDS }),
    },
  ).catch(() => null);

  if (!response?.ok) {
    console.error('TURN credentials failed', response?.status ?? 'network error');
    return null;
  }
  const body: unknown = await response.json().catch(() => null);
  return typeof body === 'object' ? body : null;
}
