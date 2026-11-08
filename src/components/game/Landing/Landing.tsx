import { useState } from 'react';
import { Link } from 'react-router';
import { Haru } from '@/components/game/Haru/Haru';
import { LookPicker } from '@/components/game/LookPicker/LookPicker';
import { useLocale, useStrings } from '@/i18n/i18n';
import { pathIn } from '@/i18n/locale';
import type { Mood } from '@/pixel/haru';

// Clicking Haru shows each reaction in turn
const MOODS: Mood[] = ['idle', 'hit', 'miss', 'win', 'loss'];

export function Landing() {
  const locale = useLocale();
  const t = useStrings().landing;
  const [mood, setMood] = useState(0);

  return (
    <>
      <section className="hero">
        <h1 className="sky-text">Haru</h1>
        <p className="sky-text">{t.tagline}</p>
      </section>

      <div className="spacer"></div>

      <div style={{ alignSelf: 'center' }}>
        <Haru
          size="lg"
          mood={MOODS[mood]}
          title={t.cycleMoods}
          onClick={() => setMood((m) => (m + 1) % MOODS.length)}
        />
      </div>
      <p className="center sky-text" style={{ margin: 'var(--space-2) 0' }}>
        {t.chooseLook}
      </p>
      <LookPicker />

      <section className="modes">
        <article className="panel mode">
          <h2>{t.solo.title}</h2>
          <p>{t.solo.description}</p>
          <Link className="btn btn--primary btn--block" to={pathIn(locale, '/solo')}>
            {t.solo.play}
          </Link>
        </article>

        <article className="panel mode">
          <h2>{t.friend.title}</h2>
          <p>{t.friend.description}</p>
          <Link className="btn btn--primary btn--block" to={pathIn(locale, '/room')}>
            {t.friend.play}
          </Link>
        </article>
      </section>

      <p className="center sky-text" style={{ marginTop: 'var(--space-4)' }}>
        <Link className="sky-text" to={pathIn(locale, '/how-it-works')}>
          {t.howItWorks}
        </Link>
      </p>
    </>
  );
}
