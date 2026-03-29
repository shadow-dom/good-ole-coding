package main

import (
	"chat-api/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	api := router.Group("/api/v1")

	routes.RegisterRoomRoutes(api)

	router.Run()
}
