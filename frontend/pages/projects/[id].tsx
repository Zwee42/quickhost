import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

interface Project {
  id: string;
  name: string;
  status: 'pending' | 'building' | 'running' | 'stopped' | 'error';
  subdomain: string;
  url: string;
  containerName: string;
  containerPort: number;
  lastUpdated: string;
}

interface LogEntry {
  type: 'info' | 'warn' | 'error';
  message: string;
  createdAt: string;
}

type LogView = 'app' | 'container';

const statusColors: Record<string, { bg: string; text: string; icon: string }> = {
  pending: { bg: 'bg-yellow-900', text: 'text-yellow-200', icon: '⏳' },
  building: { bg: 'bg-blue-900', text: 'text-blue-200', icon: '🔨' },
  running: { bg: 'bg-green-900', text: 'text-green-200', icon: '✅' },
  stopped: { bg: 'bg-gray-900', text: 'text-gray-200', icon: '⛔' },
  error: { bg: 'bg-red-900', text: 'text-red-200', icon: '❌' },
};

export default function ProjectDetails() {
  const router = useRouter();
  const { id } = router.query;

  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<LogEntry[] | string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [logView, setLogView] = useState<LogView>('app');

  const fetchProject = useCallback(async () => {
    if (!id) return;

    try {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }
      const data = await response.json();
      setProject(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchLogs = useCallback(async () => {
    if (!id) return;

    try {
      const logType = logView === 'app' ? 'app' : 'container';
      const response = await fetch(`/api/projects/${id}/logs?type=${logType}`);
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }
      const data = logView === 'app' ? await response.json() : await response.text();
      setLogs(data);
    } catch (err: any) {
      console.error('Failed to fetch logs:', err);
    }
  }, [id, logView]);

  useEffect(() => {
    fetchProject();
    const interval = setInterval(fetchProject, 5000);
    return () => clearInterval(interval);
  }, [fetchProject]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const handleAction = async (action: 'restart' | 'stop') => {
    if (!id) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/projects/${id}/${action}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Action failed');
      }

      fetchProject();
    } catch (err: any) {
      alert(`Failed to ${action} project: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Delete failed');
      }

      router.push('/projects');
    } catch (err: any) {
      alert(`Failed to delete project: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-blue-400 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400">Loading project...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 text-red-200">
            <p className="font-semibold mb-2">Error loading project</p>
            <p className="text-sm">{error || 'Project not found'}</p>
            <button
              onClick={() => router.push('/projects')}
              className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 rounded transition text-sm font-medium"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const status = statusColors[project.status];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <button
              onClick={() => router.push('/projects')}
              className="text-blue-400 hover:text-blue-300 mb-2 text-sm"
            >
              ← Back to Projects
            </button>
            <h1 className="text-4xl font-bold">{project.name}</h1>
            <p className="text-slate-400 mt-1">{project.subdomain}</p>
          </div>

          <div className={`px-4 py-2 rounded-lg text-lg font-semibold flex items-center space-x-2 ${status.bg} ${status.text}`}>
            <span>{status.icon}</span>
            <span className="capitalize">{project.status}</span>
          </div>
        </div>

        {/* Project Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <p className="text-slate-400 text-sm mb-1">URL</p>
            <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 break-all">
              {project.url}
            </a>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <p className="text-slate-400 text-sm mb-1">Container</p>
            <p className="text-white font-mono text-sm break-all">{project.containerName}</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <p className="text-slate-400 text-sm mb-1">Port</p>
            <p className="text-white text-lg font-semibold">{project.containerPort}</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <p className="text-slate-400 text-sm mb-1">Updated</p>
            <p className="text-white text-sm">{new Date(project.lastUpdated).toLocaleString()}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 mb-8">
          <button
            onClick={() => handleAction('restart')}
            disabled={actionLoading || project.status === 'building' || project.status === 'pending'}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium rounded transition"
          >
            {actionLoading ? 'Loading...' : '🔄 Restart'}
          </button>

          <button
            onClick={() => handleAction('stop')}
            disabled={actionLoading || project.status === 'building' || project.status === 'pending' || project.status === 'stopped'}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-600 text-white font-medium rounded transition"
          >
            {actionLoading ? 'Loading...' : '⛔ Stop'}
          </button>

          <button
            onClick={handleDelete}
            disabled={actionLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white font-medium rounded transition"
          >
            {actionLoading ? 'Loading...' : '🗑️ Delete'}
          </button>

          <button
            onClick={fetchProject}
            disabled={actionLoading}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded transition ml-auto"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Logs */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Logs</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setLogView('app')}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  logView === 'app'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                Application
              </button>
              <button
                onClick={() => setLogView('container')}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  logView === 'container'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                Container
              </button>
            </div>
          </div>

          <div className="bg-slate-950 rounded p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-96 overflow-y-auto border border-slate-700">
            {Array.isArray(logs) ? (
              logs.length === 0 ? (
                <p className="text-slate-500">No logs available yet.</p>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className={`py-1 ${log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-yellow-400' : 'text-slate-300'}`}>
                    <span className="text-slate-500">[{log.type.toUpperCase()}]</span> {log.message}
                  </div>
                ))
              )
            ) : (
              logs
                .split('\n')
                .filter((line) => line.trim())
                .map((line, idx) => (
                  <div key={idx} className="py-1">
                    {line}
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
