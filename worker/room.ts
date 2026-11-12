import { DurableObject } from 'cloudflare:workers';
import {
  CREDENTIALS_REFRESH_MS,
  CREDENTIALS_RETRY_MS,
  CREDENTIALS_TTL_SECONDS,
  createIceServers,
} from './turn';

const CREDENTIALS_EXPIRE_AT = 'credentials-expire-at';

const MAX_PLAYERS = 2;
// An offer with every ICE candidate inlined is a few KB. Anything far bigger is not signaling.
const MAX_MESSAGE_LENGTH = 16_384;
const RELAYED_TYPES = new Set(['offer', 'answer', 'ice-candidate']);

interface Signal {
  type: string;
  data: object;
}

function isSignal(value: unknown): value is Signal {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    typeof value.type === 'string' &&
    RELAYED_TYPES.has(value.type) &&
    'data' in value &&
    typeof value.data === 'object' &&
    value.data !== null
  );
}

function parseSignal(message: string | ArrayBuffer): Signal | null {
  if (typeof message !== 'string' || message.length > MAX_MESSAGE_LENGTH) {
    return null;
  }
  try {
    const value: unknown = JSON.parse(message);
    return isSignal(value) ? { type: value.type, data: value.data } : null;
  } catch {
    return null;
  }
}

function send(socket: WebSocket, message: object) {
  socket.send(JSON.stringify(message));
}

// One object per room code. It relays signaling between the two players, hands them
// TURN credentials and keeps nothing about the game (see the Security section of the engineering guidelines).
// Sockets go through ctx.acceptWebSocket so an idle room hibernates and bills no duration.
export class Room extends DurableObject<Env> {
  async fetch(request: Request) {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected a WebSocket', { status: 426 });
    }

    const [client, server] = Object.values(new WebSocketPair());
    const players = this.openSockets();

    if (players.length >= MAX_PLAYERS) {
      server.accept();
      send(server, { type: 'room-full' });
      server.close(1008, 'Room full');
    } else {
      this.ctx.acceptWebSocket(server);
      if (players.length > 0) await this.meet(server);
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(socket: WebSocket, message: string | ArrayBuffer) {
    const signal = parseSignal(message);
    if (!signal) return;
    this.othersThan(socket).forEach((other) => send(other, signal));
  }

  // The runtime replies to the close frame itself (web_socket_auto_reply_to_close).
  webSocketClose(socket: WebSocket) {
    this.leave(socket);
  }

  webSocketError(socket: WebSocket) {
    this.leave(socket);
  }

  // Credentials expire, so a game that goes on gets new ones before they do
  async alarm() {
    if (this.openSockets().length === MAX_PLAYERS) await this.sendIceServers();
  }

  // Both players get credentials before the offer starts the connection
  private async meet(newcomer: WebSocket) {
    this.ctx.storage.kv.delete(CREDENTIALS_EXPIRE_AT);
    await this.sendIceServers();
    this.othersThan(newcomer).forEach((other) => send(other, { type: 'peer-joined' }));
  }

  // TURN credentials only go to players who share a room, so there is no open
  // endpoint to mint them. Past the daily cap the players keep what they have.
  // A refresh that fails is tried again while the players' credentials still work (#66).
  private async sendIceServers() {
    const result = await createIceServers(this.env);
    const now = Date.now();
    if (result.status === 'created') {
      const message = { type: 'ice-servers', data: result.iceServers };
      this.openSockets().forEach((player) => send(player, message));
      this.ctx.storage.kv.put(CREDENTIALS_EXPIRE_AT, now + CREDENTIALS_TTL_SECONDS * 1000);
      await this.ctx.storage.setAlarm(now + CREDENTIALS_REFRESH_MS);
    } else if (result.status === 'failed') {
      const expireAt = this.ctx.storage.kv.get<number>(CREDENTIALS_EXPIRE_AT) ?? 0;
      if (now + CREDENTIALS_RETRY_MS < expireAt) {
        await this.ctx.storage.setAlarm(now + CREDENTIALS_RETRY_MS);
      }
    }
  }

  private leave(socket: WebSocket) {
    this.othersThan(socket).forEach((other) => send(other, { type: 'peer-disconnected' }));
  }

  private openSockets() {
    return this.ctx.getWebSockets().filter((socket) => socket.readyState === WebSocket.OPEN);
  }

  private othersThan(socket: WebSocket) {
    return this.openSockets().filter((other) => other !== socket);
  }
}
