"use client";

import { useEffect, useState } from "react";

export default function InstallPromptProvider() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setPromptEvent(e);
      setVisible(true);
      console.log("📲 beforeinstallprompt détecté !");
    };

    const handleInstalled = () => {
      setInstalled(true);
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  // ✅ iOS (Safari / Chrome iPhone)
  if (isIOS && !installed) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-[var(--details-dark)] text-[var(--text2)] p-3 rounded-xl text-sm shadow-xl max-w-xs animate-fadeIn">
        📱 Pour installer l’app, appuie sur <b>Partager</b> → <b>Sur l’écran d’accueil</b>.
      </div>
    );
  }

  // ✅ Android / Desktop
  if (!visible || installed || !promptEvent) return null;

  return (
    <button
      onClick={() => {
        promptEvent.prompt();
        setVisible(false);
      }}
      className="fixed bottom-6 right-6 z-50 bg-[var(--green2)] text-white rounded-2xl px-5 py-3 shadow-lg hover:bg-[var(--green3)] transition-all animate-slideIn"
    >
      Installer l’application
    </button>
  );
}
