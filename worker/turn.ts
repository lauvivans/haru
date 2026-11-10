// https://developers.cloudflare.com/realtime/turn/generate-credentials/
const TURN_KEYS_API = 'https://rtc.live.cloudflare.com/v1/turn/keys';
// A relayed connection keeps using these credentials, so they outlive a long
// session of rounds. The client asks for new ones on every connection.
const CREDENTIALS_TTL_SECONDS = 4 * 60 * 60;

// The TURN key stays here as a Worker secret; the client only gets
// credentials that expire (decision 001).
export async function iceServers(env: Env): Promise<Response> {
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
    return new Response('TURN unavailable', { status: 502 });
  }
  return new Response(response.body, {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
