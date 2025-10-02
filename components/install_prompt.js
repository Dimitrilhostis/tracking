"use client";
import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Empêche Chrome d'afficher son popup par défaut
      e.preventDefault();
      // Sauvegarde l’événement
      setDeferredPrompt(e);
      // Affiche ton bouton
      setShowButton(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Lance le prompt officiel
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    console.log("Résultat de l’installation :", outcome);

    // Cache ton bouton une fois utilisé
    setShowButton(false);
    setDeferredPrompt(null);
  };

  return (
    <>
      {showButton && (
        <button
          onClick={handleInstall}
          className="fixed bottom-4 right-4 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg"
        >
          📲 Installer l’app
        </button>
      )}
    </>
  );
}
