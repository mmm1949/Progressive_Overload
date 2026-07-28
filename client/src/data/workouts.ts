export const exercisesByBodyPart = {
  Chest: ['Flat Bench Smith Machine', 'Incline Dumbbell Press', 'Butter Fly', 'Cable Fly'],
  Back: ['Lat Pulldown', 'Seated Cable Row', 'Face Pull', 'Rear Delt Fly'],
  Legs: ['Barbell Squat', 'Leg Extention', 'Leg Press', 'Leg curl'],
  Shoulders: ['Overhead Press', 'Lateral Raise', 'Shrughs', 'Front Raise'],
  Triceps: ['Triceps Pushdown', 'Overhead tricep extention', 'Overhead dumble raise'],
  Biceps : ['Hammer Curl', 'EZ bar curl', 'Cable Curl'],
  Abs : ['Situps', 'Leg raises', 'Plank']
} as const

export type BodyPart = keyof typeof exercisesByBodyPart

export type WorkoutLog = {
  bodyPart: BodyPart
  exercise: string
  weight: number
  reps: number
  date: string
}

const storageKey = 'progressive-overload-workouts'

const starterLogs: WorkoutLog[] = [
  { bodyPart: 'Chest', exercise: 'Barbell Bench Press', weight: 80, reps: 6, date: '2026-07-20' },
  { bodyPart: 'Chest', exercise: 'Barbell Bench Press', weight: 85, reps: 4, date: '2026-07-27' },
  { bodyPart: 'Chest', exercise: 'Incline Dumbbell Press', weight: 30, reps: 8, date: '2026-07-25' },
  { bodyPart: 'Chest', exercise: 'Cable Fly', weight: 25, reps: 12, date: '2026-07-25' },
  { bodyPart: 'Back', exercise: 'Barbell Row', weight: 70, reps: 8, date: '2026-07-24' },
  { bodyPart: 'Back', exercise: 'Lat Pulldown', weight: 65, reps: 10, date: '2026-07-24' },
  { bodyPart: 'Back', exercise: 'Seated Cable Row', weight: 60, reps: 10, date: '2026-07-24' },
  { bodyPart: 'Legs', exercise: 'Barbell Squat', weight: 110, reps: 5, date: '2026-07-22' },
  { bodyPart: 'Legs', exercise: 'Romanian Deadlift', weight: 90, reps: 8, date: '2026-07-22' },
  { bodyPart: 'Legs', exercise: 'Leg Press', weight: 180, reps: 10, date: '2026-07-22' },
  { bodyPart: 'Shoulders', exercise: 'Overhead Press', weight: 45, reps: 6, date: '2026-07-23' },
  { bodyPart: 'Shoulders', exercise: 'Lateral Raise', weight: 12, reps: 12, date: '2026-07-23' },
  { bodyPart: 'Shoulders', exercise: 'Rear Delt Fly', weight: 30, reps: 12, date: '2026-07-23' },
  { bodyPart: 'Biceps', exercise: 'Barbell Curl', weight: 35, reps: 8, date: '2026-07-21' },
  { bodyPart: 'Triceps', exercise: 'Triceps Pushdown', weight: 40, reps: 10, date: '2026-07-21' },
  { bodyPart: 'Biceps', exercise: 'Hammer Curl', weight: 16, reps: 10, date: '2026-07-21' },
]

export function getWorkoutLogs(): WorkoutLog[] {
  const savedLogs = localStorage.getItem(storageKey)
  if (!savedLogs) return starterLogs

  try {
    return JSON.parse(savedLogs) as WorkoutLog[]
  } catch {
    return starterLogs
  }
}

export function addWorkoutLog(log: WorkoutLog) {
  const logs = [...getWorkoutLogs(), log]
  localStorage.setItem(storageKey, JSON.stringify(logs))
}
