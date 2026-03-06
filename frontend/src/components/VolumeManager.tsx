import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/api';
import { Volume, Datacenter } from '../types';
import { HardDrive, Plus, Trash2, RefreshCw, Database } from 'lucide-react';

const VolumeManager: React.FC = () => {
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [datacenters, setDatacenters] = useState<Datacenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create volume form state
  const [newVolumeName, setNewVolumeName] = useState('');
  const [newVolumeSize, setNewVolumeSize] = useState('50');
  const [newVolumeDatacenter, setNewVolumeDatacenter] = useState('');

  useEffect(() => {
    loadVolumes();
    loadDatacenters();
  }, []);

  const loadVolumes = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.listVolumes();
      setVolumes(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load volumes');
    } finally {
      setLoading(false);
    }
  };

  const loadDatacenters = async () => {
    try {
      const data = await apiClient.listDatacenters();
      setDatacenters(data);
      if (data.length > 0) {
        setNewVolumeDatacenter(data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load datacenters:', err);
    }
  };

  const handleCreateVolume = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.createVolume(newVolumeName, parseInt(newVolumeSize), newVolumeDatacenter);
      setSuccess(`Volume "${newVolumeName}" created successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      setShowCreateModal(false);
      setNewVolumeName('');
      setNewVolumeSize('50');
      loadVolumes();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create volume');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVolume = async (volumeId: string, volumeName: string) => {
    if (!window.confirm(`Are you sure you want to delete volume "${volumeName}"? This action cannot be undone!`)) {
      return;
    }

    setError('');
    try {
      await apiClient.deleteVolume(volumeId);
      setSuccess(`Volume "${volumeName}" deleted successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      loadVolumes();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete volume');
    }
  };

  if (loading && volumes.length === 0) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database size={24} />
          Volume Management
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={loadVolumes} className="btn btn-secondary" disabled={loading}>
            <RefreshCw size={18} />
            Refresh
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={18} />
            Create Volume
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Volume</h3>
              <button onClick={() => setShowCreateModal(false)} className="modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVolume}>
              <div className="form-group">
                <label className="label">Volume Name</label>
                <input
                  type="text"
                  className="input"
                  value={newVolumeName}
                  onChange={(e) => setNewVolumeName(e.target.value)}
                  placeholder="my-volume"
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Size (GB)</label>
                <input
                  type="number"
                  className="input"
                  value={newVolumeSize}
                  onChange={(e) => setNewVolumeSize(e.target.value)}
                  min="10"
                  max="4000"
                  required
                />
                <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  Minimum: 10 GB, Maximum: 4000 GB
                </small>
              </div>

              <div className="form-group">
                <label className="label">Datacenter</label>
                <select
                  className="select"
                  value={newVolumeDatacenter}
                  onChange={(e) => setNewVolumeDatacenter(e.target.value)}
                  required
                >
                  {datacenters.map((dc) => (
                    <option key={dc.id} value={dc.id}>
                      {dc.name} ({dc.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Volume'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {volumes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <HardDrive size={48} />
          </div>
          <h3>No volumes found</h3>
          <p>Create your first volume to get started</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {volumes.map((volume) => (
            <div key={volume.id} className="volume-card">
              <div className="volume-header">
                <div>
                  <div className="volume-name">{volume.name}</div>
                  <div className="volume-id">{volume.id}</div>
                </div>
                <button
                  onClick={() => handleDeleteVolume(volume.id, volume.name)}
                  className="icon-btn danger"
                  title="Delete volume"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <div className="volume-info">
                <div>
                  <HardDrive size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  {volume.size} GB
                </div>
                <div>
                  <Database size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  {volume.dataCenterId}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VolumeManager;
