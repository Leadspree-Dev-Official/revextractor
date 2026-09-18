import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, X } from 'lucide-react';
import { navGroups } from '@/lib/nav';
import { useAuth } from '@/lib/auth';
import { useApp } from '@/lib/store';
import { cx, Logo } from '@/components/ui';
import { CampaignSwitcher } from './CampaignSwitcher';

export function Sidebar({ onNavigate, onClose }: { onNavigate?(): void; onClose?(): void }) {
  const { isPlatformAdmin } = useAuth();
  const { flash, subscriptionWallet, paygWallet, promoOffer } = useApp();
  const { pathname } = useLocation();

  const [comingSoonOpen, setComingSoonOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('leadbro_coming_soon_open');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const toggleComingSoon = () => {
    setComingSoonOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('leadbro_coming_soon_open', String(next));
      } catch {}
      return next;
    });
  };

  const availableGroups = navGroups.filter((g) => !g.platformOnly || isPlatformAdmin);
  // Guarantee any Coming Soon section is always at the end of the menu
  const groups = [
    ...availableGroups.filter((g) => !g.comingSoon),
    ...availableGroups.filter((g) => g.comingSoon),
  ];

  return (
    <nav className="rail w-[226px] shrink-0 bg-nav flex flex-col overflow-hidden h-full" aria-label="Main">
      <div className="px-3.5 pt-3.5 pb-3 border-b border-nav-line">
        <div className="flex items-center justify-between gap-2.5 mb-3">
          <NavLink to="/dashboard" onClick={onNavigate} className="flex items-center no-underline outline-none focus-visible:ring-1 focus-visible:ring-brand rounded">
            <Logo size="sm" theme="dark" />
          </NavLink>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="ml-auto w-7 h-7 rounded-md flex items-center justify-center text-nav-meta hover:bg-nav-hover hover:text-white cursor-pointer lg:hidden"
            >
              <X size={15} />
            </button>
          ) : null}
        </div>

        <CampaignSwitcher onNavigate={onNavigate} />
      </div>

      <div className="flex-1 overflow-y-auto px-2 pt-2 pb-1" data-slot="scroll">
        {groups.map((group, idx) => {
          if (group.comingSoon) {
            const isFirstComingSoon = idx > 0 && !groups[idx - 1].comingSoon;
            return (
              <div key={group.label} className={cx('mb-2', isFirstComingSoon && 'pt-2.5 mt-2.5 border-t border-nav-line')}>
                <button
                  type="button"
                  onClick={toggleComingSoon}
                  className="w-full text-nav-label text-[9px] font-semibold tracking-[0.11em] uppercase px-2 pt-1.5 pb-1 flex items-center justify-between text-nav-meta hover:text-white select-none transition-colors cursor-pointer group"
                  aria-expanded={comingSoonOpen}
                  title={comingSoonOpen ? 'Click to collapse Coming Soon' : 'Click to expand Coming Soon'}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span>{group.label}</span>
                    <span className="text-[8.5px] font-medium text-amber-300/90 bg-amber-400/10 border border-amber-400/20 rounded px-1.5 py-px lowercase tracking-normal">
                      {group.items.length} locked
                    </span>
                  </span>
                  <ChevronDown
                    size={12}
                    strokeWidth={2}
                    className={cx(
                      'text-nav-meta group-hover:text-white transition-transform duration-200 shrink-0',
                      comingSoonOpen ? 'rotate-180' : 'rotate-0',
                    )}
                  />
                </button>

                {comingSoonOpen ? (
                  <div className="space-y-px mt-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.label}
                          onClick={() => flash(`${item.label} is coming soon!`)}
                          className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-xs text-nav-meta select-none cursor-not-allowed bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-nav-text transition-colors duration-150"
                          title={`${item.label} is coming soon — access is currently locked`}
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <Icon size={13} strokeWidth={1.8} className="shrink-0 text-nav-meta/70" aria-hidden />
                            <span className="truncate-1 font-medium text-nav-text/90">{item.label}</span>
                          </span>
                          <span className="text-[9px] font-medium tracking-normal text-amber-300/90 bg-amber-400/10 border border-amber-400/20 rounded px-1.5 py-0.5 shrink-0">
                            Coming soon
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <div key={group.label} className="mb-2.5">
              <div className="text-nav-label text-[9px] font-semibold tracking-[0.11em] uppercase px-2 pt-1.5 pb-1">
                {group.label}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                if (item.comingSoon) {
                  return (
                    <div
                      key={item.label}
                      onClick={() => flash(`${item.label} is coming soon!`)}
                      className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md mb-px text-xs text-nav-meta select-none cursor-not-allowed bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-nav-text transition-colors duration-150"
                      title={`${item.label} is coming soon — access is currently locked`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Icon size={13} strokeWidth={1.8} className="shrink-0 text-nav-meta/70" aria-hidden />
                        <span className="truncate-1 font-medium text-nav-text/90">{item.label}</span>
                      </span>
                      <span className="text-[9px] font-medium tracking-normal text-amber-300/90 bg-amber-400/10 border border-amber-400/20 rounded px-1.5 py-0.5 shrink-0">
                        Coming soon
                      </span>
                    </div>
                  );
                }
                const isChildActive = (item.children ?? []).some(
                  (c) => pathname === c.to || (c.also ?? []).some((p) => pathname.startsWith(p)),
                );
                const active = pathname === item.to || (!item.children && (item.also ?? []).some((p) => pathname.startsWith(p)));
                return (
                  <div key={item.to} className="mb-px">
                    <NavLink
                      to={item.to}
                      onClick={onNavigate}
                      className={cx(
                        'flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-xs',
                        'transition-colors duration-150',
                        active
                          ? 'bg-nav-active text-white font-semibold shadow-[inset_2px_0_0_var(--color-brand-bright)]'
                          : isChildActive
                          ? 'text-[#F1F5F7] bg-white/[0.04]'
                          : 'text-nav-text hover:bg-nav-hover hover:text-[#E7EDF2]',
                      )}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <Icon size={13} strokeWidth={active ? 2.1 : 1.8} className="shrink-0" aria-hidden />
                        <span className="truncate-1">{item.label}</span>
                      </span>
                      {item.badge ? (
                        item.comingSoon || item.badge.toLowerCase().includes('soon') ? (
                          <span className="text-[9px] font-medium tracking-normal text-amber-300/90 bg-amber-400/10 border border-amber-400/20 rounded px-1.5 py-0.5 shrink-0">
                            {item.badge}
                          </span>
                        ) : (
                          <span className="num text-[9px] text-nav-meta bg-nav-hover rounded px-1.5 py-px shrink-0">
                            {item.badge}
                          </span>
                        )
                      ) : null}
                    </NavLink>

                    {item.children?.length ? (
                      <div className="ml-3 pl-2.5 border-l border-nav-line/80 my-0.5 space-y-0.5">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive = pathname === child.to || (child.also ?? []).some((p) => pathname.startsWith(p));
                          return (
                            <NavLink
                              key={child.to}
                              to={child.to}
                              onClick={onNavigate}
                              className={cx(
                                'flex items-center justify-between gap-2 px-2 py-1 rounded-md text-[11.5px]',
                                'transition-colors duration-150',
                                childActive
                                  ? 'bg-nav-active text-white font-medium shadow-[inset_2px_0_0_var(--color-brand-bright)]'
                                  : 'text-nav-text hover:bg-nav-hover hover:text-[#E7EDF2]',
                              )}
                            >
                              <span className="flex items-center gap-1.5 min-w-0">
                                <ChildIcon size={12} strokeWidth={childActive ? 2 : 1.7} className="shrink-0" aria-hidden />
                                <span className="truncate-1">{child.label}</span>
                              </span>
                              {child.badge ? (
                                child.comingSoon || child.badge.toLowerCase().includes('soon') ? (
                                  <span className="text-[9px] font-medium tracking-normal text-amber-300/90 bg-amber-400/10 border border-amber-400/20 rounded px-1.5 py-0.5 shrink-0">
                                    {child.badge}
                                  </span>
                                ) : (
                                  <span className="num text-[9px] text-nav-meta bg-nav-hover rounded px-1.5 py-px shrink-0">
                                    {child.badge}
                                  </span>
                                )
                              ) : null}
                            </NavLink>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="border-t border-nav-line px-3.5 pt-2.5 pb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-nav-meta text-[9px] font-semibold tracking-[0.1em] uppercase">Credits</span>
          <NavLink to="/wallet" onClick={onNavigate} className="flex items-center gap-1 text-brand-bright text-[10px] hover:underline">
            {promoOffer.active && promoOffer.multiplier > 1 ? (
              <span className="text-[9px] bg-amber-400 text-black px-1 rounded font-bold">{promoOffer.multiplier}X</span>
            ) : null}
            <span>Wallet</span>
          </NavLink>
        </div>

        {/* Subscription Plan Credits */}
        <div className="mb-[7px]">
          <div className="flex justify-between text-[10px] text-[#AEBBC6] mb-[3px]">
            <span>Plan Usage</span>
            <span className="num text-nav-text-bright">
              {subscriptionWallet.recordsUsed.toLocaleString('en-IN')} / {subscriptionWallet.includedRecords.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="h-[3px] bg-[#222E3A] rounded-sm overflow-hidden">
            <div
              className="h-full rounded-sm transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.round((subscriptionWallet.recordsUsed / subscriptionWallet.includedRecords) * 100))}%`,
                background: 'var(--color-brand-bright)',
              }}
            />
          </div>
        </div>

        {/* Pay As You Go Wallet Credits */}
        <div className="mb-[7px] last:mb-0">
          <div className="flex justify-between text-[10px] text-[#AEBBC6] mb-[3px]">
            <span>PAYG Wallet</span>
            <span className="num text-nav-text-bright font-medium">
              {paygWallet.balance.toLocaleString('en-IN')} cr
            </span>
          </div>
          <div className="h-[3px] bg-[#222E3A] rounded-sm overflow-hidden">
            <div
              className="h-full rounded-sm transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(10, Math.round((paygWallet.balance / 50000) * 100)))}%`,
                background: '#60A5FA',
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
