import React, { useEffect, useMemo, useState } from 'react'
import PageHeader from '../../../components/PageHeader'
import ContentCard from '../../../components/ContentCard'
import { Link } from 'react-router-dom'
import { listMembers, listInvites, myPermissions, changeMemberRole, removeMember, transferOwnership, cancelInvite, acceptInviteForCurrentUser, getOrCreateDefaultFamily } from '@features/family/services/familyStorage'
import { useToast } from '../../../components/ui/ToastProvider'
import { useConfirm } from '../../../components/ui/ConfirmProvider'
import { Crown, UserPlus, Trash2, Check, X, RefreshCw } from 'lucide-react'

const ROLE_LABEL = { owner: 'Proprietário', manager: 'Gerente', viewer: 'Visualizador' }

export default function Family() {
  const toast = useToast()
  const confirm = useConfirm()

  const [fam, setFam] = useState(getOrCreateDefaultFamily())
  const [members, setMembers] = useState([])
  const [invites, setInvites] = useState([])
  const perms = useMemo(() => myPermissions(), [])

  function refresh() {
    setFam(getOrCreateDefaultFamily())
    setMembers(listMembers())
    setInvites(listInvites('pending'))
  }

  useEffect(() => {
    refresh()
    const onUpd = () => refresh()
    window.addEventListener('patanet:family-updated', onUpd)
    return () => window.removeEventListener('patanet:family-updated', onUpd)
  }, [])

  async function onRoleChange(memberId, newRole) {
    try {
      changeMemberRole(memberId, newRole)
      toast.success('Papel atualizado.')
      refresh()
    } catch (e) {
      toast.error(e.message || 'Falha ao atualizar papel.')
    }
  }

  async function onRemoveMember(memberId) {
    const ok = await confirm({ title: 'Remover membro?', message: 'Esta pessoa perderá acesso à sua família.', confirmText: 'Remover', variant: 'danger' })
    if (!ok) return
    try {
      removeMember(memberId)
      toast.success('Membro removido.')
      refresh()
    } catch (e) {
      toast.error(e.message || 'Falha ao remover.')
    }
  }

  async function onTransfer(memberId) {
    const ok = await confirm({
      title: 'Transferir propriedade?',
      message: 'Você deixará de ser o proprietário e o novo proprietário será responsável por gerenciar a família.',
      confirmText: 'Transferir',
      variant: 'danger',
    })
    if (!ok) return
    try {
      transferOwnership(memberId)
      toast.success('Propriedade transferida.')
      refresh()
    } catch (e) {
      toast.error(e.message || 'Falha na transferência.')
    }
  }

  function resendInvite() {
    toast.info('Convite reenviado (simulação).')
  }

  async function onCancelInvite(invId) {
    const ok = await confirm({ title: 'Cancelar convite?', message: 'O link de convite deixará de funcionar.', confirmText: 'Cancelar convite', variant: 'danger' })
    if (!ok) return
    cancelInvite(invId)
    toast.success('Convite cancelado.')
    refresh()
  }

  async function onAcceptAsMe(invId) {
    // utilitário de teste para “aceitar como eu”
    try {
      acceptInviteForCurrentUser(invId)
      toast.success('Convite aceito (teste).')
      refresh()
    } catch (e) {
      toast.error(e.message || 'Não foi possível aceitar.')
    }
  }

  return (
    <div className="w-full">
      <PageHeader
        title="Família"
        description="Gerencie quem pode ver e cuidar dos seus pets."
        breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Família' }]}
        actions={perms.canInvite && (
          <Link to="/dashboard/familia/convidar"
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm
                       border-slate-300 hover:bg-slate-100
                       dark:border-slate-700 dark:hover:bg-slate-800">
            <UserPlus className="h-4 w-4" /> Convidar
          </Link>
        )}
      />

      {/* Membros */}
      <ContentCard title="Membros">
        {members.length === 0 ? (
          <div className="text-sm opacity-70">Nenhum membro.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2 pr-3">Nome</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Papel</th>
                  <th className="py-2 pr-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id} className="border-b border-slate-100 dark:border-slate-900/40">
                    <td className="py-2 pr-3">{m.name || '—'} {m.role === 'owner' && <span title="Proprietário" className="ml-1 inline-flex items-center text-xs opacity-80"><Crown className="mr-1 h-3 w-3" />Owner</span>}</td>
                    <td className="py-2 pr-3">{m.email || '—'}</td>
                    <td className="py-2 pr-3">
                      {perms.canManage && m.role !== 'owner' ? (
                        <select
                          value={m.role}
                          onChange={(e)=>onRoleChange(m.id, e.target.value)}
                          className="rounded-md border px-2 py-1 text-sm
                                     border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
                        >
                          <option value="manager">Gerente</option>
                          <option value="viewer">Visualizador</option>
                        </select>
                      ) : (
                        <span className="rounded-full border px-2 py-0.5 text-[11px]
                          border-slate-300 text-slate-700
                          dark:border-slate-700 dark:text-slate-200">
                          {ROLE_LABEL[m.role] || m.role}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex justify-end gap-2">
                        {perms.isOwner && m.role !== 'owner' && (
                          <button
                            type="button"
                            onClick={()=>onTransfer(m.id)}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs
                                       border-amber-600 text-amber-700 hover:bg-amber-50
                                       dark:border-amber-500 dark:text-amber-300 dark:hover:bg-amber-950/30"
                            title="Transferir propriedade"
                          >
                            <Crown className="h-4 w-4" /> Transferir
                          </button>
                        )}
                        {perms.canManage && m.role !== 'owner' && (
                          <button
                            type="button"
                            onClick={()=>onRemoveMember(m.id)}
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs
                                       border-slate-300 hover:bg-slate-100
                                       dark:border-slate-700 dark:hover:bg-slate-800"
                            title="Remover membro"
                          >
                            <Trash2 className="h-4 w-4" /> Remover
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ContentCard>

      {/* Convites pendentes */}
      <ContentCard title="Convites pendentes" className="mt-4">
        {invites.length === 0 ? (
          <div className="text-sm opacity-70">Nenhum convite pendente.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left">
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Nome</th>
                  <th className="py-2 pr-3">Papel</th>
                  <th className="py-2 pr-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {invites.map(i => (
                  <tr key={i.id} className="border-b border-slate-100 dark:border-slate-900/40">
                    <td className="py-2 pr-3">{i.email}</td>
                    <td className="py-2 pr-3">{i.name || '—'}</td>
                    <td className="py-2 pr-3">{ROLE_LABEL[i.role] || i.role}</td>
                    <td className="py-2 pr-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={resendInvite}
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs
                                     border-slate-300 hover:bg-slate-100
                                     dark:border-slate-700 dark:hover:bg-slate-800"
                          title="Reenviar (simulação)"
                        >
                          <RefreshCw className="h-4 w-4" /> Reenviar
                        </button>
                        <button
                          type="button"
                          onClick={()=>onCancelInvite(i.id)}
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs
                                     border-slate-300 hover:bg-slate-100
                                     dark:border-slate-700 dark:hover:bg-slate-800"
                          title="Cancelar convite"
                        >
                          <X className="h-4 w-4" /> Cancelar
                        </button>

                        {/* Botão de teste: aceitar convite “como eu” */}
                        <button
                          type="button"
                          onClick={()=>onAcceptAsMe(i.id)}
                          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs
                                     border-emerald-600 text-emerald-700 hover:bg-emerald-50
                                     dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                          title="Aceitar (teste)"
                        >
                          <Check className="h-4 w-4" /> Aceitar (teste)
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ContentCard>
    </div>
  )
}
