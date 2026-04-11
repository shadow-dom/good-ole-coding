FRONTEND_DIR = ../frontend/chat

.PHONY: dev api frontend build clean

# Run both API and frontend dev servers
dev:
	@echo "Starting API and frontend..."
	@trap 'kill 0' EXIT; \
		$(MAKE) api & \
		$(MAKE) frontend & \
		wait

# Go API server
api:
	go run main.go

# Solid dev server
frontend:
	cd $(FRONTEND_DIR) && bun dev

# Build frontend into dist/ then build Go binary
build:
	cd $(FRONTEND_DIR) && bun install && bun run build
	go build -o chat-api .

clean:
	rm -f chat-api
	rm -rf frontend/dist
