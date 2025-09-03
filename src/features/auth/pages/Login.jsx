import React, { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext.jsx'

export default function Login() {
  const nav = useNavigate()
  const { isAuthenticated, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  if (isAuthenticated) return <Navigate to="/feed" replace />

  async function onSubmit(e) {
    e.preventDefault()
    await login({ email, password, name })
    nav('/feed') // ou '/dashboard'
  }

  const input = 'w-full rounded-md border px-3 py-2 text-sm outline-none border-slate-300 bg-white focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-600'

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 dark:bg-slate-950">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="mb-4 text-xl font-semibold">Entrar</h1>
        <div className="space-y-3">
          <div>
            <label className="text-sm">Nome (opcional)</label>
            <input className={input} value={name} onChange={e=>setName(e.target.value)} placeholder="Como quer ser chamado(a)" />
          </div>
          <div>
            <label className="text-sm">Email</label>
            <input className={input} type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@exemplo.com" />
          </div>
          <div>
            <label className="text-sm">Senha (mock)</label>
            <input className={input} type="password" required value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
        </div>

        <button type="submit" className="mt-4 w-full rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:opacity-90 dark:bg-slate-200 dark:text-slate-900">
          Entrar
        </button>
      </form>
    </div>
  )
}
