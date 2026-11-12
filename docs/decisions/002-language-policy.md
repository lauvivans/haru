# 002 · Language policy

- **Date:** 2026-11-07
- **Origin:** first draft
- **Status:** proposed

## Question

Which language does the project use in the repository, on GitHub and in the game?

## Short answer

- English is the language of everything in the repository: code, comments, docs, decisions, file and folder names.
- English is also the language on GitHub: issues, PRs, commits and reviews.
- The game is in English by default and offers Portuguese, selected by a path prefix in the URL: `/` for English, `/pt-BR/` for Portuguese.

## Why

- It follows the same rule as Yoko and Gaku, so the projects read the same way.
- A path prefix keeps each language at a stable, shareable URL, which matters for room links sent to a friend.

## Consequences

- Every string on screen goes through i18n from the first screen.
- A room link keeps the language of the player who created it. The other player can switch it.
- The solo word list exists in both languages. In two-player mode the word is whatever the picker types, in any language.
