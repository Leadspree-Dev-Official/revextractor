import { useEffect, useState } from 'react';
import { ShieldCheck, Trash2, UserX } from 'lucide-react';
import { useApp } from '@/lib/store';
import {
  admin, roles, since,
  type AdminMembership, type AdminUser, type MemberRole,
} from '@/lib/admin';
import { Button, Input, Modal, Pill, Toggle, cx } from '@/components/ui';

/**
 * Everything a platform admin can do to one account, in one place.
 *
 * Deliberately not a page: these are consequential, infrequent actions on a
 * single person, and they belong behind a deliberate click rather than sitting
 * one stray tap away in a table row. The destructive ones say what will happen
 * in plain words before they happen.
 */
export function UserControls({
  user, onClose, onChange,
}: {
  user: AdminUser;
  onClose(): void;
  onChange(patch: Partial<AdminUser>): void;
}) {
  const { flash } = useApp();
  const [memberships, setMemberships] = useState<AdminMembership[]>([]);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    admin.memberships(user.id).then((r) => { if (alive) setMemberships(r.data); });
    return () => { alive = false; };
  }, [user.id]);

  const run = async (
    label: string,
    call: Promise<{ error: string | null }>,
    optimistic?: Partial<AdminUser>,
  ) => {
    setBusy(true);
    if (optimistic) onChange(optimistic);
    const { error } = await call;
    setBusy(false);
    if (error) {
      // The RPCs refuse things the UI cannot know are impossible — the last
      // platform admin, the last owner. Surfacing the database's own sentence
      // is more useful than a generic failure.
      flash(error);
      onChange({});
      return;
    }
    flash(label);
  };

  const suspended = user.status === 'suspended';

  return (
    <Modal
      onClose={onClose}
      title={user.fullName || user.email}
      width={560}
      footer={<Button onClick={onClose}>Done</Button>}
    >
      <div className="flex items-center gap-2 mb-3.5 flex-wrap">
        <span className="num text-[11px] text-muted">{user.email}</span>
        <Pill tone={suspended ? 'bad' : 'good'}>{suspended ? 'Suspended' : 'Active'}</Pill>
        {user.isAdmin ? <Pill tone="ai">Platform admin</Pill> : null}
        <span className="text-[10.5px] text-muted-2">Last seen {since(user.lastSeen)}</span>
      </div>

      {suspended && user.suspendedReason ? (
        <div className="rounded-[6px] border border-bad-bd bg-bad-bg/40 px-2.5 py-2 mb-3 text-[11px] text-ink-3">
          {user.suspendedReason}
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <section className="rounded-[7px] border border-line px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[12px] font-medium text-ink flex items-center gap-1.5">
                <ShieldCheck size={12} strokeWidth={2} aria-hidden />
                Platform admin
              </div>
              <p className="text-[10.5px] text-muted leading-relaxed mt-0.5">
                Grants this console: the pool, every workspace's usage, and these controls.
                It does not grant access to any workspace's leads.
              </p>
            </div>
            <Toggle
              on={user.isAdmin}
              label="Platform admin"
              onChange={() => run(
                user.isAdmin ? 'Platform admin revoked' : 'Platform admin granted',
                admin.setPlatformAdmin(user.id, !user.isAdmin),
                { isAdmin: !user.isAdmin },
              )}
            />
          </div>
        </section>

        <section className="rounded-[7px] border border-line px-3 py-2.5">
          <div className="text-[12px] font-medium text-ink flex items-center gap-1.5">
            <UserX size={12} strokeWidth={2} aria-hidden />
            {suspended ? 'Reactivate account' : 'Suspend account'}
          </div>
          <p className="text-[10.5px] text-muted leading-relaxed mt-0.5 mb-2">
            {suspended
              ? 'Access returns immediately, in every workspace they belong to.'
              : 'Sign-in stays possible, but every workspace row disappears — is_member() checks '
                + 'account status, so this is enforced by the database rather than by hiding screens.'}
          </p>
          {!suspended ? (
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason — shown to whoever reviews this later"
              className="w-full mb-2"
              aria-label="Suspension reason"
            />
          ) : null}
          <Button
            kind={suspended ? 'primary' : 'danger'}
            disabled={busy || (!suspended && reason.trim().length < 3)}
            onClick={() => run(
              suspended ? 'Account reactivated' : 'Account suspended',
              admin.setUserStatus(user.id, suspended ? 'active' : 'suspended', reason),
              { status: suspended ? 'active' : 'suspended', suspendedReason: suspended ? '' : reason },
            )}
          >
            {suspended ? 'Reactivate' : 'Suspend this account'}
          </Button>
        </section>

        <section className="rounded-[7px] border border-line px-3 py-2.5">
          <div className="text-[12px] font-medium text-ink mb-1.5">
            Workspaces ({memberships.length})
          </div>
          {memberships.length === 0 ? (
            <p className="text-[10.5px] text-muted-2">Not a member of any workspace.</p>
          ) : memberships.map((m) => (
            <div key={m.workspaceId} className="flex items-center gap-2 py-1.5 border-b border-rule last:border-0">
              <div className="min-w-0 flex-1">
                <div className="text-[11.5px] text-ink truncate-1">{m.workspaceName}</div>
                <div className="text-[10px] text-muted-2">Last seen {since(m.lastSeen)}</div>
              </div>
              <select
                value={m.role}
                aria-label={`Role in ${m.workspaceName}`}
                onChange={(e) => {
                  const role = e.target.value as MemberRole;
                  setMemberships((list) => list.map((x) =>
                    (x.workspaceId === m.workspaceId ? { ...x, role } : x)));
                  void run(`Role set to ${role} in ${m.workspaceName}`,
                    admin.setMemberRole(m.workspaceId, user.id, role));
                }}
                className={cx(
                  'h-[26px] px-1.5 rounded-md border border-line-strong bg-panel',
                  'text-[11px] text-ink-3 cursor-pointer focus-visible:border-primary',
                )}
              >
                {roles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <button
                type="button"
                aria-label={`Remove from ${m.workspaceName}`}
                title={m.role === 'owner' ? 'Transfer ownership first' : 'Remove from this workspace'}
                disabled={m.role === 'owner'}
                onClick={() => {
                  setMemberships((list) => list.filter((x) => x.workspaceId !== m.workspaceId));
                  void run(`Removed from ${m.workspaceName}`,
                    admin.removeMember(m.workspaceId, user.id));
                }}
                className={cx(
                  'w-6 h-6 rounded flex items-center justify-center shrink-0',
                  m.role === 'owner'
                    ? 'text-muted-2 opacity-40 cursor-not-allowed'
                    : 'text-muted-2 hover:text-bad-fg hover:bg-bad-bg cursor-pointer',
                )}
              >
                <Trash2 size={12} strokeWidth={1.9} aria-hidden />
              </button>
            </div>
          ))}
        </section>
      </div>
    </Modal>
  );
}
