import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Move } from '@/duo';
import type { PeerLink } from '@/hooks/useRoom';
import { Duo } from './Duo';

// The canvas art is checked in the browser
vi.mock('@/pixel/gallows', () => ({ mountGallows: () => ({ update() {}, stop() {} }) }));
vi.mock('@/pixel/haru', () => ({ mountSprite: () => ({ update() {}, stop() {} }) }));

class FakeLink implements PeerLink {
  sent: Move[] = [];
  onMove: ((move: Move) => void) | null = null;
  send = (move: Move) => {
    this.sent.push(move);
  };
  listen = (onMove: (move: Move) => void) => {
    this.onMove = onMove;
    return () => {
      this.onMove = null;
    };
  };
  receive(move: Move) {
    act(() => this.onMove?.(move));
  }
}

const CODE = 'K7QXAB';
let link: FakeLink;

function setup(creator: boolean) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const [name, peerName] = creator ? ['Laura', 'Ana'] : ['Ana', 'Laura'];
  render(
    <MemoryRouter>
      <Duo code={CODE} link={link} first={creator} name={name} peerName={peerName} />
    </MemoryRouter>,
  );
  return user;
}

function key(letter: string) {
  return screen.getByRole('button', { name: letter });
}

function slots() {
  return [...document.querySelectorAll('.word__slot')].map((slot) => slot.textContent);
}

function players() {
  return [...document.querySelectorAll('.player')].map((player) => player.textContent);
}

function points() {
  return document.querySelector('.score__points')?.textContent;
}

function waitForEnd() {
  act(() => vi.advanceTimersByTime(2000));
}

describe('Duo', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    link = new FakeLink();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('lets the creator pick the first word, hidden, with a hint', async () => {
    const user = setup(true);
    expect(screen.getByRole('heading', { name: 'Pick a word for Ana' })).toBeTruthy();
    expect(players()).toEqual(['Laurapicks', 'Anaguesses']);

    const word = screen.getByLabelText<HTMLInputElement>('Word');
    expect(word.type).toBe('password');
    await user.click(screen.getByRole('button', { name: 'Show' }));
    expect(word.type).toBe('text');

    await user.type(word, '  Guarda-chuva ');
    await user.type(screen.getByLabelText('Hint (optional)'), 'Rainy day');
    await user.click(screen.getByRole('button', { name: 'Start round' }));

    expect(link.sent).toEqual([{ type: 'word', word: 'Guarda-chuva', hint: 'Rainy day' }]);
    expect(screen.getByText('Ana is guessing your word…')).toBeTruthy();
    expect(screen.getByText('Rainy day')).toBeTruthy();
    expect(key('A').hasAttribute('disabled')).toBe(true);
  });

  it('refuses a word with a digit or over 24 characters', async () => {
    const user = setup(true);
    const word = screen.getByLabelText('Word');
    const start = screen.getByRole('button', { name: 'Start round' });

    await user.type(word, 'casa1');
    await user.click(start);
    expect(screen.getByRole('alert').textContent).toBe(
      'Use 2 to 24 characters, only letters, spaces and hyphens.',
    );

    await user.clear(word);
    await user.type(word, 'a'.repeat(25));
    await user.click(start);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(link.sent).toEqual([]);
  });

  it('makes the friend wait for the word, then guess on the same board', async () => {
    const user = setup(false);
    expect(screen.getByRole('heading', { name: 'Laura is picking a word…' })).toBeTruthy();

    link.receive({ type: 'word', word: 'pé', hint: '' });
    expect(screen.getByText('Laura picked the word. Save Haru!')).toBeTruthy();

    await user.click(key('P'));
    expect(link.sent).toEqual([{ type: 'guess', letter: 'P' }]);
    expect(slots()).toEqual(['P', '']);
  });

  it("shows the creator the friend's guesses and drops moves out of turn", async () => {
    const user = setup(true);
    link.receive({ type: 'word', word: 'mão', hint: '' });
    expect(screen.getByRole('heading', { name: 'Pick a word for Ana' })).toBeTruthy();

    await user.type(screen.getByLabelText('Word'), 'casa');
    await user.click(screen.getByRole('button', { name: 'Start round' }));
    link.receive({ type: 'guess', letter: 'A' });
    link.receive({ type: 'guess', letter: 'Z' });
    link.receive({ type: 'word', word: 'mão', hint: '' });

    expect(slots()).toEqual(['', 'A', '', 'A']);
    expect(screen.getByText('1 / 7')).toBeTruthy();
    await user.keyboard('S');
    expect(link.sent).toHaveLength(1);
  });

  it('adds the round to the winner and swaps the roles', async () => {
    const user = setup(false);
    link.receive({ type: 'word', word: 'pé', hint: '' });
    await user.click(key('P'));
    await user.click(key('E'));
    waitForEnd();

    expect(screen.getByRole('heading', { name: 'You saved Haru!' })).toBeTruthy();
    expect(screen.getByText('Next round: you pick the word.')).toBeTruthy();
    expect(points()).toBe('1 × 0');

    await user.click(screen.getByRole('button', { name: 'Next round' }));
    expect(screen.getByRole('heading', { name: 'Pick a word for Laura' })).toBeTruthy();
    expect(players()).toEqual(['Anapicks', 'Lauraguesses']);
  });

  it('gives a lost round to the picker', async () => {
    const user = setup(true);
    await user.type(screen.getByLabelText('Word'), 'pé');
    await user.click(screen.getByRole('button', { name: 'Start round' }));
    for (const letter of 'ABCDFGH') link.receive({ type: 'guess', letter });
    waitForEnd();

    expect(screen.getByRole('heading', { name: "Haru didn't make it" })).toBeTruthy();
    expect(screen.getByText('Next round: Ana picks the word.')).toBeTruthy();
    expect(points()).toBe('1 × 0');
  });

  it('keeps counting from the score saved for the room', async () => {
    localStorage.setItem('haru-score-K7QXAB-Ana', JSON.stringify({ me: 2, peer: 1 }));
    const user = setup(false);
    expect(points()).toBe('2 × 1');

    link.receive({ type: 'word', word: 'pé', hint: '' });
    await user.click(key('P'));
    await user.click(key('E'));

    expect(points()).toBe('3 × 1');
    expect(JSON.parse(localStorage.getItem('haru-score-K7QXAB-Ana') ?? '')).toEqual({
      me: 3,
      peer: 1,
    });
  });

  it('starts the next round when the word arrives before the end dialog is left', async () => {
    const user = setup(true);
    await user.type(screen.getByLabelText('Word'), 'pé');
    await user.click(screen.getByRole('button', { name: 'Start round' }));
    link.receive({ type: 'guess', letter: 'P' });
    link.receive({ type: 'guess', letter: 'E' });
    waitForEnd();
    expect(screen.getByRole('heading', { name: 'Ana saved Haru!' })).toBeTruthy();

    link.receive({ type: 'word', word: 'mão', hint: '' });
    expect(screen.getByText('Ana picked the word. Save Haru!')).toBeTruthy();
    expect(slots()).toEqual(['', '', '']);
    expect(points()).toBe('0 × 1');
  });
});
