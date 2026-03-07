import { useEffect, useState } from 'react';
import { apiClient } from '../services/api';
import { Volume, Datacenter } from '../types';
import { HardDrive, Plus, Trash2, RefreshCw, Database } from 'lucide-react';

interface Props {
  onVolumesChanged: () => void;
}

const VolumeManager: React.FC<Props> = ({ onVolumesChanged }) => {
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [datacenters, setDatacenters] = useState<Datacenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
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
      if (data.length > 0) setNewVolumeDatacenter(data[0].id);
    } catch {
      /* ignore */
    }
  };

  const handleCreateVolume = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiClient.createVolume(newVolumeName, parseInt(newVolumeSize), newVolumeDatacenter);
      setSuccess(`Volume "${newVolumeName}" created`);
      setTimeout(() => setSuccess(''), 3000);
      setShowCreateModal(false);
      setNewVolumeName('');
      setNewVolumeSize('50');
      loadVolumes();
      onVolumesChanged();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create volume');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVolume = async (volumeId: string, volumeName: string) => {
    if (!window.confirm(`Delete volume "${volumeName}"? This cannot be undone.`)) return;
    setError('');
    try {
      await apiClient.deleteVolume(volumeId);
      setSuccess(`Volume "${volumeName}" deleted`);
      setTimeout(() => setSuccess(''), 3000);
      loadVolumes();
      onVolumesChanged();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete volume');
    }
  };

  return (
    <>
      <div className="content-header">
        <div className="content-header-title">
          <Database size={16} />
          <span>Volumes</span>
        </div>
        <div className="content-header-actions">
          <button onClick={loadVolumes} className="btn btn-ghost btn-sm" disabled={loading} title="Refresh">
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
            <Plus size={14} />
            New Volume
          </button>
        </div>
      </div>

      <div className="content-body">
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {loading && volumes.length === 0 ? (
          <div className="loading"><div className="spinner" /></div>
        ) : volumes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><HardDrive size={36} /></div>
            <h3>No volumes</h3>
            <p>Create your first volume to get started.</p>
          </div>
        ) : (
          <div className="volume-grid">
            {volumes.map((vol) => (
              <div key={vol.id} className="volume-card">
                <div className="volume-header">
                  <div>
                    <div className="volume-name">{vol.name}</div>
                    <div className="volume-id">{vol.id}</div>
                  </div>
                  <button onClick={() => handleDeleteVolume(vol.id, vol.name)} className="icon-btn danger" title="Delete volume">
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="volume-info">
                  <div className="volume-info-item">
                    <HardDrive size={13} />
                    {vol.size} GB
                  </div>
                  <div className="volume-info-item">
                    <Database size={13} />
                    {vol.dataCenterId}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Volume</h3>
              <button onClick={() => setShowCreateModal(false)} className="modal-close">✕</button>
            </div>
            <form onSubmit={handleCreateVolume}>
              <div className="form-group">
                <label className="label">Name</label>
                <input type="text" className="input" value={newVolumeName} onChange={(e) => setNewVolumeName(e.target.value)} placeholder="my-volume" required />
              </div>
              <div className="form-group">
                <label className="label">Size (GB)</label>
                <input type="number" className="input" value={newVolumeSize} onChange={(e) => setNewVolumeSize(e.target.value)} min="10" max="4000" required />
                <span style={{ fontSize: '.7rem', color: 'var(--c-text-secondary)' }}>10 – 4000 GB</span>
              </div>
              <div className="form-group">
                <label className="label">Datacenter</label>
                <select className="select" value={newVolumeDatacenter} onChange={(e) => setNewVolumeDatacenter(e.target.value)} required>
                  {datacenters.map((dc) => (
                    <option key={dc.id} value={dc.id}>{dc.name} ({dc.id})</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default VolumeManager;
