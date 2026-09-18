import {
  createContext, useContext, useEffect, useId, useRef,
  type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode,
} from 'react';
import { AlertTriangle, ArrowLeft, Bell, Check, Clock, Lock, X, type LucideIcon } from 'lucide-react';
import type { EmailStatus, PhoneStatus, Provenance, Tone } from '@/lib/types';

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

/* ── tone system ──────────────────────────────────────────────────────────── */

const toneClass: Record<Tone, string> = {
  good: 'text-good-fg bg-good-bg border-good-bd',
  info: 'text-info-fg bg-info-bg border-info-bd',
  warn: 'text-warn-fg bg-warn-bg border-warn-bd',
  bad: 'text-bad-fg bg-bad-bg border-bad-bd',
  mute: 'text-mute-fg bg-mute-bg border-mute-bd',
  ai: 'text-ai-fg bg-ai-bg border-ai-bd',
};

const statusTones: Record<string, Tone> = {
  Verified: 'good', Valid: 'good', Mobile: 'good', Completed: 'good', Active: 'good',
  Connected: 'good', Won: 'good', Done: 'good', Live: 'good', Created: 'good', High: 'good',
  'Format Valid': 'info', Landline: 'info', Running: 'info', Qualified: 'info',
  Contacted: 'info', Meeting: 'info', Opportunity: 'info', Processing: 'info', Medium: 'info',
  Risky: 'warn', 'Partially Completed': 'warn', Paused: 'warn', 'Requires API Key': 'warn',
  Draft: 'warn', Queued: 'warn', 'Needs review': 'warn',
  Invalid: 'bad', Failed: 'bad', Lost: 'bad', Cancelled: 'bad', Revoked: 'bad',
};

export const toneOf = (status: string): Tone => statusTones[status] ?? 'mute';

export const scoreTone = (n: number): Tone =>
  n >= 80 ? 'good' : n >= 65 ? 'info' : n >= 50 ? 'warn' : 'bad';

export const scoreBand = (n: number) =>
  n >= 85 ? 'V. High' : n >= 70 ? 'High' : n >= 55 ? 'Medium' : 'Low';

const provTones: Record<Provenance, Tone> = {
  Observed: 'mute', Verified: 'good', Enriched: 'ai', Inferred: 'warn', 'AI Generated': 'ai',
};

export const provenanceTone = (p: Provenance): Tone => provTones[p] ?? 'mute';

/* ── pills ────────────────────────────────────────────────────────────────── */

export function Pill({
  tone = 'mute', children, className, icon: Icon,
}: { tone?: Tone; children: ReactNode; className?: string; icon?: LucideIcon }) {
  return (
    <span className={cx(
      'inline-flex items-center gap-1 rounded px-1.5 py-[2px] text-[10px] font-semibold',
      'tracking-[0.02em] whitespace-nowrap border',
      toneClass[tone], className,
    )}>
      {Icon ? <Icon size={10} strokeWidth={2.5} aria-hidden /> : null}
      {children}
    </span>
  );
}

export const StatusPill = ({ status }: { status: string }) => (
  <Pill tone={toneOf(status)}>{status}</Pill>
);

export const ScorePill = ({ score }: { score: number }) => (
  <Pill tone={scoreTone(score)} className="num">{score}</Pill>
);

export const ProvenancePill = ({ prov }: { prov: Provenance }) => (
  <Pill tone={provenanceTone(prov)}>{prov}</Pill>
);

export const EmailPill = ({ status }: { status: EmailStatus }) => <StatusPill status={status} />;
export const PhonePill = ({ status }: { status: PhoneStatus }) => <StatusPill status={status} />;

/* ── buttons ──────────────────────────────────────────────────────────────── */

type ButtonKind = 'primary' | 'ghost' | 'danger' | 'chip' | 'quiet';

const buttonKinds: Record<ButtonKind, string> = {
  primary:
    'h-[30px] px-3 bg-primary text-white shadow-[0_1px_2px_rgb(15_118_110/0.28)] ' +
    'hover:bg-primary-hover active:bg-primary-hover',
  ghost:
    'h-[30px] px-3 border border-line-strong bg-panel text-ink shadow-card ' +
    'hover:border-primary hover:text-primary',
  danger: 'h-[30px] px-3 bg-danger text-white hover:brightness-110',
  chip:
    'px-[9px] py-1 border border-line-strong bg-panel text-ink-3 text-[11px] rounded-[5px] ' +
    'hover:border-primary hover:text-primary',
  quiet: 'h-[30px] px-3 text-muted hover:text-ink hover:bg-line-soft',
};

