import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

interface Props {
  children: ReactElement
  allowedRoles: Array<'ADMIN' | 'BODEGUERO'>
}

function RoleGuard({ children, allowedRoles }: Props) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/app/dashboard" replace />
  }

  return children
}

export default RoleGuard
