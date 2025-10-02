"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import ListItemCard from "@/components/list_item_card";
import ValidatedDrawer from "@/components/validated_drawer"; // 👈 on crée ce composant

export default function ListePage() {
  const router = useRouter();
  const params = useParams();
  const uuid = params?.uuid;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [list, setList] = useState(null);

  const [items, setItems] = useState([]);       
  const [validated, setValidated] = useState([]); 

  const [adding, setAdding] = useState(false);
  const [newNom, setNewNom] = useState("");
  const inputRef = useRef(null);

  // --- Auth + données
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
        await fetchList(u.id);
        await fetchItems(u.id);
      } catch (e) {
        console.error(e);
        setError("Impossible de charger la liste.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [uuid]);

  async function fetchList(user_id) {
    const { data, error } = await supabase
      .from("lists")
      .select("id, nom")
      .eq("user_id", user_id)
      .eq("id", uuid)
      .single();

    if (error) {
      console.error("Erreur fetch list:", error);
      setError("Impossible de charger cette liste.");
      return;
    }
    setList(data);
  }

  async function fetchItems(user_id) {
    const { data, error } = await supabase
      .from("list_items")
      .select("id, nom, description, checked")
      .eq("user_id", user_id)
      .eq("list_id", uuid)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erreur fetch list items:", error);
      return;
    }
    const all = data || [];
    setItems(all.filter(i => !i.checked));
    setValidated(all.filter(i => i.checked));
  }

  // --- Création inline
  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus();
  }, [adding]);

  async function createItem() {
    if (!newNom.trim()) { setAdding(false); return; }

    const { data, error } = await supabase
      .from("list_items")
      .insert({
        user_id: user.id,
        list_id: uuid,
        nom: newNom.trim(),
        checked: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Erreur création item:", error);
      return;
    }

    setItems(prev => [...prev, data]);
    setNewNom("");
    setAdding(false);
  }

  // --- Swipe actions
  async function validateItem(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    setItems(prev => prev.filter(i => i.id !== id));
    setValidated(prev => [{ ...item, checked: true }, ...prev]); 
    await supabase.from("list_items").update({ checked: true }).eq("id", id);
  }

  async function deleteItem(id) {
    const inItems = items.find(i => i.id === id);
    if (inItems) setItems(prev => prev.filter(i => i.id !== id));
    const inValidated = validated.find(i => i.id === id);
    if (inValidated) setValidated(prev => prev.filter(i => i.id !== id));
    await supabase.from("list_items").delete().eq("id", id);
  }

  const Loading = () => (
    <div className="animate-pulse space-y-3">
      <div className="h-7 w-40 rounded bg-black/10" />
      <div className="h-10 rounded-2xl bg-black/10" />
      <div className="h-24 rounded-2xl bg-black/10" />
    </div>
  );

  return (
    <main className="mx-auto max-w-3xl p-6 pb-40">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <Link
          href="/listes"
          className="h-10 w-10 flex items-center justify-center rounded-xl 
                     border border-[var(--text3)]/20 bg-[var(--details-dark)]/60 
                     hover:bg-[var(--details-dark)]/90 transition"
        >
          <ArrowLeft size={18} className="text-[var(--text2)]" />
        </Link>

        <h1 className="flex-1 text-center text-xl sm:text-2xl font-medium tracking-tight text-[var(--text1)]">
          {list?.nom || "Liste"}
        </h1>

        <button
          onClick={() => setAdding(true)}
          className="h-10 w-10 flex items-center justify-center rounded-full 
                     bg-gradient-to-r from-[var(--premium-dark)] to-[var(--premium)] 
                     text-[var(--background)] shadow-md hover:shadow-lg 
                     active:scale-90 transition"
          title="Nouvel item"
        >
          <Plus size={18} />
        </button>
      </header>

      {/* Contenu */}
      {loading ? (
        <Loading />
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {items.map((item) => (
            <ListItemCard
              key={item.id}
              id={item.id}
              nom={item.nom}
              checked={false}
              onDelete={deleteItem}
              onValidate={validateItem}
            />
          ))}

          {adding && (
            <li className="px-4 py-3 rounded-2xl border border-[var(--text3)]/20 bg-[var(--details-dark)]/70">
              <input
                ref={inputRef}
                value={newNom}
                onChange={(e) => setNewNom(e.target.value)}
                onBlur={createItem}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createItem();
                  if (e.key === "Escape") { setAdding(false); setNewNom(""); }
                }}
                placeholder="Nouvel item…"
                className="w-full bg-transparent outline-none text-[var(--text1)]"
              />
            </li>
          )}
        </ul>
      )}

      {/* Drawer validés */}
      <ValidatedDrawer validated={validated} deleteItem={deleteItem} />
    </main>
  );
}
