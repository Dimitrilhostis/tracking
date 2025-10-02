"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";
import { Trash2, CheckCircle2, Check, Edit2, Eye } from "lucide-react";

export default function ListItemCard({
  id,
  nom,
  checked,
  description,
  onDelete,
  onValidate,
  onUpdate,
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(description || "");

  // Gestion swipe
  const x = useMotionValue(0);
  const leftOpacity = useTransform(x, [0, 100], [0, 1]); // → droite = validation
  const rightOpacity = useTransform(x, [0, -100], [0, 1]); // → gauche = delete
  const THRESHOLD = 200;

  async function handleSave() {
    setEditing(false);
    if (onUpdate) {
      await onUpdate(id, { description: desc });
    }
  }

  return (
    <li className="relative overflow-visible">
      {/* Icône validation (à gauche) */}
      <motion.div
        style={{ opacity: leftOpacity }}
        className="pointer-events-none absolute left-[-36px] top-1/2 -translate-y-1/2"
      >
        <CheckCircle2 size={22} className="text-[var(--green2)] drop-shadow" />
      </motion.div>

      {/* Icône poubelle (à droite) */}
      <motion.div
        style={{ opacity: rightOpacity }}
        className="pointer-events-none absolute right-[-36px] top-1/2 -translate-y-1/2"
      >
        <Trash2 size={22} className="text-red-500 drop-shadow" />
      </motion.div>

      {/* Carte draggable */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.08}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x > THRESHOLD) {
            onValidate && onValidate(id);
          } else if (info.offset.x < -THRESHOLD-50) {
            onDelete && onDelete(id);
          }
        }}
        className={`px-4 py-3 rounded-2xl border shadow-sm transition flex justify-between items-center
          ${checked
            ? "bg-[var(--green2)]/10 border-[var(--green2)]"
            : "bg-[var(--details-dark)]/70 border-[var(--text3)]/20 hover:bg-[var(--details-dark)]/85"
          }`}
      >
        <span className="text-[var(--text1)] font-medium">{nom}</span>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-black/20 transition"
          title="Voir détails"
        >
          <Eye size={16} className="text-[var(--text2)]" />
        </button>
      </motion.div>

      {/* --- Modal détails --- */}
{open && (
  <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur bg-black/50">
    <div
      className="w-full max-w-2xl h-[70vh] mx-5 rounded-2xl 
                 bg-[var(--details-dark)] p-6 shadow-xl 
                 border border-[var(--text3)]/20 relative 
                 flex flex-col"
    >
      <div className="flex-1 overflow-y-auto pr-2
       scrollbar-thin scrollbar-thumb-rounded-full 
       scrollbar-thumb-[var(--text3)]/40 scrollbar-track-transparent">
        
        {editing ? (
          <div className="space-y-4">
            {/* Champ titre */}
            <input
              type="text"
              value={nom}
              onChange={(e) =>
                onUpdate && onUpdate(id, { nom: e.target.value })
              }
              className="w-full h-12 rounded-xl border border-[var(--text3)]/30 
                         bg-transparent px-3 text-lg font-semibold 
                         text-[var(--text1)] outline-none"
              placeholder="Titre"
            />

            {/* Champ description */}
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full min-h-[415px] rounded-xl border border-[var(--text3)]/30 
                         bg-transparent px-3 py-2 text-[var(--text1)] outline-none"
              placeholder="Description..."
            />

            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-[var(--green2)] text-white text-sm hover:brightness-95"
            >
              <Check size={14} className="inline mr-1" /> Sauvegarder
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Titre affiché */}
            <h2 className="text-xl font-semibold text-[var(--text1)]">{nom}</h2>

            {/* Description affichée */}
            <p className="text-sm text-[var(--text2)] whitespace-pre-wrap">
              {desc || "Aucune description."}
            </p>

            {/* Bouton modifier */}
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-[var(--text3)] hover:text-[var(--text2)] flex items-center gap-1 text-right"
            >
              <Edit2 size={12} /> Modifier
            </button>

            
          </div>
        )}
      </div>

      {/* Bouton fermer */}
      <button
        onClick={() => setOpen(false)}
        className="absolute top-3 right-3 text-[var(--text3)] hover:text-[var(--text1)]"
      >
        ✕
      </button>
    </div>
  </div>
)}
    
    </li>
  );
}
