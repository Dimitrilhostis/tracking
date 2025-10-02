import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

/**
 * LoginPage — refined UI/UX
 * - Vérifie la session et redirige vers /tracking si connecté
 * - Connexion via OAuth Google
 * - Ajout état de chargement/erreur, micro-interactions et design plus moderne
 */
export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Si déjà connecté → redirige
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data?.session && mounted) {
          router.push("/tracking");
        }
      } catch (e) {
        console.error(e);
        setError("Impossible de vérifier la session.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  const handleLogin = async () => {
    try {
      setError("");
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
      if (error) throw error;
    } catch (e) {
      console.error(e);
      setError("Échec de la connexion Google.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--green2)]/10 to-[var(--blue2,#2563eb)]/10 p-6">
      <div className="w-full max-w-sm rounded-3xl border border-[var(--text3)]/20 bg-white p-8 shadow-xl">
        <h1 className="mb-3 text-center text-2xl font-semibold tracking-tight text-[var(--text1)]">
          Bienvenue sur <span className="text-[var(--green2)]">Smart Tracking</span>
        </h1>
        <p className="mb-6 text-center text-[var(--text3)]">
          Connecte-toi pour suivre ta journée
        </p>

        {error && (
          <p className="mb-4 text-center text-sm text-red-600">{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--blue2,#2563eb)] px-5 py-3 font-medium text-white shadow-sm transition hover:brightness-110 disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="h-5 w-5"
          >
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3C33.9 32.7 29.5 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11.1 0 19.6-8 19.6-20 0-1.3-.1-2.7-.4-3.9z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.5 16.1 18.9 14 24 14c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.6 29.6 4 24 4 16.5 4 9.9 8.1 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.4 0 10.4-1.8 14.3-4.9l-6.6-5.4C29.5 35.9 26.9 37 24 37c-5.4 0-9.9-3.4-11.6-8l-6.6 5.1C9.9 39.9 16.5 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.5 5.6-6.6 6.7l6.6 5.4C38.2 37.6 42 31.5 42 24c0-1.3-.1-2.7-.4-3.5z"
            />
          </svg>
          Se connecter avec Google
        </button>
      </div>
    </main>
  );
}
