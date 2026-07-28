import { useEffect, useMemo, useState } from 'react'
import { exercisesByBodyPart, type BodyPart, type WorkoutLog } from '../data/workouts.js'
import { apiRequest } from '../lib/api.js'
import { getToken } from '../lib/auth.js'

type PersonalRecord = { bodyPart: BodyPart; exercise: string; bestLog: WorkoutLog | undefined }

function Prs() {
  const [logs, setLogs] = useState<WorkoutLog[]>([])

  useEffect(() => {
    const token = getToken()
    if (!token) return

    type ApiWorkout = Omit<WorkoutLog, 'date'> & { performed: string }
    apiRequest<ApiWorkout[]>('/workouts', { headers: { Authorization: `Bearer ${token}` } })
      .then((workouts) => setLogs(workouts.map((workout) => ({ ...workout, date: workout.performed.slice(0, 10) }))))
      .catch(() => setLogs([]))
  }, [])

  const personalRecords = useMemo<PersonalRecord[]>(() => {
    return Object.entries(exercisesByBodyPart).flatMap(([bodyPart, exercises]) => exercises.map((exercise) => ({
      bodyPart: bodyPart as BodyPart,
      exercise,
      bestLog: logs.filter((log) => log.exercise === exercise).reduce<WorkoutLog | undefined>((best, log) => !best || log.weight > best.weight ? log : best, undefined),
    })))
  }, [logs])

  const recordCount = personalRecords.filter((record) => record.bestLog).length

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-12 pt-28 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Personal records</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Your heaviest lifts</h1></div>
          <p className="rounded-lg bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-300">{recordCount} exercises tracked</p>
        </header>
        <p className="mt-3 text-slate-400">Each record is calculated from the highest weight logged for that exercise.</p>
        {!getToken() && <p className="mt-3 text-sm text-amber-300">Sign in to see your saved personal records.</p>}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {personalRecords.map((record) => <article key={record.exercise} className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><p className="text-sm font-medium text-emerald-400">{record.bodyPart}</p><h2 className="mt-1 font-semibold">{record.exercise}</h2>{record.bestLog ? <><p className="mt-5 text-3xl font-bold">{record.bestLog.weight}<span className="ml-1 text-base font-medium text-slate-400">kg</span></p><p className="mt-1 text-sm text-slate-400">{record.bestLog.reps} reps · {record.bestLog.date}</p></> : <p className="mt-5 text-sm text-slate-400">No sets logged yet</p>}</article>)}
        </section>
      </div>
    </main>
  )
}

export default Prs
