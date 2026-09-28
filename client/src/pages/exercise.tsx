import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiRequest } from '../lib/api.js'
import { getToken } from '../lib/auth.js'
import type { CustomExercise } from './progress.js'

type WorkoutSet = {
  id: string
  bodyPart: string
  muscleGroup: string
  exercise: string
  weight: number
  reps: number
  performed: string
}

function sameExercise(set: WorkoutSet, item: CustomExercise) {
  return (
    set.bodyPart.trim().toLowerCase() === item.bodyPart.trim().toLowerCase() &&
    set.exercise.trim().toLowerCase() === item.exercise.trim().toLowerCase()
  )
}

function Exercise() {
  const { exerciseId = '' } = useParams()
  const [exercise, setExercise] = useState<CustomExercise | null>(null)
  const [sets, setSets] = useState<WorkoutSet[]>([])
  const [error, setError] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editWeight, setEditWeight] = useState('')
  const [editReps, setEditReps] = useState('')

  useEffect(() => {
    const token = getToken()
    if (!token || !exerciseId) return

    Promise.all([
      apiRequest<CustomExercise>(`/exercises/${exerciseId}`, { headers: { Authorization: `Bearer ${token}` } }),
      apiRequest<WorkoutSet[]>('/workouts', { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(([item, workouts]) => {
        setExercise(item)
        setSets(workouts.filter((set) => sameExercise(set, item)))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load this exercise.'))
  }, [exerciseId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!exercise) return
    const form = new FormData(event.currentTarget)
    const weight = Number(form.get('weight'))
    const reps = Number(form.get('reps'))
    if (isNaN(weight) || weight < 0 || isNaN(reps) || reps < 1) {
      setError('Please enter a valid weight and at least 1 rep.')
      return
    }

    const token = getToken()
    if (!token) {
      setError('Please sign in before saving a workout.')
      return
    }

    setIsAdding(true)
    try {
      const saved = await apiRequest<WorkoutSet>('/workouts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bodyPart: exercise.bodyPart,
          muscleGroup: exercise.muscleGroup,
          exercise: exercise.exercise,
          weight,
          reps,
          performed: new Date().toISOString().slice(0, 10),
        }),
      })
      setSets((current) => [...current, saved])
      setError('')
      event.currentTarget.reset()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save workout.')
    } finally {
      setIsAdding(false)
    }
  }

  async function saveSetEdit(setId: string) {
    const token = getToken()
    if (!token) return
    const weight = Number(editWeight)
    const reps = Number(editReps)
    if (isNaN(weight) || weight < 0 || isNaN(reps) || reps < 1) {
      setError('Enter a valid weight and at least one rep.')
      return
    }
    try {
      const updated = await apiRequest<WorkoutSet>(`/workouts/${setId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ weight, reps }),
      })
      setSets((prev) => prev.map((set) => (set.id === setId ? updated : set)))
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update set.')
    }
  }

  async function deleteSet(setId: string) {
    if (!window.confirm('Delete this set?')) return
    const token = getToken()
    if (!token) return
    try {
      await apiRequest<void>(`/workouts/${setId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setSets((prev) => prev.filter((set) => set.id !== setId))
      if (editingId === setId) setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete set.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-12 pt-24 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link to="/progress" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300">
          ← Back to your exercises
        </Link>

        {exercise ? (
          <>
            <p className="mt-7 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Body part</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{exercise.bodyPart}</h1>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Muscle group</p>
            <p className="mt-1 text-xl font-semibold text-white">{exercise.muscleGroup}</p>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Exercise</p>
            <p className="mt-1 text-xl font-semibold text-white">{exercise.exercise}</p>
            <p className="mt-3 text-slate-400">Log each working set to track your progressive overload.</p>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Weight (kg)
                <input
                  name="weight"
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-base outline-none focus:border-emerald-400"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Reps
                <input
                  name="reps"
                  type="number"
                  min="1"
                  step="1"
                  required
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-base outline-none focus:border-emerald-400"
                />
              </label>
              <button
                type="submit"
                disabled={isAdding}
                className="rounded-lg bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60 sm:col-span-2"
              >
                {isAdding ? 'Saving set…' : 'Add set'}
              </button>
            </form>
          </>
        ) : (
          !error && <p className="mt-8 text-slate-400">Loading exercise…</p>
        )}

        {error && <p className="mt-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}

        {exercise && (
          <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Logged sets</h2>
            {sets.length === 0 ? (
              <p className="mt-4 text-slate-400">No sets recorded yet. Add your first working set above.</p>
            ) : (
              <ol className="mt-4 grid gap-3">
                {sets.map((set, index) => (
                  <li key={set.id} className="rounded-lg bg-slate-800 px-4 py-3">
                    {editingId === set.id ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-medium">Set {index + 1}</span>
                        <input
                          value={editWeight}
                          onChange={(e) => setEditWeight(e.target.value)}
                          type="number"
                          min="0"
                          step="0.5"
                          className="w-24 rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-sm outline-none focus:border-emerald-400"
                        />
                        <input
                          value={editReps}
                          onChange={(e) => setEditReps(e.target.value)}
                          type="number"
                          min="1"
                          className="w-20 rounded-lg border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-sm outline-none focus:border-emerald-400"
                        />
                        <button type="button" onClick={() => saveSetEdit(set.id)} className="rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-slate-950">
                          Save
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="font-medium">Set {index + 1}</span>
                        <span className="text-emerald-300">
                          {set.weight} kg × {set.reps} reps
                        </span>
                        <span className="text-xs text-slate-500">{String(set.performed).slice(0, 10)}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(set.id)
                              setEditWeight(String(set.weight))
                              setEditReps(String(set.reps))
                            }}
                            className="rounded-lg border border-slate-600 px-3 py-1 text-xs font-semibold text-slate-300"
                          >
                            Edit
                          </button>
                          <button type="button" onClick={() => deleteSet(set.id)} className="rounded-lg border border-rose-700/60 px-3 py-1 text-xs font-semibold text-rose-300">
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}
      </div>
    </main>
  )
}

export default Exercise
