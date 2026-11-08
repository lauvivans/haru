import type { Locale } from "@/i18n/locale";
import { CATEGORIES, wordLists, type Category } from "@/words/words";

export interface SoloWord {
  word: string;
  category: Category;
}

function wordsIn(locale: Locale): SoloWord[] {
  const list = wordLists[locale];
  return CATEGORIES.flatMap((category) => list[category].map((word) => ({ word, category })));
}

const keyOf = (locale: Locale) => `haru-played-${locale}`;

// The words already played in this browser. Storage is untrusted and can be
// blocked (private mode), so anything that isn't a word of the list is dropped.
export function playedIn(locale: Locale): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(keyOf(locale)) ?? "[]");
    if (!Array.isArray(saved)) return [];
    const words = new Set(wordsIn(locale).map((w) => w.word));
    return [...new Set(saved.filter((w): w is string => typeof w === "string" && words.has(w)))];
  } catch {
    return [];
  }
}

// A word not played yet. Once the list runs out, it starts over without the current word.
export function pickWord(locale: Locale, random = Math.random): SoloWord {
  const all = wordsIn(locale);
  const played = playedIn(locale);
  const fresh = all.filter((w) => !played.includes(w.word));
  const pool = fresh.length ? fresh : all;
  return pool[Math.floor(random() * pool.length)];
}

export function markPlayed(locale: Locale, word: string) {
  const played = playedIn(locale);
  if (played.includes(word)) return;
  const next = [...played, word];
  try {
    localStorage.setItem(keyOf(locale), JSON.stringify(next.length >= wordsIn(locale).length ? [word] : next));
  } catch {
    /* storage blocked */
  }
}
