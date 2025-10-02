"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { LogOut } from "lucide-react";
import { Bell } from "lucide-react";
import { ChartLine, List, Plus, CalendarDays } from "lucide-react";

export default function NavBar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [resetTime, setResetTime] = useState("04:00");

  const navItems = [
    { href: "/tracking", label: "Suivi", icon: <ChartLine size={20} /> },
    { href: "/listes", label: "Listes", icon: <List size={20} /> },
    { href: "/create", label: "Créer", icon: <Plus size={20} /> },
    { href: "/historique", label: "Historique", icon: <CalendarDays size={20} /> },
  ];

  const hide = router.pathname === "/login";

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data?.user || null);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setUserMenuOpen(false);
  }, [router.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isActive = (href) => router.pathname.startsWith(href);

  if (hide) return null;

  return (
    <>
      {/* Desktop navbar */}
      <nav className="hidden md:block sticky top-0 z-50 w-full backdrop-blur bg-[var(--details-dark)]/70 border-b border-[var(--text3)]/20">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          {/* Brand */}
          <Link href="/tracking" className="font-semibold text-[var(--premium)]">
            The Smart Way
          </Link>

          {/* Nav links */}
          <ul className="flex gap-4">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`inline-flex h-9 items-center rounded-xl px-3 text-sm transition ${
                    isActive(item.href)
                      ? "bg-[var(--premium-light)]/20 border border-[var(--premium)]/40 text-[var(--text1)]"
                      : "text-[var(--text3)] hover:text-[var(--text2)]"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Profile */}
          <div className="relative">
            {user ? (
              <>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--text3)]/25 bg-[var(--details-dark)] px-2 text-sm text-[var(--text2)] hover:text-[var(--text1)] hover:border-[var(--text2)] transition"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--green2)] text-white">
                    {String(user.email || "U").slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline max-w-[12ch] truncate">
                    {user.email}
                  </span>
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
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-xl border border-[var(--text3)]/25 bg-[var(--details-dark)] px-3 py-2 text-sm text-[var(--text2)] hover:text-[var(--text1)] hover:border-[var(--text2)] transition"
              >
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--text3)]/20 bg-[var(--details-dark)]/80 backdrop-blur">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 text-xs transition ${
                isActive(item.href)
                  ? "text-[var(--green2)] font-semibold"
                  : "text-[var(--text3)] hover:text-[var(--text2)]"
              }`}
            >
              <span className="text-lg p-2">{item.icon}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
