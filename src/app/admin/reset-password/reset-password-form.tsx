"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, Field } from "@/components/ui/field";
import { inputClass } from "@/components/ui/styles";
import { SubmitButton } from "@/components/ui/submit-button";
import { resetPasswordAction } from "@/server/actions/auth";
import { initialActionState } from "@/server/actions/types";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(
    resetPasswordAction,
    initialActionState,
  );
  const passwordError = state.fieldErrors?.password?.[0];
  const confirmError = state.fieldErrors?.confirmPassword?.[0];

  if (state.ok) {
    return (
      <div className="mt-6 space-y-4">
        <Alert variant="success">{state.message}</Alert>
        <Link href="/admin/login" className="btn btn-accent w-full">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}

      <Field
        label="New password"
        htmlFor="reset-password"
        error={passwordError}
      >
        <input
          id="reset-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? "reset-password-error" : undefined}
        />
      </Field>

      <Field
        label="Confirm password"
        htmlFor="reset-confirm"
        error={confirmError}
      >
        <input
          id="reset-confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
          aria-invalid={confirmError ? true : undefined}
          aria-describedby={confirmError ? "reset-confirm-error" : undefined}
        />
      </Field>

      <SubmitButton className="w-full" pendingLabel="Updating…">
        Set new password
      </SubmitButton>
    </form>
  );
}
