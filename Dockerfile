FROM golang:1.24-alpine AS builder

WORKDIR /build

COPY home/go.mod home/go.sum ./
RUN go mod download

COPY home/ ./
COPY frontend/dist /build/internal/static/dist/

RUN CGO_ENABLED=0 GOOS=linux go build -o vps-monitor ./cmd/server

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

COPY --from=builder /build/vps-monitor .

EXPOSE 6789

CMD ["./vps-monitor"]
