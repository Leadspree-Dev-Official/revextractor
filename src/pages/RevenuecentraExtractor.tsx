import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Code2, Crosshair, Database, FileText, FormInput, Globe, Layers, Package, Search, Ship, ShieldCheck,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { demoSources } from '@/lib/demo';
import {
  Bar, Button, Card, CardHead, FilterChip, NoteStrip, Page, PageHead, Panel, PanelTitle, Pill, StatusPill, cx,
} from '@/components/ui';
import { Cell, CellRaw, GridRow, GridTable } from '@/components/ui/table';

const iconFor: Record<string, typeof Crosshair> = {
  crosshair: Crosshair, search: Search, globe: Globe, building: Building2, package: Package,
  ship: Ship, file: FileText, form: FormInput, code: Code2, database: Database,
};

interface Config {
  subtitle: string;
  cost: string;
  fields: Array<[string, string, string]>;
  out: string[];
}

const configs: Record<string, Config> = {
  'Google Business': {
    subtitle: 'Places-style business discovery by keyword, category and area',
    cost: '500',
    fields: [
      ['Search keyword', 'Digital marketing agencies', 'Required'],
      ['Category', 'Marketing Agency', 'Optional — narrows results'],
      ['Location', 'Kolkata', 'City, state or coordinates'],
      ['Country', 'India', 'ISO country'],
      ['Radius', '25 km', 'Where the source supports it'],
      ['Result limit', '500', '1 credit per record'],
    ],
    out: ['Business name', 'Category', 'Address', 'Phone', 'Website', 'Maps URL', 'Rating', 'Reviews', 'Hours', 'Description', 'Location', 'Source URL'],
  },
  'Google Search': {
    subtitle: 'Query-level discovery that feeds the Website Intelligence engine',
    cost: '500',
    fields: [
      ['Search query', 'manufacturers in Kolkata', 'Required'],
      ['Country', 'India', 'Localises results'],
      ['Language', 'English', 'Result language'],
      ['Result limit', '500', '1 credit per record'],
      ['Auto-crawl domains', 'On', 'Sends URLs to Website engine'],
      ['Exclude directories', 'Off', 'Skip aggregator domains'],
    ],
    out: ['Title', 'URL', 'Domain', 'Snippet', 'Position', 'Query', 'Source URL'],
  },
};

const pipeline: Array<[string, string, string]> = [
  ['1', 'Extract', 'raw payload stored per record'],
  ['2', 'Normalize', 'domains, phones, emails, addresses'],
  ['3', 'Deduplicate', 'against 3.4K companies, 14.2K leads'],
  ['4', 'Resolve entity', 'domain + phone + name similarity'],
  ['5', 'Score', 'configurable signal weights'],
  ['6', 'Notify', 'job summary + new record count'],
];

const jobCols = '70px 108px minmax(160px,1fr) 132px 78px 78px 68px 68px 132px';
const jobFilters = ['All', 'Running', 'Completed', 'Partially Completed', 'Failed', 'Queued', 'Draft'];

const excludedSources = new Set(['Website Intelligence', 'IndiaMART']);
const sources = demoSources.filter((s) => !excludedSources.has(s.name));

