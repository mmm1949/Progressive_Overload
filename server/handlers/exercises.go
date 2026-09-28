package handlers

import (
	"net/http"
	"strings"
	"time"

	"gym-weight-calculator/server/models"
)

type exerciseRequest struct {
	BodyPart    string `json:"bodyPart"`
	MuscleGroup string `json:"muscleGroup"`
	Exercise    string `json:"exercise"`
}

func (h *Handler) ListExercises(w http.ResponseWriter, r *http.Request) {
	user, ok := h.currentUser(w, r)
	if !ok {
		return
	}
	h.syncExercisesFromWorkouts(user.ID)
	writeJSON(w, http.StatusOK, h.DB.ListUserExercises(user.ID))
}

func (h *Handler) GetExercise(w http.ResponseWriter, r *http.Request) {
	user, ok := h.currentUser(w, r)
	if !ok {
		return
	}
	exercise, found := h.DB.FindUserExercise(user.ID, r.PathValue("id"))
	if !found {
		writeError(w, http.StatusNotFound, "exercise not found")
		return
	}
	writeJSON(w, http.StatusOK, exercise)
}

func (h *Handler) CreateExercise(w http.ResponseWriter, r *http.Request) {
	user, ok := h.currentUser(w, r)
	if !ok {
		return
	}
	var input exerciseRequest
	if !decodeJSON(w, r, &input) {
		return
	}
	bodyPart, muscleGroup, exerciseName, ok := normalizeExerciseInput(w, input)
	if !ok {
		return
	}
	exercise := models.UserExercise{
		ID:          mustToken(20),
		UserID:      user.ID,
		BodyPart:    bodyPart,
		MuscleGroup: muscleGroup,
		Exercise:    exerciseName,
		CreatedAt:   time.Now().UTC(),
	}
	if err := h.DB.AddUserExercise(exercise); err != nil {
		writeError(w, http.StatusConflict, "that exercise already exists")
		return
	}
	writeJSON(w, http.StatusCreated, exercise)
}

func (h *Handler) UpdateExercise(w http.ResponseWriter, r *http.Request) {
	user, ok := h.currentUser(w, r)
	if !ok {
		return
	}
	existing, found := h.DB.FindUserExercise(user.ID, r.PathValue("id"))
	if !found {
		writeError(w, http.StatusNotFound, "exercise not found")
		return
	}
	var input exerciseRequest
	if !decodeJSON(w, r, &input) {
		return
	}
	bodyPart, muscleGroup, exerciseName, ok := normalizeExerciseInput(w, input)
	if !ok {
		return
	}
	updated, saved := h.DB.UpdateUserExercise(user.ID, existing.ID, bodyPart, muscleGroup, exerciseName)
	if !saved {
		writeError(w, http.StatusConflict, "that exercise already exists")
		return
	}
	h.DB.RenameWorkoutsForExercise(user.ID, existing.BodyPart, existing.MuscleGroup, existing.Exercise, bodyPart, muscleGroup, exerciseName)
	writeJSON(w, http.StatusOK, updated)
}

func (h *Handler) DeleteExercise(w http.ResponseWriter, r *http.Request) {
	user, ok := h.currentUser(w, r)
	if !ok {
		return
	}
	existing, found := h.DB.FindUserExercise(user.ID, r.PathValue("id"))
	if !found {
		writeError(w, http.StatusNotFound, "exercise not found")
		return
	}
	h.DB.DeleteWorkoutsForExercise(user.ID, existing.BodyPart, existing.MuscleGroup, existing.Exercise)
	if !h.DB.DeleteUserExercise(user.ID, existing.ID) {
		writeError(w, http.StatusNotFound, "exercise not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) syncExercisesFromWorkouts(userID string) {
	existing := h.DB.ListUserExercises(userID)
	seen := map[string]bool{}
	for _, exercise := range existing {
		seen[exerciseKey(exercise.BodyPart, exercise.MuscleGroup, exercise.Exercise)] = true
	}
	for _, workout := range h.DB.ListWorkouts(userID) {
		key := exerciseKey(workout.BodyPart, workout.MuscleGroup, workout.Exercise)
		if seen[key] || strings.TrimSpace(workout.Exercise) == "" {
			continue
		}
		muscleGroup := strings.TrimSpace(workout.MuscleGroup)
		if muscleGroup == "" {
			muscleGroup = workout.BodyPart
		}
		_ = h.DB.AddUserExercise(models.UserExercise{
			ID:          mustToken(20),
			UserID:      userID,
			BodyPart:    workout.BodyPart,
			MuscleGroup: muscleGroup,
			Exercise:    workout.Exercise,
			CreatedAt:   time.Now().UTC(),
		})
		seen[key] = true
	}
}

func normalizeExerciseInput(w http.ResponseWriter, input exerciseRequest) (string, string, string, bool) {
	bodyPart := strings.TrimSpace(input.BodyPart)
	muscleGroup := strings.TrimSpace(input.MuscleGroup)
	exercise := strings.TrimSpace(input.Exercise)
	if bodyPart == "" || muscleGroup == "" || exercise == "" {
		writeError(w, http.StatusBadRequest, "body part, muscle group, and exercise name are required")
		return "", "", "", false
	}
	return bodyPart, muscleGroup, exercise, true
}

func exerciseKey(bodyPart, muscleGroup, exercise string) string {
	return strings.ToLower(strings.TrimSpace(bodyPart)) + "||" + strings.ToLower(strings.TrimSpace(muscleGroup)) + "||" + strings.ToLower(strings.TrimSpace(exercise))
}
