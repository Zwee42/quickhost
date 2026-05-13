#!/bin/bash

# QuickHost Deployment Guide
# This script helps set up QuickHost on a VPS

set -e

echo "╔════════════════════════════════════════════╗"
echo "║     QuickHost Deployment Setup Script      ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    echo "❌ This script must be run as root"
    echo "Run: sudo bash deploy.sh"
    exit 1
fi

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "Install Docker: https://docs.docker.com/engine/install/"
    exit 1
fi
echo "✅ Docker is installed"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    echo "Install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi
echo "✅ Docker Compose is installed"

# Get configuration
echo ""
echo "⚙️  Configuration Setup"
echo ""

read -p "📧 Enter your email for SSL certificates: " CERTBOT_EMAIL
read -p "🌐 Enter your domain (e.g., example.com): " ROOT_DOMAIN
read -p "🔌 Enter base port for projects (default: 5000): " BASE_PORT
BASE_PORT=${BASE_PORT:-5000}

# Create .env file
echo ""
echo "📝 Creating .env file..."

cat > .env <<EOF
# QuickHost Configuration
ROOT_DOMAIN=$ROOT_DOMAIN
BASE_PORT=$BASE_PORT
NODE_ENV=production

# SSL/HTTPS Configuration
ENABLE_SSL=true
CERTBOT_EMAIL=$CERTBOT_EMAIL
CERTBOT_AGREE_TOS=true

# Paths
DATA_PATH=/data/quickhost.db
PROJECTS_PATH=/data/projects
CERT_PATH=/data/certificates
NGINX_CONF_DIR=/etc/nginx/conf.d

# Docker
DOCKER_NETWORK=quickhost-network

# Logging
LOG_LEVEL=info
MAX_LOGS_PER_PROJECT=1000
EOF

echo "✅ .env file created"

# Create data directories
echo ""
echo "📁 Creating data directories..."

mkdir -p data/projects data/certificates
chmod 755 data
chmod 755 data/projects
chmod 755 data/certificates

echo "✅ Directories created"

# Start services
echo ""
echo "🚀 Starting QuickHost services..."
echo ""

docker-compose pull
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start (30 seconds)..."
sleep 30

# Check service health
echo ""
echo "🏥 Checking service health..."

if docker-compose ps | grep -q "quickhost-app.*Up"; then
    echo "✅ QuickHost app is running"
else
    echo "❌ QuickHost app failed to start"
    echo "View logs: docker-compose logs quickhost-app"
    exit 1
fi

if docker-compose ps | grep -q "quickhost-nginx.*Up"; then
    echo "✅ NGINX is running"
else
    echo "❌ NGINX failed to start"
    echo "View logs: docker-compose logs quickhost-nginx"
    exit 1
fi

# Get IP information
echo ""
echo "╔════════════════════════════════════════════╗"
echo "║   🎉 QuickHost Setup Complete! 🎉           ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "📌 Configuration Summary:"
echo "   Domain: $ROOT_DOMAIN"
echo "   Base Port: $BASE_PORT"
echo "   Email: $CERTBOT_EMAIL"
echo "   SSL Enabled: Yes"
echo ""
echo "🌐 Access QuickHost at:"
echo "   http://$(hostname -I | awk '{print $1}')"
echo "   http://$ROOT_DOMAIN (after DNS setup)"
echo ""
echo "📚 Next Steps:"
echo "   1. Update DNS records:"
echo "      example.com    A  your.server.ip"
echo "      *.example.com  A  your.server.ip"
echo ""
echo "   2. Open the dashboard:"
echo "      http://$ROOT_DOMAIN"
echo ""
echo "   3. Create your first project!"
echo ""
echo "📖 Documentation: cat README.md"
echo "📊 View logs: docker-compose logs -f"
echo "🛠️  Stop services: docker-compose down"
echo ""
