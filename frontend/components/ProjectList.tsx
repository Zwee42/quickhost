import React, { useEffect, useState } from 'react';
import ProjectCard from './ProjectCard';

interface Project {
  id: string;
  name: string;
  status: 'pending' | 'building' | 'running' | 'stopped' | 'error';
  subdomain: string;
  url: string;
  lastUpdated: string;
}

interface ProjectListProps {
  refreshTrigger?: number;
}

export default function ProjectList({ refreshTrigger }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped' | 'error'>('all');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // Refresh every 10 seconds
    const interval = setInterval(fetchProjects, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (refreshTrigger) {
      fetchProjects();
    }
  }, [refreshTrigger]);

  const filteredProjects =
    filter === 'all' ? projects : projects.filter((p) => p.status === filter || (filter === 'error' && p.status === 'error'));

  const statusStats = {
    running: projects.filter((p) => p.status === 'running').length,
    stopped: projects.filter((p) => p.status === 'stopped').length,
    error: projects.filter((p) => p.status === 'error').length,
    pending: projects.filter((p) => p.status === 'pending' || p.status === 'building').length,
  };

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-blue-400 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error && projects.length === 0) {
    return (
      <div className="bg-red-900 border border-red-700 rounded-lg p-4 text-red-200">
        <p className="font-semibold mb-2">Error loading projects</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchProjects}
          className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 rounded transition text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-900 bg-opacity-50 border border-green-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-200">{statusStats.running}</div>
          <div className="text-sm text-green-300">Running</div>
        </div>
        <div className="bg-gray-900 bg-opacity-50 border border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-200">{statusStats.stopped}</div>
          <div className="text-sm text-gray-300">Stopped</div>
        </div>
        <div className="bg-blue-900 bg-opacity-50 border border-blue-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-200">{statusStats.pending}</div>
          <div className="text-sm text-blue-300">Building</div>
        </div>
        <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-200">{statusStats.error}</div>
          <div className="text-sm text-red-300">Errors</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6">
        {(['all', 'running', 'stopped', 'error'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded transition text-sm font-medium capitalize ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
          <p className="text-slate-400 text-lg">
            {projects.length === 0 ? 'No projects yet.' : 'No projects matching the filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onRefresh={fetchProjects} />
          ))}
        </div>
      )}
    </div>
  );
}
