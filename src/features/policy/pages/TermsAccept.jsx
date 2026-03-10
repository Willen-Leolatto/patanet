import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { http } from "@/api/axios.js";

export default function TermsAccept() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const termsVersion = useMemo(() => {
    return window.localStorage.getItem("patanet:terms-version") || "";
  }, []);

  async function accept() {
    setLoading(true);
    try {
      const version = termsVersion || "2026-03-09";
      await http.post("/auth/accept-terms", { termsVersion: version });
      navigate("/feed", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl font-bold">Termos de uso</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Para continuar, você precisa aceitar os termos desta versão.
      </p>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-700 dark:text-zinc-200">
          Versão atual: <b>{termsVersion || "(não informado)"}</b>
        </p>
        <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-200">
          (Você vai me enviar o texto dos termos depois — por enquanto esta tela só registra o aceite por dispositivo.)
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={accept}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl bg-[#f77904] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Salvando…" : "Aceitar termos"}
          </button>
          <Link
            to="/privacidade"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Ver políticas
          </Link>
        </div>
      </div>
    </div>
  );
}
