"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import { ChevronLeft, ChevronRight, LogOut, Bell, CheckCircle2, Circle } from "lucide-react";
import InstallButton from "@/components/install_button";

export default function HistoriquePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // "day" | "week" | "month"
  const [viewMode, setViewMode] = useState("day");
  const [cursorDate, setCursorDate] = useState(new Date());

  // Tracking
  const [dataByDay, setDataByDay] = useState({});
  const [loading, setLoading] = useState(true);

  // Settings
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [resetTime, setResetTime] = useState("04:00");

  
  // ---- Auth + fetch
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!data?.user) {
        router.push("/login");
        return;
      }
      setUser(data.user);
      await fetchHistory(data.user.id);
    })().finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  async function fetchHistory(user_id) {
    const { data, error } = await supabase
  .from("tracking")
  .select(`
    id, date, activity_id, checked, locked,
    activities ( id, nom, type, duree, progress )
  `)
  .eq("user_id", user_id)
  .eq("locked", true);   // 👈 seulement journées verrouillées



    if (!data || error) return;
    const grouped = data.reduce((acc, row) => {
      if (!acc[row.date]) acc[row.date] = [];
      acc[row.date].push(row);
      return acc;
    }, {});
    setDataByDay(grouped);
  }

  // ---- Date helpers
  const fmt = (d) =>
    d.toLocaleDateString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit" });

  const keyOf = (d) => d.toISOString().split("T")[0];

  const startOfISOWeek = (d) => {
    const copy = new Date(d);
    const day = (copy.getDay() + 6) % 7; // 0 = lundi
    copy.setDate(copy.getDate() - day);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };

  const daysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

  const shiftCursor = (dir) => {
    const d = new Date(cursorDate);
    if (viewMode === "day") d.setDate(d.getDate() + dir);
    else if (viewMode === "week") d.setDate(d.getDate() + dir * 7);
    else if (viewMode === "month") d.setMonth(d.getMonth() + dir);
    setCursorDate(d);
  };

  const goToday = () => setCursorDate(new Date());

  // ---- Stats helpers
  const statsForDate = (d) => {
    const rows = dataByDay[keyOf(d)] || [];
    let total = 0;
    let done = 0;
  
    rows.forEach((row) => {
      const act = row.activities || {};
      total += 1;
      if (act.type === "bool") {
        if (row.checked) done += 1;
      } else if (act.type === "time") {
        if ((act.progress || 0) >= (act.duree || 0)) done += 1;
      }
    });
  
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { items: rows, total, done, pct };
  };
  
  
  

  const tileTone = (pct) => {
    // Classes cohérentes avec ta palette (sobre & premium)
    if (pct === 0) return "bg-[var(--details-dark)]/70 border border-[var(--text3)]/15";
    if (pct < 50) return "bg-[var(--details-dark)]/80 border border-[var(--premium-dark)]/20";
    if (pct < 100) return "bg-[var(--details-dark)]/90 border border-[var(--premium)]/25";
    return "bg-[var(--green2)]/20 border border-[var(--green2)]/30";
  };

  // ---- Data views
  const weekDays = useMemo(() => {
    const start = startOfISOWeek(cursorDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursorDate]);

  const monthDays = useMemo(() => {
    const y = cursorDate.getFullYear();
    const m = cursorDate.getMonth();
    const count = daysInMonth(y, m);
    return Array.from({ length: count }, (_, i) => new Date(y, m, i + 1));
  }, [cursorDate]);

  // ---- UI subcomponents
  const Progress = ({ pct }) => (
    <div className="h-1.5 w-full rounded-full bg-black/20 overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background:
            "linear-gradient(90deg, var(--premium-light), var(--premium), var(--premium-dark))",
        }}
      />
    </div>
  );

  const Loading = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded-lg bg-white/5" />
      <div className="h-24 rounded-2xl bg-white/5" />
      <div className="h-24 rounded-2xl bg-white/5" />
    </div>
  );

  // ---- Renders
  function renderDayView() {
    const { items, total, done, pct } = statsForDate(cursorDate);
    return (
      <section className="rounded-3xl border border-[var(--text3)]/15 bg-[var(--details-dark)]/70 backdrop-blur p-5 space-y-4">
        <header className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text1)] leading-tight">
              {cursorDate.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </h2>
            <p className="text-sm text-[var(--text3)]">
              {done}/{total} complétées • {pct}%
            </p>
          </div>
          <div className="w-44">
            <Progress pct={pct} />
          </div>
        </header>

        {items.length === 0 ? (
          <p className="text-[var(--text3)]">Aucune donnée pour ce jour.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((it) => (
              <li
                key={it.id}
                className={`rounded-2xl border p-3 flex items-center justify-between ${it.checked
                    ? "border-[var(--green2)]/30 bg-[var(--green2)]/10"
                    : "border-[var(--text3)]/15 bg-[var(--details-dark)]/60"
                  }`}
              >
                <div className="text-sm text-[var(--text2)]">
                  Activité #{it.activity_id}
                </div>
                {it.checked ? (
                  <CheckCircle2 size={18} className="text-[var(--green2)]" />
                ) : (
                  <Circle size={18} className="text-[var(--text3)]" />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  function renderWeekView() {
    return (
      <section className="rounded-3xl border border-[var(--text3)]/15 bg-[var(--details-dark)]/60 backdrop-blur p-5 space-y-3">
        <h2 className="text-lg font-medium text-[var(--text2)]">
          Semaine du {fmt(weekDays[0])} au {fmt(weekDays[6])}
        </h2>
  
        <div className="flex flex-col divide-y divide-[var(--text3)]/10">
          {weekDays.map((d) => {
            const { pct, total, done } = statsForDate(d);
            return (
              <button
                key={keyOf(d)}
                onClick={() => {
                  setViewMode("day");
                  setCursorDate(d);
                }}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition hover:bg-[var(--details-dark)]/80 ${tileTone(pct)}`}
              >
                {/* Date */}
                <div className="flex items-center gap-3">
                  <span className="text-[var(--text3)] text-sm w-16 text-left">
                    {d.toLocaleDateString("fr-FR", { weekday: "short" })}
                  </span>
                  <span className="text-[var(--text1)] text-base font-medium">
                    {String(d.getDate()).padStart(2, "0")}
                  </span>
                </div>
  
                {/* Progression */}
                <div className="flex-1 px-4">
                  <div className="h-2 rounded-full bg-black/20 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background:
                          "linear-gradient(90deg, var(--premium-light), var(--premium), var(--premium-dark))",
                      }}
                    />
                  </div>
                </div>
  
                {/* Stats */}
                <div className="text-xs text-[var(--text3)] min-w-[60px] text-right">
                  {done}/{total} • {pct}%
                </div>
              </button>
            );
          })}
        </div>
      </section>
    );
  }
  

  function renderMonthView() {
    const y = cursorDate.getFullYear();
    const m = cursorDate.getMonth();
    return (
      <section className="rounded-3xl border border-[var(--text3)]/15 bg-[var(--details-dark)]/60 backdrop-blur p-5">
        <h2 className="mb-3 text-lg font-medium text-[var(--text2)]">
          {cursorDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </h2>
        <div className="grid grid-cols-7 gap-1">
          {"LMMJVSD".split("").map((w, idx) => (
            <div key={idx} className="text-center text-[var(--text3)] text-xs py-1">
              {w}
            </div>
          ))}
          {monthDays.map((d) => {
            const { pct } = statsForDate(d);
            return (
              <button
                key={keyOf(d)}
                onClick={() => {
                  setViewMode("day");
                  setCursorDate(d);
                }}
                className={`aspect-square rounded-xl p-1 md:p-1.5 transition ${tileTone(pct)} hover:scale-[1.01]`}
                title={`${pct}% complété`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[var(--text3)] text-[10px] md:text-xs">
                    {d.getDate()}
                  </span>
                  <span className="text-[var(--text2)] text-[10px]">{pct}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  // ---- UI principale
  return (
<main
      className="relative mx-auto max-w-6xl px-6 py-8 h-[calc(100vh-4rem)] flex flex-col gap-6"
      style={{
        background: `
          linear-gradient(to bottom, rgba(30,30,30,0.9), rgba(30,30,30,0.6) 30%, rgba(30,30,30,0.9)),
          url('/images/hero-bg.jpg') center/cover no-repeat
        `,
      }}
    >      {/* Top bar */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--text1)]">Historique</h1>

      {isMobile && (
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="h-10 w-10 rounded-full bg-[var(--details-dark)] border border-[var(--text3)]/20 text-[var(--text1)] flex items-center justify-center"
            aria-label="Menu utilisateur"
          >
            {user ? user.email[0].toUpperCase() : "?"}
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-[var(--text3)]/15 bg-[var(--details-dark)]/95 backdrop-blur shadow-xl p-3 space-y-3 z-10">
              <label className="flex items-center justify-between text-sm text-[var(--text2)]">
                <span className="flex items-center gap-2">
                  <Bell size={16} /> Notifications
                </span>
                <input
                  type="checkbox"
                  checked={notifEnabled}
                  onChange={(e) => setNotifEnabled(e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between text-sm text-[var(--text2)]">
                <span>Heure de reset</span>
                <input
                  type="time"
                  value={resetTime}
                  onChange={(e) => setResetTime(e.target.value)}
                  className="h-9 rounded-lg border border-[var(--text3)]/25 bg-transparent px-2 text-[var(--text1)]"
                />
              </label>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push("/login");
                }}
                className="w-full h-9 flex items-center justify-center gap-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition text-sm"
              >
                <LogOut size={16} /> Déconnexion
              </button>
            </div>
          )}
        </div>
        )}
      </header>

      {/* Segmented control */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-2xl border border-[var(--text3)]/20 bg-[var(--details-dark)]/60 p-1">
          {[
            { k: "day", label: "Jour" },
            { k: "week", label: "Semaine" },
            { k: "month", label: "Mois" },
          ].map((b) => (
            <button
              key={b.k}
              onClick={() => setViewMode(b.k)}
              className={`px-4 py-2 rounded-xl text-sm transition ${
                viewMode === b.k
                  ? "bg-[var(--premium-light)]/20 text-[var(--text1)] border border-[var(--premium)]/40"
                  : "text-[var(--text3)] hover:text-[var(--text2)]"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => shiftCursor(-1)}
          className="h-10 w-10 rounded-xl border border-[var(--text3)]/20 bg-[var(--details-dark)]/60 flex items-center justify-center hover:bg-[var(--details-dark)]/80 transition"
          aria-label="Précédent"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="text-[var(--text2)] text-sm">
          {viewMode === "day" && fmt(cursorDate)}
          {viewMode === "week" &&
            `${fmt(weekDays[0])} — ${fmt(weekDays[6])}`}
          {viewMode === "month" &&
            cursorDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="h-10 rounded-xl px-3 border border-[var(--text3)]/20 bg-[var(--details-dark)]/60 hover:bg-[var(--details-dark)]/80 transition text-sm"
          >
            Aujourd’hui
          </button>
          <button
            onClick={() => shiftCursor(1)}
            className="h-10 w-10 rounded-xl border border-[var(--text3)]/20 bg-[var(--details-dark)]/60 flex items-center justify-center hover:bg-[var(--details-dark)]/80 transition"
            aria-label="Suivant"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Vue */}
      {loading ? (
        <Loading />
      ) : viewMode === "day" ? (
        renderDayView()
      ) : viewMode === "week" ? (
        renderWeekView()
      ) : (
        renderMonthView()
      )}

      <InstallButton />
    </main>
  );
}
