# Build frontend
FROM oven/bun:1 AS frontend
WORKDIR /app
COPY frontend/chat/package.json frontend/chat/bun.lockb ./
RUN bun install --frozen-lockfile
COPY frontend/chat/ ./
RUN bun run vite build --outDir /app/dist --emptyOutDir

# Build Go binary
FROM golang:1.25-alpine AS backend
WORKDIR /app
COPY chat-api/go.mod chat-api/go.sum ./
RUN go mod download
COPY chat-api/ ./
COPY --from=frontend /app/dist ./frontend/dist
RUN CGO_ENABLED=0 go build -o chat-api .

# Runtime
FROM alpine:3.21
RUN apk add --no-cache ca-certificates
COPY --from=backend /app/chat-api /usr/local/bin/chat-api
EXPOSE 8080
CMD ["chat-api"]
