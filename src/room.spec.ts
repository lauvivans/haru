import { describe, expect, it } from 'vitest';
import { isNickname, isRoomCode, parsePeerMessage, parseServerMessage } from './room';

const json = (value: unknown) => JSON.stringify(value);

describe('room', () => {
  describe('isRoomCode', () => {
    it('accepts six characters from the code alphabet, in any case', () => {
      expect(isRoomCode('K7QXAB')).toBe(true);
      expect(isRoomCode('k7qxab')).toBe(true);
    });

    it('refuses other lengths and look-alike characters', () => {
      expect(isRoomCode('K7QX')).toBe(false);
      expect(isRoomCode('K7QXABC')).toBe(false);
      expect(isRoomCode('K7QX0O')).toBe(false);
      expect(isRoomCode('K7QXI1')).toBe(false);
    });
  });

  describe('isNickname', () => {
    it('accepts 1 to 16 characters, accents and emoji included', () => {
      expect(isNickname('A')).toBe(true);
      expect(isNickname('João Ção')).toBe(true);
      expect(isNickname('🐼'.repeat(16))).toBe(true);
    });

    it('refuses empty, too long, padded or control characters', () => {
      expect(isNickname('')).toBe(false);
      expect(isNickname('a'.repeat(17))).toBe(false);
      expect(isNickname(' Ana')).toBe(false);
      expect(isNickname('An\na')).toBe(false);
    });
  });

  describe('parseServerMessage', () => {
    it('accepts room events', () => {
      for (const type of ['peer-joined', 'peer-disconnected', 'room-full']) {
        expect(parseServerMessage(json({ type }))).toEqual({ type });
      }
    });

    it('keeps only the type and sdp of an offer or answer', () => {
      expect(
        parseServerMessage(json({ type: 'offer', data: { type: 'offer', sdp: 'v=0', x: 1 } })),
      ).toEqual({ type: 'offer', data: { type: 'offer', sdp: 'v=0' } });
      expect(
        parseServerMessage(json({ type: 'answer', data: { type: 'answer', sdp: 'v=0' } })),
      ).toEqual({ type: 'answer', data: { type: 'answer', sdp: 'v=0' } });
    });

    it('accepts an ICE candidate with or without its line', () => {
      const candidate = { candidate: 'candidate:1', sdpMid: '0', sdpMLineIndex: 0 };
      expect(parseServerMessage(json({ type: 'ice-candidate', data: candidate }))).toEqual({
        type: 'ice-candidate',
        data: candidate,
      });
      expect(parseServerMessage(json({ type: 'ice-candidate', data: { candidate: '' } }))).toEqual({
        type: 'ice-candidate',
        data: { candidate: '', sdpMid: null, sdpMLineIndex: null },
      });
    });

    it('accepts the STUN and TURN servers the room sends', () => {
      const turn = {
        urls: ['turn:turn.cloudflare.com:3478?transport=udp', 'turns:turn.cloudflare.com:443'],
        username: 'user',
        credential: 'secret',
      };
      const data = { iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }, turn] };
      expect(parseServerMessage(json({ type: 'ice-servers', data }))).toEqual({
        type: 'ice-servers',
        data: [{ urls: ['stun:stun.cloudflare.com:3478'] }, turn],
      });
    });

    it('drops ICE servers off shape, foreign URLs or lists too long', () => {
      const turn = { urls: ['turn:turn.cloudflare.com:3478'], username: 'u', credential: 'c' };
      const dropped = [
        {},
        { iceServers: [] },
        { iceServers: [{ urls: [] }] },
        { iceServers: [{ urls: ['https://evil.test'] }] },
        { iceServers: [{ urls: ['stun:ok.test', 42] }] },
        { iceServers: [{ ...turn, credential: undefined }] },
        { iceServers: [{ ...turn, username: 7 }] },
        { iceServers: Array.from({ length: 9 }, () => turn) },
        { iceServers: [{ urls: Array.from({ length: 33 }, () => 'stun:ok.test') }] },
      ];
      for (const data of dropped) {
        expect(parseServerMessage(json({ type: 'ice-servers', data }))).toBeNull();
      }
    });

    it('drops anything else', () => {
      const dropped = [
        'not json',
        json(null),
        json({ type: 'hello' }),
        json({ type: 'offer' }),
        json({ type: 'offer', data: { type: 'answer', sdp: 'v=0' } }),
        json({ type: 'offer', data: { type: 'offer', sdp: 1 } }),
        json({ type: 'ice-candidate', data: { candidate: 1 } }),
        json({ type: 'ice-candidate', data: { candidate: 'c', sdpMLineIndex: '0' } }),
      ];
      for (const message of dropped) expect(parseServerMessage(message)).toBeNull();
      expect(parseServerMessage(new ArrayBuffer(4))).toBeNull();
    });
  });

  describe('parsePeerMessage', () => {
    it('accepts a hello with a valid nickname', () => {
      expect(parsePeerMessage(json({ type: 'hello', nickname: 'Ana' }))).toEqual({
        type: 'hello',
        nickname: 'Ana',
      });
    });

    it('drops other messages and bad nicknames', () => {
      expect(parsePeerMessage(json({ type: 'hello', nickname: 'a'.repeat(17) }))).toBeNull();
      expect(parsePeerMessage(json({ type: 'hello', nickname: 7 }))).toBeNull();
      expect(parsePeerMessage(json({ type: 'move', letter: 'A' }))).toBeNull();
      expect(parsePeerMessage('{')).toBeNull();
    });

    it('accepts a valid word with its hint and a guess from A to Z', () => {
      const word = { type: 'word', word: 'Guarda-chuva', hint: 'Rainy day' };
      expect(parsePeerMessage(json({ ...word, extra: 1 }))).toEqual(word);
      expect(parsePeerMessage(json({ type: 'guess', letter: 'Q' }))).toEqual({
        type: 'guess',
        letter: 'Q',
      });
    });

    it('drops a bad word, hint or letter', () => {
      const word = { type: 'word', word: 'casa', hint: '' };
      expect(parsePeerMessage(json({ ...word, word: 'casa1' }))).toBeNull();
      expect(parsePeerMessage(json({ ...word, word: 'a'.repeat(25) }))).toBeNull();
      expect(parsePeerMessage(json({ ...word, hint: 'a'.repeat(41) }))).toBeNull();
      expect(parsePeerMessage(json({ type: 'word', word: 'casa' }))).toBeNull();
      expect(parsePeerMessage(json({ type: 'guess', letter: 'a' }))).toBeNull();
      expect(parsePeerMessage(json({ type: 'guess', letter: 'AB' }))).toBeNull();
    });
  });
});
