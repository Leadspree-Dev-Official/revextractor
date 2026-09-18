import { supabase, isLive } from './supabase';
import type { AdConnection, ChangeRequest, ConsumerAttributes, ContributionRow, DndStatus, Freshness, PoolBatch, PoolCompany, PoolLead, RecordType } from './types';

/**
 * The platform pool — rows LeadBro owns and every workspace can browse.
 * A user takes a private copy on first action; the pool row is never edited
 * by a customer, so a refresh can't overwrite anybody's work.
 */

/**
 * Mirrors freshness_band() in 05_delivery.sql. The thresholds live in
 * platform_settings so they can be tuned without a deploy; these are the
 * defaults the app falls back to.
 */
export const freshnessDays = { fresh: 90, recent: 180, ageing: 1095 };

/** Measured from the last time a contact method was proven to work, not the last edit. */
export function freshnessOf(verifiedISO: string | null): Freshness {
  if (!verifiedISO) return 'unverified';
  const days = (Date.now() - new Date(verifiedISO).getTime()) / 86_400_000;
  if (Number.isNaN(days)) return 'unverified';
  if (days <= freshnessDays.fresh) return 'fresh';
  if (days <= freshnessDays.recent) return 'recent';
  if (days <= freshnessDays.ageing) return 'ageing';
  return 'stale';
}

export const freshnessLabel: Record<Freshness, string> = {
  fresh: 'Fresh', recent: 'Recent', ageing: 'Ageing', stale: 'Stale', unverified: 'Unverified',
};

export const freshnessMeaning: Record<Freshness, string> = {
  fresh: `Reached in the last ${freshnessDays.fresh} days`,
  recent: `Reached in the last ${freshnessDays.recent} days`,
  ageing: 'Last reached between 6 months and 3 years ago',
  stale: 'Not reached in over 3 years — verify before you send',
  unverified: 'No delivery has ever confirmed this contact',
};

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const shortDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });

export const demoPool: PoolLead[] = [
  ['Ravi Krishnan', 'Procurement Manager', 'Sterling Auto Components', 'sterlingauto.in', 'ravi@sterlingauto.in', '+91 44 4218 9930', 'Chennai', 'India', 'Automotive', 'Google Business', 88, 92, 14, '02 Sep'],
  ['Meera Joshi', 'Founder', 'Kanwar Organics', 'kanwarorganics.com', 'meera@kanwarorganics.com', '+91 20 6712 4408', 'Pune', 'India', 'FMCG', 'Website', 74, 81, 3, '02 Sep'],
  ['Aleksander Nowak', 'Head of Sourcing', 'Baltic Freight', 'balticfreight.pl', 'a.nowak@balticfreight.pl', '+48 58 321 7740', 'Gdansk', 'Poland', 'Logistics', 'Google Search', 92, 88, 21, '01 Sep'],
  ['Sunita Rathore', 'Managing Partner', 'Rathore Textiles', 'rathoretex.in', 'contact@rathoretex.in', '+91 141 402 8817', 'Jaipur', 'India', 'Textiles', 'IndiaMART', 66, 71, 8, '01 Sep'],
  ['James Okafor', 'Operations Director', 'Lagos Metal Works', 'lagosmetal.ng', 'james@lagosmetal.ng', '+234 1 448 2210', 'Lagos', 'Nigeria', 'Manufacturing', 'Google Business', 71, 76, 2, '31 Aug'],
  ['Hiroshi Tanaka', 'General Manager', 'Sakura Precision', 'sakuraprecision.jp', 'tanaka@sakuraprecision.jp', '+81 3 5422 8890', 'Tokyo', 'Japan', 'Precision Engineering', 'Website', 85, 90, 11, '31 Aug'],
  ['Fatima Al-Rashid', 'Purchase Head', 'Gulf Building Supplies', 'gulfbuilding.ae', 'fatima@gulfbuilding.ae', '+971 4 332 7719', 'Dubai', 'UAE', 'Construction', 'Google Business', 79, 84, 6, '30 Aug'],
  ['Deepak Menon', 'Director', 'Cochin Marine Exports', 'cochinmarine.in', 'deepak@cochinmarine.in', '+91 484 267 4412', 'Kochi', 'India', 'Seafood Export', 'TradeIndia', 62, 68, 4, '30 Aug'],
  ['Clara Weiss', 'Head of Procurement', 'Alpin Packaging', 'alpinpackaging.at', 'c.weiss@alpinpackaging.at', '+43 1 522 8840', 'Vienna', 'Austria', 'Packaging', 'Google Search', 90, 87, 17, '29 Aug'],
  ['Anand Pillai', 'CEO', 'Vertex Automation', 'vertexauto.in', 'anand@vertexauto.in', '+91 80 4112 6690', 'Bengaluru', 'India', 'Industrial Automation', 'Website', 94, 95, 28, '29 Aug'],
  ['Nguyen Van Minh', 'Export Manager', 'Mekong Agro', 'mekongagro.vn', 'minh@mekongagro.vn', '+84 28 3822 4417', 'Ho Chi Minh City', 'Vietnam', 'Agriculture', 'Google Business', 68, 73, 5, '28 Aug'],
  ['Priyanka Sethi', 'Head of Supply Chain', 'Northline Pharma', 'northlinepharma.in', 'priyanka@northlinepharma.in', '+91 172 466 3320', 'Chandigarh', 'India', 'Pharmaceuticals', 'IndiaMART', 81, 86, 9, '28 Aug'],
].map((row, i) => {
  const [name, title, company, domain, email, phone, city, country, industry, source,
         completeness, quality, claimCount, addedOn] = row as [
    string, string, string, string, string, string, string, string, string, string,
    number, number, number, string];
  // Spread the sample across all five bands under the 90 / 180 / 1095-day thresholds.
  const age = [3, 41, 88, 121, 174, 260, 540, 910, 1_040, 1_400, 2_200, null][i] ?? 60;
  const verified = age === null ? null : daysAgo(age);
  return {
    id: i + 1,
    name, title, company, domain, email, phone, city, country, industry, source,
    completeness, quality, claimCount, addedOn,
    updatedOn: verified ? shortDate(verified) : '—',
    freshness: freshnessOf(verified ? verified.toISOString() : null),
    revision: 1 + (i % 4),
    recordType: 'b2b' as RecordType,
    claimed: false,
  } as PoolLead;
});

