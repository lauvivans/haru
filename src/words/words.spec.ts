import { describe, expect, it } from "vitest";
import { ALPHABET, plain } from "@/round";
import { CATEGORIES, wordLists } from "./words";

const lists = Object.entries(wordLists);

function lettersOf(word: string) {
  return [...word].filter((char) => char !== " " && char !== "-");
}

describe("word lists", () => {
  it.each(lists)("%s has about 30 words in every category", (_, list) => {
    for (const category of CATEGORIES) {
      expect(list[category].length).toBeGreaterThanOrEqual(25);
      expect(list[category].length).toBeLessThanOrEqual(35);
    }
  });

  it.each(lists)("%s words have 3 to 14 letters", (_, list) => {
    for (const word of Object.values(list).flat()) {
      expect(lettersOf(word).length, word).toBeGreaterThanOrEqual(3);
      expect(lettersOf(word).length, word).toBeLessThanOrEqual(14);
    }
  });

  it.each(lists)(
    "%s words are lowercase letters a to z, accents, spaces and hyphens",
    (_, list) => {
      for (const word of Object.values(list).flat()) {
        expect(word, word).toBe(word.toLowerCase());
        expect(word, word).toMatch(/^\p{L}+([ -]\p{L}+)*$/u);
        expect(
          lettersOf(word).every((char) => ALPHABET.includes(plain(char))),
          word,
        ).toBe(true);
      }
    },
  );

  it.each(lists)("%s has no duplicates", (_, list) => {
    const words = Object.values(list).flat();
    expect(new Set(words).size).toBe(words.length);
  });
});
