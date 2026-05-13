# QuickHost - Self-Hosted Web Platform

A powerful self-hosted platform for deploying multiple projects through a user-friendly web interface. Deploy any Docker-enabled project from Git with zero manual intervention.

## Features

✨ **Key Capabilities**

- 🚀 **Instant Deployment**: Deploy from any Git repository with a Dockerfile
- 🌐 **Automatic DNS Routing**: NGINX reverse proxy with automatic subdomain configuration
- 🔒 **Automatic HTTPS**: Let's Encrypt SSL/TLS certificates with auto-renewal
- 🐳 **Docker Isolation**: Each project runs in isolated Docker containers
- 📊 **Live Monitoring**: Real-time logs, container status, and metrics
- ⚙️ **Environment Variables**: Easy per-project configuration management
- 🔄 **Auto-Restart**: Containers automatically restart on failure
- 🎛️ **Project Management**: Create, restart, stop, and delete projects via UI
- 📝 **Centralized Logging**: Application and container logs in one place
- 🛡️ **Security**: Input validation, SSL/TLS, security headers, isolated networks

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser / Client                         │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                         ┌────────▼────────┐
                         │   NGINX (80/443)│
                         │   Reverse Proxy │
                         └────────┬────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
  ┌─────▼──────┐         ┌────────▼────────┐        ┌──────▼────┐
  │  Dashboard │         │ Project URLs    │        │   Certbot  │
  │ & API      │         │ (subdomains)    │        │ (SSL/TLS)  │
  │            │         │                 │        │            │
  │ QuickHost  │         │ ┌──────────────┐│        └────────────┘
  │ App        │         │ │Project Cont. ││
  │ (Port 3000)│         │ │(Port 5000+)  ││
  └────────────┘         │ └──────────────┘│
        │                │ ┌──────────────┐│
        │                │ │Project Cont. ││
        │                │ │(Port 5001+)  ││
        │                │ └──────────────┘│
        │                └─────────────────┘
        │
   Docker & Git
        │
  ┌─────▼──────────────────┐
  │   Docker Daemon        │
  │  - Clone Repos         │
  │  - Build Images        │
  │  - Run Containers      │
  │  - Manage Networks     │
  └────────────────────────┘
```

## Prerequisites

- Docker & Docker Compose
- Ubuntu/Debian or similar Linux distribution
- Domain name (optional, can work with IP + port)
- At least 2GB RAM and 10GB disk space

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/quickhost.git
cd quickhost
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env
```

**Important settings:**

```env
ROOT_DOMAIN=yourdomain.com          # Your domain
ENABLE_SSL=true                      # Enable HTTPS
CERTBOT_EMAIL=admin@yourdomain.com  # For SSL certificates
BASE_PORT=5000                       # Starting port for projects
```

### 3. Build and Run

```bash
docker-compose up -d
```

Wait for services to start:

```bash
docker-compose logs -f quickhost-app
```

When you see "ready on 0.0.0.0:3000", open your browser to:

```
http://your-server-ip
```

### 4. (Optional) Set Up DNS

If using a domain, point it to your server:

```
example.com    A  your.server.ip
*.example.com  A  your.server.ip
```

## Usage

### Deploy a Project

1. **Navigate to Dashboard**: Go to `http://your-server/projects`
2. **Click "Create New"**
3. **Fill in the form**:
   - **Project Name**: Unique identifier (e.g., `my-app`)
   - **Git URL**: Repository URL (e.g., `https://github.com/user/repo.git`)
   - **Branch**: Git branch (default: `main`)
   - **Subdomain**: Custom subdomain (e.g., `myapp` → `myapp.yourdomain.com`)
   - **Enable SSL**: Toggle for automatic HTTPS
   - **Environment Variables**: Optional JSON configuration

4. **Click "Deploy Project"**
5. **Wait for deployment** (2-5 minutes depending on build size)
6. **Access your project** at `https://subdomain.yourdomain.com`

### Project Requirements

Your Git repository must contain:

1. **Dockerfile** in the root directory
2. **Port binding**: Application must listen on a specified port (default: 3000)

Example Dockerfile:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Manage Projects

**Dashboard**: View all projects with status indicators
- 🟢 Running
- 🔵 Building
- ⛔ Stopped
- 🔴 Error

**Project Details**:
- View application and container logs
- Restart project
- Stop project
- Delete project
- Monitor container status

## API Endpoints

### Projects

- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `DELETE /api/projects/[id]` - Delete project

### Project Actions

- `POST /api/projects/[id]/restart` - Restart project
- `POST /api/projects/[id]/stop` - Stop project

