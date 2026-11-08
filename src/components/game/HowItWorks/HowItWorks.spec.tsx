import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { HowItWorks } from './HowItWorks';

function setup(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="pt-BR?">
          <Route path="how-it-works" element={<HowItWorks />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('HowItWorks', () => {
  afterEach(cleanup);

  it('explains the round rules and both modes', () => {
    setup('/how-it-works');
    expect(screen.getByRole('heading', { level: 1, name: 'How it works' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'The game' })).toBeTruthy();
    expect(screen.getByText(/On the 7th miss the trapdoor opens/)).toBeTruthy();
    expect(screen.getByText(/C reveals Ç/)).toBeTruthy();
    expect(screen.getByText('Solo:')).toBeTruthy();
    expect(screen.getByText('With a friend:')).toBeTruthy();
  });

  it('explains signaling, STUN, TURN and the data channel with a diagram', () => {
    setup('/how-it-works');
    expect(screen.getByRole('heading', { name: 'Peer-to-peer' })).toBeTruthy();
    expect(screen.getByRole('img', { name: /signaling server/ })).toBeTruthy();
    expect(screen.getByText(/STUN helps each browser/)).toBeTruthy();
    expect(screen.getByText(/a TURN server relays the moves/)).toBeTruthy();
    expect(screen.getByText(/WebRTC channel/)).toBeTruthy();
    expect(screen.getByText(/The server stores nothing/)).toBeTruthy();
  });

  it('links back home to play', () => {
    setup('/how-it-works');
    expect(screen.getByRole('link', { name: 'Play now' }).getAttribute('href')).toBe('/');
  });

  it('is all in Portuguese under /pt-BR/', () => {
    setup('/pt-BR/how-it-works');
    expect(screen.getByRole('heading', { level: 1, name: 'Como funciona' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'O jogo' })).toBeTruthy();
    expect(screen.getByRole('img', { name: /servidor de sinalização/ })).toBeTruthy();
    expect(screen.getByText('Seu navegador')).toBeTruthy();
    expect(screen.getByText(/O servidor não guarda nada/)).toBeTruthy();
    expect(screen.queryByText(/The server stores nothing/)).toBeNull();
    expect(screen.getByRole('link', { name: 'Jogar agora' }).getAttribute('href')).toBe('/pt-BR/');
  });
});
