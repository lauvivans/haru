import { cx } from '@/cx';
import { Key, type KeyState } from '@/components/game/Key/Key';
import { ALPHABET } from '@/round';

interface KeyboardProps {
  used: Partial<Record<string, KeyState>>; // letters already picked
  locked?: boolean; // the round is over, or it is not this player's turn
  onPick: (letter: string) => void;
}

// A to Z on screen. The physical keyboard belongs to the round.
export function Keyboard({ used, locked, onPick }: KeyboardProps) {
  return (
    <div className={cx('keyboard', locked && 'keyboard--locked')}>
      {ALPHABET.map((l) => (
        <Key key={l} letter={l} state={used[l]} disabled={locked} onPick={onPick} />
      ))}
    </div>
  );
}
