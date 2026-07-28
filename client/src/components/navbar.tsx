import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { clearSession, getCurrentUser } from '../lib/auth.js'
import { apiRequest } from '../lib/api.js'
import { getToken } from '../lib/auth.js'

const links = [
  { to: '/', label: 'Home' },
  { to: '/progress', label: 'Progress' },
  { to: '/prs', label: 'Personal records' },
]

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState(getCurrentUser)
  const navigate = useNavigate()
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-emerald-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`

  async function handleLogout() {
    const token = getToken()
    if (token) {
      try {
        await apiRequest('/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      } catch {
        // ignore — clear local session regardless
      }
    }
    clearSession()
    setUser(null)
    setIsOpen(false)
    navigate('/')
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
      <nav className="mx-auto max-w-6xl rounded-2xl border border-slate-700/80 bg-slate-950/95 px-4 py-3 shadow-xl shadow-black/30 backdrop-blur md:px-6">
        <div className="flex items-center justify-between gap-4">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-white" onClick={() => setIsOpen(false)}>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-400 text-sm text-slate-950">PO</span>
            LiftLog
          </NavLink>

          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => <NavLink key={link.to} to={link.to} className={linkClass}>{link.label}</NavLink>)}
            {user ? (
              <div className="ml-3 flex items-center gap-2">
                <span className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-emerald-300">Hi, {user.name}</span>
                <button type="button" onClick={handleLogout} className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800">Logout</button>
              </div>
            ) : (
              <NavLink to="/login" className={linkClass}>Sign in</NavLink>
            )}
          </div>

          <button type="button" className="rounded-lg p-2 text-slate-200 hover:bg-slate-800 md:hidden" aria-label="Toggle navigation" aria-expanded={isOpen} onClick={() => setIsOpen((open) => !open)}>
            <span className="text-xl" aria-hidden="true">{isOpen ? 'x' : '≡'}</span>
          </button>
        </div>

        {isOpen && (
          <div className="mt-3 grid gap-1 border-t border-slate-800 pt-3 md:hidden">
            {links.map((link) => <NavLink key={link.to} to={link.to} className={linkClass} onClick={() => setIsOpen(false)}>{link.label}</NavLink>)}
            {user ? (
              <>
                <p className="px-3 py-2 text-sm font-semibold text-emerald-300">Signed in as {user.name}</p>
                <button type="button" onClick={handleLogout} className="rounded-lg border border-slate-700 px-3 py-2 text-left text-sm font-semibold text-slate-200 transition hover:bg-slate-800">Logout</button>
              </>
            ) : (
              <NavLink to="/login" className={linkClass} onClick={() => setIsOpen(false)}>Sign in</NavLink>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}

export default Navbar
