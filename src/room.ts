import { isHint, isWord, type Move } from '@/duo';
import { ALPHABET } from '@/round';
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
  | { type: 'ice-candidate'; data: RTCIceCandidateInit }
  | { type: 'ice-servers'; data: RTCIceServer[] };

export type PeerMessage = { type: 'hello'; nickname: string } | Move;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// Cloudflare sends 2 servers with 7 URLs. Room to grow, but a huge list is not ours
const MAX_ICE_SERVERS = 8;
const MAX_ICE_URLS = 32;
const ICE_URL = /^(stun|turns?):[\w.:?=-]{1,200}$/;

function parseIceServer(value: unknown): RTCIceServer | null {
  if (!isObject(value)) return null;
  const { urls, username, credential } = value;
  const list: unknown[] = Array.isArray(urls) ? urls : [urls];
  const valid = list.filter((url): url is string => typeof url === 'string' && ICE_URL.test(url));
  if (valid.length === 0 || valid.length !== list.length || valid.length > MAX_ICE_URLS) {
    return null;
  }
  if (username === undefined && credential === undefined) return { urls: valid };
  if (typeof username !== 'string' || typeof credential !== 'string') return null;
  return { urls: valid, username, credential };
}

function parseIceServers(value: Record<string, unknown>): RTCIceServer[] | null {
  const { iceServers } = value;
  if (!Array.isArray(iceServers) || iceServers.length === 0) return null;
  if (iceServers.length > MAX_ICE_SERVERS) return null;
  const servers = iceServers.map(parseIceServer);
  return servers.every((server): server is RTCIceServer => server !== null) ? servers : null;
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
  if (type === 'ice-servers') {
    const servers = parseIceServers(data);
    return servers && { type, data: servers };
  }
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
  if (!value) return null;
  const { type, nickname: name, word, hint, letter } = value;

  if (type === 'hello' && typeof name === 'string' && isNickname(name)) {
    return { type, nickname: name };
  }
  if (type === 'word' && typeof word === 'string' && typeof hint === 'string') {
    return isWord(word) && isHint(hint) ? { type, word, hint } : null;
  }
  if (type === 'guess' && typeof letter === 'string' && ALPHABET.includes(letter)) {
    return { type, letter };
  }
  return null;
}
