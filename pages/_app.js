import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/navbar";

export default function MyApp({ Component, pageProps }) {
  const [logs, setLogs] = useState([]);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  const addLog = (msg) => {
    setLogs((prev) => [...prev, msg]);
  };

  useEffect(() => {
    addLog("🟢 PWA debug actif");

    // Vérifier manifest
    fetch("/manifest.json")
      .then((res) => res.json())
      .then((data) => addLog("📄 Manifest OK: " + data.start_url))
      .catch((err) => addLog("❌ Manifest error"));

    // Vérifier SW
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        addLog("⚙️ Service Workers actifs: " + regs.length);
      });
    }

    // Écouter beforeinstallprompt
    const handler = (e) => {
      addLog("📲 beforeinstallprompt déclenché !");
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    addLog("Résultat installation: " + outcome);
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--text1)]">
      <NavBar />
      <main className="flex-1">
        <Component {...pageProps} />
      </main>

      {/* Bouton Installer */}
      {showInstall && (
        <button
          onClick={handleInstall}
          className="fixed bottom-4 right-4 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg"
        >
          📲 Installer l’app
        </button>
      )}

      {/* Debug visible */}
      <div className="fixed bottom-0 left-0 right-0 bg-black text-green-400 text-xs p-2 max-h-40 overflow-y-auto">
        {logs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}
