# Haru

Hangman in the browser. Two players connect peer to peer with WebRTC: one picks the word, the other guesses, and they swap. There is also a solo mode with a word list. The game is in English and Portuguese (`/pt-BR/`).

Play it at [haru.arualvivan.com](https://haru.arualvivan.com).

## Architecture

Everything runs on one Cloudflare Worker ([decision 001](docs/decisions/001-stack-and-hosting.md)).

- **Client.** A Vite + React SPA, served by the Worker as static assets.
- **Signaling.** Each room is one Durable Object (`Room` in `worker/room.ts`). Both players open a WebSocket to `/rooms/<code>` on the same origin, and the room relays the offer, the answer and the ICE candidates between them. It takes at most two players and uses the WebSocket Hibernation API, so an idle room costs nothing.
- **Game moves.** After signaling, the word and the guesses go over the WebRTC data channel, straight between the two browsers. The Worker never sees them.
- **ICE.** Cloudflare's public STUN, plus Cloudflare Realtime TURN for networks where a direct connection fails. When two players meet, the room creates short-lived TURN credentials and sends them to both, so the TURN key stays a Worker secret. A second Durable Object (`TurnBudget` in `worker/turn.ts`) keeps a daily cap on them.
- **Solo.** Runs in the browser only and needs no network after the page loads.

`develop` deploys to staging and `main` deploys to production ([decision 003](docs/decisions/003-release-flow.md)).

## Running locally

You need the Node version in `.nvmrc`.

```sh
npm install
npm run dev
```

`npm run dev` starts the client and the Worker together through the Cloudflare Vite plugin. To test a room, open the invite link in a private window or another browser, so each player has their own saved nickname.

TURN is optional locally. Without it, Wrangler warns about the missing secrets, rooms get no TURN credentials and players connect with STUN only, which is enough on one machine. To use TURN, create a `.dev.vars` file (gitignored) with your Cloudflare TURN key:

```sh
TURN_KEY_ID=<TURN key ID>
TURN_KEY_API_TOKEN=<TURN key API token>
```

Other commands:

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm test`          | Vitest: Worker tests in workerd, app tests in jsdom |
| `npm run lint`      | ESLint                                              |
| `npm run typecheck` | Generates the Worker types and runs `tsc`           |
| `npm run format`    | Prettier                                            |
| `npm run build`     | Type check and production build                     |

## Docs

- [Product requirements](docs/product/requirements.md)
- [Decisions](docs/decisions/)
- [Engineering guidelines](docs/engineering-guidelines.md)
- [Prototype](docs/prototypes/), the visual reference for screens, tokens and the character
- [WebRTC study notes](docs/study-notes/webrtc.md): how WebRTC, signaling and TURN work, written while building the first version
