// // signaling-server.js — a minimal WebRTC signaling server (Node + ws).
// // It relays signaling messages between the two peers in one room, and tells each
// // peer whether it is the "polite" one (for perfect negotiation). It NEVER sees your
// // audio/video — media flows peer-to-peer once ICE finishes.
// import { WebSocketServer } from "ws";
// const PORT = 8080;
// const wss = new WebSocketServer({ port: PORT });
// const room = new Set() as any; // one room, at most two peers — enough to prove the concept
// wss.on("connection", (socket) => {
//   if (room.size >= 2) {
//     socket.close(1013, "room full"); // 1013 = "try again later"
//     return;
//   }
//   // First peer in is "impolite", second is "polite" (perfect-negotiation tie-break).
//   const polite = room.size === 1;
//   room.add(socket);
//   socket.send(JSON.stringify({ type: "welcome", polite }));
//   console.log(`peer connected as ${polite ? "polite" : "impolite"} (${room.size}/2)`);
//   // Once BOTH peers are present, tell the peer that was already waiting it can start
//   // negotiating. Without this, the first peer would offer into an empty room (that offer
//   // is lost) and then ignore the second peer's offer as a "collision" — a deadlock.
//   if (room.size === 2) {
//     for (const peer of room) {
//       if (peer !== socket && peer.readyState === peer.OPEN) {
//         peer.send(JSON.stringify({ type: "ready" }));
//       }
//     }
//   }
//   // Relay every other message to the OTHER peer. The server doesn't parse the SDP or
//   // ICE inside — offer, answer, or candidate, it just forwards the bytes.
//   socket.on("message", (data, isBinary) => {
//     for (const peer of room) {
//       if (peer !== socket && peer.readyState === peer.OPEN) {
//         peer.send(data, { binary: isBinary });
//       }
//     }
//   });
//   socket.on("close", () => {
//     room.delete(socket);
//     console.log(`peer disconnected (${room.size}/2)`);
//   });
// });
// console.log(`Signaling server listening on ws://localhost:${PORT}`);
import Fastify from "fastify";
const fastify = Fastify({
    logger: true,
});
fastify.get("/", function (request, reply) {
    reply.send({ hello: "world" });
});
fastify.listen({ port: 3000 }, function (err, address) {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
});
//# sourceMappingURL=index.js.map