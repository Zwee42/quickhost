# QuickHost - Docker Deployment Platform

Tools to quickly host Next.js websites with an integrated deployment dashboard.

## Features

- **Web Dashboard UI**: Beautiful frontend for managing deployments
- **Automatic Deployments**: Auto-pull and rebuild from GitHub repositories
- **Nginx Reverse Proxy**: Production-ready web server handling SSL termination and load balancing
- **Zero-Downtime Reloads**: PM2 manages graceful application reloads
- **Docker Containerized**: Complete Docker setup with docker-compose

## Project Structure

```
quickhost/
├── frontend/                 # Next.js dashboard frontend
│   ├── pages/
│   │   ├── index.tsx        # Dashboard home page
│   │   ├── _app.tsx         # App wrapper
│   │   └── api/
│   │       └── deployments.ts
│   ├── components/
│   │   ├── Layout.tsx       # Main layout component
│   │   ├── DeploymentForm.tsx
│   │   └── DeploymentList.tsx
│   ├── styles/
│   │   └── globals.css      # Tailwind CSS
│   └── package.json
├── Dockerfile               # Multi-stage build
├── docker-compose.yml       # Docker Compose configuration
├── nginx.conf              # Nginx configuration
├── supervisord.conf        # Process manager config
├── entrypoint.sh          # Container entry point
└── README.md              # This file
```

## Prerequisites

- Docker & Docker Compose
- GitHub SSH deploy key in `id_deploy`
- `.env` file with necessary environment variables

## Setup

### 1. Prepare SSH Deploy Key

Place your GitHub SSH deploy key in the project root:

```bash
cp ~/.ssh/id_deploy ./id_deploy
chmod 600 id_deploy
```

### 2. Create .env File

```bash
cat > .env << EOF
NODE_ENV=production
# Add other environment variables as needed
EOF
```

### 3. Configure docker-compose.yml

Replace `%user%` and `%repo%` placeholders:

```bash
sed -i 's/%user%/your-username/g' docker-compose.yml
sed -i 's/%repo%/your-repo/g' docker-compose.yml
sed -i 's/%user%/your-username/g' Dockerfile
sed -i 's/%repo%/your-repo/g' Dockerfile
```

### 4. Build and Run

```bash
docker-compose up -d
```

## Architecture

### Services

**Nginx (Port 80/443)**
- Reverse proxy for frontend and backend
- Static file serving
- SSL/TLS termination
- Health checks

**Frontend (Port 3000 internal)**
- Next.js dashboard application
- Deployment management UI
- Built with Tailwind CSS
- TypeScript

**Backend (Port 3000 internal)**
- Your deployed Next.js application
- Auto-pull and rebuild from GitHub
- PM2 process management
- Zero-downtime reloads

### Network Flow

```
Client Browser (Port 80)
    ↓
Nginx Reverse Proxy
    ├→ Static Files
    ├→ Frontend (/) → Next.js Frontend
    └→ API (/api/*) → Backend Application
```

## Nginx Configuration

The `nginx.conf` handles:
- Frontend routing to the dashboard
- API request proxying to backend
- Gzip compression
- WebSocket upgrades for real-time features
- Health check endpoint

### Configuration Routes

- `/` - Frontend dashboard
- `/api/*` - Backend API requests
- `/health` - Health check

## Deployment

### Automatic Redeployment

The entrypoint script automatically:
1. Fetches latest changes from GitHub `main` branch
2. Detects if new commits exist
3. Pulls changes and rebuilds
4. Reloads PM2 with zero downtime

Check interval: Every 60 seconds

### Manual Rebuild

```bash
docker-compose restart
```

## Frontend Dashboard

Access at: `http://localhost/`

### Features

- **Deploy New App**: Form to deploy new GitHub repositories
- **Manage Deployments**: View active deployments and their status
- **Real-time Updates**: Monitor deployment health
- **Quick Links**: Direct access to deployed applications

## Troubleshooting

### Check Container Logs

```bash
docker-compose logs -f nginx
docker-compose logs -f nextjs-backend
docker-compose logs -f nextjs-frontend
```

### Verify Services

```bash
curl http://localhost/health
```

### Restart Services

```bash
docker-compose restart nginx
docker-compose restart nextjs-backend
docker-compose restart nextjs-frontend
```

## Environment Variables

Key variables for `.env`:

```
NODE_ENV=production
# Add database URLs, API keys, etc.
```

## Security Considerations

- Store SSH keys securely (not in git)
- Use environment variables for sensitive data
- Enable SSL/TLS in production (update nginx.conf)
- Regularly update Docker base images
- Use network isolation for services

## Performance Optimization

- **Gzip Compression**: Enabled for text assets
- **Caching**: Configure nginx caching rules as needed
- **Connection Pooling**: Proxy connections are pooled
- **Zero-Downtime Reloads**: PM2 handles graceful shutdowns

## TODO

- [ ] Support multiple repository types (React, Vue, etc.)
- [ ] Advanced deployment settings UI
- [ ] Deployment history and logs
- [ ] SSL/TLS certificate automation (Let's Encrypt)
- [ ] Database backup management
- [ ] Resource monitoring dashboard
- [ ] Team collaboration features

## License

See LICENSE file

## Support

For issues and features requests, see GitHub repository.
