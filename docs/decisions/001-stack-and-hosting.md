# 001 · Stack and hosting

- **Date:** 2026-11-07
- **Origin:** spike [#2](https://github.com/lauvivans/haru/issues/2)
- **Status:** proposed

## Question

Where do the Haru client and the signaling server run so the game costs as close to zero as possible, and which stack follows from that?

## Short answer

- **Cloudflare Workers for everything.** One Worker serves the client as static assets and handles signaling.
- **One Durable Object per room for signaling.** Players connect to the room's Durable Object over WebSocket. It relays offers, answers and ICE candidates, and it uses the WebSocket Hibernation API so an idle room costs nothing.
- **The client stays a Vite + React SPA**, built with the Cloudflare Vite plugin. React Router stays in library mode. Haru has no data to load on the server, so framework mode adds nothing.
- **ICE: Google's public STUN plus Cloudflare Realtime TURN.** The Worker creates short-lived TURN credentials for each room, so the TURN key never reaches the browser, as the Cloudflare docs require.
- **Leave the EC2.** The Fastify server in `server/` is replaced by the Worker, and Haru leaves the shared `t4g.micro`.

## Why

- **Cost.** Durable Objects are on the Workers Free plan (SQLite backend only). The free limits reset daily: 100,000 requests and 13,000 GB-s of duration. Opening a WebSocket counts as one request, and incoming messages count at 20 to 1. A game needs a few dozen signaling messages, so a few thousand games fit in a day. Requests to static assets are free and unlimited.
- **Idle is free.** With hibernation, an open but quiet WebSocket bills no duration. Haru is played now and then, so most of the time nothing runs.
- **TURN costs cents.** Cloudflare TURN costs $0.05 per GB sent from Cloudflare to the client, and is free only when used with the Realtime SFU, which Haru does not use. Game moves are a few bytes each, so even a game fully relayed through TURN uses far less than 1 MB.
- **Rooms fit Durable Objects.** Each room is one object with the two sockets inside it. Routing by room code replaces the global `peers` map of the current server, and a room ends when both players leave.
- **Signaling stays our own code.** The README explains how a signaling server works. Keeping one, small and on Workers, keeps that part of the project visible and under our control.
- **Same platform as Gaku.** Wrangler, the Cloudflare account and the deploy pipeline are already set up there.

## Options compared

| Option                                              | Cost per month       | Our own backend | Notes                                                                                   |
| --------------------------------------------------- | -------------------- | --------------- | --------------------------------------------------------------------------------------- |
| **Workers + Durable Objects (chosen)**              | $0                   | Yes, small      | Free daily limits; hibernation; client and signaling in one deploy                      |
| Fastify on the shared EC2 + client on Cloudflare    | Share of the EC2     | Yes             | Uses memory on the 1 GB `t4g.micro` that Yoko needs; Caddy and Docker upkeep |
| Trystero (Nostr, MQTT or BitTorrent relays)         | $0                   | No              | No server at all; discovery depends on public relays we don't control; its README recommends a TURN server for blocked networks |
| PeerJS cloud server                                 | $0                   | No              | The docs publish no quota or uptime for the cloud server                               |
| Firebase Realtime Database as signaling             | $0                   | No              | Spark plan: 100 simultaneous connections; adds the Firebase SDK and a Google project |
| Supabase Realtime as signaling                      | $0                   | No              | Free plan: 200 concurrent connections, 2 million messages per month; the project pauses after 7 days of low activity |
| P2PCF (signaling over Workers + R2)                 | $0                   | Yes, ready-made | Polling over R2 instead of WebSockets; the public worker is shared and under quota     |

Trystero is the strongest option without a backend. It stays the fallback if the Durable Object ever becomes a problem.

## TURN

Without TURN, players behind strict NATs (some mobile networks and corporate networks) can't connect at all. STUN alone is enough for most home networks.

| Option                                | Cost                                    | Notes                                               |
| ------------------------------------- | --------------------------------------- | --------------------------------------------------- |
| **Cloudflare Realtime TURN (chosen)** | $0.05 per GB after a 1,000 GB free tier | Credentials created by the Worker; same account     |
| Google public STUN only               | $0                                      | Fails behind symmetric NAT                          |
| Metered Open Relay                    | 20 GB per month free                    | Needs sign-up and an API key; no published SLA      |
| ExpressTURN                           | 1,000 GB per month free                 | No published uptime or SLA                          |
| coturn on the EC2                     | Share of the EC2                        | The setup the README describes; brings the EC2 back |

### Limits on TURN

Settled in [#59](https://github.com/lauvivans/haru/issues/59) and tightened in [#63](https://github.com/lauvivans/haru/issues/63). TURN is billed by usage, so the Worker keeps it bounded.

- **TTL of 15 minutes, refreshed.** A room creates credentials when two players meet. While both stay, a Durable Object alarm creates new ones every 10 minutes and sends them to the two players, and the client applies them with `RTCPeerConnection.setConfiguration()` ([Cloudflare docs](https://developers.cloudflare.com/realtime/turn/generate-credentials/)). Cloudflare disconnects a relayed connection shortly after its credential expires, so the 5 minutes left over cover a late alarm. When a player leaves, the refreshes stop.
- **Daily cap of 50.** A room only asks Cloudflare for credentials while the `TurnBudget` Durable Object has some left for the UTC day (`DAILY_CREDENTIALS_CAP` in `worker/turn.ts`). Every meeting and every refresh takes one, so a 30-minute game takes 3 and the cap covers about 15 such games a day, the expected use of the beta. Past the cap, a meeting gets no `ice-servers` message and the players try STUN only; a game already in progress gets no refresh, so a relayed one drops when its credentials expire.

### Turning TURN off by hand

1. Delete the secret on both Workers: `wrangler secret delete TURN_KEY_API_TOKEN` and `wrangler secret delete TURN_KEY_API_TOKEN --env staging`. Rooms then fail to create credentials and players connect with STUN only. Put the secret back with `wrangler secret put` to turn TURN on again.
2. Credentials already handed out keep working until they expire, at most 15 minutes later. To end one sooner, revoke it with `POST https://rtc.live.cloudflare.com/v1/turn/keys/<TURN key ID>/credentials/<username>/revoke` and the TURN key API token as a bearer token; Cloudflare answers 204. The Worker doesn't keep the usernames, so this needs the username from the `ice-servers` message a player received.

## Consequences

- `server/` is rewritten as a Worker with a Durable Object class. The message types (`offer`, `answer`, `ice-candidate`, `peer-disconnected`) stay, and peers join by room code instead of typing the other player's peer ID.
- The client connects to `wss://<haru domain>/rooms/<code>` on the same origin, so `VITE_SERVER_URL` goes away in production.
- The TURN key is a Worker secret. When two players meet in a room, the room sends both of them credentials that expire, before the offer starts the connection.
- The solo mode needs no network after the page loads.
- The README section on building coturn on EC2 stays as study notes, marked as not used in production.
- Haru doesn't go on the EC2. If the infra repo already has a container or Caddy route for it, they are removed.

## Domain and deploys

Settled on 2026-11-08 in [#15](https://github.com/lauvivans/haru/issues/15).

- **Production:** `haru.arualvivan.com`, a custom domain on the Worker `haru`, the same zone as Gaku. Production has no `workers.dev` or preview URL. Every push to `main` runs CI and deploys it (`production.yml`).
- **Staging:** the Worker `haru-staging` at its `workers.dev` URL. Every push to `develop` runs CI and deploys it (`staging.yml`). It has its own Durable Objects, so rooms on staging and production never mix.
- Both call `deploy.yml`, and a deploy never cancels another one on the same environment.
- The workflows read two repository secrets: `CLOUDFLARE_API_TOKEN` (an API token from the "Edit Cloudflare Workers" template, with the zone resource set to `arualvivan.com`) and `CLOUDFLARE_ACCOUNT_ID`.

## Open questions

- **Abuse limits.** A cap on rooms per IP, or none for the beta.

## Sources

Official pages, checked on 2026-11-07. The TURN FAQ, for the limits on TURN, on 2026-11-10.

- [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)
- [Workers static assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
- [Cloudflare Realtime TURN](https://developers.cloudflare.com/realtime/turn/), [TURN credentials](https://developers.cloudflare.com/realtime/turn/generate-credentials/) and [TURN FAQ](https://developers.cloudflare.com/realtime/turn/faq/)
- [Trystero](https://github.com/dmotz/trystero)
- [P2PCF](https://github.com/gfodor/p2pcf)
- [PeerJS docs](https://peerjs.com/docs)
- [Firebase Realtime Database limits](https://firebase.google.com/docs/database/usage/limits)
- [Supabase pricing](https://supabase.com/pricing)
- [Metered Open Relay](https://www.metered.ca/tools/openrelay/)
- [ExpressTURN](https://www.expressturn.com/)
