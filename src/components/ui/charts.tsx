import type { ReactNode } from 'react';
import { cx } from './index';

/**
 * Small chart kit, drawn in DOM rather than pulled from a library so the whole
 * product shares one visual language for data. All series colours come from the
 * --color-viz-* ramp.
 */

export function ColumnChart({
  data, height = 130, highlightLast = true,
}: {
  data: Array<{ label: string; value: string; pct: number }>;
  height?: number;
  highlightLast?: boolean;
}) {
  return (
    <div className="flex items-end gap-1.5" style={{ height }} role="img" aria-label="Column chart">
      {data.map((d, i) => {
        const last = highlightLast && i === data.length - 1;
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end min-w-0 group">
            <span className="num text-[9px] text-muted-2 whitespace-nowrap hidden sm:block">{d.value}</span>
            <div
              className={cx(
                'w-full rounded-t-[3px] transition-opacity duration-150 group-hover:opacity-75',
                last ? 'bg-viz-1' : 'bg-viz-5',
              )}
              style={{ height: `${d.pct}%` }}
              title={`${d.label}: ${d.value}`}
            />
            <span className="text-[9px] text-muted-2 truncate-1 w-full text-center">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function BreakdownList({
  rows, tone = 'primary',
}: {
  rows: Array<{ label: string; value: string; pct: number }>;
  tone?: 'primary' | 'graded';
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r) => {
        const color = tone === 'graded'
          ? (r.pct > 70 ? 'bg-viz-1' : r.pct > 50 ? 'bg-viz-2' : 'bg-viz-3')
          : 'bg-viz-1';
        return (
          <div key={r.label}>
            <div className="flex justify-between gap-2 text-[11px] mb-1">
              <span className="text-ink-3 truncate-1">{r.label}</span>
              <span className="num text-muted shrink-0">{r.value}</span>
            </div>
            <div className="h-[5px] bg-line-soft rounded-[3px] overflow-hidden">
              <div className={cx('h-full rounded-[3px]', color)} style={{ width: `${r.pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FunnelList({
  rows, onRowClick,
}: {
  rows: Array<{ label: string; value: string; pct: number }>;
  onRowClick?(): void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <button
          key={r.label}
          type="button"
          onClick={onRowClick}
          className="text-left cursor-pointer group"
        >
          <div className="flex justify-between gap-2 text-[11px] mb-1">
            <span className="text-ink-3 group-hover:text-ink">{r.label}</span>
            <span className="num text-ink font-medium">{r.value}</span>
          </div>
          <div
            className="h-4 rounded-[3px] transition-opacity duration-150 group-hover:opacity-85"
            style={{ width: `${r.pct}%`, background: 'linear-gradient(90deg,#0F766E,#2DD4BF)' }}
          />
        </button>
      ))}
    </div>
  );
}

/** Segmented bar used by verification status distributions. */
export function SegmentBar({ segments }: { segments: Array<{ color: string; pct: number; label: string }> }) {
  return (
    <div className="flex h-2 rounded-[3px] overflow-hidden mb-3.5" role="img" aria-label="Status distribution">
      {segments.map((s) => (
        <div key={s.label} style={{ width: `${s.pct}%`, background: s.color }} title={`${s.label} ${s.pct}%`} />
      ))}
    </div>
  );
}

/** Vertical timeline used by activity feeds. */
export function Timeline({ items }: { items: Array<{ title: string; detail: string; when: string }> }) {
  return (
    <div>
      {items.map((a, i) => (
        <div key={`${a.title}-${i}`} className="flex gap-3">
          <div className="flex flex-col items-center w-5 shrink-0 pt-1">
            <span className="w-[7px] h-[7px] rounded-full bg-primary shrink-0" aria-hidden />
            {i < items.length - 1 ? <span className="w-px flex-1 bg-line my-1" aria-hidden /> : null}
          </div>
          <div className={cx('min-w-0', i < items.length - 1 && 'pb-4')}>
            <div className="text-[12px] font-medium text-ink">{a.title}</div>
            <div className="text-[11px] text-muted mt-0.5 leading-relaxed">{a.detail}</div>
            <div className="num text-[10px] text-muted-2 mt-1">{a.when}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export const Legend = ({ items }: { items: Array<{ label: string; value: string; color: string }> }) => (
  <div className="flex flex-col gap-1 min-w-0">
    {items.map((l) => (
      <div key={l.label} className="flex items-center gap-2 py-0.5">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: l.color }} aria-hidden />
        <span className="text-[11px] text-ink-3 truncate-1 flex-1">{l.label}</span>
        <span className="num text-[11px] text-muted shrink-0">{l.value}</span>
      </div>
    ))}
  </div>
);

export const StatGrid = ({ children, cols = 4 }: { children: ReactNode; cols?: number }) => (
  <div className="grid divide-x divide-line-soft" style={{ gridTemplateColumns: `repeat(${cols},minmax(0,1fr))` }}>
    {children}
  </div>
);

export const StatCell = ({
  label, value, note, color,
}: { label: string; value: string; note?: string; color?: string }) => (
  <div className="px-3.5 py-3 min-w-0">
    <div className="cap truncate-1">{label}</div>
    <div className="num text-[17px] font-semibold mt-1 tracking-[-0.4px]" style={{ color: color ?? 'var(--color-ink)' }}>
      {value}
    </div>
    {note ? <div className="text-[10px] text-muted-2 mt-0.5 truncate-1">{note}</div> : null}
  </div>
);
