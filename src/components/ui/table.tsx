import type { ReactNode } from 'react';
import { cx } from './index';

/**
 * Dense grid table. Columns are declared once and shared by head and rows so
 * they can never drift. The whole table scrolls horizontally inside its own
 * container — the page body never scrolls sideways.
 */

export interface GridTableProps {
  cols: string;
  minWidth: number;
  head: Array<{
    label: ReactNode;
    align?: 'left' | 'right' | 'center';
    onClick?(): void;
    active?: boolean;
    className?: string;
  }>;
  children: ReactNode;
  className?: string;
  caption?: string;
}

export function GridTable({ cols, minWidth, head, children, className, caption }: GridTableProps) {
  return (
    <div className={cx('overflow-x-auto', className)} data-slot="scroll">
      <div style={{ minWidth }}>
        {caption ? <span className="sr-only">{caption}</span> : null}
        <div
          className="grid bg-subtle border-b border-line sticky top-0 z-10"
          style={{ gridTemplateColumns: cols }}
          role="row"
        >
          {head.map((h, i) => (
            <div
              key={i}
              role="columnheader"
              onClick={h.onClick}
              className={cx(
                'cap py-2 truncate-1 flex items-center gap-1',
                h.className || 'px-3.5',
                h.align === 'right' && 'justify-end text-right',
                h.align === 'center' && 'justify-center text-center',
                h.onClick && 'cursor-pointer hover:text-ink-3 select-none',
                h.active && 'text-primary',
              )}
            >
              {h.label}
            </div>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}

export function GridRow({
  cols, children, onClick, className, selected, dense,
}: {
  cols: string;
  children: ReactNode;
  onClick?(): void;
  className?: string;
  selected?: boolean;
  dense?: boolean;
}) {
  const interactive = Boolean(onClick);
  return (
    <div
      role="row"
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={interactive ? (e) => { if (e.key === 'Enter') onClick?.(); } : undefined}
      className={cx(
        'grid border-b border-rule transition-colors duration-100',
        dense ? 'py-2' : 'py-2.5',
        selected ? 'bg-primary-tint' : 'bg-panel hover:bg-wash/60',
        interactive && 'cursor-pointer hover:bg-wash focus-visible:bg-wash',
        className,
      )}
      style={{ gridTemplateColumns: cols }}
    >
      {children}
    </div>
  );
}

export const Cell = ({
  children, align = 'left', mono, strong, className,
}: {
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
  mono?: boolean;
  strong?: boolean;
  className?: string;
}) => (
  <div
    role="cell"
    className={cx(
      'flex items-center min-w-0 text-[11.5px]',
      className?.includes('px-') ? '' : 'px-3.5',
      mono ? 'num text-[11px] text-[#5c6b7a]' : 'text-ink-3',
      strong && 'text-ink font-medium',
      align === 'right' && 'justify-end text-right',
      align === 'center' && 'justify-center',
      className,
    )}
  >
    <span className="truncate-1 w-full" style={{ textAlign: align }}>{children}</span>
  </div>
);

/** Cell that holds a pill or other element that must not be clipped by truncation. */
export const CellRaw = ({
  children, align = 'left', className,
}: { children: ReactNode; align?: 'left' | 'right' | 'center'; className?: string }) => (
  <div
    role="cell"
    className={cx(
      'flex items-center min-w-0 gap-1.5',
      className?.includes('px-') ? '' : 'px-3.5',
      align === 'right' && 'justify-end',
      align === 'center' && 'justify-center',
      className,
    )}
  >
    {children}
  </div>
);

/** Two-line identity cell: name over a quieter secondary line. */
export const CellStack = ({
  title, sub, className,
}: { title: ReactNode; sub?: ReactNode; className?: string }) => (
  <div role="cell" className={cx('px-3.5 flex flex-col justify-center min-w-0', className)}>
    <span className="text-[12px] font-medium text-ink truncate-1">{title}</span>
    {sub ? <span className="text-[10.5px] text-muted truncate-1">{sub}</span> : null}
  </div>
);
