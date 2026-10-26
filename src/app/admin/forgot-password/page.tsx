import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthScreen } from "@/components/admin/auth-screen";
import { getCurrentUser } from "@/lib/auth/server";

import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false },
};

export default async function ForgotPasswordPage() {
  if (await getCurrentUser()) redirect("/admin");

  return (
    <AuthScreen
      title="Forgot password"
      description="Enter your account email and we'll send a reset link."
    >
      <ForgotPasswordForm />
    </AuthScreen>
  );
}
