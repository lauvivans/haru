import type { CSSProperties } from 'react';
import { useStored } from '@/stored';
import { look, LOOK_NAMES } from '@/pixel/haru';
import { Haru } from '@/components/game/Haru/Haru';
import { useStrings } from '@/i18n/i18n';

interface LookPickerProps {
  style?: CSSProperties;
}

// Pick one of Haru's three looks. The choice is kept in the browser.
export function LookPicker({ style }: LookPickerProps) {
  const current = useStored(look);
  const t = useStrings().lookPicker;
  return (
    <div className="looks" role="radiogroup" aria-label={t.label} style={style}>
      {LOOK_NAMES.map((l) => (
        <button
          key={l}
          type="button"
          className="look"
          role="radio"
          aria-checked={current === l}
          onClick={() => look.set(l)}
        >
          <Haru look={l} size="sm" />
          {t[l]}
        </button>
      ))}
    </div>
  );
}
