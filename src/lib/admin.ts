import { supabase } from './supabase';

/**
 * The platform console's data layer.
 *
 * Every call maps to one RPC in supabase/19_admin.sql, each of which guards
 * itself with require_platform_admin() and writes an audit row in the same
 * transaction. Nothing here reaches customer data: an admin can suspend an
 * account and change its plan, and still cannot read one lead.
 */

export type AccountStatus = 'active' | 'suspended' | 'closed';
export type MemberRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
export type CreditKind = 'extraction' | 'enrichment' | 'verification';

export const roles: MemberRole[] = ['owner', 'admin', 'manager', 'member', 'viewer'];
export const planIds = ['free', 'starter_500', 'growth_1000', 'pro_2000', 'scale_4000', 'ultra_10k', 'enterprise'] as const;

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  status: AccountStatus;
  isAdmin: boolean;
  workspaces: number;
  primaryWorkspace: string;
  topRole: MemberRole;
  lastSeen: string;
  createdAt: string;
  suspendedReason: string;
}

export interface AdminWorkspace {
  id: string;
  name: string;
  plan: string;
  status: AccountStatus;
  ownerEmail: string;
  members: number;
  leads: number;
  extractionUsed: number;
  extractionAllowance: number;
  contributes: boolean;
  createdAt: string;
}

export interface AdminMembership {
  workspaceId: string;
  workspaceName: string;
  role: MemberRole;
  workspaceStatus: AccountStatus;
  lastSeen: string;
}

export interface AuditEntry {
  id: number;
  action: string;
  actor: string;
  target: string;
  before: string;
  after: string;
  reason: string;
  at: string;
}

/* ── demo data ────────────────────────────────────────────────────────────── */

const ago = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();

export const demoAdminUsers: AdminUser[] = ([
  ['rahul@leadbro.io', 'Rahul Mehta', 'active', true, 1, 'LeadBro Business', 'owner', 4],
  ['aditi@leadbro.io', 'Aditi Ghosh', 'active', true, 1, 'LeadBro Business', 'admin', 55],
  ['ops@vertexoutbound.in', 'Vertex Ops', 'active', false, 1, 'Vertex Outbound', 'owner', 180],
  ['sam@northbridge.co', 'Sam Okafor', 'active', false, 1, 'Northbridge Sales', 'owner', 1_500],
  ['priya@vertexoutbound.in', 'Priya Sethi', 'active', false, 1, 'Vertex Outbound', 'manager', 320],
  ['admin@kalpataru.in', 'Kalpataru Admin', 'active', false, 1, 'Kalpataru Exports', 'owner', 90],
  ['nikhil@kalpataru.in', 'Nikhil Rao', 'active', false, 1, 'Kalpataru Exports', 'member', 2_600],
  ['hi@bluewave.io', 'Bluewave Trial', 'suspended', false, 1, 'Trial — Bluewave', 'owner', 14_400],
  ['contract@vertexoutbound.in', 'Contract Analyst', 'active', false, 1, 'Vertex Outbound', 'viewer', 7_200],
  ['sofia@northbridge.co', 'Sofia Renner', 'active', false, 1, 'Northbridge Sales', 'member', 640],
] as const).map(([email, fullName, status, isAdmin, workspaces, primaryWorkspace, topRole, seenMins], i) => ({
  id: `usr-${1000 + i}`,
  email,
  fullName,
  status: status as AccountStatus,
  isAdmin,
  workspaces,
  primaryWorkspace,
  topRole: topRole as MemberRole,
  lastSeen: ago(seenMins),
  createdAt: ago(seenMins + 40_000),
  suspendedReason: status === 'suspended' ? 'Trial abuse — repeated signups from one card' : '',
 }));

export const demoAdminWorkspaces: AdminWorkspace[] = ([
  ['LeadBro Business', 'pro_2000', 'active', 'rahul@leadbro.io', 5, 14_206, 4_210, 10_000, true],
  ['Vertex Outbound', 'scale_4000', 'active', 'ops@vertexoutbound.in', 8, 48_910, 14_204, 20_000, true],
  ['Northbridge Sales', 'growth_1000', 'active', 'sam@northbridge.co', 2, 3_412, 1_280, 2_000, false],
  ['Kalpataru Exports', 'pro_2000', 'active', 'admin@kalpataru.in', 6, 22_140, 7_940, 10_000, true],
  ['Trial — Bluewave', 'free', 'suspended', 'hi@bluewave.io', 1, 412, 96, 100, false],
] as const).map(([name, plan, status, ownerEmail, members, leads, used, allowance, contributes], i) => ({
  id: `ws-${2000 + i}`,
  name,
  plan,
  status: status as AccountStatus,
  ownerEmail,
  members,
  leads,
  extractionUsed: used,
  extractionAllowance: allowance,
  contributes,
  createdAt: ago(50_000 + i * 9_000),
}));

