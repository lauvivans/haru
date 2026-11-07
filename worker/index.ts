import { DurableObject } from "cloudflare:workers";

// One object per room. Signaling lands here in #22.
export class Room extends DurableObject<Env> {}

// Static assets are served before this runs, so it only sees other requests.
export default {
  fetch() {
    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
