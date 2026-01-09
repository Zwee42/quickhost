import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Container } from '@/types';

export default function ContainerDetails() {
  const router = useRouter();
  const { id } = router.query;
  
  const [container, setContainer] = useState<Container | null>(null);
  const [logs, setLogs] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'logs'>('overview');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchContainer = useCallback(async () => {
    if (!id) return;
    
    try {
      const res = await fetch(`/api/containers/${id}`);
      if (res.ok) {
        const data = await res.json();
        setContainer(data);
      } else if (res.status === 404) {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to fetch container:', error);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const fetchLogs = useCallback(async () => {
    if (!id || activeTab !== 'logs') return;
    
    try {
      const res = await fetch(`/api/containers/${id}/logs?tail=200`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || 'No logs available');
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  }, [id, activeTab]);

  useEffect(() => {
    fetchContainer();
    const interval = setInterval(fetchContainer, 5000);
    return () => clearInterval(interval);
  }, [fetchContainer]);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
      const interval = setInterval(fetchLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchLogs]);

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    if (!id) return;
    
    setActionLoading(action);
    try {
      const res = await fetch(`/api/containers/${id}/${action}`, { method: 'POST' });
      if (res.ok) {
        showToast('success', `Container ${action}ed successfully`);
        fetchContainer();
      } else {
        const data = await res.json();
        showToast('error', data.error || `Failed to ${action} container`);
      }
    } catch (error) {
      showToast('error', `Failed to ${action} container`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!id || !container) return;
    
    if (!confirm(`Are you sure you want to delete "${container.name}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading('delete');
    try {
      const res = await fetch(`/api/containers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', 'Container deleted successfully');
        router.push('/');
      } else {
        const data = await res.json();
        showToast('error', data.error || 'Failed to delete container');
      }
    } catch (error) {
      showToast('error', 'Failed to delete container');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: Container['status']) => {
    return (
      <span className={`status-badge status-${status}`}>
        <span className="status-dot"></span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading container...</p>
      </div>
    );
  }

  if (!container) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <h2>Container not found</h2>
        <Link href="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Link href="/" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          ← Back to Dashboard
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: '8px' }}>
              {container.repo}
              <span style={{ marginLeft: '12px' }}>{getStatusBadge(container.status)}</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {container.user}/{container.repo}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            {container.status === 'stopped' && (
              <button
                className="btn btn-primary"
                onClick={() => handleAction('start')}
                disabled={actionLoading === 'start'}
              >
                {actionLoading === 'start' ? <span className="spinner"></span> : '▶ Start'}
              </button>
            )}
            {container.status === 'running' && (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleAction('stop')}
                  disabled={actionLoading === 'stop'}
                >
                  {actionLoading === 'stop' ? <span className="spinner"></span> : '⏹ Stop'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleAction('restart')}
                  disabled={actionLoading === 'restart'}
                >
                  {actionLoading === 'restart' ? <span className="spinner"></span> : '🔄 Restart'}
                </button>
              </>
            )}
            <button
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={actionLoading === 'delete'}
            >
              {actionLoading === 'delete' ? <span className="spinner"></span> : '🗑 Delete'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '24px',
      }}>
        <button
          className={`btn btn-secondary`}
          style={{
            borderRadius: '8px 8px 0 0',
            border: 'none',
            borderBottom: activeTab === 'overview' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
          }}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`btn btn-secondary`}
          style={{
            borderRadius: '8px 8px 0 0',
            border: 'none',
            borderBottom: activeTab === 'logs' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
          }}
          onClick={() => setActiveTab('logs')}
        >
          Logs
        </button>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Container Details</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    Container ID
                  </div>
                  <code style={{ 
                    backgroundColor: 'var(--bg-primary)', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontSize: '13px',
                  }}>
                    {container.id}
                  </code>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    Container Name
                  </div>
                  <div>{container.name}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    Created
                  </div>
                  <div>{formatDate(container.createdAt)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Network</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    Host Port
                  </div>
                  <div>{container.port}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    Access URL
                  </div>
                  <a 
                    href={`http://localhost:${container.port}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    http://localhost:{container.port}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Repository</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    Repository URL
                  </div>
                  <div style={{ wordBreak: 'break-all' }}>{container.repoUrl}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    GitHub
                  </div>
                  <a 
                    href={`https://github.com/${container.user}/${container.repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    {container.user}/{container.repo}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Container Logs</h3>
            <button className="btn btn-secondary btn-sm" onClick={fetchLogs}>
              🔄 Refresh
            </button>
          </div>
          <div className="card-body">
            <div className="logs-container">
              {logs || 'No logs available. The container may not be running.'}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? '✓' : '✕'} {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
