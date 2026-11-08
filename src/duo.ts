// Two-player rounds. See "Two players" in docs/product/requirements.md.
import { ALPHABET, plain, roundOf } from '@/round';

const WORD_MIN = 2;
const WORD_MAX = 24;
// No control characters, no spaces around it
const HINT = /^[^\p{C}]{0,40}$/u;

export interface DuoRound {
  word: string;
  hint: string;
  guesses: string[];
}

export type Move = { type: 'word'; word: string; hint: string } | { type: 'guess'; letter: string };

export function tidyWord(value: string) {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ');
}

function isSeparator(char: string) {
  return char === ' ' || char === '-';
}

// Every letter must be guessed with one key from A to Z, so Ł or ß is refused
export function isWord(value: string) {
  const chars = [...value];
  return (
    value === tidyWord(value) &&
    chars.length >= WORD_MIN &&
    chars.length <= WORD_MAX &&
    chars.every((char) => isSeparator(char) || ALPHABET.includes(plain(char))) &&
    !chars.every(isSeparator)
  );
}

export function isHint(value: string) {
  return HINT.test(value) && value.trim() === value;
}

// The room creator picks the word in the first round, then the roles swap
export function picksRound(index: number, creator: boolean) {
  return (index % 2 === 0) === creator;
}

export function statusOf(round: DuoRound) {
  return roundOf(round.word, round.guesses).status;
}

// Applies a move from this player (byMe) or the other one. A move out of turn is dropped.
export function play(rounds: DuoRound[], move: Move, byMe: boolean, creator: boolean) {
  const current = rounds.at(-1);
  const playing = current !== undefined && statusOf(current) === 'playing';

  if (move.type === 'word') {
    if (playing || picksRound(rounds.length, creator) !== byMe) return rounds;
    return [...rounds, { word: move.word, hint: move.hint, guesses: [] }];
  }
  if (
    !playing ||
    picksRound(rounds.length - 1, creator) === byMe ||
    current.guesses.includes(move.letter)
  ) {
    return rounds;
  }
  return [...rounds.slice(0, -1), { ...current, guesses: [...current.guesses, move.letter] }];
}

// The guesser wins the round by saving Haru, the picker when Haru isn't saved
export function scoreOf(rounds: DuoRound[], creator: boolean) {
  const score = { me: 0, peer: 0 };
  rounds.forEach((round, index) => {
    const status = statusOf(round);
    if (status === 'playing') return;
    const picker = picksRound(index, creator);
    if ((status === 'won') !== picker) score.me++;
    else score.peer++;
  });
  return score;
}
