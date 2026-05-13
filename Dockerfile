# ============ Stage 1: Build Frontend ============
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# Copy frontend files
COPY frontend/package*.json ./
RUN npm ci --only=production

COPY frontend .

# Build frontend
RUN npm run build

# ============ Stage 2: Build Backend ============
FROM node:20-alpine AS backend-builder

# Install dependencies
RUN apk add --no-cache bash git openssh

# Add deploy key
ADD id_deploy /root/.ssh/id_rsa
RUN chmod 600 /root/.ssh/id_rsa
RUN touch /root/.ssh/known_hosts && ssh-keyscan github.com >> /root/.ssh/known_hosts

# Clone your repo
RUN git clone git@github.com:%user%/%repo%.git /app

WORKDIR /app

# Install deps + build
RUN npm install
RUN npm run build

# Install PM2 globally
RUN npm install -g pm2

# ============ Stage 3: Runtime ============
FROM node:20-alpine

# Install nginx and other dependencies
RUN apk add --no-cache bash nginx supervisor

# Create nginx and www-data user
RUN addgroup -S nginx && adduser -S nginx -G nginx || true

# Create directory for supervisor
RUN mkdir -p /var/log/supervisor

# Copy backend from builder
COPY --from=backend-builder /app /app
COPY --from=backend-builder /usr/local/lib/node_modules/pm2 /usr/local/lib/node_modules/pm2

# Link PM2 globally
RUN ln -sf /usr/local/lib/node_modules/pm2/bin/pm2 /usr/local/bin/pm2

# Copy frontend build
COPY --from=frontend-builder /frontend/.next /frontend/.next
COPY --from=frontend-builder /frontend/node_modules /frontend/node_modules
COPY --from=frontend-builder /frontend/package.json /frontend/package.json
COPY --from=frontend-builder /frontend/public /frontend/public
COPY --from=frontend-builder /frontend/next.config.js /frontend/next.config.js

# Copy nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Copy entrypoint and supervisor config
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY supervisord.conf /etc/supervisord.conf

# Create directories
RUN mkdir -p /app && mkdir -p /frontend && \
    chown -R nginx:nginx /app /frontend /var/log/nginx

WORKDIR /app

EXPOSE 80
CMD ["/bin/bash", "/entrypoint.sh"]

