import React, { useState } from 'react'
import PageHeader from '../components/PageHeader'
import FormCard from '../components/forms/FormCard'
import { inviteMember } from '../utils/familyStorage'
import { useToast } from '../components/ui/ToastProvider'
import { useNavigate } from 'react-router-dom'

export default function FamiliaInvite() {
  const toast = useToast()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('viewer')

  const input = 'w-full rounded-md border px-3 py-2 text-sm outline-none border-slate-300 bg-white focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-600'

  function isEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }

  function onSubmit(e) {
    e.preventDefault()
    if (!isEmail(email)) { toast.info('Informe um email válido.'); return }
    try {
      inviteMember({ email, name, role })
      toast.success('Convite enviado (simulação).')
      nav('/dashboard/familia')
    } catch (err) {
      toast.error(err.message || 'Não foi possível convidar.')
    }
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Convidar para a família"
        breadcrumbs={[{label:'Dashboard', to:'/dashboard'}, {label:'Família', to:'/dashboard/familia'}, {label:'Convidar'}]}
        description="Envie um convite por email para alguém participar da sua família."
      />

      <form onSubmit={onSubmit}>
        <FormCard title="Convite">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Email</label>
              <input className={input} type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium">Nome (opcional)</label>
              <input className={input} value={name} onChange={e=>setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Papel</label>
              <select className={input} value={role} onChange={e=>setRole(e.target.value)}>
                <option value="viewer">Visualizador</option>
                <option value="manager">Gerente</option>
              </select>
              <p className="mt-1 text-xs opacity-70">Somente o proprietário pode transferir a propriedade.</p>
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button type="submit" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:opacity-90 dark:bg-slate-200 dark:text-slate-900">
              Enviar convite
            </button>
          </div>
        </FormCard>
      </form>
    </div>
  )
}
