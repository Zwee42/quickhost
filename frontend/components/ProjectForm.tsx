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
    environmentVariables: '{}',
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
        try {
          envVars = JSON.parse(formData.environmentVariables);
        } catch {
          throw new Error('Invalid JSON in environment variables');
        }
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          gitUrl: formData.gitUrl,
          gitBranch: formData.gitBranch,
          subdomain: formData.subdomain,
          enableSsl: formData.enableSsl,
          environmentVariables: envVars,
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
        environmentVariables: '{}',
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

        <div className="grid grid-cols-2 gap-4">
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
              required
            />
            <p className="text-xs text-slate-400 mt-1">Lowercase alphanumeric and hyphens only</p>
          </div>
        </div>

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

        <div>
          <label htmlFor="project-environment-variables" className="block text-sm font-medium mb-2">Environment Variables (JSON)</label>
          <textarea
            id="project-environment-variables"
            name="environmentVariables"
            value={formData.environmentVariables}
            onChange={handleChange}
            placeholder='{"DATABASE_URL": "...","API_KEY": "..."}'
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono text-xs"
            rows={4}
          />
          <p className="text-xs text-slate-400 mt-1">Optional: JSON format environment variables</p>
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
