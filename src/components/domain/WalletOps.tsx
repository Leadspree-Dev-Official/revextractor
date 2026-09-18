import { useState, useEffect } from 'react';
import { Check, Flame, Coins, Mail, Phone, Sparkles } from 'lucide-react';
import { useApp } from '@/lib/store';
import { type PromoOffer } from '@/lib/wallet';
import {
  Button, Card, CardHead, Input, KpiCard, NoteStrip, Panel, PanelTitle, Pill, Toggle, cx,
} from '@/components/ui';

const PRESET_MULTIPLIERS = [1, 1.5, 2, 3, 4, 5];

interface RevealPreset {
  name: string;
  tag: string;
  email: number;
  phone: number;
  bundle: boolean;
  bundleCost: number;
  desc: string;
}

const REVEAL_PRESETS: RevealPreset[] = [
  {
    name: 'Apollo-Lite Standard',
    tag: '1 Cr Email / 2 Cr Phone',
    email: 1,
    phone: 2,
    bundle: false,
    bundleCost: 1,
    desc: 'Cost-effective model: 1 credit per email, 2 credits per phone number. Unlocking both = 3 credits.',
  },
  {
    name: 'Promo Trade Mode',
    tag: 'Flat 1 Cr for Both',
    email: 1,
    phone: 1,
    bundle: true,
    bundleCost: 1,
    desc: 'Trade discount: Flat 1 credit to unlock both email and phone when saving to campaign.',
  },
  {
    name: 'High-Intent / Enterprise',
    tag: '1.5 Cr Email / 3 Cr Phone',
    email: 1.5,
    phone: 3,
    bundle: false,
    bundleCost: 2,
    desc: 'Premium enrichment rate for verified B2B decision-maker data with direct dials.',
  },
  {
    name: 'Apollo Native Benchmark',
    tag: '1 Cr Email / 8 Cr Phone',
    email: 1,
    phone: 8,
    bundle: false,
    bundleCost: 5,
    desc: 'Matches Apollo.io standard credit pricing ratio (8 credits for mobile direct dials).',
  },
];

const TEMPLATES: Array<Omit<PromoOffer, 'id'>> = [
  {
    name: 'Super Admin 2X Booster Offer',
    multiplier: 2,
    active: true,
    validUntil: '23 Sep 2026 (14 days)',
    minAmount: 500,
    description: 'Special promo active: 1 INR = 2 Credits on top-ups! Double your credits for any metered extraction, enrichment or lead saving.',
  },
  {
    name: '3X Mega Weekend Blitz',
    multiplier: 3,
    active: true,
    validUntil: '14 Sep 2026 (72 hours)',
    minAmount: 1000,
    description: 'Triple credits promotion! ₹1 = 3 Credits on deposits over ₹1,000.',
  },
  {
    name: '4X Festive Growth Pack',
    multiplier: 4,
    active: true,
    validUntil: '08 Oct 2026 (30 days)',
    minAmount: 2000,
    description: 'High-scale festival multiplier: ₹1 = 4 Credits for bulk agency operations.',
  },
  {
    name: 'Standard 1X Conversion',
    multiplier: 1,
    active: false,
    validUntil: 'Indefinite',
    minAmount: 0,
    description: 'Standard conversion: 1 INR = 1 Credit. No multiplier bonus active.',
  },
];

