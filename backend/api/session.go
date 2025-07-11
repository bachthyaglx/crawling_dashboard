package api

import (
	"net/http"
	"os"

	"github.com/gorilla/sessions"
)

// Load secret key từ biến môi trường hoặc fallback mặc định
var store = sessions.NewCookieStore([]byte(getSecret()))

func getSecret() string {
	if secret := os.Getenv("SESSION_SECRET"); secret != "" {
		return secret
	}
	return "super-secret-key"
}

// Lấy session từ request
func GetSession(r *http.Request) (*sessions.Session, error) {
	return store.Get(r, "auth-session")
}

// Kiểm tra đã đăng nhập chưa
func IsAuthenticated(r *http.Request) bool {
	session, _ := GetSession(r)
	auth, ok := session.Values["authenticated"].(bool)
	return ok && auth
}
