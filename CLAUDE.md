# Haru

Hangman game in the browser. Two players connect peer to peer with WebRTC (one picks the word, the other guesses), and there is a solo mode with a word list.

## Language

Everything in the repository and on GitHub is in English: code, docs, file names, issues, PRs, commits and reviews. The game UI offers English and Portuguese (`/pt-BR/`).

## Engineering guidelines

Follow the guidelines below when implementing and when reviewing PRs. They are imported from `docs/engineering-guidelines.md`, so edit them there.

@docs/engineering-guidelines.md

## Commands

- `npm run dev`: client and Worker together through the Cloudflare Vite plugin. Node version is in `.nvmrc`.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- `npm run cf-typegen`: generates `worker-configuration.d.ts` (not committed).

## Workflow

- **GitHub flow** ([decision 004](docs/decisions/004-branching-workflow.md)): `main` is the only long-lived branch and the default. Every change goes in a short-lived branch, opened as a PR into `main`.
- **Branch name:** `<type>/kebab-case-name`.
- **Commits and PR title:** Conventional Commits. The squash commit takes the PR title, and the release workflow reads it to pick the version: `fix` and `perf` are a patch, `feat` a minor, `!` or a `BREAKING CHANGE` footer a major (a minor while `0.x`). `chore`, `docs`, `test`, `ci` and `refactor` don't tag a version.
- **PR body:** ends with `Closes #<issue>`, also on fixes made after QA.
- **Staging:** every push to a PR deploys it, merged with `main`, to `haru-staging` (`staging.yml`). There is one staging slot, so the last push wins. Dependabot and fork PRs skip it; run `gh workflow run staging.yml --ref <branch>` when one needs QA.
- **Merge:** squash into `main`. Every merge runs CI and deploys production, then tags `v<version>` and publishes the GitHub release when the title calls for a version (`release.yml`). Changes that must ship together go in the same PR. Head branches are deleted on merge.
- **Attribution:** no `Co-Authored-By` or "Generated with Claude Code" in commits and PRs.
- **Draft before creating:** show the full text of any issue and only create it after approval. PRs are opened directly; say when one is open, with its link. They are reviewed on GitHub before merge.

## Issues and board

- **Issues:** use the templates in `.github/ISSUE_TEMPLATE/` (bug, feature, chore, design, spike). The type goes in the label, not in the title. Documentation counts as `chore`.
- **Board:** "Haru" (GitHub Project #8 of `lauvivans`). Status: Backlog → Ready → In progress → In review → Done.
  - When starting an issue, move it to **In progress**.
  - When opening the PR, move it to **In review**. QA happens on staging while the PR is open.
  - If QA fails, move it back to **In progress** and push the fix to the same PR.
  - Merging the PR closes the issue through `Closes #<issue>` and moves it to **Done**. A problem found after that is a new bug issue that links the original.
