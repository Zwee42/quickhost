import React from 'react';

interface Deployment {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  url: string;
  port: number;
  lastUpdated: string;
}

interface DeploymentListProps {
  deployments: Deployment[];
  loading: boolean;
}

export default function DeploymentList({ deployments, loading }: DeploymentListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-400 bg-green-400/10';
      case 'stopped':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'error':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-slate-400 bg-slate-400/10';
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <p className="text-slate-400">Loading deployments...</p>
      </div>
    );
  }

  if (deployments.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <p className="text-slate-400">No deployments yet. Create your first one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Active Deployments</h2>
      
      {deployments.map((deployment) => (
        <div
          key={deployment.id}
          className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold">{deployment.name}</h3>
              <p className="text-slate-400 text-sm">Port {deployment.port}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(deployment.status)}`}>
              {deployment.status.toUpperCase()}
            </span>
          </div>
          
          <div className="mb-3">
            <a
              href={deployment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm break-all"
            >
              {deployment.url}
            </a>
          </div>
          
          <div className="text-slate-400 text-xs">
            Last updated: {new Date(deployment.lastUpdated).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
