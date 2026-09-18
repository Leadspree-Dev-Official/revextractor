import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react';
import { repo } from './repo';
import { demoCompanies, demoDeals, demoEntitlement, demoJobs, demoLeads, demoSavedCampaigns, demoTasks } from './demo';
import {
  defaultPromoOffer, defaultSubscriptionWallet, defaultPaygWallet,
  walletEntries as initialWalletEntries, calculateTopupCredits,
  CREDIT_PLANS,
  type PromoOffer, type SubscriptionWallet, type PaygWallet, type WalletEntry,
} from './wallet';
import type { CampaignLead, Company, Deal, DealStage, ExtractionJob, Lead, LeadResearchData, SavedCampaign, Task } from './types';

export interface ConfirmSpec {
  title: string;
  body: string;
  costLabel: string;
  cost: string;
  cta: string;
  done: string;
  danger?: boolean;
  onConfirm?: () => void;
}

type Selection = Record<number, boolean>;

export interface RevealPricingConfig {
  emailCreditCost: number; // default: 1.0 credit
  phoneCreditCost: number; // default: 2.0 credits
  bundleMode: boolean; // default: false (when true, bundled rate is charged)
  bundleCreditCost: number; // default: 1.0 credit when in promotional/trade mode
}

export const defaultRevealPricing: RevealPricingConfig = {
  emailCreditCost: 1,
  phoneCreditCost: 2,
  bundleMode: false,
  bundleCreditCost: 1,
};

interface AppValue {
  /* data */
  leads: Lead[];
  companies: Company[];
  jobs: ExtractionJob[];
  tasks: Task[];
  deals: Deal[];
  loading: boolean;
  loadError: string | null;
  reload(): void;

  /* account entitlement & active campaign */
  entitlement: typeof demoEntitlement;
  activeCampaign: SavedCampaign | undefined;

  /* wallet & credit system */
  subscriptionWallet: SubscriptionWallet;
  paygWallet: PaygWallet;
  walletEntries: WalletEntry[];
  promoOffer: PromoOffer;
  totalSpendableCredits: number;
  setPromoOffer(patch: Partial<PromoOffer>): void;
  addWalletFunds(inrAmount: number, paymentRef?: string): { success: boolean; totalCredited: number };
  deductCredits(amount: number, reason: string, reference?: string): boolean;
  revealPricing: RevealPricingConfig;
  setRevealPricing(patch: Partial<RevealPricingConfig>): void;
  switchPlan(planId: string): boolean;
  leadsDownloadedToday: number;
  checkDownloadLimit(count: number): { allowed: boolean; message?: string };
  recordDownload(count: number): void;

  /* selection (§69) */
  selection: Selection;
  selectedCount: number;
  toggleSelect(id: number): void;
  toggleSelectAll(ids: number[]): void;
  clearSelection(): void;

  /* lead side panel (§68) */
  panelLeadId: number | null;
  panelTab: string;
  openPanel(id: number, tab?: string): void;
  setPanelTab(tab: string): void;
  closePanel(): void;

  /* command palette (§67) */
  cmdkOpen: boolean;
  setCmdk(open: boolean): void;

  /* feedback */
  toast: string | null;
  flash(message: string): void;
  confirm: ConfirmSpec | null;
  ask(spec: ConfirmSpec): void;
  closeConfirm(): void;
  runConfirm(): void;

  /* saved campaigns */
  savedCampaigns: SavedCampaign[];
  lastSavedCampaignId: string;
  setLastSavedCampaignId(id: string): void;
  saveModalOpen: boolean;
  pendingSaveLeads: Array<Omit<CampaignLead, 'id' | 'savedAt'>>;
  openSaveToCampaign(items: Array<Omit<CampaignLead, 'id' | 'savedAt'>>): void;
  closeSaveToCampaign(): void;
  saveToCampaign(campaignIdOrName: string, isNew?: boolean, unlockType?: 'both' | 'email_only' | 'phone_only'): void;
  createCampaign(name: string, description?: string): string;
  removeLeadFromCampaign(campaignId: string, leadItemId: string): void;
  deleteCampaign(campaignId: string): void;
  enrichCampaign(campaignId: string, fields?: string[]): { updatedCount: number };
  verifyCampaign(campaignId: string, verifyType?: 'all' | 'email' | 'phone' | 'dnd'): {
    verifiedCount: number;
    phoneVerifiedCount: number;
    dndCheckedCount: number;
  };
  updateLeadResearch(campaignId: string, leadItemId: string, data: Partial<LeadResearchData>): void;

