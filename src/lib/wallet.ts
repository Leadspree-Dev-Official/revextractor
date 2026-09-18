import type { Tone } from './types';

/** Wallet and API billing. Mirrors 16_wallet.sql and 17_api_platform.sql. */

export type EntryKind = 'topup' | 'debit' | 'refund' | 'reversal' | 'adjustment' | 'bonus' | 'expiry';

export const entryTone: Record<EntryKind, Tone> = {
  topup: 'good', debit: 'mute', refund: 'info', reversal: 'warn',
  adjustment: 'warn', bonus: 'ai', expiry: 'bad',
};

export interface WalletEntry {
  id: number;
  kind: EntryKind;
  amount: number;
  balanceAfter: number;
  description: string;
  reference?: string;
  when: string;
}

export interface PromoOffer {
  id: string;
  name: string;
  multiplier: number; // e.g. 2 for 2x, 3 for 3x, 4 for 4x
  active: boolean;
  validUntil: string;
  minAmount: number;
  description: string;
}

export const defaultPromoOffer: PromoOffer = {
  id: 'promo_2x_booster',
  name: 'Super Admin 2X Booster Offer',
  multiplier: 2,
  active: true,
  validUntil: '23 Sep 2026 (14 days)',
  minAmount: 500,
  description: 'Special promo active: 1 INR = 2 Credits on top-ups! Double your credits for any metered extraction, enrichment or lead saving.',
};

export interface CreditPlan {
  id: string;
  name: string;
  monthlyInr: number;
  credits: number;
  multiplierText: string;
  downloadAtOnceLimit?: number; // e.g. 10 for Free
  dailyDownloadLimit?: number; // e.g. 1000 for ₹2000, 2000 for ₹4000, undefined for no limit
  isEnterprise?: boolean;
  isCustomPrice?: boolean;
  description: string;
}

export const CREDIT_PLANS: CreditPlan[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyInr: 0,
    credits: 100,
    multiplierText: '100 Credits / mo',
    downloadAtOnceLimit: 10,
    dailyDownloadLimit: 10,
    description: '100 Credits per month with 10 leads download at once',
  },
  {
    id: 'starter_500',
    name: 'Starter (₹500)',
    monthlyInr: 500,
    credits: 500,
    multiplierText: '1X credits (limited time)',
    description: '500 credits per month with standard downloads',
  },
  {
    id: 'growth_1000',
    name: 'Growth (₹1,000)',
    monthlyInr: 1000,
    credits: 2000,
    multiplierText: '2X credits (limited time)',
    description: '2,000 credits per month (2X offer, regular 1,000)',
  },
  {
    id: 'pro_2000',
    name: 'Pro (₹2,000)',
    monthlyInr: 2000,
    credits: 10000,
    multiplierText: '5X credits (limited time)',
    dailyDownloadLimit: 1000,
    description: '10,000 credits per month, 1,000 leads download limit / day',
  },
  {
    id: 'scale_4000',
    name: 'Scale (₹4,000)',
    monthlyInr: 4000,
    credits: 20000,
    multiplierText: '5X credits (limited time)',
    dailyDownloadLimit: 2000,
    description: '20,000 credits per month, 2,000 leads download limit / day',
  },
  {
    id: 'ultra_10k',
    name: 'Ultra (₹10,000)',
    monthlyInr: 10000,
    credits: 50000,
    multiplierText: '5X credits (limited time)',
    dailyDownloadLimit: undefined, // no download limit / day
    description: '50,000 credits per month, no download limit / day',
  },
  {
    id: 'enterprise_10k', // backwards compatibility alias for stored sessions
    name: 'Ultra (₹10,000)',
    monthlyInr: 10000,
    credits: 50000,
    multiplierText: '5X credits (limited time)',
    dailyDownloadLimit: undefined,
    description: '50,000 credits per month, no download limit / day',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyInr: 0,
    credits: 0,
    multiplierText: 'Custom volume & SLA',
    isCustomPrice: true,
    dailyDownloadLimit: undefined, // no download limit
    isEnterprise: true,
    description: 'Custom credit allocation, uncapped downloads, dedicated infrastructure & SLA',
  },
];

export interface SubscriptionWallet {
  planId: string;
  planLabel: string;
  monthlyInr: number;
  includedRecords: number;
  recordsUsed: number;
  periodEnd: string;
  downloadAtOnceLimit?: number;
  dailyDownloadLimit?: number;
  multiplierText?: string;
}

export const defaultSubscriptionWallet: SubscriptionWallet = {
  planId: 'pro_2000',
  planLabel: 'Pro Plan (₹2,000)',
  monthlyInr: 2_000,
  includedRecords: 10_000,
  recordsUsed: 4_210,
  periodEnd: '01 Oct 2026',
  dailyDownloadLimit: 1_000,
  multiplierText: '5X credits (limited time)',
};

export interface PaygWallet {
  balance: number; // in credits (₹1 = 1 Credit base)
  held: number;
  lowBalanceAt: number;
  autoRecharge: boolean;
  autoRechargeTo: number;
  autoRechargeAt: number;
  currency: 'INR';
}

export const wallet: PaygWallet = {
  balance: 48_260,
  held: 3_400,
  lowBalanceAt: 5_000,
  autoRecharge: true,
  autoRechargeTo: 50_000,
  autoRechargeAt: 5_000,
  currency: 'INR',
};