export function Button({
  kind = 'ghost', icon: Icon, children, className, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { kind?: ButtonKind; icon?: LucideIcon }) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-md text-xs font-medium',
        'whitespace-nowrap transition-colors duration-150 cursor-pointer',
        'disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:border-line-strong',
        buttonKinds[kind], className,
      )}
    >
      {Icon ? <Icon size={13} strokeWidth={1.9} aria-hidden /> : null}
      {children}
    </button>
  );
}

/** Filter chip with a pressed state — used across every filter rail. */
export function FilterChip({
  active, children, className, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      {...rest}
      className={cx(
        'inline-flex items-center rounded-[5px] px-[9px] py-1 text-[11px] whitespace-nowrap',
        'border transition-colors duration-150 cursor-pointer',
        'disabled:cursor-not-allowed',
        active
          ? 'border-primary bg-primary-soft text-primary-ink font-semibold'
          : 'border-line-strong bg-panel text-ink-3 hover:border-ghost hover:bg-wash',
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ── surfaces ─────────────────────────────────────────────────────────────── */

export const Card = ({ children, className, ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <div {...rest} className={cx('bg-panel border border-line rounded-lg shadow-card', className)}>
    {children}
  </div>
);

export const CardHead = ({
  title, action, sub, className,
}: { title: ReactNode; action?: ReactNode; sub?: ReactNode; className?: string }) => (
  <div className={cx('flex items-center justify-between gap-3 px-3.5 py-3 border-b border-line-soft', className)}>
    <div className="min-w-0">
      <div className="text-[13px] font-semibold text-ink truncate-1">{title}</div>
      {sub ? <div className="text-[11px] text-muted mt-0.5">{sub}</div> : null}
    </div>
    {action}
  </div>
);

export const Panel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <Card className={cx('p-3.5', className)}>{children}</Card>
);

export const PanelTitle = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  <div className="flex items-center justify-between gap-3 mb-3">
    <div className="text-[13px] font-semibold text-ink">{children}</div>
    {action}
  </div>
);

/** Page heading block — title, one line of orientation, actions. */
export function PageHead({
  title, sub, actions, className,
}: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex flex-wrap items-end justify-between gap-3 mb-3.5', className)}>
      <div className="min-w-0">
        <h1 className="text-[19px] font-semibold tracking-[-0.3px] text-ink">{title}</h1>
        {sub ? <p className="text-muted text-xs mt-0.5 max-w-[76ch]">{sub}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
    </div>
  );
}

export const Page = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cx('px-4 pt-4 pb-10 sm:px-5 sm:pt-4 md:pb-14', className)}>{children}</div>
);

/* ── data bits ────────────────────────────────────────────────────────────── */

export function Bar({
  pct, tone = 'primary', height = 5, className,
}: { pct: number; tone?: 'primary' | 'info' | 'warn' | 'bad' | 'brand'; height?: number; className?: string }) {
  const fill = {
    primary: 'bg-primary', info: 'bg-viz-2', warn: 'bg-viz-3', bad: 'bg-viz-4', brand: 'bg-brand-bright',
  }[tone];
  return (
    <div
      className={cx('bg-line-soft rounded-[3px] overflow-hidden w-full', className)}
      style={{ height }}
      role="img"
      aria-label={`${Math.round(pct)} percent`}
    >
      <div className={cx('h-full rounded-[3px] transition-[width] duration-300', fill)} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

/** Conic dial. Used for completeness, confidence and score — never combined. */
export function Ring({
  value, label, size = 68, color = 'var(--color-primary)',
}: { value: number; label: string; size?: number; color?: string }) {
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: `conic-gradient(${color} 0 ${value}%, var(--color-line-soft) ${value}%)` }}
      role="img"
      aria-label={`${label}: ${value}%`}
    >
      <div
        className="rounded-full bg-panel flex items-center justify-center num font-semibold text-ink"
        style={{ width: size - 16, height: size - 16, fontSize: size > 60 ? 13 : 11 }}
      >
        {label}
      </div>
    </div>
  );
}

export const Dot = ({ color }: { color: string }) => (
  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} aria-hidden />
);

export function KpiCard({
  label, value, delta, deltaTone = 'mute', note,
}: { label: string; value: string; delta?: string; deltaTone?: Tone; note?: string }) {
  return (
    <Card className="px-3 py-2.5">
      <div className="cap truncate-1">{label}</div>
      <div className="flex items-baseline gap-1.5 mt-1.5 flex-wrap">
        <div className="num text-[19px] font-semibold tracking-[-0.5px] text-ink">{value}</div>
        {delta ? <Pill tone={deltaTone}>{delta}</Pill> : null}
      </div>
      {note ? <div className="text-[10px] text-muted-2 mt-1">{note}</div> : null}
    </Card>
  );
}

