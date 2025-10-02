"use client";

import { useEffect, useRef, useState } from "react"; // ⬅️ useRef ajouté
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import Card from "@/components/card";
import { Check } from "lucide-react";

export default function ActivitiesPage() {
  const router = useRouter();
  const [tab, setTab] = useState("daily");
  const [notif, setNotif] = useState(null); 

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Daily
  const [activities, setActivities] = useState([]);
  const [newAct, setNewAct] = useState({
    nom: "",
    heure: "",
    duree: "",
    description: "",
    type: "bool",   // 👈 par défaut bool
  });
    const [creatingAct, setCreatingAct] = useState(false);
    const durationSteps = [
      0, 1, 2, 3, 4, 5, 10, 15, 20, 30,          // minutes
      60, 120, 180, 240, 300, 360, 420, 480,     // heures (1 à 8 h)
      540, 600, 660, 720                          // heures (9 à 12 h)
    ];
    

  // Lists
  const [lists, setLists] = useState([]);
  const [newList, setNewList] = useState({
    titre: "",
    frequence: "never",
    options: [{ label: "", editing: true }], // ⬅️ commence avec 1 case
  });
  const [creatingList, setCreatingList] = useState(false);

  // ⬇️ Refs pour focus & scroll
  const optionRefs = useRef([]);             // ref de chaque input
  const optionsContainerRef = useRef(null);  // ref du conteneur scrollable
  const keepFocusIndexRef = useRef(null);    // index de la case où on continue d'écrire

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) return setError("Auth error");
      if (!data?.user) return router.push("/login");
      setUser(data.user); 
      await Promise.all([fetchActivities(data.user.id), fetchLists(data.user.id)]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (router.query.tab) {
      setTab(router.query.tab);
    }
  }, [router.query.tab]);

  useEffect(() => {
    if (notif) {
      const timer = setTimeout(() => setNotif(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notif]);
  

  async function fetchActivities(user_id) {
    const { data } = await supabase
      .from("activities")
      .select("id, nom, heure, duree, description")
      .eq("user_id", user_id)
      .order("heure", { ascending: true });
    setActivities(data || []);
  }

  async function fetchLists(user_id) {
    const { data } = await supabase
      .from("lists")
      .select("id, nom, frequence, options")
      .eq("user_id", user_id)
      .order("created_at", { ascending: true });
    setLists(data || []);
  }

  async function createActivity(e) {
    e.preventDefault();
    if (!newAct.nom.trim()) return;
    setCreatingAct(true);
    await supabase.from("activities").insert({
      user_id: user.id,
      nom: newAct.nom.trim(),
      heure: newAct.heure || null,
      duree: newAct.duree || 0, // en minutes
      description: newAct.description || null,
      type: newAct.type || "bool",
      checked: false,
      progress: 0,
    });
    
    
    setCreatingAct(false);
    setNewAct({ nom: "", heure: "", duree: "", description: "" });
    fetchActivities(user.id);
  }

  async function createList(e) {
    e.preventDefault();
    if (!newList.titre.trim()) return;
  
    setCreatingList(true);
  
    try {
      // 1. Créer la liste
      const { data: createdList, error: listError } = await supabase
        .from("lists")
        .insert({
          user_id: user.id,
          nom: newList.titre.trim(),
          frequence: newList.frequence,
        })
        .select()
        .single();
  
      if (listError) throw listError;
  
      // 2. Créer les options en list_items
      const optionLabels = newList.options
        .map((o) => o.label.trim())
        .filter((lbl) => lbl.length > 0);
  
      if (optionLabels.length > 0) {
        const { error: itemsError } = await supabase
          .from("list_items")
          .insert(
            optionLabels.map((lbl) => ({
              user_id: user.id,
              list_id: createdList.id,
              nom: lbl,
              checked: false,
            }))
          );
  
        if (itemsError) throw itemsError;
      }
  
      // 3. Reset formulaire + reload
      setNewList({ titre: "", frequence: "never", options: [{ label: "", editing: true }] });
      await fetchLists(user.id);
      
    } catch (err) {
      console.error("Erreur création liste:", err);
      setError("Impossible de créer la liste.");
    } finally {
      setCreatingList(false);
    }
  }
  

  async function createActivity(e) {
    e.preventDefault();
  
    if (!newAct.nom.trim()) {
      setNotif({ type: "error", msg: "Le titre est obligatoire." });
      return;
    }
  
    try {
      setCreatingAct(true);
      const { error } = await supabase.from("activities").insert({
        user_id: user.id,
        nom: newAct.nom.trim(),
        heure: newAct.heure || null,
        duree: newAct.duree || null,
        description: newAct.description || null,
        type: newAct.type || "bool",
        checked: false,
        progress: 0,
      });
  
      if (error) throw error;
  
      setNotif({ type: "success", msg: "Activité ajoutée !" });
      setNewAct({ nom: "", heure: "", duree: "", description: "", type: "bool" });
      fetchActivities(user.id);
  
    } catch (err) {
      setNotif({ type: "error", msg: err.message || "Erreur inconnue." });
    } finally {
      setCreatingAct(false);
    }
  }
  

  // ===== Options dynamiques (focus + scroll conservés) =====
  function handleOptionChange(value, index) {
    const opts = [...newList.options];
    opts[index].label = value;
    setNewList({ ...newList, options: opts });

    // ⚑ on se souvient de l'index où on tape pour re-focuser après re-render
    keepFocusIndexRef.current = index;

    // ➕ Dès le 1er caractère dans la DERNIÈRE case → on ajoute une nouvelle case vide
    if (index === opts.length - 1 && value.length === 1) {
      const updated = [...opts, { label: "", editing: true }];
      setNewList({ ...newList, options: updated });
    }
  }

  // ⬇️ Re-focus sur la case en cours ET scroll vers la nouvelle case quand la longueur change
  useEffect(() => {
    // re-focus sur l'input où on écrivait
    const i = keepFocusIndexRef.current;
    if (i != null) {
      // double rAF pour laisser React peindre le nouveau DOM
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          optionRefs.current[i]?.focus();
          keepFocusIndexRef.current = null;
        });
      });
    }
    // scroll vers le bas pour voir la/les nouvelle(s) case(s)
    if (optionsContainerRef.current) {
      optionsContainerRef.current.scrollTo({
        top: optionsContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [newList.options.length]);

  function handleOptionBlur(index) {
    // NE ferme que si la case a du contenu ET si on n'est pas revenu focus dessus
    setTimeout(() => {
      const el = optionRefs.current[index];
      // si on a retrouvé le focus (à cause d'un re-render), ne pas fermer
      if (document.activeElement === el) return;

      const val = newList.options[index]?.label ?? "";
      if (!val.trim()) return;

      const opts = [...newList.options];
      opts[index].editing = false;
      setNewList({ ...newList, options: opts });
    }, 0);
  }

  function handleOptionClick(index) {
    const opts = [...newList.options];
    opts[index].editing = true;
    setNewList({ ...newList, options: opts });
    keepFocusIndexRef.current = index;
  }
  // =========================================================

  function formatDuration(mins) {
    const n = Number(mins) || 0;
    if (n === 0) return "0 min";
    if (n < 60) return `${n} min`;
    return `${n / 60} h`;
  }

  function getDurationIndex(mins) {
    const n = Number(mins);
    const idx = durationSteps.indexOf(Number.isFinite(n) ? n : 0);
    return idx >= 0 ? idx : 0;
  }

  {notif && (
    <div
      className={`
        fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg 
        ${notif.type === "error" ? "bg-red-500 text-white" : ""}
        ${notif.type === "success" ? "bg-green-500 text-white" : ""}
        ${notif.type === "info" ? "bg-blue-500 text-white" : ""}
      `}
    >
      {notif.msg}
    </div>
  )}
  
  
  return (
<main
      className="relative mx-auto max-w-6xl px-6 py-8 h-[calc(100vh-4rem)] flex flex-col gap-6"
      style={{
        background: `
          linear-gradient(to bottom, rgba(30,30,30,0.9), rgba(30,30,30,0.6) 30%, rgba(30,30,30,0.9)),
          url('/images/hero-bg.jpg') center/cover no-repeat
        `,
      }}
    >      {/* Onglets centrés */}
      <header className="flex justify-center">
        <div className="flex gap-8 border-b border-[var(--text3)]/20">
          <button
            onClick={() => setTab("daily")}
            className={`pb-3 px-2 text-sm sm:text-base transition ${
              tab === "daily"
                ? "text-[var(--text1)] border-b-2 border-[var(--green2)]"
                : "text-[var(--text3)] hover:text-[var(--text2)]"
            }`}
          >
            Activités
          </button>
          <button
            onClick={() => setTab("lists")}
            className={`pb-3 px-2 text-sm sm:text-base transition ${
              tab === "lists"
                ? "text-[var(--text1)] border-b-2 border-[var(--green2)]"
                : "text-[var(--text3)] hover:text-[var(--text2)]"
            }`}
          >
            Listes
          </button>
        </div>
      </header>

      {error && <p className="text-red-500 text-center">{error}</p>}

      {/* === Onglet Activités === */}
      {tab === "daily" && (
       <section className="space-y-6">
       <div className="rounded-2xl border border-[var(--text3)]/20 bg-[var(--details-dark)]/80 backdrop-blur-md p-6 shadow-md">
         <h2 className="mb-4 text-lg font-serif text-[var(--text1)] text-center">Nouvelle activité</h2>
     
         <form onSubmit={createActivity} className="grid gap-3">
           {/* Titre */}
           <input
             value={newAct.nom}
             onChange={(e) => setNewAct({ ...newAct, nom: e.target.value })}
             placeholder="Titre"
             className="h-11 rounded-lg border border-[var(--text3)]/30 bg-transparent px-3 text-[var(--text1)]"
             required
           />
     
           {/* Ligne: Heure + Type */}
           <div className="grid grid-cols-2 gap-3">
             <input
               type="time"
               value={newAct.heure || ""}
               onChange={(e) => setNewAct({ ...newAct, heure: e.target.value })}
               className="h-11 rounded-lg border border-[var(--text3)]/30 bg-transparent px-3 text-[var(--text1)]"
             />
     
             <select
               value={newAct.type ?? "bool"}
               onChange={(e) => setNewAct({ ...newAct, type: e.target.value })}
               className="h-11 rounded-lg border border-[var(--text3)]/30 bg-transparent px-3 text-[var(--text3)]"
             >
               <option value="bool">À checker</option>
               <option value="time">Avec durée</option>
             </select>
     
             {/* Durée -> seulement si type = time. Pleine largeur => col-span-2 */}
             { (newAct.type ?? "bool") === "time" && (
               <div className="col-span-2 flex flex-col gap-2 w-full">
                 <input
                   type="range"
                   min="0"
                   max={durationSteps.length - 1}
                   step="1"
                   value={getDurationIndex(newAct.duree)}
                   onChange={(e) => {
                     const idx = parseInt(e.target.value, 10);
                     const mins = durationSteps[idx] ?? 0;
                     setNewAct({ ...newAct, duree: mins });
                   }}
                   className="w-full h-2 rounded-lg cursor-pointer accent-[var(--green2)]"
                   aria-label="Durée"
                 />
                 <div className="text-sm font-medium text-[var(--text1)] text-center">
                   {formatDuration(newAct.duree)}
                 </div>
               </div>
             )}
           </div>
     
           {/* Description */}
           <textarea
             value={newAct.description || ""}
             onChange={(e) => setNewAct({ ...newAct, description: e.target.value })}
             placeholder="Description"
             className="min-h-[80px] rounded-lg border border-[var(--text3)]/30 bg-transparent px-3 py-2 text-[var(--text1)]"
           />
     
           {/* Submit */}
           <button
             type="submit"
             disabled={creatingAct}
             className="h-11 flex items-center justify-center gap-2 rounded-lg 
                        bg-[var(--green2)] text-white shadow-md hover:shadow-lg active:scale-95 transition"
           >
             <Check size={18} /> {creatingAct ? "Ajout…" : "Valider"}
           </button>
         </form>
       </div>
     </section>
     
      )}

      {/* === Onglet Listes === */}
      {tab === "lists" && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-[var(--text3)]/20 bg-[var(--details-dark)]/80 backdrop-blur-md p-6 shadow-md">
            <h2 className="mb-4 text-lg font-serif text-[var(--text1)] text-center">Nouvelle liste</h2>
            <form onSubmit={createList} className="grid gap-4">
              <input
                value={newList.titre}
                onChange={(e) => setNewList({ ...newList, titre: e.target.value })}
                placeholder="Titre de la liste"
                className="h-11 rounded-lg border border-[var(--text3)]/30 bg-transparent px-3 text-[var(--text1)]"
                required
              />
              <select
                value={newList.frequence}
                onChange={(e) => setNewList({ ...newList, frequence: e.target.value })}
                className="h-11 rounded-lg border border-[var(--text3)]/30 bg-transparent px-3 text-[var(--text3)]"
              >
                <option value="never">Jamais</option>
                <option value="days">Tous les jours</option>
                <option value="weeks">Toutes les semaines</option>
              </select>

              {/* === OPTIONS en 2 colonnes + scroll + auto-scroll + focus conservé === */}
              <div
                ref={optionsContainerRef}
                className="grid grid-cols-2 gap-2 max-h-[22rem] overflow-y-auto pr-1"
              >
                {newList.options.map((opt, i) =>
                  opt.editing ? (
                    <input
                      key={i}
                      ref={(el) => (optionRefs.current[i] = el)}
                      type="text"
                      value={opt.label}
                      onChange={(e) => handleOptionChange(e.target.value, i)}
                      onBlur={() => handleOptionBlur(i)}
                      placeholder="Ajouter une option"
                      className="h-11 w-full rounded-lg border border-[var(--text3)]/30 
                                 bg-transparent px-3 text-[var(--text1)] placeholder-[var(--text3)] italic"
                    />
                  ) : (
                    <div
                      key={i}
                      onClick={() => handleOptionClick(i)}
                      className="h-11 w-full flex items-center justify-center rounded-lg 
                                 border border-[var(--text3)]/30 bg-[var(--details-dark)] 
                                 text-[var(--text1)] font-medium cursor-pointer"
                    >
                      {opt.label ? opt.label[0].toUpperCase() : "?"}
                    </div>
                  )
                )}
              </div>
              {/* ================================================================ */}

              <button
                type="submit"
                disabled={creatingList}
                className="h-11 flex items-center justify-center gap-2 rounded-lg 
                           bg-[var(--green2)] text-white shadow-md hover:shadow-lg active:scale-95 transition"
              >
                <Check size={18} /> {creatingList ? "Ajout…" : "Valider"}
              </button>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}
