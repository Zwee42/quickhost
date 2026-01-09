import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Container } from '@/types';

export default function Home() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchContainers = useCallback(async () => {
    try {
      const res = await fetch('/api/containers');
      if (res.ok) {
        const data = await res.json();
        setContainers(data);
      }
    } catch (error) {
      console.error('Failed to fetch containers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 5000);
    return () => clearInterval(interval);
  }, [fetchContainers]);

  const handleAction = async (id: string, action: 'start' | 'stop' | 'restart') => {
    setActionLoading(`${id}-${action}`);
    try {
      const res = await fetch(`/api/containers/${id}/${action}`, { method: 'POST' });
      if (res.ok) {
        showToast('success', `Container ${action}ed successfully`);
        fetchContainers();
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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(`${id}-delete`);
    try {
      const res = await fetch(`/api/containers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', 'Container deleted successfully');
        fetchContainers();
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading containers...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Containers</h1>
        <Link href="/new" className="btn btn-primary">
          + New Container
        </Link>
      </div>

      {containers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h2 className="empty-state-title">No containers yet</h2>
          <p className="empty-state-text">
            Get started by creating your first container from a Git repository.
          </p>
          <Link href="/new" className="btn btn-primary">
            Create First Container
          </Link>
        </div>
      ) : (
        <div className="container-grid">
          {containers.map((container) => (
            <div key={container.id} className="container-card">
              <div className="container-card-header">
                <div>
                  <h3 className="container-name">{container.repo}</h3>
                  <div className="container-repo">
                    <span>📁</span>
                    <span>{container.user}/{container.repo}</span>
                  </div>
                </div>
                {getStatusBadge(container.status)}
              </div>

              <div className="container-info">
                <div className="container-info-row">
                  <span>🌐</span>
                  <span>Port: <strong>{container.port}</strong></span>
                </div>
                <div className="container-info-row">
                  <span>📅</span>
                  <span>Created: {formatDate(container.createdAt)}</span>
                </div>
                <div className="container-info-row">
                  <span>🔗</span>
                  <a 
                    href={`http://localhost:${container.port}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    localhost:{container.port}
                  </a>
                </div>
              </div>

              <div className="container-actions">
                {container.status === 'stopped' && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleAction(container.id, 'start')}
                    disabled={actionLoading === `${container.id}-start`}
                  >
                    {actionLoading === `${container.id}-start` ? (
                      <span className="spinner"></span>
                    ) : (
                      '▶ Start'
                    )}
                  </button>
                )}
                {container.status === 'running' && (
                  <>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleAction(container.id, 'stop')}
                      disabled={actionLoading === `${container.id}-stop`}
                    >
                      {actionLoading === `${container.id}-stop` ? (
                        <span className="spinner"></span>
                      ) : (
                        '⏹ Stop'
                      )}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleAction(container.id, 'restart')}
                      disabled={actionLoading === `${container.id}-restart`}
                    >
                      {actionLoading === `${container.id}-restart` ? (
                        <span className="spinner"></span>
                      ) : (
                        '🔄 Restart'
                      )}
                    </button>
                  </>
                )}
                <Link 
                  href={`/containers/${container.id}`} 
                  className="btn btn-secondary btn-sm"
                >
                  📋 Details
                </Link>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(container.id, container.name)}
                  disabled={actionLoading === `${container.id}-delete`}
                >
                  {actionLoading === `${container.id}-delete` ? (
                    <span className="spinner"></span>
                  ) : (
                    '🗑 Delete'
                  )}
                </button>
              </div>
            </div>
          ))}
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
