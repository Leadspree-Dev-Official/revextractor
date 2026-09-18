import { useEffect, useState } from 'react';
import { Megaphone, Plug, TriangleAlert } from 'lucide-react';
import { useApp } from '@/lib/store';
import {
  adminOps, demoFreshness,
  type AdminPlan, type AdminSource, type FreshnessPolicy,
} from '@/lib/admin';
import {
  Button, Card, CardHead, Input, NoteStrip, Panel, PanelTitle, Pill, SkeletonRows, Toggle, cx,
} from '@/components/ui';
import { Cell, CellRaw, CellStack, GridRow, GridTable } from '@/components/ui/table';

const planCols = 'minmax(130px,1fr) 92px 96px 76px 92px 108px 108px 110px';
const sourceCols = 'minmax(150px,1.2fr) 104px 88px 92px 104px minmax(150px,1fr)';

/** A number that is edited in place and only written when it actually changes. */
function NumberCell({
  value, onCommit, prefix, width = 74,
}: { value: number; onCommit(next: number): void; prefix?: string; width?: number }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  return (
    <span className="flex items-center gap-0.5">
      {prefix ? <span className="text-[10.5px] text-muted-2">{prefix}</span> : null}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const next = Number(draft.replace(/[^0-9.]/g, ''));
          if (!Number.isFinite(next) || next === value) { setDraft(String(value)); return; }
          onCommit(next);
        }}
        // `code` as well as `key`: numpad Enter reports NumpadEnter, and not
        // every input source populates `key`.
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter') {
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="num text-[11px] h-[26px]"
        style={{ width }}
        aria-label="value"
      />
    </span>
  );
}

/* ── pricing ──────────────────────────────────────────────────────────────── */

export function PlansTab() {
  const { flash, ask } = useApp();
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminOps.plans().then((r) => { setPlans(r.data); setLoading(false); });
  }, []);

  const edit = async (plan: AdminPlan, patch: Partial<AdminPlan>, label: string) => {
    const before = plans;
    setPlans((list) => list.map((p) => (p.id === plan.id ? { ...p, ...patch } : p)));
    const { error } = await adminOps.updatePlan(plan.id, patch);
    if (error) { setPlans(before); flash(error); return; }
    flash(`${plan.label} — ${label}`);
  };

  if (loading) return <Card className="overflow-hidden"><SkeletonRows rows={6} /></Card>;

  return (
    <>
      <NoteStrip tone="warn" icon={TriangleAlert}>
        Editing a plan changes what new subscribers get. Existing ones keep the allowance they were
        sold until you apply it to them — a price change is not a reason to silently move someone's
        credits.
      </NoteStrip>

      <Card className="overflow-hidden mt-3">
        <CardHead title="Plans" sub="What each tier costs and includes" />
        <GridTable
          cols={planCols}
          minWidth={900}
          caption="Plans and pricing"
          head={[
            { label: 'Plan' }, { label: 'Monthly (₹)' }, { label: 'Download limit' }, { label: 'Seats' },
            { label: 'Workspaces' }, { label: 'Credits / mo' }, { label: 'Enrichment' },
            { label: 'Subscribers', align: 'right' },
          ]}
        >
          {plans.map((p) => (
            <GridRow key={p.id} cols={planCols}>
              <CellStack title={p.label} sub={p.id} />
              <CellRaw>
                {p.id === 'enterprise' ? (
                  <span className="text-[11px] font-semibold text-primary">Custom</span>
                ) : (
                  <NumberCell value={p.monthly} prefix="₹" width={68}
                    onCommit={(v) => edit(p, { monthly: v }, `now ₹${v}/mo`)} />
                )}
              </CellRaw>
              <CellRaw>
                <span className="text-[11px] text-ink font-medium truncate-1" title={p.downloadLimit || 'Standard'}>
                  {p.downloadLimit || 'Standard'}
                </span>
              </CellRaw>
              <CellRaw>
                <NumberCell value={p.seats} width={48}
                  onCommit={(v) => edit(p, { seats: v }, `${v} seats`)} />
              </CellRaw>
              <CellRaw>
                <NumberCell value={p.workspaces} width={48}
                  onCommit={(v) => edit(p, { workspaces: v }, `${v} workspaces`)} />
              </CellRaw>
              <CellRaw>
                <NumberCell value={p.extraction} width={80}
                  onCommit={(v) => edit(p, { extraction: v }, `${v} extraction credits`)} />
              </CellRaw>
              <CellRaw>
                <NumberCell value={p.enrichment} width={80}
                  onCommit={(v) => edit(p, { enrichment: v }, `${v} enrichment credits`)} />
              </CellRaw>
              <CellRaw align="right">
                <button
                  type="button"
                  className="text-[11px] text-primary hover:underline cursor-pointer"
                  onClick={() => ask({
                    title: `Apply ${p.label} to its ${p.subscribers} subscribers?`,
                    body: 'Seats, workspace allowance and credit allowances are rewritten to match '
                      + 'the plan as it stands now. Usage is not reset — a plan change is not a new '
                      + 'billing period.',
                    costLabel: 'Workspaces affected', cost: String(p.subscribers),
                    cta: 'Apply to subscribers', done: `${p.label} applied to existing subscribers`,
                    onConfirm: () => void adminOps.applyPlanToSubscribers(p.id),
                  })}
                >
                  {p.subscribers} →
                </button>
              </CellRaw>
            </GridRow>
          ))}
        </GridTable>
      </Card>
    </>
  );
}