export function Avatar({
  initials, size = 26, tone = 'primary',
}: { initials: string; size?: number; tone?: 'primary' | 'soft' }) {
  return (
    <span
      className={cx(
        'rounded-full inline-flex items-center justify-center font-semibold shrink-0',
        tone === 'primary' ? 'bg-primary text-white' : 'bg-primary-soft text-primary-ink',
      )}
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.42) }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export const initialsOf = (name: string) =>
  name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

/* ── form controls ────────────────────────────────────────────────────────── */

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={cx(
        'h-[30px] px-2.5 rounded-md border border-line-strong bg-panel text-xs text-ink',
        'transition-colors duration-150 hover:border-ghost',
        'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15',
        className,
      )}
    />
  );
}

export function Checkbox({
  checked, onChange, label, disabled,
}: { checked: boolean; onChange(): void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={cx(
        'w-[15px] h-[15px] rounded-[3px] border flex items-center justify-center shrink-0',
        'transition-colors duration-150',
        disabled ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer',
        checked ? 'bg-primary border-primary text-white' : 'bg-panel border-ghost hover:border-muted-2',
      )}
    >
      {checked ? <Check size={10} strokeWidth={3.2} /> : null}
    </button>
  );
}

export function RadioRow({
  active, onClick, title, detail, meta,
}: { active: boolean; onClick(): void; title: string; detail: string; meta?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-[7px] border text-left',
        'transition-colors duration-150 cursor-pointer',
        active ? 'border-primary bg-primary-tint' : 'border-line-soft bg-panel hover:border-ghost',
      )}
    >
      <span
        className={cx('w-[13px] h-[13px] rounded-full shrink-0 bg-panel border', active ? 'border-[4px] border-primary' : 'border-ghost')}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-medium text-ink truncate-1">{title}</span>
        <span className="block text-[11px] text-muted truncate-1">{detail}</span>
      </span>
      {meta ? <span className="num text-[12px] text-ink-3 shrink-0">{meta}</span> : null}
    </button>
  );
}

export function Toggle({
  on, onChange, label,
}: { on: boolean; onChange(): void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={cx(
        'w-8 h-[18px] rounded-full p-0.5 flex shrink-0 cursor-pointer',
        'transition-colors duration-150',
        on ? 'bg-primary justify-end' : 'bg-[#dde4e9] justify-start',
      )}
    >
      <span className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
    </button>
  );
}

/* ── tabs ─────────────────────────────────────────────────────────────────── */