/**
 * Consumer records. Banded attributes, a recorded lawful basis, and a DND state
 * — a consumer number is not callable until it has been scrubbed.
 */
const consumerRows: Array<[string, string, string, string, string, string, string, string, string, DndStatus, number]> = [
  ['Aarti Deshmukh', 'aarti.deshmukh@gmail.com', '+91 98220 41180', 'Pune', 'India', '30–39', 'Tier 1', 'Home loan enquiry', 'consent', 'clear', 12],
  ['Rohan Pillai', 'rohan.pillai@outlook.com', '+91 96450 77210', 'Kochi', 'India', '25–29', 'Tier 2', 'Car insurance renewal', 'consent', 'clear', 34],
  ['Sneha Bhatt', 'sneha.bhatt@yahoo.in', '+91 99040 22815', 'Ahmedabad', 'India', '40–49', 'Tier 1', 'Child education plan', 'consent', 'registered', 96],
  ['Imran Sheikh', 'imran.sheikh@gmail.com', '+91 88790 34412', 'Hyderabad', 'India', '30–39', 'Tier 1', 'Personal loan enquiry', 'consent', 'clear', 61],
  ['Divya Menon', 'divya.menon@gmail.com', '+91 94470 18823', 'Thrissur', 'India', '25–29', 'Tier 3', 'Travel enquiry', 'consent', 'unchecked', 210],
  ['Karan Malhotra', 'karan.m@protonmail.com', '+91 99110 62240', 'Gurugram', 'India', '35–39', 'Tier 1', 'Health cover enquiry', 'consent', 'clear', 420],
];

export const demoConsumerPool: PoolLead[] = consumerRows.map((row, i) => {
  const [name, email, phone, city, country, ageBand, cityTier, lifeEvent, consentBasis, dnd, age] = row;
  const verified = daysAgo(age);
  return {
    id: 1000 + i,
    name,
    title: '',
    company: '',
    domain: '',
    email, phone, city, country,
    industry: '',
    source: 'Capture Form',
    completeness: 70 + (i % 4) * 5,
    quality: 60 + (i % 5) * 6,
    claimCount: i * 3,
    addedOn: shortDate(daysAgo(age + 20)),
    updatedOn: shortDate(verified),
    freshness: freshnessOf(verified.toISOString()),
    revision: 1,
    recordType: 'b2c' as RecordType,
    consumer: { ageBand, cityTier, lifeEvent } as ConsumerAttributes,
    consentBasis,
    dnd,
    claimed: false,
  } as PoolLead;
});

