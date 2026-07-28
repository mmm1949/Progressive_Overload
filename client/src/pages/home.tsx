import { Link } from 'react-router-dom'

function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-12 pt-28 text-slate-100 sm:px-8">
      <section className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/50 p-7 sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-400">Welcome to LiftLog</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">Make every workout stronger than the last.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">Track your working sets, celebrate personal records, and make progressive overload simple.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link to="/progress" className="rounded-lg bg-emerald-400 px-5 py-3 text-center font-semibold text-slate-950 transition hover:bg-emerald-300">Log a workout</Link>
          <Link to="/prs" className="rounded-lg border border-slate-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-slate-800">View personal records</Link>
        </div>
      </section>

      <section className="mx-auto mt-6 grid max-w-5xl gap-4 sm:grid-cols-3">
        {[
          ['1. Choose', 'Pick a body part and the exercise you are training.'],
          ['2. Record', 'Save the weight and reps for every working set.'],
          ['3. Improve', 'Use your personal records as the next target.'],
        ].map(([title, text]) => <article key={title} className="rounded-2xl border border-slate-800 bg-slate-900 p-6"><h2 className="font-semibold text-emerald-300">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></article>)}
      </section>
    </main>
  )
}

export default Home
