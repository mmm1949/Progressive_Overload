import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest, type AuthResponse } from '../lib/api.js'
import { saveSession } from '../lib/auth.js'

function Login() {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    const form = new FormData(event.currentTarget)
    try {
      const session = await apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email: form.get('email'), password: form.get('password') }) })
      saveSession(session)
      navigate('/progress')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to sign in.')
    } finally { setIsSubmitting(false) }
  }

  return <AuthLayout title="Welcome back" subtitle="Sign in to save your workouts and personal records."><form onSubmit={handleSubmit} className="grid gap-5"><label className="grid gap-2 text-sm font-medium">Email<input name="email" type="email" autoComplete="email" required className="auth-input" /></label><label className="grid gap-2 text-sm font-medium">Password<input name="password" type="password" autoComplete="current-password" required className="auth-input" /></label>{error && <p className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}<button disabled={isSubmitting} className="rounded-lg bg-emerald-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">{isSubmitting ? 'Signing in...' : 'Sign in'}</button><p className="text-center text-sm text-slate-400">New to LiftLog? <Link to="/signup" className="font-semibold text-emerald-400">Create an account</Link></p></form></AuthLayout>
}

function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <main className="grid min-h-screen place-items-center bg-slate-950 px-4 pt-20 text-slate-100"><section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-xl shadow-black/30"><Link to="/" className="text-sm font-semibold text-emerald-400">LiftLog</Link><h1 className="mt-6 text-3xl font-bold">{title}</h1><p className="mt-2 text-slate-400">{subtitle}</p><div className="mt-7">{children}</div></section></main>
}

export { AuthLayout }
export default Login
