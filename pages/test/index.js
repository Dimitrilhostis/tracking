"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function TestUserSettings() {
  const [userId, setUserId] = useState(null);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSettings() {
      // Étape 1 : récupérer l'utilisateur
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        setError("Erreur auth : " + userError.message);
        return;
      }

      const uid = userData?.user?.id;
      setUserId(uid);
      console.log("👤 Utilisateur :", uid);

      // Étape 2 : test user_settings
      const { data, error } = await supabase
        .rpc("get_user_settings", { user_id: uid });

        // .select("*")
        // .eq("user_id", uid)
        // .single();

      console.log("📦 Résultat user_settings :", { data, error });

      if (error) {
        setError("Erreur Supabase : " + error.message);
      } else {
        setSettings(data);
      }
    }

    fetchSettings();
  }, []);

  return (
    <main className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">🔍 Test `user_settings`</h1>

      {error && <p className="text-red-500">❌ {error}</p>}

      <div className="mt-4">
        <p><strong>🆔 User ID :</strong> {userId || "Chargement..."}</p>
        <p><strong>⏰ Paramètres :</strong></p>
        {settings ? (
          <pre className="bg-zinc-800 p-4 rounded-lg mt-2">
            {JSON.stringify(settings, null, 2)}
          </pre>
        ) : !error ? (
          <p className="text-yellow-400 mt-2">Chargement des paramètres...</p>
        ) : null}
      </div>
    </main>
  );
}
