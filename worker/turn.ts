import { DurableObject } from 'cloudflare:workers';

// https://developers.cloudflare.com/realtime/turn/generate-credentials/
const TURN_KEYS_API = 'https://rtc.live.cloudflare.com/v1/turn/keys';
// Cloudflare drops a relayed connection shortly after its credential expires, so a room
// sends new ones while two players are still in it, with time to spare (#63).
export const CREDENTIALS_TTL_SECONDS = 15 * 60;
export const CREDENTIALS_REFRESH_MS = 10 * 60 * 1000;
export const CREDENTIALS_RETRY_MS = 60 * 1000;
// TURN is billed by usage (#59). Every meeting and every refresh takes one, so this
// covers about 15 games of 30 minutes a day, the expected use of the beta (#63).
export const DAILY_CREDENTIALS_CAP = 50;

interface DailyCount {
  day: string;
  count: number;
}

type IceServersResult =
  { status: 'created'; iceServers: object } | { status: 'past-cap' } | { status: 'failed' };

const today = () => new Date().toISOString().slice(0, 10);

// One object for the whole Worker. Calls run one at a time, so two rooms can't both take the last credential.
export class TurnBudget extends DurableObject<Env> {
  take(): boolean {
    const day = today();
    const stored = this.ctx.storage.kv.get<DailyCount>('daily-count');
    const count = stored?.day === day ? stored.count : 0;
    if (count >= DAILY_CREDENTIALS_CAP) return false;

    this.ctx.storage.kv.put<DailyCount>('daily-count', { day, count: count + 1 });
    return true;
  }

  // A request that got no credentials gives its place back (#66)
  giveBack() {
    const stored = this.ctx.storage.kv.get<DailyCount>('daily-count');
    if (stored?.day !== today() || stored.count === 0) return;
    this.ctx.storage.kv.put<DailyCount>('daily-count', { ...stored, count: stored.count - 1 });
  }
}

// The TURN key stays here as a Worker secret; players only get credentials
// that expire (decision 001).
export async function createIceServers(env: Env): Promise<IceServersResult> {
  const budget = env.TURN_BUDGET.getByName('daily');
  if (!(await budget.take())) return { status: 'past-cap' };

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

  const body: unknown = response?.ok ? await response.json().catch(() => null) : null;
  if (typeof body === 'object' && body !== null) return { status: 'created', iceServers: body };

  console.error('TURN credentials failed', response?.status ?? 'network error');
  await budget.giveBack();
  return { status: 'failed' };
}
