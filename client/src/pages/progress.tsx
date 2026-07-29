import { useEffect, useRef, useState, type FormEvent } from 'react'
import { exercisesByBodyPart, type BodyPart } from '../data/workouts.js'
import { apiRequest } from '../lib/api.js'
import { getToken } from '../lib/auth.js'

type WorkoutCard = {
  id: string
  bodyPart: string
  exercise: string
  weight: number
  reps: number
  performed: string
  createdAt: string
  updatedAt: string
}

type ExerciseGroup = {
  key: string
  bodyPart: string
  exercise: string
  sets: WorkoutCard[]
}

function groupWorkouts(workouts: WorkoutCard[]): ExerciseGroup[] {
  const map = new Map<string, ExerciseGroup>()
  for (const w of workouts) {
    const key = `${w.bodyPart}||${w.exercise}`
    if (!map.has(key)) map.set(key, { key, bodyPart: w.bodyPart, exercise: w.exercise, sets: [] })
    map.get(key)!.sets.push(w)
  }
  return [...map.values()]
}

function Progress() {
  const [bodyPart, setBodyPart] = useState<BodyPart | ''>('')
  const [exercise, setExercise] = useState('')
  const [addError, setAddError] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const [workouts, setWorkouts] = useState<WorkoutCard[]>([])
  const [loadError, setLoadError] = useState('')

  // Accordion open state: key → bool
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  // Edit state: workoutId → {weight, reps} | null
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editWeight, setEditWeight] = useState('')
  const [editReps, setEditReps] = useState('')

  const exercises = bodyPart ? exercisesByBodyPart[bodyPart] : []

  function handleBodyPartChange(value: string) {
    setBodyPart(value as BodyPart | '')
    setExercise('')
  }

  useEffect(() => {
    const token = getToken()
    if (!token) return
    apiRequest<WorkoutCard[]>('/workouts', { headers: { Authorization: `Bearer ${token}` } })
      .then(setWorkouts)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Unable to load exercises.'))
  }, [])

  // ── Add set inline ──────────────────────────────────────────────
  async function handleAddSet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const weight = Number(form.get('weight'))
    const reps = Number(form.get('reps'))
    const token = getToken()
    if (!token) { setAddError('Please sign in before saving a workout.'); return }
    setIsAdding(true)
    setAddError('')
    try {
      const newWorkout = await apiRequest<WorkoutCard>('/workouts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bodyPart, exercise, weight, reps, performed: new Date().toISOString().slice(0, 10) }),
      })
      setWorkouts((prev) => [...prev, newWorkout])
      // Auto-open the group that was just added
      const key = `${newWorkout.bodyPart}||${newWorkout.exercise}`
      setOpenGroups((prev) => ({ ...prev, [key]: true }))
      formRef.current?.reset()
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Unable to save workout.')
    } finally {
      setIsAdding(false)
    }
  }

  // ── Edit set ────────────────────────────────────────────────────
  function beginEdit(workout: WorkoutCard) {
    setEditingId(workout.id)
    setEditWeight(String(workout.weight))
    setEditReps(String(workout.reps))
  }
  function cancelEdit() { setEditingId(null) }

  async function saveEdit(workoutId: string) {
    const token = getToken()
    if (!token) return
    const weight = Number(editWeight)
    const reps = Number(editReps)
    if (weight < 0 || reps < 1) { setLoadError('Enter a valid weight and at least one rep.'); return }
    try {
      const updated = await apiRequest<WorkoutCard>(`/workouts/${workoutId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ weight, reps }),
      })
      setWorkouts((prev) => prev.map((w) => w.id === workoutId ? updated : w))
      cancelEdit()
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to update exercise.')
    }
  }

  // ── Delete group (all sets for an exercise) ────────────────────
  async function deleteGroup(group: ExerciseGroup) {
    if (!window.confirm(`Delete all sets for "${group.exercise}"? This cannot be undone.`)) return
    const token = getToken()
    if (!token) return
    try {
      await Promise.all(
        group.sets.map((s) =>
          apiRequest<void>(`/workouts/${s.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
        )
      )
      setWorkouts((prev) => prev.filter((w) => !(w.bodyPart === group.bodyPart && w.exercise === group.exercise)))
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to delete exercise.')
    }
  }

  async function deleteSet(workoutId: string) {
    if (!window.confirm('Delete this set?')) return
    const token = getToken()
    if (!token) return
    try {
      await apiRequest<void>(`/workouts/${workoutId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setWorkouts((prev) => prev.filter((w) => w.id !== workoutId))
      if (editingId === workoutId) cancelEdit()
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to delete set.')
    }
  }

  function toggleGroup(key: string) {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const groups = groupWorkouts(workouts)

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-12 pt-24 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-4xl">

        {/* ── Header ───────────────────────────────────────── */}
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Progressive overload</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Plan your next lift</h1>
          <p className="mt-2 max-w-2xl text-slate-400">Choose a body part and exercise, then record the sets you complete.</p>
        </header>

        {/* ── Info cards ───────────────────────────────────── */}
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ['Training focus', 'Build strength'],
            ["Today's target", 'Add one rep or more weight'],
            ['Next step', 'Log your working sets'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-2 text-xl font-semibold">{value}</p>
            </div>
          ))}
        </section>

        {/* ── Exercise selector ────────────────────────────── */}
        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-black/20">
          <h2 className="text-xl font-semibold">Select an exercise</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Body part
              <select
                value={bodyPart}
                onChange={(e) => handleBodyPartChange(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-base outline-none transition focus:border-emerald-400"
              >
                <option value="">Choose a body part</option>
                {Object.keys(exercisesByBodyPart).map((part) => (
                  <option key={part} value={part}>{part}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Exercise
              <select
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
                disabled={!bodyPart}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-base outline-none transition focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">{bodyPart ? 'Choose an exercise' : 'Choose a body part first'}</option>
                {exercises.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* ── Inline add-set form ──────────────────────────── */}
        {bodyPart && exercise && (
          <section className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6">
            <p className="text-sm font-medium text-emerald-300">Log a set for</p>
            <h2 className="mt-1 text-2xl font-bold">{exercise} <span className="text-base font-normal text-slate-400">— {bodyPart}</span></h2>
            <form ref={formRef} onSubmit={handleAddSet} className="mt-5 flex flex-wrap items-end gap-4">
              <label className="grid gap-1 text-sm font-medium">
                Weight (kg)
                <input
                  name="weight"
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  placeholder="e.g. 80"
                  className="w-32 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-base outline-none focus:border-emerald-400"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Reps
                <input
                  name="reps"
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="e.g. 10"
                  className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-base outline-none focus:border-emerald-400"
                />
              </label>
              <button
                type="submit"
                disabled={isAdding}
                className="rounded-lg bg-emerald-400 px-6 py-2.5 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
              >
                {isAdding ? 'Saving…' : '+ Add set'}
              </button>
            </form>
            {addError && <p className="mt-3 text-sm text-rose-300">{addError}</p>}
          </section>
        )}

        {/* ── Workout history accordion ────────────────────── */}
        <section className="mt-10">
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Workout history</p>
              <h2 className="mt-1 text-2xl font-bold">Exercises logged</h2>
            </div>
            <p className="text-sm text-slate-400">Click a bar to expand sets</p>
          </div>

          {loadError && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">{loadError}</p>
          )}

          {!getToken() ? (
            <p className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-400">
              Sign in to see your saved exercises here.
            </p>
          ) : groups.length === 0 && !loadError ? (
            <p className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-400">
              No exercises saved yet. Select a body part and exercise above and add your first set.
            </p>
          ) : (
            <div className="grid gap-2">
              {groups.map((group) => {
                const isOpen = !!openGroups[group.key]
                return (
                  <div key={group.key} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                    {/* ── Accordion bar ── */}
                    <div className="flex items-center gap-3 px-5 py-4">
                      {/* Clickable area */}
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.key)}
                        className="flex flex-1 items-center gap-4 text-left"
                      >
                        <span className="min-w-[90px] rounded-md bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-400">
                          {group.bodyPart}
                        </span>
                        <span className="flex-1 text-base font-semibold text-white">{group.exercise}</span>
                        <span className="text-xs text-slate-500">{group.sets.length} {group.sets.length === 1 ? 'set' : 'sets'}</span>
                        <span
                          className="text-slate-400 transition-transform duration-200"
                          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                          aria-hidden
                        >
                          ▾
                        </span>
                      </button>

                      {/* Delete group button */}
                      <button
                        type="button"
                        onClick={() => deleteGroup(group)}
                        title="Delete all sets for this exercise"
                        className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 transition hover:bg-rose-500/25 hover:text-rose-300"
                      >
                        ✕
                      </button>
                    </div>

                    {/* ── Expanded sets ── */}
                    {isOpen && (
                      <div className="border-t border-slate-800 px-5 pb-4">
                        <div className="mt-3 grid gap-2">
                          {group.sets.map((set, idx) => (
                            <div key={set.id} className="rounded-xl border border-slate-700/60 bg-slate-800/50 px-4 py-3">
                              {editingId === set.id ? (
                                /* Inline edit form */
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="w-14 text-xs font-semibold text-slate-400">Set {idx + 1}</span>
                                  <label className="flex items-center gap-1 text-sm">
                                    <span className="text-slate-400">kg</span>
                                    <input
                                      value={editWeight}
                                      onChange={(e) => setEditWeight(e.target.value)}
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      className="w-20 rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-white outline-none focus:border-emerald-400"
                                    />
                                  </label>
                                  <label className="flex items-center gap-1 text-sm">
                                    <span className="text-slate-400">reps</span>
                                    <input
                                      value={editReps}
                                      onChange={(e) => setEditReps(e.target.value)}
                                      type="number"
                                      min="1"
                                      className="w-16 rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-white outline-none focus:border-emerald-400"
                                    />
                                  </label>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => saveEdit(set.id)}
                                      className="rounded-lg bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-300"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={cancelEdit}
                                      className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-600"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* Normal set row */
                                <div className="flex items-center gap-4">
                                  <span className="w-14 text-xs font-semibold text-slate-500">Set {idx + 1}</span>
                                  <span className="flex-1 font-semibold text-emerald-300">
                                    {set.weight} <span className="text-xs font-normal text-slate-400">kg</span>
                                    <span className="mx-2 text-slate-600">×</span>
                                    {set.reps} <span className="text-xs font-normal text-slate-400">reps</span>
                                  </span>
                                  <span className="text-xs text-slate-600">{set.performed.slice(0, 10)}</span>
                                  <button
                                    onClick={() => beginEdit(set)}
                                    className="rounded-lg border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
                                  >
                                    Edit
                                  </button>
                                  {idx >= 3 && (
                                    <button
                                      onClick={() => deleteSet(set.id)} className="rounded-lg border border-rose-700/60 px-3 py-1 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200">
                                      Delete
                                    </button>
                                  )}
                                    
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default Progress
