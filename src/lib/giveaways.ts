import type { Tone } from './types';

/** Giveaway model. Mirrors supabase/07_collect.sql. */

export type GiveawayStatus = 'draft' | 'scheduled' | 'running' | 'closed' | 'drawn' | 'cancelled';
export type EntryState = 'unconfirmed' | 'confirmed' | 'disqualified' | 'won';

export interface BonusAction {
  id: number;
  kind: 'refer' | 'visit' | 'follow_x' | 'follow_instagram' | 'follow_linkedin'
      | 'subscribe_youtube' | 'join_whatsapp' | 'answer_question' | 'share';
  label: string;
  url?: string;
  bonusEntries: number;
  repeatable: boolean;
}

export interface Giveaway {
  id: string;
  slug: string;
  title: string;
  prize: string;
  prizeValue: string;
  description: string;
  endsAt: string;
  daysLeft: number;
  winnerCount: number;
  status: GiveawayStatus;
  entryCount: number;
  confirmedCount: number;
  viewCount: number;
  referredShare: number;
  actions: BonusAction[];
  seedCommitment: string;
}

export interface Entry {
  id: string;
  name: string;
  email: string;
  entries: number;
  referrals: number;
  state: EntryState;
  joined: string;
  via: string;
}

export const statusTone: Record<GiveawayStatus, Tone> = {
  draft: 'mute', scheduled: 'info', running: 'good',
  closed: 'warn', drawn: 'ai', cancelled: 'bad',
};

export const entryTone: Record<EntryState, Tone> = {
  unconfirmed: 'warn', confirmed: 'good', disqualified: 'bad', won: 'ai',
};

export const demoGiveaways: Giveaway[] = [
  {
    id: 'gw_1',
    slug: 'business-year',
    title: 'Win a year of LeadBro Business',
    prize: 'A year of LeadBro Business',
    prizeValue: '₹1,90,000',
    description: 'Everything in Business for twelve months — 75,000 leads, 15,000 credits, unlimited campaigns.',
    endsAt: '30 Sep 2026',
    daysLeft: 26,
    winnerCount: 1,
    status: 'running',
    entryCount: 3126,
    confirmedCount: 2884,
    viewCount: 21840,
    referredShare: 61,
    seedCommitment: 'a3f1c8e2…9d47',
    actions: [
      { id: 1, kind: 'refer', label: 'Refer a friend', bonusEntries: 3, repeatable: true },
      { id: 2, kind: 'follow_linkedin', label: 'Follow us on LinkedIn', url: 'https://linkedin.com/company/leadbro', bonusEntries: 2, repeatable: false },
      { id: 3, kind: 'follow_instagram', label: 'Follow us on Instagram', url: 'https://instagram.com/leadbro', bonusEntries: 2, repeatable: false },
      { id: 4, kind: 'join_whatsapp', label: 'Join the WhatsApp channel', url: 'https://whatsapp.com/channel/leadbro', bonusEntries: 3, repeatable: false },
      { id: 5, kind: 'visit', label: 'Read the sourcing playbook', url: '/p/data-playbook', bonusEntries: 1, repeatable: false },
    ],
  },
  {
    id: 'gw_2',
    slug: 'iphone-diwali',
    title: 'Diwali draw — iPhone 17 Pro',
    prize: 'iPhone 17 Pro 256GB',
    prizeValue: '₹1,34,900',
    description: 'Free entry for all registered Indian businesses. Drawn on Diwali eve.',
    endsAt: '31 Oct 2026',
    daysLeft: 58,
    winnerCount: 1,
    status: 'running',
    entryCount: 18402,
    confirmedCount: 16118,
    viewCount: 96240,
    referredShare: 74,
    seedCommitment: '7b2e40aa…13c9',
    actions: [
      { id: 6, kind: 'refer', label: 'Refer a friend', bonusEntries: 5, repeatable: true },
      { id: 7, kind: 'follow_instagram', label: 'Follow on Instagram', url: 'https://instagram.com/leadbro', bonusEntries: 2, repeatable: false },
      { id: 8, kind: 'share', label: 'Share on WhatsApp', bonusEntries: 2, repeatable: false },
    ],
  },
  {
    id: 'gw_3',
    slug: 'summer-credits',
    title: '50,000 extraction credits',
    prize: '50,000 extraction credits',
    prizeValue: '₹42,000',
    description: 'Three winners, 50k credits each.',
    endsAt: '12 Aug 2026',
    daysLeft: 0,
    winnerCount: 3,
    status: 'drawn',
    entryCount: 8940,
    confirmedCount: 8102,
    viewCount: 41200,
    referredShare: 55,
    seedCommitment: 'c4109fd1…88ab',
    actions: [{ id: 9, kind: 'refer', label: 'Refer a friend', bonusEntries: 3, repeatable: true }],
  },
];

export const demoEntries: Entry[] = [
  ['Aarti Deshmukh', 'aarti.deshmukh@gmail.com', 47, 14, 'confirmed', '2 h ago', 'Referral'],
  ['Rohan Pillai', 'rohan.pillai@outlook.com', 31, 9, 'confirmed', '4 h ago', 'Instagram'],
  ['Sneha Bhatt', 'sneha.bhatt@yahoo.in', 28, 8, 'confirmed', '5 h ago', 'Referral'],
  ['Imran Sheikh', 'imran.sheikh@gmail.com', 22, 6, 'confirmed', '6 h ago', 'Direct'],
  ['Divya Menon', 'divya.menon@gmail.com', 19, 5, 'confirmed', 'Yesterday', 'WhatsApp'],
  ['Karan Malhotra', 'karan.m@protonmail.com', 14, 3, 'confirmed', 'Yesterday', 'Referral'],
  ['Nikhil Rao', 'nikhil.rao@gmail.com', 8, 2, 'confirmed', 'Yesterday', 'LinkedIn'],
  ['Priya Sundaram', 'priya.s@gmail.com', 4, 1, 'unconfirmed', '2 d ago', 'Direct'],
  ['test entry', 'burner@mailinator.com', 1, 0, 'disqualified', '2 d ago', 'Direct'],
].map(([name, email, entries, referrals, state, joined, via], i) => ({
  id: `e_${i + 1}`, name, email, entries, referrals, state, joined, via,
} as Entry));

export const actionLabels: Record<BonusAction['kind'], string> = {
  refer: 'Refer a friend',
  visit: 'Visit a page',
  follow_x: 'Follow on X',
  follow_instagram: 'Follow on Instagram',
  follow_linkedin: 'Follow on LinkedIn',
  subscribe_youtube: 'Subscribe on YouTube',
  join_whatsapp: 'Join WhatsApp channel',
  answer_question: 'Answer a question',
  share: 'Share the giveaway',
};