export default function RevenuecentraExtractor() {
  const { jobs, flash, ask, deductCredits, totalSpendableCredits } = useApp();
  const navigate = useNavigate();
  const [active, setActive] = useState('Google Business');
  const [jobFilter, setJobFilter] = useState('All');

  const source = sources.find((s) => s.name === active) || sources[0];
  const cfg = configs[active];
  const jobRows = jobs.filter((j) => jobFilter === 'All' || j.status === jobFilter);

  return (
    <Page>
      <PageHead
        title="Revenuecentra Extractor"
        sub="Configure extraction sources and monitor live scraping, normalization, and deduplication jobs."
        actions={
          <Button onClick={() => {
            const el = document.getElementById('extraction-jobs');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}>
            View jobs ({jobs.length})
          </Button>
        }
      />

      <div className="grid gap-2.5 mb-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {sources.map((s) => {
          const Icon = iconFor[s.icon] ?? Database;
          const selected = active === s.name;
          return (
            <button
              key={s.name}
              type="button"
              onClick={() => setActive(s.name)}
              aria-pressed={selected}
              className={cx(
                'text-left bg-panel border rounded-lg shadow-card px-3 py-3 cursor-pointer',
                'transition-colors duration-150',
                selected ? 'border-primary ring-[3px] ring-primary/10' : 'border-line hover:border-ghost',
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="w-[26px] h-[26px] rounded-md bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <Icon size={13} strokeWidth={1.9} />
                </span>
                <StatusPill status={s.status} />
              </div>
              <div className="text-[12.5px] font-semibold text-ink truncate-1">{s.name}</div>
              <div className="text-[10.5px] text-muted leading-snug mt-0.5 line-clamp-2">{s.desc}</div>
              <div className="num text-[10px] text-muted-2 mt-1.5">{s.records}</div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 grid-cols-1 lg:grid-cols-[1.15fr_1fr]">
        <Card>
          <CardHead
            title={source.name}
            sub={cfg ? cfg.subtitle : 'Connect this source to configure extraction'}
            action={<StatusPill status={source.status} />}
          />
          <div className="px-3.5 py-3.5">
            {!cfg ? (
              <div className="py-3">
                <p className="text-xs text-ink-3 max-w-[420px] leading-relaxed">
                  {source.status === 'Coming Soon'
                    ? 'This connector is on the roadmap. The adapter contract, job screens and provenance model already exist — only the provider call is missing.'
                    : 'This source needs credentials before it can run. Add an API key in Integrations and the configuration form appears here.'}
                </p>
                <div className="flex items-center gap-2 mt-3.5">
                  <Button kind="primary" onClick={() => flash(`Opening credential setup for ${source.name}`)}>
                    {source.status === 'Coming Soon' ? 'Notify me' : 'Add API key'}
                  </Button>
                  <Button onClick={() => navigate('/integrations')}>Open integrations</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {cfg.fields.map(([label, value, hint], i) => (
                    <div key={label} className={i === 0 ? 'sm:col-span-2' : ''}>
                      <label className="cap block mb-1" htmlFor={`cfg-${i}`}>{label}</label>
                      <div
                        id={`cfg-${i}`}
                        className="h-[30px] px-2.5 flex items-center rounded-md border border-line-strong bg-wash text-xs text-ink truncate-1"
                      >
                        {value}
                      </div>
                      <p className="text-[10px] text-muted-2 mt-1">{hint}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <Button
                    kind="primary"
                    onClick={() => {
                      const costNum = Number(cfg.cost) || 500;
                      if (totalSpendableCredits < costNum) {
                        ask({
                          title: 'Insufficient credits in wallet',
                          body: `This extraction requires ${costNum} credits, but your current balance is ${totalSpendableCredits} credits. Please top up your wallet to proceed.`,
                          costLabel: 'Credits needed',
                          cost: `${costNum - totalSpendableCredits} more`,
                          cta: 'Go to Wallet',
                          done: 'Opening wallet…',
                          onConfirm: () => navigate('/wallet'),
                        });
                        return;
                      }

                      ask({
                        title: `Start extraction on ${source.name}?`,
                        body: 'A job is created immediately. Records are normalized and deduplicated before they reach your database — duplicates do not consume credits twice.',
                        costLabel: 'Extraction credits reserved',
                        cost: cfg.cost,
                        cta: 'Start job',
                        done: `Job #1043 queued — ${source.name} (${cfg.cost} credits reserved)`,
                        onConfirm: () => {
                          deductCredits(costNum, `Extraction · ${source.name} · ${costNum} records`, `ext_${Date.now().toString(36)}`);
                        },
                      });
                    }}
                  >
                    Start extraction
                  </Button>
                  <Button onClick={() => flash('Configuration valid · 1 sample record returned · no credits used')}>
                    Validate only
                  </Button>
                  <span className="text-[11px] text-muted ml-auto">
                    Reserves <span className="num text-ink font-medium">{cfg.cost}</span> extraction credits
                  </span>
                </div>
              </>
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Card>
            <CardHead title="Fields this source returns" action={<Pill tone="mute">Observed only</Pill>} />
            <div className="px-3.5 py-3">
              <div className="flex flex-wrap gap-1.5">
                {(cfg?.out ?? ['Connect the source to see its field list']).map((f) => (
                  <Pill key={f} tone="mute">{f}</Pill>
                ))}
              </div>
            </div>
          </Card>

          <Panel>
            <PanelTitle>Pipeline preview</PanelTitle>
            <ol className="flex flex-col gap-2">
              {pipeline.map(([n, label, detail]) => (
                <li key={n} className="flex items-center gap-2.5">
                  <span className="num w-[18px] h-[18px] rounded bg-primary-soft text-primary-ink text-[10px] font-semibold flex items-center justify-center shrink-0">
                    {n}
                  </span>
                  <span className="text-[12px] font-medium text-ink w-[92px] shrink-0">{label}</span>
                  <span className="text-[11px] text-muted min-w-0 truncate-1">{detail}</span>
                </li>
              ))}
            </ol>
          </Panel>

          <NoteStrip tone="mute" icon={ShieldCheck}>
            Only publicly accessible or licensed data, retrieved through permitted access. No login, paywall,
            CAPTCHA or access-control bypass — ever.
          </NoteStrip>
        </div>
      </div>

      {/* Embedded Extraction Jobs Section */}
      <div id="extraction-jobs" className="mt-7 pt-5 border-t border-line scroll-mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-[13px] font-semibold text-ink flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-primary-soft text-primary flex items-center justify-center">
                <Layers size={12} strokeWidth={2.2} />
              </span>
              <span>Extraction Jobs</span>
              <span className="num text-[10px] font-medium text-primary bg-primary-soft rounded-full px-2 py-0.5">
                {jobs.length}
              </span>
            </h2>
            <p className="text-[11px] text-muted mt-0.5">
              Live status, progress, and normalization metrics for recent extraction runs. Click any row to view details.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {jobFilters.map((f) => (
              <FilterChip key={f} active={jobFilter === f} onClick={() => setJobFilter(f)}>
                {f}
              </FilterChip>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden">
          <GridTable
            cols={jobCols}
            minWidth={1080}
            caption="Extraction jobs"
            head={[
              { label: 'Job' }, { label: 'Source' }, { label: 'Query' }, { label: 'Location' },
              { label: 'Requested', align: 'right' }, { label: 'Found', align: 'right' },
              { label: 'New', align: 'right' }, { label: 'Dupes', align: 'right' },
              { label: 'Status', align: 'right' },
            ]}
          >
            {jobRows.map((j) => (
              <GridRow key={j.id} cols={jobCols} onClick={() => navigate(`/jobs/${j.id}`)}>
                <Cell mono>{j.code}</Cell>
                <Cell>{j.source}</Cell>
                <div role="cell" className="px-3.5 flex flex-col justify-center min-w-0 gap-1">
                  <span className="text-[12px] text-ink truncate-1">{j.query}</span>
                  <Bar
                    pct={j.progress}
                    height={3}
                    className="max-w-[150px]"
                    tone={j.status === 'Failed' ? 'bad' : j.status === 'Running' ? 'info' : 'primary'}
                  />
                </div>
                <Cell>{j.location}</Cell>
                <Cell mono align="right">{j.requested.toLocaleString()}</Cell>
                <Cell mono align="right">{j.found.toLocaleString()}</Cell>
                <Cell mono align="right">{j.new.toLocaleString()}</Cell>
                <Cell mono align="right">{j.dup.toLocaleString()}</Cell>
                <CellRaw align="right"><StatusPill status={j.status} /></CellRaw>
              </GridRow>
            ))}
          </GridTable>
          {jobRows.length === 0 ? (
            <p className="px-3.5 py-8 text-center text-xs text-muted">No jobs with status “{jobFilter}”.</p>
          ) : null}
        </Card>
      </div>
    </Page>
  );
}
