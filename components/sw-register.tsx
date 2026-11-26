"use client";
import { useEffect } from "react";
import type { BeforeInstallPromptEvent } from "@/lib/pwa";

export default function SwRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      window.__installPrompt = e as BeforeInstallPromptEvent;
      window.dispatchEvent(new Event("install-ready"));
    };
    const onInstalled = () => {
      window.__installPrompt = null;
      window.dispatchEvent(new Event("install-ready"));
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return null;
}