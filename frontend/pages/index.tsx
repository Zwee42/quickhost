import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import DeploymentForm from '../components/DeploymentForm';
import DeploymentList from '../components/DeploymentList';

interface Deployment {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  url: string;
  port: number;
  lastUpdated: string;
}

export default function Home() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch deployments from API
    const fetchDeployments = async () => {
      try {
        const response = await fetch('/api/deployments');
        if (response.ok) {
          const data = await response.json();
          setDeployments(data);
        }
      } catch (error) {
        console.error('Failed to fetch deployments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeployments();
  }, []);

  const handleDeploy = async (config: any) => {
    try {
      const response = await fetch('/api/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (response.ok) {
        const newDeployment = await response.json();
        setDeployments([...deployments, newDeployment]);
      }
    } catch (error) {
      console.error('Deployment failed:', error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">QuickHost</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <DeploymentForm onDeploy={handleDeploy} />
          </div>
          
          <div className="lg:col-span-2">
            <DeploymentList deployments={deployments} loading={loading} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