export const demoAudit: AuditEntry[] = ([
  ['set_workspace_plan', 'rahul@leadbro.io', 'Vertex Outbound', 'starter', 'business', '', 26],
  ['set_user_status', 'rahul@leadbro.io', 'hi@bluewave.io', 'active', 'suspended', 'Trial abuse — repeated signups from one card', 180],
  ['grant_credits', 'aditi@leadbro.io', 'Kalpataru Exports', 'extraction', '+5000', 'Goodwill after the 3 Sep outage', 320],
  ['set_member_role', 'rahul@leadbro.io', 'priya@vertexoutbound.in', 'member', 'manager', '', 1_450],
  ['grant_platform_admin', 'rahul@leadbro.io', 'aditi@leadbro.io', 'false', 'true', '', 4_300],
] as const).map(([action, actor, target, before, after, reason, mins], i) => ({
  id: 900 - i, action, actor, target, before, after, reason, at: ago(mins),
}));

const demoMemberships: Record<string, AdminMembership[]> = {};
demoAdminUsers.forEach((u) => {
  demoMemberships[u.id] = [
    {
      workspaceId: demoAdminWorkspaces.find((w) => w.name === u.primaryWorkspace)?.id ?? 'ws-2000',
      workspaceName: u.primaryWorkspace,
      role: u.topRole,
      workspaceStatus: u.status === 'suspended' ? 'suspended' : 'active',
      lastSeen: u.lastSeen,
    },
    ...(u.workspaces > 1
      ? [{
          workspaceId: 'ws-2001',
          workspaceName: 'Vertex Outbound',
          role: 'admin' as MemberRole,
          workspaceStatus: 'active' as AccountStatus,
          lastSeen: u.lastSeen,
        }]
      : []),
  ];
});

/* eslint-disable @typescript-eslint/no-explicit-any */
const toUser = (r: any): AdminUser => ({
  id: r.id,
  email: r.email ?? '',
  fullName: r.full_name ?? '',
  status: r.status ?? 'active',
  isAdmin: Boolean(r.is_admin),
  workspaces: r.workspaces ?? 0,
  primaryWorkspace: r.primary_workspace ?? '—',
  topRole: (r.top_role ?? 'member') as MemberRole,
  lastSeen: r.last_seen_at ?? '',
  createdAt: r.created_at ?? '',
  suspendedReason: r.suspended_reason ?? '',
});

const toWorkspace = (r: any): AdminWorkspace => ({
  id: r.id,
  name: r.name ?? '',
  plan: r.plan ?? 'free',
  status: r.status ?? 'active',
  ownerEmail: r.owner_email ?? '',
  members: r.members ?? 0,
  leads: r.leads ?? 0,
  extractionUsed: r.extraction_used ?? 0,
  extractionAllowance: r.extraction_allowance ?? 0,
  contributes: r.contributes ?? false,
  createdAt: r.created_at ?? '',
});
/* eslint-enable @typescript-eslint/no-explicit-any */

const search = <T,>(rows: T[], q: string, fields: (r: T) => string[]) => {
  const term = q.trim().toLowerCase();
  return term ? rows.filter((r) => fields(r).some((v) => v.toLowerCase().includes(term))) : rows;
};

/** Demo mode has no database, so a write is applied to the in-memory rows. */
const live = () => Boolean(supabase);

