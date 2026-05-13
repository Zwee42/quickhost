/**
 * Input validation utilities
 */

export const validation = {
  /**
   * Validate subdomain format
   */
  isValidSubdomain(subdomain: string): boolean {
    // Only lowercase alphanumeric and hyphens, no leading/trailing hyphens
    const regex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
    return regex.test(subdomain) && subdomain.length <= 63;
  },

  /**
   * Validate Git URL
   */
  isValidGitUrl(url: string): boolean {
    const httpsRegex = /^https:\/\/github\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+(?:\.git)?$/;
    const sshRegex = /^git@github\.com:[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+(?:\.git)?$/;
    const gitlabHttpsRegex = /^https:\/\/gitlab\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+(?:\.git)?$/;
    const gitlabSshRegex = /^git@gitlab\.com:[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+(?:\.git)?$/;

    return (
      httpsRegex.test(url) ||
      sshRegex.test(url) ||
      gitlabHttpsRegex.test(url) ||
      gitlabSshRegex.test(url)
    );
  },

  /**
   * Validate project name
   */
  isValidProjectName(name: string): boolean {
    // Alphanumeric, underscores, hyphens, no spaces
    const regex = /^[a-zA-Z0-9_-]{3,50}$/;
    return regex.test(name);
  },

  /**
   * Sanitize input to prevent injection attacks
   */
  sanitizeInput(input: string, maxLength: number = 255): string {
    return input
      .substring(0, maxLength)
      .replace(/[<>\"'`]/g, '')
      .trim();
  },

  /**
   * Validate environment variable format
   */
  isValidEnvVar(key: string, value: string): boolean {
    // Key: uppercase letters, numbers, underscores
    const keyRegex = /^[A-Z0-9_]+$/;
    if (!keyRegex.test(key)) return false;

    // Value: avoid extremely long values and null bytes
    if (value.length > 10000 || value.includes('\0')) return false;

    return true;
  },

  /**
   * Validate port number
   */
  isValidPort(port: number | string): boolean {
    const portNum = typeof port === 'string' ? parseInt(port, 10) : port;
    return portNum > 0 && portNum < 65536 && portNum > 1024;
  },

  /**
   * Extract Git repository info from URL
   */
  parseGitUrl(
    url: string
  ): { provider: string; owner: string; repo: string } | null {
    // HTTPS format: https://github.com/owner/repo.git
    const httpsMatch = url.match(
      /https:\/\/([^\/]+)\/([^\/]+)\/([^\/]+?)(?:\.git)?$/
    );
    if (httpsMatch) {
      const [, provider, owner, repo] = httpsMatch;
      return {
        provider: provider.replace('www.', '').replace(/\.com$/, ''),
        owner,
        repo: repo.replace(/\.git$/, ''),
      };
    }

    // SSH format: git@github.com:owner/repo.git
    const sshMatch = url.match(/git@([^:]+):([^\/]+)\/([^\/]+?)(?:\.git)?$/);
    if (sshMatch) {
      const [, provider, owner, repo] = sshMatch;
      return {
        provider: provider.replace('www.', '').replace(/\.com$/, ''),
        owner,
        repo: repo.replace(/\.git$/, ''),
      };
    }

    return null;
  },
};

export default validation;
