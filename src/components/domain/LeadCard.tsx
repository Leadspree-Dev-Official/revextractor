import { MapPin } from 'lucide-react';
import type { Lead } from '@/lib/types';
import {
  Avatar, Button, Card, Checkbox, Pill, StatusPill, initialsOf, scoreBand,
} from '@/components/ui';
import { EmailAvailability, PhoneAvailability } from '@/components/domain/ContactAvailability';

/**
 * §60 — below the table breakpoint a lead is a card, not a squeezed row.
 * Same record, same vocabulary, laid out for a thumb.
 */
export function LeadCard({
  lead, onOpen, selected, onToggle, actions,
}: {
  lead: Lead;
  onOpen(): void;
  selected?: boolean;
  onToggle?(): void;
  actions?: Array<{ label: string; run(): void }>;
}) {
  return (
    <Card className="overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
        className="px-3 py-3 cursor-pointer text-left w-full"
      >
        <div className="flex items-start gap-2.5">
          {onToggle ? (
            <span className="pt-0.5">
              <Checkbox checked={Boolean(selected)} onChange={onToggle} label={`Select ${lead.name}`} />
            </span>
          ) : (
            <Avatar initials={initialsOf(lead.name)} size={30} tone="soft" />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold text-ink truncate-1">{lead.name}</div>
            <div className="text-[11.5px] text-muted truncate-1">{lead.title}</div>
            <div className="text-[11.5px] text-ink-3 truncate-1">{lead.company}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="num text-[16px] font-semibold text-ink leading-none">{lead.score}</div>
            <div className="text-[9.5px] text-muted-2 mt-1">{scoreBand(lead.score)}</div>
          </div>
        </div>

        <dl className="flex flex-col gap-1 mt-2.5 text-[11.5px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <dd className="truncate-1">
              <EmailAvailability available={Boolean(lead.email)} />
            </dd>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <dd className="truncate-1">
              <PhoneAvailability available={Boolean(lead.phone)} />
            </dd>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <dt className="shrink-0"><MapPin size={11} className="text-muted-2" strokeWidth={1.9} /><span className="sr-only">Location</span></dt>
            <dd className="text-ink-3 truncate-1">{lead.city}, {lead.country}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-t border-rule bg-subtle">
        <StatusPill status={lead.em} />
        <StatusPill status={lead.status} />
        <Pill tone="mute">{lead.source}</Pill>
        <div className="flex items-center gap-1.5 ml-auto">
          {actions?.map((a) => (
            <Button key={a.label} kind="chip" onClick={(e) => { e.stopPropagation(); a.run(); }}>
              {a.label}
            </Button>
          ))}
          <Button kind="primary" className="h-[26px] px-2.5" onClick={onOpen}>View</Button>
        </div>
      </div>
    </Card>
  );
}
