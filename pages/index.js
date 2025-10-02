import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/tracking");
      } else {
        router.push("/login");
      }
    };

    checkSession();
  }, []);

  return null; // Pas besoin d'afficher quoi que ce soit ici
}
