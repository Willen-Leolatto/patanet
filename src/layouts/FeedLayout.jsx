import React from 'react'
import { Outlet } from 'react-router-dom'
import TopNav from '../components/TopNav'

export default function FeedLayout() {
  return (
    <div className="min-h-dvh w-full">
      <TopNav variant="feed" />
      {/* conteúdo: claro no padrão, escuro no dark */}
      <main className="pt-14 w-full bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
        <div className="w-full px-4 py-4">
          <div className="w-full max-w-3xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
