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
      expect(parsePeerMessage(json({ type: 'guess', letter: 'A' }))).toBeNull();
      expect(parsePeerMessage('{')).toBeNull();
    });
  });
});
