import { useState } from 'react';
import { useRouter } from 'next/router';

export default function NewContainer() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    repoUrl: '',
    port: 3001,
    envVars: '',
    deployKeyPath: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Parse environment variables
      const envVars: Record<string, string> = {};
      if (formData.envVars.trim()) {
        formData.envVars.split('\n').forEach(line => {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            envVars[key.trim()] = valueParts.join('=').trim();
          }
        });
      }

      const res = await fetch('/api/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: formData.repoUrl,
          port: formData.port,
          envVars: Object.keys(envVars).length > 0 ? envVars : undefined,
          deployKeyPath: formData.deployKeyPath || undefined,
        }),
      });

      if (res.ok) {
        router.push('/');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create container');
      }
    } catch (err) {
      setError('Failed to create container');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value) || 0 : value,
    }));
  };

  return (
    <div className="container" style={{ maxWidth: '600px', paddingTop: '32px' }}>
      <h1 className="page-title" style={{ marginBottom: '32px' }}>Create New Container</h1>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-body">
          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(248, 81, 73, 0.1)',
              border: '1px solid var(--accent-danger)',
              borderRadius: '6px',
              color: 'var(--accent-danger)',
              marginBottom: '20px',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Git Repository URL *</label>
            <input
              type="text"
              name="repoUrl"
              className="form-input"
              placeholder="https://github.com/username/repo.git"
              value={formData.repoUrl}
              onChange={handleChange}
              required
            />
            <p className="form-hint">
              Supports HTTPS and SSH URLs. For private repos, provide a deploy key.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Host Port *</label>
            <input
              type="number"
              name="port"
              className="form-input"
              placeholder="3001"
              value={formData.port}
              onChange={handleChange}
              min={1024}
              max={65535}
              required
            />
            <p className="form-hint">
              Port to expose on the host machine (1024-65535). The app will be accessible at localhost:PORT.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Deploy Key Path (Optional)</label>
            <input
              type="text"
              name="deployKeyPath"
              className="form-input"
              placeholder="/path/to/id_deploy"
              value={formData.deployKeyPath}
              onChange={handleChange}
            />
            <p className="form-hint">
              Required for private repositories using SSH URLs.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Environment Variables (Optional)</label>
            <textarea
              name="envVars"
              className="form-input form-textarea"
              placeholder="DATABASE_URL=postgresql://localhost:5432/db&#10;API_KEY=your-api-key"
              value={formData.envVars}
              onChange={handleChange}
              rows={5}
            />
            <p className="form-hint">
              One variable per line in KEY=VALUE format. These will be passed to the container.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => router.push('/')}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating...
              </>
            ) : (
              'Create Container'
            )}
          </button>
        </div>
      </form>

      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>ℹ️ How it works</h3>
        </div>
        <div className="card-body" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>QuickHost clones your Git repository</li>
            <li>Installs dependencies with <code>npm install</code></li>
            <li>Builds your Next.js app with <code>npm run build</code></li>
            <li>Runs your app using PM2 for process management</li>
            <li>Automatically pulls updates and rebuilds every 60 seconds</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
