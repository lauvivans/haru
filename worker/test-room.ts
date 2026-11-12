import { runInDurableObject } from 'cloudflare:test';
import { env, exports } from 'cloudflare:workers';
import { expect, vi } from 'vitest';
import { DAILY_CREDENTIALS_CAP } from './turn';

const ORIGIN = 'https://haru.test';
export const ICE_SERVERS = { iceServers: [{ urls: ['stun:stun.cloudflare.com:3478'] }] };

export interface Player {
  socket: WebSocket;
  messages: unknown[];
  closeCode?: number;
  send: (message: unknown) => void;
}

const openSockets: WebSocket[] = [];

export function roomFetch(path: string, init?: RequestInit) {
  return exports.default.fetch(`${ORIGIN}${path}`, init);
}

export async function newRoom() {
  const response = await roomFetch('/rooms', { method: 'POST' });
  const { code } = await response.json<{ code: string }>();
  return code;
}

export async function join(code: string) {
  const response = await roomFetch(`/rooms/${code}`, { headers: { Upgrade: 'websocket' } });
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

export async function joinPair() {
  const code = await newRoom();
  const first = await join(code);
  const second = await join(code);
  await vi.waitFor(() => expect(first.messages).toEqual([{ type: 'peer-joined' }]));
  return { code, first, second };
}

// Every room calls Cloudflare TURN when two players meet. No test reaches the real API:
// it fails here unless a test answers with credentials.
export function turnAnswers(response: () => Response) {
  // The Response is made inside the call, since the room can't read one made by the test.
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async () => response());
}

export const turnFails = () => turnAnswers(() => new Response('unavailable', { status: 503 }));
export const turnCreates = () => turnAnswers(() => Response.json(ICE_SERVERS, { status: 201 }));

export const budget = () => env.TURN_BUDGET.getByName('daily');

export async function useUpDailyCredentials() {
  for (let i = 0; i < DAILY_CREDENTIALS_CAP; i++) await budget().take();
}

export async function resetRooms() {
  await runInDurableObject(budget(), (_, state) => state.storage.deleteAll());
  vi.spyOn(console, 'error').mockImplementation(() => {});
  turnFails();
}

export function closeRooms() {
  openSockets.splice(0).forEach((socket) => socket.close());
  vi.restoreAllMocks();
  vi.useRealTimers();
}
