import type { FormEvent, ReactNode } from 'react';
import {
  FIELD_LABELS, typefaceStack,
  type FieldKey, type LandingContent, type LandingTheme, type TemplateId,
} from '@/lib/landing';

/**
 * The published page. The editor renders this at a fixed width for preview and
 * the public route renders it full-bleed — same component, so what you design
 * is literally what ships.
 */

interface RenderProps {
  template: TemplateId;
  content: LandingContent;
  theme: LandingTheme;
  /** live entry count for giveaway pages */
  entryCount?: number;
  onSubmit?(values: Record<string, string>): void;
  submitted?: boolean;
}

/* ── shared pieces ────────────────────────────────────────────────────────── */

function Form({
  content, theme, onSubmit, submitted, compact,
}: {
  content: LandingContent; theme: LandingTheme;
  onSubmit?(v: Record<string, string>): void; submitted?: boolean; compact?: boolean;
}) {
  const muted = theme.dark ? 'rgba(255,255,255,.55)' : 'rgba(14,22,32,.55)';
  const line = theme.dark ? 'rgba(255,255,255,.18)' : 'rgba(14,22,32,.14)';
  const fieldBg = theme.dark ? 'rgba(255,255,255,.06)' : '#fff';

  if (submitted) {
    return (
      <div
        style={{
          border: `1px solid ${theme.accent}`, borderRadius: theme.radius,
          padding: '20px 18px', textAlign: 'center', background: fieldBg,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink, marginBottom: 6 }}>
          You're in.
        </div>
        <p style={{ fontSize: 13, color: muted, margin: 0, lineHeight: 1.6 }}>
          {content.thanksMessage}
        </p>
      </div>
    );
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const values: Record<string, string> = {};
    data.forEach((v, k) => { values[k] = String(v); });
    onSubmit?.(values);
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: compact ? 8 : 10 }}>
      {content.fields.map((key: FieldKey) => {
        const f = FIELD_LABELS[key];
        const shared = {
          name: key,
          required: key === 'email',
          placeholder: f.placeholder,
          'aria-label': f.label,
          style: {
            width: '100%', padding: '10px 12px', fontSize: 13,
            borderRadius: Math.max(4, theme.radius - 4),
            border: `1px solid ${line}`, background: fieldBg, color: theme.ink,
            fontFamily: 'inherit', outline: 'none',
          } as const,
        };
        return f.type === 'textarea'
          ? <textarea key={key} {...shared} rows={3} style={{ ...shared.style, resize: 'vertical' }} />
          : <input key={key} {...shared} type={f.type} />;
      })}
      <button
        type="submit"
        style={{
          padding: '11px 16px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
          borderRadius: Math.max(4, theme.radius - 4), border: 'none',
          background: theme.accent, color: '#fff', fontFamily: 'inherit',
        }}
      >
        {content.ctaLabel}
      </button>
      {content.footnote ? (
        <p style={{ fontSize: 11, color: muted, margin: '2px 0 0', textAlign: 'center' }}>
          {content.footnote}
        </p>
      ) : null}
    </form>
  );
}

const Logo = ({ content, theme }: { content: LandingContent; theme: LandingTheme }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span
      style={{
        width: 22, height: 22, borderRadius: 6, background: theme.accent, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700,
      }}
    >
      {content.logoText.charAt(0) || 'L'}
    </span>
    <span style={{ fontSize: 13.5, fontWeight: 600, color: theme.ink }}>{content.logoText}</span>
  </div>
);

const Placeholder = ({ theme, label, height }: { theme: LandingTheme; label: string; height: number }) => (
  <div
    style={{
      height, borderRadius: theme.radius, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: theme.dark
        ? 'repeating-linear-gradient(135deg,#1b2530 0 10px,#161f29 10px 20px)'
        : 'repeating-linear-gradient(135deg,#F1F4F6 0 10px,#E7ECEF 10px 20px)',
      border: `1px solid ${theme.dark ? 'rgba(255,255,255,.1)' : 'rgba(14,22,32,.08)'}`,
      color: theme.dark ? 'rgba(255,255,255,.5)' : 'rgba(14,22,32,.45)',
      fontSize: 11,
    }}
  >
    {label}
  </div>
);

