package routes

import (
	"chat-api/core/rooms"
	"io"
	"net/http"
	"strconv"

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

func roomTyping(c *gin.Context) {
	id := c.Param("id")
	var body struct {
		User   string `json:"user"`
		Active bool   `json:"active"`
	}
	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	roomManager.Typing(body.User, id, body.Active)
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func roomHistory(c *gin.Context) {
	id := c.Param("id")
	before, _ := strconv.Atoi(c.DefaultQuery("before", "0"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if limit > 100 {
		limit = 100
	}
	messages := roomManager.History(id, before, limit)
	c.JSON(http.StatusOK, messages)
}

func roomDELETE(c *gin.Context) {
	id := c.Param("id")
	roomManager.DeleteBroadcast(id)
}

func RegisterRoomRoutes(router *gin.RouterGroup) {
	roomManager = rooms.NewManager()

	room := router.Group("/room")
	{
		room.GET("", roomLIST)
		room.POST("/:id", roomPOST)
		room.POST("/:id/typing", roomTyping)
		room.GET("/:id/messages", roomHistory)
		room.DELETE("/:id", roomDELETE)
	}

	router.GET("/stream/:id", stream)
}
