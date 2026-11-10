import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchIceServers, parseIceServers, STUN_ONLY } from '@/ice';

const cloudflare = {
  iceServers: [
    { urls: ['stun:stun.cloudflare.com:3478'] },
    {
      urls: [
        'turn:turn.cloudflare.com:3478?transport=udp',
        'turn:turn.cloudflare.com:80?transport=tcp',
        'turns:turn.cloudflare.com:443?transport=tcp',
      ],
      username: 'user',
      credential: 'secret',
    },
  ],
};

function respond(body: unknown, status = 200) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(body, { status }));
}

describe('ice', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseIceServers', () => {
    it('accepts the STUN and TURN servers from Cloudflare', () => {
      expect(parseIceServers(cloudflare)).toEqual(cloudflare.iceServers);
    });

    it('accepts a single URL as a string', () => {
      expect(parseIceServers({ iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }] })).toEqual([
        { urls: ['stun:stun.cloudflare.com:3478'] },
      ]);
    });

    it('drops anything else', () => {
      const turn = { urls: ['turn:turn.cloudflare.com:3478'], username: 'u', credential: 'c' };
      for (const value of [
        null,
        'text',
        {},
        { iceServers: [] },
        { iceServers: [{ urls: [] }] },
        { iceServers: [{ urls: ['https://evil.test'] }] },
        { iceServers: [{ urls: ['stun:ok.test', 42] }] },
        { iceServers: [{ ...turn, credential: undefined }] },
        { iceServers: [{ ...turn, username: 7 }] },
        { iceServers: Array.from({ length: 5 }, () => turn) },
        { iceServers: [{ urls: Array.from({ length: 11 }, () => 'stun:ok.test') }] },
      ]) {
        expect(parseIceServers(value)).toBeNull();
      }
    });
  });

  describe('fetchIceServers', () => {
    it('returns the servers from the Worker', async () => {
      respond(cloudflare);
      expect(await fetchIceServers()).toEqual(cloudflare.iceServers);
    });

    it('falls back to STUN when the Worker fails, answers off shape or is unreachable', async () => {
      respond('TURN unavailable', 502);
      expect(await fetchIceServers()).toEqual(STUN_ONLY);

      respond({ iceServers: 'nope' });
      expect(await fetchIceServers()).toEqual(STUN_ONLY);

      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'));
      expect(await fetchIceServers()).toEqual(STUN_ONLY);
    });
  });
});
