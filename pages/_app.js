// pages/_app.js
import "@/styles/globals.css";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/navbar";
import InstallButton from "@/components/install_button";
import InstallPromptProvider from "@/components/install_button";

export default function MyApp({ Component, pageProps }) {
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
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--text1)]">
      {/* Navigation globale */}
      <NavBar />

      {/* Contenu principal */}
      <main className="flex-1">
        <Component {...pageProps} />
        <InstallPromptProvider />
      </main>
    </div>
  );
}
