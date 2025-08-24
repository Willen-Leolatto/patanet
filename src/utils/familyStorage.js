import { getCurrentUser } from './currentUser'

const KEY = 'patanet_family_v1'

function now() { return Date.now() }
function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2,8)}` }

export function loadFamily() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null')
  } catch {
    return null
  }
}

function saveFamily(fam) {
  localStorage.setItem(KEY, JSON.stringify(fam))
  window.dispatchEvent(new Event('patanet:family-updated'))
}

export function getOrCreateDefaultFamily() {
  let fam = loadFamily()
  if (fam) return fam
  const me = getCurrentUser()
  fam = {
    id: 1,
    name: 'Minha Família',
    ownerUserId: me.id,
    createdAt: now(),
    members: [
      {
        id: uid(),
        userId: me.id,
        name: me.name,
        email: me.email,
        role: 'owner',
        status: 'active',
        joinedAt: now(),
      },
    ],
    invites: [], // {id,email,name,role,token,status,invitedBy,createdAt,acceptedAt?}
  }
  saveFamily(fam)
  return fam
}

export function listMembers() {
  const fam = getOrCreateDefaultFamily()
  return fam.members.slice().sort((a,b)=> a.name.localeCompare(b.name))
}

export function listInvites(status = 'pending') {
  const fam = getOrCreateDefaultFamily()
  return fam.invites.filter(i => (status ? i.status === status : true))
}

export function inviteMember({ email, name = '', role = 'viewer' }) {
  const fam = getOrCreateDefaultFamily()
  const me = getCurrentUser()

  // já convidado ativo?
  const existsActive = fam.members.find(m => m.email?.toLowerCase() === email.toLowerCase())
  if (existsActive) throw new Error('Este email já é membro da família.')

  const inv = {
    id: uid(),
    email: email.trim(),
    name: name.trim(),
    role,
    token: uid(),
    status: 'pending',
    invitedBy: me.id,
    createdAt: now(),
  }
  fam.invites.unshift(inv)
  saveFamily(fam)
  return inv
}

export function cancelInvite(inviteId) {
  const fam = getOrCreateDefaultFamily()
  const inv = fam.invites.find(i => i.id === inviteId)
  if (!inv) return
  inv.status = 'revoked'
  saveFamily(fam)
}

export function acceptInviteForCurrentUser(inviteId) {
  const fam = getOrCreateDefaultFamily()
  const me = getCurrentUser()
  const inv = fam.invites.find(i => i.id === inviteId && i.status === 'pending')
  if (!inv) throw new Error('Convite inexistente ou já utilizado.')

  // se já existe membro com este userId/email, apenas atualiza papel
  let member = fam.members.find(m => m.userId === me.id || (m.email && m.email.toLowerCase() === me.email.toLowerCase()))
  if (member) {
    member.role = inv.role
    member.status = 'active'
  } else {
    fam.members.push({
      id: uid(),
      userId: me.id,
      name: me.name,
      email: me.email,
      role: inv.role,
      status: 'active',
      joinedAt: now(),
    })
  }
  inv.status = 'accepted'
  inv.acceptedAt = now()
  saveFamily(fam)
}

export function changeMemberRole(memberId, newRole) {
  const fam = getOrCreateDefaultFamily()
  const m = fam.members.find(x => x.id === memberId)
  if (!m) return
  if (m.role === 'owner') throw new Error('Não é possível alterar o papel do proprietário.')
  m.role = newRole
  saveFamily(fam)
}

export function removeMember(memberId) {
  const fam = getOrCreateDefaultFamily()
  const m = fam.members.find(x => x.id === memberId)
  if (!m) return
  if (m.role === 'owner') throw new Error('Não é possível remover o proprietário.')
  fam.members = fam.members.filter(x => x.id !== memberId)
  saveFamily(fam)
}

export function transferOwnership(toMemberId) {
  const fam = getOrCreateDefaultFamily()
  const target = fam.members.find(x => x.id === toMemberId)
  if (!target) throw new Error('Membro não encontrado.')
  if (target.role === 'owner') return // nada a fazer

  const currentOwner = fam.members.find(x => x.role === 'owner')
  if (currentOwner) currentOwner.role = 'manager' // rebaixa para gerente
  target.role = 'owner'
  fam.ownerUserId = target.userId
  saveFamily(fam)
}

export function myPermissions() {
  const fam = getOrCreateDefaultFamily()
  const me = getCurrentUser()
  const mine = fam.members.find(m => m.userId === me.id)
  const role = mine?.role || 'viewer'
  return {
    role,
    canInvite: role === 'owner' || role === 'manager',
    canManage: role === 'owner' || role === 'manager',
    isOwner: role === 'owner',
  }
}
