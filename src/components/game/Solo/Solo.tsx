import { useEffect, useState } from 'react';
import { Round } from '@/components/game/Round/Round';
import { useLocale, useStrings } from '@/i18n/i18n';
import type { Locale } from '@/i18n/locale';
import { markPlayed, pickWord, type SoloWord } from '@/solo';

interface SoloRoundProps {
  locale: Locale;
}

interface SoloState extends SoloWord {
  guesses: string[];
}

function SoloRound({ locale }: SoloRoundProps) {
  const t = useStrings().solo;
  const [round, setRound] = useState<SoloState>(() => ({ ...pickWord(locale), guesses: [] }));

  useEffect(() => {
    markPlayed(locale, round.word);
  }, [locale, round.word]);

  return (
    <Round
      word={round.word}
      hint={t.categories[round.category]}
      guesses={round.guesses}
      onGuess={(letter) => setRound((r) => ({ ...r, guesses: [...r.guesses, letter] }))}
      onPlayAgain={() => setRound({ ...pickWord(locale), guesses: [] })}
    />
  );
}

// A new language starts a new round with a word from that language's list
export function Solo() {
  const locale = useLocale();
  return <SoloRound key={locale} locale={locale} />;
}
