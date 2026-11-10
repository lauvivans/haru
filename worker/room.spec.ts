import { evictDurableObject, runDurableObjectAlarm, runInDurableObject } from 'cloudflare:test';
import { env, exports } from 'cloudflare:workers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DAILY_CREDENTIALS_CAP } from './turn';

const ORIGIN = 'https://haru.test';
const offer = { type: 'offer', data: { type: 'offer', sdp: 'v=0 offer' } };
const answer = { type: 'answer', data: { type: 'answer', sdp: 'v=0 answer' } };
const candidate = {
  type: 'ice-candidate',
  data: { candidate: 'candidate:1 1 udp 1 192.0.2.1 5000 typ host', sdpMid: '0' },
};

interface Player {
  socket: WebSocket;
  messages: unknown[];
  closeCode?: number;
  send: (message: unknown) => void;
}

const openSockets: WebSocket[] = [];

async function newRoom() {
  const response = await exports.default.fetch(`${ORIGIN}/rooms`, { method: 'POST' });
  const { code } = await response.json<{ code: string }>();
  return code;
}

async function join(code: string) {
  const response = await exports.default.fetch(`${ORIGIN}/rooms/${code}`, {
    headers: { Upgrade: 'websocket' },
  });
  const socket = response.webSocket;
  if (!socket) throw new Error(`No WebSocket, status ${response.status}`);

  const player: Player = {
    socket,
    messages: [],
    send: (message) => socket.send(JSON.stringify(message)),
  };
  socket.addEventListener('message', (event) => {
    if (typeof event.data === 'string') player.messages.push(JSON.parse(event.data));
  });
  socket.addEventListener('close', (event) => {
    player.closeCode = event.code;
  });
  socket.accept();
  openSockets.push(socket);
  return player;
}

async function joinPair() {
  const code = await newRoom();
  const first = await join(code);
  const second = await join(code);
  await vi.waitFor(() => expect(first.messages).toEqual([{ type: 'peer-joined' }]));
  return { code, first, second };
}

const ICE_SERVERS = { iceServers: [{ urls: ['stun:stun.cloudflare.com:3478'] }] };

// Every room calls Cloudflare TURN when two players meet. No test reaches the real API:
// it fails here unless a test answers with credentials.
function turnAnswers(response: () => Response) {
  // The Response is made inside the call, since the room can't read one made by the test.
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async () => response());
}

const budget = () => env.TURN_BUDGET.getByName('daily');

async function useUpDailyCredentials() {
  for (let i = 0; i < DAILY_CREDENTIALS_CAP; i++) await budget().take();
}

beforeEach(async () => {
  await runInDurableObject(budget(), (_, state) => state.storage.deleteAll());
  vi.spyOn(console, 'error').mockImplementation(() => {});
  turnAnswers(() => new Response('unavailable', { status: 503 }));
});

