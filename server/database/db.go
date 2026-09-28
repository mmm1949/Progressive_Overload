package database

import (
	"context"
	"errors"
	"gym-weight-calculator/server/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Database struct{ pool *pgxpool.Pool }

func Connect(ctx context.Context, databaseURL string) (*Database, error) {
	if databaseURL == "" {
		return nil, errors.New("DATABASE_URL is required")
	}
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	db := &Database{pool: pool}
	if err := db.migrate(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	return db, nil
}
func (db *Database) Close() { db.pool.Close() }
func (db *Database) migrate(ctx context.Context) error {
	_, err := db.pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL); CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TIMESTAMPTZ NOT NULL); CREATE TABLE IF NOT EXISTS workouts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, body_part TEXT NOT NULL, exercise TEXT NOT NULL, weight DOUBLE PRECISION NOT NULL, reps INTEGER NOT NULL, performed TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()); ALTER TABLE workouts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(); ALTER TABLE workouts ADD COLUMN IF NOT EXISTS muscle_group TEXT NOT NULL DEFAULT ''; CREATE TABLE IF NOT EXISTS user_exercises (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, body_part TEXT NOT NULL, muscle_group TEXT NOT NULL, exercise TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL); CREATE UNIQUE INDEX IF NOT EXISTS user_exercises_unique_idx ON user_exercises (user_id, lower(body_part), lower(muscle_group), lower(exercise)); CREATE INDEX IF NOT EXISTS workouts_user_id_idx ON workouts(user_id); CREATE INDEX IF NOT EXISTS user_exercises_user_id_idx ON user_exercises(user_id); CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);`)
	return err
}
func (db *Database) CreateUser(user models.User) error {
	_, err := db.pool.Exec(context.Background(), `INSERT INTO users (id,name,email,password_hash,password_salt,created_at) VALUES ($1,$2,$3,$4,$5,$6)`, user.ID, user.Name, user.Email, user.PasswordHash, user.PasswordSalt, user.CreatedAt)
	return err
}
func (db *Database) FindUserByEmail(email string) (models.User, bool) {
	user, err := scanUser(db.pool.QueryRow(context.Background(), `SELECT id,name,email,password_hash,password_salt,created_at FROM users WHERE email=$1`, email))
	return user, err == nil
}
func (db *Database) FindUserByID(id string) (models.User, bool) {
	user, err := scanUser(db.pool.QueryRow(context.Background(), `SELECT id,name,email,password_hash,password_salt,created_at FROM users WHERE id=$1`, id))
	return user, err == nil
}
func (db *Database) CreateSession(session models.Session) error {
	_, err := db.pool.Exec(context.Background(), `INSERT INTO sessions (token,user_id,expires_at) VALUES ($1,$2,$3)`, session.Token, session.UserID, session.ExpiresAt)
	return err
}
func (db *Database) FindSession(token string) (models.Session, bool) {
	var session models.Session
	err := db.pool.QueryRow(context.Background(), `SELECT token,user_id,expires_at FROM sessions WHERE token=$1 AND expires_at>NOW()`, token).Scan(&session.Token, &session.UserID, &session.ExpiresAt)
	return session, err == nil
}
func (db *Database) DeleteSession(token string) error {
	_, err := db.pool.Exec(context.Background(), `DELETE FROM sessions WHERE token=$1`, token)
	return err
}
func (db *Database) AddWorkout(workout models.Workout) error {
	_, err := db.pool.Exec(context.Background(), `INSERT INTO workouts (id,user_id,body_part,muscle_group,exercise,weight,reps,performed,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, workout.ID, workout.UserID, workout.BodyPart, workout.MuscleGroup, workout.Exercise, workout.Weight, workout.Reps, workout.Performed, workout.CreatedAt, workout.UpdatedAt)
	return err
}
func (db *Database) ListWorkouts(userID string) []models.Workout {
	rows, err := db.pool.Query(context.Background(), `SELECT id,user_id,body_part,muscle_group,exercise,weight,reps,performed,created_at,updated_at FROM workouts WHERE user_id=$1 ORDER BY created_at ASC`, userID)
	if err != nil {
		return []models.Workout{}
	}
	defer rows.Close()
	workouts := make([]models.Workout, 0)
	for rows.Next() {
		var workout models.Workout
		if err := rows.Scan(&workout.ID, &workout.UserID, &workout.BodyPart, &workout.MuscleGroup, &workout.Exercise, &workout.Weight, &workout.Reps, &workout.Performed, &workout.CreatedAt, &workout.UpdatedAt); err == nil {
			workouts = append(workouts, workout)
		}
	}
	return workouts
}

