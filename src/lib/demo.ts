import type {
  Company, Deal, ExtractionJob, Lead, ListRecord, SavedCampaign, SourceDef, Task,
} from './types';

/**
 * §66 Demo mode. Seeded, realistic, and labelled DEMO DATA everywhere it shows.
 * Nothing here is presented as verified real-world data.
 */

const leadKeys = [
  'name', 'title', 'company', 'domain', 'email', 'phone', 'city', 'country', 'industry',
  'score', 'em', 'ph', 'source', 'status', 'tags', 'created', 'sourceCount', 'fill',
] as const;

const leadRows: unknown[][] = [
  ['Ananya Sharma', 'Head of Growth', 'Nexverse Labs', 'nexverse.io', 'ananya@nexverse.io', '+91 98301 44210', 'Kolkata', 'India', 'SaaS', 91, 'Verified', 'Mobile', 'Google Business', 'Qualified', ['Hot', 'Decision Maker'], '02 Sep', 4, 96],
  ['Marcus Feld', 'VP Sales', 'Northgate Systems', 'northgate.com', 'm.feld@northgate.com', '+1 415 555 0182', 'San Francisco', 'USA', 'Enterprise Software', 88, 'Verified', 'Valid', 'Website', 'Contacted', ['High Intent'], '02 Sep', 3, 90],
  ['Rohit Bansal', 'Managing Director', 'Bansal Polymers', 'bansalpolymers.in', 'sales@bansalpolymers.in', '+91 33 4012 8890', 'Howrah', 'India', 'Manufacturing', 74, 'Format Valid', 'Landline', 'IndiaMART', 'New', ['Manufacturer'], '01 Sep', 5, 83],
  ['Sofia Renner', 'Director of RevOps', 'Kellerman Group', 'kellerman.de', 's.renner@kellerman.de', '+49 30 8873 2210', 'Berlin', 'Germany', 'Logistics', 82, 'Verified', 'Valid', 'Google Search', 'Qualified', ['Hot'], '01 Sep', 2, 78],
  ['Priya Nair', 'Founder', 'Studio Mira', 'studiomira.co', 'priya@studiomira.co', '+91 99400 71223', 'Bengaluru', 'India', 'Design Agency', 66, 'Risky', 'Mobile', 'Justdial', 'New', ['Kolkata'], '31 Aug', 3, 71],
  ['Daniel Okoro', 'CTO', 'Vantic Cloud', 'vantic.cloud', 'daniel@vantic.cloud', '+44 20 7946 1188', 'London', 'UK', 'SaaS', 85, 'Verified', 'Mobile', 'Website', 'Meeting', ['High Intent', 'SaaS'], '31 Aug', 4, 92],
  ['Kavita Iyer', 'Purchase Head', 'Sunrise Textiles', 'sunrisetex.in', 'purchase@sunrisetex.in', '+91 33 2287 4410', 'Kolkata', 'India', 'Textiles', 71, 'Format Valid', 'Landline', 'TradeIndia', 'Contacted', ['Manufacturer'], '30 Aug', 4, 80],
  ['Elena Vasquez', 'Head of Procurement', 'Altamar Foods', 'altamar.es', 'e.vasquez@altamar.es', '+34 91 442 7719', 'Madrid', 'Spain', 'FMCG', 69, 'Unknown', 'Unknown', 'Imported CSV', 'New', [], '30 Aug', 1, 54],
  ['Vikram Desai', 'CEO', 'Meridian Analytics', 'meridian-analytics.com', 'vikram@meridian-analytics.com', '+91 22 6644 1200', 'Mumbai', 'India', 'Data & Analytics', 93, 'Verified', 'Mobile', 'Google Business', 'Opportunity', ['Hot', 'Decision Maker'], '29 Aug', 5, 98],
  ['Grace Lindqvist', 'Marketing Director', 'Fjord Retail', 'fjordretail.no', 'grace@fjordretail.no', '+47 22 44 8890', 'Oslo', 'Norway', 'Retail', 63, 'Risky', 'Valid', 'Capture Form', 'Contacted', [], '29 Aug', 2, 66],
  ['Arjun Mehta', 'Operations Head', 'Kalinga Steel Works', 'kalingasteel.in', 'ops@kalingasteel.in', '+91 674 233 8812', 'Bhubaneswar', 'India', 'Steel', 58, 'Invalid', 'Landline', 'IndiaMART', 'New', ['Manufacturer'], '28 Aug', 3, 62],
  ['Thomas Byrne', 'Head of Partnerships', 'Loop Commerce', 'loopcommerce.io', 'tom@loopcommerce.io', '+353 1 553 2210', 'Dublin', 'Ireland', 'Ecommerce', 79, 'Verified', 'Mobile', 'Google Search', 'Qualified', ['SaaS'], '28 Aug', 3, 85],
  ['Neha Kapoor', 'Sales Manager', 'Zentro Interiors', 'zentro.in', 'neha@zentro.in', '+91 98200 33141', 'Pune', 'India', 'Interiors', 61, 'Format Valid', 'Mobile', 'Justdial', 'New', [], '27 Aug', 2, 68],
  ['Jonas Weber', 'Procurement Lead', 'Brennt Industrie', 'brennt.de', 'j.weber@brennt.de', '+49 89 5521 7714', 'Munich', 'Germany', 'Industrial', 84, 'Verified', 'Valid', 'Google Search', 'Meeting', ['Hot'], '26 Aug', 3, 88],
];

