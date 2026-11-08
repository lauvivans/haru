import type { Locale } from "@/i18n/locale";
import { en } from "./en";
import { ptBR } from "./pt-BR";

export const CATEGORIES = [
  "animals",
  "food",
  "countries",
  "objects",
  "jobs",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type WordList = Record<Category, readonly string[]>;

export const wordLists: Record<Locale, WordList> = { en, "pt-BR": ptBR };
