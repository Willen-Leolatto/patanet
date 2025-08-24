import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import TopNav from '../components/TopNav'
import Sidebar from '../components/Sidebar'

export default function DashboardLayout() {
  const [open, setOpen] = useState(true)

  return (
    <div className="min-h-dvh w-full">
      <TopNav variant="dashboard" onToggleSidebar={() => setOpen(v => !v)} />
      <div className="pt-14 flex w-full">
        <Sidebar open={open} />
        {/* conteúdo: claro no padrão, escuro no dark */}
        <main className="flex-1 min-w-0 w-full px-6 py-6 bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
