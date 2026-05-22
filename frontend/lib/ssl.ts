import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export class SSLService {
  private certDir = process.env.CERT_PATH || '/data/certificates';
  private certbotEmail = process.env.CERTBOT_EMAIL || 'admin@example.com';
  private certbotAgreeTos = process.env.CERTBOT_AGREE_TOS !== 'false';

  constructor() {
    if (!fs.existsSync(this.certDir)) {
      fs.mkdirSync(this.certDir, { recursive: true });
    }
  }

  /**
   * Check if domain has valid SSL certificate
   */
  async hasCertificate(domain: string): Promise<boolean> {
    const certPath = path.join(this.certDir, domain, 'cert.pem');
    const keyPath = path.join(this.certDir, domain, 'private.key');

    return fs.existsSync(certPath) && fs.existsSync(keyPath);
  }

  /**
   * Get certificate paths
   */
  getCertificatePaths(domain: string): { cert: string; key: string } {
    return {
      cert: path.join(this.certDir, domain, 'cert.pem'),
      key: path.join(this.certDir, domain, 'private.key'),
    };
  }

  /**
   * Request certificate using Certbot
   */
  async requestCertificate(
    domain: string,
    email: string = this.certbotEmail
  ): Promise<{ cert: string; key: string }> {
    try {
      const domainCertDir = path.join(this.certDir, domain);

      if (!fs.existsSync(domainCertDir)) {
        fs.mkdirSync(domainCertDir, { recursive: true });
      }

      // Use certbot to request certificate
      let cmd = `certbot certonly --standalone -d ${domain} --email ${email}`;

      if (this.certbotAgreeTos) {
        cmd += ` --agree-tos`;
      }

      cmd += ` --non-interactive --quiet`;

      try {
        await execAsync(cmd, { timeout: 300000 });
      } catch {
        // Certificate might already exist, try to renew
        await execAsync(`certbot renew --quiet`, { timeout: 300000 });
      }

      // Copy certificates to our directory
      const letsEncryptDir = `/etc/letsencrypt/live/${domain}`;

      if (fs.existsSync(letsEncryptDir)) {
        const sourceKey = path.join(letsEncryptDir, 'privkey.pem');
        const sourceCert = path.join(letsEncryptDir, 'fullchain.pem');
        const destKey = path.join(domainCertDir, 'private.key');
        const destCert = path.join(domainCertDir, 'cert.pem');

        fs.copyFileSync(sourceKey, destKey);
        fs.copyFileSync(sourceCert, destCert);

        return { cert: destCert, key: destKey };
      }

      throw new Error(
        'Certificate was not created. Check Certbot output for errors.'
      );
    } catch (error: any) {
      throw new Error(`Failed to request certificate: ${error.message}`);
    }
  }

  /**
   * Renew all certificates
   */
  async renewAllCertificates(): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(`certbot renew --quiet`, {
        timeout: 600000,
      });
      return stdout + stderr;
    } catch (error: any) {
      throw new Error(`Failed to renew certificates: ${error.message}`);
    }
  }

  /**
   * Check certificate expiration date
   */
  async getCertificateExpiration(domain: string): Promise<Date | null> {
    try {
      const { stdout } = await execAsync(
        `certbot certificates --json 2>/dev/null || echo "{}"`,
        { shell: '/bin/bash' }
      );

      let certs;
      try {
        certs = JSON.parse(stdout);
      } catch {
        return null;
      }

      if (!certs.certificates) return null;

      const cert = certs.certificates.find((c: any) =>
        c.domains.includes(domain)
      );

      if (cert && cert.expiry_date) {
        return new Date(cert.expiry_date);
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Delete certificate
   */
  async deleteCertificate(domain: string): Promise<void> {
    try {
      const domainCertDir = path.join(this.certDir, domain);

      // Delete local copy
      if (fs.existsSync(domainCertDir)) {
        fs.rmSync(domainCertDir, { recursive: true, force: true });
      }

      // Try to revoke and delete from Let's Encrypt
      try {
        await execAsync(
          `certbot delete -n --cert-name ${domain} --quiet 2>/dev/null || true`,
          { shell: '/bin/bash' }
        );
      } catch {
        // Ignore errors during revocation
      }
    } catch (error: any) {
      throw new Error(`Failed to delete certificate: ${error.message}`);
    }
  }

  /**
   * Create self-signed certificate (for testing)
   */
  async createSelfSignedCert(
    domain: string,
    days: number = 365
  ): Promise<{ cert: string; key: string }> {
    try {
      const domainCertDir = path.join(this.certDir, domain);

      if (!fs.existsSync(domainCertDir)) {
        fs.mkdirSync(domainCertDir, { recursive: true });
      }

      const keyPath = path.join(domainCertDir, 'private.key');
      const certPath = path.join(domainCertDir, 'cert.pem');

      const cmd = `openssl req -x509 -newkey rsa:4096 -keyout ${keyPath} -out ${certPath} -days ${days} -nodes -subj "/CN=${domain}"`;

      await execAsync(cmd);

      return { cert: certPath, key: keyPath };
    } catch (error: any) {
      throw new Error(
        `Failed to create self-signed certificate: ${error.message}`
      );
    }
  }
}

const sslService = new SSLService();
export default sslService;
