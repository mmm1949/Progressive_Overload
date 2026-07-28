import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { type BodyPart } from '../data/workouts.js'
import { apiRequest } from '../lib/api.js'
import { getToken } from '../lib/auth.js'

type WorkoutSet = {
  id: number
  weight: number
  reps: number
}

function Exercise() {
  const { bodyPart = 'Workout', exercise = 'Exercise' } = useParams()
  const [sets, setSets] = useState<WorkoutSet[]>([])
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const weight = Number(form.get('weight'))
    const reps = Number(form.get('reps'))

    const token = getToken()
    if (!token) { setError('Please sign in before saving a workout.'); return }

    try {
      await apiRequest('/workouts', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ bodyPart: bodyPart as BodyPart, exercise, weight, reps, performed: new Date().toISOString().slice(0, 10) }) })
      setError('')
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to save workout.'); return }
    setSets((currentSets) => [...currentSets, { id: Date.now(), weight, reps }])
    event.currentTarget.reset()
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-12 pt-24 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link to="/progress" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300">← Back to exercise selection</Link>
        <p className="mt-7 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">{bodyPart}</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{exercise}</h1>
        <p className="mt-2 text-slate-400">Log each working set to track your progressive overload.</p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            Weight (kg)
            <input name="weight" type="number" min="0" step="0.5" required className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-base outline-none focus:border-emerald-400" />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Reps
            <input name="reps" type="number" min="1" step="1" required className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-base outline-none focus:border-emerald-400" />
          </label>
          <button type="submit" className="rounded-lg bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 sm:col-span-2">Add set</button>
          {error && <p className="text-sm text-rose-300 sm:col-span-2">{error}</p>}
        </form>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Today&apos;s sets</h2>
          {sets.length === 0 ? (
            <p className="mt-4 text-slate-400">No sets recorded yet. Add your first working set above.</p>
          ) : (
            <ol className="mt-4 grid gap-3">
              {sets.map((set, index) => <li key={set.id} className="flex items-center justify-between rounded-lg bg-slate-800 px-4 py-3"><span className="font-medium">Set {index + 1}</span><span className="text-emerald-300">{set.weight} kg × {set.reps} reps</span></li>)}
            </ol>
          )}
        </section>
      </div>
    </main>
  )
}

export default Exercise
