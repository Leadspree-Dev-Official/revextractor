import { supabase, isLive } from './supabase';
import { demoCompanies, demoDeals, demoJobs, demoLeads, demoTasks } from './demo';
import type { Company, Deal, DealStage, ExtractionJob, Lead, Task } from './types';

/**
 * One data-access seam for the whole app.
 *
 * Live  → Supabase, scoped by RLS to the caller's workspace (supabase/schema.sql).
 * Demo  → the seeded workspace in demo.ts.
 *
 * Every call returns the same shape either way, so no screen needs to know which
 * mode it is running in.
 */

export interface RepoResult<T> {
  data: T;
  /** null when the read succeeded; a human-readable problem when it did not */
  error: string | null;
  live: boolean;
}

const ok = <T,>(data: T): RepoResult<T> => ({ data, error: null, live: isLive });
const failed = <T,>(fallback: T, error: unknown): RepoResult<T> => ({
  data: fallback,
  error: error instanceof Error ? error.message : String(error),
  live: isLive,
});

/** Maps a leads row from Postgres snake_case into the app's Lead shape. */
/* eslint-disable @typescript-eslint/no-explicit-any */
const toLead = (r: any, i: number): Lead => ({
  id: r.id ?? i + 1,
  name: [r.first_name, r.last_name].filter(Boolean).join(' ') || r.name || 'Unknown',
  title: r.job_title ?? '',
  company: r.company_name ?? '',
  domain: r.domain ?? '',
  email: r.email ?? '',
  phone: r.phone ?? '',
  city: r.city ?? '',
  country: r.country ?? '',
  industry: r.industry ?? '',
  score: r.score ?? 0,
  em: r.email_status ?? 'Unknown',
  ph: r.phone_status ?? 'Unknown',
  source: r.source ?? 'API',
  status: r.status ?? 'New',
  tags: r.tags ?? [],
  created: r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '',
  sourceCount: r.source_count ?? 1,
  fill: r.completeness ?? 0,
});

const toCompany = (r: any, i: number): Company => ({
  id: r.id ?? i + 1,
  name: r.name ?? '',
  domain: r.domain ?? '',
  industry: r.industry ?? '',
  city: r.city ?? '',
  country: r.country ?? '',
  employees: r.employee_count != null ? String(r.employee_count) : '—',
  revenue: r.revenue ?? '—',
  founded: r.founded_year != null ? String(r.founded_year) : '—',
  phone: r.phone ?? '',
  email: r.email ?? '',
  sources: r.sources ?? [],
  tech: r.technologies ?? [],
  contacts: r.contact_count ?? 0,
  score: r.score ?? 0,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

export const repo = {
  async leads(): Promise<RepoResult<Lead[]>> {
    if (!supabase) return ok(demoLeads);
    try {
      const { data, error } = await supabase
        .from('leads').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) throw error;
      return ok((data ?? []).map(toLead));
    } catch (e) {
      return failed(demoLeads, e);
    }
  },

  async companies(): Promise<RepoResult<Company[]>> {
    if (!supabase) return ok(demoCompanies);
    try {
      const { data, error } = await supabase.from('companies').select('*').limit(200);
      if (error) throw error;
      return ok((data ?? []).map(toCompany));
    } catch (e) {
      return failed(demoCompanies, e);
    }
  },

  async jobs(): Promise<RepoResult<ExtractionJob[]>> {
    if (!supabase) return ok(demoJobs);
    try {
      const { data, error } = await supabase
        .from('extraction_jobs').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      return ok((data ?? []).map((r: any, i: number): ExtractionJob => ({
        id: r.id ?? 1042 - i,
        code: r.code ?? `#${r.id}`,
        source: r.source ?? '',
        query: r.query ?? '',
        location: r.location ?? '—',
        requested: r.requested ?? 0,
        found: r.found ?? 0,
        new: r.new_records ?? 0,
        dup: r.duplicate_records ?? 0,
        invalid: r.invalid_records ?? 0,
        status: r.status ?? 'Queued',
        progress: r.progress ?? 0,
        started: r.started_at ?? '',
        duration: r.duration ?? '—',
      })));
    } catch (e) {
      return failed(demoJobs, e);
    }
  },

  async deals(): Promise<RepoResult<Deal[]>> {
    if (!supabase) return ok(demoDeals);
    try {
      const { data, error } = await supabase
        .from('deals').select('*').order('expected_close').limit(200);
      if (error) throw error;
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      return ok((data ?? []).map((r: any, i: number): Deal => ({
        id: r.id ?? i + 1,
        name: r.name ?? '',
        company: r.company_name ?? '—',
        contact: r.contact_name ?? '—',
        amount: Number(r.value_amount ?? 0),
        currency: (r.value_currency ?? 'USD') as Deal['currency'],
        stage: (r.stage ?? 'New') as DealStage,
        probability: r.probability ?? 0,
        close: r.expected_close
          ? new Date(r.expected_close).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
          : '—',
        owner: r.owner_initials ?? '—',
      })));
    } catch (e) {
      return failed(demoDeals, e);
    }
  },

  async tasks(): Promise<RepoResult<Task[]>> {
    if (!supabase) return ok(demoTasks);
    try {
      const { data, error } = await supabase.from('tasks').select('*').order('due_at').limit(100);
      if (error) throw error;
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      return ok((data ?? []).map((r: any, i: number): Task => ({
        id: r.id ?? i + 1,
        task: r.title ?? '',
        lead: r.lead_name ?? '—',
        kind: r.kind ?? 'Follow-up',
        due: r.due_label ?? '',
        priority: r.priority ?? 'Medium',
        owner: r.owner_initials ?? '—',
        done: r.status === 'done',
      })));
    } catch (e) {
      return failed(demoTasks, e);
    }
  },

  /* ── writes ─────────────────────────────────────────────────────────────── */

  async updateLead(id: number, patch: Partial<Lead>): Promise<{ error: string | null }> {
    if (!supabase) return { error: null };
    const row: Record<string, unknown> = {};
    if (patch.status) row.status = patch.status;
    if (patch.tags) row.tags = patch.tags;
    if (patch.score != null) row.score = patch.score;
    if (patch.em) row.email_status = patch.em;
    if (patch.ph) row.phone_status = patch.ph;
    const { error } = await supabase.from('leads').update(row).eq('id', id);
    return { error: error?.message ?? null };
  },

  async archiveLeads(ids: number[]): Promise<{ error: string | null }> {
    if (!supabase) return { error: null };
    const { error } = await supabase
      .from('leads').update({ archived_at: new Date().toISOString() }).in('id', ids);
    return { error: error?.message ?? null };
  },

  /** The board's one write. Probability follows the stage for the two terminal ones. */
  async moveDeal(id: number, stage: DealStage): Promise<{ error: string | null }> {
    if (!supabase) return { error: null };
    const row: Record<string, unknown> = { stage };
    if (stage === 'Won') row.probability = 100;
    if (stage === 'Lost') row.probability = 0;
    const { error } = await supabase.from('deals').update(row).eq('id', id);
    return { error: error?.message ?? null };
  },

  async setTaskDone(id: number, done: boolean): Promise<{ error: string | null }> {
    if (!supabase) return { error: null };
    const { error } = await supabase
      .from('tasks').update({ status: done ? 'done' : 'open' }).eq('id', id);
    return { error: error?.message ?? null };
  },
};
