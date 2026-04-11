package rooms

import (
	"chat-api/core/broadcast"
	"encoding/json"
	"time"
)

// Event types sent over SSE
type Event struct {
	Type string `json:"type"`
	Data any    `json:"data"`
}

type ChatMessage struct {
	ID     int       `json:"id"`
	User   string    `json:"user"`
	Text   string    `json:"text"`
	Time   time.Time `json:"time"`
	RoomId string    `json:"roomId"`
}

type PresenceEvent struct {
	Count int `json:"count"`
}

type TypingEvent struct {
	User   string `json:"user"`
	Active bool   `json:"active"`
}

type Message struct {
	UserId string
	RoomId string
	Text   string
}

type Listener struct {
	RoomId string
	Chan   chan interface{}
}

type typingReq struct {
	RoomId string
	UserId string
	Active bool
}

type historyReq struct {
	RoomId string
	Before int
	Limit  int
	Result chan []ChatMessage
}

type typingState struct {
	active bool
}

type roomState struct {
	broadcaster broadcast.Broadcaster
	listeners   int
	history     []ChatMessage
	nextID      int
	typing      map[string]*typingState
}

type Manager struct {
	rooms   map[string]*roomState
	open    chan *Listener
	close   chan *Listener
	delete  chan string
	msgs    chan *Message
	list    chan chan []string
	typing  chan *typingReq
	history chan *historyReq
}

const maxHistory = 200

func NewManager() *Manager {
	manager := &Manager{
		rooms:   make(map[string]*roomState),
		open:    make(chan *Listener, 100),
		close:   make(chan *Listener, 100),
		delete:  make(chan string, 100),
		msgs:    make(chan *Message, 100),
		list:    make(chan chan []string),
		typing:  make(chan *typingReq, 100),
		history: make(chan *historyReq),
	}

	go manager.run()
	return manager
}

func (m *Manager) run() {
	for {
		select {
		case listener := <-m.open:
			m.register(listener)
		case listener := <-m.close:
			m.deregister(listener)
		case roomid := <-m.delete:
			m.deleteBroadcast(roomid)
		case message := <-m.msgs:
			m.handleMessage(message)
		case result := <-m.list:
			ids := make([]string, 0, len(m.rooms))
			for id := range m.rooms {
				ids = append(ids, id)
			}
			result <- ids
		case req := <-m.typing:
			m.handleTyping(req)
		case req := <-m.history:
			m.handleHistory(req)
		}
	}
}

func (m *Manager) room(roomid string) *roomState {
	rs, ok := m.rooms[roomid]
	if !ok {
		rs = &roomState{
			broadcaster: broadcast.NewBroadcaster(10),
			history:     make([]ChatMessage, 0),
			nextID:      1,
			typing:      make(map[string]*typingState),
		}
		m.rooms[roomid] = rs
	}
	return rs
}

func (m *Manager) register(listener *Listener) {
	rs := m.room(listener.RoomId)
	rs.broadcaster.Register(listener.Chan)
	rs.listeners++
	m.broadcastPresence(listener.RoomId)
}

func (m *Manager) deregister(listener *Listener) {
	rs := m.room(listener.RoomId)
	rs.broadcaster.Unregister(listener.Chan)
	close(listener.Chan)
	rs.listeners--
	m.broadcastPresence(listener.RoomId)
}

func (m *Manager) broadcastPresence(roomid string) {
	rs := m.rooms[roomid]
	if rs == nil {
		return
	}
	evt := Event{Type: "presence", Data: PresenceEvent{Count: rs.listeners}}
	data, _ := json.Marshal(evt)
	rs.broadcaster.Submit(string(data))
}

func (m *Manager) handleMessage(msg *Message) {
	rs := m.room(msg.RoomId)
	chatMsg := ChatMessage{
		ID:     rs.nextID,
		User:   msg.UserId,
		Text:   msg.Text,
		Time:   time.Now(),
		RoomId: msg.RoomId,
	}
	rs.nextID++

	// Store in history
	rs.history = append(rs.history, chatMsg)
	if len(rs.history) > maxHistory {
		rs.history = rs.history[len(rs.history)-maxHistory:]
	}

	// Clear typing state for this user
	m.clearTyping(rs, msg.RoomId, msg.UserId)

	evt := Event{Type: "message", Data: chatMsg}
	data, _ := json.Marshal(evt)
	rs.broadcaster.Submit(string(data))
}

func (m *Manager) handleTyping(req *typingReq) {
	rs := m.rooms[req.RoomId]
	if rs == nil {
		return
	}

	ts, exists := rs.typing[req.UserId]

	if req.Active {
		if exists && ts.active {
			return // already broadcasting typing
		}
		rs.typing[req.UserId] = &typingState{active: true}
		m.broadcastTyping(rs, req.UserId, true)
	} else {
		m.clearTyping(rs, req.RoomId, req.UserId)
	}
}

func (m *Manager) clearTyping(rs *roomState, roomid, userid string) {
	ts, exists := rs.typing[userid]
	if !exists || !ts.active {
		return
	}
	delete(rs.typing, userid)
	m.broadcastTyping(rs, userid, false)
}

func (m *Manager) broadcastTyping(rs *roomState, userid string, active bool) {
	evt := Event{Type: "typing", Data: TypingEvent{User: userid, Active: active}}
	data, _ := json.Marshal(evt)
	rs.broadcaster.Submit(string(data))
}

func (m *Manager) handleHistory(req *historyReq) {
	rs := m.rooms[req.RoomId]
	if rs == nil {
		req.Result <- []ChatMessage{}
		return
	}

	history := rs.history
	end := len(history)

	// Find messages before the given ID
	if req.Before > 0 {
		for i, msg := range history {
			if msg.ID >= req.Before {
				end = i
				break
			}
		}
	}

	start := end - req.Limit
	if start < 0 {
		start = 0
	}

	result := make([]ChatMessage, end-start)
	copy(result, history[start:end])
	req.Result <- result
}

func (m *Manager) deleteBroadcast(roomid string) {
	rs, ok := m.rooms[roomid]
	if ok {
		rs.broadcaster.Close()
		delete(m.rooms, roomid)
	}
}

// Public API

func (m *Manager) OpenListener(roomid string) chan interface{} {
	listener := make(chan interface{})
	m.open <- &Listener{RoomId: roomid, Chan: listener}
	return listener
}

func (m *Manager) CloseListener(roomid string, channel chan interface{}) {
	m.close <- &Listener{RoomId: roomid, Chan: channel}
}

func (m *Manager) DeleteBroadcast(roomid string) {
	m.delete <- roomid
}

func (m *Manager) List() []string {
	result := make(chan []string)
	m.list <- result
	return <-result
}

func (m *Manager) Submit(userid, roomid, text string) {
	m.msgs <- &Message{UserId: userid, RoomId: roomid, Text: text}
}

func (m *Manager) Typing(userid, roomid string, active bool) {
	m.typing <- &typingReq{RoomId: roomid, UserId: userid, Active: active}
}

func (m *Manager) History(roomid string, before, limit int) []ChatMessage {
	req := &historyReq{RoomId: roomid, Before: before, Limit: limit, Result: make(chan []ChatMessage)}
	m.history <- req
	return <-req.Result
}
