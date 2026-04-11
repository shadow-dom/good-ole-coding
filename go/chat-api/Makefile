FRONTEND_DIR = ../frontend/chat

.PHONY: dev api frontend build clean docker docker-run docker-up

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

# Build Docker image (context = parent dir)
docker:
	cd .. && docker build -f chat-api/Dockerfile -t chat-api .

# Run Docker container
docker-run:
	docker run -p 8080:8080 chat-api

# Build and run
docker-up: docker docker-run

clean:
	rm -f chat-api
	rm -rf frontend/dist
