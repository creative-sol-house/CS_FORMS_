
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Full Stack Application",
    short_name: "Inquiry Form",
    description: " A full stack application for managing Leads.",
 start_url: "/sol-ad-dash/",
    scope: "/sol-ad-dash/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111827",
    icons: [
      {
        src: "/sol-ad-dash/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/sol-ad-dash/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