const Shell = ({ theme, children, pad = 40 }: { theme: LandingTheme; children: ReactNode; pad?: number }) => (
  <div
    style={{
      background: theme.surface, color: theme.ink,
      fontFamily: typefaceStack[theme.typeface],
      padding: `${pad}px 32px`, minHeight: '100%',
    }}
  >
    {children}
  </div>
);

const muteOf = (theme: LandingTheme) =>
  theme.dark ? 'rgba(255,255,255,.62)' : 'rgba(14,22,32,.6)';

/* ── the six templates ────────────────────────────────────────────────────── */

export function LandingRender({ template, content, theme, entryCount, onSubmit, submitted }: RenderProps) {
  const muted = muteOf(theme);

  if (template === 'waitlist') {
    return (
      <Shell theme={theme} pad={64}>
        <div style={{ maxWidth: 460, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <Logo content={content} theme={theme} />
          </div>
          <h1 style={{ fontSize: 34, lineHeight: 1.12, letterSpacing: '-0.03em', margin: '0 0 14px', fontWeight: 600 }}>
            {content.headline}
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: muted, margin: '0 0 28px' }}>
            {content.subhead}
          </p>
          <Form content={content} theme={theme} onSubmit={onSubmit} submitted={submitted} />
        </div>
      </Shell>
    );
  }

  if (template === 'coming_soon') {
    return (
      <div
        style={{
          background: theme.dark ? theme.surface : theme.ink, color: '#fff',
          fontFamily: typefaceStack[theme.typeface], minHeight: '100%',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, background: theme.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
              {content.logoText.charAt(0) || 'L'}
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{content.logoText}</span>
          </div>
        </div>
        <div
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: '48px 32px 64px', maxWidth: 620, margin: '0 auto', width: '100%',
          }}
        >
          <h1 style={{ fontSize: 44, lineHeight: 1.05, letterSpacing: '-0.035em', margin: '0 0 16px', fontWeight: 600 }}>
            {content.headline}
          </h1>
          <p style={{ fontSize: 15.5, lineHeight: 1.6, color: 'rgba(255,255,255,.66)', margin: '0 0 30px', maxWidth: '46ch' }}>
            {content.subhead}
          </p>
          <div style={{ maxWidth: 380 }}>
            <Form content={content} theme={{ ...theme, dark: true, ink: '#fff' }} onSubmit={onSubmit} submitted={submitted} compact />
          </div>
        </div>
      </div>
    );
  }

  if (template === 'giveaway') {
    return (
      <Shell theme={theme} pad={36}>
        <div style={{ maxWidth: 940, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <Logo content={content} theme={theme} />
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 11px',
                borderRadius: 999, fontSize: 11.5, fontWeight: 600,
                background: `${theme.accent}1a`, color: theme.accent,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.accent }} />
              Closes {content.endsAt}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(0,.85fr)', gap: 34, alignItems: 'start' }}>
            <div>
              <h1 style={{ fontSize: 36, lineHeight: 1.08, letterSpacing: '-0.03em', margin: '0 0 12px', fontWeight: 600 }}>
                {content.headline}
              </h1>
              <p style={{ fontSize: 14.5, lineHeight: 1.62, color: muted, margin: '0 0 22px' }}>
                {content.subhead}
              </p>

              <div
                style={{
                  border: `1px solid ${theme.accent}33`, background: `${theme.accent}0d`,
                  borderRadius: theme.radius, padding: '16px 18px', marginBottom: 20,
                }}
              >
                <div style={{ fontSize: 10.5, letterSpacing: '.09em', textTransform: 'uppercase', color: muted, marginBottom: 6 }}>
                  The prize
                </div>
                <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>
                  {content.prize}
                </div>
                <div style={{ fontSize: 13, color: theme.accent, fontWeight: 600 }}>
                  worth {content.prizeValue}
                </div>
              </div>

              {content.imageUrl
                ? <img src={content.imageUrl} alt="" style={{ width: '100%', borderRadius: theme.radius, display: 'block' }} />
                : <Placeholder theme={theme} label="prize image" height={190} />}
            </div>

            <div
              style={{
                border: `1px solid ${theme.dark ? 'rgba(255,255,255,.14)' : 'rgba(14,22,32,.1)'}`,
                borderRadius: theme.radius, padding: 20,
                background: theme.dark ? 'rgba(255,255,255,.03)' : '#fff',
                boxShadow: theme.dark ? 'none' : '0 6px 24px rgba(15,23,32,.07)',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: theme.accent, fontVariantNumeric: 'tabular-nums' }}>
                  {(entryCount ?? 0).toLocaleString()}
                </div>
                <div style={{ fontSize: 11.5, color: muted }}>entries so far</div>
              </div>
              <Form content={content} theme={theme} onSubmit={onSubmit} submitted={submitted} />
              <p style={{ fontSize: 10.5, color: muted, textAlign: 'center', margin: '12px 0 0', lineHeight: 1.55 }}>
                Free to enter — no purchase necessary. Share your link after entering to earn extra entries.
              </p>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (template === 'webinar') {
    return (
      <Shell theme={theme}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: 26 }}><Logo content={content} theme={theme} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.25fr) minmax(0,.75fr)', gap: 36, alignItems: 'start' }}>
            <div>
              <div
                style={{
                  display: 'inline-flex', alignItems: 'baseline', gap: 8, marginBottom: 16,
                  padding: '7px 13px', borderRadius: Math.max(4, theme.radius - 4),
                  background: theme.accent, color: '#fff',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700 }}>{content.eventDate}</span>
                <span style={{ fontSize: 11.5, opacity: 0.85 }}>{content.eventTime}</span>
              </div>
              <h1 style={{ fontSize: 31, lineHeight: 1.12, letterSpacing: '-0.028em', margin: '0 0 12px', fontWeight: 600 }}>
                {content.headline}
              </h1>
              <p style={{ fontSize: 14.5, lineHeight: 1.62, color: muted, margin: '0 0 26px' }}>
                {content.subhead}
              </p>

              <div style={{ fontSize: 10.5, letterSpacing: '.09em', textTransform: 'uppercase', color: muted, marginBottom: 10 }}>
                What we'll cover
              </div>
              <ol style={{ margin: '0 0 26px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {content.agenda.map((item, i) => (
                  <li key={item} style={{ display: 'flex', gap: 11, alignItems: 'baseline', fontSize: 13.5, lineHeight: 1.5 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: theme.accent, minWidth: 14, fontVariantNumeric: 'tabular-nums' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>

              <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
                {content.speakers.map((s) => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        width: 34, height: 34, borderRadius: '50%', background: `${theme.accent}22`,
                        color: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700,
                      }}
                    >
                      {s.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                    </span>
                    <span>
                      <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>{s.name}</span>
                      <span style={{ display: 'block', fontSize: 11.5, color: muted }}>{s.role}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                border: `1px solid ${theme.dark ? 'rgba(255,255,255,.14)' : 'rgba(14,22,32,.1)'}`,
                borderRadius: theme.radius, padding: 20,
                background: theme.dark ? 'rgba(255,255,255,.03)' : '#fff',
                boxShadow: theme.dark ? 'none' : '0 6px 24px rgba(15,23,32,.07)',
              }}
            >
              <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 14 }}>{content.formTitle}</div>
              <Form content={content} theme={theme} onSubmit={onSubmit} submitted={submitted} />
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  if (template === 'demo_request') {
    return (
      <Shell theme={theme}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ marginBottom: 30 }}><Logo content={content} theme={theme} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,.8fr)', gap: 40, alignItems: 'start' }}>
            <div>
              <h1 style={{ fontSize: 33, lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 14px', fontWeight: 600 }}>
                {content.headline}
              </h1>
              <p style={{ fontSize: 15, lineHeight: 1.62, color: muted, margin: '0 0 26px' }}>
                {content.subhead}
              </p>

              <div
                style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1,
                  background: theme.dark ? 'rgba(255,255,255,.12)' : 'rgba(14,22,32,.09)',
                  border: `1px solid ${theme.dark ? 'rgba(255,255,255,.12)' : 'rgba(14,22,32,.09)'}`,
                  borderRadius: theme.radius, overflow: 'hidden', marginBottom: 26,
                }}
              >
                {content.proofPoints.map((p) => (
                  <div key={p.label} style={{ background: theme.surface, padding: '14px 12px' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: theme.accent, fontVariantNumeric: 'tabular-nums' }}>
                      {p.stat}
                    </div>
                    <div style={{ fontSize: 11, color: muted, lineHeight: 1.4, marginTop: 2 }}>{p.label}</div>
                  </div>
                ))}
              </div>

              <ul style={{ margin: '0 0 26px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {content.bullets.map((b) => (
                  <li key={b} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 13.5, lineHeight: 1.5 }}>
                    <span style={{ color: theme.accent, fontWeight: 700 }}>✓</span>{b}
                  </li>
                ))}
              </ul>

              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', opacity: 0.55 }}>
                {content.logos.map((l) => (
                  <span key={l} style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>{l}</span>
                ))}
              </div>
            </div>

            <div
              style={{
                border: `1px solid ${theme.dark ? 'rgba(255,255,255,.14)' : 'rgba(14,22,32,.1)'}`,
                borderRadius: theme.radius, padding: 22,
                background: theme.dark ? 'rgba(255,255,255,.03)' : '#fff',
                boxShadow: theme.dark ? 'none' : '0 6px 24px rgba(15,23,32,.07)',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{content.formTitle}</div>
              <p style={{ fontSize: 12, color: muted, margin: '0 0 16px', lineHeight: 1.55 }}>
                We'll come back within one working day.
              </p>
              <Form content={content} theme={theme} onSubmit={onSubmit} submitted={submitted} />
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  // lead_magnet — the default
  return (
    <Shell theme={theme}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}><Logo content={content} theme={theme} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,.9fr)', gap: 38, alignItems: 'start' }}>
          <div>
            <h1 style={{ fontSize: 32, lineHeight: 1.11, letterSpacing: '-0.03em', margin: '0 0 13px', fontWeight: 600 }}>
              {content.headline}
            </h1>
            <p style={{ fontSize: 14.5, lineHeight: 1.62, color: muted, margin: '0 0 22px' }}>
              {content.subhead}
            </p>
            {content.imageUrl
              ? <img src={content.imageUrl} alt="" style={{ width: '100%', borderRadius: theme.radius, display: 'block', marginBottom: 20 }} />
              : <div style={{ marginBottom: 20 }}><Placeholder theme={theme} label="cover image" height={160} /></div>}
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {content.bullets.map((b) => (
                <li key={b} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 13.5, lineHeight: 1.5 }}>
                  <span style={{ color: theme.accent, fontWeight: 700 }}>·</span>{b}
                </li>
              ))}
            </ul>
          </div>

          <div
            style={{
              border: `1px solid ${theme.dark ? 'rgba(255,255,255,.14)' : 'rgba(14,22,32,.1)'}`,
              borderRadius: theme.radius, padding: 20,
              background: theme.dark ? 'rgba(255,255,255,.03)' : '#fff',
              boxShadow: theme.dark ? 'none' : '0 6px 24px rgba(15,23,32,.07)',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>{content.formTitle}</div>
            <Form content={content} theme={theme} onSubmit={onSubmit} submitted={submitted} />
          </div>
        </div>
      </div>
    </Shell>
  );
}
