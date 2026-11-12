import { useLocation, useNavigate } from 'react-router';
import { useLocale, useStrings } from '@/i18n/i18n';
import { pathIn, type Locale } from '@/i18n/locale';

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'pt-BR', label: 'PT' },
];

// EN / PT. Opens the same page under the other prefix, so a room link keeps working.
export function LangSwitch() {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const current = useLocale();
  const t = useStrings().langSwitch;
  return (
    <div className="toggle" role="group" aria-label={t.label}>
      {LOCALES.map((l) => (
        <button
          key={l.value}
          type="button"
          lang={l.value}
          aria-pressed={current === l.value}
          onClick={() => navigate(`${pathIn(l.value, pathname)}${search}${hash}`)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
