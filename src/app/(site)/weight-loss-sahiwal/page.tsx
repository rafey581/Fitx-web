import type { Metadata } from "next";

import { LandingView } from "@/components/site/landing-view";
import { landingPage } from "@/lib/fitx/landing";
import { seoMetadata } from "@/lib/fitx/seo";

const page = landingPage("/weight-loss-sahiwal")!;

export const metadata: Metadata = seoMetadata(page.path, { title: page.title, description: page.description });

export default function Page() {
  return <LandingView page={page} />;
}
