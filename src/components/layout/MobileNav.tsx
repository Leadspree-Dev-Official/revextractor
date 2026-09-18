import { NavLink } from 'react-router-dom';
import { Crosshair, LayoutDashboard, MoreHorizontal, Send, Target } from 'lucide-react';
import { cx } from '@/components/ui';

import { useApp } from '@/lib/store';

/** §60 — Home, Discover, Campaigns, Outreach, More. */
const tabs = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/find-leads', label: 'Discover', icon: Crosshair },
  { to: '/saved', label: 'Campaigns', icon: Target },
  { to: '#', label: 'Outreach', icon: Send, comingSoon: true },
  { to: '/more', label: 'More', icon: MoreHorizontal },
];

export function MobileNav() {
  const { flash } = useApp();

  return (
    <nav
      className="lg:hidden shrink-0 bg-panel border-t border-line flex items-stretch justify-around px-1.5 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      {tabs.map((tab) => {
        const { to, label, icon: Icon, comingSoon } = tab;

        if (comingSoon) {
          return (
            <button
              key={label}
              type="button"
              onClick={() => flash(`${label} is coming soon!`)}
              className="flex flex-col items-center gap-0.5 py-1.5 px-3 min-w-[56px] text-[10px] text-muted-2 cursor-not-allowed select-none relative"
              title={`${label} is coming soon — no menu available`}
            >
              <Icon size={17} strokeWidth={1.8} className="text-muted/60" />
              <span>{label}</span>
              <span className="text-[7.5px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-1 leading-tight mt-0.5">
                Soon
              </span>
            </button>
          );
        }

        return (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cx(
              'flex flex-col items-center gap-1 py-2 px-3 min-w-[56px] text-[10px] transition-colors duration-150',
              isActive ? 'text-primary font-semibold' : 'text-muted-2',
            )}
          >
            {({ isActive }) => (
              <>
                <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
