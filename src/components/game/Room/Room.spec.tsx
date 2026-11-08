import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateRoom } from '@/components/game/CreateRoom/CreateRoom';
import { nickname } from '@/room';
import { Room } from './Room';

// jsdom has no matchMedia, and the theme reads it when the module loads
vi.hoisted(() => vi.stubGlobal('matchMedia', () => ({ matches: false })));

// The canvas art is checked in the browser
vi.mock('@/pixel/gallows', () => ({ mountGallows: () => ({ update() {}, stop() {} }) }));
vi.mock('@/pixel/haru', async (original) => ({
  ...(await original<typeof import('@/pixel/haru')>()),
  mountSprite: () => ({ update() {}, stop() {} }),
}));

const CODE = 'K7QXAB';

class FakeChannel {
  readyState = 'connecting';
  sent: unknown[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  listeners = new Set<(event: { data: string }) => void>();
  send(message: string) {
    this.sent.push(JSON.parse(message));
  }
  addEventListener(_type: 'message', listener: (event: { data: string }) => void) {
    this.listeners.add(listener);
  }
  removeEventListener(_type: 'message', listener: (event: { data: string }) => void) {
    this.listeners.delete(listener);
  }
  open() {
    this.readyState = 'open';
    this.onopen?.();
  }
  receive(message: unknown) {
    const event = { data: JSON.stringify(message) };
    this.onmessage?.(event);
    this.listeners.forEach((listener) => listener(event));
  }
}

class FakePeer {
  static last: FakePeer;
  channel = new FakeChannel();
  localDescription: object | null = null;
  remoteDescription: object | null = null;
  onicecandidate = null;
  constructor() {
    FakePeer.last = this;
  }
  createDataChannel() {
    return this.channel;
  }
  async setLocalDescription() {
    this.localDescription = { type: this.remoteDescription ? 'answer' : 'offer', sdp: 'v=0' };
  }
  async setRemoteDescription(description: object) {
    this.remoteDescription = description;
  }
  async addIceCandidate() {}
  close() {}
}

class FakeSocket {
  static readonly OPEN = 1;
  static last: FakeSocket;
  readyState = FakeSocket.OPEN;
  sent: { type: string }[] = [];
  onmessage: ((event: { data: string }) => void) | null = null;
  readonly url: string;
  constructor(url: string) {
    this.url = url;
    FakeSocket.last = this;
  }
  send(message: string) {
    this.sent.push(JSON.parse(message));
  }
  close() {}
}

async function fromServer(message: unknown) {
  await act(async () => FakeSocket.last.onmessage?.({ data: JSON.stringify(message) }));
}

async function fromPeer(message: unknown) {
  await act(async () => FakePeer.last.channel.receive(message));
}

async function openChannel() {
  await act(async () => FakePeer.last.channel.open());
}

function setup(path: string) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="pt-BR?">
          <Route path="room" element={<CreateRoom />} />
          <Route path="room/:code" element={<Room />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  return user;
}

describe('Room', () => {
  beforeEach(() => {
    nickname.set('');
    vi.stubGlobal('WebSocket', FakeSocket);
    vi.stubGlobal('RTCPeerConnection', FakePeer);
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.restoreAllMocks();
  });

  it('creates a room with a link and shows the friend once they join', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ code: CODE })),
    );
    const user = setup('/room');

    await user.type(screen.getByLabelText('Your nickname'), 'Laura');
    await user.click(screen.getByRole('button', { name: 'Create room' }));

    expect(await screen.findByRole('heading', { name: 'Invite a friend' })).toBeTruthy();
    const link = screen.getByLabelText<HTMLInputElement>('Room link').value;
    expect(link).toMatch(new RegExp(`/room/${CODE}$`));
    expect(FakeSocket.last.url).toMatch(new RegExp(`/rooms/${CODE}$`));

    await fromServer({ type: 'peer-joined' });
    expect(FakeSocket.last.sent).toEqual([{ type: 'offer', data: { type: 'offer', sdp: 'v=0' } }]);
    await fromServer({ type: 'answer', data: { type: 'answer', sdp: 'v=0' } });
    await openChannel();
    expect(FakePeer.last.channel.sent).toEqual([{ type: 'hello', nickname: 'Laura' }]);

    await fromPeer({ type: 'hello', nickname: 'Ana' });
    expect(screen.getByRole('heading', { name: 'Pick a word for Ana' })).toBeTruthy();

    await user.type(screen.getByLabelText('Word'), 'casa');
    await user.click(screen.getByRole('button', { name: 'Start round' }));
    expect(FakePeer.last.channel.sent.at(-1)).toEqual({ type: 'word', word: 'casa', hint: '' });
    await fromPeer({ type: 'guess', letter: 'A' });
    expect(screen.getByText('Ana is guessing your word…')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'A' })[0].hasAttribute('disabled')).toBe(true);
  });

  async function playWithAna() {
    nickname.set('Laura');
    const user = setup(`/room/${CODE}`);
    await user.click(screen.getByRole('button', { name: 'Join room' }));
    await fromServer({ type: 'peer-joined' });
    await openChannel();
    await fromPeer({ type: 'hello', nickname: 'Ana' });
    return user;
  }

  it('tells the player the friend left, waits, and keeps the score when they return', async () => {
    const user = await playWithAna();
    // Joined by link, but was in the room first, so picks first
    await user.type(screen.getByLabelText('Word'), 'pé');
    await user.click(screen.getByRole('button', { name: 'Start round' }));
    await fromPeer({ type: 'guess', letter: 'P' });
    await fromPeer({ type: 'guess', letter: 'E' });

    await fromServer({ type: 'peer-disconnected' });
    expect(screen.getByRole('heading', { name: 'Ana left the room' })).toBeTruthy();
    expect(screen.getByText('Laura 0 × 1 Ana')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Wait in the room' }));
    expect(screen.getByRole('heading', { name: 'Invite a friend' })).toBeTruthy();

    const first = FakePeer.last;
    await fromServer({ type: 'peer-joined' });
    expect(FakePeer.last).not.toBe(first);
    expect(FakeSocket.last.sent.filter((s) => s.type === 'offer')).toHaveLength(2);
    await openChannel();
    await fromPeer({ type: 'hello', nickname: 'Ana' });

    // A new round, and the one who stayed picks first
    expect(screen.getByRole('heading', { name: 'Pick a word for Ana' })).toBeTruthy();
    expect(document.querySelector('.score__points')?.textContent).toBe('0 × 1');

    await fromServer({ type: 'peer-disconnected' });
    expect(screen.getByRole('heading', { name: 'Ana left the room' })).toBeTruthy();
  });

  it('lets the player go back home when the friend leaves', async () => {
    await playWithAna();
    await fromServer({ type: 'peer-disconnected' });

    expect(screen.getByRole('link', { name: 'Back home' }).getAttribute('href')).toBe('/');
  });

  it('tells the player when the room could not be created', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ code: 'nope' })),
    );
    const user = setup('/room');

    await user.type(screen.getByLabelText('Your nickname'), 'Laura');
    await user.click(screen.getByRole('button', { name: 'Create room' }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      "The room couldn't be created. Try again.",
    );
  });

  it('joins by link: shows who invited, then both nicknames', async () => {
    const user = setup(`/room/${CODE.toLowerCase()}`);
    expect(screen.getByRole('heading', { name: 'Join the room' })).toBeTruthy();

    await fromServer({ type: 'offer', data: { type: 'offer', sdp: 'v=0' } });
    expect(FakeSocket.last.sent).toEqual([
      { type: 'answer', data: { type: 'answer', sdp: 'v=0' } },
    ]);
    await openChannel();
    await fromPeer({ type: 'hello', nickname: 'Laura' });
    expect(screen.getByRole('heading', { name: 'Laura invited you' })).toBeTruthy();

    await user.type(screen.getByLabelText('Your nickname'), 'Ana');
    await user.click(screen.getByRole('button', { name: 'Join room' }));

    expect(FakePeer.last.channel.sent).toEqual([{ type: 'hello', nickname: 'Ana' }]);
    expect(screen.getByRole('heading', { name: 'Laura is picking a word…' })).toBeTruthy();

    await fromPeer({ type: 'word', word: 'pé', hint: '' });
    expect(screen.getByText('Laura picked the word. Save Haru!')).toBeTruthy();
  });

  it('drops a peer message that is not a valid hello', async () => {
    setup(`/room/${CODE}`);
    await fromServer({ type: 'offer', data: { type: 'offer', sdp: 'v=0' } });
    await openChannel();
    await fromPeer({ type: 'hello', nickname: 'x'.repeat(17) });

    expect(screen.getByRole('heading', { name: 'Join the room' })).toBeTruthy();
  });

  it('shows a third person that the room is full', async () => {
    setup(`/room/${CODE}`);
    await fromServer({ type: 'room-full' });

    expect(screen.getByRole('heading', { name: 'This room is full' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Create a room' }).getAttribute('href')).toBe('/room');
    expect(screen.getByRole('link', { name: 'Play solo' }).getAttribute('href')).toBe('/solo');
  });

  it('fills in the nickname typed before', () => {
    nickname.set('Laura');
    setup(`/pt-BR/room/${CODE}`);

    expect(screen.getByLabelText<HTMLInputElement>('Seu apelido').value).toBe('Laura');
  });

  it('sends a wrong room code to the create page', () => {
    setup('/room/NOPE');

    expect(screen.getByRole('button', { name: 'Create room' })).toBeTruthy();
  });
});
