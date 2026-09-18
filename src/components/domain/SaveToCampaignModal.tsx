import { useEffect, useMemo, useState } from 'react';
import { Check, Coins, FolderPlus, Mail, Phone, Sparkles } from 'lucide-react';
import { useApp } from '@/lib/store';
import { Button, Modal, cx } from '@/components/ui';

export function SaveToCampaignModal() {
  const {
    saveModalOpen,
    closeSaveToCampaign,
    pendingSaveLeads,
    savedCampaigns,
    lastSavedCampaignId,
    saveToCampaign,
    revealPricing,
    totalSpendableCredits,
  } = useApp();

  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [selectedId, setSelectedId] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [unlockType, setUnlockType] = useState<'both' | 'email_only' | 'phone_only'>('both');

  // When modal opens or lastSavedCampaignId changes, pre-select the last saved campaign
  useEffect(() => {
    if (saveModalOpen) {
      setNewName('');
      const defaultId =
        savedCampaigns.find((c) => c.id === lastSavedCampaignId)?.id ??
        savedCampaigns[0]?.id ??
        '';
      setSelectedId(defaultId);
      setMode('existing');
      setUnlockType('both');
    }
  }, [saveModalOpen, lastSavedCampaignId, savedCampaigns]);

  const recentCampaigns = savedCampaigns.slice(0, 7);
  const count = pendingSaveLeads.length;

  const emailAvailableCount = useMemo(
    () => pendingSaveLeads.filter((l) => Boolean(l.email)).length,
    [pendingSaveLeads],
  );

  const phoneAvailableCount = useMemo(
    () => pendingSaveLeads.filter((l) => Boolean(l.phone)).length,
    [pendingSaveLeads],
  );

  const totalCreditsNeeded = useMemo(() => {
    if (revealPricing.bundleMode && unlockType === 'both') {
      const qualifying = pendingSaveLeads.filter((l) => Boolean(l.email || l.phone)).length;
      return Math.round(qualifying * revealPricing.bundleCreditCost * 10) / 10;
    }
    let cost = 0;
    if (unlockType === 'both' || unlockType === 'email_only') {
      cost += emailAvailableCount * revealPricing.emailCreditCost;
    }
    if (unlockType === 'both' || unlockType === 'phone_only') {
      cost += phoneAvailableCount * revealPricing.phoneCreditCost;
    }
    return Math.round(cost * 10) / 10;
  }, [pendingSaveLeads, unlockType, revealPricing, emailAvailableCount, phoneAvailableCount]);

  const hasSufficientCredits = totalSpendableCredits >= totalCreditsNeeded;

  if (!saveModalOpen) return null;

  const handleSave = () => {
    if (!hasSufficientCredits) return;
    if (mode === 'new') {
      const trimmed = newName.trim();
      if (!trimmed) return;
      saveToCampaign(trimmed, true, unlockType);
    } else {
      if (!selectedId) return;
      saveToCampaign(selectedId, false, unlockType);
    }
  };

  const sampleNames = pendingSaveLeads
    .slice(0, 2)
    .map((l) => l.name || l.company)
    .filter(Boolean)
    .join(', ');
  const remainingCount = count - 2;
  const leadSummary =
    count === 1
      ? `${pendingSaveLeads[0]?.name || pendingSaveLeads[0]?.company || 'Lead'}`
      : `${sampleNames}${remainingCount > 0 ? ` +${remainingCount} more` : ''}`;

  return (
    <Modal
      onClose={closeSaveToCampaign}
      title="Save to Campaign & Reveal Contacts"
      width={520}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 text-xs">
            <Coins size={14} className="text-primary" />
            <span className="text-muted">Required:</span>
            <strong className="num text-ink font-semibold">{totalCreditsNeeded} Credits</strong>
            <span className="text-muted-2">({totalSpendableCredits} available)</span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={closeSaveToCampaign}>Cancel</Button>
            <Button
              kind="primary"
              onClick={handleSave}
              disabled={(mode === 'new' ? !newName.trim() : !selectedId) || !hasSufficientCredits}
            >
              Unlock & Save ({totalCreditsNeeded} cr)
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3.5 pt-0.5">
        {/* Lead summary pill */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-wash border border-line-soft text-xs">
          <span className="text-muted truncate-1">
            Saving <span className="font-semibold text-ink num">{count}</span> {count === 1 ? 'record' : 'records'} ({leadSummary})
          </span>
          <span className="text-[10px] font-medium text-primary bg-primary-soft rounded px-1.5 py-0.5 shrink-0">
            {pendingSaveLeads[0]?.source || 'Discover'}
          </span>
        </div>

        {/* Apollo-Style Reveal Options */}
        <div className="rounded-lg border border-line bg-subtle/30 p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <Sparkles size={13} className="text-primary" />
              <span>Contact Reveal Tier</span>
            </span>
            {revealPricing.bundleMode ? (
              <span className="text-[10px] font-semibold text-good-fg bg-good-bg border border-good-bd rounded px-1.5 py-0.5">
                Trade Promo: {revealPricing.bundleCreditCost} cr flat
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Both */}
            <button
              type="button"
              onClick={() => setUnlockType('both')}
              className={cx(
                'flex flex-col text-left p-2.5 rounded-md border transition-all cursor-pointer',
                unlockType === 'both'
                  ? 'border-primary bg-primary-soft/40 ring-1 ring-primary/40'
                  : 'border-line bg-panel hover:border-line-strong hover:bg-wash',
              )}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-semibold text-ink">Both</span>
                <span className="num text-[10px] font-bold text-primary bg-primary-soft px-1 rounded">
                  {revealPricing.bundleMode
                    ? `${revealPricing.bundleCreditCost} cr`
                    : `${revealPricing.emailCreditCost + revealPricing.phoneCreditCost} cr`}
                </span>
              </div>
              <span className="text-[10.5px] text-muted leading-tight">
                {emailAvailableCount} emails, {phoneAvailableCount} phones
              </span>
            </button>

            {/* Email Only */}
            <button
              type="button"
              onClick={() => setUnlockType('email_only')}
              className={cx(
                'flex flex-col text-left p-2.5 rounded-md border transition-all cursor-pointer',
                unlockType === 'email_only'
                  ? 'border-primary bg-primary-soft/40 ring-1 ring-primary/40'
                  : 'border-line bg-panel hover:border-line-strong hover:bg-wash',
              )}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-semibold text-ink flex items-center gap-1">
                  <Mail size={11} className="text-muted-2" />
                  <span>Email</span>
                </span>
                <span className="num text-[10px] font-bold text-ink-3 bg-wash px-1 rounded border border-line-soft">
                  {revealPricing.emailCreditCost} cr
                </span>
              </div>
              <span className="text-[10.5px] text-muted leading-tight">
                {emailAvailableCount} {emailAvailableCount === 1 ? 'email' : 'emails'}
              </span>
            </button>

            {/* Phone Only */}
            <button
              type="button"
              onClick={() => setUnlockType('phone_only')}
              className={cx(
                'flex flex-col text-left p-2.5 rounded-md border transition-all cursor-pointer',
                unlockType === 'phone_only'
                  ? 'border-primary bg-primary-soft/40 ring-1 ring-primary/40'
                  : 'border-line bg-panel hover:border-line-strong hover:bg-wash',
              )}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-semibold text-ink flex items-center gap-1">
                  <Phone size={10} className="text-muted-2" />
                  <span>Phone</span>
                </span>
                <span className="num text-[10px] font-bold text-ink-3 bg-wash px-1 rounded border border-line-soft">
                  {revealPricing.phoneCreditCost} cr
                </span>
              </div>
              <span className="text-[10.5px] text-muted leading-tight">
                {phoneAvailableCount} {phoneAvailableCount === 1 ? 'phone' : 'phones'}
              </span>
            </button>
          </div>

          {!hasSufficientCredits ? (
            <div className="mt-2 text-[11px] text-bad-fg bg-bad-bg border border-bad-bd rounded px-2 py-1.5 flex items-center justify-between gap-2">
              <span>Insufficient credit balance ({totalSpendableCredits} available, {totalCreditsNeeded} needed).</span>
            </div>
          ) : null}
        </div>

        {/* Create a new campaign section */}
        <div
          className={cx(
            'p-3 rounded-lg border transition-all duration-150',
            mode === 'new'
              ? 'border-primary bg-primary-soft/20 shadow-sm'
              : 'border-line bg-subtle/50 hover:border-line-strong',
          )}
        >
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input
              type="radio"
              name="campaign_choice"
              checked={mode === 'new'}
              onChange={() => setMode('new')}
              className="accent-primary w-3.5 h-3.5"
            />
            <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <FolderPlus size={13} className="text-primary" />
              <span>Create a new campaign</span>
            </span>
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setMode('new');
            }}
            placeholder="Campaign name, e.g. Q4 Indian SaaS Founders Outbound…"
            className="w-full h-8 px-2.5 rounded-md border border-line-strong bg-panel text-xs text-ink placeholder:text-muted-2 outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Existing campaigns list (last 5-7 campaigns) */}
        <div>
          <div className="text-[11px] font-semibold text-muted tracking-wider uppercase px-1 mb-1.5">
            Recent campaigns ({recentCampaigns.length})
          </div>

          <div className="space-y-1 max-h-[190px] overflow-y-auto pr-1" data-slot="scroll">
            {recentCampaigns.map((camp) => {
              const isSelected = mode === 'existing' && selectedId === camp.id;
              const isLastSaved = camp.id === lastSavedCampaignId;

              return (
                <div
                  key={camp.id}
                  onClick={() => {
                    setSelectedId(camp.id);
                    setMode('existing');
                  }}
                  className={cx(
                    'flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors',
                    isSelected
                      ? 'border-primary bg-primary-soft/30'
                      : 'border-line-soft bg-panel hover:bg-wash hover:border-line-strong',
                  )}
                >
                  <div className="pt-0.5">
                    <div
                      className={cx(
                        'w-4 h-4 rounded-full border flex items-center justify-center transition-colors',
                        isSelected
                          ? 'border-primary bg-primary text-white'
                          : 'border-line-strong bg-panel',
                      )}
                    >
                      {isSelected ? <Check size={10} strokeWidth={3} /> : null}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-ink truncate-1">
                        {camp.name}
                      </span>
                      {isLastSaved ? (
                        <span className="text-[9px] font-medium text-primary bg-primary-soft rounded px-1.5 py-px shrink-0">
                          Last used
                        </span>
                      ) : null}
                    </div>
                    {camp.description ? (
                      <p className="text-[10.5px] text-muted truncate-1 mt-0.5">
                        {camp.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="num text-[11px] font-medium text-ink bg-line-soft rounded px-1.5 py-0.5">
                      {camp.leads.length} {camp.leads.length === 1 ? 'lead' : 'leads'}
                    </span>
                    <div className="text-[9.5px] text-muted-2 mt-1">{camp.updatedAt}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
