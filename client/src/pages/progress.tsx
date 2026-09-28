import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../lib/api.js'
import { getToken } from '../lib/auth.js'

export type CustomExercise = {
  id: string
  bodyPart: string
  muscleGroup: string
  exercise: string
  createdAt: string
}

function isNumericOnly(value: string) {
  return /^\d+(\.\d+)?$/.test(String(value).trim())
}

function isValidTextField(value: string) {
  const trimmed = String(value).trim()
  return trimmed.length > 0 && !isNumericOnly(trimmed)
}

function Progress() {
  const navigate = useNavigate()
  const [bodyPart, setBodyPart] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [exercise, setExercise] = useState('')
  const [addError, setAddError] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [exercises, setExercises] = useState<CustomExercise[]>([])
  const [loadError, setLoadError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBodyPart, setEditBodyPart] = useState('')
  const [editMuscleGroup, setEditMuscleGroup] = useState('')
  const [editExercise, setEditExercise] = useState('')

  useEffect(() => {
    const token = getToken()
    if (!token) return
    apiRequest<CustomExercise[]>('/exercises', { headers: { Authorization: `Bearer ${token}` } })
      .then(setExercises)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Unable to load exercises.'))
  }, [])

  async function handleAddExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanBodyPart = bodyPart.trim()
    const cleanMuscleGroup = muscleGroup.trim()
    const cleanExercise = exercise.trim()

    if (!isValidTextField(cleanBodyPart) || !isValidTextField(cleanMuscleGroup) || !isValidTextField(cleanExercise)) {
      setAddError('Enter a body part, muscle group, and exercise name using text — not only numbers.')
      return
    }

    const token = getToken()
    if (!token) {
      setAddError('Please sign in before saving an exercise.')
      return
    }

    setIsAdding(true)
    setAddError('')
    try {
      const created = await apiRequest<CustomExercise>('/exercises', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bodyPart: cleanBodyPart, muscleGroup: cleanMuscleGroup, exercise: cleanExercise }),
      })
      setExercises((prev) => [...prev, created])
      setBodyPart('')
      setMuscleGroup('')
      setExercise('')
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Unable to save exercise.')
    } finally {
      setIsAdding(false)
    }
  }

  function beginEdit(item: CustomExercise) {
    setEditingId(item.id)
    setEditBodyPart(item.bodyPart)
    setEditMuscleGroup(item.muscleGroup)
    setEditExercise(item.exercise)
  }

  async function saveEdit(itemId: string) {
    const token = getToken()
    if (!token) return
    const cleanBodyPart = editBodyPart.trim()
    const cleanMuscleGroup = editMuscleGroup.trim()
    const cleanExercise = editExercise.trim()
    if (!isValidTextField(cleanBodyPart) || !isValidTextField(cleanMuscleGroup) || !isValidTextField(cleanExercise)) {
      setLoadError('Body part, muscle group, and exercise name should be text, not only numbers.')
      return
    }
    try {
      const updated = await apiRequest<CustomExercise>(`/exercises/${itemId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bodyPart: cleanBodyPart, muscleGroup: cleanMuscleGroup, exercise: cleanExercise }),
      })
      setExercises((prev) => prev.map((item) => (item.id === itemId ? updated : item)))
      setEditingId(null)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to update exercise.')
    }
  }

  async function deleteExercise(item: CustomExercise) {
    if (!window.confirm(`Delete "${item.exercise}" and all of its logged sets?`)) return
    const token = getToken()
    if (!token) return
    try {
      await apiRequest<void>(`/exercises/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setExercises((prev) => prev.filter((entry) => entry.id !== item.id))
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to delete exercise.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-12 pt-24 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Progressive overload</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Your custom exercises</h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Add the body parts and exercises you actually train. Open an exercise to log weight and reps.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-black/20">
          <h2 className="text-xl font-semibold">Add an exercise</h2>
          <p className="mt-1 text-sm text-slate-400">Type your own names — there is no preset list.</p>

          <form onSubmit={handleAddExercise} className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium">
              Body part
              <input
                type="text"
                value={bodyPart}
                onChange={(e) => setBodyPart(e.target.value)}
                required
                placeholder="e.g. Chest"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-base text-white outline-none transition focus:border-emerald-400"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Muscle group
              <input
                type="text"
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value)}
                required
                placeholder="e.g. Pectorals"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-base text-white outline-none transition focus:border-emerald-400"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Exercise name
              <input
                type="text"
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
                required
                placeholder="e.g. Incline Bench Press"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-base text-white outline-none transition focus:border-emerald-400"
              />
            </label>
            <button
              type="submit"
              disabled={isAdding}
              className="h-[50px] rounded-lg bg-emerald-400 px-6 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60 sm:col-span-3"
            >
              {isAdding ? 'Saving…' : '+ Add exercise'}
            </button>
          </form>
          {addError && <p className="mt-3 text-sm text-rose-300">{addError}</p>}
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Your list</p>
            <h2 className="mt-1 text-2xl font-bold">Tap an exercise to log sets</h2>
          </div>

          {loadError && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300">{loadError}</p>
          )}

          {exercises.length === 0 && !loadError ? (
            <p className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-400">
              No custom exercises yet. Add a body part, muscle group, and exercise name above.
            </p>
          ) : (
            <div className="grid gap-2">
              {exercises.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
                  {editingId === item.id ? (
                    <div className="flex flex-wrap items-end gap-3">
                      <label className="grid min-w-[140px] flex-1 gap-1 text-xs font-medium text-slate-400">
                        Body part
                        <input
                          value={editBodyPart}
                          onChange={(e) => setEditBodyPart(e.target.value)}
                          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
                        />
                      </label>
                      <label className="grid min-w-[140px] flex-1 gap-1 text-xs font-medium text-slate-400">
                        Muscle group
                        <input
                          value={editMuscleGroup}
                          onChange={(e) => setEditMuscleGroup(e.target.value)}
                          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
                        />
                      </label>
                      <label className="grid min-w-[180px] flex-1 gap-1 text-xs font-medium text-slate-400">
                        Exercise
                        <input
                          value={editExercise}
                          onChange={(e) => setEditExercise(e.target.value)}
                          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => saveEdit(item.id)}
                        className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-300"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/progress/exercise/${item.id}`)}
                        className="flex min-w-0 flex-1 flex-col items-start text-left"
                      >
                        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">{item.bodyPart}</span>
                        <span className="mt-1 text-lg font-semibold text-white">{item.exercise}</span>
                        <span className="text-sm text-slate-400">{item.muscleGroup}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => beginEdit(item)}
                        className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteExercise(item)}
                        className="rounded-lg border border-rose-700/60 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default Progress
