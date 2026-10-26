import type { ReactNode } from "react";

import { errorTextClass, hintTextClass, labelClass } from "./styles";

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

/** Label + control + error/hint. Keeps admin forms visually consistent. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && !error ? <p className={hintTextClass}>{hint}</p> : null}
      {error ? (
        <p id={`${htmlFor}-error`} className={errorTextClass} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type AlertProps = {
  variant: "success" | "error" | "info";
  children: ReactNode;
};

export function Alert({ variant, children }: AlertProps) {
  const styles: Record<AlertProps["variant"], string> = {
    success: "border-green-200 bg-green-50 text-green-800",
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-black/10 bg-black/[0.03] text-ink",
  };

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`rounded-brand border px-4 py-3 text-sm ${styles[variant]}`}
    >
      {children}
    </div>
  );
}
