import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, TriangleAlert } from 'lucide-react';
import { useApp } from '@/lib/store';
import {
  Bar, Button, Card, CardHead, ErrorState, Page, Panel, PanelTitle, StatusPill,
} from '@/components/ui';
import { Cell, CellRaw, GridRow, GridTable } from '@/components/ui/table';

const rawCols = '96px minmax(220px,1fr) 130px 104px';

const rawRecords: Array<[string, string, string, string]> = [
  ['gb_8841f2', '{"name":"Bansal Polymers","rating":4.3,"phone":"+913340128890"…', 'maps.google.com/…', 'Completed'],
  ['gb_8841f3', '{"name":"Kalinga Steel Works","category":"Steel Fabricator"…', 'maps.google.com/…', 'Completed'],
  ['gb_8841f4', '{"name":"Sunrise Textiles","website":"sunrisetex.in"…', 'maps.google.com/…', 'Completed'],
  ['gb_8841f5', '{"name":"—","phone":null,"website":null…', 'maps.google.com/…', 'Invalid'],
  ['gb_8841f6', '{"name":"Zentro Interiors","address":"Baner, Pune"…', 'maps.google.com/…', 'Queued'],
  ['gb_8841f7', '{"name":"ABC Technologies Pvt Ltd","phone":"+913322874410"…', 'maps.google.com/…', 'Needs review'],
];

const stateLabels: Record<string, string> = {
  Completed: 'Processed', Invalid: 'Rejected', Queued: 'Queued', 'Needs review': 'Needs review',
};

