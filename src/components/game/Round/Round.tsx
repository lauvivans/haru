import { useEffect, useEffectEvent, useState } from "react";
import { Link } from "react-router";
import { cx } from "@/cx";
import { Gallows } from "@/components/game/Gallows/Gallows";
import { Haru } from "@/components/game/Haru/Haru";
import { Keyboard } from "@/components/game/Keyboard/Keyboard";
import type { KeyState } from "@/components/game/Key/Key";
import { Button } from "@/components/ui/Button/Button";
import { Hint } from "@/components/ui/Hint/Hint";
import { Panel } from "@/components/ui/Panel/Panel";
import type { Mood } from "@/pixel/haru";
import { letterOfKey, MAX_MISSES, roundOf, type Status } from "@/round";
import { useLocale, useStrings } from "@/i18n/i18n";
import { pathIn } from "@/i18n/locale";

// Lets the win or the trapdoor play before the dialog covers the stage
const END_DELAY_MS = 1600;

interface RoundProps {
  word: string;
  hint?: string; // the category, or the hint from the player who picked the word
  guesses: readonly string[]; // letters picked so far, A to Z
  canGuess?: boolean; // false for the player who picked the word
  onGuess: (letter: string) => void;
  onPlayAgain: () => void;
}

function moodOf(status: Status, lastGuess: string | undefined, hit: (letter: string) => boolean): Mood {
  if (status === "won") return "win";
  if (status === "lost") return "loss";
  if (lastGuess === undefined) return "idle";
  return hit(lastGuess) ? "hit" : "miss";
}

export function Round({ word, hint, guesses, canGuess = true, onGuess, onPlayAgain }: RoundProps) {
  const t = useStrings().round;
  const locale = useLocale();
  const { groups, misses, status, hit } = roundOf(word, guesses);
  const over = status !== "playing";
  const [endShown, setEndShown] = useState(false);

  const used: Record<string, KeyState> = Object.fromEntries(
    guesses.map((g) => [g, hit(g) ? "hit" : "miss"]),
  );
  const mood = moodOf(status, guesses.at(-1), hit);

  function pick(letter: string) {
    if (!canGuess || over || guesses.includes(letter)) return;
    onGuess(letter);
  }

  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target instanceof Element && e.target.closest("input, textarea")) return;
    const letter = letterOfKey(e.key);
    if (letter) pick(letter);
  });

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!over) return;
    const timer = setTimeout(() => setEndShown(true), END_DELAY_MS);
    return () => {
      clearTimeout(timer);
      setEndShown(false);
    };
  }, [over]);

  return (
    <>
      <div className="board">
        <div className="stage-wrap">
          <Gallows misses={misses} mood={mood} guesses={guesses.length} />
        </div>
        <Panel className="board__panel">
          {hint && <Hint>{hint}</Hint>}
          <div className="word">
            {groups.map((group) => (
              <span className="word__group" key={group.at}>
                {group.slots.map(({ at, char, state }) => (
                  <span
                    key={at}
                    className={cx(
                      "word__slot",
                      state === "fixed" && "word__slot--fixed",
                      state === "missed" && "word__slot--missed",
                    )}
                  >
                    {state === "blank" ? "" : char}
                  </span>
                ))}
              </span>
            ))}
          </div>
          <p className="misses">
            {misses} / {MAX_MISSES}
          </p>
          <Keyboard used={used} locked={!canGuess || over} onPick={pick} />
        </Panel>
      </div>

      {endShown && (
        <div className="overlay">
          <Panel className="result" role="dialog" aria-labelledby="round-end">
            <Haru mood={mood} />
            <h2 id="round-end">{status === "won" ? t.won : t.lost}</h2>
            <p className="muted">{t.wordWas}</p>
            <p className="result__word">{word.toUpperCase()}</p>
            <div className="result__actions">
              <Button autoFocus onClick={onPlayAgain}>
                {t.playAgain}
              </Button>
              <Link className="btn btn--ghost" to={pathIn(locale, "/")}>
                {t.backHome}
              </Link>
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}
