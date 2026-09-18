import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronsUpDown, Plus, Target } from 'lucide-react';
import { useApp } from '@/lib/store';
import { cx } from '@/components/ui';

export function CampaignSwitcher({ onNavigate }: { onNavigate?(): void }) {
  const { savedCampaigns, lastSavedCampaignId, setLastSavedCampaignId, createCampaign, flash } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const activeCampaign =
    savedCampaigns.find((c) => c.id === lastSavedCampaignId) ??
    savedCampaigns[0];

  const handleSelect = (id: string) => {
    setLastSavedCampaignId(id);
    setOpen(false);
    onNavigate?.();
  };

  const handleCreateNew = () => {
    setOpen(false);
    const name = window.prompt('Enter new campaign name:');
    if (name && name.trim()) {
      const newId = createCampaign(name.trim());
      setLastSavedCampaignId(newId);
      flash(`Campaign “${name.trim()}” created`);
      navigate('/saved');
      onNavigate?.();
    }
  };

  const handleManage = () => {
    setOpen(false);
    navigate('/saved');
    onNavigate?.();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="w-full flex items-center justify-between gap-2 px-2.5 py-[7px] rounded-md border border-nav-line-2 bg-nav-raised cursor-pointer transition-colors duration-150 hover:border-[#31404F] text-left"
      >
        <span className="min-w-0">
          <span className="block text-nav-meta text-[9px] tracking-[0.09em] uppercase">Active Campaign</span>
          <span className="block text-nav-text-bright text-xs font-medium truncate-1">
            {activeCampaign?.name ?? 'Select Campaign'}
          </span>
        </span>
        <ChevronsUpDown size={13} className="text-[#5F7285] shrink-0" strokeWidth={1.8} />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute z-40 left-0 right-0 mt-1.5 rounded-lg border border-nav-line-2 bg-nav-raised shadow-float overflow-hidden anim-rise"
        >
          <div className="max-h-[220px] overflow-y-auto divide-y divide-nav-line" data-slot="scroll">
            {savedCampaigns.map((c) => {
              const isSelected = c.id === activeCampaign?.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(c.id)}
                  className={cx(
                    'w-full flex items-start gap-2 px-2.5 py-2 text-left cursor-pointer',
                    'transition-colors duration-150 hover:bg-nav-hover',
                    isSelected && 'bg-nav-active',
                  )}
                >
                  <span className="w-3.5 pt-0.5 shrink-0">
                    {isSelected ? <Check size={12} className="text-brand-bright" strokeWidth={2.6} /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11.5px] font-medium text-nav-text-bright truncate-1">{c.name}</span>
                    <span className="block text-[9.5px] text-nav-meta truncate-1">
                      {c.leads.length} leads · {c.updatedAt}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-nav-line px-2.5 py-2 bg-nav-line/20 space-y-1">
            <button
              type="button"
              onClick={handleCreateNew}
              className="w-full flex items-center gap-2 px-1.5 py-1 text-[11px] font-medium text-brand-bright hover:text-brand-bright/80 cursor-pointer"
            >
              <Plus size={13} />
              <span>New campaign</span>
            </button>
            <button
              type="button"
              onClick={handleManage}
              className="w-full flex items-center gap-2 px-1.5 py-1 text-[10.5px] text-nav-meta hover:text-nav-text-bright cursor-pointer"
            >
              <Target size={12} />
              <span>Manage all campaigns ({savedCampaigns.length})</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
