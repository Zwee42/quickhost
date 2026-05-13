import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface NginxServerConfig {
  serverName: string;
  upstreamName: string;
  containerPort: number;
  containerName: string;
  useSsl: boolean;
  certPath?: string;
  keyPath?: string;
}

export class NginxService {
  private nginxConfDir = process.env.NGINX_CONF_DIR || '/etc/nginx/conf.d';
  private configBackupDir = '/data/nginx-backups';

  constructor() {
    if (!fs.existsSync(this.configBackupDir)) {
      fs.mkdirSync(this.configBackupDir, { recursive: true });
    }
  }

  /**
   * Generate NGINX upstream block
   */
  private generateUpstream(config: NginxServerConfig): string {
    return `
upstream ${config.upstreamName} {
    server ${config.containerName}:${config.containerPort} max_fails=3 fail_timeout=30s;
}
`;
  }

  /**
   * Generate NGINX server block
   */
  private generateServerBlock(config: NginxServerConfig): string {
    let block = `
server {
    listen 80;
    server_name ${config.serverName};
`;

    if (config.useSsl) {
      block += `
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${config.serverName};

    # SSL certificates
    ssl_certificate ${config.certPath || '/etc/ssl/certs/default.crt'};
    ssl_certificate_key ${config.keyPath || '/etc/ssl/private/default.key'};

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
`;
    }

    block += `
    # Proxy settings
    proxy_pass http://${config.upstreamName};
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Buffering
    proxy_buffering off;

    location / {
        proxy_pass http://${config.upstreamName};
    }

    location ~ ^/\.well-known/acme-challenge/ {
        default_type "text/plain";
        root /var/www/certbot;
    }
}
`;

    return block;
  }

  /**
   * Generate complete NGINX config for a project
   */
  generateConfig(config: NginxServerConfig): string {
    const upstream = this.generateUpstream(config);
    const server = this.generateServerBlock(config);
    return upstream + server;
  }

  /**
   * Write NGINX config file
   */
  async writeConfig(config: NginxServerConfig): Promise<string> {
    const fileName = `${config.serverName.replace(/\./g, '-')}.conf`;
    const filePath = path.join(this.nginxConfDir, fileName);

    const content = this.generateConfig(config);

    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      return filePath;
    } catch (error: any) {
      throw new Error(`Failed to write NGINX config: ${error.message}`);
    }
  }

  /**
   * Remove NGINX config file
   */
  async removeConfig(serverName: string): Promise<void> {
    const fileName = `${serverName.replace(/\./g, '-')}.conf`;
    const filePath = path.join(this.nginxConfDir, fileName);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error: any) {
      throw new Error(`Failed to remove NGINX config: ${error.message}`);
    }
  }

  /**
   * Test NGINX configuration
   */
  async testConfig(): Promise<boolean> {
    try {
      await execAsync('nginx -t');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reload NGINX
   */
  async reloadNginx(): Promise<void> {
    try {
      // Try Docker first
      try {
        await execAsync('docker exec quickhost-nginx nginx -s reload');
      } catch {
        // Fall back to system nginx
        await execAsync('nginx -s reload');
      }
    } catch (error: any) {
      throw new Error(`Failed to reload NGINX: ${error.message}`);
    }
  }

  /**
   * Backup current NGINX configuration
   */
  async backupConfig(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.configBackupDir, `nginx-backup-${timestamp}.tar.gz`);

    try {
      await execAsync(`tar -czf ${backupPath} -C ${this.nginxConfDir} .`);
      return backupPath;
    } catch (error: any) {
      throw new Error(`Failed to backup NGINX config: ${error.message}`);
    }
  }

  /**
   * Get all NGINX configs
   */
  getAllConfigs(): string[] {
    try {
      if (!fs.existsSync(this.nginxConfDir)) {
        return [];
      }
      return fs
        .readdirSync(this.nginxConfDir)
        .filter((file) => file.endsWith('.conf'))
        .map((file) => path.join(this.nginxConfDir, file));
    } catch {
      return [];
    }
  }
}

export default new NginxService();
