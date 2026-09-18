/** Content and theme for a landing page. One schema; six templates read from it. */

export type FieldKey = 'email' | 'name' | 'company' | 'phone' | 'website' | 'message' | 'city';

export const FIELD_LABELS: Record<FieldKey, { label: string; placeholder: string; type: string }> = {
  email:   { label: 'Work email', placeholder: 'you@company.com', type: 'email' },
  name:    { label: 'Full name', placeholder: 'Your name', type: 'text' },
  company: { label: 'Company', placeholder: 'Company name', type: 'text' },
  phone:   { label: 'Phone', placeholder: '+91 98765 43210', type: 'tel' },
  website: { label: 'Website', placeholder: 'company.com', type: 'text' },
  city:    { label: 'City', placeholder: 'Where are you based?', type: 'text' },
  message: { label: 'What are you looking for?', placeholder: 'Two lines is plenty', type: 'textarea' },
};

export interface Speaker { name: string; role: string }
export interface ProofPoint { stat: string; label: string }

export interface LandingContent {
  logoText: string;
  headline: string;
  subhead: string;
  bullets: string[];
  formTitle: string;
  ctaLabel: string;
  fields: FieldKey[];
  thanksMessage: string;
  footnote: string;
  imageUrl: string;

  /* webinar */
  eventDate: string;
  eventTime: string;
  speakers: Speaker[];
  agenda: string[];

  /* giveaway */
  prize: string;
  prizeValue: string;
  endsAt: string;

  /* demo request */
  logos: string[];
  proofPoints: ProofPoint[];
}

export interface LandingTheme {
  accent: string;
  ink: string;
  surface: string;
  radius: number;
  typeface: 'sans' | 'serif' | 'mono';
  dark: boolean;
}

export type TemplateId =
  | 'lead_magnet' | 'waitlist' | 'webinar' | 'giveaway' | 'demo_request' | 'coming_soon';

export interface TemplateMeta {
  id: TemplateId;
  label: string;
  description: string;
  category: 'B2B' | 'B2C';
  bestFor: string;
  defaultFields: FieldKey[];
  /** which content keys this template actually renders — drives the editor */
  uses: Array<keyof LandingContent>;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: 'lead_magnet',
    label: 'Lead magnet',
    description: 'Split layout — the offer on the left, a short form on the right.',
    category: 'B2B',
    bestFor: 'Guides, playbooks, templates',
    defaultFields: ['email', 'company'],
    uses: ['logoText', 'headline', 'subhead', 'bullets', 'formTitle', 'ctaLabel', 'imageUrl', 'footnote'],
  },
  {
    id: 'waitlist',
    label: 'Waitlist',
    description: 'One centred column. Headline, one line, one field.',
    category: 'B2B',
    bestFor: 'Pre-launch signups',
    defaultFields: ['email'],
    uses: ['logoText', 'headline', 'subhead', 'ctaLabel', 'footnote'],
  },
  {
    id: 'webinar',
    label: 'Webinar',
    description: 'Date badge, speakers and an agenda beside the form.',
    category: 'B2B',
    bestFor: 'Events and live sessions',
    defaultFields: ['email', 'name', 'company'],
    uses: ['logoText', 'headline', 'subhead', 'eventDate', 'eventTime', 'speakers', 'agenda', 'formTitle', 'ctaLabel'],
  },
  {
    id: 'giveaway',
    label: 'Giveaway',
    description: 'Prize hero, live entry counter and a countdown.',
    category: 'B2C',
    bestFor: 'Contests and prize draws',
    defaultFields: ['email', 'name'],
    uses: ['logoText', 'headline', 'subhead', 'prize', 'prizeValue', 'endsAt', 'imageUrl', 'ctaLabel', 'footnote'],
  },
  {
    id: 'demo_request',
    label: 'Demo request',
    description: 'Longer form with proof points and customer logos.',
    category: 'B2B',
    bestFor: 'Sales-led products',
    defaultFields: ['email', 'name', 'company', 'phone'],
    uses: ['logoText', 'headline', 'subhead', 'bullets', 'logos', 'proofPoints', 'formTitle', 'ctaLabel'],
  },
  {
    id: 'coming_soon',
    label: 'Coming soon',
    description: 'Full-bleed image, one line, one field.',
    category: 'B2C',
    bestFor: 'Launches and drops',
    defaultFields: ['email'],
    uses: ['logoText', 'headline', 'subhead', 'imageUrl', 'ctaLabel'],
  },
];

export const templateMeta = (id: TemplateId) =>
  TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]!;

export const defaultContent: LandingContent = {
  logoText: 'LeadBro',
  headline: 'Find every business worth calling in your market',
  subhead:
    'A 24-page playbook on sourcing, cleaning and verifying B2B data from directories, maps and '
    + 'company websites — with the checks that keep your sending reputation intact.',
  bullets: [
    '9 sources compared on coverage and cost',
    'Normalization rules you can copy',
    'Verification thresholds by country',
  ],
  formTitle: 'Get the playbook',
  ctaLabel: 'Send me the playbook',
  fields: ['email', 'company'],
  thanksMessage: 'Check your inbox — the playbook is on its way.',
  footnote: 'No spam. Unsubscribe in one click.',
  imageUrl: '',

  eventDate: '18 September',
  eventTime: '4:00 PM IST · 45 minutes',
  speakers: [
    { name: 'Rahul Mitra', role: 'Head of Data, LeadBro' },
    { name: 'Aditi Ghosh', role: 'Growth Lead, Vertex Outbound' },
  ],
  agenda: [
    'Where B2B data actually comes from',
    'Deduplication that survives five sources',
    'Verifying before you send, not after',
  ],

  prize: 'A year of LeadBro Business',
  prizeValue: '₹1,90,000',
  endsAt: '30 September',

  logos: ['Northgate', 'Vantic', 'Meridian', 'Kellerman', 'Brennt'],
  proofPoints: [
    { stat: '478K', label: 'records in the shared pool' },
    { stat: '9', label: 'sources, one pipeline' },
    { stat: '44%', label: 'average open rate' },
  ],
};

export const defaultTheme: LandingTheme = {
  accent: '#0F766E',
  ink: '#0E1620',
  surface: '#FFFFFF',
  radius: 10,
  typeface: 'sans',
  dark: false,
};

export const THEME_PRESETS: Array<{ label: string; theme: LandingTheme }> = [
  { label: 'Teal', theme: { ...defaultTheme } },
  { label: 'Ink', theme: { ...defaultTheme, accent: '#1F2937', radius: 4 } },
  { label: 'Ember', theme: { ...defaultTheme, accent: '#C2410C', radius: 14 } },
  { label: 'Indigo', theme: { ...defaultTheme, accent: '#4338CA', radius: 10, typeface: 'serif' } },
  { label: 'Midnight', theme: { ...defaultTheme, accent: '#2DD4BF', ink: '#F1F5F7', surface: '#111820', dark: true, radius: 12 } },
];

export const typefaceStack: Record<LandingTheme['typeface'], string> = {
  sans: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: '"IBM Plex Mono", ui-monospace, monospace',
};

/** Slugs are what a public URL is made of, so keep them boring. */
export const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
