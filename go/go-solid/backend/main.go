package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

//go:embed frontend/dist/*
var frontendFS embed.FS

func main() {
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())

	distFS, err := fs.Sub(frontendFS, "frontend/dist")
	if err != nil {
		log.Fatal("failed to load embedded frontend: ", err)
	}
	fileServer := http.FileServer(http.FS(distFS))

	// Security headers
	router.Use(func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Next()
	})

	// Serve static assets directly, fall back to index.html for SPA routing
	router.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path

		f, err := distFS.Open(path[1:])

		if err == nil {
			f.Close()
			c.Header("Cache-Control", "public, max-age=31536000, immutable")
			fileServer.ServeHTTP(c.Writer, c.Request)
			return
		}

		c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
		c.Request.URL.Path = "/"
		fileServer.ServeHTTP(c.Writer, c.Request)
	})

	srv := &http.Server{
		Addr:         ":8080",
		Handler:      router,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	log.Println("listening on :8080")
	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
