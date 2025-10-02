"use client";

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

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
    <main className="flex min-h-screen items-center justify-center 
                     bg-[var(--details-dark)]/90 backdrop-blur">
      <div className="w-full max-w-sm rounded-3xl border border-[var(--text3)]/20 
                      bg-[var(--details-dark)] p-8 shadow-2xl">
        
        {/* --- Header --- */}
        <h1 className="mb-2 text-center text-2xl font-semibold tracking-tight text-[var(--text1)]">
          Bienvenue sur <span className="text-[var(--green2)]">The Smart Way</span>
        </h1>
        <p className="mb-6 text-center text-sm text-[var(--text2)]">
          Connecte-toi pour suivre ta journée
        </p>

        {/* --- Error --- */}
        {error && (
          <p className="mb-4 text-center text-sm text-red-500">{error}</p>
        )}

        {/* --- Bouton Google --- */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 
                     rounded-xl bg-[var(--green2)] px-5 py-3 
                     font-medium text-white shadow-lg 
                     transition hover:brightness-110 active:scale-[0.98] 
                     disabled:opacity-50"
        >
          {/* Logo Google */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3...z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8...z" />
            <path fill="#4CAF50" d="M24 44c5.4 0...z" />
            <path fill="#1976D2" d="M43.6 20.5H42...z" />
          </svg>
          Connexion Google
        </button>

        {/* --- Micro-footer --- */}
        <p className="mt-6 text-center text-xs text-[var(--text3)]">
          Tes données sont sécurisées par Supabase
        </p>
      </div>
    </main>
  );
}
