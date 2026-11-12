import { useId, useState } from 'react';
import { Haru } from '@/components/game/Haru/Haru';
import { Button } from '@/components/ui/Button/Button';
import { Field } from '@/components/ui/Field/Field';
import { isHint, isWord, tidyWord } from '@/duo';
import { useStrings } from '@/i18n/i18n';

interface PickWordProps {
  peerName: string;
  onPick: (word: string, hint: string) => void;
}

// The picker types the word hidden, with a button to show it, and an optional hint
export function PickWord({ peerName, onPick }: PickWordProps) {
  const t = useStrings().pickWord;
  const id = useId();
  const [word, setWord] = useState('');
  const [hint, setHint] = useState('');
  const [shown, setShown] = useState(false);
  const [refused, setRefused] = useState(false);

  return (
    <form
      className="panel narrow stack"
      onSubmit={(e) => {
        e.preventDefault();
        const tidy = tidyWord(word);
        const tip = hint.trim();
        if (!isWord(tidy) || !isHint(tip)) {
          setRefused(true);
          return;
        }
        onPick(tidy, tip);
      }}
    >
      <Haru mood="miss" />
      <h1 className="center">{t.title(peerName)}</h1>
      <div className="field">
        <label htmlFor={id}>{t.word}</label>
        <div className="input-row">
          <input
            className="input"
            id={id}
            type={shown ? 'text' : 'password'}
            value={word}
            autoComplete="off"
            aria-describedby={`${id}-rule`}
            aria-invalid={refused}
            onChange={(e) => {
              setWord(e.target.value);
              setRefused(false);
            }}
          />
          <Button variant="ghost" aria-pressed={shown} onClick={() => setShown(!shown)}>
            {t.show}
          </Button>
        </div>
        {refused ? (
          <span className="field__error" id={`${id}-rule`} role="alert">
            {t.refused}
          </span>
        ) : (
          <span className="field__hint" id={`${id}-rule`}>
            {t.rule}
          </span>
        )}
      </div>
      <Field
        label={t.hint}
        hint={t.hintRule}
        value={hint}
        maxLength={40}
        autoComplete="off"
        onChange={(e) => setHint(e.target.value)}
      />
      <Button type="submit" block>
        {t.start}
      </Button>
    </form>
  );
}
