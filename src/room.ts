import { stored } from '@/stored';

// Same alphabet and length as the codes the Worker hands out (worker/index.ts)
const ROOM_CODE = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/i;
// 1 to 16 characters (code points), no control characters, no spaces around it
const NICKNAME = /^[^\p{C}]{1,16}$/u;

export function isRoomCode(value: string): boolean {
  return ROOM_CODE.test(value);
}

export function isNickname(value: string): value is string {
  return NICKNAME.test(value) && value.trim() === value;
}

export const nickname = stored<string>('haru-nickname', () => '', isNickname);

export type ServerMessage =
  | { type: 'peer-joined' | 'peer-disconnected' | 'room-full' }
  | { type: 'offer' | 'answer'; data: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; data: RTCIceCandidateInit };

export type PeerMessage = { type: 'hello'; nickname: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseJson(message: unknown): Record<string, unknown> | null {
  if (typeof message !== 'string') return null;
  try {
    const value: unknown = JSON.parse(message);
    return isObject(value) ? value : null;
  } catch {
    return null;
  }
}

// Messages from the signaling socket are untrusted: anything off shape is dropped
export function parseServerMessage(message: unknown): ServerMessage | null {
  const value = parseJson(message);
  if (!value) return null;
  const { type, data } = value;

  if (type === 'peer-joined' || type === 'peer-disconnected' || type === 'room-full') {
    return { type };
  }
  if (!isObject(data)) return null;
  if ((type === 'offer' || type === 'answer') && data.type === type) {
    return typeof data.sdp === 'string' ? { type, data: { type, sdp: data.sdp } } : null;
  }
  if (type === 'ice-candidate') {
    const { candidate, sdpMid = null, sdpMLineIndex = null } = data;
    if (
      typeof candidate === 'string' &&
      (sdpMid === null || typeof sdpMid === 'string') &&
      (sdpMLineIndex === null || typeof sdpMLineIndex === 'number')
    ) {
      return { type, data: { candidate, sdpMid, sdpMLineIndex } };
    }
  }
  return null;
}

// Messages from the other player are untrusted too
export function parsePeerMessage(message: unknown): PeerMessage | null {
  const value = parseJson(message);
  if (value?.type === 'hello' && typeof value.nickname === 'string' && isNickname(value.nickname)) {
    return { type: 'hello', nickname: value.nickname };
  }
  return null;
}
