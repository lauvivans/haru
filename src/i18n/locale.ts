export type Locale = "en" | "pt-BR";

const PT_PREFIX = "/pt-BR";

// `/pt-BR/...` is Portuguese, everything else English (decision 002).
export function localeOf(pathname: string): Locale {
  return pathname === PT_PREFIX || pathname.startsWith(`${PT_PREFIX}/`) ? "pt-BR" : "en";
}

export function pathIn(locale: Locale, pathname: string): string {
  const path = localeOf(pathname) === "pt-BR" ? pathname.slice(PT_PREFIX.length) || "/" : pathname;
  if (locale === "en") return path;
  return path === "/" ? `${PT_PREFIX}/` : `${PT_PREFIX}${path}`;
}
