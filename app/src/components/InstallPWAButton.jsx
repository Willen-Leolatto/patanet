import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";

export default function InstallPWAButton({ className = "" }) {
  const [deferred, setDeferred] = useState(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    function onPrompt(e) {
      e.preventDefault();
      setDeferred(e);
      setSupported(true);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (!deferred) return;
    const prompt = deferred;
    setDeferred(null);
    prompt.prompt();
    await prompt.userChoice; // {outcome: 'accepted'|'dismissed', platform: ...}
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={install}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm
                  border-slate-300 hover:bg-slate-100
                  dark:border-slate-700 dark:hover:bg-slate-800 ${className}`}
      title="Instalar o PataNet"
    >
      <Download className="h-4 w-4" /> Instalar
    </button>
  );
}
