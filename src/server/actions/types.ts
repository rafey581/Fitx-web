/**
 * Shared shape returned by admin server actions and consumed by
 * `useActionState` in the corresponding forms.
 */
export type ActionState = {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialActionState: ActionState = { ok: false };
