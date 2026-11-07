import { Link } from "react-router";
import { useStored } from "@/stored";
import { theme, type Theme } from "@/theme";

const THEMES: { value: Theme; label: string; icon: string }[] = [
  { value: "light", label: "Day", icon: "☀" },
  { value: "dark", label: "Night", icon: "☾" },
];

// Day or night. The language switch joins it with the /pt-BR/ prefix.
export function ThemeSwitch() {
  const current = useStored(theme);
  return (
    <div className="toggle" role="group" aria-label="Day or night">
      {THEMES.map((t) => (
        <button key={t.value} type="button" aria-label={t.label} aria-pressed={current === t.value} onClick={() => theme.set(t.value)}>
          {t.icon}
        </button>
      ))}
    </div>
  );
}

export function Header() {
  return (
    <header className="header">
      <Link className="logo" to="/">
        Haru
      </Link>
      <div className="header__tools">
        <ThemeSwitch />
      </div>
    </header>
  );
}