export const demoLeads: Lead[] = leadRows.map((row, i) => {
  const o: Record<string, unknown> = { id: i + 1 };
  leadKeys.forEach((k, n) => { o[k] = row[n]; });
  return o as unknown as Lead;
});

const companyKeys = [
  'name', 'domain', 'industry', 'city', 'country', 'employees', 'revenue', 'founded',
  'phone', 'email', 'sources', 'tech', 'contacts', 'score',
] as const;

const companyRows: unknown[][] = [
  ['Nexverse Labs', 'nexverse.io', 'SaaS', 'Kolkata', 'India', '120', '$14M', '2019', '+91 33 4012 7788', 'hello@nexverse.io', ['Google Business', 'Website', 'IndiaMART', 'API'], ['WordPress', 'Google Analytics', 'HubSpot', 'Cloudflare', 'Stripe'], 8, 91],
  ['Northgate Systems', 'northgate.com', 'Enterprise Software', 'San Francisco', 'USA', '840', '$96M', '2011', '+1 415 555 0100', 'info@northgate.com', ['Website', 'Google Search', 'CSV'], ['Next.js', 'Salesforce', 'Segment', 'AWS'], 21, 88],
  ['Bansal Polymers', 'bansalpolymers.in', 'Manufacturing', 'Howrah', 'India', '310', '₹68 Cr', '2004', '+91 33 4012 8890', 'sales@bansalpolymers.in', ['IndiaMART', 'TradeIndia', 'Justdial', 'Website', 'Google Business'], ['WordPress', 'Tawk.to'], 4, 74],
  ['Kellerman Group', 'kellerman.de', 'Logistics', 'Berlin', 'Germany', '2,400', '€210M', '1998', '+49 30 8873 2200', 'kontakt@kellerman.de', ['Google Search', 'Website'], ['Adobe Analytics', 'SAP', 'Akamai'], 14, 82],
  ['Vantic Cloud', 'vantic.cloud', 'SaaS', 'London', 'UK', '260', '$31M', '2017', '+44 20 7946 1100', 'team@vantic.cloud', ['Website', 'Google Business', 'API', 'Capture Form'], ['React', 'Intercom', 'Mixpanel', 'GCP'], 11, 85],
  ['Sunrise Textiles', 'sunrisetex.in', 'Textiles', 'Kolkata', 'India', '540', '₹142 Cr', '1991', '+91 33 2287 4410', 'purchase@sunrisetex.in', ['TradeIndia', 'IndiaMART', 'Justdial', 'Website'], ['Wix', 'WhatsApp Business'], 6, 71],
  ['Meridian Analytics', 'meridian-analytics.com', 'Data & Analytics', 'Mumbai', 'India', '95', '$8M', '2020', '+91 22 6644 1200', 'contact@meridian-analytics.com', ['Google Business', 'Website', 'IndiaMART', 'API', 'CSV'], ['Webflow', 'Amplitude', 'Pipedrive'], 5, 93],
  ['Brennt Industrie', 'brennt.de', 'Industrial', 'Munich', 'Germany', '4,200', '€680M', '1974', '+49 89 5521 7700', 'info@brennt.de', ['Google Search', 'Website', 'CSV'], ['Typo3', 'Matomo', 'Microsoft Dynamics'], 32, 84],
];