export const admin = {
  async users(q = '') {
    if (!live()) return { data: search(demoAdminUsers, q, (u) => [u.email, u.fullName, u.primaryWorkspace]), error: null };
    try {
      const { data, error } = await supabase!.rpc('admin_list_users', { p_search: q || null });
      if (error) throw error;
      return { data: (data ?? []).map(toUser), error: null };
    } catch (e) {
      return { data: demoAdminUsers, error: e instanceof Error ? e.message : String(e) };
    }
  },

  async workspaces(q = '') {
    if (!live()) return { data: search(demoAdminWorkspaces, q, (w) => [w.name, w.ownerEmail, w.plan]), error: null };
    try {
      const { data, error } = await supabase!.rpc('admin_list_workspaces', { p_search: q || null });
      if (error) throw error;
      return { data: (data ?? []).map(toWorkspace), error: null };
    } catch (e) {
      return { data: demoAdminWorkspaces, error: e instanceof Error ? e.message : String(e) };
    }
  },

  async memberships(userId: string): Promise<{ data: AdminMembership[]; error: string | null }> {
    if (!live()) return { data: demoMemberships[userId] ?? [], error: null };
    const { data, error } = await supabase!.rpc('admin_user_detail', { p_user: userId });
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    return { data: (data ?? []).map((r: any) => ({
      workspaceId: r.workspace_id,
      workspaceName: r.workspace_name,
      role: r.role,
      workspaceStatus: r.workspace_status,
      lastSeen: r.last_seen_at ?? '',
    })), error: error?.message ?? null };
  },

  async audit(limit = 50): Promise<{ data: AuditEntry[]; error: string | null }> {
    if (!live()) return { data: demoAudit, error: null };
    const { data, error } = await supabase!
      .from('platform_audit_log')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(limit);
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    return { data: (data ?? []).map((r: any): AuditEntry => ({
      id: r.id,
      action: r.action,
      actor: r.actor_id ?? '—',
      target: r.target_user ?? r.target_workspace ?? '—',
      before: r.before_value ?? '',
      after: r.after_value ?? '',
      reason: r.reason ?? '',
      at: r.occurred_at,
    })), error: error?.message ?? null };
  },

  /* ── writes ─────────────────────────────────────────────────────────────
   * Each returns { error }. The console applies the change optimistically and
   * rolls back on a message, the same contract the rest of the app uses.
   */

  async setPlatformAdmin(userId: string, on: boolean) {
    if (!live()) return { error: null };
    const { error } = await supabase!.rpc('admin_set_platform_admin', { p_user: userId, p_on: on });
    return { error: error?.message ?? null };
  },

  async setUserStatus(userId: string, status: AccountStatus, reason = '') {
    if (!live()) return { error: null };
    const { error } = await supabase!.rpc('admin_set_user_status', {
      p_user: userId, p_status: status, p_reason: reason || null,
    });
    return { error: error?.message ?? null };
  },

  async setMemberRole(workspaceId: string, userId: string, role: MemberRole) {
    if (!live()) return { error: null };
    const { error } = await supabase!.rpc('admin_set_member_role', {
      p_workspace: workspaceId, p_user: userId, p_role: role,
    });
    return { error: error?.message ?? null };
  },

  async removeMember(workspaceId: string, userId: string) {
    if (!live()) return { error: null };
    const { error } = await supabase!.rpc('admin_remove_member', {
      p_workspace: workspaceId, p_user: userId,
    });
    return { error: error?.message ?? null };
  },

  async setWorkspacePlan(workspaceId: string, plan: string) {
    if (!live()) return { error: null };
    const { error } = await supabase!.rpc('admin_set_workspace_plan', {
      p_workspace: workspaceId, p_plan: plan,
    });
    return { error: error?.message ?? null };
  },

  async setWorkspaceStatus(workspaceId: string, status: AccountStatus, reason = '') {
    if (!live()) return { error: null };
    const { error } = await supabase!.rpc('admin_set_workspace_status', {
      p_workspace: workspaceId, p_status: status, p_reason: reason || null,
    });
    return { error: error?.message ?? null };
  },

  async grantCredits(workspaceId: string, kind: CreditKind, amount: number, reason = '') {
    if (!live()) return { error: null };
    const { error } = await supabase!.rpc('admin_grant_credits', {
      p_workspace: workspaceId, p_kind: kind, p_amount: amount, p_reason: reason || null,
    });
    return { error: error?.message ?? null };
  },

  async setContribution(workspaceId: string, on: boolean) {
    if (!live()) return { error: null };
    const { error } = await supabase!.rpc('admin_set_contribution', {
      p_workspace: workspaceId, p_on: on,
    });
    return { error: error?.message ?? null };
  },
};

/* ── platform operations (20_admin_ops.sql) ───────────────────────────────── */

export interface AdminPlan {
  id: string;
  label: string;
  monthly: number;
  leadLimit: number | null;
  seats: number;
  workspaces: number;
  extraction: number;
  enrichment: number;
  downloadLimit?: string;
  subscribers: number;
}

export interface AdminSource {
  id: string;
  label: string;
  category: string;
  enabled: boolean;
  contributable: boolean;
  disabledReason: string;
  jobs30d: number;
  poolRows: number;
}

