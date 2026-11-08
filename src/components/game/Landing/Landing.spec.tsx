import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Solo } from '@/components/game/Solo/Solo';
import { Landing } from './Landing';

// jsdom has no matchMedia, and the theme reads it when the module loads
vi.hoisted(() => vi.stubGlobal('matchMedia', () => ({ matches: false })));

// The canvas art is checked in the browser
vi.mock('@/pixel/gallows', () => ({ mountGallows: () => ({ update() {}, stop() {} }) }));
vi.mock('@/pixel/haru', async (original) => ({
  ...(await original<typeof import('@/pixel/haru')>()),
  mountSprite: () => ({ update() {}, stop() {} }),
}));

function setup(path: string) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="pt-BR?">
          <Route index element={<Landing />} />
          <Route path="solo" element={<Solo />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  return user;
}

describe('Landing', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('shows Haru, the two modes and their play buttons', () => {
    setup('/');
    expect(screen.getByRole('heading', { level: 1, name: 'Haru' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Solo' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'With a friend' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Play solo' }).getAttribute('href')).toBe('/solo');
    expect(screen.getByRole('link', { name: 'Play with a friend' }).getAttribute('href')).toBe(
      '/room',
    );
  });

  it('speaks Portuguese and keeps the links under /pt-BR/', () => {
    setup('/pt-BR/');
    expect(screen.getByRole('link', { name: 'Jogar sozinho' }).getAttribute('href')).toBe(
      '/pt-BR/solo',
    );
    expect(screen.getByRole('link', { name: 'Jogar com um amigo' }).getAttribute('href')).toBe(
      '/pt-BR/room',
    );
    expect(screen.getByRole('link', { name: 'Como funciona' }).getAttribute('href')).toBe(
      '/pt-BR/how-it-works',
    );
  });

  it('starts a solo round from the play solo button', async () => {
    const user = setup('/');
    await user.click(screen.getByRole('link', { name: 'Play solo' }));
    expect(screen.getByRole('button', { name: 'A' })).toBeTruthy();
  });

  it('links to the How it works page', () => {
    setup('/');
    expect(screen.getByRole('link', { name: 'How it works' }).getAttribute('href')).toBe(
      '/how-it-works',
    );
  });
});
