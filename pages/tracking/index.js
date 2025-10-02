"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import Link from "next/link";
import Card from "@/components/card";
import { Lock, Unlock, Plus } from "lucide-react"; // icônes sobres

export default function TrackingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activities, setActivities] = useState([]);
  const [locked, setLocked] = useState(false);
  const [lists, setLists] = useState([]);
  const [seeAllLists, setSeeAllLists] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        const u = data?.user;
        if (!u) {
          router.push("/login");
          return;
        }
        if (!mounted) return;
        setUser(u);
        await Promise.all([fetchDay(u.id), fetchLists(u.id)]);
      } catch (e) {
        console.error(e);
        setError("Impossible de charger la journée.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [router, today]);

  async function fetchLists(user_id) {
    const { data, error } = await supabase
      .from("lists")
      .select("id, nom, frequence, options")
      .eq("user_id", user_id)
      .order("created_at", { ascending: true });
  
    if (error) {
      console.error("Erreur fetchLists:", error.message);
      return [];
    }
    setLists(data || []);
  }

  async function fetchDay(user_id) {
    // 1) Activités (schema mis à jour)
    const { data: acts } = await supabase
      .from("activities")
      .select("id, nom, heure, duree, description, type, progress")
      .eq("user_id", user_id)
      .order("heure", { ascending: true });

    // 2) Tracking du jour pour les bool
    const { data: rows } = await supabase
      .from("tracking")
      .select("id, activity_id, checked, locked, date")
      .eq("user_id", user_id)
      .eq("date", today);

    const byAct = new Map();
    let dayLocked = false;
    (rows || []).forEach((r) => {
      byAct.set(r.activity_id, { id: r.id, checked: !!r.checked });
      if (r.locked) dayLocked = true;
    });

    const merged = (acts || []).map((a) => ({
      id: a.id,
      type: a.type || "bool",
      nom: a.nom ?? "(Sans nom)",
      heure: a.heure ?? "",
      duree: a.duree ?? 0,
      description: a.description ?? "",
      progress: a.progress ?? 0,
      checked: byAct.get(a.id)?.checked ?? false, // ← bool du jour
      trackingId: byAct.get(a.id)?.id ?? null,
    }));

    setActivities(merged);
    setLocked(dayLocked);
  }

  async function toggleCheck(activityId) {
    if (locked || !user) return;

    // Optimistic UI
    setActivities((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, checked: !a.checked } : a))
    );

    const { data: existing } = await supabase
      .from("tracking")
      .select("id, checked")
      .eq("user_id", user.id)
      .eq("date", today)
      .eq("activity_id", activityId)
      .maybeSingle();

    const newChecked = !(existing?.checked);
    if (existing?.id) {
      await supabase.from("tracking")
        .update({ checked: newChecked })
        .eq("id", existing.id);
    } else {
      const { error } = await supabase.from("tracking").insert({
        user_id: user.id,
        activity_id: activityId,
        date: today, // "YYYY-MM-DD"
        checked: true,
        locked: false,
      });
      
      if (error) {
        console.error("Supabase insert error:", error.message, error.details, error.hint);
      }
         
    }
  }

  async function handleLock() {
    if (user) {
      await supabase.from("tracking").update({ locked: true }).eq("user_id", user.id).eq("date", today);
      setLocked(true);
    }
  }
  async function handleUnlock() {
    if (user) {
      await supabase.from("tracking").update({ locked: false }).eq("user_id", user.id).eq("date", today);
      setLocked(false);
    }
  }

  const Loading = () => (
    <div className="animate-pulse space-y-3">
      <div className="h-7 w-40 rounded bg-[var(--light-dark)]/40" />
      <div className="h-10 rounded-2xl bg-[var(--light-dark)]/40" />
      <div className="h-24 rounded-2xl bg-[var(--light-dark)]/40" />
    </div>
  );

  return (
    <main
      className="relative mx-auto max-w-6xl px-6 py-8 h-[calc(100vh-4rem)] flex flex-col gap-6"
      style={{
        background: `
          linear-gradient(to bottom, rgba(30,30,30,0.9), rgba(30,30,30,0.6) 30%, rgba(30,30,30,0.9)),
          url('/images/hero-bg.jpg') center/cover no-repeat
        `,
      }}
    >
      {/* Panel suivi */}
      <section className={`${isMobile ? "flex-1" : "flex-1 basis-2/3"} rounded-3xl border border-[var(--premium)]/20 bg-[var(--details-dark)]/70 backdrop-blur-md p-6 shadow-xl`}>
      <header className="flex items-center justify-between mb-6">
  <h2 className="text-lg sm:text-2xl font-serif tracking-wide text-[var(--text1)]">
    Suivi de la journée
  </h2>
  <div className="flex gap-3">
    {!locked ? (
      <button
        onClick={handleLock}
        className="h-10 w-10 flex items-center justify-center rounded-full 
                   bg-gradient-to-r from-[var(--premium-dark)] to-[var(--premium)] 
                   text-[var(--background)] shadow-md hover:shadow-lg 
                   active:scale-90 transition"
        title="Verrouiller la journée"
      >
        <Lock size={18} />
      </button>
    ) : (
      <button
        onClick={handleUnlock}
        className="h-10 w-10 flex items-center justify-center rounded-full 
                   bg-gradient-to-r from-[var(--premium-light)] to-[var(--premium)] 
                   text-[var(--background)] shadow-md hover:shadow-lg 
                   active:scale-90 transition"
        title="Déverrouiller la journée"
      >
        <Unlock size={18} />
      </button>
    )}
    <button
      onClick={() => router.push("/create")}
      className="h-10 w-10 flex items-center justify-center rounded-full 
                 bg-[var(--green2)]/90 text-white shadow-md hover:shadow-lg 
                 active:scale-90 transition"
      title="Nouvelle activité"
    >
      <Plus size={18} />
    </button>
  </div>
</header>


<div className="flex-1 overflow-y-auto scrollbox">
          {loading ? (
            <Loading />
          ) : activities.length === 0 ? (
            <p className="text-[var(--text3)]">
              Aucune activité aujourd’hui. <Link href="/create" className="underline hover:text-[var(--green2)]">Ajoute-en</Link>.
            </p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-stretch">
              {activities.map((act) => (
                <Card
                  key={act.id}
                  id={act.id}
                  type={act.type}
                  nom={act.nom}
                  heure={act.heure}
                  duree={act.duree}
                  description={act.description}
                  checked={act.checked}
                  progress={act.progress}
                  locked={locked}
                  className="max-w-[135px] max-h-[135px] mx-auto"
                  // toggle bool (tracking)
                  onToggle={toggleCheck}
                  // update activity (ex: progress, nom, etc.)
                  onUpdate={async (id, updates, opts = {}) => {
                    setActivities(prev =>
                      prev.map(a => (a.id === id ? { ...a, ...updates } : a))
                    );
                    if (!opts.localOnly) {
                      await supabase.from("activities").update(updates).eq("id", id);
                    }
                  }}
                  
                  onDelete={async (id) => {
                    await supabase.from("activities").delete().eq("id", id);
                    fetchDay(user.id);
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}