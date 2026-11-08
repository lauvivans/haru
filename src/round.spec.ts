import { describe, expect, it } from 'vitest';
import { letterOfKey, plain, roundOf } from './round';

function shown(word: string, guesses: string[]) {
  return roundOf(word, guesses)
    .groups.map((g) => g.slots.map((s) => (s.state === 'blank' ? '_' : s.char)).join(''))
    .join(' ');
}

describe('round', () => {
  it('starts with one blank per letter and the hyphen shown', () => {
    expect(shown('guarda-chuva', [])).toBe('______-_____');
  });

  it('keeps the words of a phrase apart', () => {
    expect(shown('PÃO DE QUEIJO', [])).toBe('___ __ ______');
  });

  it('reveals a letter with or without accents in every position', () => {
    expect(shown('AÇÃO', ['A'])).toBe('A_Ã_');
    expect(shown('AÇÃO', ['A', 'C'])).toBe('AÇÃ_');
  });

  it('counts a letter not in the word as a miss', () => {
    const round = roundOf('BAKER', ['A', 'Z', 'Q']);
    expect(round.misses).toBe(2);
    expect(round.hit('A')).toBe(true);
    expect(round.hit('Z')).toBe(false);
  });

  it('is won when every letter is revealed', () => {
    expect(roundOf('AÇAÍ', ['A', 'C']).status).toBe('playing');
    expect(roundOf('AÇAÍ', ['A', 'C', 'I']).status).toBe('won');
  });

  it('is lost on the 7th miss and shows the missing letters', () => {
    const six = ['Q', 'W', 'Z', 'X', 'V', 'J'];
    expect(roundOf('BAKER', six).status).toBe('playing');

    const round = roundOf('BAKER', [...six, 'A', 'M']);
    expect(round.status).toBe('lost');
    expect(round.groups[0].slots.map((s) => s.state)).toEqual([
      'missed',
      'shown',
      'missed',
      'missed',
      'missed',
    ]);
  });

  it('folds accents and cedilla', () => {
    expect(['Á', 'Â', 'Ã', 'À', 'ç', 'é'].map(plain)).toEqual(['A', 'A', 'A', 'A', 'C', 'E']);
  });

  it.each([
    ['a', 'A'],
    ['Z', 'Z'],
    ['ç', 'C'],
    ['1', null],
    ['Enter', null],
    ['Dead', null],
    [' ', null],
  ])('reads the key %j as %j', (key, letter) => {
    expect(letterOfKey(key)).toBe(letter);
  });
});
