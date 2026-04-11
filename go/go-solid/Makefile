.PHONY: dev api frontend build clean docker docker-run docker-up

# Run both API and frontend dev servers
dev:
	@echo "Starting API and frontend..."
	@cd frontend && bun install
	@trap 'kill 0' EXIT; \
		$(MAKE) api & \
		$(MAKE) frontend & \
		wait

# Go API server
api:
	cd backend && go run main.go

# Solid dev server
frontend:
	cd frontend && bun dev

# Build frontend into dist/ then build Go binary
build:
	cd frontend && bun install && bun run build
	cd backend && go build -o go-solid .

# Build Docker image
docker:
	docker build -t go-solid .

# Run Docker container
docker-run:
	docker run -p 8080:8080 go-solid

# Build and run
docker-up: docker docker-run

clean:
	rm -f backend/go-solid
	rm -rf backend/frontend/dist
