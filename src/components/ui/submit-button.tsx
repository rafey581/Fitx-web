"use client";

import type { ReactNode } from "react";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "accent" | "outline" | "danger";
  className?: string;
  name?: string;
  value?: string;
  confirm?: string;
  /** Disable independently of the pending state. */
  disabled?: boolean;
};

const variants = {
  accent: "btn-accent",
  outline: "border border-black/20 text-ink hover:bg-black/[0.04]",
  danger: "bg-red-600 text-white hover:bg-red-700",
} as const;

export function SubmitButton({
  children,
  pendingLabel = "Working…",
  variant = "accent",
  className = "",
  name,
  value,
  confirm,
  disabled,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={disabled || pending}
      className={`btn ${variants[variant]} disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      onClick={
        confirm
          ? (event) => {
              if (!window.confirm(confirm)) event.preventDefault();
            }
          : undefined
      }
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
