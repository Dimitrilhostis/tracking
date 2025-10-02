"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

export default function ValidatedDrawer({ validated }) {
  const minHeight = 80; // état fermé visible
  const maxHeight = typeof window !== "undefined" ? window.innerHeight * 0.5 : 600;

  // Position verticale (0 = ouvert, maxHeight-minHeight = fermé)
  const y = useMotionValue(maxHeight - minHeight);

  // Hauteur réelle : fixe, c'est toujours le max
  const height = maxHeight;

  // Quand on drag puis relâche
  function handleDragEnd(_, info) {
    const offset = info.offset.y;
    const velocity = info.velocity.y;

    // Si le mouvement va vers le bas -> ferme
    if (offset > 50 || velocity > 500) {
      animate(y, maxHeight - minHeight, { type: "spring", stiffness: 300 });
    } else {
      // sinon -> ouvre
      animate(y, 0, { type: "spring", stiffness: 300 });
    }
  }

  return (
    <motion.div
      className="fixed left-0 right-0 bottom-0 z-40 
                 border-t border-[var(--text3)]/20 
                 bg-[var(--details-dark)]/90 backdrop-blur
                 flex flex-col rounded-t-2xl"
      style={{ height, y }}
      drag="y"
      dragConstraints={{ top: 0, bottom: maxHeight - minHeight }}
      onDragEnd={handleDragEnd}
    >
      {/* --- Handle --- */}
      <div className="w-12 h-2 bg-[var(--text3)] rounded-full mx-auto mt-2 cursor-grab" />

      {/* --- Contenu --- */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text2)]">
            {validated.length} validée{validated.length > 1 ? "s" : ""}
          </span>
        </div>

        <ul className="grid grid-cols-1 gap-2 mt-2">
          {validated.map((it) => (
            <li
              key={it.id}
              className="px-3 py-2 rounded-lg bg-green-700/30 border border-green-500 text-[var(--text1)]"
            >
              {it.nom}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
