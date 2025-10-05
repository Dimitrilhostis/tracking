"use client";

import { useEffect, useState } from "react";

export default function InstallButton() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 👉 Ce useEffect s'exécute dès le montage du composant
    const handler = (e) => {
      e.preventDefault(); // Empêche Chrome d'afficher le prompt auto
      console.log("📲 Événement beforeinstallprompt capté !");
      setPromptEvent(e);
    };

    const handleInstalled = () => {
      console.log("✅ Application installée !");
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []); // ✅ exécuté une seule fois au montage

  // si l'app est déjà installée ou pas encore prête → pas de bouton
  if (installed || !promptEvent) return null;

  return (
    <button
      onClick={() => {
        promptEvent.prompt();
      }}
      className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[var(--green2)] px-5 py-3 text-white shadow-lg hover:bg-[var(--green3)] transition-all"
    >
      Installer l’application
    </button>
  );
}
