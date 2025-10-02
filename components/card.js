"use client";

import { useState, useMemo } from "react";
import { MoreVertical } from "lucide-react";
import { useRef, useEffect } from "react";

export default function Card({
  id,
  type = "bool",          // "bool" | "time"
  nom,
  heure,
  duree = 0,              // minutes
  description,
  checked = false,        // pour "bool" (état du jour depuis tracking)
  progress = 0,           // minutes déjà faits (stockés dans activities, sauf si tu gères ça ailleurs)
  locked = false,
  onToggle,               // ← toggle bool (géré par la page via la table tracking)
  onUpdate,               // ← MAJ directe de activities (ex: progress, nom, etc.)
  onDelete,
  className = "",   // 👈 ajouter ça
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ nom, heure, duree, description, type });
  const menuRef = useRef(null);

  const isCompleted = useMemo(() => {
    return type === "bool" ? !!checked : (duree || 0) > 0 && (progress || 0) >= duree;
  }, [type, checked, progress, duree]);

  const borderClass = locked
  ? isCompleted
    ? "border-[var(--green2)] bg-[var(--green2)]/10"
    : "border-red-500/50 bg-red-500/5"
  : isCompleted
    ? "border-[var(--green2)] bg-[var(--details-dark)]/60"
    : "border-[var(--text3)]/20 bg-[var(--details-dark)]/40";

    useEffect(() => {
      function handleClickOutside(e) {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
          setMenuOpen(false);
        }
      }
      if (menuOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen]);

    const [menuSide, setMenuSide] = useState("right");

    function toggleMenu(e) {
      const rect = e.currentTarget.getBoundingClientRect();
      const side = rect.left < window.innerWidth / 2 ? "left" : "right";
      setMenuSide(side);
      setMenuOpen((v) => !v);
    }


  function handleCardClick() {
    if (locked) return;
    if (type === "bool" && typeof onToggle === "function") {
      onToggle(id); // ← délègue à la page: met à jour "tracking" du jour
    }
    // si "time", on ne toggle pas au clic : on utilise le slider uniquement
  }

  function handleProgressChange(e) {
    if (locked || type !== "time") return;
    const next = Math.max(0, Math.min(parseInt(e.target.value, 10) || 0, duree || 0));
    // MAJ instantanée en local
    if (onUpdate) onUpdate(id, { progress: next }, { localOnly: true });
  }
  
  function handleProgressCommit(e) {
    if (locked || type !== "time") return;
    const next = Math.max(0, Math.min(parseInt(e.target.value, 10) || 0, duree || 0));
    // MAJ distante (DB)
    if (onUpdate) onUpdate(id, { progress: next }, { localOnly: false });
  }
  

  function fmtMins(m) {
    const n = Number(m) || 0;
    if (n < 60) return `${n} min`;
    return `${Math.floor(n / 60)} h${n % 60 ? ` ${n % 60} min` : ""}`;
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (typeof onUpdate === "function") {
      await onUpdate(id, {
        nom: form.nom,
        heure: form.heure,
        duree: Number.isFinite(+form.duree) ? +form.duree : 0,
        description: form.description,
        type: form.type,
      });
    }
    setEditOpen(false);
  }

  return (
    <>
      <li
        onClick={handleCardClick}
        className={`relative aspect-square flex flex-col justify-between 
          rounded-2xl border p-3 shadow-sm transition cursor-pointer ${borderClass} ${className}`}      >
        {/* Titre + menu */}
        <div className="flex items-start justify-between">
          <div className="font-semibold text-[var(--text1)] m-1 text-sm leading-tight line-clamp-2">
            {nom || "Sans titre"}
          </div>

          <div className="relative">
            <button
              onClick={toggleMenu}
              className="p-1 rounded hover:bg-black/20 transition"
              disabled={locked}
            >
              <MoreVertical size={16} className="text-[var(--text2)]" />
            </button>

            {menuOpen && (
              <div
              ref={menuRef}
              className={`absolute mt-1 w-36 rounded-xl border border-[var(--text3)]/20 
                          bg-[var(--details-dark)] shadow-lg z-20 
                          ${menuSide === "left" ? "left-0" : "right-0"}`}
            >
              <button
                  onClick={() => {
                    setEditOpen(true);
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm text-[var(--text1)] hover:bg-black/20"
                >
                  Modifier
                </button>
                <button
                  onClick={() => {
                    onDelete && onDelete(id);
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/20"
                >
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Heure + durée */}
        <div className="text-xs text-[var(--text2)] mt-1 leading-tight">
          {type === "bool" && heure && <div className="mb-2 m-1 truncate">{heure}</div>}
        </div>

        {/* Slider en bas si "time" */}
        {type === "time" && (
          <div>
            <div className="text-[11px] mb-1 text-[var(--text2)]">
              {fmtMins(progress)}/{fmtMins(duree)}
            </div>
            <input
              type="range"
              min={0}
              max={duree || 0}
              step={1}
              value={Math.min(progress || 0, duree || 0)}
              onChange={handleProgressChange}
              onMouseUp={handleProgressCommit}
              onTouchEnd={handleProgressCommit}
              onClick={(e) => e.stopPropagation()}
              disabled={locked || (duree || 0) === 0}
              className="w-full h-2 rounded-lg cursor-pointer accent-[var(--green2)]"
            />
            
          </div>
        )}
      </li>

      {/* Modal édition */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-[var(--details-dark)] p-6 shadow-xl border border-[var(--text3)]/20">
            <h2 className="text-lg font-semibold text-[var(--text1)] mb-4">
              Modifier l’activité
            </h2>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <input
                value={form.nom || ""}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Nom"
                className="w-full h-10 rounded-lg border border-[var(--text3)]/30 bg-transparent px-3 text-[var(--text1)]"
              />
              <select
                value={form.type || "bool"}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full h-10 rounded-lg border border-[var(--text3)]/30 bg-transparent px-3 text-[var(--text1)]"
              >
                <option value="bool">Validation simple</option>
                <option value="time">Avec durée</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="time"
                  value={form.heure || ""}
                  onChange={(e) => setForm({ ...form, heure: e.target.value })}
                  className="w-full h-10 rounded-lg border border-[var(--text3)]/30 bg-transparent px-3 text-[var(--text1)]"
                />
                <input
                  type="number"
                  min={0}
                  value={form.duree ?? 0}
                  onChange={(e) => setForm({ ...form, duree: parseInt(e.target.value, 10) || 0 })}
                  placeholder="Durée (min)"
                  className="w-full h-10 rounded-lg border border-[var(--text3)]/30 bg-transparent px-3 text-[var(--text1)]"
                />
              </div>
              <textarea
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description"
                className="w-full min-h-[80px] rounded-lg border border-[var(--text3)]/30 bg-transparent px-3 py-2 text-[var(--text1)]"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-[var(--text3)] hover:bg-black/20"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[var(--green2)] text-white text-sm hover:brightness-95"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
