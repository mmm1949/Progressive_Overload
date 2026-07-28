package handlers

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"fmt"
)

func randomToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
func mustToken(length int) string {
	token, err := randomToken(length)
	if err != nil {
		panic(fmt.Errorf("random token: %w", err))
	}
	return token
}
func passwordHash(password, salt string) string {
	saltBytes, _ := hex.DecodeString(salt)
	value := []byte(password)
	for i := 0; i < 120000; i++ {
		mac := hmac.New(sha256.New, saltBytes)
		mac.Write(value)
		value = mac.Sum(nil)
	}
	return hex.EncodeToString(value)
}
func verifyPassword(password, salt, expected string) bool {
	actual, err := hex.DecodeString(passwordHash(password, salt))
	expectedBytes, expectedErr := hex.DecodeString(expected)
	return err == nil && expectedErr == nil && subtle.ConstantTimeCompare(actual, expectedBytes) == 1
}