export interface QueueHealth {
  queued: number;
  running: number;
  failed24h: number;
  stalled: number;
  oldestQueuedSeconds: number;
  rawBacklog: number;
  pendingContributions: number;
  pendingRequests: number;
  disabledSources: number;
}

export interface FreshnessPolicy { fresh: number; recent: number; ageing: number }

export const demoPlans: AdminPlan[] = [
  { id: 'free', label: 'Free', monthly: 0, leadLimit: 1_000, seats: 1, workspaces: 1, extraction: 100, enrichment: 50, downloadLimit: '10 leads at once', subscribers: 186 },
  { id: 'starter_500', label: 'Starter (₹500)', monthly: 500, leadLimit: 10_000, seats: 2, workspaces: 1, extraction: 500, enrichment: 250, downloadLimit: 'Standard batch', subscribers: 142 },
  { id: 'growth_1000', label: 'Growth (₹1,000)', monthly: 1000, leadLimit: 25_000, seats: 3, workspaces: 1, extraction: 2_000, enrichment: 1_000, downloadLimit: 'Standard batch', subscribers: 98 },
  { id: 'pro_2000', label: 'Pro (₹2,000)', monthly: 2000, leadLimit: 50_000, seats: 5, workspaces: 1, extraction: 10_000, enrichment: 3_000, downloadLimit: '1,000 leads / day', subscribers: 119 },
  { id: 'scale_4000', label: 'Scale (₹4,000)', monthly: 4000, leadLimit: 100_000, seats: 10, workspaces: 2, extraction: 20_000, enrichment: 5_000, downloadLimit: '2,000 leads / day', subscribers: 48 },
  { id: 'ultra_10k', label: 'Ultra (₹10,000)', monthly: 10000, leadLimit: null, seats: 25, workspaces: 5, extraction: 50_000, enrichment: 15_000, downloadLimit: 'No daily limit', subscribers: 12 },
  { id: 'enterprise', label: 'Enterprise (Custom)', monthly: 0, leadLimit: null, seats: 100, workspaces: 25, extraction: 100_000, enrichment: 50_000, downloadLimit: 'Custom / Uncapped', subscribers: 5 },
];

export const demoSources: AdminSource[] = ([
  ['google_business', 'Google Business', 'discovery', true, true, 412, 186_400],
  ['google_search', 'Google Search', 'discovery', true, true, 268, 88_900],
  ['website', 'Website Intelligence', 'discovery', true, true, 331, 104_200],
  ['justdial', 'Justdial', 'directory', false, true, 0, 8_400],
  ['indiamart', 'IndiaMART', 'directory', true, true, 96, 52_100],
  ['tradeindia', 'TradeIndia', 'directory', true, true, 41, 14_600],
  ['gst', 'GST (GSTN)', 'registry', true, false, 0, 41_820],
  ['mca', 'MCA', 'registry', true, false, 0, 9_640],
  ['meta_ads', 'Meta Lead Ads', 'inbound', true, false, 0, 0],
  ['linkedin', 'LinkedIn', 'licensed', false, false, 0, 0],
] as const).map(([id, label, category, enabled, contributable, jobs30d, poolRows]) => ({
  id, label, category, enabled, contributable, jobs30d, poolRows,
  disabledReason: enabled ? '' : id === 'justdial'
    ? 'Blocking our range since 28 Aug — paused platform-wide'
    : 'No licensed data agreement in place',
}));

export const demoQueue: QueueHealth = {
  queued: 26, running: 4, failed24h: 4, stalled: 2, oldestQueuedSeconds: 8,
  rawBacklog: 1_204, pendingContributions: 188, pendingRequests: 6, disabledSources: 2,
};

export const demoFreshness: FreshnessPolicy = { fresh: 90, recent: 180, ageing: 1_095 };

