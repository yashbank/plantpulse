'use client';

import { PageHeader } from '@/components/mis/kit/page-header';
import { useState, useTransition } from 'react';

import { Button } from '@/components/mis/kit/button';
import { Card, CardRow } from '@/components/mis/kit/card';
import { EmptyState } from '@/components/mis/kit/empty-state';
import { Input } from '@/components/mis/kit/input';
import { RowActions } from '@/components/mis/kit/row-actions';
import { SlideOver } from '@/components/mis/kit/slide-over';
import { StatusBadge } from '@/components/mis/kit/status-badge';
import { RolePicker } from '@/components/mis/roles/role-picker';
import { useT } from '@/components/mis/shell/locale-provider';
import type { MisRoleName } from '@/lib/mis/roles';
import { roleLabelKey, roleTone } from '@/lib/mis/roles';
import type { MisSeatSummary, MisUserRow, PendingMisGrant } from '@/server/mis/users';

import {
  adminChangeEmailAction,
  adminResetPasswordAction,
  grantMisRoleAction,
  inviteMisUserAction,
} from '@/app/(mis)/mis/settings/users/actions';

export function UsersScreen({
  users,
  seats,
  pendingGrants,
  canInvite,
  assignableRoles,
  canReset = false,
  actorIsOwner = false,
}: {
  users: MisUserRow[];
  seats: MisSeatSummary;
  pendingGrants: PendingMisGrant[];
  canInvite: boolean;
  assignableRoles: MisRoleName[];
  /** Admin/Owner: may reset a login's password or email. An Admin never sees this on an Owner row. */
  canReset?: boolean;
  actorIsOwner?: boolean;
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MisRoleName | null>(assignableRoles[0] ?? null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useT();

  const atSeatLimit = seats.available <= 0;

  const openInvite = () => {
    setEmail('');
    setRole(assignableRoles[0] ?? null);
    setFeedback(null);
    setInviteOpen(true);
  };

  const handleInvite = () => {
    if (!role) return;
    startTransition(async () => {
      const outcome = await inviteMisUserAction(email, role);
      if (!outcome.ok) {
        setFeedback(outcome.detail);
        return;
      }
      const result = outcome.value;
      if (result.kind === 'invited') {
        setFeedback(
          `Invite sent to ${email}. Once they accept, grant their MIS role from the list below.`,
        );
      } else {
        setInviteOpen(false);
      }
    });
  };

  const handleGrant = (userProfileId: string, grantRole: MisRoleName) => {
    startTransition(async () => {
      const outcome = await grantMisRoleAction(userProfileId, grantRole);
      if (!outcome.ok) setFeedback(outcome.detail);
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col gap-3 pb-24">
      <PageHeader
        title="MIS users"
        className="mis-rise mb-0"
        meta={
          <span className="font-mono text-xs text-slate-500">
            {seats.used} / {seats.max} workspace seats used
          </span>
        }
        actions={
          canInvite ? (
            <Button onClick={openInvite} disabled={atSeatLimit && pendingGrants.length === 0}>
              + Invite
            </Button>
          ) : undefined
        }
      />
      {atSeatLimit && (
        <Card tone="warning" className="mis-rise">
          <p className="text-sm text-amber-800">
            Seat limit reached. Free a seat, or grant a role to someone who has already
            accepted, below.
          </p>
        </Card>
      )}

      {canInvite && pendingGrants.length > 0 && (
        <Card tone="warning" className="mis-rise">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
            Waiting on a MIS role
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {pendingGrants.map((p) => (
              <div key={p.userProfileId} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">
                    {p.name ?? p.email}
                  </div>
                  <div className="truncate text-xs text-slate-500">{p.email}</div>
                </div>
                <RolePickerInline
                  options={assignableRoles}
                  disabled={isPending}
                  onPick={(pickedRole) => handleGrant(p.userProfileId, pickedRole)}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          People with a MIS login
        </div>
        {users.length === 0 ? (
          <EmptyState
            title="No MIS users yet"
            body={canInvite ? 'Invite the first person above.' : 'Ask the Owner to invite you.'}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((u) => (
              <Card key={u.id} raised>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-900">{u.name}</div>
                    <div className="truncate text-xs font-mono text-slate-500">
                      {u.employeeCode}
                    </div>
                  </div>
                  <StatusBadge tone={roleTone(u.role)}>{t(roleLabelKey(u.role))}</StatusBadge>
                </div>
                <CardRow label="Email" value={u.email ?? '—'} />
                <CardRow
                  label="Status"
                  value={
                    <StatusBadge tone={u.isActive ? 'good' : 'neutral'}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </StatusBadge>
                  }
                />
                {canReset && u.userProfileId && (actorIsOwner || u.role !== 'OWNER') && (
                  <ResetPanel userProfileId={u.userProfileId} />
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <SlideOver open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite to the MIS">
        <div className="flex flex-col gap-4">
          {feedback ? (
            <>
              <p className="text-sm text-slate-700">{feedback}</p>
              <Button onClick={() => setInviteOpen(false)}>Done</Button>
            </>
          ) : (
            <>
              <Input
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
              <RolePicker value={role} options={assignableRoles} onChange={setRole} label="MIS role" />
              <p className="text-sm text-slate-500">
                If this email already has a workspace login, the role is granted right away.
                Otherwise a real invite email goes out, and you grant the role here once they
                accept.
              </p>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleInvite} disabled={isPending || !email || !role}>
                  {isPending ? 'Sending…' : 'Send invite'}
                </Button>
                <Button variant="ghost" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </SlideOver>
    </div>
  );
}

/** A compact, inline picker for the pending-grants row — no label, no wrapper. */
function RolePickerInline({
  options,
  disabled,
  onPick,
}: {
  options: MisRoleName[];
  disabled: boolean;
  onPick: (role: MisRoleName) => void;
}) {
  const [value, setValue] = useState<MisRoleName | null>(options[0] ?? null);
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <RolePicker value={value} options={options} onChange={setValue} label="" disabled={disabled} />
      <Button
        variant="secondary"
        disabled={disabled || !value}
        onClick={() => value && onPick(value)}
      >
        Grant
      </Button>
    </div>
  );
}

/** Admin/Owner: reset one login. The temporary password is shown once and is never stored or audited. */
function ResetPanel({ userProfileId }: { userProfileId: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [pending, start] = useTransition();

  const resetPassword = () => {
    if (!window.confirm('Reset this password? The old password stops working at once.')) return;
    start(async () => {
      const r = await adminResetPasswordAction(userProfileId);
      setMsg(r.ok ? `Temporary password: ${r.value.temporaryPassword} (shown once - they must change it at first login)` : r.detail);
    });
  };
  const changeEmail = () =>
    start(async () => {
      const r = await adminChangeEmailAction(userProfileId, email);
      setMsg(r.ok ? `Email changed to ${r.value.email}.` : r.detail);
      if (r.ok) setEmailOpen(false);
    });

  return (
    <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-2">
      <div className="flex items-center gap-2">
        <Button variant="secondary" disabled={pending} onClick={resetPassword}>Reset password</Button>
        <RowActions items={[{ key: 'email', label: 'Change email', disabled: pending, onSelect: () => setEmailOpen((o) => !o) }]} />
      </div>
      {emailOpen && (
        <div className="flex flex-col gap-2">
          <Input label="New email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button disabled={pending || !email} onClick={changeEmail}>Save email</Button>
        </div>
      )}
      {msg && <p role="status" className="break-all font-mono text-xs text-slate-700">{msg}</p>}
    </div>
  );
}
