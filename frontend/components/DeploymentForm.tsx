import React, { useState } from 'react';

interface DeploymentFormProps {
  onDeploy: (config: any) => Promise<void>;
}

export default function DeploymentForm({ onDeploy }: DeploymentFormProps) {
  const [formData, setFormData] = useState({
    repoUrl: '',
    user: '',
    repo: '',
    branch: 'main',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onDeploy(formData);
      setFormData({ repoUrl: '', user: '', repo: '', branch: 'main' });
      alert('Deployment started!');
    } catch (error) {
      alert('Deployment failed: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h2 className="text-2xl font-bold mb-4">Deploy New App</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">GitHub User</label>
          <input
            type="text"
            name="user"
            value={formData.user}
            onChange={handleChange}
            placeholder="your-username"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Repository Name</label>
          <input
            type="text"
            name="repo"
            value={formData.repo}
            onChange={handleChange}
            placeholder="my-nextjs-app"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Branch</label>
          <input
            type="text"
            name="branch"
            value={formData.branch}
            onChange={handleChange}
            placeholder="main"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded transition"
        >
          {loading ? 'Deploying...' : 'Deploy'}
        </button>
      </form>
    </div>
  );
}
