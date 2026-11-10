import { isObject } from '@/room';

// Enough for most home networks; TURN is for the strict ones (decision 001)
export const STUN_ONLY: RTCIceServer[] = [{ urls: 'stun:stun.cloudflare.com:3478' }];
// Cloudflare returns 2 servers with 7 URLs in total; anything far bigger is not ours
const MAX_SERVERS = 4;
const MAX_URLS = 10;
const ICE_URL = /^(stun|turns?):[\w.:?=-]{1,200}$/;

function parseServer(value: unknown): RTCIceServer | null {
  if (!isObject(value)) return null;
  const { urls, username, credential } = value;
  const list: unknown[] = Array.isArray(urls) ? urls : [urls];
  const valid = list.filter((url): url is string => typeof url === 'string' && ICE_URL.test(url));
  if (valid.length === 0 || valid.length !== list.length || valid.length > MAX_URLS) return null;

  if (username === undefined && credential === undefined) return { urls: valid };
  if (typeof username !== 'string' || typeof credential !== 'string') return null;
  return { urls: valid, username, credential };
}

// The response is checked like any outside data before it reaches RTCPeerConnection
export function parseIceServers(value: unknown): RTCIceServer[] | null {
  if (!isObject(value) || !Array.isArray(value.iceServers)) return null;
  const { iceServers } = value;
  if (iceServers.length === 0 || iceServers.length > MAX_SERVERS) return null;
  const servers = iceServers.map(parseServer);
  return servers.every((server): server is RTCIceServer => server !== null) ? servers : null;
}

// Without TURN credentials the game still connects with STUN alone
export async function fetchIceServers(): Promise<RTCIceServer[]> {
  try {
    const response = await fetch('/ice-servers');
    if (!response.ok) return STUN_ONLY;
    return parseIceServers(await response.json()) ?? STUN_ONLY;
  } catch {
    return STUN_ONLY;
  }
}