export const adminOps = {
  async plans() {
    if (!live()) return { data: demoPlans, error: null };
    try {
      const { data, error } = await supabase!.from('plans').select('*').order('position');
      if (error) throw error;
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      return { data: (data ?? []).map((r: any): AdminPlan => ({
        id: r.id,
        label: r.label,
        monthly: Number(r.monthly_price_usd ?? 0),
        leadLimit: r.lead_limit,
        seats: r.seats ?? 1,
        workspaces: r.workspace_allowance ?? 1,
        extraction: r.extraction_credits ?? 0,
        enrichment: r.enrichment_credits ?? 0,
        subscribers: 0,
      })), error: null };
    } catch (e) {
      return { data: demoPlans, error: e instanceof Error ? e.message : String(e) };
    }
  },

  async updatePlan(id: string, patch: Partial<AdminPlan>) {
    if (!live()) return { error: null };
    const { error } = await supabase!.rpc('admin_update_plan', {
      p_plan: id,
      p_label: patch.label ?? null,
      p_monthly: patch.monthly ?? null,
      p_annual: null,
      p_lead_limit: patch.leadLimit ?? null,
      p_seats: patch.seats ?? null,
      p_workspaces: patch.workspaces ?? null,
      p_extraction: patch.extraction ?? null,
      p_enrichment: patch.enrichment ?? null,
    });
    return { error: error?.message ?? null };
  },

  async applyPlanToSubscribers(id: string) {
    if (!live()) return { count: 0, error: null };
    const { data, error } = await supabase!.rpc('admin_apply_plan_to_subscribers', { p_plan: id });
    return { count: (data as number) ?? 0, error: error?.message ?? null };
  },

  async sources() {
    if (!live()) return { data: demoSources, error: null };
    try {
      const { data, error } = await supabase!.rpc('admin_list_sources');
      if (error) throw error;
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      return { data: (data ?? []).map((r: any): AdminSource => ({
        id: r.id,
        label: r.label,
        category: r.category,
        enabled: r.enabled,
        contributable: r.contributable,
        disabledReason: r.disabled_reason ?? '',
        jobs30d: r.jobs_30d ?? 0,
        poolRows: r.pool_rows ?? 0,
      })), error: null };
    } catch (e) {
      return { data: demoSources, error: e instanceof Error ? e.message : String(e) };
    }
  },

  async setSource(id: string, enabled: boolean, contributable?: boolean, reason = '') {
    if (!live()) return { error: null };
    const { error } = await supabase!.rpc('admin_set_source', {
      p_source: id,
      p_enabled: enabled,
      p_contributable: contributable ?? null,
      p_reason: reason || null,
    });
    return { error: error?.message ?? null };
  },

  async queueHealth() {
    if (!live()) return { data: demoQueue, error: null };
    try {
      const { data, error } = await supabase!.rpc('admin_queue_health');
      if (error) throw error;
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const r = (data as any[])?.[0];
      return { data: r ? {
        queued: r.queued, running: r.running, failed24h: r.failed_24h, stalled: r.stalled,
        oldestQueuedSeconds: r.oldest_queued_seconds, rawBacklog: r.raw_backlog,
        pendingContributions: r.pending_contributions, pendingRequests: r.pending_requests,
        disabledSources: r.disabled_sources,
      } : demoQueue, error: null };
    } catch (e) {
      return { data: demoQueue, error: e instanceof Error ? e.message : String(e) };
    }
  },

  async setFreshness(policy: FreshnessPolicy) {
    if (!live()) return { error: null };
    const { error } = await supabase!.rpc('admin_set_setting', {
      p_key: 'freshness_days',
      p_value: policy,
      p_note: 'Days since a contact method was last proven to work.',
    });
    return { error: error?.message ?? null };
  },

  async broadcast(title: string, detail: string, onlyPaid = false) {
    if (!live()) return { count: 0, error: null };
    const { data, error } = await supabase!.rpc('admin_broadcast', {
      p_title: title, p_detail: detail, p_link: null, p_only_paid: onlyPaid,
    });
    return { count: (data as number) ?? 0, error: error?.message ?? null };
  },

  async requeueStalled() {
    if (!live()) return { count: 0, error: null };
    const { data, error } = await supabase!.rpc('requeue_stalled_jobs');
    return { count: (data as number) ?? 0, error: error?.message ?? null };
  },

  async promoteContributions(limit = 500) {
    if (!live()) return { error: null };
    const { error } = await supabase!.rpc('promote_contributions', { p_limit: limit });
    return { error: error?.message ?? null };
  },

  async reviewChangeRequest(id: number, approve: boolean, note = '') {
    if (!live()) return { error: null };
    const { error } = await supabase!.rpc('review_change_request', {
      p_request: id, p_approve: approve, p_note: note || null,
    });
    return { error: error?.message ?? null };
  },

  async revertBatch(id: string, reason = '') {
    if (!live()) return { error: null };
    const { error } = await supabase!.rpc('admin_revert_batch', {
      p_batch: id, p_reason: reason || null,
    });
    return { error: error?.message ?? null };
  },
};

/** "3 min ago" / "2 d ago" — a console is read at a glance. */
export const since = (iso: string): string => {
  if (!iso) return '—';
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
  const days = Math.round(mins / 1440);
  return days < 30 ? `${days} d ago` : `${Math.round(days / 30)} mo ago`;
};