export const demoCompanies: Company[] = companyRows.map((row, i) => {
  const o: Record<string, unknown> = { id: i + 1 };
  companyKeys.forEach((k, n) => { o[k] = row[n]; });
  return o as unknown as Company;
});

const jobKeys = [
  'code', 'source', 'query', 'location', 'requested', 'found', 'new', 'dup', 'invalid',
  'status', 'progress', 'started', 'duration',
] as const;

const jobRows: unknown[][] = [
  ['#1042', 'Google Business', 'Manufacturers', 'Kolkata, India', 1000, 847, 691, 123, 33, 'Completed', 100, '02 Sep 09:14', '6m 12s'],
  ['#1041', 'Google Search', 'digital marketing agencies india', 'India', 500, 500, 402, 74, 24, 'Completed', 100, '02 Sep 08:02', '3m 40s'],
  ['#1040', 'IndiaMART', 'polymer suppliers', 'West Bengal', 800, 512, 388, 96, 28, 'Running', 64, '02 Sep 07:30', '12m 04s'],
  ['#1039', 'Website', 'northgate.com + 240 domains', '—', 240, 231, 198, 21, 12, 'Partially Completed', 96, '01 Sep 18:44', '18m 51s'],
  ['#1038', 'TradeIndia', 'textile exporters', 'India', 600, 0, 0, 0, 0, 'Failed', 12, '01 Sep 15:10', '0m 48s'],
  ['#1037', 'Justdial', 'interior designers', 'Pune, India', 300, 288, 240, 41, 7, 'Completed', 100, '31 Aug 11:22', '4m 15s'],
];

export const demoJobs: ExtractionJob[] = jobRows.map((row, i) => {
  const o: Record<string, unknown> = { id: 1042 - i };
  jobKeys.forEach((k, n) => { o[k] = row[n]; });
  return o as unknown as ExtractionJob;
});

export const demoDeals: Deal[] = ([
  ['Nexverse — Growth tier', 'Nexverse Labs', 'Ananya Sharma', 24_000, 'USD', 'Proposal', 70, '18 Sep', 'RM'],
  ['Northgate rollout', 'Northgate Systems', 'Marcus Feld', 96_000, 'USD', 'Meeting', 45, '30 Sep', 'RM'],
  ['Meridian data pilot', 'Meridian Analytics', 'Vikram Desai', 12_500, 'USD', 'Qualified', 30, '12 Oct', 'AG'],
  ['Bansal supplier portal', 'Bansal Polymers', 'Rohit Bansal', 1_840_000, 'INR', 'Contacted', 15, '25 Oct', 'SR'],
  ['Vantic annual', 'Vantic Cloud', 'Daniel Okoro', 31_000, 'USD', 'Won', 100, '28 Aug', 'RM'],
  ['Brennt procurement', 'Brennt Industrie', 'Jonas Weber', 54_000, 'EUR', 'Proposal', 60, '05 Oct', 'AG'],
  ['Kellerman pilot', 'Kellerman Group', 'Sofia Renner', 18_000, 'EUR', 'Meeting', 40, '09 Oct', 'SR'],
  ['Loop Commerce seats', 'Loop Commerce', 'Thomas Byrne', 8_400, 'USD', 'New', 10, '30 Oct', 'AG'],
  ['Sunrise reorder', 'Sunrise Textiles', 'Kavita Iyer', 640_000, 'INR', 'Lost', 0, '22 Aug', 'SR'],
] as const).map(([name, company, contact, amount, currency, stage, probability, close, owner], i): Deal => ({
  id: i + 1, name, company, contact, amount, currency, stage, probability, close, owner,
}));

/** One deal's value, in its own currency. Nothing here converts between them. */
export const money = (amount: number, currency: Deal['currency'], compact = false): string =>
  new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  }).format(amount);

/**
 * Sum a set of deals per currency. Deliberately not a single number: these
 * deals are in dollars, euros and rupees, and adding them would invent a rate
 * the app does not have.
 */
