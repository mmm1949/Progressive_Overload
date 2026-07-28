package handlers

import (
	"gym-weight-calculator/server/models"
	"net/http"
	"strings"
	"time"
)

type credentials struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *Handler) Signup(w http.ResponseWriter, r *http.Request) {
	var input credentials
	if !decodeJSON(w, r, &input) {
		return
	}
	input.Name = strings.TrimSpace(input.Name)
	input.Email = strings.ToLower(strings.TrimSpace(input.Email))
	if input.Name == "" || !strings.Contains(input.Email, "@") || len(input.Password) < 8 {
		writeError(w, http.StatusBadRequest, "name, valid email, and a password of at least 8 characters are required")
		return
	}
	salt, err := randomToken(16)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not secure password")
		return
	}
	user := models.User{ID: mustToken(20), Name: input.Name, Email: input.Email, PasswordHash: passwordHash(input.Password, salt), PasswordSalt: salt, CreatedAt: time.Now().UTC()}
	if err := h.DB.CreateUser(user); err != nil {
		writeError(w, http.StatusConflict, err.Error())
		return
	}
	h.respondWithSession(w, user)
}
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var input credentials
	if !decodeJSON(w, r, &input) {
		return
	}
	user, found := h.DB.FindUserByEmail(strings.ToLower(strings.TrimSpace(input.Email)))
	if !found || !verifyPassword(input.Password, user.PasswordSalt, user.PasswordHash) {
		writeError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}
	h.respondWithSession(w, user)
}
func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	token := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
	if token != "" {
		_ = h.DB.DeleteSession(token)
	}
	w.WriteHeader(http.StatusNoContent)
}
func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	user, ok := h.currentUser(w, r)
	if !ok {
		return
	}
	writeJSON(w, http.StatusOK, publicUser(user))
}
func (h *Handler) respondWithSession(w http.ResponseWriter, user models.User) {
	session := models.Session{Token: mustToken(32), UserID: user.ID, ExpiresAt: time.Now().Add(7 * 24 * time.Hour).UTC()}
	if err := h.DB.CreateSession(session); err != nil {
		writeError(w, http.StatusInternalServerError, "could not create session")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"token": session.Token, "user": publicUser(user)})
}
func (h *Handler) currentUser(w http.ResponseWriter, r *http.Request) (models.User, bool) {
	token := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
	if token == "" {
		writeError(w, http.StatusUnauthorized, "authentication required")
		return models.User{}, false
	}
	session, found := h.DB.FindSession(token)
	if !found {
		writeError(w, http.StatusUnauthorized, "invalid or expired session")
		return models.User{}, false
	}
	user, found := h.DB.FindUserByID(session.UserID)
	if !found {
		writeError(w, http.StatusUnauthorized, "user not found")
		return models.User{}, false
	}
	return user, true
}
func publicUser(user models.User) map[string]any {
	return map[string]any{"id": user.ID, "name": user.Name, "email": user.Email, "createdAt": user.CreatedAt}
}
