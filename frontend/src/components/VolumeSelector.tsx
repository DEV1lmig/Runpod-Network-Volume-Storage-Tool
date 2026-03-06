import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/api';
import { Volume } from '../types';
import { HardDrive, RefreshCw } from 'lucide-react';

interface Props {
  selectedVolumeId: string;
  onVolumeSelect: (volumeId: string) => void;
}

const VolumeSelector: React.FC<Props> = ({ selectedVolumeId, onVolumeSelect }) => {
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadVolumes();
  }, []);

  const loadVolumes = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.listVolumes();
      setVolumes(data);
      if (data.length > 0 && !selectedVolumeId) {
        onVolumeSelect(data[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load volumes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (volumes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <HardDrive size={48} />
        </div>
        <h3>No volumes found</h3>
        <p>Create a volume in the Volume Management tab to get started</p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <label className="label" style={{ marginBottom: 0 }}>
          <HardDrive size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
          Select Volume
        </label>
        <button onClick={loadVolumes} className="icon-btn" title="Refresh volumes">
          <RefreshCw size={18} />
        </button>
      </div>
      <select
        className="select"
        value={selectedVolumeId}
        onChange={(e) => onVolumeSelect(e.target.value)}
      >
        {volumes.map((volume) => (
          <option key={volume.id} value={volume.id}>
            {volume.name} ({volume.size} GB) - {volume.dataCenterId}
          </option>
        ))}
      </select>
    </div>
  );
};

export default VolumeSelector;
