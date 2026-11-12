import { useState } from 'react';
import { useNavigate } from 'react-router';
import { NicknameForm } from '@/components/game/NicknameForm/NicknameForm';
import { useLocale, useStrings } from '@/i18n/i18n';
import { pathIn } from '@/i18n/locale';
import { isRoomCode } from '@/room';

async function newRoomCode(): Promise<string | null> {
  try {
    const response = await fetch('/rooms', { method: 'POST' });
    const body: unknown = await response.json();
    if (typeof body === 'object' && body !== null && 'code' in body) {
      const { code } = body;
      return typeof code === 'string' && isRoomCode(code) ? code : null;
    }
  } catch {
    /* offline or not JSON */
  }
  return null;
}

// Play with a friend: nickname first, then the new room with its link
export function CreateRoom() {
  const t = useStrings().room.create;
  const locale = useLocale();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function create() {
    setBusy(true);
    setFailed(false);
    const code = await newRoomCode();
    if (code) {
      // The state tells the room page this player already typed their nickname
      navigate(pathIn(locale, `/room/${code}`), { state: { created: true } });
    } else {
      setBusy(false);
      setFailed(true);
    }
  }

  return (
    <NicknameForm title={t.title} mood="idle" submitLabel={t.submit} busy={busy} onSubmit={create}>
      {failed && (
        <p className="center muted" role="alert">
          {t.failed}
        </p>
      )}
    </NicknameForm>
  );
}