### Logs

- `GET /api/projects/[id]/logs?type=app` - Application logs
- `GET /api/projects/[id]/logs?type=container` - Container logs

### Health

- `GET /api/health` - Platform health check

## Environment Variables

### QuickHost Configuration

Pass environment variables in the project creation form:

```json
{
  "DATABASE_URL": "postgresql://user:pass@host/db",
  "API_KEY": "your-secret-key",
  "SITE_URL": "https://myapp.com",
  "DEBUG": "false"
}
```

## Troubleshooting

### Project Won't Deploy

Check logs:

```bash
docker-compose logs quickhost-app
```

Common issues:
- Repository URL incorrect or inaccessible
- Dockerfile not found in repository
- Port already in use
- Insufficient disk space

### HTTPS Not Working

```bash
# Check Certbot logs
docker-compose logs quickhost-certbot

# Manually renew
docker exec quickhost-certbot certbot renew --force-renewal
```

### Container Exits Immediately

Check container logs:

```bash
docker logs quickhost-<subdomain>
```

Ensure your application:
- Listens on port 3000 (or configured port)
- Handles `SIGTERM` for graceful shutdown
- Has all dependencies in package.json

### Disk Space Issues

```bash
# Remove old images
docker image prune -a

# Remove unused volumes
docker volume prune

# Check disk usage
df -h
```

## Performance Optimization

### For Production

1. **Increase Docker limits**:
   ```bash
   # Edit /etc/docker/daemon.json
   {
     "live-restore": true,
     "log-driver": "json-file",
     "log-opts": {
       "max-size": "100m",
       "max-file": "3"
     }
   }
   ```

2. **Enable NGINX caching**:
   - Add caching rules in NGINX config
   - Cache static assets for longer

3. **Monitor resources**:
   ```bash
   docker stats
   ```

4. **Set resource limits** in docker-compose.yml:
   ```yaml
   services:
     quickhost-app:
       deploy:
         resources:
           limits:
             cpus: '2'
             memory: 2G
   ```

## Security Best Practices

✅ **Enabled by Default**

- SSL/TLS encryption
- Security headers (HSTS, X-Frame-Options, etc.)
- Docker network isolation
- Input validation
- Environment variable sanitization

🔒 **Recommended**

1. **Firewall**: Allow only 80 and 443
   ```bash
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```

2. **Backups**: Regularly backup `/data` volume
3. **Updates**: Keep Docker and OS updated
4. **Secrets**: Never commit `.env` to Git
5. **SSH Keys**: Use SSH for Git access (not HTTPS with tokens)

## Monitoring & Maintenance

### Check System Health

```bash
# Overall status
docker-compose ps

# Platform health
curl http://localhost/api/health

# View logs
docker-compose logs -f quickhost-app

# Monitor resources
docker stats
```

### Backup Data

```bash
# Backup database and projects
docker run --rm \
  -v quickhost-app-data:/data \
  -v /backup:/backup \
  alpine tar czf /backup/quickhost-$(date +%Y%m%d).tar.gz -C / data
```

### Update Platform

```bash
# Pull latest changes
git pull

# Rebuild images
docker-compose build --no-cache

# Restart services
docker-compose down
docker-compose up -d
```

## Development

### Local Setup

```bash
# Install dependencies
cd frontend
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

### Project Structure

```
quickhost/
├── frontend/                 # Next.js application
│   ├── pages/
│   │   ├── api/             # API endpoints
│   │   ├── projects/        # Project pages
│   │   └── index.tsx        # Homepage
│   ├── lib/
│   │   ├── db.ts            # Database initialization
│   │   ├── docker.ts        # Docker service
│   │   ├── git.ts           # Git operations
│   │   ├── nginx.ts         # NGINX configuration
│   │   ├── ssl.ts           # SSL/TLS management
│   │   ├── project-service.ts # Orchestration
│   │   └── validation.ts    # Input validation
│   └── components/          # React components
├── docker-compose.yml       # Service orchestration
├── Dockerfile               # Container image
├── nginx.conf              # NGINX configuration
└── .env.example            # Environment template
```

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions:

- 📖 Check the [Troubleshooting](#troubleshooting) section
- 🐛 Open an issue on GitHub
- 💬 Start a discussion

## Roadmap

- [ ] User authentication & multi-user support
- [ ] Database backups & restore
- [ ] Custom Dockerfile support
- [ ] Performance analytics dashboard
- [ ] Automated testing
- [ ] Kubernetes support
- [ ] CLI tool for management
- [ ] GitHub Actions integration

---

**Built with ❤️ for self-hosted deployments** 