export function Tabs({
  tabs, value, onChange, className,
}: { tabs: Array<[string, string]>; value: string; onChange(key: string): void; className?: string }) {
  return (
    <div className={cx('flex items-center gap-1 border-b border-line overflow-x-auto no-scrollbar', className)} role="tablist">
      {tabs.map(([key, label]) => {
        const active = key === value;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={cx(
              'px-2.5 py-2 text-xs whitespace-nowrap cursor-pointer border-b-2 -mb-px',
              'transition-colors duration-150',
              active ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted hover:text-ink-3',
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ── states ───────────────────────────────────────────────────────────────── */

export function EmptyState({
  icon: Icon, title, body, actions,
}: { icon: LucideIcon; title: string; body: string; actions?: ReactNode }) {
  return (
    <div className="flex items-center justify-center py-16 px-6">
      <div className="max-w-[340px] text-center">
        <div className="w-[46px] h-[46px] rounded-xl bg-primary-soft text-primary flex items-center justify-center mx-auto mb-3">
          <Icon size={20} strokeWidth={1.7} />
        </div>
        <div className="text-[15px] font-semibold text-ink">{title}</div>
        <p className="text-xs text-muted mt-1.5 leading-relaxed">{body}</p>
        {actions ? <div className="flex items-center justify-center gap-2 mt-4">{actions}</div> : null}
      </div>
    </div>
  );
}

export function BlockedView({
  title,
  description,
  onNotify,
  onBack,
}: {
  title: string;
  description: string;
  onNotify?(): void;
  onBack?(): void;
}) {
  return (
    <Card className="overflow-hidden border border-line shadow-card">
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-600 flex items-center justify-center mb-4">
          <Lock size={22} strokeWidth={1.8} />
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-700 text-[10.5px] font-semibold mb-2.5">
          <Clock size={11} strokeWidth={2.2} />
          <span>Coming Soon · Content Locked</span>
        </div>
        <h2 className="text-[17px] font-semibold text-ink tracking-[-0.2px] mb-2">
          {title}
        </h2>
        <p className="text-xs text-muted max-w-[440px] leading-relaxed mb-6">
          {description}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {onNotify ? (
            <Button kind="primary" icon={Bell} onClick={onNotify}>
              Notify me on release
            </Button>
          ) : null}
          {onBack ? (
            <Button icon={ArrowLeft} onClick={onBack}>
              Back to Dashboard
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export function ErrorState({
  title, reason, onRetry, secondary,
}: { title: string; reason: string; onRetry?(): void; secondary?: ReactNode }) {
  return (
    <Card className="p-3.5 border-bad-bd bg-bad-bg/40">
      <div className="flex items-start gap-2.5">
        <span className="w-6 h-6 rounded-md bg-bad-bg text-bad-fg flex items-center justify-center shrink-0">
          <AlertTriangle size={13} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-ink">{title}</div>
          <p className="text-xs text-ink-3 mt-1 leading-relaxed">{reason}</p>
          {(onRetry || secondary) ? (
            <div className="flex items-center gap-2 mt-2.5">
              {onRetry ? <Button kind="primary" onClick={onRetry}>Retry</Button> : null}
              {secondary}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export const SkeletonRows = ({ rows = 9 }: { rows?: number }) => (
  <div className="p-3.5" aria-busy="true" aria-live="polite">
    <span className="sr-only">Loading</span>
    {Array.from({ length: rows }, (_, i) => (
      <div
        key={i}
        className="skeleton mb-[7px]"
        style={{ height: i === 0 ? 30 : 38, animationDelay: `${i * 0.08}s` }}
      />
    ))}
  </div>
);

/** A short line that says where a claim came from. Used under cards and rows. */
export const SourceNote = ({ children }: { children: ReactNode }) => (
  <p className="text-[10.5px] text-muted-2 leading-relaxed">{children}</p>
);

/** Compliance / caveat strip — the product's honesty rail (§59, §78). */
export const NoteStrip = ({
  tone = 'mute', icon: Icon, children,
}: { tone?: Tone; icon?: LucideIcon; children: ReactNode }) => (
  <div className={cx('flex items-start gap-2 rounded-[7px] border px-2.5 py-2 text-[11px] leading-relaxed', toneClass[tone])}>
    {Icon ? <Icon size={13} strokeWidth={2} className="shrink-0 mt-px" /> : null}
    <span className="font-normal">{children}</span>
  </div>
);

/* ── overlays ─────────────────────────────────────────────────────────────── */

const OverlayCtx = createContext(false);
export const useInOverlay = () => useContext(OverlayCtx);

/** Escape-to-close, click-outside, focus trapped to the dialog. */
export function Overlay({
  onClose, children, align = 'center', label,
}: { onClose(): void; children: ReactNode; align?: 'center' | 'top' | 'right'; label: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    return () => { window.removeEventListener('keydown', onKey); previous?.focus?.(); };
  }, [onClose]);

  const position = {
    center: 'items-center justify-center p-4',
    top: 'items-start justify-center pt-[12vh] px-4',
    right: 'items-stretch justify-end',
  }[align];

  return (
    <OverlayCtx.Provider value>
      <div className={cx('fixed inset-0 z-50 flex', position)} role="dialog" aria-modal="true" aria-label={label}>
        <div className="absolute inset-0 bg-ink/35 anim-fade" onClick={onClose} aria-hidden />
        <div ref={ref} tabIndex={-1} className="relative outline-none contents">{children}</div>
      </div>
    </OverlayCtx.Provider>
  );
}

export function Modal({
  onClose, title, children, footer, width = 420,
}: { onClose(): void; title: string; children: ReactNode; footer?: ReactNode; width?: number }) {
  return (
    <Overlay onClose={onClose} label={title}>
      <div
        className="relative bg-panel rounded-xl shadow-float p-[18px] w-full anim-rise"
        style={{ maxWidth: width }}
      >
        <div className="text-[15px] font-semibold text-ink pr-6">{title}</div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3.5 right-3.5 w-6 h-6 rounded-md flex items-center justify-center text-muted-2 hover:bg-line-soft hover:text-ink cursor-pointer"
        >
          <X size={14} />
        </button>
        <div className="mt-2">{children}</div>
        {footer ? <div className="flex items-center justify-end gap-2 mt-4">{footer}</div> : null}
      </div>
    </Overlay>
  );
}

/** Screen-reader-only helper for icon-only affordances. */
export const SrOnly = ({ children }: { children: ReactNode }) => (
  <span className="sr-only">{children}</span>
);

export function useAutoId(prefix: string) {
  const id = useId();
  return `${prefix}-${id.replace(/[:]/g, '')}`;
}

export { Logo, LogoIcon, type LogoProps, type LogoIconProps } from './Logo';