/* ── connectors ───────────────────────────────────────────────────────────── */

export function SourcesTab() {
  const { flash, ask } = useApp();
  const [sources, setSources] = useState<AdminSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminOps.sources().then((r) => { setSources(r.data); setLoading(false); });
  }, []);

  const write = async (s: AdminSource, patch: Partial<AdminSource>, call: Promise<{ error: string | null }>, done: string) => {
    const before = sources;
    setSources((list) => list.map((x) => (x.id === s.id ? { ...x, ...patch } : x)));
    const { error } = await call;
    if (error) { setSources(before); flash(error); return; }
    flash(done);
  };

  if (loading) return <Card className="overflow-hidden"><SkeletonRows rows={7} /></Card>;

  return (
    <>
      <NoteStrip tone="info" icon={Plug}>
        Switching a source off stops it platform-wide: <code className="num">claim_next_job()</code>{' '}
        will not hand out work for it, and anything already queued is cancelled. This is the lever
        to pull the afternoon a directory starts blocking us.
      </NoteStrip>

      <Card className="overflow-hidden mt-3">
        <CardHead title="Sources and connectors" sub="What may run, and what may feed the shared pool" />
        <GridTable
          cols={sourceCols}
          minWidth={860}
          caption="Sources"
          head={[
            { label: 'Source' }, { label: 'Category' }, { label: 'Jobs 30d', align: 'right' },
            { label: 'Pool rows', align: 'right' }, { label: 'Contributes', align: 'center' },
            { label: 'Status' },
          ]}
        >
          {sources.map((s) => (
            <GridRow key={s.id} cols={sourceCols}>
              <CellStack title={s.label} sub={s.id} />
              <CellRaw><Pill tone="mute">{s.category}</Pill></CellRaw>
              <Cell mono align="right">{s.jobs30d.toLocaleString('en-IN')}</Cell>
              <Cell mono align="right">{s.poolRows.toLocaleString('en-IN')}</Cell>
              <CellRaw align="center">
                <Toggle
                  on={s.contributable}
                  label={`${s.label} may contribute to the pool`}
                  onChange={() => write(
                    s, { contributable: !s.contributable },
                    adminOps.setSource(s.id, s.enabled, !s.contributable),
                    s.contributable
                      ? `${s.label} no longer feeds the pool`
                      : `${s.label} now feeds the pool`,
                  )}
                />
              </CellRaw>
              <CellRaw>
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    aria-label={s.enabled ? `Disable ${s.label}` : `Enable ${s.label}`}
                    onClick={() => ask({
                      title: s.enabled ? `Switch off ${s.label}?` : `Switch ${s.label} back on?`,
                      body: s.enabled
                        ? 'Workers stop being handed jobs for this source, and everything already '
                          + 'queued for it is cancelled with a notification to the workspace that '
                          + 'queued it. Existing data is untouched.'
                        : 'Workers may claim jobs for this source again from the next poll.',
                      costLabel: 'Queued jobs affected', cost: String(s.jobs30d ? '—' : '0'),
                      cta: s.enabled ? 'Switch off' : 'Switch on',
                      done: s.enabled ? `${s.label} switched off` : `${s.label} switched on`,
                      onConfirm: () => void write(
                        s, { enabled: !s.enabled },
                        adminOps.setSource(s.id, !s.enabled, undefined,
                          'Switched off from the platform console'),
                        s.enabled ? `${s.label} switched off` : `${s.label} switched on`,
                      ),
                    })}
                    className="cursor-pointer shrink-0"
                  >
                    <Pill tone={s.enabled ? 'good' : 'bad'}>{s.enabled ? 'Enabled' : 'Off'}</Pill>
                  </button>
                  {s.disabledReason ? (
                    <span className="text-[10px] text-muted-2 truncate-1">{s.disabledReason}</span>
                  ) : null}
                </div>
              </CellRaw>
            </GridRow>
          ))}
        </GridTable>
      </Card>
    </>
  );
}

