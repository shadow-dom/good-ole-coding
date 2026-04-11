package main

import (
	"embed"
	"io/fs"
	"net/http"

	"github.com/gin-gonic/gin"
)

//go:embed frontend/dist/*
var frontendFS embed.FS

func main() {
	router := gin.Default()

	// Serve the SolidJS frontend
	distFS, _ := fs.Sub(frontendFS, "frontend/dist")
	fileServer := http.FileServer(http.FS(distFS))

	// Serve static assets directly, fall back to index.html for SPA routing
	router.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path

		// Try to serve the file directly (JS, CSS, images, etc.)
		f, err := distFS.Open(path[1:]) // strip leading "/"
		if err == nil {
			f.Close()
			fileServer.ServeHTTP(c.Writer, c.Request)
			return
		}

		// Fall back to index.html for client-side routing
		c.Request.URL.Path = "/"
		fileServer.ServeHTTP(c.Writer, c.Request)
	})

	router.Run()
}
