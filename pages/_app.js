// pages/_app.js
import "@/styles/globals.css";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/navbar";

export default function MyApp({ Component, pageProps }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    async function ensureUserSettings() {
      try {
        const { data: userData, error: authErr } = await supabase.auth.getUser();
        if (authErr) {
          console.warn("⚠️ Auth error:", authErr.message);
          return;
        }

        const user = userData?.user;
        if (!user) return;

        const { data, error } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("⚠️ Error fetching settings:", error.message);
          return;
        }

        if (!data) {
          await supabase.from("user_settings").insert({
            user_id: user.id,
            end_hour: 4, // 4h par défaut
          });
          console.log("✨ Paramètres utilisateur créés pour", user.email);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    }

    ensureUserSettings();

    // 👉 Enregistrement du Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then(() => console.log("✅ Service Worker enregistré"))
        .catch((err) => console.error("❌ SW registration failed", err));
    }

    // 👉 Gestion du prompt d'installation
    const handler = (e) => {
      e.preventDefault(); // empêche Chrome d’ouvrir le prompt automatiquement
      setDeferredPrompt(e); // on garde l’événement
      setShowInstall(true); // on affiche notre bouton custom
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // Quand l’utilisateur clique sur le bouton Installer
  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("Résultat de l’installation :", outcome);

    setDeferredPrompt(null);
    setShowInstall(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--text1)]">
      {/* Navigation globale */}
      <NavBar />

      {/* Contenu principal */}
      <main className="flex-1">
        <Component {...pageProps} />
      </main>

      {/* Bouton Installer l'app */}
      {showInstall && (
        <button
          onClick={handleInstall}
          className="fixed bottom-4 right-4 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg"
        >
          📲 Installer l’app
        </button>
      )}
    </div>
  );
}
