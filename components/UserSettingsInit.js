"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function UserSettingsInit() {
  useEffect(() => {
    async function ensureUserSettings() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!data) {
        await supabase.from("user_settings").insert({
          user_id: user.id,
          end_hour: 0, // par défaut à minuit
        });
        console.log("✨ Paramètres utilisateur créés");
      }
    }

    ensureUserSettings();
  }, []);

  return null; // Pas besoin d'afficher quoi que ce soit
}
