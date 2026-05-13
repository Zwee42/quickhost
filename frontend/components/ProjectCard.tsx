import React from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  status: 'pending' | 'building' | 'running' | 'stopped' | 'error';
  subdomain: string;
  url: string;
  lastUpdated: string;
}

interface ProjectCardProps {
  project: Project;
  onRefresh?: () => void;
}

const statusColors: Record<string, { bg: string; text: string; icon: string }> = {
  pending: { bg: 'bg-yellow-900', text: 'text-yellow-200', icon: '⏳' },
  building: { bg: 'bg-blue-900', text: 'text-blue-200', icon: '🔨' },
  running: { bg: 'bg-green-900', text: 'text-green-200', icon: '✅' },
  stopped: { bg: 'bg-gray-900', text: 'text-gray-200', icon: '⛔' },
  error: { bg: 'bg-red-900', text: 'text-red-200', icon: '❌' },
};

export default function ProjectCard({ project, onRefresh }: ProjectCardProps) {
  const status = statusColors[project.status];
  const lastUpdated = new Date(project.lastUpdated);
  const timeAgo = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
  const timeString =
    timeAgo < 60
      ? `${timeAgo}s ago`
      : timeAgo < 3600
      ? `${Math.floor(timeAgo / 60)}m ago`
      : `${Math.floor(timeAgo / 3600)}h ago`;

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-slate-600 transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{project.name}</h3>
          <p className="text-sm text-slate-400">{project.subdomain}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${status.bg} ${status.text}`}>
          <span>{status.icon}</span>
          <span className="capitalize">{project.status}</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-slate-400">URL:</span>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 break-all"
          >
            {project.url}
          </a>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-slate-400">Updated:</span>
          <span className="text-slate-300">{timeString}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Link
          href={`/projects/${project.id}`}
          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded text-center transition"
        >
          Details
        </Link>
        <button
          onClick={onRefresh}
          aria-label="Refresh status"
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded transition"
          title="Refresh status"
        >
          🔄
        </button>
      </div>
    </div>
  );
}
