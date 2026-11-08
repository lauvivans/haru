import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CATEGORIES, wordLists } from "@/words/words";
import { Solo } from "./Solo";

// The canvas art is checked in the browser
vi.mock("@/pixel/gallows", () => ({ mountGallows: () => ({ update() {}, stop() {} }) }));
vi.mock("@/pixel/haru", () => ({ mountSprite: () => ({ update() {}, stop() {} }) }));

const allBut = (locale: "en" | "pt-BR", word: string) =>
  CATEGORIES.flatMap((c) => wordLists[locale][c]).filter((w) => w !== word);

function playedOnlyLeaves(locale: "en" | "pt-BR", word: string) {
  localStorage.setItem(`haru-played-${locale}`, JSON.stringify(allBut(locale, word)));
}

function setup(path: string) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <MemoryRouter initialEntries={[path]}>
      <Solo />
    </MemoryRouter>,
  );
  return user;
}

async function guess(user: ReturnType<typeof userEvent.setup>, letters: string) {
  for (const letter of letters) await user.click(screen.getByRole("button", { name: letter }));
}

describe("Solo", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("starts a round with the category of the word as a hint", () => {
    playedOnlyLeaves("en", "cat");
    setup("/solo");
    expect(screen.getByText("Animals")).toBeTruthy();
  });

  it("uses the list and the category names of the interface language", () => {
    playedOnlyLeaves("pt-BR", "pão");
    setup("/pt-BR/solo");
    expect(screen.getByText("Comida")).toBeTruthy();
  });

  it("picks a word not played yet in this browser", async () => {
    playedOnlyLeaves("en", "cat");
    const user = setup("/solo");
    await guess(user, "CAT");
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText("CAT")).toBeTruthy();
  });

  it("starts over when play again is picked after the last word", async () => {
    playedOnlyLeaves("en", "cat");
    const user = setup("/solo");
    await guess(user, "CAT");
    act(() => vi.advanceTimersByTime(2000));
    await user.click(screen.getByRole("button", { name: "Play again" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(JSON.parse(localStorage.getItem("haru-played-en") ?? "")).toHaveLength(1);
  });
});
