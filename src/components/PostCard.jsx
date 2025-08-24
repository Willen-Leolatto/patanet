import React from 'react'

function ActionButton({ children }) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs transition-colors
                 border border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200
                 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
    >
      {children}
    </button>
  )
}

export default function PostCard({ post }) {
  return (
    <article
      className="rounded-xl border shadow-sm transition-colors
                 border-slate-200 bg-white/95 text-slate-900
                 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100"
    >
      <div className="flex items-start gap-3 p-3">
        <div className="h-8 w-8 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="min-w-0">
          <div className="text-xs opacity-80 leading-4">
            <span className="font-semibold">{post.author}</span> {post.meta}
          </div>
          <div className="text-[11px] opacity-60">{post.date}</div>
        </div>
      </div>

      {post.text && <div className="px-3 pb-3 text-sm">{post.text}</div>}

      {post.image && (
        <div className="px-3 pb-3">
          <div className="aspect-[16/9] w-full rounded-md bg-slate-200 dark:bg-slate-700" />
        </div>
      )}

      <div className="flex items-center gap-3 px-3 pb-3">
        <ActionButton>Curtir ({post.likes ?? 0})</ActionButton>
        <ActionButton>Comentar ({post.comments ?? 0})</ActionButton>
      </div>
    </article>
  )
}