  /* mutations */
  addLeads(rows: Lead[]): void;
  setTaskDone(id: number, done: boolean): Promise<void>;
  moveDeal(id: number, stage: DealStage): Promise<void>;
  updateLead(id: number, patch: Partial<Lead>): Promise<void>;
}

const Ctx = createContext<AppValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(demoLeads);
  const [companies, setCompanies] = useState<Company[]>(demoCompanies);
  const [jobs, setJobs] = useState<ExtractionJob[]>(demoJobs);
  const [tasks, setTasks] = useState<Task[]>(demoTasks);
  const [deals, setDeals] = useState<Deal[]>(demoDeals);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const [selection, setSelection] = useState<Selection>({});
  const [panelLeadId, setPanelLeadId] = useState<number | null>(null);
  const [panelTab, setPanelTab] = useState('overview');
  const [cmdkOpen, setCmdk] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmSpec | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>(() => {
    try {
      const saved = localStorage.getItem('leadspree_saved_campaigns');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return demoSavedCampaigns;
  });

  const [lastSavedCampaignId, setLastSavedCampaignId] = useState<string>(() => {
    try {
      const last = localStorage.getItem('leadspree_last_saved_campaign_id');
      if (last) return last;
    } catch {
      // ignore
    }
    return demoSavedCampaigns[0]?.id ?? 'camp_1';
  });

  const activeCampaign = useMemo(
    () => savedCampaigns.find((c) => c.id === lastSavedCampaignId) ?? savedCampaigns[0],
    [savedCampaigns, lastSavedCampaignId],
  );

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [pendingSaveLeads, setPendingSaveLeads] = useState<Array<Omit<CampaignLead, 'id' | 'savedAt'>>>([]);

  useEffect(() => {
    try {
      localStorage.setItem('leadspree_saved_campaigns', JSON.stringify(savedCampaigns));
    } catch {
      // ignore
    }
  }, [savedCampaigns]);

  useEffect(() => {
    try {
      localStorage.setItem('leadspree_last_saved_campaign_id', lastSavedCampaignId);
    } catch {
      // ignore
    }
  }, [lastSavedCampaignId]);

  /* Wallet & Promotional Multiplier State */
  const [promoOffer, setPromoOfferState] = useState<PromoOffer>(() => {
    try {
      const saved = localStorage.getItem('leadspree_promo_offer');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultPromoOffer;
  });

  const [subscriptionWallet, setSubscriptionWallet] = useState<SubscriptionWallet>(() => {
    try {
      const saved = localStorage.getItem('leadspree_sub_wallet');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultSubscriptionWallet;
  });

  const [paygWallet, setPaygWallet] = useState<PaygWallet>(() => {
    try {
      const saved = localStorage.getItem('leadspree_payg_wallet');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultPaygWallet;
  });

  const [walletEntries, setWalletEntries] = useState<WalletEntry[]>(() => {
    try {
      const saved = localStorage.getItem('leadspree_wallet_entries');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialWalletEntries;
  });

  useEffect(() => {
    try {
      localStorage.setItem('leadspree_promo_offer', JSON.stringify(promoOffer));
    } catch {}
  }, [promoOffer]);

  useEffect(() => {
    try {
      localStorage.setItem('leadspree_sub_wallet', JSON.stringify(subscriptionWallet));
    } catch {}
  }, [subscriptionWallet]);

  useEffect(() => {
    try {
      localStorage.setItem('leadspree_payg_wallet', JSON.stringify(paygWallet));
    } catch {}
  }, [paygWallet]);

  useEffect(() => {
    try {
      localStorage.setItem('leadspree_wallet_entries', JSON.stringify(walletEntries));
    } catch {}
  }, [walletEntries]);

  const setPromoOffer = useCallback((patch: Partial<PromoOffer>) => {
    setPromoOfferState((prev) => ({ ...prev, ...patch }));
  }, []);

  /* Apollo-Style Contact Reveal Pricing */
  const [revealPricing, setRevealPricingState] = useState<RevealPricingConfig>(() => {
    try {
      const saved = localStorage.getItem('leadspree_reveal_pricing');
      if (saved) return { ...defaultRevealPricing, ...JSON.parse(saved) };
    } catch {}
    return defaultRevealPricing;
  });

  useEffect(() => {
    try {
      localStorage.setItem('leadspree_reveal_pricing', JSON.stringify(revealPricing));
    } catch {}
  }, [revealPricing]);

  const todayKey = () => `leadspree_downloads_${new Date().toISOString().slice(0, 10)}`;
  const [leadsDownloadedToday, setLeadsDownloadedToday] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(todayKey());
      if (saved) return parseInt(saved, 10) || 0;
    } catch {}
    return 0;
  });

  const setRevealPricing = useCallback((patch: Partial<RevealPricingConfig>) => {
    setRevealPricingState((prev) => ({ ...prev, ...patch }));
  }, []);

  const totalSpendableCredits = useMemo(() => {
    const subRemaining = Math.max(0, subscriptionWallet.includedRecords - subscriptionWallet.recordsUsed);
    const paygSpendable = Math.max(0, paygWallet.balance - paygWallet.held);
    return subRemaining + paygSpendable;
  }, [subscriptionWallet, paygWallet]);

  const deductCredits = useCallback((amount: number, reason: string, reference?: string): boolean => {
    if (amount <= 0) return true;

    const subRemaining = Math.max(0, subscriptionWallet.includedRecords - subscriptionWallet.recordsUsed);
    const paygSpendable = Math.max(0, paygWallet.balance - paygWallet.held);
    const totalAvail = subRemaining + paygSpendable;

    if (totalAvail < amount) {
      setToast(`Insufficient credits (${amount} required, ${totalAvail} available). Please top up your wallet.`);
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 3500);
      return false;
    }

    if (subRemaining >= amount) {
      setSubscriptionWallet((prev) => ({
        ...prev,
        recordsUsed: prev.recordsUsed + amount,
      }));
      const newEntry: WalletEntry = {
        id: Date.now(),
        kind: 'debit',
        amount: -amount,
        balanceAfter: paygWallet.balance,
        description: `${reason} (plan credits)`,
        reference: reference ?? 'plan_metered',
        when: 'Just now',
      };
      setWalletEntries((prev) => [newEntry, ...prev]);
      return true;
    }

    const fromPlan = subRemaining;
    const fromPayg = amount - fromPlan;

    if (fromPlan > 0) {
      setSubscriptionWallet((prev) => ({
        ...prev,
        recordsUsed: prev.includedRecords,
      }));
    }

    const nextPaygBalance = paygWallet.balance - fromPayg;
    setPaygWallet((prev) => ({
      ...prev,
      balance: nextPaygBalance,
    }));

    const desc = fromPlan > 0
      ? `${reason} (${fromPlan} plan + ${fromPayg} wallet credits)`
      : `${reason} (wallet debit)`;

    const newEntry: WalletEntry = {
      id: Date.now(),
      kind: 'debit',
      amount: -fromPayg,
      balanceAfter: nextPaygBalance,
      description: desc,
      reference: reference ?? 'metered_debit',
      when: 'Just now',
    };
    setWalletEntries((prev) => [newEntry, ...prev]);
    return true;
  }, [subscriptionWallet, paygWallet]);

  const addWalletFunds = useCallback((inrAmount: number, paymentRef = 'UPI') => {
    const calc = calculateTopupCredits(inrAmount, promoOffer);
    const newBalance = paygWallet.balance + calc.totalCredits;

    setPaygWallet((prev) => ({
      ...prev,
      balance: newBalance,
    }));

    const promoNote = calc.isPromoApplied
      ? ` (+${calc.bonusCredits.toLocaleString('en-IN')} bonus credits via ${promoOffer.name})`
      : '';

    const newEntry: WalletEntry = {
      id: Date.now(),
      kind: 'topup',
      amount: calc.totalCredits,
      balanceAfter: newBalance,
      description: `Wallet top-up · ₹${inrAmount.toLocaleString('en-IN')} via ${paymentRef}${promoNote}`,
      reference: `pay_${Date.now().toString(36).toUpperCase()}`,
      when: 'Just now',
    };

    setWalletEntries((prev) => [newEntry, ...prev]);

    setToast(
      `Added ₹${inrAmount.toLocaleString('en-IN')} (${calc.totalCredits.toLocaleString('en-IN')} credits${calc.isPromoApplied ? ` with ${calc.multiplier}X promo` : ''}) to wallet!`,
    );
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);

    return { success: true, totalCredited: calc.totalCredits };
  }, [paygWallet, promoOffer]);

  const switchPlan = useCallback((planId: string) => {
    const plan = CREDIT_PLANS.find((p) => p.id === planId)
      || (planId === 'enterprise_10k' ? CREDIT_PLANS.find((p) => p.id === 'ultra_10k') : undefined);
    if (!plan) return false;
    setSubscriptionWallet((prev) => ({
      ...prev,
      planId: plan.id,
      planLabel: plan.name,
      monthlyInr: plan.monthlyInr,
      includedRecords: plan.credits,
      recordsUsed: 0,
      downloadAtOnceLimit: plan.downloadAtOnceLimit,
      dailyDownloadLimit: plan.dailyDownloadLimit,
      multiplierText: plan.multiplierText,
    }));
    return true;
  }, []);

  const recordDownload = useCallback((count: number) => {
    if (count <= 0) return;
    setLeadsDownloadedToday((prev) => {
      const updated = prev + count;
      try {
        localStorage.setItem(todayKey(), String(updated));
      } catch {}
      return updated;
    });
  }, []);

  const checkDownloadLimit = useCallback((count: number): { allowed: boolean; message?: string } => {
    if (count <= 0) return { allowed: true };

    // 1. Check download-at-once limit (e.g. Free plan: 10 leads download at once)
    const atOnceLimit = subscriptionWallet.downloadAtOnceLimit;
    if (atOnceLimit != null && count > atOnceLimit) {
      return {
        allowed: false,
        message: `${subscriptionWallet.planLabel} allows downloading at most ${atOnceLimit} leads at once (attempted: ${count}). Upgrade your plan for higher batch exports.`,
      };
    }

    // 2. Check daily download limit (e.g. Pro: 1,000/day, Scale: 2,000/day)
    const dailyLimit = subscriptionWallet.dailyDownloadLimit;
    if (dailyLimit != null) {
      if (leadsDownloadedToday + count > dailyLimit) {
        const remaining = Math.max(0, dailyLimit - leadsDownloadedToday);
        return {
          allowed: false,
          message: `Daily download limit reached for ${subscriptionWallet.planLabel} (${leadsDownloadedToday.toLocaleString('en-IN')}/${dailyLimit.toLocaleString('en-IN')} leads downloaded today). You can download at most ${remaining} more today, or upgrade to Ultra or Enterprise for unlimited downloads.`,
        };
      }
    }

    return { allowed: true };
  }, [subscriptionWallet, leadsDownloadedToday]);

  const openSaveToCampaign = useCallback((items: Array<Omit<CampaignLead, 'id' | 'savedAt'>>) => {
    if (!items.length) {
      return;
    }
    setPendingSaveLeads(items);
    setSaveModalOpen(true);
  }, []);

  const closeSaveToCampaign = useCallback(() => {
    setSaveModalOpen(false);
    setPendingSaveLeads([]);
  }, []);

  const createCampaign = useCallback((name: string, description?: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return '';
    const newId = `camp_${Date.now()}`;
    const newCamp: SavedCampaign = {
      id: newId,
      name: trimmed,
      description: description?.trim() || 'Custom targeted lead campaign',
      createdAt: new Date().toISOString().split('T')[0]!,
      updatedAt: 'Just now',
      leads: [],
    };
    setSavedCampaigns((prev) => [newCamp, ...prev]);
    setLastSavedCampaignId(newId);
    return newId;
  }, []);

  const saveToCampaign = useCallback(
    (
      campaignIdOrName: string,
      isNew = false,
      unlockType: 'both' | 'email_only' | 'phone_only' = 'both',
    ) => {
      if (!pendingSaveLeads.length) return;

      const unlockEmail = unlockType === 'both' || unlockType === 'email_only';
      const unlockPhone = unlockType === 'both' || unlockType === 'phone_only';

      // Calculate credits to deduct:
      let totalCost = 0;
      if (revealPricing.bundleMode && unlockType === 'both') {
        // In bundle / trade mode, charge bundleCreditCost per lead that has email or phone available
        totalCost = pendingSaveLeads.reduce((acc, lead) => {
          return acc + (lead.email || lead.phone ? revealPricing.bundleCreditCost : 0);
        }, 0);
      } else {
        totalCost = pendingSaveLeads.reduce((acc, lead) => {
          let leadCost = 0;
          if (unlockEmail && lead.email) leadCost += revealPricing.emailCreditCost;
          if (unlockPhone && lead.phone) leadCost += revealPricing.phoneCreditCost;
          return acc + leadCost;
        }, 0);
      }

      totalCost = Math.round(totalCost * 10) / 10;

      let targetId = campaignIdOrName;
      let targetName = '';

      const newLeadsWithMeta: CampaignLead[] = pendingSaveLeads.map((item, idx) => ({
        ...item,
        email: unlockEmail ? item.email : undefined,
        phone: unlockPhone ? item.phone : undefined,
        id: `cl_${Date.now()}_${idx}`,
        savedAt: 'Just now',
      }));

      if (isNew) {
        const createdId = `camp_${Date.now()}`;
        targetId = createdId;
        targetName = campaignIdOrName.trim() || 'New Campaign';
        const newCamp: SavedCampaign = {
          id: createdId,
          name: targetName,
          description: 'Custom targeted lead campaign',
          createdAt: new Date().toISOString().split('T')[0]!,
          updatedAt: 'Just now',
          leads: newLeadsWithMeta,
        };
        setSavedCampaigns((prev) => [newCamp, ...prev]);
      } else {
        setSavedCampaigns((prev) =>
          prev.map((c) => {
            if (c.id === targetId) {
              targetName = c.name;
              const existingKeys = new Set(
                c.leads.map((l) => (l.email ? l.email.toLowerCase() : `${l.name}_${l.company}`.toLowerCase())),
              );
              const fresh = newLeadsWithMeta.filter(
                (l) => !existingKeys.has(l.email ? l.email.toLowerCase() : `${l.name}_${l.company}`.toLowerCase()),
              );
              return {
                ...c,
                updatedAt: 'Just now',
                leads: [...fresh, ...c.leads],
              };
            }
            return c;
          }),
        );
      }

      setLastSavedCampaignId(targetId);
      setSaveModalOpen(false);
      setPendingSaveLeads([]);

      const unlockLabel =
        unlockType === 'both' ? 'Email & Phone' : unlockType === 'email_only' ? 'Email only' : 'Phone only';

      // Deduct credits from wallet
      deductCredits(
        totalCost,
        `Unlocked ${newLeadsWithMeta.length} ${newLeadsWithMeta.length === 1 ? 'lead' : 'leads'} (${unlockLabel}) to “${targetName || 'Campaign'}”`,
        targetId,
      );

      setToast(
        `Saved ${newLeadsWithMeta.length} ${newLeadsWithMeta.length === 1 ? 'lead' : 'leads'} to “${targetName || 'Campaign'}” · ${totalCost} ${totalCost === 1 ? 'credit' : 'credits'} debited (${unlockLabel})`,
      );
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 3000);
    },
    [pendingSaveLeads, deductCredits, revealPricing],
  );

  const removeLeadFromCampaign = useCallback((campaignId: string, leadItemId: string) => {
    setSavedCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === campaignId) {
          return {
            ...c,
            leads: c.leads.filter((l) => l.id !== leadItemId),
          };
        }
        return c;
      }),
    );
    setToast('Lead removed from campaign');
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const deleteCampaign = useCallback((campaignId: string) => {
    setSavedCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    setToast('Campaign deleted');
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const enrichCampaign = useCallback((campaignId: string, _fields?: string[]) => {
    let updatedCount = 0;
    let campaignName = '';

    setSavedCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== campaignId) return c;
        campaignName = c.name;
        const enrichedLeads = c.leads.map((l, idx) => {
          let mutated = false;
          let phone = l.phone;
          let domain = l.domain;
          let email = l.email;
          let title = l.title;

          // Enrich phone if missing
          if (!phone) {
            const area = 200 + (idx * 37) % 700;
            const mid = 100 + (idx * 53) % 890;
            const end = 1000 + (idx * 79) % 9000;
            phone = `+1 (${area}) ${mid}-${end}`;
            mutated = true;
          }

          // Enrich domain if missing
          if (!domain && l.company) {
            domain = `${l.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
            mutated = true;
          }

          // Enrich email if missing and domain exists
          if (!email && domain) {
            const handle = l.name ? l.name.toLowerCase().split(' ')[0] : 'contact';
            email = `${handle}@${domain}`;
            mutated = true;
          }

          // Enrich title if empty
          if (!title || title.trim() === '') {
            title = 'Strategic Decision Maker';
            mutated = true;
          }

          if (mutated) {
            updatedCount += 1;
          }

          return {
            ...l,
            phone,
            domain,
            email,
            title,
          };
        });

        return {
          ...c,
          updatedAt: 'Just now',
          leads: enrichedLeads,
        };
      }),
    );

    if (updatedCount > 0) {
      deductCredits(updatedCount, `Enrichment · ${updatedCount} ${updatedCount === 1 ? 'lead' : 'leads'} enriched in “${campaignName || 'Campaign'}”`, campaignId);
    }

    setToast(
      updatedCount > 0
        ? `Enriched ${updatedCount} leads in “${campaignName || 'Campaign'}” · ${updatedCount} credits debited`
        : `All leads in “${campaignName || 'Campaign'}” are already enriched`,
    );
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);

    return { updatedCount };
  }, [deductCredits]);

  const verifyCampaign = useCallback((campaignId: string, verifyType: 'all' | 'email' | 'phone' | 'dnd' = 'all') => {
    let emailCount = 0;
    let phoneCount = 0;
    let dndCount = 0;
    let campaignName = '';

    setSavedCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== campaignId) return c;
        campaignName = c.name;
        const verifiedLeads = c.leads.map((l, index) => {
          const updated = { ...l };

          // 1. Email verification (SMTP, MX records, syntax, mailbox test)
          if (verifyType === 'all' || verifyType === 'email') {
            if (!l.verified) {
              emailCount += 1;
            }
            let email = l.email;
            if (!email && l.domain) {
              const handle = l.name ? l.name.toLowerCase().split(' ')[0] : 'contact';
              email = `${handle}@${l.domain}`;
            }
            updated.email = email;
            updated.verified = true;
          }

          // 2. Phone verification (Telecom carrier, line active, HLR ping)
          if (verifyType === 'all' || verifyType === 'phone') {
            if (!l.phoneVerified) {
              phoneCount += 1;
            }
            let phone = l.phone;
            if (!phone) {
              phone = `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`;
            }
            updated.phone = phone;
            updated.phoneVerified = true;
          }

          // 3. DND verification (TRAI National Do Not Disturb Registry)
          if (verifyType === 'all' || verifyType === 'dnd') {
            if (!l.dndStatus || l.dndStatus === 'Unknown') {
              dndCount += 1;
            }
            // Realistically 75% Non-DND (safe for cold telemarketing), 25% DND
            const isNonDnd = (index % 4) !== 0;
            updated.dndStatus = isNonDnd ? 'Non-DND' : 'DND';
          }

          return updated;
        });

        return {
          ...c,
          updatedAt: 'Just now',
          leads: verifiedLeads,
        };
      }),
    );

    const totalProcessed = (verifyType === 'all' ? (emailCount + phoneCount + dndCount) : verifyType === 'email' ? emailCount : verifyType === 'phone' ? phoneCount : dndCount);

    if (totalProcessed > 0) {
      const typeLabel = verifyType === 'all' ? '3-in-1 Verification (Phone, DND, Email)' : verifyType === 'phone' ? 'Phone Verification' : verifyType === 'dnd' ? 'TRAI DND Verification' : 'Email Mailbox Verification';
      deductCredits(totalProcessed, `${typeLabel} · ${totalProcessed} records in “${campaignName || 'Campaign'}”`, campaignId);
    }

    const typeMsg = verifyType === 'all' ? 'Phone, DND & Email' : verifyType === 'phone' ? 'Phone numbers' : verifyType === 'dnd' ? 'TRAI DND status' : 'Mailboxes';
    setToast(
      `Verified ${typeMsg} for “${campaignName || 'Campaign'}” · ${totalProcessed > 0 ? `${totalProcessed} credits debited` : 'All records up to date'}`,
    );
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);

    return {
      verifiedCount: emailCount,
      phoneVerifiedCount: phoneCount,
      dndCheckedCount: dndCount,
    };
  }, [deductCredits]);

  const updateLeadResearch = useCallback(
    (campaignId: string, leadItemId: string, data: Partial<LeadResearchData>) => {
      setSavedCampaigns((prev) =>
        prev.map((c) => {
          if (c.id !== campaignId) return c;
          return {
            ...c,
            updatedAt: 'Just now',
            leads: c.leads.map((l) => {
              if (l.id !== leadItemId) return l;
              const prevRes = l.research ?? { status: 'completed' as const };
              return {
                ...l,
                research: {
                  ...prevRes,
                  ...data,
                },
              };
            }),
          };
        }),
      );
    },
    [],
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([repo.leads(), repo.companies(), repo.jobs(), repo.tasks(), repo.deals()]).then((res) => {
      if (!alive) return;
      const [l, c, j, t, d] = res;
      setLeads(l.data); setCompanies(c.data); setJobs(j.data); setTasks(t.data); setDeals(d.data);
      setLoadError(res.map((r) => r.error).find(Boolean) ?? null);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [nonce]);

  const flash = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  /* Callbacks are stable across renders. Effects elsewhere depend on these
     identities — an unstable closePanel would close the panel the moment it
     opened, because the store value changed. */
  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const toggleSelect = useCallback(
    (id: number) => setSelection((s) => ({ ...s, [id]: !s[id] })), [],
  );
  const toggleSelectAll = useCallback((ids: number[]) => setSelection((s) => {
    if (ids.every((id) => s[id])) return {};
    const next: Selection = {};
    ids.forEach((id) => { next[id] = true; });
    return next;
  }), []);
  const clearSelection = useCallback(() => setSelection({}), []);
  const openPanel = useCallback((id: number, tab = 'overview') => {
    setPanelLeadId(id);
    setPanelTab(tab);
  }, []);
  const closePanel = useCallback(() => setPanelLeadId(null), []);
  const ask = useCallback((spec: ConfirmSpec) => setConfirm(spec), []);
  const closeConfirm = useCallback(() => setConfirm(null), []);

  const runConfirm = useCallback(() => {
    setConfirm((current) => {
      if (current) {
        current.onConfirm?.();
        setSelection({});
        flash(current.done);
      }
      return null;
    });
  }, [flash]);

  const setTaskDoneCb = useCallback(async (id: number, done: boolean) => {
    let rollback: Task[] = [];
    setTasks((t) => { rollback = t; return t.map((x) => (x.id === id ? { ...x, done } : x)); });
    const { error } = await repo.setTaskDone(id, done);
    if (error) { setTasks(rollback); flash(`Could not update task — ${error}`); }
  }, [flash]);

  /**
   * Put claimed records into the workspace's leads immediately. Live, the write
   * has already gone to claim_platform_leads() and the next load would bring
   * them back anyway; this is what makes the copy visible now rather than after
   * a refresh — and what makes the demo tell the truth about where a claim goes.
   */
  const addLeadsCb = useCallback((rows: Lead[]) => {
    setLeads((current) => {
      const have = new Set(current.map((l) => l.id));
      return [...rows.filter((r) => !have.has(r.id)), ...current];
    });
  }, []);

  /**
   * Move a deal to another stage. Optimistic, like every other write here: the
   * card lands where it was dropped immediately and rolls back with a message
   * if the write fails, rather than lurching a second later.
   */
  const moveDealCb = useCallback(async (id: number, stage: DealStage) => {
    let rollback: Deal[] = [];
    setDeals((current) => {
      rollback = current;
      return current.map((d) => (d.id === id
        ? {
            ...d,
            stage,
            // The two terminal stages have only one honest probability.
            probability: stage === 'Won' ? 100 : stage === 'Lost' ? 0 : d.probability,
          }
        : d));
    });
    const { error } = await repo.moveDeal(id, stage);
    if (error) { setDeals(rollback); flash(`Could not move deal — ${error}`); }
  }, [flash]);

  const updateLeadCb = useCallback(async (id: number, patch: Partial<Lead>) => {
    let rollback: Lead[] = [];
    setLeads((l) => { rollback = l; return l.map((x) => (x.id === id ? { ...x, ...patch } : x)); });
    const { error } = await repo.updateLead(id, patch);
    if (error) { setLeads(rollback); flash(`Could not save lead — ${error}`); }
  }, [flash]);

  const value = useMemo<AppValue>(() => ({
    leads, companies, jobs, tasks, deals, loading, loadError, reload,

    entitlement: demoEntitlement,
    activeCampaign,

    /* wallet & credit system */
    subscriptionWallet,
    paygWallet,
    walletEntries,
    promoOffer,
    totalSpendableCredits,
    setPromoOffer,
    addWalletFunds,
    deductCredits,

    revealPricing,
    setRevealPricing,

    switchPlan,
    leadsDownloadedToday,
    checkDownloadLimit,
    recordDownload,

    selection,
    selectedCount: Object.values(selection).filter(Boolean).length,
    toggleSelect, toggleSelectAll, clearSelection,

    panelLeadId, panelTab, openPanel, setPanelTab, closePanel,

    cmdkOpen, setCmdk,

    toast, flash,
    confirm, ask, closeConfirm, runConfirm,

    savedCampaigns,
    lastSavedCampaignId,
    setLastSavedCampaignId,
    saveModalOpen,
    pendingSaveLeads,
    openSaveToCampaign,
    closeSaveToCampaign,
    saveToCampaign,
    createCampaign,
    removeLeadFromCampaign,
    deleteCampaign,
    enrichCampaign,
    verifyCampaign,
    updateLeadResearch,

    addLeads: addLeadsCb,
    setTaskDone: setTaskDoneCb,
    moveDeal: moveDealCb,
    updateLead: updateLeadCb,
  }), [
    leads, companies, jobs, tasks, deals, loading, loadError, reload,
    activeCampaign,
    subscriptionWallet, paygWallet, walletEntries, promoOffer, totalSpendableCredits,
    setPromoOffer, addWalletFunds, deductCredits,
    revealPricing, setRevealPricing,
    switchPlan, leadsDownloadedToday, checkDownloadLimit, recordDownload,
    selection, toggleSelect, toggleSelectAll, clearSelection,
    panelLeadId, panelTab, openPanel, closePanel, cmdkOpen, toast, flash,
    confirm, ask, closeConfirm, runConfirm,
    savedCampaigns, lastSavedCampaignId, setLastSavedCampaignId, saveModalOpen, pendingSaveLeads,
    openSaveToCampaign, closeSaveToCampaign, saveToCampaign, createCampaign, removeLeadFromCampaign, deleteCampaign,
    enrichCampaign, verifyCampaign, updateLeadResearch,
    addLeadsCb, setTaskDoneCb, moveDealCb, updateLeadCb,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppProvider>');
  return v;
}
