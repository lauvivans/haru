import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Round } from './Round';

// The canvas art is checked in the browser
vi.mock('@/pixel/gallows', () => ({ mountGallows: () => ({ update() {}, stop() {} }) }));
vi.mock('@/pixel/haru', () => ({ mountSprite: () => ({ update() {}, stop() {} }) }));

interface PlayProps {
  word: string;
  canGuess?: boolean;
  onGuess?: (letter: string) => void;
  onPlayAgain?: () => void;
}

function Play({ word, canGuess, onGuess, onPlayAgain = () => {} }: PlayProps) {
  const [guesses, setGuesses] = useState<string[]>([]);
  return (
    <Round
      word={word}
      guesses={guesses}
      canGuess={canGuess}
      onGuess={(letter) => {
        onGuess?.(letter);
        setGuesses((g) => [...g, letter]);
      }}
      onPlayAgain={onPlayAgain}
    />
  );
}

function setup(props: PlayProps) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <MemoryRouter>
      <Play {...props} />
    </MemoryRouter>,
  );
  return user;
}

function key(letter: string) {
  return screen.getByRole('button', { name: letter });
}

function waitForEnd() {
  act(() => vi.advanceTimersByTime(2000));
}

describe('Round', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('reveals A and Ã when the player picks A', async () => {
    const user = setup({ word: 'AÇÃO' });
    expect(screen.getAllByText('A')).toHaveLength(1); // only the key
    await user.click(key('A'));
    expect(screen.getAllByText('A')).toHaveLength(2);
    expect(screen.getByText('Ã')).toBeTruthy();
    expect(screen.queryByText('Ç')).toBeNull();
  });

  it('shows the hyphen from the start', () => {
    setup({ word: 'GUARDA-CHUVA' });
    expect(screen.getByText('-')).toBeTruthy();
  });

  it('ignores a letter already used', async () => {
    const onGuess = vi.fn();
    const user = setup({ word: 'BAKER', onGuess });
    await user.click(key('A'));
    await user.keyboard('a');
    expect(key('A')).toHaveProperty('disabled', true);
    expect(onGuess).toHaveBeenCalledTimes(1);
  });

  it('counts a letter typed on the physical keyboard', async () => {
    const onGuess = vi.fn();
    const user = setup({ word: 'BAKER', onGuess });
    await user.keyboard('b');
    await user.keyboard('{Control>}z{/Control}');
    expect(onGuess).toHaveBeenCalledExactlyOnceWith('B');
    expect(screen.getAllByText('B')).toHaveLength(2);
  });

  it('ends as a loss on the 7th miss and shows the word', async () => {
    const onPlayAgain = vi.fn();
    const user = setup({ word: 'BAKER', onPlayAgain });
    await user.keyboard('qwzxvj');
    expect(screen.getByText('6 / 7')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();

    await user.keyboard('m');
    waitForEnd();
    expect(screen.getByRole('dialog', { name: "Haru didn't make it" })).toBeTruthy();
    expect(screen.getAllByText('BAKER')).toHaveLength(1);
    expect(key('Y')).toHaveProperty('disabled', true);

    await user.click(screen.getByRole('button', { name: 'Play again' }));
    expect(onPlayAgain).toHaveBeenCalledOnce();
  });

  it('ends as a win when every letter is revealed', async () => {
    const user = setup({ word: 'AÇAÍ' });
    await user.keyboard('aci');
    waitForEnd();
    expect(screen.getByRole('dialog', { name: 'Haru is free!' })).toBeTruthy();
  });

  it("doesn't let the player who picked the word guess", async () => {
    const onGuess = vi.fn();
    const user = setup({ word: 'BAKER', canGuess: false, onGuess });
    await user.keyboard('b');
    expect(key('B')).toHaveProperty('disabled', true);
    expect(onGuess).not.toHaveBeenCalled();
  });
});
