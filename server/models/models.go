package models

import "time"

type User struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"passwordHash"`
	PasswordSalt string    `json:"passwordSalt"`
	CreatedAt    time.Time `json:"createdAt"`
}
type Session struct {
	Token     string    `json:"token"`
	UserID    string    `json:"userId"`
	ExpiresAt time.Time `json:"expiresAt"`
}
type Workout struct {
	ID          string    `json:"id"`
	UserID      string    `json:"userId"`
	BodyPart    string    `json:"bodyPart"`
	MuscleGroup string    `json:"muscleGroup"`
	Exercise    string    `json:"exercise"`
	Weight      float64   `json:"weight"`
	Reps        int       `json:"reps"`
	Performed   time.Time `json:"performed"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type UserExercise struct {
	ID          string    `json:"id"`
	UserID      string    `json:"userId"`
	BodyPart    string    `json:"bodyPart"`
	MuscleGroup string    `json:"muscleGroup"`
	Exercise    string    `json:"exercise"`
	CreatedAt   time.Time `json:"createdAt"`
}
