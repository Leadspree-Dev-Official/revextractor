import type { Tone } from './types';

/**
 * Lucky draws — coupon-number prize draws.
 *
 * Distinct from the viral giveaway in giveaways.ts: identity is a number, not
 * an email; one enrolment earns exactly one chance; and the holder finds out by
 * typing their number into a public page rather than waiting for an email.
 */

export type DrawStatus = 'draft' | 'issuing' | 'closed' | 'drawn' | 'cancelled';
export type CouponState = 'issued' | 'won' | 'lost' | 'claimed' | 'void' | 'expired';

export type PrizeKind = 'cash' | 'goods' | 'voucher' | 'virtual' | 'service' | 'experience';

export const PRIZE_KIND_LABEL: Record<PrizeKind, string> = {
  cash: 'Cash', goods: 'Goods', voucher: 'Voucher',
  virtual: 'Virtual', service: 'Service', experience: 'Experience',
};

export interface Prize {
  tier: number;
  label: string;
  valueText: string;
  /** Rupee value even for a non-cash prize — s.194B taxes winnings in kind too. */
  valueInr: number;
  kind: PrizeKind;
  winnerCount: number;
}

export interface Sponsor {
  legalName: string;
  brandName?: string;
  contactEmail: string;
  liabilityAcceptedAt?: string;
}

/** Kept in settings server-side; mirrored here for the estimate shown to organisers. */
export const PRIZE_TAX = { ratePct: 30, thresholdInr: 10_000, section: '194B' };

/** What the sponsor owes before handing the prize over. LeadBro never withholds. */
export function prizeTaxNote(prize: Prize, sponsor?: Sponsor) {
  if (!prize.valueInr) {
    return { applies: false, amount: 0, guidance: 'Set a rupee value — winnings in kind are taxable at fair market value.' };
  }
  if (prize.valueInr < PRIZE_TAX.thresholdInr) {
    return { applies: false, amount: 0, guidance: `Below the ₹${PRIZE_TAX.thresholdInr.toLocaleString('en-IN')} threshold.` };
  }
  const amount = Math.round((prize.valueInr * PRIZE_TAX.ratePct) / 100);
  const who = sponsor?.legalName ?? 'The sponsor';
  return {
    applies: true,
    amount,
    guidance: prize.kind === 'cash'
      ? `${who} deducts ₹${amount.toLocaleString('en-IN')} from the payout and deposits it.`
      : `${who} must collect or bear ₹${amount.toLocaleString('en-IN')} before handing this over — a prize in kind is still a taxable winning.`,
  };
}

export interface DrawCampaign {
  id: string;
  slug: string;
  title: string;
  description: string;
  codePrefix: string;
  issueUntil: string;
  drawAt: string;
  claimBy: string;
  status: DrawStatus;
  issued: number;
  checked: number;
  claimed: number;
  seedCommitment: string;
  prizes: Prize[];
  sponsor: Sponsor;
}

export interface Coupon {
  code: string;
  name: string;
  email: string;
  issuedVia: string;
  issuedAt: string;
  state: CouponState;
  prize?: string;
  checks: number;
}

export const drawStatusTone: Record<DrawStatus, Tone> = {
  draft: 'mute', issuing: 'good', closed: 'warn', drawn: 'ai', cancelled: 'bad',
};

export const couponStateTone: Record<CouponState, Tone> = {
  issued: 'info', won: 'good', lost: 'mute', claimed: 'ai', void: 'bad', expired: 'warn',
};

export const demoDraws: DrawCampaign[] = [
  {
    id: 'dc_1',
    slug: 'festive-cashback',
    title: 'Festive cashback draw',
    description: 'Every prospect who enrols gets a coupon number. Ten winners share ₹5,00,000.',
    codePrefix: 'STR',
    issueUntil: '25 Oct 2026',
    drawAt: '02 Nov 2026',
    claimBy: '30 Nov 2026',
    status: 'issuing',
    issued: 14_206,
    checked: 3_918,
    claimed: 0,
    seedCommitment: 'f31ac907…2b84',
    sponsor: {
      legalName: 'Sterling Auto Components Pvt Ltd',
      brandName: 'Sterling Auto',
      contactEmail: 'promotions@sterlingauto.in',
      liabilityAcceptedAt: '18 Aug 2026',
    },
    prizes: [
      { tier: 1, label: 'Grand prize — ₹2,00,000 cashback', valueText: '₹2,00,000', valueInr: 200_000, kind: 'cash', winnerCount: 1 },
      { tier: 2, label: 'Second prize — ₹50,000 cashback', valueText: '₹50,000', valueInr: 50_000, kind: 'cash', winnerCount: 2 },
      { tier: 3, label: 'Consolation — ₹25,000 cashback', valueText: '₹25,000', valueInr: 25_000, kind: 'cash', winnerCount: 8 },
    ],
  },
  {
    id: 'dc_2',
    slug: 'demo-draw',
    title: 'Book a demo, win a MacBook',
    description: 'A coupon with every completed demo booking.',
    codePrefix: 'LS',
    issueUntil: '18 Sep 2026',
    drawAt: '20 Sep 2026',
    claimBy: '20 Oct 2026',
    status: 'issuing',
    issued: 2_884,
    checked: 902,
    claimed: 0,
    seedCommitment: '90bd4e12…7fa1',
    sponsor: {
      legalName: 'LeadBro Technologies Pvt Ltd',
      brandName: 'LeadBro',
      contactEmail: 'promotions@leadbro.io',
      liabilityAcceptedAt: '02 Sep 2026',
    },
    prizes: [
      { tier: 1, label: 'MacBook Air M4', valueText: '₹1,14,900', valueInr: 114_900, kind: 'goods', winnerCount: 1 },
      { tier: 2, label: '12 months of LeadBro Pro', valueText: '₹9,600', valueInr: 9_600, kind: 'virtual', winnerCount: 5 },
    ],
  },
  {
    id: 'dc_3',
    slug: 'monsoon-draw',
    title: 'Monsoon supplier draw',
    description: 'Closed and drawn. Results are live on the public page.',
    codePrefix: 'BNS',
    issueUntil: '10 Aug 2026',
    drawAt: '15 Aug 2026',
    claimBy: '15 Sep 2026',
    status: 'drawn',
    issued: 6_410,
    checked: 5_204,
    claimed: 3,
    seedCommitment: '2ce8801f…44d0',
    sponsor: {
      legalName: 'Bansal Polymers Pvt Ltd',
      brandName: 'Bansal Polymers',
      contactEmail: 'draws@bansalpolymers.in',
      liabilityAcceptedAt: '01 Jul 2026',
    },
    prizes: [
      { tier: 1, label: '₹1,00,000 order credit', valueText: '₹1,00,000', valueInr: 100_000, kind: 'voucher', winnerCount: 1 },
      { tier: 2, label: '₹20,000 order credit', valueText: '₹20,000', valueInr: 20_000, kind: 'voucher', winnerCount: 4 },
    ],
  },
];

