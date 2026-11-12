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

- **Base branch:** `develop`. PRs target it. `main` is the default branch and holds production.
- **Branch name:** `<type>/kebab-case-name`.
- **Commits and PR title:** Conventional Commits.
- **PR body:** ends with `Closes #<issue>`, also on fixes made after QA.
- **Merge:** squash into `develop`. Releases go from a `release/<version>` branch, cut from `develop`, into `main` with a merge commit (never squash). Head branches are deleted on merge, so a PR must never come straight from `develop`.
- **Release** ([decision 003](docs/decisions/003-release-flow.md)):
  1. Run the "Cut release" workflow on `develop` (`gh workflow run cut-release.yml --ref develop`, optional `-f version=X.Y.Z`). It computes the version from the commits since the last `v*` tag, pushes `release/<version>` and opens `chore(release): <version>` to `main` with a `Closes` line per issue.
  2. CI on that PR waits for approval, because `GITHUB_TOKEN` opened it. Approve the run on GitHub.
  3. A fix found in QA goes in a PR to `release/<version>`.
  4. Merge the release PR with a merge commit. The release workflow runs CI, creates the tag `v<version>` and the GitHub release with generated notes, and deploys production.
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
