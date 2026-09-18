import {
  Activity, Award, BarChart3, Bell, Building2,
  Boxes, Inbox, ShieldHalf, WalletMinimal,
  ChartPie, CircleDollarSign, Crosshair, Filter, Gauge,
  Globe, Landmark, LayoutDashboard, Layers, ListChecks, MapPinned,
  Radar, Repeat, Search, Send, Settings2, ShieldCheck, Smartphone, Sparkles,
  Target, Users, Workflow, type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  comingSoon?: boolean;
  /** other routes that should keep this item lit */
  also?: string[];
  children?: NavItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
  /** hidden unless the signed-in account is a platform admin */
  platformOnly?: boolean;
  comingSoon?: boolean;
  icon?: LucideIcon;
}

export const navGroups: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/notifications', label: 'Notifications', icon: Bell, badge: '8' },
    ],
  },
  {
    label: 'Discover',
    items: [
      { to: '/find-leads', label: 'Find Leads', icon: Crosshair },
      { to: '/find-companies', label: 'Find Companies', icon: Building2 },
      { to: '/registry', label: 'Registry', icon: Landmark, badge: '1.8K' },
      { to: '/pool', label: 'Leads Pool', icon: Boxes, badge: '478K' },
      { to: '/extraction', label: 'Extraction', icon: Radar, badge: '2', also: ['/jobs'] },
      { to: '/saved', label: 'Saved Campaign', icon: Target, badge: '6' },
    ],
  },
  {
    label: 'Enrich',
    items: [
      { to: '/enrichment', label: 'Enrichment', icon: Sparkles },
      { to: '/research', label: 'Lead Research', icon: Target },
      { to: '/verify', label: 'Verification', icon: ShieldCheck },
      { to: '/quality', label: 'Data Quality', icon: Gauge },
    ],
  },
  {
    label: 'API',
    items: [
      {
        to: '/api-platform',
        label: 'Extraction API',
        icon: Radar,
        also: ['/api'],
      },
    ],
  },
  {
    label: 'Measure',
    items: [{ to: '/analytics', label: 'Analytics', icon: BarChart3 }],
  },
  {
    label: 'Platform',
    platformOnly: true,
    items: [
      { to: '/superadmin', label: 'Platform Console', icon: ShieldHalf },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/wallet', label: 'Wallet', icon: WalletMinimal },
      { to: '/billing', label: 'Billing & Usage', icon: Award },
      { to: '/mobile', label: 'Mobile Preview', icon: Smartphone },
    ],
  },
  {
    label: 'Coming Soon',
    comingSoon: true,
    items: [
      { to: '/integrations', label: 'Integrations', icon: Repeat, comingSoon: true },
      { to: '/team', label: 'Team & Settings', icon: Settings2, comingSoon: true },
      { to: '/automation', label: 'Automate', icon: Workflow, comingSoon: true },
      { to: '/campaigns', label: 'Outreach', icon: Send, comingSoon: true },
      { to: '/pipeline', label: 'CRM', icon: Filter, comingSoon: true },
      { to: '/inbound', label: 'Collect', icon: Inbox, comingSoon: true },
    ],
  },
];

/** route → [breadcrumb group, page title] */
export const routeTitles: Record<string, [string, string]> = (() => {
  const t: Record<string, [string, string]> = {};
  navGroups.forEach((g) => g.items.forEach((i) => {
    t[i.to] = [g.label, i.label];
    i.children?.forEach((c) => {
      t[c.to] = [i.label, c.label];
    });
  }));
  t['/jobs'] = ['Extraction', 'Extraction Jobs'];
  t['/jobs/:id'] = ['Extraction', 'Extraction Job'];
  t['/api'] = ['API', 'Extraction API'];
  return t;
})();

export const searchIcons = {
  lead: Users, company: Building2, list: ListChecks, job: Layers,
  campaign: Send, deal: CircleDollarSign, action: Crosshair,
  activity: Activity, geo: MapPinned, chart: ChartPie, search: Search, globe: Globe,
} as const;
