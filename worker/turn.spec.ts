import { runDurableObjectAlarm, runInDurableObject } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ICE_SERVERS,
  budget,
  closeRooms,
  join,
  joinPair,
  newRoom,
  resetRooms,
  turnCreates,
  turnFails,
  useUpDailyCredentials,
} from './test-room';
import { DAILY_CREDENTIALS_CAP } from './turn';

const iceServers = { type: 'ice-servers', data: ICE_SERVERS };
const MINUTE = 60 * 1000;

async function credentialsLeft() {
  let left = 0;
  while (await budget().take()) left++;
  return left;
}

beforeEach(resetRooms);
afterEach(closeRooms);

describe('Room TURN credentials', () => {
  it('gives both players TURN credentials before the offer', async () => {
    const turn = turnCreates();
    const code = await newRoom();
    const first = await join(code);
    expect(turn).not.toHaveBeenCalled();

    const second = await join(code);
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
    async function meetWithTurn() {
      const turn = turnCreates();
      const code = await newRoom();
      const first = await join(code);
      const second = await join(code);
      await vi.waitFor(() => expect(second.messages).toEqual([iceServers]));
      const room = env.ROOMS.getByName(code);
      const alarm = () => runInDurableObject(room, (_, state) => state.storage.getAlarm());
      return { room, alarm, turn, first, second };
    }

    it('sends both players new TURN credentials before the old ones expire', async () => {
      const { room, alarm, turn, first, second } = await meetWithTurn();
      expect(await alarm()).toBeGreaterThan(Date.now() + 9 * MINUTE);
      expect(await alarm()).toBeLessThan(Date.now() + 15 * MINUTE);

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

    it('tries a failed refresh again a minute later without using the daily cap', async () => {
      const { room, alarm, second } = await meetWithTurn();
      turnFails();
      expect(await runDurableObjectAlarm(room)).toBe(true);
      expect(second.messages).toEqual([iceServers]);
      expect(await alarm()).toBeGreaterThan(Date.now() + 0.5 * MINUTE);
      expect(await alarm()).toBeLessThanOrEqual(Date.now() + MINUTE);

      turnCreates();
      expect(await runDurableObjectAlarm(room)).toBe(true);
      await vi.waitFor(() => expect(second.messages).toEqual([iceServers, iceServers]));
      expect(await credentialsLeft()).toBe(DAILY_CREDENTIALS_CAP - 2);
    });

    it('stops trying again once the credentials the players have expire', async () => {
      const { room } = await meetWithTurn();
      turnFails();
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(Date.now() + 14.5 * MINUTE);

      expect(await runDurableObjectAlarm(room)).toBe(true);
      expect(await runDurableObjectAlarm(room)).toBe(false);
    });

    it('stops trying again once a player leaves', async () => {
      const { room, first, second } = await meetWithTurn();
      const turn = turnFails();
      expect(await runDurableObjectAlarm(room)).toBe(true);
      const calls = turn.mock.calls.length;

      second.socket.close(1000, 'bye');
      await vi.waitFor(() => expect(first.messages).toContainEqual({ type: 'peer-disconnected' }));
      expect(await runDurableObjectAlarm(room)).toBe(true);
      expect(turn).toHaveBeenCalledTimes(calls);
      expect(await runDurableObjectAlarm(room)).toBe(false);
    });
  });

  it('connects the players with STUN only past the daily TURN cap', async () => {
    await useUpDailyCredentials();
    const turn = turnCreates();

    const { second } = await joinPair();
    expect(second.messages).toEqual([]);
    expect(turn).not.toHaveBeenCalled();
  });

  it('hands out TURN credentials again on the next UTC day', async () => {
    // workerd fires alarms by the real clock, so the faked days must not be in the past (#69).
    const nextMidnight = new Date();
    nextMidnight.setUTCHours(24, 0, 0, 0);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(nextMidnight.getTime() - MINUTE);
    await useUpDailyCredentials();

    vi.setSystemTime(nextMidnight);
    turnCreates();
    const code = await newRoom();
    await join(code);
    const second = await join(code);
    await vi.waitFor(() => expect(second.messages).toEqual([iceServers]));
  });

  it('still connects the players with STUN only when TURN fails', async () => {
    const { second } = await joinPair();
    expect(second.messages).toEqual([]);
    expect(await credentialsLeft()).toBe(DAILY_CREDENTIALS_CAP);
  });
});
