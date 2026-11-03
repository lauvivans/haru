import WebSocket from "@fastify/websocket";
import Fastify from "fastify";
import { v4 as uuidv4 } from "uuid";

const fastify = Fastify({ logger: true });

await fastify.register(WebSocket);

const peers = new Map();
const peerConnections = new Map();

function generatePeerId() {
  return `peer-${uuidv4().substring(0, 8)}`;
}

fastify.get("/", { websocket: true }, (socket, req) => {
  const peerId = generatePeerId();

  fastify.log.info(`New peer connected: ${peerId}`);

  peers.set(peerId, {
    socket,
    connectedAt: new Date(),
    remoteAddress: req.ip,
  });

  socket.send(
    JSON.stringify({
      type: "register",
      peerId,
      message: "You are now registered",
    }),
  );

  socket.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleSignalingMessage(peerId, message);
    } catch (error) {
      fastify.log.error(`Error parsing message from ${peerId}:`, error as any);
      socket.send(
        JSON.stringify({
          type: "error",
          message: "Invalid message format",
        }),
      );
    }
  });

  socket.on("close", () => {
    fastify.log.info(`Peer disconnected: ${peerId}`);
    peers.delete(peerId);

    const targetPeerId = peerConnections.get(peerId);
    if (targetPeerId && peers.has(targetPeerId)) {
      const targetPeer = peers.get(targetPeerId);
      targetPeer.socket.send(
        JSON.stringify({
          type: "peer-disconnected",
          peerId,
        }),
      );
      peerConnections.delete(targetPeerId);
    }
    peerConnections.delete(peerId);
  });

  socket.on("error", (error) => {
    fastify.log.error(`Socket error for ${peerId}:`, error as any);
  });
});

function handleSignalingMessage(fromPeerId: any, message: any) {
  const { type, targetPeerId, data } = message;

  fastify.log.debug(`Message from ${fromPeerId} to ${targetPeerId}: ${type}`);

  if (!peers.has(targetPeerId)) {
    const senderSocket = peers.get(fromPeerId)?.socket;
    if (senderSocket) {
      senderSocket.send(
        JSON.stringify({
          type: "error",
          message: `Target peer ${targetPeerId} not found or disconnected`,
        }),
      );
    }
    return;
  }

  const targetPeer = peers.get(targetPeerId);

  switch (type) {
    case "offer":
      peerConnections.set(fromPeerId, targetPeerId);
      peerConnections.set(targetPeerId, fromPeerId);

      targetPeer.socket.send(
        JSON.stringify({
          type: "offer",
          fromPeerId,
          data,
        }),
      );

      fastify.log.info(`Relayed offer from ${fromPeerId} to ${targetPeerId}`);
      break;

    case "answer":
      targetPeer.socket.send(
        JSON.stringify({
          type: "answer",
          fromPeerId,
          data,
        }),
      );

      fastify.log.info(`Relayed answer from ${fromPeerId} to ${targetPeerId}`);
      break;

    case "ice-candidate":
      targetPeer.socket.send(
        JSON.stringify({
          type: "ice-candidate",
          fromPeerId,
          data,
        }),
      );
      break;

    case "ping":
      const senderSocket = peers.get(fromPeerId)?.socket;
      if (senderSocket) {
        senderSocket.send(
          JSON.stringify({
            type: "pong",
          }),
        );
      }
      break;

    default:
      fastify.log.warn(`Unknown message type: ${type}`);
  }
}
fastify.get("/health", async (request, reply) => {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    connectedPeers: peers.size,
  };
});

fastify.get("/stats", async (request, reply) => {
  const peersList = Array.from(peers.entries()).map(([peerId, peer]) => ({
    peerId,
    connectedAt: peer.connectedAt,
    remoteAddress: peer.remoteAddress,
    connectedTo: peerConnections.get(peerId) || null,
  }));

  return {
    totalPeers: peers.size,
    peers: peersList,
    timestamp: new Date().toISOString(),
  };
});

process.on("SIGINT", async () => {
  fastify.log.info("Shutting down gracefully...");

  for (const [peerId, peer] of peers) {
    peer.socket.close(1000, "Server shutting down");
  }

  await fastify.close();
  process.exit(0);
});

const start = async () => {
  try {
    const PORT: any = process.env.PORT || 3000;
    const HOST = process.env.HOST || "localhost";

    await fastify.listen({ port: PORT, host: HOST });
    fastify.log.info(`Server running at ws://${HOST}:${PORT}/ws`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
