import { useLocation } from "react-router";
import { localeOf, type Locale } from "./locale";
import { en, type Strings } from "./en";
import { ptBR } from "./pt-BR";

const dictionaries: Record<Locale, Strings> = { en, "pt-BR": ptBR };

export function useLocale(): Locale {
  return localeOf(useLocation().pathname);
}

export function useStrings(): Strings {
  return dictionaries[useLocale()];
}
