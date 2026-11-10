// https://developers.cloudflare.com/realtime/turn/generate-credentials/
const TURN_KEYS_API = 'https://rtc.live.cloudflare.com/v1/turn/keys';
// A relayed connection keeps using these credentials, so they outlive a long
// session of rounds. A room asks for new ones every time two players meet.
const CREDENTIALS_TTL_SECONDS = 4 * 60 * 60;

// The TURN key stays here as a Worker secret; players only get credentials
// that expire (decision 001). Null when Cloudflare can't make them.
export async function createIceServers(env: Env): Promise<object | null> {
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
