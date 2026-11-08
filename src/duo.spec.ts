import { afterEach, describe, expect, it } from 'vitest';
import {
  isHint,
  isWord,
  picksRound,
  play,
  saveScore,
  savedScore,
  scoreOf,
  tidyWord,
  type DuoRound,
  type Move,
} from './duo';

const word = (value: string): Move => ({ type: 'word', word: value, hint: '' });
const guess = (letter: string): Move => ({ type: 'guess', letter });

function playAll(moves: [Move, boolean][], first: boolean) {
  return moves.reduce<DuoRound[]>((rounds, [move, byMe]) => play(rounds, move, byMe, first), []);
}

describe('duo', () => {
  describe('isWord', () => {
    it('accepts 2 to 24 letters with accents, Ç, spaces and hyphens', () => {
      expect(isWord('pé')).toBe(true);
      expect(isWord('Guarda-chuva')).toBe(true);
      expect(isWord('pão de açúcar')).toBe(true);
      expect(isWord('a'.repeat(24))).toBe(true);
    });

    it('refuses digits, other symbols, letters off A to Z and bad lengths', () => {
      expect(isWord('casa1')).toBe(false);
      expect(isWord('casa!')).toBe(false);
      expect(isWord('łódź')).toBe(false);
      expect(isWord('straße')).toBe(false);
      expect(isWord('a')).toBe(false);
      expect(isWord('a'.repeat(25))).toBe(false);
      expect(isWord('- -')).toBe(false);
    });

    it('refuses spaces around or doubled, which tidyWord removes', () => {
      expect(isWord(' casa')).toBe(false);
      expect(isWord('pão  doce')).toBe(false);
      expect(tidyWord('  pão \t doce ')).toBe('pão doce');
      expect(isWord(tidyWord('pé'))).toBe(true);
    });
  });

  describe('isHint', () => {
    it('accepts up to 40 characters, or none', () => {
      expect(isHint('')).toBe(true);
      expect(isHint('a'.repeat(40))).toBe(true);
      expect(isHint('a'.repeat(41))).toBe(false);
      expect(isHint(' rain')).toBe(false);
      expect(isHint('rain\n')).toBe(false);
    });
  });

  describe('picksRound', () => {
    it('gives the first round to the player who was in the room first and swaps every round', () => {
      expect([0, 1, 2].map((i) => picksRound(i, true))).toEqual([true, false, true]);
      expect([0, 1, 2].map((i) => picksRound(i, false))).toEqual([false, true, false]);
    });
  });

  describe('play', () => {
    it('starts a round with the word from whoever picks it', () => {
      expect(playAll([[word('pé'), true]], true)).toEqual([{ word: 'pé', hint: '', guesses: [] }]);
      expect(playAll([[word('pé'), false]], false)).toHaveLength(1);
    });

    it('drops a word out of turn or while a round is on', () => {
      expect(playAll([[word('pé'), false]], true)).toEqual([]);
      const rounds = playAll(
        [
          [word('pé'), true],
          [word('mão'), false],
        ],
        true,
      );
      expect(rounds).toHaveLength(1);
    });

    it('takes guesses only from the guesser, once per letter', () => {
      const rounds = playAll(
        [
          [word('casa'), true],
          [guess('C'), true],
          [guess('A'), false],
          [guess('A'), false],
        ],
        true,
      );
      expect(rounds[0].guesses).toEqual(['A']);
    });

    it('drops guesses after the round ends', () => {
      const rounds = playAll(
        [
          [word('pé'), true],
          [guess('P'), false],
          [guess('E'), false],
          [guess('X'), false],
        ],
        true,
      );
      expect(rounds[0].guesses).toEqual(['P', 'E']);
    });
  });

  describe('scoreOf', () => {
    it('gives a saved round to the guesser and a lost one to the picker', () => {
      const rounds = playAll(
        [
          [word('pé'), true],
          [guess('P'), false],
          [guess('E'), false],
          [word('ab'), false],
          ...[...'CDEFGHI'].map((l): [Move, boolean] => [guess(l), true]),
          [word('ab'), true],
        ],
        true,
      );
      expect(scoreOf(rounds, true)).toEqual({ me: 0, peer: 2 });
      expect(scoreOf(rounds, false)).toEqual({ me: 2, peer: 0 });
    });

    it('adds the rounds to the score kept from before', () => {
      const rounds = playAll(
        [
          [word('pé'), true],
          [guess('P'), false],
          [guess('E'), false],
        ],
        true,
      );
      expect(scoreOf(rounds, true, { me: 3, peer: 1 })).toEqual({ me: 3, peer: 2 });
    });
  });

  describe('savedScore', () => {
    afterEach(() => localStorage.clear());

    it('reads back the score saved for a room, whatever the case of the code', () => {
      saveScore('k7qxab', { me: 2, peer: 1 });
      expect(savedScore('K7QXAB')).toEqual({ me: 2, peer: 1 });
      expect(savedScore('ZZZZZZ')).toEqual({ me: 0, peer: 0 });
    });

    it('drops a saved score that the game could not have written', () => {
      for (const saved of [
        '{',
        '[1,2]',
        '{"me":-1,"peer":0}',
        '{"me":1.5,"peer":0}',
        '{"me":"2","peer":0}',
        '{"me":10001,"peer":0}',
      ]) {
        localStorage.setItem('haru-score-K7QXAB', saved);
        expect(savedScore('K7QXAB')).toEqual({ me: 0, peer: 0 });
      }
    });
  });
});
