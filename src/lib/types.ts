/** Domain vocabulary. These names match supabase/schema.sql column values. */

export type Tone = 'good' | 'info' | 'warn' | 'bad' | 'mute' | 'ai';

/** §78 — the five classes LeadBro never blurs together. */
export type Provenance = 'Observed' | 'Inferred' | 'Enriched' | 'Verified' | 'AI Generated';

export type EmailStatus = 'Unknown' | 'Format Valid' | 'Verified' | 'Invalid' | 'Risky';
export type PhoneStatus = 'Unknown' | 'Valid' | 'Invalid' | 'Mobile' | 'Landline';

export type LeadStatus =
  | 'New' | 'Contacted' | 'Qualified' | 'Meeting' | 'Opportunity' | 'Customer' | 'Lost';

export type JobStatus =
  | 'Draft' | 'Queued' | 'Running' | 'Processing'
  | 'Completed' | 'Partially Completed' | 'Failed' | 'Cancelled';

export type ConnectorStatus = 'Connected' | 'Not Connected' | 'Requires API Key' | 'Coming Soon';

export interface Lead {
  id: number;
  name: string;
  title: string;
  company: string;
  domain: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  industry: string;
  score: number;
  em: EmailStatus;
  ph: PhoneStatus;
  source: string;
  status: LeadStatus;
  tags: string[];
  created: string;
  sourceCount: number;
  /** data completeness %, kept separate from score (§32) */
  fill: number;
}

export interface Company {
  id: number;
  name: string;
  domain: string;
  industry: string;
  city: string;
  country: string;
  employees: string;
  revenue: string;
  founded: string;
  phone: string;
  email: string;
  sources: string[];
  tech: string[];
  contacts: number;
  score: number;
}

export interface ExtractionJob {
  id: number;
  code: string;
  source: string;
  query: string;
  location: string;
  requested: number;
  found: number;
  new: number;
  dup: number;
  invalid: number;
  status: JobStatus;
  progress: number;
  started: string;
  duration: string;
}

/** The board's columns, in order. `deals.stage` in 01_core.sql holds one of these. */
export const dealStages = [
  'New', 'Contacted', 'Qualified', 'Meeting', 'Proposal', 'Won', 'Lost',
] as const;

export type DealStage = (typeof dealStages)[number];

export interface Deal {
  id: number;
  name: string;
  company: string;
  contact: string;
  /** Numeric, because a column total cannot be computed from "₹18.4 L". */
  amount: number;
  /** Matches deals.value_currency. Totals are per-currency; nothing is converted. */
  currency: 'USD' | 'EUR' | 'INR';
  stage: DealStage;
  /** 0-100, matching deals.probability. */
  probability: number;
  close: string;
  owner: string;
}

export interface Task {
  id: number;
  task: string;
  lead: string;
  kind: 'Follow-up' | 'Call' | 'Email' | 'Meeting' | 'Research';
  due: string;
  priority: 'High' | 'Medium' | 'Low';
  owner: string;
  done: boolean;
}

export interface ListRecord {
  name: string;
  type: 'Static' | 'Dynamic';
  count: string;
  criteria: string;
  updated: string;
  owner: string;
}

export interface SourceDef {
  name: string;
  icon: string;
  status: ConnectorStatus;
  desc: string;
  records: string;
}

export interface LeadResearchData {
  status: 'unresearched' | 'researching' | 'completed';
  researchedAt?: string;
  summary?: Array<{ label: string; body: string }>;
  talkingPoints?: string[];
  facts?: Array<{ label: string; value: string; prov: Provenance }>;
  sources?: Array<{ prov: Provenance; url: string; date: string }>;
}

export interface CampaignLead {
  id: string;
  leadId?: number;
  name: string;
  title: string;
  company: string;
  domain?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  source: 'Pool' | 'Registry' | 'Find Leads' | 'Find Companies' | 'Leads' | 'Companies' | 'Extraction';
  savedAt: string;
  verified?: boolean; // Email mailbox verified
  phoneVerified?: boolean; // Telecom line active & verified
  dndStatus?: 'Non-DND' | 'DND' | 'Unknown'; // TRAI DND registry status
  research?: LeadResearchData;
}

export interface SavedCampaign {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  leads: CampaignLead[];
}

/* ── platform layer ───────────────────────────────────────────────────────── */

/** A row in the shared pool. Read-only until a workspace claims it. */
/**
 * A pool company as the registry fan-out leaves it — the same filing the
 * Registry screen shows, told as a business. Reads the `pool_companies` view.
 */
export interface PoolCompany {
  id: number;
  name: string;
  industry: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  registry: 'mca' | 'gst' | null;
  registrationNo: string;
  status: string;
  entityType: string;
  registeredOn: string;
  contacts: number;
  /** When the registry itself last confirmed the row. */
  syncedOn: string;
}

export interface PoolLead {
  id: number;
  name: string;
  title: string;
  company: string;
  domain: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  industry: string;
  source: string;
  completeness: number;
  quality: number;
  claimCount: number;
  addedOn: string;
  /** last time a contact method on this record was proven to work */
  updatedOn: string;
  freshness: Freshness;
  revision: number;
  recordType: RecordType;
  consumer?: ConsumerAttributes;
  /** consumer records must carry a lawful basis before they can be published */
  consentBasis?: string;
  dnd?: DndStatus;
  /** true once this workspace holds a copy */
  claimed: boolean;
}

export type Freshness = 'fresh' | 'recent' | 'ageing' | 'stale' | 'unverified';

export type RecordType = 'b2b' | 'b2c';
export type DndStatus = 'unchecked' | 'clear' | 'registered' | 'partial' | 'unsupported';
export type DeliveryChannel = 'email' | 'voice' | 'sms' | 'whatsapp';

/** B2C attributes are banded on purpose — enough to target on, far less sensitive to hold. */
export interface ConsumerAttributes {
  ageBand?: string;
  cityTier?: string;
  incomeBand?: string;
  interests?: string[];
  lifeEvent?: string;
  language?: string;
}

export interface ChangeRequest {
  id: number;
  lead: string;
  company: string;
  field: string;
  currentValue: string;
  proposedValue: string;
  reason: string;
  requestedBy: string;
  workspace: string;
  status: 'pending' | 'approved' | 'rejected' | 'superseded';
  requestedAt: string;
}

export interface PoolBatch {
  id: string;
  label: string;
  source: string;
  rows: number;
  accepted: number;
  merged: number;
  rejected: number;
  status: 'draft' | 'validating' | 'ready' | 'published' | 'reverted' | 'failed';
  createdBy: string;
  createdAt: string;
}

export interface ContributionRow {
  id: number;
  workspace: string;
  company: string;
  contact: string;
  source: string;
  state: 'pending' | 'merged' | 'created' | 'rejected' | 'ineligible';
  queuedAt: string;
}

export interface AdConnection {
  id: string;
  platform: 'meta_ads' | 'google_ads';
  name: string;
  accountRef: string;
  status: ConnectorStatus;
  leadCount: number;
  lastLeadAt: string;
}
