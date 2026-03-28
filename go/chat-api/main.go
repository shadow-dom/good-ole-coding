package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

const (
	MaxUploadSize = 13 << 10 // 13 KB
)

// AuthRequired is a placeholder for your auth middleware.
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// ... check token, session, etc.
		fmt.Print("auth check!")
		c.Next()
	}
}

func loginEndpoint(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"action": "login"})
}

func submitEndpoint(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"action": "submit"})
}

func readEndpoint(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"action": "read"})
}

func uploadHandler(c *gin.Context) {
	// Wrap the body reader so only MaxUploadSize bytes are allowed
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, MaxUploadSize)

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(MaxUploadSize); err != nil {
		if _, ok := err.(*http.MaxBytesError); ok {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{
				"error": fmt.Sprintf("file too large (max: %d bytes)", MaxUploadSize),
			})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file form required"})
		return
	}
	defer file.Close()

	c.JSON(http.StatusOK, gin.H{
		"message": "upload successful",
	})
}

func main() {
	router := gin.Default()

	router.MaxMultipartMemory = 8 << 20 // 8 MiB

	// This handler will match /user/john but will not match /user/ or /user
	router.GET("/user/:name", func(c *gin.Context) {
		name := c.Param("name")
		c.String(http.StatusOK, "Hello %s", name)
	})

	// However, this one will match /user/john/ and also /user/john/send
	// If no other routers match /user/john, it will redirect to /user/john/
	router.GET("/user/:name/*action", func(c *gin.Context) {
		name := c.Param("name")
		action := c.Param("action")
		message := name + " is " + action
		c.String(http.StatusOK, message)
	})

	router.GET("/welcome", func(c *gin.Context) {
		firstname := c.DefaultQuery("firstname", "Guest")
		lastname := c.Query("lastname") // shortcut for c.Request.URL.Query().Get("lastname")

		c.String(http.StatusOK, "Hello %s %s", firstname, lastname)
	})

	router.POST("/users", func(c *gin.Context) {
		name := c.PostForm("name")
		c.JSON(http.StatusCreated, gin.H{"user": name})
	})

	router.POST("/form_post", func(c *gin.Context) {
		message := c.PostForm("message")
		nick := c.DefaultPostForm("nick", "anonymous")

		c.JSON(200, gin.H{
			"status":  "posted",
			"message": message,
			"nick":    nick,
		})
	})

	router.POST("/post", func(c *gin.Context) {
		ids := c.QueryMap("ids")
		names := c.PostFormMap("names")

		fmt.Printf("ids: %v; names: %v\n", ids, names)
		c.JSON(http.StatusOK, gin.H{
			"ids":   ids,
			"names": names,
		})
	})

	router.POST("/upload", uploadHandler)

	// Simple group: v1
	{
		v1 := router.Group("/v1")
		v1.POST("/login", loginEndpoint)
		v1.POST("/submit", submitEndpoint)
		v1.POST("/read", readEndpoint)
	}

	v2 := router.Group("/v2")
	v2.Use(AuthRequired()) // Apply auth middleware to all v2 routes
	{
		v2.POST("/login", loginEndpoint)
		v2.POST("/submit", submitEndpoint)
		v2.POST("/read", readEndpoint)
	}

	router.Run(":8080")
}
