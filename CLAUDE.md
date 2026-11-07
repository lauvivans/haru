# Haru

Hangman game in the browser. Two players connect peer to peer with WebRTC (one picks the word, the other guesses), and there is a solo mode with a word list.

## Language

Everything in the repository and on GitHub is in English: code, docs, file names, issues, PRs, commits and reviews. The game UI offers English and Portuguese (`/pt-BR/`).

## Structure

- `client/`: the React app (Vite).
- `server/`: the signaling server (Fastify + WebSocket). It only helps two peers find each other; game moves go over the WebRTC data channel.
- `docs/decisions/`: one decision per file, numbered. Every spike ends with a file here.
- `docs/product/requirements.md`: what the game does and its rules.
- `docs/prototypes/`: HTML prototype, the visual reference for screens, tokens and the character.

## Visual changes

Change the prototype first, validate it, then implement it in the app. Haru is only a game, so the design system and the character stay small and simple.

## Stack and hosting

Pending the spike in issue #2. The goal is to spend as close to zero as possible.

## Workflow

- **Base branch:** `develop`. PRs target it. `main` is the default branch and holds production.
- **Branch name:** `<type>/kebab-case-name`.
- **Commits and PR title:** Conventional Commits.
- **PR body:** ends with `Closes #<issue>`, also on fixes made after QA.
- **Merge:** squash into `develop`. Releases go from a `release/<version>` branch, cut from `develop`, into `main` with a merge commit (never squash). Head branches are deleted on merge, so a PR must never come straight from `develop`.
- **After a release:** never rebase `develop`. If `main` got its own commits (hotfix), merge `main` back into `develop`.
- **Attribution:** no `Co-Authored-By` or "Generated with Claude Code" in commits and PRs.
- **Draft before creating:** show the full text of any issue or PR and only create it after approval.

## Issues and board

- **Issues:** use the templates in `.github/ISSUE_TEMPLATE/` (bug, feature, chore, design, spike). The type goes in the label, not in the title. Documentation counts as `chore`.
- **Board:** "Haru" (GitHub Project #8 of `lauvivans`). Status: Backlog → Ready → In progress → In review → In staging → Done.
  - When starting an issue, move it to **In progress**.
  - When opening the PR, move it to **In review**.
  - When the PR is merged into `develop`, move it to **In staging**.
  - If QA on staging fails, move it back to **In progress** and fix it in a new PR on the same issue.
  - The release to `main` closes the issue and moves it to **Done**. A problem found after that is a new bug issue that links the original.

## Security

The repo is public. Never commit `.env` values, keys, tokens, hostnames or IPs of servers, or cloud account IDs.
