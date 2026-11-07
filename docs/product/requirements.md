# Product requirements

What Haru does and the rules the game follows. This is a first draft, so the open questions are listed at the end.

## General

- Haru is a hangman game in the browser, with two modes: **solo** and **two players**.
- There is no account and no sign-in. Haru stores nothing about the players on a server.
- The interface is in English and Portuguese (pt-BR), selected by the URL prefix: `/` for English, `/pt-BR/` for Portuguese. See [decision 002](../decisions/002-language-policy.md).
- Haru, the game's character, reacts to the game: happy on a hit, worried on a miss, and different on a win and on a loss.
- It works on a phone and on a computer. On a computer, the physical keyboard types letters too.

## Home

- Shows Haru, the game's name and two buttons: play solo and play with a friend.
- A language switch (EN / PT).

## Rules of a round

- The word is hidden as one blank per letter. Spaces and hyphens show from the start and are not guessed.
- The guesser picks one letter at a time from an on-screen keyboard (A to Z). A used letter can't be picked again.
- A letter that is in the word shows in every position it appears. A letter that isn't adds one part to the drawing.
- Accents and cedilla don't count when guessing: picking `A` reveals `A`, `Á`, `Â`, `Ã` and `À`, and picking `C` reveals `Ç`. The word shows with its accents.
- The guesser loses after 7 misses and wins when every letter is revealed.
- At the end, the word is shown in full, with a button to play again.

## Solo mode

- The game picks a random word from a built-in list in the interface language.
- Each word has a category shown as a hint (for example "Animal" or "Food").
- A word doesn't repeat until the list runs out in that browser.
- It works with no connection after the page loads.

## Two players

- One player creates a room and gets a link with a short room code to send to the other player. Opening the link joins the room.
- A room holds exactly two players. A third person who opens the link sees that the room is full.
- The player who created the room starts as the one who picks the word. Roles swap every round.
- The word has 2 to 24 characters: letters (accents and `Ç` allowed), spaces and hyphens. It is typed hidden, with a button to show it.
- The picker can add an optional hint, up to 40 characters.
- Both players see the same board: blanks, used letters and the drawing. Only the guesser picks letters.
- The room keeps the score of the session: rounds won by each player.
- If a player leaves or loses the connection, the other sees a message and can wait in the room or go back home.
- Game moves go directly between the two browsers (WebRTC). The server only helps them connect and keeps the room in memory while it is open. See [decision 001](../decisions/001-stack-and-hosting.md).

## Open questions

- **Number of misses.** 7 (the current drawing) or 6 (head, body, two arms, two legs).
- **Theme.** A dark theme next to the light one, or light only.
- **Player names.** Ask for a nickname to show in the score, or use "You" and "Friend".
- **Word list.** Size and categories of the solo list, and where the words come from.
