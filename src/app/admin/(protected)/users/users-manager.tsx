"use client";

import { Alert, Field } from "@/components/ui/field";
import { ActionForm } from "@/components/ui/action-form";
import { inputClass } from "@/components/ui/styles";
import { SubmitButton } from "@/components/ui/submit-button";
import { Role } from "@/generated/prisma/enums";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { formatDateTime } from "@/lib/format";
import {
  createUserAction,
  deleteUserAction,
  sendUserResetLinkAction,
  setUserPasswordAction,
  updateUserAction,
} from "@/server/actions/users";

/** Serializable subset of a user passed from the server page. */
export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
};

const ROLE_OPTIONS: Role[] = [Role.OWNER, Role.EDITOR, Role.FRONTDESK];

function RoleSelect({ id, defaultValue }: { id: string; defaultValue?: Role }) {
  return (
    <select
      id={id}
      name="role"
      defaultValue={defaultValue}
      className={inputClass}
    >
      {ROLE_OPTIONS.map((role) => (
        <option key={role} value={role}>
          {ROLE_LABELS[role]}
        </option>
      ))}
    </select>
  );
}

function CreateUserForm() {
  return (
    <ActionForm action={createUserAction} className="grid gap-4 sm:grid-cols-2">
      {(state) => (
        <>
          {state.error ? (
            <div className="sm:col-span-2">
              <Alert variant="error">{state.error}</Alert>
            </div>
          ) : null}
          {state.message ? (
            <div className="sm:col-span-2">
              <Alert variant="success">{state.message}</Alert>
            </div>
          ) : null}

          <Field
            label="Name"
            htmlFor="new-name"
            error={state.fieldErrors?.name?.[0]}
          >
            <input id="new-name" name="name" className={inputClass} required />
          </Field>
          <Field
            label="Email"
            htmlFor="new-email"
            error={state.fieldErrors?.email?.[0]}
          >
            <input
              id="new-email"
              name="email"
              type="email"
              className={inputClass}
              required
            />
          </Field>
          <Field
            label="Temporary password"
            htmlFor="new-password"
            error={state.fieldErrors?.password?.[0]}
            hint="At least 8 characters. Share it securely."
          >
            <input
              id="new-password"
              name="password"
              type="text"
              autoComplete="new-password"
              minLength={8}
              className={inputClass}
              required
            />
          </Field>
          <Field
            label="Role"
            htmlFor="new-role"
            error={state.fieldErrors?.role?.[0]}
          >
            <RoleSelect id="new-role" defaultValue={Role.EDITOR} />
          </Field>

          <div className="sm:col-span-2">
            <SubmitButton pendingLabel="Creating…">Create user</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}

function EditUserForm({ user }: { user: AdminUserRow }) {
  return (
    <ActionForm
      action={updateUserAction}
      className="space-y-3 rounded-brand border border-black/10 p-4"
    >
      {(state) => (
        <>
          <p className="font-heading text-sm font-bold text-ink">
            Profile & role
          </p>
          {state.error ? <Alert variant="error">{state.error}</Alert> : null}
          {state.message ? (
            <Alert variant="success">{state.message}</Alert>
          ) : null}

          <input type="hidden" name="id" value={user.id} />

          <Field
            label="Name"
            htmlFor={`name-${user.id}`}
            error={state.fieldErrors?.name?.[0]}
          >
            <input
              id={`name-${user.id}`}
              name="name"
              defaultValue={user.name}
              className={inputClass}
              required
            />
          </Field>
          <Field
            label="Email"
            htmlFor={`email-${user.id}`}
            error={state.fieldErrors?.email?.[0]}
          >
            <input
              id={`email-${user.id}`}
              name="email"
              type="email"
              defaultValue={user.email}
              className={inputClass}
              required
            />
          </Field>
          <Field
            label="Role"
            htmlFor={`role-${user.id}`}
            error={state.fieldErrors?.role?.[0]}
          >
            <RoleSelect id={`role-${user.id}`} defaultValue={user.role} />
          </Field>

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={user.isActive}
              className="h-4 w-4"
            />
            Account active
          </label>

          <SubmitButton pendingLabel="Saving…" variant="outline">
            Save changes
          </SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

function SetPasswordForm({ user }: { user: AdminUserRow }) {
  return (
    <ActionForm
      action={setUserPasswordAction}
      className="space-y-3 rounded-brand border border-black/10 p-4"
    >
      {(state) => (
        <>
          <p className="font-heading text-sm font-bold text-ink">
            Set password
          </p>
          {state.error ? <Alert variant="error">{state.error}</Alert> : null}
          {state.message ? (
            <Alert variant="success">{state.message}</Alert>
          ) : null}

          <input type="hidden" name="id" value={user.id} />

          <Field
            label="New password"
            htmlFor={`pw-${user.id}`}
            error={state.fieldErrors?.password?.[0]}
          >
            <input
              id={`pw-${user.id}`}
              name="password"
              type="text"
              autoComplete="new-password"
              minLength={8}
              className={inputClass}
              required
            />
          </Field>

          <SubmitButton pendingLabel="Updating…" variant="outline">
            Set password
          </SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

function ResetLinkForm({ user }: { user: AdminUserRow }) {
  return (
    <ActionForm
      action={sendUserResetLinkAction}
      className="space-y-3 rounded-brand border border-black/10 p-4"
    >
      {(state) => (
        <>
          <p className="font-heading text-sm font-bold text-ink">
            Password reset
          </p>
          <p className="text-xs text-muted">
            Emails a one-hour reset link to {user.email}.
          </p>
          {state.error ? <Alert variant="error">{state.error}</Alert> : null}
          {state.message ? (
            <Alert variant="success">{state.message}</Alert>
          ) : null}

          <input type="hidden" name="id" value={user.id} />

          <SubmitButton pendingLabel="Sending…" variant="outline">
            Send reset link
          </SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

function DeleteUserForm({ user }: { user: AdminUserRow }) {
  return (
    <ActionForm
      action={deleteUserAction}
      className="space-y-3 rounded-brand border border-red-200 bg-red-50/40 p-4"
    >
      {(state) => (
        <>
          <p className="font-heading text-sm font-bold text-red-700">
            Delete user
          </p>
          <p className="text-xs text-red-700/80">
            Permanently removes the account. This cannot be undone.
          </p>
          {state.error ? <Alert variant="error">{state.error}</Alert> : null}

          <input type="hidden" name="id" value={user.id} />

          <SubmitButton
            variant="danger"
            pendingLabel="Deleting…"
            confirm={`Delete ${user.name}? This cannot be undone.`}
          >
            Delete {user.name.split(" ")[0]}
          </SubmitButton>
        </>
      )}
    </ActionForm>
  );
}

function UserCard({ user, isSelf }: { user: AdminUserRow; isSelf: boolean }) {
  return (
    <li className="rounded-brand border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-semibold text-ink">
            {user.name}
            {isSelf ? (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-accent uppercase">
                you
              </span>
            ) : null}
          </p>
          <p className="text-sm text-muted">{user.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-navy/10 px-2.5 py-0.5 font-semibold text-navy">
              {ROLE_LABELS[user.role]}
            </span>
            <span
              className={
                user.isActive
                  ? "rounded-full bg-green-100 px-2.5 py-0.5 font-semibold text-green-700"
                  : "rounded-full bg-black/10 px-2.5 py-0.5 font-semibold text-muted"
              }
            >
              {user.isActive ? "Active" : "Disabled"}
            </span>
            <span className="text-muted">
              Last login {formatDateTime(user.lastLoginAt)}
            </span>
          </div>
        </div>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-semibold text-accent select-none">
          Manage account
        </summary>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <EditUserForm user={user} />
          <SetPasswordForm user={user} />
          <ResetLinkForm user={user} />
          {!isSelf ? <DeleteUserForm user={user} /> : null}
        </div>
      </details>
    </li>
  );
}

export function UsersManager({
  users,
  currentUserId,
}: {
  users: AdminUserRow[];
  currentUserId: string;
}) {
  return (
    <div className="space-y-8">
      <section className="rounded-brand border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-ink">Add a user</h2>
        <p className="mt-1 text-sm text-muted">
          Owner-only. New accounts can sign in immediately with the temporary
          password you set.
        </p>
        <div className="mt-5">
          <CreateUserForm />
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-heading text-lg font-bold text-ink">
          Team ({users.length})
        </h2>
        <ul className="space-y-4">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isSelf={user.id === currentUserId}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}
