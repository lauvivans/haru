import { useEffect, useState } from 'react';
import { Haru } from '@/components/game/Haru/Haru';
import { PickWord } from '@/components/game/PickWord/PickWord';
import { Player } from '@/components/game/Player/Player';
import { Round } from '@/components/game/Round/Round';
import { Panel } from '@/components/ui/Panel/Panel';
import {
  picksRound,
  play,
  saveScore,
  savedScore,
  scoreOf,
  statusOf,
  type DuoRound,
  type Move,
} from '@/duo';
import type { PeerLink } from '@/hooks/useRoom';
import { useStrings } from '@/i18n/i18n';

interface DuoProps {
  code: string;
  link: PeerLink;
  first: boolean;
  name: string;
  peerName: string;
}

// Two-player rounds. Both players keep the same rounds: each applies its own moves
// and the other player's, so the board and the score match on both sides.
export function Duo({ code, link, first, name, peerName }: DuoProps) {
  const t = useStrings().duo;
  const [rounds, setRounds] = useState<DuoRound[]>([]);
  // Rounds whose end dialog this player has left with "Next round"
  const [seen, setSeen] = useState(0);
  // Rounds from an earlier connection in this room still count for the score
  const [past] = useState(() => savedScore(code));

  useEffect(
    () => link.listen((move) => setRounds((r) => play(r, move, false, first))),
    [link, first],
  );

  function move(m: Move) {
    const next = play(rounds, m, true, first);
    if (next === rounds) return;
    setRounds(next);
    link.send(m);
  }

  const current = rounds.at(-1);
  // The round on the board, until this player leaves its end dialog
  const board =
    current && (statusOf(current) === 'playing' || seen < rounds.length) ? current : null;
  const index = board ? rounds.length - 1 : rounds.length;
  const picking = picksRound(index, first);
  const score = scoreOf(rounds, first, past);

  useEffect(
    () => saveScore(code, { me: score.me, peer: score.peer }),
    [code, score.me, score.peer],
  );

  const roleOf = (picks: boolean) => (picks ? t.picks : t.guesses);

  function screen() {
    if (board) {
      return (
        <Round
          key={index}
          word={board.word}
          hint={board.hint}
          guesses={board.guesses}
          message={picking ? t.watching(peerName) : t.guessing(peerName)}
          canGuess={!picking}
          ending={{
            won: picking ? t.saved(peerName) : t.youSaved,
            note: picking ? t.nextPicker(peerName) : t.youPickNext,
            next: t.next,
            leave: t.leave,
          }}
          onGuess={(letter) => move({ type: 'guess', letter })}
          onPlayAgain={() => setSeen(rounds.length)}
        />
      );
    }
    if (picking) {
      return (
        <PickWord peerName={peerName} onPick={(word, hint) => move({ type: 'word', word, hint })} />
      );
    }
    return (
      <Panel className="narrow stack center">
        <Haru />
        <h1>{t.waiting(peerName)}</h1>
        <p className="muted">{t.waitingIntro}</p>
      </Panel>
    );
  }

  return (
    <>
      <div className="score">
        <Player name={name} role={roleOf(picking)} />
        <span className="score__points">
          {score.me} × {score.peer}
        </span>
        <Player name={peerName} role={roleOf(!picking)} />
      </div>
      {screen()}
    </>
  );
}
