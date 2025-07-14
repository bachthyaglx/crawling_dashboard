package api

import (
	"net/http"
	"os"

	"github.com/gorilla/sessions"
)

// Package api provides session management for the application.
var store = sessions.NewCookieStore([]byte(getSecret()))

func getSecret() string {
	if secret := os.Getenv("SESSION_SECRET"); secret != "" {
		return secret
	}
	return "super-secret-key"
}

// GetSession retrieves the session for the request
func GetSession(r *http.Request) (*sessions.Session, error) {
	return store.Get(r, "auth-session")
}

// Check authenticated user
func IsAuthenticated(r *http.Request) bool {
	session, _ := GetSession(r)
	auth, ok := session.Values["authenticated"].(bool)
	return ok && auth
}
