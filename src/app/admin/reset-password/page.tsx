import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthScreen } from "@/components/admin/auth-screen";
import { getCurrentUser } from "@/lib/auth/server";

import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false },
};

export default async function ResetPasswordPage(
  props: PageProps<"/admin/reset-password">,
) {
  if (await getCurrentUser()) redirect("/admin");

  const { token } = await props.searchParams;
  const value = typeof token === "string" ? token : "";

  if (value.length < 10) {
    return (
      <AuthScreen
        title="Reset link invalid"
        description="This password reset link is missing or malformed."
      >
        <div className="mt-6 space-y-4">
          <Link href="/admin/forgot-password" className="btn btn-accent w-full">
            Request a new link
          </Link>
          <div className="text-center">
            <Link
              href="/admin/login"
              className="text-sm font-medium text-accent hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Choose a new password"
      description="Pick something at least 8 characters long."
    >
      <ResetPasswordForm token={value} />
    </AuthScreen>
  );
}