export const defaultPaygWallet = wallet;

export const spendable = wallet.balance - wallet.held;

export function calculateTopupCredits(inrAmount: number, promo?: PromoOffer | null) {
  const baseCredits = Math.max(0, Math.floor(inrAmount));
  const isPromoEligible = Boolean(promo?.active && inrAmount >= (promo?.minAmount ?? 0) && (promo?.multiplier ?? 1) > 1);
  const multiplier = isPromoEligible ? (promo?.multiplier ?? 1) : 1;
  const totalCredits = Math.floor(baseCredits * multiplier);
  const bonusCredits = totalCredits - baseCredits;

  return {
    inrAmount,
    baseCredits,
    multiplier,
    bonusCredits,
    totalCredits,
    isPromoApplied: isPromoEligible,
  };
}

export const formatCredits = (n: number) =>
  `${n.toLocaleString('en-IN')} ${n === 1 ? 'credit' : 'credits'}`;

export const walletEntries: WalletEntry[] = [
  [1, 'debit', -1_842, 48_260, 'API extraction · google_business · 1,536 records', 'api_job 7f2a', '18 min ago'],
  [2, 'debit', -640, 50_102, 'Enrichment · 800 records', 'enrich_8841', '2 h ago'],
  [3, 'topup', 25_000, 50_742, 'Wallet top-up · UPI (+25,000 bonus credits from 2X Offer)', 'pay_MK92104', '5 h ago'],
  [4, 'debit', -2_204, 25_742, 'API extraction · indiamart · 1,836 records', 'api_job 6b19', 'Yesterday'],
  [5, 'refund', 310, 27_946, 'Partial refund · job returned fewer records than reserved', 'api_job 6b19', 'Yesterday'],
  [6, 'debit', -1_120, 27_636, 'Verification · 5,600 numbers', 'verify_2210', '2 d ago'],
  [7, 'bonus', 5_000, 28_756, 'Super Admin launch credit', 'promo_LAUNCH', '4 d ago'],
  [8, 'debit', -980, 23_756, 'API extraction · website · 816 records', 'api_job 5c07', '5 d ago'],
].map(([id, kind, amount, balanceAfter, description, reference, when]) => ({
  id, kind, amount, balanceAfter, description, reference, when,
} as WalletEntry));

/* ── the API product ──────────────────────────────────────────────────────── */

export interface ApiPlan {
  id: string;
  label: string;
  kind: 'payg' | 'monthly';
  monthlyInr: number;
  includedRecords: number;
  overagePerRecord: number;
  ratePerMinute: number;
  maxConcurrent: number;
  maxPerJob: number;
}

/** Pure PAYG: No separate monthly API plans; extraction draws directly from wallet credits */
export const apiPlans: ApiPlan[] = [
  { id: 'payg', label: 'Pay as you go (PAYG)', kind: 'payg', monthlyInr: 0, includedRecords: 0, overagePerRecord: 1.0, ratePerMinute: 60, maxConcurrent: 5, maxPerJob: 50_000 },
];

export const apiSubscription = {
  planId: 'payg',
  recordsUsed: 12_840,
  periodEnd: 'Perpetual (PAYG)',
  capAtIncluded: false,
};

export type ApiJobState = 'queued' | 'running' | 'succeeded' | 'partial' | 'failed' | 'cancelled';

export const apiJobTone: Record<ApiJobState, Tone> = {
  queued: 'warn', running: 'info', succeeded: 'good',
  partial: 'warn', failed: 'bad', cancelled: 'mute',
};

export interface ApiJob {
  id: string;
  source: string;
  query: string;
  requested: number;
  found: number;
  uniqueToPool: number;
  state: ApiJobState;
  charged: number;
  when: string;
}

export const apiJobs: ApiJob[] = [
  ['job_7f2a91', 'google_business', 'auto parts dealers · Pune', 2_000, 1_536, 402, 'succeeded', 1_842, '18 min ago'],
  ['job_6d18c4', 'website', '640 domains', 640, 0, 0, 'running', 0, '24 min ago'],
  ['job_6b19f0', 'indiamart', 'polymer suppliers · Gujarat', 2_500, 1_836, 918, 'partial', 2_204, 'Yesterday'],
  ['job_5c07ab', 'website', '900 domains', 900, 816, 288, 'succeeded', 980, '5 d ago'],
  ['job_5a13de', 'tradeindia', 'textile exporters', 1_200, 0, 0, 'failed', 0, '5 d ago'],
  ['job_4e88bc', 'google_search', 'logistics firms · Chennai', 800, 800, 141, 'succeeded', 960, '6 d ago'],
].map(([id, source, query, requested, found, uniqueToPool, state, charged, when]) => ({
  id, source, query, requested, found, uniqueToPool, state, charged, when,
} as ApiJob));

/** Daily volume for the usage chart. */
export const apiDaily = [
  ['26 Aug', '1.2k', 34], ['27 Aug', '2.1k', 58], ['28 Aug', '1.8k', 50],
  ['29 Aug', '2.9k', 80], ['30 Aug', '3.4k', 94], ['31 Aug', '2.2k', 61],
  ['01 Sep', '1.1k', 31], ['02 Sep', '3.6k', 100],
].map(([label, value, pct]) => ({ label: label as string, value: value as string, pct: pct as number }));

export const inr = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: n % 1 === 0 ? 0 : 2 })}`;
