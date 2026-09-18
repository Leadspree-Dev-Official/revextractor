import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useApp } from '@/lib/store';
import { Overlay } from '@/components/ui';
import { searchIcons } from '@/lib/nav';

interface Hit { icon: keyof typeof searchIcons; label: string; kind: string; to: string; panel?: number }

const hits: Hit[] = [
  { icon: 'campaign', label: 'Saved Campaign: Indian SaaS Founders Outbound', kind: 'Campaign', to: '/saved' },
  { icon: 'campaign', label: 'Saved Campaign: Bangalore Early-Stage Founders', kind: 'Campaign', to: '/saved' },
  { icon: 'action', label: 'Find Leads — filter by title & company', kind: 'Discover', to: '/find-leads' },
  { icon: 'action', label: 'Find Companies — filter by industry & revenue', kind: 'Discover', to: '/find-companies' },
  { icon: 'job', label: 'Extraction #1040 — IndiaMART', kind: 'Job', to: '/jobs/1040' },
  { icon: 'action', label: 'Run new Google Business extraction', kind: 'Action', to: '/extraction' },
  { icon: 'chart', label: 'Lead analytics', kind: 'Page', to: '/analytics' },
  { icon: 'deal', label: 'Northgate rollout — $96,000', kind: 'Deal', to: '/deals' },
];

export function CommandPalette() {
  const { cmdkOpen, setCmdk, openPanel } = useApp();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const navigate = useNavigate();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? hits.filter((h) => h.label.toLowerCase().includes(q) || h.kind.toLowerCase().includes(q)) : hits;
  }, [query]);

  if (!cmdkOpen) return null;

  const run = (hit: Hit) => {
    setCmdk(false);
    setQuery('');
    navigate(hit.to);
    if (hit.panel) openPanel(hit.panel);
  };

  return (
    <Overlay onClose={() => setCmdk(false)} align="top" label="Search everything">
      <div className="relative w-full max-w-[590px] bg-panel rounded-xl shadow-float overflow-hidden anim-rise">
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-line">
          <Search size={15} className="text-muted-2 shrink-0" strokeWidth={1.9} />
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
              if (e.key === 'Enter' && results[cursor]) run(results[cursor]);
            }}
            placeholder="Search leads, companies, lists, jobs, deals…"
            aria-label="Search everything"
            className="flex-1 bg-transparent border-0 outline-none text-[13px] text-ink placeholder:text-muted-2"
          />
          <kbd className="num text-[10px] border border-line-strong rounded px-1.5 py-px text-muted-2 shrink-0">ESC</kbd>
        </div>

        <div className="p-1.5 max-h-[340px] overflow-y-auto" role="listbox">
          {results.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted">
              Nothing matches “{query}”. Try a company, a job number, or a list name.
            </div>
          ) : (
            results.map((hit, i) => {
              const Icon = searchIcons[hit.icon];
              return (
                <button
                  key={hit.label}
                  type="button"
                  role="option"
                  aria-selected={i === cursor}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => run(hit)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left cursor-pointer ${
                    i === cursor ? 'bg-primary-soft' : 'hover:bg-wash'
                  }`}
                >
                  <span className="w-[22px] h-[22px] rounded-md bg-line-soft text-ink-3 flex items-center justify-center shrink-0">
                    <Icon size={12} strokeWidth={1.9} />
                  </span>
                  <span className="text-xs text-ink flex-1 truncate-1">{hit.label}</span>
                  <span className="text-[10px] text-muted-2 shrink-0">{hit.kind}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </Overlay>
  );
}
