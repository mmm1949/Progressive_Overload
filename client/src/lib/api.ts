const apiBaseUrl = import.meta.env.VITE_API_URL ?? '/api'

export type ApiUser = { id: string; name: string; email: string; createdAt: string }
export type AuthResponse = { token: string; user: ApiUser }

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (response.status === 204) return undefined as T
  const payload = await response.json().catch(() => ({})) as T & { error?: string }
  if (!response.ok) throw new Error(payload.error ?? 'Something went wrong. Please try again.')
  return payload
}
