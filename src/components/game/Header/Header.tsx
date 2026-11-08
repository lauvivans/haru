import { Link } from 'react-router';
import { ThemeSwitch } from '@/components/game/ThemeSwitch/ThemeSwitch';
import { LangSwitch } from '@/components/game/LangSwitch/LangSwitch';
import { useLocale } from '@/i18n/i18n';
import { pathIn } from '@/i18n/locale';

export function Header() {
  const locale = useLocale();
  return (
    <header className="header">
      <Link className="logo" to={pathIn(locale, '/')}>
        Haru
      </Link>
      <div className="header__tools">
        <LangSwitch />
        <ThemeSwitch />
      </div>
    </header>
  );
}
