"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, Field } from "@/components/ui/field";
import { inputClass } from "@/components/ui/styles";
import { SubmitButton } from "@/components/ui/submit-button";
import { forgotPasswordAction } from "@/server/actions/auth";
import { initialActionState } from "@/server/actions/types";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    forgotPasswordAction,
    initialActionState,
  );
  const emailError = state.fieldErrors?.email?.[0];
  const sent = state.ok && state.message;

  return (
    <form action={formAction} className="mt-6 space-y-4" noValidate>
      {state.error ? <Alert variant="error">{state.error}</Alert> : null}
      {sent ? <Alert variant="success">{state.message}</Alert> : null}

      <Field
        label="Email"
        htmlFor="forgot-email"
        error={emailError}
        hint="We'll email you a link to choose a new password."
      >
        <input
          id="forgot-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className={inputClass}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "forgot-email-error" : undefined}
        />
      </Field>

      <SubmitButton className="w-full" pendingLabel="Sending…">
        Send reset link
      </SubmitButton>

      <div className="text-center">
        <Link
          href="/admin/login"
          className="text-sm font-medium text-accent hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </form>
  );
}
