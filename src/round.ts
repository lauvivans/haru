// The rules of a round, shared by solo and two players.
// See "Rules of a round" in docs/product/requirements.md.
export const MAX_MISSES = 7;

export const ALPHABET = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

export type Status = "playing" | "won" | "lost";

// fixed: a hyphen, shown from the start. missed: a letter revealed after a loss.
export type SlotState = "fixed" | "blank" | "shown" | "missed";

export interface Slot {
  at: number; // position in the word
  char: string;
  state: SlotState;
}

export interface Group {
  at: number;
  slots: Slot[];
}

// Accents and cedilla don't count when guessing: Ã is guessed as A and Ç as C
export function plain(char: string) {
  return char.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase();
}

function isLetter(char: string) {
  return /\p{L}/u.test(char);
}

export function roundOf(word: string, guesses: readonly string[]) {
  const upper = word.toUpperCase();
  const letters = new Set([...upper].filter(isLetter).map(plain));
  const misses = guesses.filter((g) => !letters.has(g)).length;
  const won = [...letters].every((l) => guesses.includes(l));
  const status: Status = won ? "won" : misses >= MAX_MISSES ? "lost" : "playing";

  function stateOf(char: string): SlotState {
    if (!isLetter(char)) return "fixed";
    if (guesses.includes(plain(char))) return "shown";
    return status === "lost" ? "missed" : "blank";
  }

  // One group per word, split on spaces
  let at = 0;
  const groups: Group[] = upper.split(" ").map((part) => ({
    at,
    slots: [...part].map((char) => ({ at: at++, char, state: stateOf(char) })),
  }));

  return { groups, misses, status, hit: (letter: string) => letters.has(letter) };
}

// The letter a key on the physical keyboard guesses, if any
export function letterOfKey(key: string): string | null {
  const letter = plain(key);
  return ALPHABET.includes(letter) ? letter : null;
}
