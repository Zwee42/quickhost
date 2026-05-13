import React from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';

export default function Home() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Self-Hosted Web Platform
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            Deploy multiple projects instantly. Git URL → Dockerfile → Live website.
            <br />
            Zero manual intervention required.
          </p>

          <Link
            href="/projects"
            className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition transform hover:scale-105"
          >
            Get Started →
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {[
            {
              icon: '🚀',
              title: 'Instant Deployment',
              description: 'Deploy from any Git repository with a Dockerfile in seconds',
            },
            {
              icon: '🌐',
              title: 'Auto DNS Routing',
              description: 'Automatic NGINX configuration and subdomain routing',
            },
            {
              icon: '🔒',
              title: 'SSL Certificates',
              description: 'Automatic Let\'s Encrypt HTTPS for all projects',
            },
            {
              icon: '🐳',
              title: 'Docker Isolation',
              description: 'Each project runs in isolated Docker containers',
            },
            {
              icon: '📊',
              title: 'Live Monitoring',
              description: 'Real-time logs and container status tracking',
            },
            {
              icon: '⚙️',
              title: 'Environment Variables',
              description: 'Easy configuration management per project',
            },
          ].map((feature, idx) => (
            <div key={idx} className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto bg-slate-800 rounded-lg p-8 border border-slate-700">
          <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>

          <div className="space-y-6">
            {[
              {
                step: '1',
                title: 'Enter Git URL & Subdomain',
                description: 'Provide your repository URL and choose a subdomain',
              },
              {
                step: '2',
                title: 'System Clones & Builds',
                description: 'Repository is automatically cloned and Docker image is built',
              },
              {
                step: '3',
                title: 'Container Deployed',
                description: 'Container starts in isolated Docker network',
              },
              {
                step: '4',
                title: 'NGINX Configured',
                description: 'Subdomain automatically routed to your container',
              },
              {
                step: '5',
                title: 'SSL Enabled',
                description: 'Let\'s Encrypt certificate automatically issued and renewed',
              },
              {
                step: '6',
                title: 'Live & Monitored',
                description: 'Project is now live with real-time logs and status tracking',
              },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{item.title}</h4>
                  <p className="text-slate-400 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
