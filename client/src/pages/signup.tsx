import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest, type AuthResponse } from '../lib/api.js'
import { saveSession } from '../lib/auth.js'
import { AuthLayout } from './login.js'

function Signup() {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    const form = new FormData(event.currentTarget)
    try {
      const session = await apiRequest<AuthResponse>('/auth/signup', { method: 'POST', body: JSON.stringify({ name: form.get('name'), email: form.get('email'), password: form.get('password') }) })
      saveSession(session)
      navigate('/progress')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create your account.')
    } finally { setIsSubmitting(false) }
  }

  return <AuthLayout title="Start your training log" subtitle="Create an account to keep your progress safe."><form onSubmit={handleSubmit} className="grid gap-5"><label className="grid gap-2 text-sm font-medium">Name<input name="name" type="text" autoComplete="name" required className="auth-input" /></label><label className="grid gap-2 text-sm font-medium">Email<input name="email" type="email" autoComplete="email" required className="auth-input" /></label><label className="grid gap-2 text-sm font-medium">Password<input name="password" type="password" autoComplete="new-password" minLength={8} required className="auth-input" /></label>{error && <p className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}<button disabled={isSubmitting} className="rounded-lg bg-emerald-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">{isSubmitting ? 'Creating account...' : 'Create account'}</button><p className="text-center text-sm text-slate-400">Already have an account? <Link to="/login" className="font-semibold text-emerald-400">Sign in</Link></p></form></AuthLayout>
}

export default Signup
