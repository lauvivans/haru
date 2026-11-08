import { Link } from 'react-router';
import { useLocale, useStrings } from '@/i18n/i18n';
import { pathIn } from '@/i18n/locale';
import type { Strings } from '@/i18n/en';

// Sample players in the diagram, as in docs/prototypes/how-it-works.html
const PLAYER = 'Laura';
const FRIEND = 'Ana';

interface DiagramProps {
  t: Strings['howItWorks']['diagram'];
}

function Diagram({ t }: DiagramProps) {
  return (
    <svg className="diagram" viewBox="0 0 360 250" role="img" aria-label={t.label}>
      <defs>
        <marker
          id="diagram-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="4"
          markerHeight="4"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10 Z" fill="var(--text-muted)" />
        </marker>
      </defs>
      <rect className="diagram__server" x="110" y="12" width="140" height="48" />
      <text className="diagram__server-text" x="180" y="34" textAnchor="middle">
        {t.signaling}
      </text>
      <text className="diagram__server-text" x="180" y="50" textAnchor="middle">
        {t.introduces}
      </text>

      <rect className="diagram__box" x="6" y="150" width="128" height="52" />
      <text x="70" y="174" textAnchor="middle">
        {t.you}
      </text>
      <text className="diagram__muted" x="70" y="190" textAnchor="middle">
        {PLAYER}
      </text>

      <rect className="diagram__box" x="226" y="150" width="128" height="52" />
      <text x="290" y="174" textAnchor="middle">
        {t.friend}
      </text>
      <text className="diagram__muted" x="290" y="190" textAnchor="middle">
        {FRIEND}
      </text>

      <path
        className="diagram__arrow"
        d="M76 144 L140 66"
        markerStart="url(#diagram-arrow)"
        markerEnd="url(#diagram-arrow)"
      />
      <path
        className="diagram__arrow"
        d="M284 144 L220 66"
        markerStart="url(#diagram-arrow)"
        markerEnd="url(#diagram-arrow)"
      />
      <text className="diagram__muted" x="96" y="100" textAnchor="end">
        1
      </text>
      <text className="diagram__muted" x="264" y="100">
        1
      </text>

      <path className="diagram__channel" d="M138 176 H222" />
      <text x="180" y="166" textAnchor="middle">
        {t.moves}
      </text>

      <path className="diagram__relay" d="M90 208 Q180 250 270 208" />
      <text className="diagram__muted" x="180" y="244" textAnchor="middle">
        {t.relay}
      </text>
    </svg>
  );
}

export function HowItWorks() {
  const locale = useLocale();
  const t = useStrings().howItWorks;

  return (
    <div className="prose">
      <h1 className="sky-text">{t.title}</h1>

      <section className="panel">
        <h2>{t.game.title}</h2>
        <p>{t.game.intro}</p>
        <ul>
          {t.game.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <p>
          <strong>{t.game.solo}</strong> {t.game.soloText}
        </p>
        <p>
          <strong>{t.game.friend}</strong> {t.game.friendText}
        </p>
      </section>

      <section className="panel">
        <h2>{t.p2p.title}</h2>
        <p>{t.p2p.intro}</p>
        <Diagram t={t.diagram} />
        <ol>
          {t.p2p.steps.map((step) => (
            <li key={step.title}>
              <strong>{step.title}</strong> {step.text}
            </li>
          ))}
        </ol>
        <p>{t.p2p.storesNothing}</p>
      </section>

      <p className="center" style={{ marginTop: 'var(--space-5)' }}>
        <Link className="btn btn--primary" to={pathIn(locale, '/')}>
          {t.play}
        </Link>
      </p>
    </div>
  );
}
