package routes

import (
	"chat-api/core/rooms"
	"fmt"
	"io"
	"math/rand"
	"net/http"

	"github.com/gin-gonic/gin"
)

var roomManager *rooms.Manager

func stream(c *gin.Context) {
	id := c.Param("id")
	listener := roomManager.OpenListener(id)
	defer roomManager.CloseListener(id, listener)

	clientGone := c.Request.Context().Done()
	c.Stream(func(w io.Writer) bool {
		select {
		case <-clientGone:
			return false
		case message := <-listener:
			c.SSEvent("message", message)
			return true
		}
	})
}

func roomLIST(c *gin.Context) {
	ids := roomManager.List()
	type room struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	}
	result := make([]room, len(ids))
	for i, id := range ids {
		result[i] = room{ID: id, Name: id}
	}
	c.JSON(http.StatusOK, result)
}

func roomGET(c *gin.Context) {
	id := c.Param("id")
	userid := fmt.Sprint(rand.Int31())
	c.HTML(http.StatusOK, "chat_room", gin.H{
		"id":     id,
		"userid": userid,
	})
}

func roomPOST(c *gin.Context) {
	id := c.Param("id")
	userid := c.PostForm("user")
	message := c.PostForm("message")
	roomManager.Submit(userid, id, message)

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": message,
	})
}

func roomDELETE(c *gin.Context) {
	id := c.Param("id")
	roomManager.DeleteBroadcast(id)
}

func RegisterRoomRoutes(router *gin.RouterGroup) {
	roomManager = rooms.NewManager()

	rooms := router.Group("/room")
	{
		rooms.GET("", roomLIST)
		rooms.GET("/:id", roomGET)
		rooms.POST("/:id", roomPOST)
		rooms.DELETE("/:id", roomDELETE)
	}

	router.GET("/stream/:id", stream)
}
