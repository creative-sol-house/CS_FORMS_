"use client";

import { useEffect } from "react";

export default function PwaInit() {
  useEffect(() => {
    // 1. Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("SW registered:", reg.scope))
        .catch((err) => console.error("SW registration failed:", err));
    }

    // 2. Capture beforeinstallprompt event early
    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      document.dispatchEvent(new CustomEvent("pwa-install-ready"));
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  return null;
}