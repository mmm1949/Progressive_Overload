import type { ApiUser, AuthResponse } from './api.js'

const tokenKey = 'liftlog-auth-token'
const userKey = 'liftlog-auth-user'

export function saveSession(session: AuthResponse) {
  localStorage.setItem(tokenKey, session.token)
  localStorage.setItem(userKey, JSON.stringify(session.user))
}

export function getToken() { return localStorage.getItem(tokenKey) }

export function getCurrentUser(): ApiUser | null {
  const rawUser = localStorage.getItem(userKey)
  if (!rawUser) return null
  try { return JSON.parse(rawUser) as ApiUser } catch { return null }
}

export function clearSession() {
  localStorage.removeItem(tokenKey)
  localStorage.removeItem(userKey)
}
