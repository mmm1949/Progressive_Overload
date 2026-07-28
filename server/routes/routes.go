package routes

import (
	"net/http"

	"gym-weight-calculator/server/database"
	"gym-weight-calculator/server/handlers"
)

func Register(mux *http.ServeMux, db *database.Database) {
	handler := handlers.New(db)
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})
	mux.HandleFunc("POST /api/auth/signup", handler.Signup)
	mux.HandleFunc("POST /api/auth/login", handler.Login)
	mux.HandleFunc("POST /api/auth/logout", handler.Logout)
	mux.HandleFunc("GET /api/auth/me", handler.Me)
	mux.HandleFunc("GET /api/workouts", handler.ListWorkouts)
	mux.HandleFunc("POST /api/workouts", handler.CreateWorkout)
	mux.HandleFunc("PATCH /api/workouts/{id}", handler.UpdateWorkout)
	mux.HandleFunc("DELETE /api/workouts/{id}", handler.DeleteWorkout)
	mux.HandleFunc("GET /api/personal-records", handler.PersonalRecords)
}
