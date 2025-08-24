import React from "react";

export default function PostComposer() {
  return (
    <div
      className="mb-4 rounded-xl border shadow-sm transition-colors
                 border-slate-200 bg-white/95 text-slate-900
                 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100"
    >
      <div className="p-3">
        <textarea
          rows={2}
          placeholder="Caixa de publicação (futuro): texto, foto, etc."
          className="w-full resize-none rounded-md border px-3 py-2 text-sm outline-none
                     border-slate-200 bg-slate-50 placeholder:text-slate-500 focus:border-slate-300
                     dark:border-slate-700 dark:bg-slate-900 dark:placeholder:text-slate-500 dark:focus:border-slate-600"
        />
      </div>
      <div
        className="flex items-center justify-end gap-2 border-t p-2
                      border-slate-200 dark:border-slate-800"
      >
        <button
          type="button"
          className="inline-flex items-center rounded-md px-3 py-1.5 text-xs transition-colors
                     border border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200
                     dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          Publicar
        </button>
      </div>
    </div>
  );
}
