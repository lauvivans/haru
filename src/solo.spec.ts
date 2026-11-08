import { afterEach, describe, expect, it, vi } from "vitest";
import { CATEGORIES, wordLists } from "@/words/words";
import { markPlayed, pickWord, playedIn } from "./solo";

const KEY = "haru-played-en";
const words = CATEGORIES.flatMap((c) => wordLists.en[c]);

describe("solo words", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("picks a word of the list with its category", () => {
    const { word, category } = pickWord("pt-BR");
    expect(wordLists["pt-BR"][category]).toContain(word);
  });

  it("doesn't pick a word already played", () => {
    localStorage.setItem(KEY, JSON.stringify(words.slice(1)));
    expect(pickWord("en", () => 0.99).word).toBe(words[0]);
  });

  it("keeps the played words of each language apart", () => {
    markPlayed("en", "cat");
    expect(playedIn("en")).toEqual(["cat"]);
    expect(playedIn("pt-BR")).toEqual([]);
  });

  it("starts over without the current word once the list runs out", () => {
    localStorage.setItem(KEY, JSON.stringify(words.slice(1)));
    markPlayed("en", words[0]);
    expect(playedIn("en")).toEqual([words[0]]);
    expect(pickWord("en").word).not.toBe(words[0]);
  });

  it.each([
    ["not JSON", "{"],
    ["not a list", JSON.stringify({ cat: true })],
  ])("drops a stored value that is %s", (_, value) => {
    localStorage.setItem(KEY, value);
    expect(playedIn("en")).toEqual([]);
  });

  it("keeps only the stored items that are words of the list", () => {
    localStorage.setItem(KEY, JSON.stringify(["cat", 1, "<script>", "gato", "cat"]));
    expect(playedIn("en")).toEqual(["cat"]);
  });

  it("still picks a word when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { word } = pickWord("en");
    expect(() => markPlayed("en", word)).not.toThrow();
    expect(words).toContain(word);
  });
});
