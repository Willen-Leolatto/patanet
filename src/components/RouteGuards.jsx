import React from 'react'
import { Navigate } from 'react-router-dom'
import { myPermissions } from '../utils/familyStorage'
import { getSession } from '../utils/authStorage'

export function RequireAuth({ children, to = '/login' }) {
  const { user } = getSession()
  if (user) return children
  return <Navigate to={to} replace />
}

export function RequireManage({ children, to = '/dashboard/forbidden' }) {
  const perms = myPermissions()
  if (perms.canManage) return children
  return <Navigate to={to} replace />
}
