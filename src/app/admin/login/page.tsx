import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthScreen } from "@/components/admin/auth-screen";
import { getCurrentUser } from "@/lib/auth/server";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

/** `/admin/login` — the only admin entry point reachable while signed out. */
export default async function LoginPage(props: PageProps<"/admin/login">) {
  // Already signed in? No reason to see the form again.
  if (await getCurrentUser()) redirect("/admin");

  const { next } = await props.searchParams;
  const nextPath = typeof next === "string" ? next : "/admin";

  return (
    <AuthScreen
      title="Admin sign in"
      description="Sign in to manage the FITX website."
      footer="FITX Gym Sahiwal · staff only"
    >
      <LoginForm next={nextPath} />
    </AuthScreen>
  );
}
