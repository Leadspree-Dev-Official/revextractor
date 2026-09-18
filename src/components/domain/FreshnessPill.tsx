import type { Freshness } from '@/lib/types';
import { Pill } from '@/components/ui';
import { freshnessLabel, freshnessMeaning } from '@/lib/pool';
import type { Tone } from '@/lib/types';

const tone: Record<Freshness, Tone> = {
  fresh: 'good', recent: 'info', ageing: 'warn', stale: 'bad', unverified: 'mute',
};

const explain = freshnessMeaning;

/**
 * When a contact method was last proven to work — by a delivery, a connected
 * call, or a verification run. A fact about the record, kept separate from
 * completeness and from score.
 */
export function FreshnessCell({
  date, band, revision,
}: { date: string; band: Freshness; revision?: number }) {
  return (
    <span className="flex flex-col items-end gap-0.5" title={explain[band]}>
      <span className="text-[11px] font-medium text-ink-3 tabular-nums">{date || '—'}</span>
      <span className="flex items-center gap-1">
        <Pill tone={tone[band]}>{freshnessLabel[band]}</Pill>
        {revision && revision > 1 ? (
          <span className="num text-[9.5px] text-muted-2">r{revision}</span>
        ) : null}
      </span>
    </span>
  );
}

export const freshnessTone = tone;
export const freshnessExplain = explain;
