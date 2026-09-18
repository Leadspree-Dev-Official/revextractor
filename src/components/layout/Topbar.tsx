import { NavLink, useLocation } from 'react-router-dom';
import { Bell, Menu, Search } from 'lucide-react';
import { navGroups } from '@/lib/nav';
import { useApp } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Avatar } from '@/components/ui';
import { isLive } from '@/lib/supabase';

function useCrumb() {
  const { pathname } = useLocation();
  for (const group of navGroups) {
    for (const item of group.items) {
      if (pathname === item.to) return [group.label, item.label] as const;
      if (item.children) {
        for (const child of item.children) {
          if (pathname === child.to) return [item.label, child.label] as const;
        }
      }
    }
  }
  if (pathname.startsWith('/jobs/')) return ['Extraction', 'Extraction Job'] as const;
  if (pathname.startsWith('/companies/')) return ['Database', 'Company Profile'] as const;
  return ['Workspace', 'Dashboard'] as const;
}

export function Topbar({ onMenu }: { onMenu(): void }) {
  const [group, title] = useCrumb();
  const { setCmdk } = useApp();
  const { user } = useAuth();

  return (
    <header className="h-12 shrink-0 bg-panel border-b border-line flex items-center gap-3 px-3 sm:px-4">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open navigation"
        className="lg:hidden w-[30px] h-[30px] rounded-md border border-line-strong flex items-center justify-center text-ink-3 hover:border-primary hover:text-primary cursor-pointer shrink-0"
      >
        <Menu size={15} />
      </button>

      <div className="flex items-center gap-2 min-w-0">
        <span className="text-muted-2 text-xs hidden sm:inline">{group}</span>
        <span className="text-faint text-[11px] hidden sm:inline">/</span>
        <span className="text-ink text-[13px] font-semibold truncate-1">{title}</span>
      </div>

      <button
        type="button"
        onClick={() => setCmdk(true)}
        className="ml-auto hidden md:flex items-center gap-2 w-[280px] h-[30px] px-2.5 rounded-md border border-line-strong bg-wash text-muted-2 text-xs cursor-pointer transition-colors duration-150 hover:border-primary hover:bg-panel"
      >
        <Search size={13} strokeWidth={1.9} />
        <span>Search everything…</span>
        <kbd className="num ml-auto text-[10px] border border-[#DCE3E8] rounded px-1 py-px bg-panel text-muted">⌘K</kbd>
      </button>

      <button
        type="button"
        onClick={() => setCmdk(true)}
        aria-label="Search"
        className="md:hidden ml-auto w-[30px] h-[30px] rounded-md border border-line-strong flex items-center justify-center text-ink-3 hover:border-primary hover:text-primary cursor-pointer"
      >
        <Search size={14} />
      </button>

      <span
        className="hidden sm:flex items-center px-2 py-[3px] border border-[#F0D9A8] bg-warn-bg rounded-[5px] text-warn-fg text-[10px] font-semibold tracking-[0.03em] whitespace-nowrap"
        title={isLive ? 'Connected to Supabase — seeded rows are still labelled demo' : 'Seeded demo workspace — no records here are real'}
      >
        DEMO DATA
      </span>

      <NavLink
        to="/notifications"
        aria-label="Notifications, 8 unread"
        className="w-[30px] h-[30px] rounded-md border border-line-strong flex items-center justify-center relative bg-panel text-ink-3 hover:border-primary hover:text-primary transition-colors duration-150 shrink-0"
      >
        <Bell size={14} strokeWidth={1.9} />
        <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] rounded-full bg-primary text-white text-[9px] font-semibold flex items-center justify-center px-1">
          8
        </span>
      </NavLink>

      <Avatar initials={user?.initials ?? 'LS'} size={26} />
    </header>
  );
}
