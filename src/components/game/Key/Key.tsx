import { cx } from "@/cx";

export type KeyState = "hit" | "miss";

type Props = { letter: string; state?: KeyState; disabled?: boolean; onPick?: (letter: string) => void };

// A letter key; a used letter shows if it was a hit or a miss
export function Key({ letter, state, disabled, onPick }: Props) {
  return (
    <button
      type="button"
      className={cx("key", state && `key--${state}`)}
      disabled={disabled || !!state}
      onClick={() => onPick?.(letter)}
    >
      {letter}
    </button>
  );
}
