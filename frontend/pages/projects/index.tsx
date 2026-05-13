import React, { useState } from 'react';
import Layout from '../../components/Layout';
import ProjectForm from '../../components/ProjectForm';
import ProjectList from '../../components/ProjectList';

export default function Projects() {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleProjectCreated = () => {
    setActiveTab('list');
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Projects</h1>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'list'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            All Projects
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Create New
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'list' ? (
          <ProjectList refreshTrigger={refreshTrigger} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ProjectForm onSuccess={handleProjectCreated} />
            
            {/* Info Panel */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 h-fit">
              <h3 className="text-xl font-bold mb-4">Deployment Requirements</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-400 mt-1">✓</span>
                  <span>
                    <strong>Dockerfile:</strong> Your repository must contain a Dockerfile in the root directory
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-400 mt-1">✓</span>
                  <span>
                    <strong>Port:</strong> Your application must listen on port 3000 (can be changed in env vars)
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-400 mt-1">✓</span>
                  <span>
                    <strong>Git Access:</strong> Repository must be publicly accessible or SSH key configured
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-400 mt-1">✓</span>
                  <span>
                    <strong>Subdomain:</strong> Must be unique and only contain lowercase letters, numbers, and hyphens
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-400 mt-1">✓</span>
                  <span>
                    <strong>HTTPS:</strong> Optional Let's Encrypt SSL certificates for your custom domain
                  </span>
                </li>
              </ul>

              <div className="mt-6 p-4 bg-blue-900 bg-opacity-50 border border-blue-700 rounded">
                <p className="text-sm text-blue-200">
                  <strong>Tip:</strong> Environment variables can be passed as JSON. They'll be injected into your Docker container.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
