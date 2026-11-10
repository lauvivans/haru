import { exports } from 'cloudflare:workers';
import { afterEach, describe, expect, it, vi } from 'vitest';

const ICE_SERVERS = { iceServers: [{ urls: ['stun:stun.cloudflare.com:3478'] }] };

function getIceServers() {
  return exports.default.fetch('https://haru.test/ice-servers');
}

describe('GET /ice-servers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('asks Cloudflare for short-lived credentials with the secret key', async () => {
    const cloudflare = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => Response.json(ICE_SERVERS, { status: 201 }));

    const response = await getIceServers();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual(ICE_SERVERS);

    const [url, init] = cloudflare.mock.calls[0] ?? [];
    expect(url).toBe(
      'https://rtc.live.cloudflare.com/v1/turn/keys/test-key/credentials/generate-ice-servers',
    );
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer test-token');
    expect(init?.body).toBe(JSON.stringify({ ttl: 4 * 60 * 60 }));
  });

  it('answers 502 without the key when Cloudflare fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () => new Response('denied', { status: 401 }),
    );

    const response = await getIceServers();

    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain('test-token');
  });

  it('answers 502 when Cloudflare is unreachable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('network'));

    expect((await getIceServers()).status).toBe(502);
  });
});
