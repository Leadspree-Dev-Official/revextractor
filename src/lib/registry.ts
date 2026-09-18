import { supabase, isLive } from './supabase';
import type { Lead } from './types';

/**
 * The registry: businesses as the state records them.
 *
 * One ingest, three surfaces (supabase/18_registry.sql). This module reads the
 * registry surface — the filing itself, with the contact on it. The same rows
 * reach Companies and the lead pool through the fan-out, in those screens' own
 * vocabulary, which is why nothing here exports or downloads: the data is
 * already inside the product.
 */

export type RegistryKind = 'mca' | 'gst';

/** As published by GSTN. Decoded in the database; kept here for the filter. */
export const taxpayerTypes: Record<string, string> = {
  REG: 'Regular',
  COM: 'Composition',
  CTP: 'Casual',
  TDS: 'TDS deductor',
  TCS: 'TCS collector',
  ISD: 'Input service distributor',
};

export const statusLabels: Record<string, string> = {
  ACT: 'Active',
  SUS: 'Suspended',
  CNL: 'Cancelled',
  INA: 'Inactive',
};

/**
 * How we came by the industry. The feed sends "NA" for activity, so most values
 * are worked out — and a worked-out value must never be shown as a given one.
 */
export type IndustrySource = 'registry' | 'nic' | 'inferred' | 'ai';

/**
 * Whether anyone has actually reached this contact. Not a registry fact: it
 * comes from the delivery signals in 05_delivery.sql — a connected call is what
 * turns a number from unverified into verified.
 */
export type Verification = 'unverified' | 'verified' | 'email_only' | 'unreachable';

export const verificationLabels: Record<Verification, string> = {
  unverified: 'Not verified',
  verified: 'Verified',
  email_only: 'Email only',
  unreachable: 'Unreachable',
};

export interface RegistryRecord {
  id: number;
  /**
   * platform_leads.id for the contact this filing produced. Claiming and
   * correcting both act on this, not on the filing: a statutory record is not
   * something a customer can edit, but the contact taken from it is.
   */
  leadId: number | null;
  registry: RegistryKind;
  /** GSTIN for GST, CIN or LLPIN for MCA. */
  registrationNo: string;
  legalName: string;
  tradeName: string;
  pan: string;
  typeCode: string;
  statusCode: string;
  registeredOn: string;
  jurisdiction: string;
  stateJurisdiction: string;
  /** Empty when nothing has worked it out yet. */
  industry: string;
  industrySource: IndustrySource | null;
  industryConfidence: number | null;
  verification: Verification;
  /** The day someone last got through. Empty until they have. */
  verifiedOn: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  pincode: string;
  /** When the record first appeared in the registry feed. */
  seenOn: string;
  /** The day the feed last confirmed this row still exists, unchanged or not. */
  confirmedOn: string;
  /** The last day a tracked field actually moved. Empty when nothing has. */
  changedOn: string;
  /** True while this is the first time we have seen the registration. */
  isNew: boolean;
  /** The contact differs from what the filing said — an approved correction. */
  corrected: boolean;
}

export interface RegistrySubscription {
  id: string;
  name: string;
  kinds: RegistryKind[];
  states: string[];
  types: string[];
  deliverWebhook: boolean;
  deliverEmail: boolean;
  active: boolean;
}

export interface RegistryFilters {
  search: string;
  kind: 'all' | RegistryKind;
  state: string;
  type: string;
  status: string;
  /** '' means every date we hold. */
  date: string;
  /** 'All', or one of the Verification values. */
  verified: string;
  industry: string;
}

export const emptyFilters: RegistryFilters = {
  search: '', kind: 'all', state: 'All', type: 'All', status: 'All', date: '',
  verified: 'All', industry: 'All',
};

/* ── demo data ──────────────────────────────────────────────────────────────
 * Shaped exactly like the provider's daily workbook — GSTIN, legal and trade
 * name, taxpayer type, status, jurisdiction codes, mobile, email, address —
 * but wholly invented. Real registration data is personal data about real
 * people; none of it belongs in a repository.
 */

const iso = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 86_400_000).toISOString().slice(0, 10);

type Seed = [RegistryKind, string, string, string, string, string, string, string, string, string,
             string, string, number, string, IndustrySource | null, Verification];