export const demoChangeRequests: ChangeRequest[] = [
  [1, 'Ravi Krishnan', 'Sterling Auto Components', 'job_title', 'Procurement Manager', 'Head of Procurement', 'Promoted — confirmed on their careers page', 'A. Ghosh', 'Vertex Outbound', 'pending', '22 min ago'],
  [2, 'Sunita Rathore', 'Rathore Textiles', 'phone', '+91 141 402 8817', '+91 141 402 9930', 'Old number is disconnected; new one from their site footer', 'R. Mitra', 'LeadBro Business', 'pending', '1 h ago'],
  [3, 'James Okafor', 'Lagos Metal Works', 'email', 'james@lagosmetal.ng', 'j.okafor@lagosmetal.ng', 'Bounced twice; correct format confirmed by reply', 'S. Roy', 'Northbridge Sales', 'pending', '3 h ago'],
  [4, 'Meera Joshi', 'Kanwar Organics', 'company_name', 'Kanwar Organics', 'Kanwar Organics Pvt Ltd', 'Registered name per GST record', 'A. Ghosh', 'Kalpataru Exports', 'pending', '5 h ago'],
  [5, 'Clara Weiss', 'Alpin Packaging', 'city', 'Vienna', 'Graz', 'Head office relocated in July', 'R. Mitra', 'LeadBro Business', 'approved', 'Yesterday'],
  [6, 'Deepak Menon', 'Cochin Marine Exports', 'domain', 'cochinmarine.in', 'cochinmarine.com', 'Domain change is not reflected anywhere public', 'S. Roy', 'Vertex Outbound', 'rejected', '2 d ago'],
].map(([id, lead, company, field, currentValue, proposedValue, reason, requestedBy, workspace, status, requestedAt]) => ({
  id, lead, company, field, currentValue, proposedValue, reason, requestedBy, workspace, status, requestedAt,
} as ChangeRequest));

export const demoBatches: PoolBatch[] = [
  ['b_0091', 'Tamil Nadu auto components — Sep', 'Google Business', 4820, 4188, 512, 120, 'published', 'You', '02 Sep 08:40'],
  ['b_0090', 'EU logistics operators 200+', 'Google Search', 2140, 1902, 188, 50, 'published', 'You', '01 Sep 19:10'],
  ['b_0089', 'Gujarat chemical exporters', 'IndiaMART', 3610, 2944, 604, 62, 'ready', 'You', '01 Sep 11:22'],
  ['b_0088', 'SEA agriculture exporters', 'Website', 1880, 1620, 204, 56, 'published', 'A. Ghosh', '30 Aug 15:04'],
  ['b_0087', 'Pharma supply chain — India', 'IndiaMART', 2940, 0, 0, 0, 'failed', 'You', '29 Aug 09:18'],
].map(([id, label, source, rows, accepted, merged, rejected, status, createdBy, createdAt]) => ({
  id, label, source, rows, accepted, merged, rejected, status, createdBy, createdAt,
} as PoolBatch));

export const demoContributions: ContributionRow[] = [
  [1, 'LeadBro Business', 'Bansal Polymers', 'Rohit Bansal', 'IndiaMART', 'merged', '12 min ago'],
  [2, 'Client B — Manufacturing', 'Kalinga Steel Works', 'Arjun Mehta', 'IndiaMART', 'created', '38 min ago'],
  [3, 'LeadBro Business', 'Sunrise Textiles', 'Kavita Iyer', 'TradeIndia', 'merged', '1 h ago'],
  [4, 'Client A — Retail', 'Zentro Interiors', 'Neha Kapoor', 'Justdial', 'pending', '2 h ago'],
  [5, 'LeadBro Business', 'Studio Mira', 'Priya Nair', 'Justdial', 'rejected', '3 h ago'],
  [6, 'Client B — Manufacturing', 'Loop Commerce', 'Thomas Byrne', 'Google Search', 'created', '4 h ago'],
].map(([id, workspace, company, contact, source, state, queuedAt]) => ({
  id, workspace, company, contact, source, state, queuedAt,
} as ContributionRow));

