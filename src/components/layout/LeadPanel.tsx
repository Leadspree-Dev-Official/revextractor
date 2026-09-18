import { useNavigate } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { useApp } from '@/lib/store';
import {
  Avatar, Bar, Button, Overlay, Pill, ProvenancePill, ScorePill, StatusPill, Tabs, initialsOf,
} from '@/components/ui';
import { Timeline } from '@/components/ui/charts';
import type { Provenance } from '@/lib/types';
import { maskEmail, maskPhone } from '@/components/domain/ContactAvailability';

const actions = ['Add to list', 'Enrich', 'Verify', 'Research', 'Email', 'Call', 'Task', 'Export'];

/** §68 — fast-path detail without leaving the table. */
export function LeadPanel() {
  const {
    leads, companies, savedCampaigns, panelLeadId, panelTab, setPanelTab, closePanel, flash, openSaveToCampaign,
  } = useApp();
  const navigate = useNavigate();
  const lead = leads.find((l) => l.id === panelLeadId);
  if (!lead) return null;

  const isSavedInCampaign = savedCampaigns.some((c) =>
    c.leads.some((cl) => cl.leadId === lead.id || (cl.name === lead.name && cl.company === lead.company)),
  );

  const company = companies.find((c) => c.name === lead.company);

  const emailDisplay = isSavedInCampaign
    ? lead.email
    : lead.email
      ? `${maskEmail(lead.email)} (Available in Campaign)`
      : 'Not available';

  const phoneDisplay = isSavedInCampaign
    ? lead.phone
    : lead.phone
      ? `${maskPhone(lead.phone)} (Available in Campaign)`
      : 'Not available';

  const fields: Array<{ label: string; value: string; prov: Provenance }> = [
    { label: 'Email', value: emailDisplay, prov: lead.em === 'Verified' ? 'Verified' : 'Observed' },
    { label: 'Phone', value: phoneDisplay, prov: lead.ph === 'Mobile' || lead.ph === 'Valid' ? 'Verified' : 'Observed' },
    { label: 'LinkedIn', value: `linkedin.com/in/${lead.name.toLowerCase().replace(/ /g, '-')}`, prov: 'Enriched' },
    { label: 'Title', value: lead.title, prov: 'Observed' },
    { label: 'Seniority', value: 'Executive', prov: 'Inferred' },
    { label: 'Location', value: `${lead.city}, ${lead.country}`, prov: 'Observed' },
    { label: 'Source', value: lead.source, prov: 'Observed' },
  ];

  const provenance: Array<{ source: string; prov: Provenance; fields: string; url: string; job: string; date: string }> = [
    { source: lead.source, prov: 'Observed', fields: 'Name, Title, Company, Phone', url: lead.source === 'Google Business' ? 'maps.google.com/place/…' : `${lead.domain}/contact`, job: '#1042', date: `${lead.created} 09:14` },
    { source: 'Website Intelligence', prov: 'Observed', fields: 'Email, Address, Social profiles', url: `${lead.domain}/about`, job: '#1039', date: `${lead.created} 09:22` },
    { source: 'Enrichment Provider', prov: 'Enriched', fields: 'LinkedIn, Employee count, Revenue', url: 'provider-api/v2/person', job: 'enrich_8841', date: '02 Sep 10:02' },
    { source: 'Email Verification', prov: 'Verified', fields: 'Email deliverability', url: 'verify-api/v1/check', job: 'verify_2210', date: '02 Sep 10:03' },
  ];

  const activity = [
    { title: `Discovered via ${lead.source}`, detail: 'Extraction job #1042 · Manufacturers · Kolkata', when: `${lead.created} 09:14` },
    { title: 'Normalized and deduplicated', detail: `Domain normalized to ${lead.domain} · matched to existing company`, when: `${lead.created} 09:15` },
    { title: 'Enriched', detail: '6 fields updated · 1 enrichment credit', when: '02 Sep 10:02' },
    { title: 'Email verified', detail: `${lead.em} · provider response cached 30 d`, when: '02 Sep 10:03' },
    { title: 'Added to sequence', detail: 'SaaS Founders — India · step 1 sent', when: '02 Sep 11:40' },
  ];

  const research = [
    { label: 'Prospect summary', body: `${lead.name} leads ${lead.title.includes('Head') ? 'the growth function' : 'the commercial function'} at ${lead.company}, a ${lead.industry.toLowerCase()} company in ${lead.city}. Public sources indicate a decision-making role over tooling and vendor selection.` },
    { label: 'Company context', body: `${lead.company} publishes hiring pages for sales and operations roles, and its website lists multiple product lines — both consistent with an expansion phase.` },
    { label: 'Suggested talking points', body: `1. Reference their recent hiring in sales operations. 2. Their stack shows a marketing-automation tool but no dedicated prospecting layer. 3. ${lead.city} cluster peers already run multi-source extraction.` },
    { label: 'Confidence note', body: 'Generated from 4 observed sources. No claim here is verified — confirm hiring and stack details before citing them in outreach.' },
  ];

  return (
    <Overlay onClose={closePanel} align="right" label={`${lead.name} details`}>
      <aside className="relative w-full max-w-[430px] bg-panel h-full flex flex-col shadow-float anim-slide">
        <div className="px-4 py-3.5 border-b border-line">
          <div className="flex items-start gap-3">
            <Avatar initials={initialsOf(lead.name)} size={38} />
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-ink truncate-1">{lead.name}</div>
              <div className="text-[11.5px] text-muted truncate-1">{lead.title} · {lead.company}</div>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <ScorePill score={lead.score} />
                <StatusPill status={lead.status} />
                <Pill tone="mute">{lead.sourceCount} sources</Pill>
              </div>
            </div>
            <button
              type="button"
              onClick={closePanel}
              aria-label="Close panel"
              className="w-[26px] h-[26px] rounded-md flex items-center justify-center text-muted-2 hover:bg-line-soft hover:text-ink cursor-pointer shrink-0"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            <Button
              kind="chip"
              onClick={() =>
                openSaveToCampaign([
                  {
                    leadId: lead.id,
                    name: lead.name,
                    title: lead.title,
                    company: lead.company,
                    domain: lead.domain,
                    email: lead.email,
                    phone: lead.phone,
                    city: lead.city,
                    country: lead.country,
                    source: 'Leads',
                    verified: lead.em === 'Verified',
                  },
                ])
              }
            >
              + Save to Campaign
            </Button>
            {actions.map((a) => (
              <Button key={a} kind="chip" onClick={() => flash(`${a} — ${lead.name}`)}>{a}</Button>
            ))}
          </div>
        </div>

        <Tabs
          className="px-3"
          value={panelTab}
          onChange={setPanelTab}
          tabs={[['overview', 'Overview'], ['provenance', 'Provenance'], ['activity', 'Activity'], ['research', 'AI Research']]}
        />

        <div className="flex-1 overflow-y-auto px-4 py-3.5 pb-7" data-slot="scroll">
          {panelTab === 'overview' ? (
            <div>
              <div className="cap mb-1">Contact</div>
              {fields.map((f) => (
                <div key={f.label} className="flex items-center gap-2 py-[7px] border-b border-rule last:border-0">
                  <span className="w-[74px] shrink-0 text-[11px] text-muted">{f.label}</span>
                  <span className="flex-1 min-w-0 text-[12px] text-ink truncate-1">{f.value || '—'}</span>
                  <ProvenancePill prov={f.prov} />
                </div>
              ))}

              <div className="cap mt-4 mb-1.5">Company</div>
              <button
                type="button"
                onClick={() => { closePanel(); navigate(`/companies/${company?.id ?? 1}`); }}
                className="w-full text-left px-2.5 py-2.5 rounded-[7px] border border-line-soft bg-subtle hover:border-primary hover:bg-primary-tint transition-colors duration-150 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-medium text-ink truncate-1">{lead.company}</span>
                  <span className="text-[10px] text-primary shrink-0">Open →</span>
                </div>
                <div className="text-[11px] text-muted mt-0.5 truncate-1">
                  {lead.industry} · {company?.employees ?? '—'} employees · {lead.city}
                </div>
                <div className="num text-[10.5px] text-muted-2 mt-0.5">{lead.domain}</div>
              </button>

              <div className="cap mt-4 mb-1.5">Lists &amp; tags</div>
              <div className="flex flex-wrap gap-1.5">
                {lead.tags.map((t) => <Pill key={t} tone="warn">{t}</Pill>)}
                <Pill tone="mute">{lead.industry}</Pill>
                <Pill tone="info">
                  List: {lead.country === 'India' ? 'Kolkata Manufacturers' : 'Q3 Enterprise Targets'}
                </Pill>
              </div>

              <div className="cap mt-4 mb-1.5">Data completeness</div>
              <div className="flex items-center gap-3">
                <Bar pct={lead.fill} height={6} />
                <span className="num text-[12px] font-semibold text-ink shrink-0">{lead.fill}%</span>
              </div>
              <p className="text-[10.5px] text-muted-2 mt-1.5 leading-relaxed">
                Completeness counts the fields present on this record. It is not the lead score and not a
                confidence figure.
              </p>
            </div>
          ) : null}

          {panelTab === 'provenance' ? (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] text-ink-3 bg-mute-bg border border-mute-bd rounded-[7px] px-2.5 py-2 leading-relaxed">
                Every field records where it came from. LeadBro never blurs{' '}
                <b className="text-mute-fg">observed</b>, <b className="text-warn-fg">inferred</b>,{' '}
                <b className="text-ai-fg">enriched</b>, <b className="text-good-fg">verified</b> and{' '}
                <b className="text-ai-fg">AI generated</b> values.
              </p>
              {provenance.map((p) => (
                <div key={p.source} className="border border-line-soft rounded-[7px] px-2.5 py-2.5">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[12px] font-medium text-ink truncate-1">{p.source}</span>
                    <ProvenancePill prov={p.prov} />
                  </div>
                  <dl className="grid gap-y-1 text-[11px]" style={{ gridTemplateColumns: '74px 1fr' }}>
                    <dt className="text-muted">Fields</dt><dd className="text-ink-3 min-w-0 truncate-1">{p.fields}</dd>
                    <dt className="text-muted">Source URL</dt><dd className="num text-ink-3 min-w-0 truncate-1">{p.url}</dd>
                    <dt className="text-muted">Job</dt><dd className="num text-ink-3">{p.job}</dd>
                    <dt className="text-muted">Discovered</dt><dd className="text-ink-3">{p.date}</dd>
                  </dl>
                </div>
              ))}
            </div>
          ) : null}

          {panelTab === 'activity' ? <Timeline items={activity} /> : null}

          {panelTab === 'research' ? (
            <div>
              <div className="flex items-center gap-1.5 rounded-[7px] border border-ai-bd bg-ai-bg text-ai-fg px-2.5 py-2 text-[11px] font-semibold mb-3">
                <Sparkles size={12} strokeWidth={2.2} />
                AI generated — review before sending
              </div>
              {research.map((r) => (
                <div key={r.label} className="mb-3.5 last:mb-0">
                  <div className="cap mb-1">{r.label}</div>
                  <p className="text-[12px] text-ink-3 leading-relaxed">{r.body}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </aside>
    </Overlay>
  );
}