const seeds: Seed[] = [
  ['gst', '36ABKCS4471M1Z9', 'SREENIVAS RAO KOTHA', 'Nimbus Robotics', 'REG', 'ACT', 'ZK0301', 'TG017', '9000112233', 'contact@nimbusrobotics.example.in', 'Plot 44, HITEC City, Hyderabad (500081)', 'Telangana', 0, 'Engineering', 'inferred', 'unverified'],
  ['gst', '10AAJCH8820P1ZK', 'HARSHAD PRASAD SINGH', 'Havelock Traders', 'REG', 'ACT', 'XV0203', 'BR027', '9000223344', 'havelock.traders@example.in', 'Ward 7, Boring Road, Patna (800001)', 'Bihar', 0, 'Trading', 'inferred', 'verified'],
  ['gst', '37AAGCS9014Q1Z2', 'SUJATHA REDDY', 'Sterling Auto Components', 'REG', 'ACT', 'XU0403', 'AP031', '9000334455', 'accounts@sterlingauto.example.in', '3-11/2, Autonagar, Vijayawada (520007)', 'Andhra Pradesh', 0, 'Automotive', 'inferred', 'unverified'],
  ['gst', '18AABCA1129R1ZT', 'ANUPAM BARUAH', 'Brahmaputra Agro Mills', 'COM', 'ACT', 'UQ0107', 'AS014', '9000445566', 'anupam@brahmaputraagro.example.in', 'NH-37, Kahilipara, Guwahati (781019)', 'Assam', 0, 'Agriculture', 'inferred', 'unverified'],
  ['gst', '23AAECP6640L1ZM', 'PRIYA SETHIA', 'Vindhya Packaging', 'REG', 'ACT', 'ZP0504', 'MP072', '9000556677', 'priya@vindhyapack.example.in', 'Industrial Area, Govindpura, Bhopal (462023)', 'Madhya Pradesh', 0, 'Packaging', 'inferred', 'verified'],
  ['gst', '21AAFCK3308N1ZB', 'KOSALA LIVELIHOOD FOUNDATION', 'Kosala Livelihood Foundation', 'CTP', 'ACT', 'WB0604', 'OD010', '9000667788', 'office@kosala.example.in', 'Nabarangpur, Odisha (764059)', 'Odisha', 1, 'Education', 'ai', 'unverified'],
  ['gst', '03AADCP7741H1ZV', 'PRAGATI COLD CHAIN', 'Pragati Cold Chain', 'REG', 'SUS', 'ZO0206', 'PB119', '9000778899', 'ops@pragaticold.example.in', 'Focal Point, Ludhiana (141010)', 'Punjab', 1, 'Logistics', 'inferred', 'unreachable'],
  ['gst', '32AAJFR2215K1ZD', 'RAMESH NAIR', 'Cochin Marine Exports', 'REG', 'ACT', 'ZK0602', 'KL031', '9000889900', 'ramesh@cochinmarine.example.in', 'Willingdon Island, Kochi (682003)', 'Kerala', 1, 'Trading', 'inferred', 'verified'],
  ['gst', '07DMSPK3487A1ZS', 'ZYCHEM BIOTECH', 'Zychem Biotech', 'TDS', 'ACT', 'ZK0602', 'DL094', '9000990011', 'accounts@zychem.example.in', 'Pocket A, Dilshad Garden, New Delhi (110095)', 'Delhi', 2, 'Pharmaceuticals', 'ai', 'email_only'],
  ['gst', '24AAKPS9930J1ZF', 'MOHD SHAHID KHAN', 'MOHD SHAHID KHAN', 'REG', 'ACT', 'ZK0301', 'GJ118', '9000101112', 'ms.khan@example.in', 'Ring Road, Surat (395002)', 'Gujarat', 2, '', null, 'unverified'],
  ['mca', 'U74999KA2026PTC198442', 'NIMBUS ROBOTICS PRIVATE LIMITED', 'Nimbus Robotics', 'PTC', 'ACT', 'RoC-Bangalore', 'KA', '9000112233', 'contact@nimbusrobotics.example.in', 'Plot 44, HITEC City, Bengaluru (560103)', 'Karnataka', 0, 'Engineering', 'inferred', 'unverified'],
  ['mca', 'U52100MH2026PTC401227', 'HAVELOCK RETAIL VENTURES PRIVATE LIMITED', 'Havelock Retail', 'PTC', 'ACT', 'RoC-Mumbai', 'MH', '9000223344', 'cs@havelockretail.example.in', 'Andheri East, Mumbai (400069)', 'Maharashtra', 0, 'Retail', 'registry', 'unverified'],
  ['mca', 'AAP-8841', 'RIDGELINE ANALYTICS LLP', 'Ridgeline Analytics', 'LLP', 'ACT', 'RoC-Delhi', 'HR', '9000334455', 'hello@ridgeline.example.in', 'Sector 44, Gurugram (122003)', 'Haryana', 1, 'IT Services', 'inferred', 'verified'],
  ['mca', 'U72200DL2014PTC271005', 'ANMOL SOFTWORKS PRIVATE LIMITED', 'Anmol Softworks', 'PTC', 'CNL', 'RoC-Delhi', 'DL', '9000445566', 'admin@anmolsoft.example.in', 'Nehru Place, New Delhi (110019)', 'Delhi', 2, 'IT Services', 'registry', 'unreachable'],
  ['mca', 'U29308GJ2021PTC124490', 'VASANT PRECISION ENGINEERING PRIVATE LIMITED', 'Vasant Precision', 'PTC', 'ACT', 'RoC-Ahmedabad', 'GJ', '9000556677', 'works@vasantprecision.example.in', 'GIDC Estate, Rajkot (360004)', 'Gujarat', 2, 'Engineering', 'registry', 'verified'],
];

