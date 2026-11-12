# Prototype

The visual reference for Haru: screens, design tokens, the village and the character. A visual change goes here first, gets validated, and then moves to the app.

## Look

Medieval pixel art. A single wide village sits behind every screen, and each screen is a spot in it. When you change page, the camera slides to the new spot:

| Screen | Spot in the village |
| --- | --- |
| Landing, design system | Castle on the hill |
| Room | Tavern |
| How it works | Market and fountain |
| Solo and two-player game | Square, with the gallows |

The light theme is day. The dark theme is night, with the moon, stars, lit windows and lamp glow.

Haru, the character, is the one on the gallows. The player picks one of three looks for Haru (villager, wizard or knight) on the landing or before joining a room, and the browser remembers it. Haru reacts to every letter (idle, hit, miss, win, loss). Each miss adds one piece of the gallows: platform, post, beam, brace, rope, noose and, on the 7th, the trapdoor opens. A win takes the noose off.

## Pages

- `index.html`: the landing, which is also the home. Click Haru to see its reactions.
- `how-it-works.html`: the rules and a plain explainer of peer-to-peer, with a diagram.
- `solo.html`: a playable solo round with a sample of the word list, and the end of round.
- `room.html`: nickname, invite link, joining by link, room full and player left.
- `duo.html`: a two-player round: the picker types the word, the guesser plays, the picker watches, and the end of round with the score.
- `design-system.html`: colors, type, components, Haru's reactions and every stage of the gallows.

Every page has a day and night switch and an EN/PT switch. The dashed bar on `room.html` and `duo.html` switches between the states of a screen and is not part of the app.

## How it is built

- Plain HTML and CSS: tokens in `tokens.css`, styles in `base.css`. Every size and color comes from the tokens, including the pixel art palette (`--px-*`).
- `pixel.js` paints the village, the gallows and Haru with rectangles on small canvases, scaled up with `image-rendering: pixelated`. All the art is drawn in code; there are no image files.
- GSAP (from cdnjs) runs the motion: the camera, Haru's reactions and the gallows pieces falling into place. Without GSAP, or when the system asks for reduced motion, everything jumps to its final state.
- `haru.js` renders the header, the theme and language switches and runs a round. It is a plain script with no build, so the pages open straight from disk.
- The physical keyboard types letters on the game screens.

## In the app

`tokens.css` and `base.css` are copied to `src/styles/` (without the prototype-only parts), and `pixel.js` is ported to `src/pixel/` as TypeScript. A change made here gets copied there.
