export { Room } from "./room";

// No 0, 1, I or O, so a code read aloud or typed from a phone is not misread.
// 32 symbols, so a random byte maps to one without bias.
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_LENGTH = 6;
const ROOM_PATH = new RegExp(`^/rooms/([${CODE_ALPHABET}]{${CODE_LENGTH}})$`, "i");

function newRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

// Static assets are served before this runs, so it only sees other requests.
export default {
  fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === "/rooms" && request.method === "POST") {
      return Response.json({ code: newRoomCode() });
    }

    const code = ROOM_PATH.exec(pathname)?.[1];
    if (code) {
      return env.ROOMS.getByName(code.toUpperCase()).fetch(request);
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
