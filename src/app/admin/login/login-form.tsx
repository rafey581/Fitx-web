"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, Field } from "@/components/ui/field";
import { inputClass } from "@/components/ui/styles";
import { SubmitButton } from "@/components/ui/submit-button";
import { loginAction } from "@/server/actions/auth";
import { initialActionState } from "@/server/actions/types";

/** Sign-in form for `/admin/login`. Submits the `loginAction` server action. */
export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(loginAction, initialActionState);
  const emailError = state.fieldErrors?.email?.[0];
  const passwordError = state.fieldErrors?.password?.[0];

  return (
    <form action={formAction} className="mt-6 space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />

      {state.error ? <Alert variant="error">{state.error}</Alert> : null}

      <Field label="Email" htmlFor="login-email" error={emailError}>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className={inputClass}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "login-email-error" : undefined}
        />
      </Field>

      <Field label="Password" htmlFor="login-password" error={passwordError}>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? "login-password-error" : undefined}
        />
      </Field>

      <SubmitButton className="w-full" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>

      <div className="text-center">
        <Link
          href="/admin/forgot-password"
          className="text-sm font-medium text-accent hover:underline"
        >
          Forgot your password?
        </Link>
      </div>
    </form>
  );
}
