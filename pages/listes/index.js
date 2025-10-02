"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import { useRef } from "react";

export default function ListsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lists, setLists] = useState([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) return setError("Auth error");
      if (!data.user) return router.push("/login");
      setUser(data.user);
      await fetchLists(data.user.id);
      setLoading(false);
    })();
  }, [router]);

  async function fetchLists(user_id) {
    const { data, error } = await supabase
      .from("lists")
      .select("id, nom, created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      setError("Impossible de charger les listes.");
      return;
    }
    setLists(data || []);
  }

  return (
<main
      className="relative mx-auto max-w-6xl px-6 py-8 h-[calc(100vh-4rem)] flex flex-col gap-6"
      style={{
        background: `
          linear-gradient(to bottom, rgba(30,30,30,0.9), rgba(30,30,30,0.6) 30%, rgba(30,30,30,0.9)),
          url('/images/hero-bg.jpg') center/cover no-repeat
        `,
      }}
    >      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-serif tracking-wide text-[var(--text1)]">
          Mes listes
        </h1>
        <button
          onClick={() => router.push("/create?tab=lists")}
          className="h-10 w-10 flex items-center justify-center rounded-full 
                     bg-gradient-to-r from-[var(--premium-dark)] to-[var(--premium)] 
                     text-[var(--background)] shadow-md hover:shadow-lg 
                     active:scale-90 transition"
          title="Créer une nouvelle liste"
        >
          <Plus size={18} />
        </button>
      </header>

      {/* Contenu */}
{loading ? (
  <p className="text-[var(--text3)]">Chargement…</p>
) : lists.length === 0 ? (
  <p className="text-[var(--text3)]">Aucune liste pour l’instant.</p>
) : (
  <div className="flex-1 overflow-y-auto pr-1">
  <ul className="grid grid-cols-2 gap-4">
    {lists.map((list) => (
      <ListCard key={list.id} list={list} setLists={setLists} />

    ))}
  </ul>
</div>

)}

    </main>
  );
}




function ListCard({ list, setLists }) {
  const router = useRouter();
  const controls = useAnimation();   // 👈 propre à cette carte
  const [pressing, setPressing] = useState(false);
  const timerRef = useRef(null);

  async function handleDelete() {
    const confirmDel = window.confirm("Supprimer cette liste ?");
    if (confirmDel) {
      await supabase.from("lists").delete().eq("id", list.id);
      setLists((prev) => prev.filter((l) => l.id !== list.id));
    } else {
      controls.start({ scale: 1, borderRadius: "1rem" });
    }
  }

  function startPress() {
    setPressing(true);
    controls.start({
      scale: 0.1,
      borderRadius: "9999px",
      transition: { duration: 1.2, ease: "linear" },
    });
    timerRef.current = setTimeout(() => {
      handleDelete();
    }, 1200);
  }

  function cancelPress() {
    setPressing(false);
    clearTimeout(timerRef.current);
    controls.start({ scale: 1, borderRadius: "1rem", transition: { duration: 0.3 } });
  }

  return (
    <motion.li
      key={list.id}
      animate={controls}
      initial={{ scale: 1, borderRadius: "1rem" }}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onClick={() => {
        if (!pressing) router.push(`/listes/${list.id}`);
      }}
      className="h-40 flex items-center justify-center cursor-pointer
                 rounded-2xl border border-[var(--premium)]/20 bg-[var(--details-dark)]/80 
                 shadow-md hover:shadow-lg hover:-translate-y-1 active:scale-95 transition-all"
    >
      <h3 className="text-lg font-medium text-[var(--text1)] truncate px-2 text-center">
        {list.nom}
      </h3>
    </motion.li>
  );
}