export const demoCoupons: Coupon[] = [
  ['STR-K7PQ-4M28', 'Aarti Deshmukh', 'aarti.deshmukh@gmail.com', 'Capture form', '2 h ago', 'issued', undefined, 1],
  ['STR-B3XT-9WHR', 'Rohan Pillai', 'rohan.pillai@outlook.com', 'Capture form', '4 h ago', 'issued', undefined, 3],
  ['STR-QM42-7TKD', 'Sneha Bhatt', 'sneha.bhatt@yahoo.in', 'Import', '6 h ago', 'issued', undefined, 0],
  ['STR-9TVW-2JHY', 'Imran Sheikh', 'imran.sheikh@gmail.com', 'API', 'Yesterday', 'issued', undefined, 2],
  ['STR-L4NP-6RQX', 'Divya Menon', 'divya.menon@gmail.com', 'Capture form', 'Yesterday', 'issued', undefined, 0],
  ['BNS-H8KD-3PWM', 'Karan Malhotra', 'karan.m@protonmail.com', 'Capture form', '10 Aug', 'claimed', '₹1,00,000 order credit', 6],
  ['BNS-2QRT-8YVN', 'Nikhil Rao', 'nikhil.rao@gmail.com', 'Capture form', '09 Aug', 'won', '₹20,000 order credit', 4],
  ['BNS-W6MJ-4XPK', 'Priya Sundaram', 'priya.s@gmail.com', 'Import', '08 Aug', 'lost', undefined, 1],
].map(([code, name, email, issuedVia, issuedAt, state, prize, checks]) => ({
  code, name, email, issuedVia, issuedAt, state, prize, checks,
} as Coupon));

/** Public lookup result — mirrors check_coupon() in 08_draws.sql. */
export interface CouponLookup {
  found: boolean;
  status: 'pending' | 'won' | 'lost' | 'claimed' | 'void' | 'not_found' | 'throttled';
  headline: string;
  detail: string;
  prizeLabel?: string;
  drawTitle?: string;
  drawAt?: string;
  claimBy?: string;
  maskedHolder?: string;
}

const mask = (email: string) => `${email.slice(0, 2)}•••@${email.split('@')[1] ?? ''}`;

/** Demo-mode lookup. Live mode calls the RPC, which returns the same shape. */
export function lookupCoupon(raw: string): CouponLookup {
  const code = raw.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (!code) {
    return { found: false, status: 'not_found', headline: 'Enter your number', detail: 'It looks like STR-ABCD-2345.' };
  }

  const coupon = demoCoupons.find((c) => c.code === code);
  if (!coupon) {
    return {
      found: false,
      status: 'not_found',
      headline: "We can't find that number",
      detail: 'Check it and try again — it should look like STR-ABCD-2345, with two blocks of four.',
    };
  }

  const draw = demoDraws.find((d) => coupon.code.startsWith(d.codePrefix))!;

  if (draw.status !== 'drawn') {
    return {
      found: true, status: 'pending',
      headline: "You're in the draw",
      detail: `Results are published here on ${draw.drawAt}. Come back with this number.`,
      drawTitle: draw.title, drawAt: draw.drawAt, claimBy: draw.claimBy,
    };
  }

  if (coupon.state === 'claimed') {
    return {
      found: true, status: 'claimed',
      headline: 'Already claimed',
      detail: 'This prize has been claimed.',
      prizeLabel: coupon.prize, drawTitle: draw.title, maskedHolder: mask(coupon.email),
    };
  }

  if (coupon.state === 'won') {
    return {
      found: true, status: 'won',
      headline: 'You won',
      detail: `Claim it with the email this number was issued to, by ${draw.claimBy}.`,
      prizeLabel: coupon.prize, drawTitle: draw.title, claimBy: draw.claimBy,
      maskedHolder: mask(coupon.email),
    };
  }

  return {
    found: true, status: 'lost',
    headline: 'Not this time',
    detail: "This number wasn't drawn. Thanks for entering.",
    drawTitle: draw.title,
  };
}

/** Sample codes for the demo page, so nobody has to invent one. */
export const sampleCodes = {
  pending: 'STR-K7PQ-4M28',
  won: 'BNS-2QRT-8YVN',
  lost: 'BNS-W6MJ-4XPK',
  claimed: 'BNS-H8KD-3PWM',
};
