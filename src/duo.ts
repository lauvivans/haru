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

export interface Score {
  me: number;
  peer: number;
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

// The player who was in the room first (its creator, in a new room) picks the
// first word, then the roles swap
export function picksRound(index: number, first: boolean) {
  return (index % 2 === 0) === first;
}

export function statusOf(round: DuoRound) {
  return roundOf(round.word, round.guesses).status;
}

// Applies a move from this player (byMe) or the other one. A move out of turn is dropped.
export function play(rounds: DuoRound[], move: Move, byMe: boolean, first: boolean) {
  const current = rounds.at(-1);
  const playing = current !== undefined && statusOf(current) === 'playing';

  if (move.type === 'word') {
    if (playing || picksRound(rounds.length, first) !== byMe) return rounds;
    return [...rounds, { word: move.word, hint: move.hint, guesses: [] }];
  }
  if (
    !playing ||
    picksRound(rounds.length - 1, first) === byMe ||
    current.guesses.includes(move.letter)
  ) {
    return rounds;
  }
  return [...rounds.slice(0, -1), { ...current, guesses: [...current.guesses, move.letter] }];
}

// The guesser wins the round by saving Haru, the picker when Haru isn't saved
export function scoreOf(rounds: DuoRound[], first: boolean, past: Score = { me: 0, peer: 0 }) {
  const score = { ...past };
  rounds.forEach((round, index) => {
    const status = statusOf(round);
    if (status === 'playing') return;
    const picker = picksRound(index, first);
    if ((status === 'won') !== picker) score.me++;
    else score.peer++;
  });
  return score;
}

// Far more rounds than one session plays; a bigger number didn't come from the game
const MAX_POINTS = 10_000;
const scoreKey = (code: string) => `haru-score-${code.toUpperCase()}`;

function isPoints(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_POINTS;
}

// The room's score is kept in this browser, so it survives a player leaving and coming
// back with the same link. Storage is untrusted and can be blocked: a bad value is 0 × 0.
export function savedScore(code: string): Score {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(scoreKey(code)) ?? 'null');
    if (
      typeof saved === 'object' &&
      saved !== null &&
      'me' in saved &&
      'peer' in saved &&
      isPoints(saved.me) &&
      isPoints(saved.peer)
    ) {
      return { me: saved.me, peer: saved.peer };
    }
  } catch {
    /* storage blocked or not JSON */
  }
  return { me: 0, peer: 0 };
}

export function saveScore(code: string, score: Score) {
  try {
    localStorage.setItem(scoreKey(code), JSON.stringify({ me: score.me, peer: score.peer }));
  } catch {
    /* storage blocked */
  }
}
