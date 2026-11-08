import { useId, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router';
import { Duo } from '@/components/game/Duo/Duo';
import { Haru } from '@/components/game/Haru/Haru';
import { NicknameForm } from '@/components/game/NicknameForm/NicknameForm';
import { Button } from '@/components/ui/Button/Button';
import { Panel } from '@/components/ui/Panel/Panel';
import { useRoom } from '@/hooks/useRoom';
import { useLocale, useStrings } from '@/i18n/i18n';
import { pathIn } from '@/i18n/locale';
import { isRoomCode, nickname } from '@/room';

interface RoomCodeProps {
  code: string;
}

function Invite({ code }: RoomCodeProps) {
  const t = useStrings().room;
  const locale = useLocale();
  const id = useId();
  const link = `${location.origin}${pathIn(locale, `/room/${code}`)}`;

  return (
    <Panel className="narrow stack">
      <Haru />
      <h1 className="center">{t.invite.title}</h1>
      <p className="center muted">{t.invite.intro}</p>
      <div className="field">
        <label htmlFor={id}>{t.invite.link}</label>
        <div className="input-row">
          <input className="input code" id={id} value={link} readOnly />
          <Button onClick={() => navigator.clipboard?.writeText(link).catch(() => {})}>
            {t.invite.copy}
          </Button>
        </div>
      </div>
      <p className="center">
        <span className="muted">{t.code}</span> <span className="code">{code}</span>
      </p>
      <p className="center muted">{t.invite.waiting}</p>
    </Panel>
  );
}

function RoomFull() {
  const t = useStrings().room.full;
  const locale = useLocale();

  return (
    <Panel className="narrow stack center">
      <Haru mood="miss" />
      <h1>{t.title}</h1>
      <p className="muted">{t.intro}</p>
      <div className="result__actions">
        <Link className="btn btn--primary" to={pathIn(locale, '/room')}>
          {t.create}
        </Link>
        <Link className="btn btn--ghost" to={pathIn(locale, '/solo')}>
          {t.solo}
        </Link>
      </div>
    </Panel>
  );
}

function createdHere(state: unknown) {
  return (
    typeof state === 'object' && state !== null && 'created' in state && state.created === true
  );
}

function RoomScreen({ code }: RoomCodeProps) {
  const t = useStrings().room;
  const { state } = useLocation();
  // The creator typed a nickname on the page before; a friend types it here
  const [name, setName] = useState(() => (createdHere(state) && nickname.get()) || null);
  const { full, peerName, first, link } = useRoom(code, name);

  if (full) return <RoomFull />;

  if (!name) {
    return (
      <NicknameForm
        title={peerName ? t.join.invitedBy(peerName) : t.join.title}
        mood="hit"
        submitLabel={t.join.submit}
        onSubmit={setName}
      >
        <p className="center muted">
          {t.room} <span className="code">{code}</span>
        </p>
      </NicknameForm>
    );
  }

  if (!peerName || !link) return <Invite code={code} />;

  return <Duo link={link} first={first} name={name} peerName={peerName} />;
}

// A room link: /room/<code>. A new code starts a new connection.
export function Room() {
  const { code = '' } = useParams();
  const locale = useLocale();
  if (!isRoomCode(code)) return <Navigate to={pathIn(locale, '/room')} replace />;
  const upper = code.toUpperCase();
  return <RoomScreen key={upper} code={upper} />;
}
