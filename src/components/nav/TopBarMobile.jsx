import React from 'react'
import { useUI } from '@/store/ui'
import { useAuth } from '@/store/auth'
import { Link } from 'react-router-dom'

export default function TopBarMobile(){
  const toggleSidebar = useUI(s=>s.toggleSidebar)
  const user = useAuth(s=>s.user)

  return (
    <header className="sidebar-surface fixed top-0 inset-x-0 z-30 border-b border-white/10 md:hidden">
      <div className="h-12 px-3 flex items-center justify-between">
        <button onClick={toggleSidebar} className="rounded-md px-2 py-1.5 hover:bg-white/10">≡</button>
        <Link to="/" className="font-semibold">PataNet</Link>
        {user ? <Link to="/dashboard" className="rounded-md px-2 py-1.5 hover:bg-white/10">Dashboard</Link>
              : <Link to="/login" className="rounded-md px-2 py-1.5 hover:bg-white/10">Entrar</Link>}
      </div>
    </header>
  )
}