export const demoRecords: RegistryRecord[] = seeds.map((s, i) => {
  const [registry, registrationNo, legalName, tradeName, typeCode, statusCode,
         jurisdiction, stateJurisdiction, phone, email, address, state, age,
         industry, industrySource, verification] = s;
  return {
    id: 5_100 + i,
    leadId: 7_100 + i,
    corrected: i === 3,
    registry, registrationNo, legalName, tradeName, typeCode, statusCode,
    jurisdiction, stateJurisdiction, address, state,
    pan: registrationNo.length === 15 ? registrationNo.slice(2, 12) : '—',
    phone: `+91 ${phone}`,
    email,
    pincode: address.match(/\((\d{6})\)/)?.[1] ?? '',
    industry,
    industrySource,
    industryConfidence: industrySource === 'ai' ? 60 : industrySource === 'inferred' ? 80 : null,
    verification,
    verifiedOn: verification === 'verified' || verification === 'email_only' ? iso(age) : '',
    registeredOn: iso(age),
    seenOn: iso(age),
    confirmedOn: iso(0),
    // Only the rows whose status has moved carry a change date.
    changedOn: statusCode === 'ACT' ? '' : iso(age),
    isNew: age === 0,
  };
});

/** Headline counts for the strip at the top of the page. */
export const demoCounts = {
  today: 1_836,
  gstToday: 1_642,
  mcaToday: 194,
  states: 33,
  companiesCreated: 1_781,
  leadsCreated: 1_804,
  lastRunIst: '08:12',
};

export const demoSubscriptions: RegistrySubscription[] = [
  {
    id: 'sub_1',
    name: 'South India — new registrations',
    kinds: ['mca', 'gst'],
    states: ['Karnataka', 'Tamil Nadu', 'Kerala', 'Telangana'],
    types: ['REG'],
    deliverWebhook: true,
    deliverEmail: true,
    active: true,
  },
  {
    id: 'sub_2',
    name: 'Composition dealers, all India',
    kinds: ['gst'],
    states: [],
    types: ['COM'],
    deliverWebhook: false,
    deliverEmail: true,
    active: true,
  },
];

