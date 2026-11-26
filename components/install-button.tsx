"use client";
import { useEffect, useState } from "react";

// Change this to your app's name if you want it in the label, e.g. "Install CRM"
const BUTTON_LABEL = "Install App";

const pillClass =
  "shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold rounded-full shadow-sm active:scale-95 transition whitespace-nowrap";

function DownloadIcon() {
  return (
    <svg
      className="w-4 h-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4"
      />
    </svg>
  );
}

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
      <button onClick={handleInstall} className={pillClass}>
        <DownloadIcon />
        {BUTTON_LABEL}
      </button>
    );
  }

  // iPhone / iPad: manual steps
  if (isIos) {
    return (
      <>
        <button onClick={() => setShowIosHelp((v) => !v)} className={pillClass}>
          <DownloadIcon />
          {BUTTON_LABEL}
        </button>

        {showIosHelp && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] max-w-xs rounded-2xl bg-white border border-stone-200 shadow-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-stone-700">
                In Safari, tap the <strong>Share</strong> button, then{" "}
                <strong>Add to Home Screen</strong>.
              </p>
              <button
                onClick={() => setShowIosHelp(false)}
                aria-label="Close"
                className="text-stone-400 hover:text-stone-700 text-lg leading-none"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}