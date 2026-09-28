package handlers

import (
	"net/http"
	"strings"
	"time"

	"gym-weight-calculator/server/models"
)

type workoutRequest struct {
	BodyPart    string  `json:"bodyPart"`
	MuscleGroup string  `json:"muscleGroup"`
	Exercise    string  `json:"exercise"`
	Weight      float64 `json:"weight"`
	Reps        int     `json:"reps"`
	Performed   string  `json:"performed"`
}

func (h *Handler) ListWorkouts(w http.ResponseWriter, r *http.Request) {
	user, ok := h.currentUser(w, r)
	if !ok {
		return
	}
	writeJSON(w, http.StatusOK, h.DB.ListWorkouts(user.ID))
}
func (h *Handler) CreateWorkout(w http.ResponseWriter, r *http.Request) {
	user, ok := h.currentUser(w, r)
	if !ok {
		return
	}
	var input workoutRequest
	if !decodeJSON(w, r, &input) {
		return
	}
	if strings.TrimSpace(input.BodyPart) == "" || strings.TrimSpace(input.MuscleGroup) == "" || strings.TrimSpace(input.Exercise) == "" || input.Weight < 0 || input.Reps < 1 {
		writeError(w, http.StatusBadRequest, "body part, muscle group, exercise, non-negative weight, and reps are required")
		return
	}
	performed := time.Now().UTC()
	if input.Performed != "" {
		parsed, err := time.Parse("2006-01-02", input.Performed)
		if err != nil {
			writeError(w, http.StatusBadRequest, "performed must be YYYY-MM-DD")
			return
		}
		performed = parsed
	}
	now := time.Now().UTC()
	workout := models.Workout{ID: mustToken(20), UserID: user.ID, BodyPart: strings.TrimSpace(input.BodyPart), MuscleGroup: strings.TrimSpace(input.MuscleGroup), Exercise: strings.TrimSpace(input.Exercise), Weight: input.Weight, Reps: input.Reps, Performed: performed, CreatedAt: now, UpdatedAt: now}
	if err := h.DB.AddWorkout(workout); err != nil {
		writeError(w, http.StatusInternalServerError, "could not save workout")
		return
	}
	writeJSON(w, http.StatusCreated, workout)
}
func (h *Handler) PersonalRecords(w http.ResponseWriter, r *http.Request) {
	user, ok := h.currentUser(w, r)
	if !ok {
		return
	}
	records := map[string]models.Workout{}
	for _, workout := range h.DB.ListWorkouts(user.ID) {
		best, exists := records[workout.Exercise]
		if !exists || workout.Weight > best.Weight {
			records[workout.Exercise] = workout
		}
	}
	writeJSON(w, http.StatusOK, records)
}

func (h *Handler) UpdateWorkout(w http.ResponseWriter, r *http.Request) {
	user, ok := h.currentUser(w, r)
	if !ok { return }
	var input struct {
		BodyPart    string  `json:"bodyPart"`
		MuscleGroup string  `json:"muscleGroup"`
		Exercise    string  `json:"exercise"`
		Weight      float64 `json:"weight"`
		Reps        int     `json:"reps"`
	}
	if !decodeJSON(w, r, &input) { return }
	if input.Weight < 0 || input.Reps < 1 { writeError(w, http.StatusBadRequest, "non-negative weight and reps are required"); return }
	workout, updated := h.DB.UpdateWorkout(user.ID, r.PathValue("id"), input.BodyPart, input.MuscleGroup, input.Exercise, input.Weight, input.Reps)
	if !updated { writeError(w, http.StatusNotFound, "workout not found"); return }
	writeJSON(w, http.StatusOK, workout)
}

func (h *Handler) DeleteWorkout(w http.ResponseWriter, r *http.Request) {
	user, ok := h.currentUser(w, r)
	if !ok { return }
	if !h.DB.DeleteWorkout(user.ID, r.PathValue("id")) { writeError(w, http.StatusNotFound, "workout not found"); return }
	w.WriteHeader(http.StatusNoContent)
}
