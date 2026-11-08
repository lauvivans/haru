import { useStored } from "@/stored";
import { theme, type Theme } from "@/theme";
import { useStrings } from "@/i18n/i18n";

const THEMES: { value: Theme; icon: string }[] = [
  { value: "light", icon: "☀" },
  { value: "dark", icon: "☾" },
];

export function ThemeSwitch() {
  const current = useStored(theme);
  const t = useStrings().themeSwitch;
  return (
    <div className="toggle" role="group" aria-label={t.label}>
      {THEMES.map((th) => (
        <button key={th.value} type="button" aria-label={t[th.value]} aria-pressed={current === th.value} onClick={() => theme.set(th.value)}>
          {th.icon}
        </button>
      ))}
    </div>
  );
}
