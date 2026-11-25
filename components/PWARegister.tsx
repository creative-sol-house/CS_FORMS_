
"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(
        "/sol-ad-dash/sw.js",
        {
          scope: "/sol-ad-dash/",
        }
      ).catch(console.error);
    }
  }, []);

  return null;
}
