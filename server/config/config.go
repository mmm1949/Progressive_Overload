package config

import (
	"bufio"
	"os"
	"path/filepath"
	"strings"
)

type Config struct {
	Port        string
	FrontendURL string
	DatabaseURL string
}

func Load() Config {
	loadEnvFiles()
	return Config{Port: valueOrDefault("PORT", "8000"), FrontendURL: strings.TrimRight(valueOrDefault("FRONTEND_URL", "http://localhost:5173"), "/"), DatabaseURL: os.Getenv("DATABASE_URL")}
}

func valueOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func loadEnvFiles() {
	cwd, err := os.Getwd()
	if err != nil {
		cwd = "."
	}
	candidates := []string{".env", filepath.Join(cwd, ".env"), filepath.Join(cwd, "..", ".env"), filepath.Join(cwd, "server", ".env")}
	seen := make(map[string]bool, len(candidates))
	for _, candidate := range candidates {
		if seen[candidate] {
			continue
		}
		seen[candidate] = true
		loadEnvFile(candidate)
	}
}

func loadEnvFile(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()
	for scanner := bufio.NewScanner(file); scanner.Scan(); {
		parts := strings.SplitN(scanner.Text(), "=", 2)
		if len(parts) != 2 {
			continue
		}
		key, value := strings.TrimSpace(parts[0]), strings.TrimSpace(parts[1])
		if key != "" && os.Getenv(key) == "" {
			_ = os.Setenv(key, value)
		}
	}
}
