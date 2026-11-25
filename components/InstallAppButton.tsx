"use client";
import { useEffect, useState } from "react";

export default function InstallAppButton() {
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (installed)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    // Check if event already captured
    const checkReady = () => {
      if ((window as any).deferredPrompt) {
        setCanInstall(true);
      }
    };
    checkReady();

    // Listen for notification from PwaInit
    document.addEventListener("pwa-install-ready", checkReady);
    return () => document.removeEventListener("pwa-install-ready", checkReady);
  }, []);

  const handleInstall = async () => {
    if (installed) return;

    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) {
      alert("Installation is not available. Ensure you are using HTTPS and the manifest is valid.");
      return;
    }

    // Trigger native installation dialog
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;

    if (outcome === "accepted") {
      setInstalled(true);
      setCanInstall(false);
    }

    // Clear event, wait for next trigger
    (window as any).deferredPrompt = null;
    setCanInstall(false);
  };

  if (installed || !canInstall) return null; // Hide when not installable or already installed

  return (
    <button
      onClick={handleInstall}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-[11px] sm:text-sm font-semibold rounded-lg shadow-sm transition-colors"
    >
      Install App
    </button>
  );
}