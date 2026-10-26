"use client";

import { useActionState, type ReactNode } from "react";

import { initialActionState, type ActionState } from "@/server/actions/types";

type ServerAction = (
  prev: ActionState,
  formData: FormData,
) => Promise<ActionState>;

/**
 * Wires a server action to `useActionState` and hands the current state to a
 * render prop, so every admin form gets consistent success/error rendering.
 */
export function ActionForm({
  action,
  className,
  children,
}: {
  action: ServerAction;
  className?: string;
  children: (state: ActionState) => ReactNode;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  return (
    <form action={formAction} className={className} noValidate>
      {children(state)}
    </form>
  );
}