export default function JobDetail() {
  const { id } = useParams();
  const { jobs, flash, openSaveToCampaign } = useApp();
  const navigate = useNavigate();

  const job = jobs.find((j) => String(j.id) === id) ?? jobs[0]!;
  const rate = (n: number) => (job.found ? Math.round((n / job.found) * 100) : 0);
  const failed = job.status === 'Failed';

  const handleSaveToCampaign = () => {
    const items = [
      { name: 'Bansal Polymers', title: 'Director', company: 'Bansal Polymers', phone: '+91 33 4012 8890', city: job.location, country: 'India', source: 'Extraction' as const, verified: true },
      { name: 'Kalinga Steel Works', title: 'Managing Director', company: 'Kalinga Steel Works', city: job.location, country: 'India', source: 'Extraction' as const, verified: true },
      { name: 'Sunrise Textiles', title: 'Owner', company: 'Sunrise Textiles', domain: 'sunrisetex.in', city: job.location, country: 'India', source: 'Extraction' as const, verified: true },
      { name: 'Zentro Interiors', title: 'Founder', company: 'Zentro Interiors', city: job.location, country: 'India', source: 'Extraction' as const, verified: false },
      { name: 'ABC Technologies', title: 'CEO', company: 'ABC Technologies Pvt Ltd', phone: '+91 33 2287 4410', city: job.location, country: 'India', source: 'Extraction' as const, verified: true },
    ];
    openSaveToCampaign(items);
  };

  const stats = [
    { label: 'Requested', value: job.requested.toLocaleString(), note: 'limit set at start', color: 'var(--color-ink)' },
    { label: 'Found', value: job.found.toLocaleString(), note: `${rate(job.found)}% of requested`, color: 'var(--color-ink)' },
    { label: 'New', value: job.new.toLocaleString(), note: 'written to database', color: 'var(--color-primary)' },
    { label: 'Duplicates', value: job.dup.toLocaleString(), note: 'merged into existing', color: 'var(--color-warn-fg)' },
    { label: 'Invalid', value: job.invalid.toLocaleString(), note: 'failed normalization', color: 'var(--color-bad-fg)' },
    { label: 'Credits used', value: job.found.toLocaleString(), note: '1 per found record', color: 'var(--color-ink)' },
  ];

  const breakdown = [
    { label: 'Normalized cleanly', value: job.new + job.dup, note: 'phones to E.164, domains stripped to root', pct: rate(job.new + job.dup), tone: 'primary' as const },
    { label: 'Matched to existing company', value: job.dup, note: 'entity resolution confidence ≥ 85%', pct: rate(job.dup), tone: 'info' as const },
    { label: 'Needs review', value: 41, note: 'confidence 60–85% — queued in Duplicates', pct: 5, tone: 'warn' as const },
    { label: 'Rejected', value: job.invalid, note: 'no usable contact or identity field', pct: rate(job.invalid), tone: 'bad' as const },
  ];

  return (
    <Page>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/extraction')}
              className="flex items-center gap-1 text-[11px] text-muted hover:text-primary cursor-pointer"
            >
              <ArrowLeft size={12} /> Extraction Center
            </button>
            <h1 className="text-[19px] font-semibold tracking-[-0.3px] text-ink">Extraction {job.code}</h1>
            <StatusPill status={job.status} />
          </div>
          <p className="text-xs text-muted mt-1">
            {job.source} · “{job.query}” · {job.location} · started {job.started} · {job.duration}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={() => flash(failed ? `Retrying job ${job.code}` : `Job ${job.code} duplicated as draft`)}>
            {failed ? 'Retry' : 'Duplicate job'}
          </Button>
          <Button kind="primary" icon={Plus} onClick={handleSaveToCampaign}>
            Save {job.new.toLocaleString()} leads to Campaign
          </Button>
        </div>
      </div>

      {failed ? (
        <div className="mb-3">
          <ErrorState
            title="Extraction failed"
            reason="We couldn't complete this extraction. Reason: source connection unavailable after 3 retries. No credits were charged and no partial records were written."
            onRetry={() => flash(`Retrying job ${job.code}`)}
            secondary={<Button onClick={() => navigate('/integrations')}>Check source status</Button>}
          />
        </div>
      ) : null}

      <div className="grid gap-2.5 mb-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <Card key={s.label} className="px-3 py-2.5">
            <div className="cap truncate-1">{s.label}</div>
            <div className="num text-[19px] font-semibold mt-1 tracking-[-0.5px]" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-muted-2 mt-0.5 truncate-1">{s.note}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 grid-cols-1 lg:grid-cols-[1fr_1.35fr]">
        <Panel>
          <PanelTitle>Processing breakdown</PanelTitle>
          <div className="flex flex-col gap-3">
            {breakdown.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between gap-2 text-[11.5px] mb-1">
                  <span className="text-ink-3">{b.label}</span>
                  <span className="num text-ink font-medium">{b.value.toLocaleString()}</span>
                </div>
                <Bar pct={b.pct} height={6} tone={b.tone} />
                <p className="text-[10px] text-muted-2 mt-1">{b.note}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Card className="overflow-hidden">
          <CardHead title="Raw source records" sub="Stored independently — reprocess without re-extracting" />
          <GridTable
            cols={rawCols}
            minWidth={680}
            caption="Raw source records"
            head={[{ label: 'Source ID' }, { label: 'Payload snippet' }, { label: 'Source URL' }, { label: 'State', align: 'right' }]}
          >
            {rawRecords.map(([sid, payload, url, state]) => (
              <GridRow key={sid} cols={rawCols} dense>
                <Cell mono>{sid}</Cell>
                <Cell mono className="text-[10.5px]">{payload}</Cell>
                <Cell mono>{url}</Cell>
                <CellRaw align="right">
                  <StatusPill status={state} />
                  <span className="sr-only">{stateLabels[state]}</span>
                </CellRaw>
              </GridRow>
            ))}
          </GridTable>
          <p className="flex items-start gap-2 px-3.5 py-2.5 text-[10.5px] text-muted border-t border-rule bg-subtle">
            <TriangleAlert size={12} className="text-warn-fg shrink-0 mt-px" />
            Raw payloads keep their original shape. Reprocessing replays normalization without spending
            extraction credits again.
          </p>
        </Card>
      </div>
    </Page>
  );
}
