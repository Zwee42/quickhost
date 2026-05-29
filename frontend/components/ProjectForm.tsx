import React, { useState } from 'react';
import { useRouter } from 'next/router';

interface ProjectFormProps {
  onSuccess?: () => void;
}

export default function ProjectForm({ onSuccess }: ProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    gitUrl: '',
    gitBranch: 'main',
    subdomain: '',
    enableSsl: true,
    testMode: false,
    environmentVariables: '',
    dockerfilePath: 'Dockerfile',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Parse environment variables
      let envVars: Record<string, string> = {};
      if (formData.environmentVariables.trim()) {
        const lines = formData.environmentVariables.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx === -1) {
            throw new Error(`Invalid environment variable format: ${trimmed}`);
          }
          const key = trimmed.substring(0, eqIdx).trim();
          const value = trimmed.substring(eqIdx + 1).trim();
          if (key) {
            envVars[key] = value;
          }
        }
      }

      let finalSubdomain = formData.subdomain;
      if (formData.testMode && !finalSubdomain) {
        // Generate a basic subdomain based on the name for internal tracking
        finalSubdomain = `${formData.name.toLowerCase().replace(/[^a-z0-9-]/g, '')}-test`;
        if (finalSubdomain.length < 3) finalSubdomain += 'app';
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          gitUrl: formData.gitUrl,
          gitBranch: formData.gitBranch,
          subdomain: finalSubdomain,
          enableSsl: formData.enableSsl,
          testMode: formData.testMode,
          environmentVariables: envVars,
          dockerfilePath: formData.dockerfilePath,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create project');
      }

      const project = await response.json();
      setFormData({
        name: '',
        gitUrl: '',
        gitBranch: 'main',
        subdomain: '',
        enableSsl: true,
        testMode: false,
        environmentVariables: '',
        dockerfilePath: 'Dockerfile',
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/projects/${project.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h2 className="text-2xl font-bold mb-4">Deploy New Project</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="project-name" className="block text-sm font-medium mb-2">Project Name*</label>
          <input
            id="project-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="my-awesome-app"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            required
          />
          <p className="text-xs text-slate-400 mt-1">3-50 characters, alphanumeric with hyphens/underscores</p>
        </div>

        <div>
          <label htmlFor="project-git-url" className="block text-sm font-medium mb-2">Git Repository URL*</label>
          <input
            id="project-git-url"
            type="text"
            name="gitUrl"
            value={formData.gitUrl}
            onChange={handleChange}
            placeholder="https://github.com/username/repo.git"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            required
          />
          <p className="text-xs text-slate-400 mt-1">Supports GitHub, GitLab (HTTPS or SSH)</p>
        </div>

        <div className={formData.testMode ? "grid grid-cols-1 gap-4" : "grid grid-cols-2 gap-4"}>
          <div>
            <label htmlFor="project-git-branch" className="block text-sm font-medium mb-2">Branch</label>
            <input
              id="project-git-branch"
              type="text"
              name="gitBranch"
              value={formData.gitBranch}
              onChange={handleChange}
              placeholder="main"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {!formData.testMode && (
            <div>
              <label htmlFor="project-subdomain" className="block text-sm font-medium mb-2">Subdomain*</label>
              <input
                id="project-subdomain"
                type="text"
                name="subdomain"
                value={formData.subdomain}
                onChange={handleChange}
                placeholder="my-app"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                required={!formData.testMode}
              />
              <p className="text-xs text-slate-400 mt-1">Lowercase alphanumeric and hyphens only</p>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="project-dockerfile-path" className="block text-sm font-medium mb-2">Dockerfile Path</label>
          <input
            id="project-dockerfile-path"
            type="text"
            name="dockerfilePath"
            value={formData.dockerfilePath}
            onChange={handleChange}
            placeholder="Dockerfile"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-slate-400 mt-1">Path relative to the root of the repository. Example: `path/to/Dockerfile`</p>
        </div>

        <div>
          <label className="flex items-center space-x-2 text-sm font-medium mb-4">
            <input
              id="project-test-mode"
              type="checkbox"
              name="testMode"
              checked={formData.testMode}
              onChange={handleChange}
              className="w-4 h-4 bg-slate-700 border border-slate-600 rounded"
            />
            <span className="text-blue-300 font-bold">Enable Test Mode (Local Only)</span>
          </label>
          <p className="text-xs text-slate-400 mt-1 mb-2">Skips NGINX/SSL configuration and exposes container locally only.</p>
        </div>

        {!formData.testMode && (
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium">
              <input
                id="project-enable-ssl"
                type="checkbox"
                name="enableSsl"
                checked={formData.enableSsl}
                onChange={handleChange}
                className="w-4 h-4 bg-slate-700 border border-slate-600 rounded"
              />
              <span>Enable HTTPS with Let&apos;s Encrypt</span>
            </label>
            <p className="text-xs text-slate-400 mt-1">Automatic SSL certificates for your domain</p>
          </div>
        )}

        <div>
          <label htmlFor="project-environment-variables" className="block text-sm font-medium mb-2">Environment Variables</label>
          <textarea
            id="project-environment-variables"
            name="environmentVariables"
            value={formData.environmentVariables}
            onChange={handleChange}
            placeholder="DATABASE_URL=postgres://...&#10;API_KEY=secret"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono text-xs"
            rows={4}
          />
          <p className="text-xs text-slate-400 mt-1">Optional: KEY=VALUE format, one per line</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded transition"
        >
          {loading ? 'Deploying...' : 'Deploy Project'}
        </button>
      </form>
    </div>
  );
}