export const demoAdConnections: AdConnection[] = [
  { id: 'ac_1', platform: 'meta_ads', name: 'LeadBro — Manufacturing India', accountRef: 'page_10992', status: 'Connected', leadCount: 412, lastLeadAt: '18 min ago' },
  { id: 'ac_2', platform: 'meta_ads', name: 'Retail expansion — Instagram', accountRef: 'page_10993', status: 'Connected', leadCount: 188, lastLeadAt: '2 h ago' },
  { id: 'ac_3', platform: 'google_ads', name: 'Search — supplier sourcing', accountRef: '742-118-9930', status: 'Connected', leadCount: 264, lastLeadAt: '40 min ago' },
  { id: 'ac_4', platform: 'google_ads', name: 'Performance Max — exporters', accountRef: '742-118-9931', status: 'Requires API Key', leadCount: 0, lastLeadAt: '—' },
];

/* ── live queries ─────────────────────────────────────────────────────────── */

/* eslint-disable @typescript-eslint/no-explicit-any */
const toPoolLead = (r: any, claimedIds: Set<number>): PoolLead => ({
  id: r.id,
  name: r.full_name ?? [r.first_name, r.last_name].filter(Boolean).join(' '),
  title: r.job_title ?? '',
  company: r.company_name ?? '',
  domain: r.domain ?? '',
  email: r.email ?? '',
  phone: r.phone ?? '',
  city: r.city ?? '',
  country: r.country ?? '',
  industry: r.industry ?? '',
  source: r.source_id ?? '',
  completeness: r.completeness ?? 0,
  quality: r.quality_score ?? 0,
  claimCount: r.claim_count ?? 0,
  addedOn: r.first_seen_at
    ? new Date(r.first_seen_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    : '',
  updatedOn: r.last_verified_at
    ? new Date(r.last_verified_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
    : '—',
  freshness: freshnessOf(r.last_verified_at ?? null),
  revision: r.revision ?? 1,
  recordType: (r.record_type ?? 'b2b') as RecordType,
  consumer: r.consumer ?? undefined,
  consentBasis: r.consent_basis ?? undefined,
  dnd: r.dnd ?? undefined,
  claimed: claimedIds.has(r.id),
});
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * The registry, seen as businesses. Same rows as the Registry screen — one
 * ingest, projected — so this reads the view rather than re-querying the
 * registry tables, and no screen has to know they exist.
 */
export const demoPoolCompanies: PoolCompany[] = [
  ['Nimbus Robotics', 'Industrial Automation', 'Hyderabad', 'Telangana', 'gst', '36ABKCS4471M1Z9', 'Active', 'Regular', 3],
  ['Havelock Traders', 'Retail', 'Patna', 'Bihar', 'gst', '10AAJCH8820P1ZK', 'Active', 'Regular', 1],
  ['Sterling Auto Components', 'Automotive', 'Vijayawada', 'Andhra Pradesh', 'gst', '37AAGCS9014Q1Z2', 'Active', 'Regular', 2],
  ['Brahmaputra Agro Mills', 'Agriculture', 'Guwahati', 'Assam', 'gst', '18AABCA1129R1ZT', 'Active', 'Composition', 1],
  ['Pragati Cold Chain', 'Logistics', 'Ludhiana', 'Punjab', 'gst', '03AADCP7741H1ZV', 'Suspended', 'Regular', 1],
  ['Ridgeline Analytics', 'IT Services', 'Gurugram', 'Haryana', 'mca', 'AAP-8841', 'Active', 'LLP', 2],
  ['Vasant Precision', 'Precision Engineering', 'Rajkot', 'Gujarat', 'mca', 'U29308GJ2021PTC124490', 'Active', 'Private Limited', 4],
].map((row, i) => {
  const [name, industry, city, state, registry, registrationNo, status, entityType, contacts] = row as
    [string, string, string, string, 'mca' | 'gst', string, string, string, number];
  return {
    id: 9_100 + i,
    name, industry, city, state, registry, registrationNo, status, entityType, contacts,
    country: 'India',
    phone: '', email: '',
    registeredOn: shortDate(daysAgo(i * 3)),
    syncedOn: shortDate(daysAgo(0)),
  } satisfies PoolCompany;
});

export const pool = {
  /** Companies the registry produced. Never workspace data — read-only, shared. */
  async companies(search: string): Promise<{ data: PoolCompany[]; error: string | null }> {
    const filtered = (rows: PoolCompany[]) => {
      const q = search.trim().toLowerCase();
      return q
        ? rows.filter((c) => [c.name, c.city, c.state, c.industry, c.registrationNo]
            .some((v) => (v ?? '').toLowerCase().includes(q)))
        : rows;
    };

    if (!supabase) return { data: filtered(demoPoolCompanies), error: null };

    try {
      let query = supabase
        .from('pool_companies')
        .select('*')
        .order('registry_synced_at', { ascending: false, nullsFirst: false })
        .limit(100);
      if (search.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(`name.ilike.${term},state.ilike.${term},registration_no.ilike.${term}`);
      }
      const { data, error } = await query;
      if (error) throw error;
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      return { data: (data ?? []).map((r: any): PoolCompany => ({
        id: r.id,
        name: r.name ?? '',
        industry: r.industry ?? '—',
        city: r.city ?? '',
        state: r.state ?? '',
        country: r.country ?? 'India',
        phone: r.phone ?? '',
        email: r.email ?? '',
        registry: r.registry ?? null,
        registrationNo: r.registration_no ?? '—',
        status: r.status ?? '—',
        entityType: r.entity_type ?? '—',
        registeredOn: r.registered_on ?? '—',
        contacts: r.contact_count ?? 0,
        syncedOn: (r.registry_synced_at ?? '').slice(0, 10),
      })), error: null };
    } catch (e) {
      return { data: filtered(demoPoolCompanies), error: e instanceof Error ? e.message : String(e) };
    }
  },

  async list(
    workspaceId: string | null,
    search: string,
    recordType: RecordType = 'b2b',
  ): Promise<{ data: PoolLead[]; error: string | null }> {
    if (!supabase) {
      const source = recordType === 'b2c' ? demoConsumerPool : demoPool;
      const q = search.trim().toLowerCase();
      const rows = q
        ? source.filter((l) => [l.name, l.company, l.city, l.industry, l.country]
            .some((v) => (v ?? '').toLowerCase().includes(q)))
        : source;
      return { data: rows, error: null };
    }

    try {
      let query = supabase
        .from('platform_leads')
        .select('*')
        .eq('published', true)
        .eq('record_type', recordType)
        .is('archived_at', null)
        .order('quality_score', { ascending: false })
        .limit(100);

      if (search.trim()) {
        const term = `%${search.trim()}%`;
        query = query.or(
          `full_name.ilike.${term},company_name.ilike.${term},city.ilike.${term},industry.ilike.${term}`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      // Which of these does this workspace already hold?
      let claimed = new Set<number>();
      if (workspaceId) {
        const { data: mine } = await supabase
          .from('leads')
          .select('claimed_from')
          .eq('workspace_id', workspaceId)
          .not('claimed_from', 'is', null);
        claimed = new Set((mine ?? []).map((r) => r.claimed_from as number));
      }

      return { data: (data ?? []).map((r) => toPoolLead(r, claimed)), error: null };
    } catch (e) {
      return {
        data: recordType === 'b2c' ? demoConsumerPool : demoPool,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },

  /** Copy-on-claim. Idempotent — claiming twice returns the copy you have. */
  async claim(workspaceId: string, ids: number[]): Promise<{ claimed: number; error: string | null }> {
    if (!supabase) return { claimed: ids.length, error: null };
    const { data, error } = await supabase.rpc('claim_platform_leads', {
      p_workspace: workspaceId,
      p_ids: ids,
    });
    return { claimed: (data as number) ?? 0, error: error?.message ?? null };
  },

  /** Propose a correction. It queues for a platform admin — nothing changes yet. */
  async requestChange(
    workspaceId: string,
    platformLeadId: number,
    field: string,
    proposed: string,
    reason: string,
  ): Promise<{ error: string | null }> {
    if (!supabase) return { error: null };
    const { error } = await supabase.rpc('request_data_change', {
      p_platform_lead: platformLeadId,
      p_workspace: workspaceId,
      p_field: field,
      p_proposed: proposed,
      p_reason: reason,
    });
    return { error: error?.message ?? null };
  },

  async isPlatformAdmin(): Promise<boolean> {
    if (!supabase) return true;                 // demo mode shows the console
    const { data } = await supabase.rpc('is_platform_admin');
    return Boolean(data);
  },
};

export const poolIsLive = isLive;
