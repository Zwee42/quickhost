# QuickHost Application Dockerfile
# Multi-stage build for optimized production image

# ============ Stage 1: Build ============
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Copy frontend package files
COPY frontend/package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy frontend source
COPY frontend .

# Build Next.js application
RUN npm run build

# ============ Stage 2: Runtime ============
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    bash \
    curl \
    git \
    openssh-client \
    docker-cli \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S appuser && adduser -u 1001 -S appuser -G appuser

# Copy built application from builder
COPY --from=builder --chown=appuser:appuser /app/.next ./.next
COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /app/package*.json ./
COPY --from=builder --chown=appuser:appuser /app/public ./public
COPY --from=builder --chown=appuser:appuser /app/next.config.js ./

# Create data directory
RUN mkdir -p /data && chown -R appuser:appuser /data

# Use non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Expose port
EXPOSE 3000

# Start Next.js server
CMD ["npm", "start"]