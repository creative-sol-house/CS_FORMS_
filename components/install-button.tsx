"use client";
import { useEffect, useState } from "react";

export default function InstallButton() {
  const [canInstall, setCanInstall] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setCanInstall(!!window.__installPrompt);

    const update = () => setCanInstall(!!window.__installPrompt);
    window.addEventListener("install-ready", update);
    return () => window.removeEventListener("install-ready", update);
  }, []);

  const handleInstall = async () => {
    const promptEvent = window.__installPrompt;
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    window.__installPrompt = null;
    setCanInstall(false);
  };

  // Already running as the installed app: hide the button
  if (isInstalled) return null;

  // Android / desktop Chrome & Edge
  if (canInstall) {
    return (
      <button
        onClick={handleInstall}
        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
      >
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" />
</svg>
 App
      </button>
    );
  }

  // iPhone / iPad: manual steps
  if (isIos) {
    return (
      <div>
        <button
          onClick={() => setShowIosHelp((v) => !v)}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Install App
        </button>
        {showIosHelp && (
          <p className="mt-2 max-w-xs text-sm text-neutral-600">
            In Safari, tap the <strong>Share</strong> button, then{" "}
            <strong>Add to Home Screen</strong>.
          </p>
        )}
      </div>
    );
  }

  return null;
}