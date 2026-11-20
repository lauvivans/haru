# 004 · Branching workflow

- **Date:** 2026-11-20
- **Origin:** spike [#93](https://github.com/lauvivans/haru/issues/93), after the first release ([0.1.0](https://github.com/lauvivans/haru/releases/tag/v0.1.0)) and the Dependabot setup
- **Status:** proposed
- **Supersedes:** the release branches of [decision 003](003-release-flow.md). Its version rule and the GitHub release notes stay.

## Question

Which branching workflow does Haru follow: the git flow it used until now (`develop` plus `release/<version>` branches into `main`) or a simpler model?

## Short answer

- **GitHub flow.** `main` is the only long-lived branch. Each change goes in a short-lived branch named `<type>/kebab-case-name`, opened as a pull request into `main` and squash-merged.
- **Staging is deployed from the pull request.** Every push to a pull request from this repository runs CI and deploys the branch to `haru-staging`. QA happens there, before the merge. There is one staging slot, so the last push wins.
- **Every merge deploys production.** A merge into `main` runs CI and deploys `haru`. Anything on `main` is live.
- **The pull request title picks the version.** When the merged title is a `feat`, a `fix`, a `perf` or a breaking change, the same workflow tags the next version with the rule from decision 003 and publishes the GitHub release with generated notes. `chore`, `docs`, `test`, `ci` and `refactor` merges deploy but don't tag.

## Why

Options compared: git flow (current), GitHub flow, trunk-based development and GitLab flow (environment branches).

- **GitHub treats only the default branch as the base.** Dependabot security updates "always use the default branch for the repository", even with `target-branch` set, and closing keywords such as `Closes #12` work only when the pull request targets the default branch. With `develop` as the base, a security fix skips the normal flow and has to be merged back by hand, and issues stay open until a release. With `main` as the only base, both work as GitHub intends.
- **The release steps are manual on top of automation.** Each release takes the "Cut release" workflow, an approval click for CI on the pull request opened by `GITHUB_TOKEN`, a merge commit and, after a fix on the release branch, a merge of `main` back into `develop`. Haru has one maintainer and small changes, so batching them into releases adds steps without adding a check that the pull request doesn't already have.
- **Staging still runs before production.** Workers version URLs would give each pull request its own preview, but they "are not generated for Workers that implement a Durable Object", and Haru's Worker implements `Room` and `TurnBudget`. Deploying the pull request branch to the existing `haru-staging` Worker keeps a real staging, with its own Durable Objects and secrets, and moves it before the merge.
- **Trunk-based development** needs feature flags for unfinished work and fits teams that merge many times a day. Haru's changes land whole in one pull request.
- **GitLab flow** keeps a `production` branch to sync with `main`. That is the same manual merge per release that this decision removes.

## Consequences

- `develop` is retired. It has no commits beyond 0.1.0, so nothing is left to release from it.
- `cut-release.yml` is deleted. `release.yml` runs on every push to `main`: CI, the production deploy, then the tag and the GitHub release when the commit subject calls for a version.
- `staging.yml` runs on pull requests into `main` and deploys the head branch to staging. It also takes `workflow_dispatch`, to deploy any branch by hand.
- Pull requests from Dependabot and from forks get no repository secrets: Dependabot runs "are treated as if they were opened from a repository fork" and "GitHub Actions secrets are not available". They skip the staging deploy. A maintainer runs the staging workflow on the branch by hand when a dependency update needs QA.
- `ci.yml` and `pr-title.yml` run on pull requests into `main` only. Dependabot drops `target-branch`.
- `Closes #<issue>` closes the issue when its pull request is merged. The board loses "In staging": QA happens while the issue is **In review**, and the merge moves it to **Done**.
- A failed QA is fixed by pushing to the same pull request. A problem found after the merge is a new bug issue.
- Changes can't be held back for a later release. Work that must ship together goes in one pull request.
- A wrong PR title tags a wrong version, or none. `pr-title.yml` already checks titles with commitlint.
- Repo settings: squash merge only.

## Sources

- [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow): branch, pull request, review, merge, delete the branch.
- [Dependabot options reference, `target-branch`](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference): security updates always use the default branch.
- [Linking a pull request to an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue): keywords are read only in pull requests into the default branch.
- [Troubleshooting Dependabot on GitHub Actions](https://docs.github.com/en/code-security/dependabot/troubleshooting-dependabot/troubleshooting-dependabot-on-github-actions): Dependabot runs get a read-only `GITHUB_TOKEN` and no Actions secrets.
- [Workers version URLs](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/): not generated for Workers that implement a Durable Object.
