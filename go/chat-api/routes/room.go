package routes

import "github.com/gin-gonic/gin"

func roomAdd(c *gin.Context)    {}
func roomDelete(c *gin.Context) {}
func roomList(c *gin.Context)   {}
func roomGet(c *gin.Context)    {}
func roomUpdate(c *gin.Context) {}

func RegisterRoomRoutes(router *gin.RouterGroup) {
	rooms := router.Group("/room")
	{
		rooms.POST("", roomAdd)
		rooms.GET("", roomList)
		rooms.GET("/:id", roomGet)
		rooms.PUT("/:id", roomUpdate)
		rooms.DELETE("/:id", roomDelete)
	}
}
