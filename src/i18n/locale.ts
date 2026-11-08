export type Locale = 'en' | 'pt-BR';

const PT_PREFIX = '/pt-BR';

// `/pt-BR/...` is Portuguese, everything else English (decision 002).
// Case-insensitive, like React Router's route matching.
export function localeOf(pathname: string): Locale {
  const path = pathname.toLowerCase();
  const prefix = PT_PREFIX.toLowerCase();
  return path === prefix || path.startsWith(`${prefix}/`) ? 'pt-BR' : 'en';
}

export function pathIn(locale: Locale, pathname: string): string {
  const path = localeOf(pathname) === 'pt-BR' ? pathname.slice(PT_PREFIX.length) || '/' : pathname;
  if (locale === 'en') return path;
  return path === '/' ? `${PT_PREFIX}/` : `${PT_PREFIX}${path}`;
}
