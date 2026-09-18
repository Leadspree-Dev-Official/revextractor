import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useApp } from '@/lib/store';
import { Button, Modal, Overlay } from '@/components/ui';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { CommandPalette } from './CommandPalette';
import { LeadPanel } from './LeadPanel';
import { SaveToCampaignModal } from '@/components/domain/SaveToCampaignModal';

export function Shell() {
  const { setCmdk, closePanel, toast, confirm, closeConfirm, runConfirm } = useApp();
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();

  // ⌘K / Ctrl-K opens search; Escape closes whatever is on top.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdk(true);
      }
      if (e.key === 'Escape') { setDrawer(false); closePanel(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setCmdk, closePanel]);

  // A route change should never leave a stale overlay behind it.
  useEffect(() => { setDrawer(false); closePanel(); }, [pathname, closePanel]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-canvas">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {drawer ? (
        <Overlay onClose={() => setDrawer(false)} align="right" label="Navigation">
          <div className="relative h-full mr-auto anim-slide" style={{ animationName: 'ls-fade' }}>
            <Sidebar onNavigate={() => setDrawer(false)} onClose={() => setDrawer(false)} />
          </div>
        </Overlay>
      ) : null}

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenu={() => setDrawer(true)} />
        <main className="flex-1 overflow-y-auto relative" data-slot="scroll">
          <Outlet />
        </main>
        <MobileNav />
      </div>

      <LeadPanel />
      <CommandPalette />
      <SaveToCampaignModal />

      {confirm ? (
        <Modal
          onClose={closeConfirm}
          title={confirm.title}
          footer={
            <>
              <Button onClick={closeConfirm}>Cancel</Button>
              <Button kind={confirm.danger ? 'danger' : 'primary'} onClick={runConfirm}>{confirm.cta}</Button>
            </>
          }
        >
          <p className="text-xs text-ink-3 leading-relaxed">{confirm.body}</p>
          <div className="flex items-center justify-between gap-3 mt-3.5 px-3 py-2.5 rounded-[7px] bg-subtle border border-line-soft">
            <span className="text-[11px] text-muted">{confirm.costLabel}</span>
            <span
              className="num text-[15px] font-semibold"
              style={{ color: confirm.danger ? 'var(--color-bad-fg)' : 'var(--color-primary)' }}
            >
              {confirm.cost}
            </span>
          </div>
        </Modal>
      ) : null}

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-ink text-white text-xs shadow-float anim-rise max-w-[calc(100vw-2rem)]"
        >
          <CheckCircle2 size={14} className="text-brand-bright shrink-0" strokeWidth={2.2} />
          <span className="truncate-1">{toast}</span>
        </div>
      ) : null}
    </div>
  );
}
