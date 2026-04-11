# Build frontend
FROM oven/bun:1 AS frontend
WORKDIR /app
COPY frontend/package.json frontend/bun.lockb* ./
RUN bun install --frozen-lockfile
COPY frontend/ ./
RUN bun run build

# Build Go binary
FROM golang:1.26-alpine AS backend
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
COPY --from=frontend /app/dist ./frontend/dist
RUN CGO_ENABLED=0 go build -o go-solid .

# Runtime
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=backend /app/go-solid /usr/local/bin/go-solid
EXPOSE 8080
USER nonroot
CMD ["go-solid"]
