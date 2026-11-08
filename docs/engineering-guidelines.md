# Engineering guidelines

Rules for writing and reviewing code in Haru. They apply to whoever implements a change and to whoever reviews the PR. The workflow (branches, commits, board) lives in `CLAUDE.md`.

Haru is only a game. Keep the code, the design system and the character small and simple.

## Principles

- Make the smallest change that fully solves the issue, plus the small cleanups described in [Scope of a PR](#scope-of-a-pr).
- No premature abstraction. Extract a component, hook or helper only when there is a second real use.
- Before creating something, look for what already exists in the codebase and in the dependencies.
- A new dependency needs a justification in the PR and a supply chain check (new packages in the lockfile, install scripts, `npm audit signatures`, publish dates, `npm audit`), reported in the review.
- Readable beats clever. Names describe what the thing is.

## Scope of a PR

A PR solves the issue it closes. Along the way, leave the code a bit better than you found it (the boy scout rule): fix small debts in the files the PR already touches, even if the issue doesn't mention them.

A cleanup fits in the PR when it:

- is in a file the PR already changes;
- is small, such as removing commented-out code, renaming a confusing variable, fixing a lint warning or a typo, or deleting an unused import;
- doesn't change behavior, or the change is covered by a test;
- doesn't hide the main change. A reviewer should still see what the PR is about.

List these cleanups in the PR description, under "Also cleaned up".

Anything bigger, or in files the PR doesn't touch, becomes an issue.

Lint and type errors in the files the PR touches are always fixed in the same PR.

## Comments

The default is no comment. If code needs a comment to explain what it does, rename or extract until it doesn't.

Write a comment only when the reason can't be read from the code:

- a workaround for a bug in a library or browser, with a link to it;
- a game rule that looks odd, with a link to the requirement or issue;
- an order of operations, timing or performance trade-off that matters (common in the canvas and GSAP code);
- a security or privacy constraint.

Never:

- restate what the code does;
- leave commented-out code. Git keeps the history;
- write a TODO without an issue. Use `// TODO(#123): what is left`;
- add authors, dates or change logs. Git has them;
- use a comment to name a magic value. Use a named constant.

Keep comments short, in English, next to the code they explain. When the code changes, update or delete the comment in the same PR.

Lint and type escapes always say why:

- `// eslint-disable-next-line <rule> -- <reason>`
- `// @ts-expect-error <reason>`, never `@ts-ignore`

## Security

- The repo is public. Never commit `.env` values, keys, tokens, hostnames or IPs of servers, or cloud account IDs.
- No `dangerouslySetInnerHTML` and no `eval`.
- Data from the other peer, the signaling socket, the URL and `localStorage` is untrusted. Check its shape and limits (type, length, allowed characters) before using it, and drop what doesn't match.
- The `Room` Durable Object only relays signaling between two peers. It doesn't store or log the word, the guesses or the nicknames.
- Before adding a dependency, check that it is maintained and that its license is compatible.

## Structure

One Cloudflare Worker project at the repo root.

- `src/`: the React app (Vite SPA), served by the Worker as static assets. Imports use the `@/` alias.
  - `src/components/ui/`: generic components that know nothing about the game (button, panel, field).
  - `src/components/game/`: every other component.
  - One folder per component, named after it: `src/components/game/Haru/Haru.tsx`. Its test and styles sit in the same folder.
  - `src/styles/`: `tokens.css` and `base.css`, copied from the prototype.
  - `src/pixel/`: the pixel art (village, Haru, gallows), drawn on canvas and animated with GSAP. React wrappers in `src/components/game/` only mount it and pass props.
- `worker/`: the Worker entry and the `Room` Durable Object, one per room, for signaling. It only helps two peers find each other; game moves go over the WebRTC data channel.
- `wrangler.jsonc`: Worker config (assets, Durable Object binding `ROOMS`). `npm run cf-typegen` generates `worker-configuration.d.ts`, which is not committed.
- `docs/decisions/`: one decision per file, numbered. Every spike ends with a file here.
- `docs/product/requirements.md`: what the game does and its rules.
- `docs/prototypes/`: HTML prototype, the visual reference for screens, tokens and the character.

Stack and hosting follow decision 001: client and signaling on one Cloudflare Worker, one Durable Object per room, STUN plus Cloudflare TURN. The goal is to spend as close to zero as possible, so a change that adds a paid service needs a decision first.

## File size

| File                                        | Max lines |
| ------------------------------------------- | --------- |
| Component (`.tsx`)                          | 300       |
| Pixel art module (`src/pixel/`)             | 300       |
| Hook, helper or Worker module               | 150       |
| Component CSS                               | 150       |
| Test (`.spec.ts`, `.spec.tsx`)              | 300       |
| Types, word lists, `tokens.css`, `base.css` | no limit  |

- Lines are counted as the file is, blank lines included.
- A file that goes past its limit is split by responsibility: a subcomponent, a hook, a helper or another module. If splitting makes it worse, justify it in the PR.
- A file already over its limit should not grow. Splitting it is welcome, but only when the PR is already changing that part of the file.
- The limit is checked in review. It is a trigger to look at responsibilities, not a goal. A long file that does one thing well beats several tiny files that only add indirection.
- `tokens.css` and `base.css` have no limit because they are copies of the prototype.
- Why these numbers: components and tests use the default of ESLint's [`max-lines`](https://eslint.org/docs/latest/rules/max-lines), 300. A component mixes markup, state and handlers, and a pixel module draws a whole scene, so they get more room than a hook or helper, which should do one thing. _Clean Code_ (Robert C. Martin, ch. 5) shows large systems built from files typically around 200 lines, with an upper bound of 500.

## React and TypeScript

- Components are functions. Props are typed with `interface <Component>Props`.
- No `any`, and no `as` to silence the compiler. Outside data goes through a type guard first (see [Security](#security)).
- `useEffect` is only for syncing with something external: the canvas, GSAP, WebRTC, the signaling socket, `matchMedia`. Each effect cleans up what it starts (listeners, tweens, connections).
- Derived values are computed during render, not kept in state. For example, the misses come from the guesses and the word.
- Lists use a stable id as `key`, never the index.

## Styles

- Every color, size, radius, shadow and breakpoint comes from `src/styles/tokens.css`. No loose values. If no token fits, propose a new one first.
- `tokens.css` mirrors `docs/prototypes/tokens.css`. A new or changed token goes to the prototype first, gets validated there, and then is copied.
- A screen is implemented as it is in the prototype. If the implementation needs a visual change, the prototype changes first.
- Class names follow the prototype: `block__element--modifier`, such as `player__role` or `key--hit`.
- Mobile first: the base styles are the phone layout. Larger screens use `min-width` media queries, never `max-width`. CSS variables don't work in media queries, so breakpoints are written as numbers and must be one of the two in `tokens.css` (600px and 960px).
- Space siblings with `gap` on the parent, not with margins on each child.

## Accessibility

- Use the right native element: `button` for actions, `a` for navigation.
- An icon-only button needs an `aria-label`. Every field has an associated label.
- Everything works with the keyboard, with a visible focus. On a computer, the physical keyboard types letters too.
- Reduced motion is respected: animations go through the helpers in `src/pixel/core.ts`, which jump to the end state when `prefers-reduced-motion` is on.
- The canvas art is decoration. What matters for the game (the word, the misses, the result) is also in text.

## Tests

`npm test` runs Vitest. Worker tests (`worker/*.spec.ts`) run inside workerd through `@cloudflare/vitest-plugin`; the app tests come with #24 and CI with #14. Before implementing, map the most important cases: main behavior, edge cases and critical flows.

What needs a test:

- Round rules: hits, misses, the 7-miss limit, win and loss, accents and cedilla, a letter already used.
- Data from the peer and the signaling socket: valid messages are accepted, anything else is dropped.
- The `Room` Durable Object: two peers join, a third is refused, a leaving peer is reported.
- A fix starts with a test that reproduces the bug.

What doesn't: the pixel art drawing and the GSAP animations. Check those in the browser.

How:

- Test behavior, not implementation. Query by what the user sees (`getByRole`, `getByText`) and interact like they would.
- The test sits next to the code, in `<file>.spec.ts` or `<Component>.spec.tsx`.
- Mock only the edges: WebRTC, the signaling socket, `localStorage`, `matchMedia`, the canvas. Don't mock child components, contexts or internal helpers.
- Reset mocks between tests (`vi.restoreAllMocks()` in `afterEach`).
- One top-level `describe` naming what is under test. Nested `describe` blocks only to separate contexts.
- Before opening the PR, `npm run typecheck`, the tests and `npm run build` pass, and lint passes on the files the PR touches (`npx eslint <files>`). The whole repo has to pass `npm run lint` once the code left from the Fastify version (`src/context/`, `src/hooks/useChannel.ts`, the old `Welcome` and `Hangman` screens) is replaced.

## Reviewing a PR

What to check, in this order:

1. The PR solves the issue it closes. Anything else is a small cleanup listed in the description (see [Scope of a PR](#scope-of-a-pr)).
2. Bugs and edge cases.
3. Tests cover the new or fixed behavior.
4. Security, and the supply chain check if dependencies changed.
5. The rules in this document.
6. What can be removed or simplified.

How to comment:

- Tag each comment as **Blocking**, **Suggestion** (optional improvement) or **Question**.
- **Blocking:** a bug, a security flaw, new behavior without a test, a lint or type error in a touched file, a file over its size limit without justification, a loose style value, a visual change missing from the prototype, a code comment that contradicts the code, commented-out code, a TODO without an issue, a lint or type escape without a reason, a cleanup that changes behavior without a test or hides the main change, or any other broken rule from this document.
- **Suggestion:** a quick cleanup in a touched file, or a comment that only restates the code. Not doing a cleanup never blocks a PR.
- State the problem, why it matters and a concrete fix.
- Anything bigger than a quick cleanup, or outside the touched files, becomes a suggested issue, not a blocker.

Closing issue checklist:

- Tick the checklist items of the issue the PR closes that the PR delivers. Never untick an item.
- An item left unchecked without a reason in the PR is **Blocking**.
