import { evictDurableObject } from "cloudflare:test";
import { env, exports } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGIN = "https://haru.test";
const offer = { type: "offer", data: { type: "offer", sdp: "v=0 offer" } };
const answer = { type: "answer", data: { type: "answer", sdp: "v=0 answer" } };
const candidate = {
  type: "ice-candidate",
  data: { candidate: "candidate:1 1 udp 1 192.0.2.1 5000 typ host", sdpMid: "0" },
};

interface Player {
  socket: WebSocket;
  messages: unknown[];
  closeCode?: number;
  send: (message: unknown) => void;
}

const openSockets: WebSocket[] = [];

async function newRoom() {
  const response = await exports.default.fetch(`${ORIGIN}/rooms`, { method: "POST" });
  const { code } = await response.json<{ code: string }>();
  return code;
}

async function join(code: string) {
  const response = await exports.default.fetch(`${ORIGIN}/rooms/${code}`, {
    headers: { Upgrade: "websocket" },
  });
  const socket = response.webSocket;
  if (!socket) throw new Error(`No WebSocket, status ${response.status}`);

  const player: Player = {
    socket,
    messages: [],
    send: (message) => socket.send(JSON.stringify(message)),
  };
  socket.addEventListener("message", (event) => {
    if (typeof event.data === "string") player.messages.push(JSON.parse(event.data));
  });
  socket.addEventListener("close", (event) => {
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
  await vi.waitFor(() => expect(first.messages).toEqual([{ type: "peer-joined" }]));
  return { code, first, second };
}

afterEach(() => {
  openSockets.splice(0).forEach((socket) => socket.close());
  vi.restoreAllMocks();
});

describe("Room", () => {
  it("creates short room codes without look-alike characters", async () => {
    const code = await newRoom();
    expect(code).toMatch(/^[2-9A-HJ-NP-Z]{6}$/);
  });

  it("relays the offer, answer and ICE candidates between the two players", async () => {
    const { first, second } = await joinPair();

    first.send(offer);
    first.send(candidate);
    await vi.waitFor(() => expect(second.messages).toEqual([offer, candidate]));

    second.send(answer);
    second.send(candidate);
    await vi.waitFor(() =>
      expect(first.messages).toEqual([{ type: "peer-joined" }, answer, candidate]),
    );
  });

  it("joins the same room whatever the case of the code", async () => {
    const code = await newRoom();
    const first = await join(code);
    await join(code.toLowerCase());
    await vi.waitFor(() => expect(first.messages).toEqual([{ type: "peer-joined" }]));
  });

  it("tells a third player the room is full and closes their socket", async () => {
    const { code, first, second } = await joinPair();
    const third = await join(code);

    await vi.waitFor(() => expect(third.messages).toEqual([{ type: "room-full" }]));
    await vi.waitFor(() => expect(third.closeCode).toBe(1008));

    first.send(offer);
    await vi.waitFor(() => expect(second.messages).toEqual([offer]));
    expect(third.messages).toEqual([{ type: "room-full" }]);
  });

  it("tells the other player when one leaves and frees the seat", async () => {
    const { code, first, second } = await joinPair();

    second.socket.close(1000, "bye");
    await vi.waitFor(() =>
      expect(first.messages).toEqual([{ type: "peer-joined" }, { type: "peer-disconnected" }]),
    );

    await join(code);
    await vi.waitFor(() =>
      expect(first.messages).toEqual([
        { type: "peer-joined" },
        { type: "peer-disconnected" },
        { type: "peer-joined" },
      ]),
    );
  });

  it("drops messages that are not signaling", async () => {
    const { first, second } = await joinPair();

    first.socket.send("not json");
    first.send({ type: "guess", data: { letter: "a" } });
    first.send({ type: "offer" });
    first.send({ type: "offer", data: "v=0" });
    first.send({ type: "offer", data: { sdp: "x".repeat(20_000) } });
    first.socket.send(new Uint8Array([1, 2, 3]));
    first.send({ ...offer, nickname: "Haru" });

    await vi.waitFor(() => expect(second.messages).toEqual([offer]));
  });

  it("keeps relaying after the room hibernates", async () => {
    const { code, first, second } = await joinPair();

    await evictDurableObject(env.ROOMS.getByName(code));

    first.send(offer);
    await vi.waitFor(() => expect(second.messages).toEqual([offer]));
  });

  it("refuses requests that are not a WebSocket or not a room", async () => {
    const code = await newRoom();
    const plain = await exports.default.fetch(`${ORIGIN}/rooms/${code}`);
    expect(plain.status).toBe(426);

    for (const path of ["/rooms/ABC", "/rooms/OOOOOO", "/rooms/ABCDEF/x", "/anything"]) {
      const response = await exports.default.fetch(`${ORIGIN}${path}`, {
        headers: { Upgrade: "websocket" },
      });
      expect(response.status, path).toBe(404);
    }
  });
});
