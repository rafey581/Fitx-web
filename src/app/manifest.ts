import type { MetadataRoute } from "next";

import { SITE_NAME } from "@/lib/fitx/seo";

/** Web app manifest: name and icons when the site is added to a phone's home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "FITX",
    description: "Personal training gym in Shadman Town, Sahiwal.",
    start_url: "/",
    display: "standalone",
    background_color: "#08080a",
    theme_color: "#08080a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
