import { useState, type ReactNode } from 'react';
import { Haru } from '@/components/game/Haru/Haru';
import { LookPicker } from '@/components/game/LookPicker/LookPicker';
import { Button } from '@/components/ui/Button/Button';
import { Field } from '@/components/ui/Field/Field';
import { useStrings } from '@/i18n/i18n';
import type { Mood } from '@/pixel/haru';
import { isNickname, nickname } from '@/room';

interface NicknameFormProps {
  title: string;
  mood: Mood;
  submitLabel: string;
  busy?: boolean;
  children?: ReactNode; // shown under the title
  onSubmit: (name: string) => void;
}

// Look and nickname before creating or joining a room. The nickname is remembered.
export function NicknameForm({
  title,
  mood,
  submitLabel,
  busy,
  children,
  onSubmit,
}: NicknameFormProps) {
  const t = useStrings().nickname;
  const [value, setValue] = useState(nickname.get);
  const name = value.trim();
  const valid = isNickname(name);

  return (
    <form
      className="panel narrow stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid || busy) return;
        nickname.set(name);
        onSubmit(name);
      }}
    >
      <Haru mood={mood} />
      <h1 className="center">{title}</h1>
      {children}
      <div className="field">
        <label>{t.look}</label>
        <LookPicker style={{ justifyContent: 'flex-start', margin: 0 }} />
      </div>
      <Field
        label={t.label}
        hint={t.hint}
        value={value}
        maxLength={16}
        autoComplete="nickname"
        required
        onChange={(e) => setValue(e.target.value)}
      />
      <Button type="submit" block disabled={!valid || busy}>
        {submitLabel}
      </Button>
    </form>
  );
}