export function WalletOpsTab() {
  const { promoOffer, setPromoOffer, revealPricing, setRevealPricing, flash } = useApp();

  // Multiplier state
  const [name, setName] = useState(promoOffer.name);
  const [multiplier, setMultiplier] = useState(promoOffer.multiplier);
  const [active, setActive] = useState(promoOffer.active);
  const [validUntil, setValidUntil] = useState(promoOffer.validUntil);
  const [minAmount, setMinAmount] = useState(promoOffer.minAmount);
  const [description, setDescription] = useState(promoOffer.description);

  // Reveal Pricing state
  const [emailCost, setEmailCost] = useState(revealPricing.emailCreditCost);
  const [phoneCost, setPhoneCost] = useState(revealPricing.phoneCreditCost);
  const [bundleMode, setBundleMode] = useState(revealPricing.bundleMode);
  const [bundleCost, setBundleCost] = useState(revealPricing.bundleCreditCost);

  useEffect(() => {
    setEmailCost(revealPricing.emailCreditCost);
    setPhoneCost(revealPricing.phoneCreditCost);
    setBundleMode(revealPricing.bundleMode);
    setBundleCost(revealPricing.bundleCreditCost);
  }, [revealPricing]);

  const handleApplyTemplate = (tpl: Omit<PromoOffer, 'id'>) => {
    setName(tpl.name);
    setMultiplier(tpl.multiplier);
    setActive(tpl.active);
    setValidUntil(tpl.validUntil);
    setMinAmount(tpl.minAmount);
    setDescription(tpl.description);
    flash(`Loaded template: ${tpl.name}`);
  };

  const handleSave = () => {
    setPromoOffer({
      name,
      multiplier,
      active,
      validUntil,
      minAmount,
      description,
    });
    flash(
      active && multiplier > 1
        ? `Platform promo active: ${name} (${multiplier}X) applied across all workspaces!`
        : 'Promotional multiplier disabled. Workspaces default to standard 1 INR = 1 Credit.',
    );
  };

  const handleSaveRevealPricing = () => {
    setRevealPricing({
      emailCreditCost: emailCost,
      phoneCreditCost: phoneCost,
      bundleMode,
      bundleCreditCost: bundleCost,
    });
    flash(
      `Contact reveal pricing updated! Email: ${emailCost} Cr, Phone: ${phoneCost} Cr${
        bundleMode ? ` (Bundle Mode: Flat ${bundleCost} Cr for both)` : ` (${Math.round((emailCost + phoneCost) * 10) / 10} Cr both)`
      }`
    );
  };

  const handleApplyRevealPreset = (preset: RevealPreset) => {
    setEmailCost(preset.email);
    setPhoneCost(preset.phone);
    setBundleMode(preset.bundle);
    setBundleCost(preset.bundleCost);
    flash(`Loaded preset: ${preset.name}`);
  };

  // Preview simulations
  const preview500 = active && multiplier > 1 ? 500 * multiplier : 500;
  const preview1000 = active && multiplier > 1 ? 1000 * multiplier : 1000;
  const preview5000 = active && multiplier > 1 ? 5000 * multiplier : 5000;

  const effectiveBothCost = bundleMode ? bundleCost : Math.round((emailCost + phoneCost) * 10) / 10;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-2.5 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Top-Up Multiplier"
          value={active && multiplier > 1 ? `${multiplier}X Active` : '1X Standard'}
          note={active && multiplier > 1 ? name : '1 INR = 1 Credit'}
          delta={active && multiplier > 1 ? 'Live Promo' : 'Default'}
          deltaTone={active && multiplier > 1 ? 'good' : 'mute'}
        />
        <KpiCard
          label="Email Reveal Rate"
          value={`${revealPricing.emailCreditCost} Cr`}
          note="Per verified email saved"
          delta="Apollo-style"
          deltaTone="info"
        />
        <KpiCard
          label="Phone Reveal Rate"
          value={`${revealPricing.phoneCreditCost} Cr`}
          note="Per mobile / direct dial"
          delta={revealPricing.phoneCreditCost <= 2 ? 'Low Cost' : 'Custom'}
          deltaTone="good"
        />
        <KpiCard
          label="Both Contacts Rate"
          value={
            revealPricing.bundleMode
              ? `${revealPricing.bundleCreditCost} Cr (Bundle)`
              : `${Math.round((revealPricing.emailCreditCost + revealPricing.phoneCreditCost) * 10) / 10} Cr`
          }
          note={revealPricing.bundleMode ? 'Bundle trade promo active' : 'Combined unlock cost'}
          delta={revealPricing.bundleMode ? 'Trade Promo' : 'Standard'}
          deltaTone={revealPricing.bundleMode ? 'good' : 'mute'}
        />
      </div>

      <NoteStrip tone={active && multiplier > 1 ? 'good' : 'mute'} icon={Flame}>
        {active && multiplier > 1 ? (
          <span>
            <strong>Super Admin Multiplier Promo is LIVE:</strong> All customers depositing funds will receive <strong>{multiplier}X Credits</strong> (e.g. ₹500 = {preview500.toLocaleString('en-IN')} credits). The bonus is calculated automatically in the user&apos;s wallet.
          </span>
        ) : (
          <span>
            <strong>No active promotional multiplier:</strong> Customers receive standard 1 INR = 1 Credit rate on all wallet top-ups. Activate a multiplier below to run a limited-time bonus offer.
          </span>
        )}
      </NoteStrip>

      <div className="grid gap-3 grid-cols-1 lg:grid-cols-[1.3fr_1fr]">
        <Card className="overflow-hidden">
          <CardHead
            title="Promotional Multiplier Controller"
            sub="Set credit multipliers for marketing campaigns (e.g. 2X for 2 weeks). Modifies real-time calculation in the user wallet."
            action={
              <Toggle
                on={active}
                onChange={() => setActive((v) => !v)}
                label="Offer Active"
              />
            }
          />

          <div className="p-4 space-y-4">
            {/* Multiplier Presets */}
            <div>
              <label className="cap block mb-1.5">Credit Multiplier</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_MULTIPLIERS.map((m) => {
                  const selected = multiplier === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMultiplier(m)}
                      className={cx(
                        'px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors border',
                        selected
                          ? 'bg-primary text-white border-primary shadow-sm ring-2 ring-primary/20'
                          : 'bg-panel border-line text-ink hover:border-ghost',
                      )}
                    >
                      {m === 1 ? '1X (Standard ₹1 = 1 Cr)' : `${m}X (${m * 100}% Bonus)`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campaign Name & Duration */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              <div>
                <label className="cap block mb-1" htmlFor="promo-name">Offer / Campaign Name</label>
                <Input
                  id="promo-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 2X Booster Special"
                />
              </div>

              <div>
                <label className="cap block mb-1" htmlFor="promo-valid">Validity / Duration</label>
                <Input
                  id="promo-valid"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  placeholder="e.g. 23 Sep 2026 (2 weeks)"
                />
              </div>
            </div>

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              <div>
                <label className="cap block mb-1" htmlFor="promo-min">Min Top-up for Bonus (INR)</label>
                <Input
                  id="promo-min"
                  type="number"
                  min={0}
                  step={100}
                  value={minAmount}
                  onChange={(e) => setMinAmount(Number(e.target.value))}
                  placeholder="500"
                />
              </div>

              <div>
                <label className="cap block mb-1" htmlFor="promo-status-label">Effective Multiplier</label>
                <div id="promo-status-label" className="h-[30px] px-2.5 rounded-md border border-line-strong bg-wash flex items-center text-xs font-semibold text-ink">
                  {active && multiplier > 1 ? `${multiplier}X Active (₹1 = ${multiplier} Credits)` : '1X Standard (₹1 = 1 Credit)'}
                </div>
              </div>
            </div>

            <div>
              <label className="cap block mb-1" htmlFor="promo-desc">Public Announcement Copy</label>
              <textarea
                id="promo-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-2.5 rounded-md border border-line-strong bg-canvas text-ink focus:outline-none focus:border-primary"
                placeholder="Message shown in the customer's wallet page banner…"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button kind="primary" icon={Check} onClick={handleSave}>
                Save & Apply to Platform
              </Button>
              <Button onClick={() => handleApplyTemplate(TEMPLATES[0]!)}>
                Reset to 2X Default
              </Button>
            </div>
          </div>
        </Card>

        {/* Live Simulation Preview */}
        <div className="flex flex-col gap-3">
          <Panel>
            <PanelTitle>User Experience Simulation</PanelTitle>
            <p className="text-[11px] text-muted mb-3">
              What users in workspaces see in real-time when adding funds under current configuration:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded border border-rule bg-subtle flex justify-between items-center">
                <div>
                  <span className="text-muted">Deposit:</span> <strong className="text-ink">₹500</strong>
                  {active && multiplier > 1 ? (
                    <span className="text-[10px] text-amber-400 block">+{(500 * (multiplier - 1)).toLocaleString('en-IN')} promo bonus</span>
                  ) : null}
                </div>
                <div className="text-right">
                  <span className="num font-bold text-good-fg text-[14px]">
                    {preview500.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-muted block">credits</span>
                </div>
              </div>

              <div className="p-2.5 rounded border border-rule bg-subtle flex justify-between items-center">
                <div>
                  <span className="text-muted">Deposit:</span> <strong className="text-ink">₹1,000</strong>
                  {active && multiplier > 1 ? (
                    <span className="text-[10px] text-amber-400 block">+{(1000 * (multiplier - 1)).toLocaleString('en-IN')} promo bonus</span>
                  ) : null}
                </div>
                <div className="text-right">
                  <span className="num font-bold text-good-fg text-[14px]">
                    {preview1000.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-muted block">credits</span>
                </div>
              </div>

              <div className="p-2.5 rounded border border-rule bg-subtle flex justify-between items-center">
                <div>
                  <span className="text-muted">Deposit:</span> <strong className="text-ink">₹5,000</strong>
                  {active && multiplier > 1 ? (
                    <span className="text-[10px] text-amber-400 block">+{(5000 * (multiplier - 1)).toLocaleString('en-IN')} promo bonus</span>
                  ) : null}
                </div>
                <div className="text-right">
                  <span className="num font-bold text-good-fg text-[14px]">
                    {preview5000.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-muted block">credits</span>
                </div>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelTitle>Offer Quick Templates</PanelTitle>
            <div className="space-y-1.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => handleApplyTemplate(t)}
                  className="w-full text-left p-2 rounded hover:bg-wash border border-rule flex items-center justify-between gap-2 cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <span className="text-[12px] font-semibold text-ink truncate-1 block">{t.name}</span>
                    <span className="text-[10px] text-muted truncate-1 block">{t.validUntil}</span>
                  </div>
                  <Pill tone={t.active ? 'good' : 'mute'} className="shrink-0">
                    {t.multiplier}X
                  </Pill>
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Contact Reveal & Apollo Credit System */}
      <div className="pt-2">
        <NoteStrip tone="info" icon={Coins}>
          <span>
            <strong>Apollo-Style Lead Reveal System:</strong> Leads in discovery tables show availability badges (&quot;Available&quot; / &quot;Not Available&quot;). Direct email and phone contacts are only revealed when saved to a Campaign. Configure credit deduction rates below in 0.5-credit steps, or activate trade bundle mode.
          </span>
        </NoteStrip>
      </div>

      <div className="grid gap-3 grid-cols-1 lg:grid-cols-[1.3fr_1fr]">
        <Card className="overflow-hidden">
          <CardHead
            title="Contact Reveal & Apollo Credit Pricing"
            sub="Configure credit deduction when users add leads to campaigns to reveal verified emails & direct dials. Adjust rates in 0.5 credit steps or enable bundle trade mode."
            action={
              <Toggle
                on={bundleMode}
                onChange={() => setBundleMode((v) => !v)}
                label="Trade Bundle Mode"
              />
            }
          />

          <div className="p-4 space-y-4">
            {/* Quick Presets */}
            <div>
              <label className="cap block mb-1.5">Pricing Model Presets</label>
              <div className="flex flex-wrap gap-2">
                {REVEAL_PRESETS.map((p) => {
                  const isMatch =
                    emailCost === p.email &&
                    phoneCost === p.phone &&
                    bundleMode === p.bundle &&
                    (!p.bundle || bundleCost === p.bundleCost);
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleApplyRevealPreset(p)}
                      className={cx(
                        'px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors border text-left',
                        isMatch
                          ? 'bg-primary text-white border-primary shadow-sm ring-2 ring-primary/20'
                          : 'bg-panel border-line text-ink hover:border-ghost',
                      )}
                    >
                      <div>{p.name}</div>
                      <div className={cx('text-[10.5px] font-normal', isMatch ? 'text-white/80' : 'text-muted')}>
                        {p.tag}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Credit Cost Inputs */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              <div className="p-3 rounded-md border border-line bg-subtle space-y-2">
                <div className="flex items-center gap-1.5">
                  <Mail size={14} className="text-primary shrink-0" />
                  <label className="cap text-ink font-semibold" htmlFor="email-credit-input">
                    Email Credit Deduction
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEmailCost((v) => Math.max(0, Math.round((v - 0.5) * 10) / 10))}
                    className="w-8 h-8 rounded border border-line bg-panel hover:bg-wash text-ink font-bold text-sm flex items-center justify-center cursor-pointer transition-colors"
                    title="Decrease by 0.5"
                  >
                    -
                  </button>
                  <Input
                    id="email-credit-input"
                    type="number"
                    min={0}
                    step={0.5}
                    value={emailCost}
                    onChange={(e) => setEmailCost(Math.max(0, Number(e.target.value)))}
                    className="w-24 text-center font-bold text-[14px]"
                  />
                  <button
                    type="button"
                    onClick={() => setEmailCost((v) => Math.round((v + 0.5) * 10) / 10)}
                    className="w-8 h-8 rounded border border-line bg-panel hover:bg-wash text-ink font-bold text-sm flex items-center justify-center cursor-pointer transition-colors"
                    title="Increase by 0.5"
                  >
                    +
                  </button>
                  <span className="text-xs text-muted font-medium">Credits / lead</span>
                </div>
                <p className="text-[11px] text-muted">
                  Deducted when a lead with an available email is saved to a campaign.
                </p>
              </div>

              <div className="p-3 rounded-md border border-line bg-subtle space-y-2">
                <div className="flex items-center gap-1.5">
                  <Phone size={14} className="text-good-fg shrink-0" />
                  <label className="cap text-ink font-semibold" htmlFor="phone-credit-input">
                    Phone / Mobile Deduction
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPhoneCost((v) => Math.max(0, Math.round((v - 0.5) * 10) / 10))}
                    className="w-8 h-8 rounded border border-line bg-panel hover:bg-wash text-ink font-bold text-sm flex items-center justify-center cursor-pointer transition-colors"
                    title="Decrease by 0.5"
                  >
                    -
                  </button>
                  <Input
                    id="phone-credit-input"
                    type="number"
                    min={0}
                    step={0.5}
                    value={phoneCost}
                    onChange={(e) => setPhoneCost(Math.max(0, Number(e.target.value)))}
                    className="w-24 text-center font-bold text-[14px]"
                  />
                  <button
                    type="button"
                    onClick={() => setPhoneCost((v) => Math.round((v + 0.5) * 10) / 10)}
                    className="w-8 h-8 rounded border border-line bg-panel hover:bg-wash text-ink font-bold text-sm flex items-center justify-center cursor-pointer transition-colors"
                    title="Increase by 0.5"
                  >
                    +
                  </button>
                  <span className="text-xs text-muted font-medium">Credits / lead</span>
                </div>
                <p className="text-[11px] text-muted">
                  Deducted when a lead with an available phone number is saved to a campaign.
                </p>
              </div>
            </div>

            {/* Trade / Bundle Mode settings */}
            <div className={cx('p-3 rounded-md border transition-all', bundleMode ? 'border-primary/50 bg-primary/5' : 'border-line bg-subtle/50')}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className={bundleMode ? 'text-primary' : 'text-muted'} />
                  <span className="text-xs font-semibold text-ink">
                    Trade / Bundle System (Flat Rate for Both Contacts)
                  </span>
                </div>
                <Toggle
                  on={bundleMode}
                  onChange={() => setBundleMode((v) => !v)}
                  label="Bundle Active"
                />
              </div>

              {bundleMode ? (
                <div className="space-y-2 mt-2 pt-2 border-t border-rule">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">Flat Bundle Cost:</span>
                    <button
                      type="button"
                      onClick={() => setBundleCost((v) => Math.max(0, Math.round((v - 0.5) * 10) / 10))}
                      className="w-7 h-7 rounded border border-line bg-panel hover:bg-wash text-ink font-bold text-xs flex items-center justify-center cursor-pointer"
                      title="Decrease by 0.5"
                    >
                      -
                    </button>
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      value={bundleCost}
                      onChange={(e) => setBundleCost(Math.max(0, Number(e.target.value)))}
                      className="w-20 text-center font-bold text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setBundleCost((v) => Math.round((v + 0.5) * 10) / 10)}
                      className="w-7 h-7 rounded border border-line bg-panel hover:bg-wash text-ink font-bold text-xs flex items-center justify-center cursor-pointer"
                      title="Increase by 0.5"
                    >
                      +
                    </button>
                    <span className="text-xs text-primary font-semibold">Credits flat for both Email + Phone</span>
                  </div>
                  <p className="text-[11px] text-muted">
                    When active, users unlocking both contacts pay flat {bundleCost} credit(s) per lead instead of {Math.round((emailCost + phoneCost) * 10) / 10} credits.
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-muted">
                  Standard mode: Unlocking both Email and Phone sums individual rates ({emailCost} + {phoneCost} = {Math.round((emailCost + phoneCost) * 10) / 10} Credits). Enable trade mode to discount full unlocks.
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button kind="primary" icon={Check} onClick={handleSaveRevealPricing}>
                Save Reveal Pricing
              </Button>
              <Button onClick={() => handleApplyRevealPreset(REVEAL_PRESETS[0]!)}>
                Reset to Apollo Lite (1/2 Cr)
              </Button>
            </div>
          </div>
        </Card>

        {/* Live Simulation & Competitive Panel */}
        <div className="flex flex-col gap-3">
          <Panel>
            <PanelTitle>Live Campaign Unlock Preview</PanelTitle>
            <p className="text-[11px] text-muted mb-3">
              Real-time cost deducted from user wallets when saving contacts to a campaign:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded border border-rule bg-subtle flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-primary" />
                  <span className="text-muted">1 Lead (Email Only):</span>
                </div>
                <div>
                  <span className="num font-bold text-ink text-[13px]">{emailCost}</span>
                  <span className="text-[10px] text-muted ml-1">credit</span>
                </div>
              </div>

              <div className="p-2.5 rounded border border-rule bg-subtle flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-good-fg" />
                  <span className="text-muted">1 Lead (Phone Only):</span>
                </div>
                <div>
                  <span className="num font-bold text-ink text-[13px]">{phoneCost}</span>
                  <span className="text-[10px] text-muted ml-1">credits</span>
                </div>
              </div>

              <div className="p-2.5 rounded border border-primary/30 bg-primary/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="text-primary" />
                  <span className="font-semibold text-ink">1 Lead (Both Email & Phone):</span>
                </div>
                <div className="text-right">
                  <span className="num font-bold text-primary text-[15px]">
                    {effectiveBothCost}
                  </span>
                  <span className="text-[10px] text-primary ml-1 font-semibold">credits</span>
                  {bundleMode ? (
                    <span className="text-[10px] text-muted block">(Bundle Rate)</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-rule">
              <span className="cap block mb-1.5 text-muted">Batch Unlock Costs (Both Contacts)</span>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-2 rounded bg-wash border border-rule">
                  <div className="text-[10px] text-muted">25 Leads</div>
                  <div className="num font-bold text-ink text-[13px]">{Math.round(25 * effectiveBothCost * 10) / 10}</div>
                  <div className="text-[9px] text-muted">credits</div>
                </div>
                <div className="p-2 rounded bg-wash border border-rule">
                  <div className="text-[10px] text-muted">100 Leads</div>
                  <div className="num font-bold text-ink text-[13px]">{Math.round(100 * effectiveBothCost * 10) / 10}</div>
                  <div className="text-[9px] text-muted">credits</div>
                </div>
                <div className="p-2 rounded bg-wash border border-rule">
                  <div className="text-[10px] text-muted">500 Leads</div>
                  <div className="num font-bold text-ink text-[13px]">{Math.round(500 * effectiveBothCost * 10) / 10}</div>
                  <div className="text-[9px] text-muted">credits</div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelTitle>Apollo.io Market Comparison</PanelTitle>
            <div className="text-xs space-y-2 text-ink-3">
              <div className="flex justify-between items-center py-1 border-b border-rule">
                <span className="text-muted">Apollo Standard Rate:</span>
                <span className="font-semibold text-ink">1 Cr Email + 8 Cr Phone (9 Cr)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-rule">
                <span className="text-muted">LeadBro Active Rate:</span>
                <span className="font-semibold text-good-fg">{effectiveBothCost} Credits</span>
              </div>
              <div className="p-2 rounded bg-good-bg border border-good-border text-[11px] text-good-fg">
                LeadBro customers save{' '}
                <strong>
                  {Math.max(0, Math.round((1 - effectiveBothCost / 9) * 100))}%
                </strong>{' '}
                on credit expenditure compared to Apollo standard pricing.
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