afterEach(() => {
  openSockets.splice(0).forEach((socket) => socket.close());
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Room', () => {
  it('creates short room codes without look-alike characters', async () => {
    const code = await newRoom();
    expect(code).toMatch(/^[2-9A-HJ-NP-Z]{6}$/);
  });

  it('gives both players TURN credentials before the offer', async () => {
    const turn = turnAnswers(() => Response.json(ICE_SERVERS, { status: 201 }));
    const code = await newRoom();
    const first = await join(code);
    expect(turn).not.toHaveBeenCalled();

    const second = await join(code);
    const iceServers = { type: 'ice-servers', data: ICE_SERVERS };
    await vi.waitFor(() => expect(first.messages).toEqual([iceServers, { type: 'peer-joined' }]));
    await vi.waitFor(() => expect(second.messages).toEqual([iceServers]));

    const [url, init] = turn.mock.calls[0] ?? [];
    expect(url).toBe(
      'https://rtc.live.cloudflare.com/v1/turn/keys/test-key/credentials/generate-ice-servers',
    );
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer test-token');
    expect(init?.body).toBe(JSON.stringify({ ttl: 15 * 60 }));
  });

  describe('while two players stay in the room', () => {
    const iceServers = { type: 'ice-servers', data: ICE_SERVERS };

    async function meetWithTurn() {
      const turn = turnAnswers(() => Response.json(ICE_SERVERS, { status: 201 }));
      const code = await newRoom();
      const first = await join(code);
      const second = await join(code);
      await vi.waitFor(() => expect(second.messages).toEqual([iceServers]));
      return { room: env.ROOMS.getByName(code), turn, first, second };
    }

    it('sends both players new TURN credentials before the old ones expire', async () => {
      const { room, turn, first, second } = await meetWithTurn();
      const scheduled = await runInDurableObject(room, (_, state) => state.storage.getAlarm());
      expect(scheduled).toBeGreaterThan(Date.now() + 9 * 60 * 1000);
      expect(scheduled).toBeLessThan(Date.now() + 15 * 60 * 1000);

      expect(await runDurableObjectAlarm(room)).toBe(true);
      await vi.waitFor(() => expect(second.messages).toEqual([iceServers, iceServers]));
      expect(first.messages).toEqual([iceServers, { type: 'peer-joined' }, iceServers]);
      expect(turn).toHaveBeenCalledTimes(2);

      expect(await runDurableObjectAlarm(room)).toBe(true);
      await vi.waitFor(() => expect(second.messages).toHaveLength(3));
    });

    it('counts every refresh against the daily cap and stops past it', async () => {
      const { room, turn, second } = await meetWithTurn();
      for (let i = 1; i < DAILY_CREDENTIALS_CAP; i++) await budget().take();
      expect(await budget().take()).toBe(false);

      expect(await runDurableObjectAlarm(room)).toBe(true);
      expect(second.messages).toEqual([iceServers]);
      expect(turn).toHaveBeenCalledTimes(1);
      expect(await runDurableObjectAlarm(room)).toBe(false);
    });

    it('stops refreshing once a player leaves', async () => {
      const { room, turn, first, second } = await meetWithTurn();
      second.socket.close(1000, 'bye');
      await vi.waitFor(() => expect(first.messages).toContainEqual({ type: 'peer-disconnected' }));

      expect(await runDurableObjectAlarm(room)).toBe(true);
      expect(turn).toHaveBeenCalledTimes(1);
      expect(await runDurableObjectAlarm(room)).toBe(false);
    });
  });

  it('connects the players with STUN only past the daily TURN cap', async () => {
    await useUpDailyCredentials();
    const turn = turnAnswers(() => Response.json(ICE_SERVERS, { status: 201 }));

    const { second } = await joinPair();
    expect(second.messages).toEqual([]);
    expect(turn).not.toHaveBeenCalled();
  });

  it('hands out TURN credentials again on the next UTC day', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-10T23:59:00Z'));
    await useUpDailyCredentials();

    vi.setSystemTime(new Date('2026-11-11T00:00:00Z'));
    turnAnswers(() => Response.json(ICE_SERVERS, { status: 201 }));
    const code = await newRoom();
    await join(code);
    const second = await join(code);
    await vi.waitFor(() =>
      expect(second.messages).toEqual([{ type: 'ice-servers', data: ICE_SERVERS }]),
    );
  });

  it('still connects the players with STUN only when TURN fails', async () => {
    const { second } = await joinPair();
    expect(second.messages).toEqual([]);
  });

  it('relays the offer, answer and ICE candidates between the two players', async () => {
    const { first, second } = await joinPair();

    first.send(offer);
    first.send(candidate);
    await vi.waitFor(() => expect(second.messages).toEqual([offer, candidate]));

    second.send(answer);
    second.send(candidate);
    await vi.waitFor(() =>
      expect(first.messages).toEqual([{ type: 'peer-joined' }, answer, candidate]),
    );
  });

  it('joins the same room whatever the case of the code', async () => {
    const code = await newRoom();
    const first = await join(code);
    await join(code.toLowerCase());
    await vi.waitFor(() => expect(first.messages).toEqual([{ type: 'peer-joined' }]));
  });

  it('tells a third player the room is full and closes their socket', async () => {
    const { code, first, second } = await joinPair();
    const third = await join(code);

    await vi.waitFor(() => expect(third.messages).toEqual([{ type: 'room-full' }]));
    await vi.waitFor(() => expect(third.closeCode).toBe(1008));

    first.send(offer);
    await vi.waitFor(() => expect(second.messages).toEqual([offer]));
    expect(third.messages).toEqual([{ type: 'room-full' }]);
  });

  it('tells the other player when one leaves and frees the seat', async () => {
    const { code, first, second } = await joinPair();

    second.socket.close(1000, 'bye');
    await vi.waitFor(() =>
      expect(first.messages).toEqual([{ type: 'peer-joined' }, { type: 'peer-disconnected' }]),
    );

    await join(code);
    await vi.waitFor(() =>
      expect(first.messages).toEqual([
        { type: 'peer-joined' },
        { type: 'peer-disconnected' },
        { type: 'peer-joined' },
      ]),
    );
  });

  it('drops messages that are not signaling', async () => {
    const { first, second } = await joinPair();

    first.socket.send('not json');
    first.send({ type: 'guess', data: { letter: 'a' } });
    first.send({ type: 'offer' });
    first.send({ type: 'offer', data: 'v=0' });
    first.send({ type: 'offer', data: { sdp: 'x'.repeat(20_000) } });
    first.socket.send(new Uint8Array([1, 2, 3]));
    first.send({ ...offer, nickname: 'Haru' });

    await vi.waitFor(() => expect(second.messages).toEqual([offer]));
  });

  it('keeps relaying after the room hibernates', async () => {
    const { code, first, second } = await joinPair();

    await evictDurableObject(env.ROOMS.getByName(code));

    first.send(offer);
    await vi.waitFor(() => expect(second.messages).toEqual([offer]));
  });

  it('refuses requests that are not a WebSocket or not a room', async () => {
    const code = await newRoom();
    const plain = await exports.default.fetch(`${ORIGIN}/rooms/${code}`);
    expect(plain.status).toBe(426);

    for (const path of ['/rooms/ABC', '/rooms/OOOOOO', '/rooms/ABCDEF/x', '/anything']) {
      const response = await exports.default.fetch(`${ORIGIN}${path}`, {
        headers: { Upgrade: 'websocket' },
      });
      expect(response.status, path).toBe(404);
    }
  });
});