export const totalByCurrency = (deals: Deal[]): Array<[Deal['currency'], number]> =>
  [...deals.reduce((m, d) => m.set(d.currency, (m.get(d.currency) ?? 0) + d.amount),
    new Map<Deal['currency'], number>())].sort((a, b) => b[1] - a[1]);

export const demoTasks: Task[] = [
  ['Follow up on proposal', 'Ananya Sharma', 'Follow-up', 'Today 16:00', 'High', 'RM'],
  ['Discovery call', 'Marcus Feld', 'Call', 'Today 18:30', 'High', 'RM'],
  ['Send pricing sheet', 'Rohit Bansal', 'Email', 'Tomorrow 10:00', 'Medium', 'SR'],
  ['Research funding round', 'Vikram Desai', 'Research', '05 Sep', 'Low', 'AG'],
  ['Confirm meeting slot', 'Jonas Weber', 'Meeting', '06 Sep', 'Medium', 'AG'],
  ['Verify phone list before dialling', 'Kavita Iyer', 'Follow-up', 'Yesterday', 'High', 'SR'],
].map(([task, lead, kind, due, priority, owner], i) => ({
  id: i + 1, task, lead, kind, due, priority, owner, done: i === 4,
})) as Task[];

export const demoLists: ListRecord[] = [
  ['Indian SaaS CEOs', 'Dynamic', '412', 'Country = India AND Industry = SaaS AND Title ~ CEO', '2 min ago', 'You'],
  ['Kolkata Manufacturers', 'Static', '1,284', 'Added from extraction #1042', '1 h ago', 'You'],
  ['Q3 Enterprise Targets', 'Static', '96', 'Hand-picked accounts', 'Yesterday', 'A. Ghosh'],
  ['Verified Mobile · India', 'Dynamic', '3,410', 'Country = India AND Phone = Mobile', '4 h ago', 'You'],
  ['Form Submissions — Aug', 'Static', '138', 'Capture form: Website demo request', '3 d ago', 'S. Roy'],
].map(([name, type, count, criteria, updated, owner]) => ({
  name, type, count, criteria, updated, owner,
})) as ListRecord[];

export const demoSources: SourceDef[] = [
  ['Google Business', 'crosshair', 'Connected', 'Places, categories, ratings, hours', '11,240 records'],
  ['Google Search', 'search', 'Connected', 'SERP titles, URLs, snippets, positions', '8,410 records'],
  ['Website Intelligence', 'globe', 'Connected', 'Emails, phones, socials, pages', '6,120 records'],
  ['Justdial', 'building', 'Requires API Key', 'Listings, categories, ratings', '3,410 records'],
  ['IndiaMART', 'package', 'Connected', 'Suppliers, products, categories', '4,880 records'],
  ['TradeIndia', 'ship', 'Requires API Key', 'Exporters, products, categories', '2,940 records'],
  ['CSV / XLSX', 'file', 'Connected', 'Your own files, mapped on import', '1,120 records'],
  ['Capture Forms', 'form', 'Connected', 'Inbound submissions', '290 records'],
  ['Workspace API', 'code', 'Connected', 'POST /api/v1/leads', '1,004 records'],
  ['Licensed Data Provider', 'database', 'Coming Soon', 'Firmographics at scale', '—'],
].map(([name, icon, status, desc, records]) => ({ name, icon, status, desc, records })) as SourceDef[];

/** What the active plan entitles this account to. Drives the billing screen. */
export const demoEntitlement = {
  plan: 'Pro (₹2,000)',
  billingMode: 'subscription' as 'subscription' | 'payg',
  seats: 5,
  seatsUsed: 3,
  leadsLimit: 10_000,
  monthlyCredits: 10_000,
  dailyDownloadLimit: 1_000,
  extractionCredits: 10_000,
  enrichmentCredits: 2_000,
  campaignsAllowed: 'Unlimited',
};

export const demoUser = { name: 'Rahul Mitra', email: 'rahul@leadbro.io', initials: 'RM', role: 'Owner' };