/* eslint-disable @typescript-eslint/no-explicit-any */
const toRecord = (r: any): RegistryRecord => ({
  id: r.id,
  leadId: r.lead_id ?? null,
  registry: r.kind,
  registrationNo: r.registration_no ?? '',
  legalName: r.legal_name ?? '',
  tradeName: r.trade_name || r.legal_name || '',
  pan: r.pan ?? '—',
  typeCode: r.type_code ?? '',
  statusCode: r.status_code ?? '',
  registeredOn: r.registered_on ?? '',
  jurisdiction: r.jurisdiction ?? '',
  stateJurisdiction: r.state_jurisdiction ?? '',
  // The corrected contact where one exists, the filing's own otherwise.
  phone: r.contact_phone ?? r.phone ?? '',
  email: r.contact_email ?? r.email ?? '',
  corrected: Boolean(r.phone_corrected || r.email_corrected),
  address: r.address ?? '',
  state: r.state ?? '',
  pincode: r.pincode ?? '',
  industry: r.industry ?? '',
  industrySource: r.industry_source ?? null,
  industryConfidence: r.industry_confidence ?? null,
  verification: (r.verification ?? 'unverified') as Verification,
  verifiedOn: (r.last_verified_at ?? '').slice(0, 10),
  seenOn: (r.first_seen_at ?? '').slice(0, 10),
  confirmedOn: (r.last_seen_at ?? '').slice(0, 10),
  changedOn: r.last_change_on ?? '',
  isNew: r.first_seen_at
    ? Date.now() - Date.parse(r.first_seen_at) < 36 * 3_600_000
    : false,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

const matches = (r: RegistryRecord, f: RegistryFilters) => {
  const q = f.search.trim().toLowerCase();
  return (f.kind === 'all' || r.registry === f.kind)
    && (f.state === 'All' || r.state === f.state)
    && (f.type === 'All' || r.typeCode === f.type)
    && (f.status === 'All' || r.statusCode === f.status)
    && (!f.date || r.registeredOn === f.date)
    && (f.verified === 'All' || r.verification === f.verified)
    && (f.industry === 'All' || r.industry === f.industry)
    && (!q || [r.legalName, r.tradeName, r.registrationNo, r.pan, r.state, r.email, r.phone]
          .some((v) => v.toLowerCase().includes(q)));
};

/**
 * A claimed registry contact, as a workspace lead. Mirrors what
 * claim_platform_lead() writes, so the row on screen matches the row in the
 * database rather than approximating it.
 */
export function asLead(r: RegistryRecord): Lead {
  return {
    id: r.leadId ?? r.id,
    name: r.legalName,
    title: r.registry === 'gst' ? 'Authorised signatory' : 'Director',
    company: r.tradeName || r.legalName,
    domain: '',
    email: r.email,
    phone: r.phone,
    city: r.state,
    country: 'India',
    industry: r.industry || '',
    score: 0,
    em: 'Unknown',
    // Verification travels with the copy: a number someone already reached is
    // not unknown to the person claiming it.
    ph: r.verification === 'verified' ? 'Valid'
      : r.verification === 'unreachable' ? 'Invalid' : 'Unknown',
    source: r.registry === 'gst' ? 'GST registry' : 'MCA registry',
    status: 'New',
    tags: [],
    created: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    sourceCount: 1,
    fill: [r.email, r.phone, r.tradeName, r.state, r.industry].filter(Boolean).length * 20,
  };
}

export const registry = {
  /**
   * The registry, filtered. Reads the master rather than a change journal: a
   * subscriber browsing wants the business as it stands, and `first_seen_at`
   * is enough to mark what arrived overnight.
   */
  async records(f: RegistryFilters) {
    if (!supabase) return { data: demoRecords.filter((r) => matches(r, f)), error: null };
    try {
      let q = supabase
        .from('registry_records')
        .select('*')
        .order('first_seen_at', { ascending: false })
        .limit(200);

      if (f.kind !== 'all') q = q.eq('kind', f.kind);
      if (f.state !== 'All') q = q.eq('state', f.state);
      if (f.type !== 'All') q = q.eq('type_code', f.type);
      if (f.status !== 'All') q = q.eq('status_code', f.status);
      if (f.date) q = q.eq('registered_on', f.date);
      if (f.verified !== 'All') q = q.eq('verification', f.verified);
      if (f.industry !== 'All') q = q.eq('industry', f.industry);
      if (f.search.trim()) {
        const term = `%${f.search.trim()}%`;
        q = q.or(`legal_name.ilike.${term},trade_name.ilike.${term},` +
                 `registration_no.ilike.${term},pan.ilike.${term},email.ilike.${term}`);
      }

      const { data, error } = await q;
      if (error) throw error;
      return { data: (data ?? []).map(toRecord), error: null };
    } catch (e) {
      return {
        data: demoRecords.filter((r) => matches(r, f)),
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },

  async subscriptions() {
    if (!supabase) return { data: demoSubscriptions, error: null };
    try {
      const { data, error } = await supabase
        .from('registry_subscriptions').select('*').order('created_at');
      if (error) throw error;
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      return { data: (data ?? []).map((r: any): RegistrySubscription => ({
        id: r.id,
        name: r.name,
        kinds: r.kinds ?? [],
        states: r.states ?? [],
        types: r.entity_types ?? [],
        deliverWebhook: r.deliver_webhook ?? false,
        deliverEmail: r.deliver_email ?? false,
        active: r.active ?? true,
      })), error: null };
    } catch (e) {
      return { data: demoSubscriptions, error: e instanceof Error ? e.message : String(e) };
    }
  },

  async setActive(id: string, active: boolean) {
    if (!supabase) return { error: null };
    const { error } = await supabase.from('registry_subscriptions').update({ active }).eq('id', id);
    return { error: error?.message ?? null };
  },
};

export const registryIsLive = isLive;
