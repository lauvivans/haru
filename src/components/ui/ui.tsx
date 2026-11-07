// Base components. Styles live in src/styles/base.css and use only the tokens.
import { useId, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";

const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ");

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  small?: boolean;
  block?: boolean;
};

export function Button({ variant = "primary", small, block, className, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cx("btn", `btn--${variant}`, small && "btn--small", block && "btn--block", className)}
      {...rest}
    />
  );
}

// Parchment by day, stone by night
export function Panel({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return <section className={cx("panel", className)} {...rest} />;
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; hint?: ReactNode };

export function Field({ label, hint, className, ...rest }: FieldProps) {
  const id = useId();
  return (
    <div className={cx("field", className)}>
      <label htmlFor={id}>{label}</label>
      <input className="input" id={id} aria-describedby={hint ? `${id}-hint` : undefined} {...rest} />
      {hint && (
        <span className="field__hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
    </div>
  );
}

// The category of the word, or any short label on the accent color
export function Hint({ children }: { children: ReactNode }) {
  return <span className="hint">{children}</span>;
}

// A player's nickname and role in a two-player round
export function Player({ name, role }: { name: string; role?: ReactNode }) {
  return (
    <span className="player">
      {name}
      {role && <span className="player__role">{role}</span>}
    </span>
  );
}

export type KeyState = "hit" | "miss";

type KeyProps = { letter: string; state?: KeyState; disabled?: boolean; onPick?: (letter: string) => void };

export function Key({ letter, state, disabled, onPick }: KeyProps) {
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

const ALPHABET =[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

type KeyboardProps = {
  used: Partial<Record<string, KeyState>>; // letters already picked
  locked?: boolean; // the round is over, or it is not this player's turn
  onPick: (letter: string) => void;
};

// A to Z on screen. The physical keyboard belongs to the round.
export function Keyboard({ used, locked, onPick }: KeyboardProps) {
  return (
    <div className={cx("keyboard", locked && "keyboard--locked")}>
      {ALPHABET.map((l) => (
        <Key key={l} letter={l} state={used[l]} disabled={locked} onPick={onPick} />
      ))}
    </div>
  );
}
