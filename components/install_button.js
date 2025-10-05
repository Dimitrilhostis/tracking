import { useEffect, useState } from "react";

export default function InstallButton() {
  const [promptEvent, setPromptEvent] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!promptEvent) return null;

  return (
    <button
      onClick={() => {
        promptEvent.prompt();
      }}
      className="rounded-xl bg-[var(--green2)] px-4 py-2 text-white shadow-lg hover:bg-[var(--green3)] transition-all"
    >
      Installer l’application
    </button>
  );
}
