import { Navigate, useLocation } from 'react-router-dom'
import { getToken } from '../lib/auth.js'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}

export default ProtectedRoute