export const demoSavedCampaigns: SavedCampaign[] = [
  {
    id: 'camp_1',
    name: 'Indian SaaS Founders Outbound',
    description: 'High-growth B2B SaaS founders & CEOs across India for quarterly software demo sequence.',
    createdAt: '2026-08-20',
    updatedAt: '12 min ago',
    leads: [
      {
        id: 'cl_101',
        name: 'Ananya Sharma',
        title: 'CEO & Co-founder',
        company: 'Nexverse Labs',
        domain: 'nexverse.io',
        email: 'ananya@nexverse.io',
        phone: '+91 98301 22410',
        city: 'Kolkata',
        country: 'India',
        source: 'Find Leads',
        savedAt: '12 min ago',
        verified: true,
        research: {
          status: 'completed',
          researchedAt: '12 min ago',
          summary: [
            { label: 'Prospect Profile', body: 'Ananya Sharma is CEO & Co-founder at Nexverse Labs. Public sources and corporate filings confirm direct operational and commercial responsibility over regional sales tooling and GTM partnerships across India.' },
            { label: 'Company Context', body: 'Nexverse Labs operates in B2B SaaS from Kolkata. The website showcases active hiring for commercial roles and customer growth across mid-market accounts.' },
            { label: 'Why Now — Timely Triggers', body: 'Three sales roles posted on careers page in the last 14 days and analytics tags updated on the marketing site, signaling active pipeline expansion.' },
            { label: 'Risks & Unknowns', body: 'Headcount estimate is modeled from LinkedIn directory bands; avoid quoting internal employee numbers directly.' },
          ],
          talkingPoints: [
            'Reference their recent hiring in sales operations as specific evidence of expansion.',
            'Position LeadBro as the verified Indian lead intelligence layer that feeds directly into their SDR workflows.',
            'Highlight deliverability network effects without mentioning specific competitor accounts.',
          ],
          facts: [
            { label: 'Email', value: 'ananya@nexverse.io', prov: 'Verified' },
            { label: 'Phone', value: '+91 98301 22410', prov: 'Verified' },
            { label: 'Title', value: 'CEO & Co-founder', prov: 'Observed' },
            { label: 'Company', value: 'Nexverse Labs', prov: 'Observed' },
            { label: 'Location', value: 'Kolkata, India', prov: 'Observed' },
            { label: 'Domain', value: 'nexverse.io', prov: 'Observed' },
          ],
          sources: [
            { prov: 'Observed', url: 'nexverse.io/about', date: '02 Sep' },
            { prov: 'Observed', url: 'nexverse.io/careers', date: '31 Aug' },
            { prov: 'Observed', url: 'maps.google.com/place/nexverse-labs', date: '29 Aug' },
            { prov: 'Enriched', url: 'registry-mca.gov.in/company/nexverse', date: '02 Sep' },
          ],
        },
      },
      {
        id: 'cl_102',
        name: 'Vikramaditya Roy',
        title: 'VP Growth',
        company: 'Meridian Analytics',
        domain: 'meridian-analytics.com',
        email: 'vikram@meridian-analytics.com',
        phone: '+91 98200 44119',
        city: 'Mumbai',
        country: 'India',
        source: 'Pool',
        savedAt: '1 h ago',
        verified: true,
      },
      {
        id: 'cl_103',
        name: 'Priyanka Sen',
        title: 'Founder',
        company: 'Vantic Cloud India',
        domain: 'vantic.cloud',
        email: 'priyanka@vantic.cloud',
        phone: '+91 98450 11200',
        city: 'Bengaluru',
        country: 'India',
        source: 'Registry',
        savedAt: 'Yesterday',
        verified: true,
      },
    ],
  },
  {
    id: 'camp_2',
    name: 'Kolkata Heavy Engineering & Manufacturers',
    description: 'Verified plant owners, directors, and industrial suppliers in West Bengal.',
    createdAt: '2026-08-15',
    updatedAt: '2 h ago',
    leads: [
      {
        id: 'cl_201',
        name: 'Rajesh Bansal',
        title: 'Managing Director',
        company: 'Bansal Polymers',
        domain: 'bansalpolymers.in',
        email: 'rajesh@bansalpolymers.in',
        phone: '+91 33 4012 8890',
        city: 'Howrah',
        country: 'India',
        source: 'Registry',
        savedAt: '2 h ago',
        verified: true,
      },
      {
        id: 'cl_202',
        name: 'Debashis Mukherjee',
        title: 'Head of Procurement',
        company: 'Sunrise Textiles',
        domain: 'sunrisetex.in',
        email: 'purchase@sunrisetex.in',
        phone: '+91 33 2287 4410',
        city: 'Kolkata',
        country: 'India',
        source: 'Pool',
        savedAt: 'Yesterday',
        verified: false,
      },
      {
        id: 'cl_203',
        name: 'Subhashish Ghose',
        title: 'Director',
        company: 'Eastern Foundry & Engineering',
        domain: 'easternfoundry.co.in',
        email: 'sghose@easternfoundry.co.in',
        phone: '+91 33 2665 1102',
        city: 'Kolkata',
        country: 'India',
        source: 'Find Companies',
        savedAt: '3 d ago',
        verified: true,
      },
    ],
  },
  {
    id: 'camp_3',
    name: 'MCA Active Directors - West Bengal',
    description: 'Newly incorporated companies from official MCA filings with active GST registration.',
    createdAt: '2026-08-10',
    updatedAt: 'Yesterday',
    leads: [
      {
        id: 'cl_301',
        name: 'Amitabh Sen',
        title: 'Designated Director',
        company: 'Zenith Logistics & Supply Chain Pvt Ltd',
        domain: 'zenithlogistics.in',
        email: 'amitabh@zenithlogistics.in',
        phone: '+91 98310 99881',
        city: 'Kolkata',
        country: 'India',
        source: 'Registry',
        savedAt: 'Yesterday',
        verified: true,
      },
      {
        id: 'cl_302',
        name: 'Pooja Agarwal',
        title: 'Director',
        company: 'GreenTerra Agro Chem LLP',
        domain: 'greenterra.in',
        email: 'pooja.agarwal@greenterra.in',
        phone: '+91 98305 44321',
        city: 'Durgapur',
        country: 'India',
        source: 'Registry',
        savedAt: '2 d ago',
        verified: true,
      },
    ],
  },
  {
    id: 'camp_4',
    name: 'Fintech VP Sales & Revenue Leaders',
    description: 'Decision makers in scale-up fintechs with 50-500 headcount and recent funding signals.',
    createdAt: '2026-08-05',
    updatedAt: '3 d ago',
    leads: [
      {
        id: 'cl_401',
        name: 'Karan Mehra',
        title: 'VP Revenue',
        company: 'CredoPay Tech',
        domain: 'credopay.in',
        email: 'karan.m@credopay.in',
        phone: '+91 99001 88772',
        city: 'Bengaluru',
        country: 'India',
        source: 'Find Leads',
        savedAt: '3 d ago',
        verified: true,
      },
      {
        id: 'cl_402',
        name: 'Siddharth Nair',
        title: 'Head of Enterprise Sales',
        company: 'SwiftRemit International',
        domain: 'swiftremit.co',
        email: 'siddharth@swiftremit.co',
        phone: '+91 98800 12345',
        city: 'Mumbai',
        country: 'India',
        source: 'Leads',
        savedAt: '4 d ago',
        verified: true,
      },
    ],
  },
  {
    id: 'camp_5',
    name: 'D2C Brand Founders - Pan India',
    description: 'Direct-to-consumer lifestyle, apparel, and FMCG brand founders running high ad spend.',
    createdAt: '2026-07-28',
    updatedAt: '5 d ago',
    leads: [
      {
        id: 'cl_501',
        name: 'Meera Kapur',
        title: 'Co-founder & Chief Brand Officer',
        company: 'Aura Botanicals',
        domain: 'aurabotanicals.store',
        email: 'meera@aurabotanicals.store',
        phone: '+91 98110 55443',
        city: 'New Delhi',
        country: 'India',
        source: 'Pool',
        savedAt: '5 d ago',
        verified: true,
      },
    ],
  },
  {
    id: 'camp_6',
    name: 'GST Registered Logistics & Warehousing',
    description: 'Cold storage, 3PL providers, and transport fleet operators with verified numbers.',
    createdAt: '2026-07-20',
    updatedAt: '1 w ago',
    leads: [
      {
        id: 'cl_601',
        name: 'Gurpreet Singh',
        title: 'Managing Partner',
        company: 'Northern Freight Corridors',
        domain: 'northernfreight.in',
        email: 'gsingh@northernfreight.in',
        phone: '+91 98140 22334',
        city: 'Chandigarh',
        country: 'India',
        source: 'Pool',
        savedAt: '1 w ago',
        verified: true,
      },
    ],
  },
];