func (db *Database) UpdateWorkout(userID, workoutID string, bodyPart, muscleGroup, exercise string, weight float64, reps int) (models.Workout, bool) {
	var workout models.Workout
	err := db.pool.QueryRow(context.Background(), `UPDATE workouts SET body_part=COALESCE(NULLIF($1, ''), body_part), muscle_group=COALESCE(NULLIF($2, ''), muscle_group), exercise=COALESCE(NULLIF($3, ''), exercise), weight=$4, reps=$5, updated_at=NOW() WHERE id=$6 AND user_id=$7 RETURNING id,user_id,body_part,muscle_group,exercise,weight,reps,performed,created_at,updated_at`, bodyPart, muscleGroup, exercise, weight, reps, workoutID, userID).Scan(&workout.ID, &workout.UserID, &workout.BodyPart, &workout.MuscleGroup, &workout.Exercise, &workout.Weight, &workout.Reps, &workout.Performed, &workout.CreatedAt, &workout.UpdatedAt)
	return workout, err == nil
}

func (db *Database) AddUserExercise(exercise models.UserExercise) error {
	_, err := db.pool.Exec(context.Background(), `INSERT INTO user_exercises (id,user_id,body_part,muscle_group,exercise,created_at) VALUES ($1,$2,$3,$4,$5,$6)`, exercise.ID, exercise.UserID, exercise.BodyPart, exercise.MuscleGroup, exercise.Exercise, exercise.CreatedAt)
	return err
}

func (db *Database) ListUserExercises(userID string) []models.UserExercise {
	rows, err := db.pool.Query(context.Background(), `SELECT id,user_id,body_part,muscle_group,exercise,created_at FROM user_exercises WHERE user_id=$1 ORDER BY created_at ASC`, userID)
	if err != nil {
		return []models.UserExercise{}
	}
	defer rows.Close()
	exercises := make([]models.UserExercise, 0)
	for rows.Next() {
		var exercise models.UserExercise
		if err := rows.Scan(&exercise.ID, &exercise.UserID, &exercise.BodyPart, &exercise.MuscleGroup, &exercise.Exercise, &exercise.CreatedAt); err == nil {
			exercises = append(exercises, exercise)
		}
	}
	return exercises
}

func (db *Database) FindUserExercise(userID, exerciseID string) (models.UserExercise, bool) {
	var exercise models.UserExercise
	err := db.pool.QueryRow(context.Background(), `SELECT id,user_id,body_part,muscle_group,exercise,created_at FROM user_exercises WHERE id=$1 AND user_id=$2`, exerciseID, userID).Scan(&exercise.ID, &exercise.UserID, &exercise.BodyPart, &exercise.MuscleGroup, &exercise.Exercise, &exercise.CreatedAt)
	return exercise, err == nil
}

func (db *Database) UpdateUserExercise(userID, exerciseID, bodyPart, muscleGroup, exerciseName string) (models.UserExercise, bool) {
	var exercise models.UserExercise
	err := db.pool.QueryRow(context.Background(), `UPDATE user_exercises SET body_part=$1, muscle_group=$2, exercise=$3 WHERE id=$4 AND user_id=$5 RETURNING id,user_id,body_part,muscle_group,exercise,created_at`, bodyPart, muscleGroup, exerciseName, exerciseID, userID).Scan(&exercise.ID, &exercise.UserID, &exercise.BodyPart, &exercise.MuscleGroup, &exercise.Exercise, &exercise.CreatedAt)
	return exercise, err == nil
}

func (db *Database) DeleteUserExercise(userID, exerciseID string) bool {
	result, err := db.pool.Exec(context.Background(), `DELETE FROM user_exercises WHERE id=$1 AND user_id=$2`, exerciseID, userID)
	return err == nil && result.RowsAffected() == 1
}

func (db *Database) RenameWorkoutsForExercise(userID, oldBodyPart, oldMuscleGroup, oldExercise, newBodyPart, newMuscleGroup, newExercise string) {
	_, _ = db.pool.Exec(context.Background(), `UPDATE workouts SET body_part=$1, muscle_group=$2, exercise=$3, updated_at=NOW() WHERE user_id=$4 AND lower(body_part)=lower($5) AND lower(muscle_group)=lower($6) AND lower(exercise)=lower($7)`, newBodyPart, newMuscleGroup, newExercise, userID, oldBodyPart, oldMuscleGroup, oldExercise)
}

func (db *Database) DeleteWorkoutsForExercise(userID, bodyPart, muscleGroup, exercise string) {
	_, _ = db.pool.Exec(context.Background(), `DELETE FROM workouts WHERE user_id=$1 AND lower(body_part)=lower($2) AND lower(muscle_group)=lower($3) AND lower(exercise)=lower($4)`, userID, bodyPart, muscleGroup, exercise)
}

func (db *Database) DeleteWorkout(userID, workoutID string) bool {
	result, err := db.pool.Exec(context.Background(), `DELETE FROM workouts WHERE id=$1 AND user_id=$2`, workoutID, userID)
	return err == nil && result.RowsAffected() == 1
}

type rowScanner interface{ Scan(...any) error }

func scanUser(row rowScanner) (models.User, error) {
	var user models.User
	err := row.Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.PasswordSalt, &user.CreatedAt)
	return user, err
}