/* ── policy and announcements ─────────────────────────────────────────────── */

export function PolicyTab() {
  const { flash, ask } = useApp();
  const [fresh, setFresh] = useState<FreshnessPolicy>(demoFreshness);
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [onlyPaid, setOnlyPaid] = useState(false);

  const commit = async (next: FreshnessPolicy) => {
    const before = fresh;
    setFresh(next);
    const { error } = await adminOps.setFreshness(next);
    if (error) { setFresh(before); flash(error); return; }
    flash('Freshness policy updated — every record is rebanded on next read');
  };

  return (
    <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
      <Panel className="min-w-0">
        <PanelTitle>Freshness policy</PanelTitle>
        <p className="text-[11px] text-muted leading-relaxed mb-3">
          How long a contact method stays believable after it was last proven to work. These
          thresholds decide the band on every record on the platform, and they live in{' '}
          <code className="num">platform_settings</code> precisely so they can be tuned without a
          deploy.
        </p>

        {([
          ['fresh', 'Fresh up to', 'days since last verified'],
          ['recent', 'Recent up to', 'days'],
          ['ageing', 'Ageing up to', 'days, then stale'],
        ] as const).map(([key, label, note]) => (
          <div key={key} className="flex items-center justify-between gap-3 py-2 border-b border-rule last:border-0">
            <div className="min-w-0">
              <div className="text-[11.5px] text-ink">{label}</div>
              <div className="text-[10px] text-muted-2">{note}</div>
            </div>
            <NumberCell
              value={fresh[key]}
              width={72}
              onCommit={(v) => commit({ ...fresh, [key]: v })}
            />
          </div>
        ))}

        <div className="mt-3 rounded-[6px] bg-subtle border border-line-soft px-2.5 py-2">
          <div className="cap mb-1">Reads as</div>
          <div className="text-[10.5px] text-ink-3 leading-relaxed">
            Fresh ≤ {fresh.fresh}d · Recent ≤ {fresh.recent}d · Ageing ≤ {fresh.ageing}d ·
            Stale beyond {Math.round(fresh.ageing / 365)} years
          </div>
        </div>
      </Panel>

      <Panel className="min-w-0">
        <PanelTitle>Announcement</PanelTitle>
        <p className="text-[11px] text-muted leading-relaxed mb-3">
          One message into every active workspace's notifications — where people already look,
          rather than a banner they will dismiss without reading.
        </p>

        <label htmlFor="ann-title" className="cap block mb-1">Title</label>
        <Input
          id="ann-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Scheduled maintenance, Sunday 02:00–04:00 IST"
          className="w-full mb-2.5"
        />

        <label htmlFor="ann-detail" className="cap block mb-1">Detail</label>
        <textarea
          id="ann-detail"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={3}
          placeholder="Extraction jobs will queue rather than fail. Nothing is lost."
          className="w-full px-2.5 py-2 rounded-md border border-line-strong bg-panel text-xs text-ink resize-none focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 mb-2.5"
        />

        <div className="flex items-center justify-between gap-3 py-2 border-t border-rule">
          <span className="text-[11px] text-ink-3">Paying workspaces only</span>
          <Toggle on={onlyPaid} label="Paying workspaces only" onChange={() => setOnlyPaid((v) => !v)} />
        </div>

        <Button
          kind="primary"
          icon={Megaphone}
          className="w-full mt-2"
          disabled={title.trim().length < 3}
          onClick={() => ask({
            title: 'Send this to every active workspace?',
            body: `"${title}" lands in the notification tray of ${onlyPaid ? 'every paying' : 'every active'} workspace immediately. There is no unsend.`,
            costLabel: 'Recipients', cost: onlyPaid ? 'paying only' : 'all active',
            cta: 'Send announcement', done: 'Announcement sent',
            onConfirm: () => {
              void adminOps.broadcast(title, detail, onlyPaid);
              setTitle(''); setDetail('');
            },
          })}
        >
          Send announcement
        </Button>
      </Panel>
    </div>
  );
}

export const opsClasses = cx;
