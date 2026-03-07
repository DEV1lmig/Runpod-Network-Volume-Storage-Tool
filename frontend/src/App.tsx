import { useState, useEffect } from 'react';
import { apiClient } from './services/api';
import { ApiCredentials, Volume } from './types';
import CredentialsForm from './components/CredentialsForm';
import FileManager from './components/FileManager';
import VolumeManager from './components/VolumeManager';
import { HardDrive, FolderOpen, Database, LogOut, Server, AlertTriangle } from 'lucide-react';
import './styles/App.css';

type View = 'files' | 'volumes';

function App() {
  const [credentials, setCredentials] = useState<ApiCredentials | null>(null);
  const [selectedVolumeId, setSelectedVolumeId] = useState<string>('');
  const [activeView, setActiveView] = useState<View>('files');
  const [serverStatus, setServerStatus] = useState<boolean | null>(null);
  const [volumes, setVolumes] = useState<Volume[]>([]);

  useEffect(() => {
    checkServerHealth();
  }, []);

  useEffect(() => {
    if (credentials) loadVolumes();
  }, [credentials]);

  const checkServerHealth = async () => {
    const healthy = await apiClient.checkHealth();
    setServerStatus(healthy);
  };

  const loadVolumes = async () => {
    try {
      const data = await apiClient.listVolumes();
      setVolumes(data);
      if (data.length > 0 && !selectedVolumeId) {
        setSelectedVolumeId(data[0].id);
      }
    } catch {
      /* ignore – sidebar will just be empty */
    }
  };

  const handleCredentialsSubmit = (creds: ApiCredentials) => {
    apiClient.setCredentials(creds);
    setCredentials(creds);
  };

  const handleLogout = () => {
    setCredentials(null);
    setSelectedVolumeId('');
    setVolumes([]);
    apiClient.setCredentials({ apiKey: '', s3AccessKey: '', s3SecretKey: '' });
  };

  /* --- Server error --- */
  if (serverStatus === false) {
    return (
      <div className="error-screen">
        <div className="error-card">
          <AlertTriangle size={32} color="#ef4444" style={{ marginBottom: '.75rem' }} />
          <h2>Server Unavailable</h2>
          <p>Cannot reach the API server at localhost:8000</p>
          <code>uv run runpod-storage-server</code>
        </div>
      </div>
    );
  }

  /* --- Login --- */
  if (!credentials) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <CredentialsForm onSubmit={handleCredentialsSubmit} />
        </div>
      </div>
    );
  }

  /* --- Main app shell --- */
  const selectedVolume = volumes.find((v) => v.id === selectedVolumeId);

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-brand">
          <Server size={18} />
          Runpod Storage
        </div>

        <div className="sidebar-section">
          <div className="sidebar-heading">Navigation</div>
          <ul className="sidebar-nav">
            <li>
              <button
                className={`sidebar-nav-item ${activeView === 'files' ? 'active' : ''}`}
                onClick={() => setActiveView('files')}
              >
                <FolderOpen size={16} />
                File Browser
              </button>
            </li>
            <li>
              <button
                className={`sidebar-nav-item ${activeView === 'volumes' ? 'active' : ''}`}
                onClick={() => setActiveView('volumes')}
              >
                <Database size={16} />
                Volumes
              </button>
            </li>
          </ul>
        </div>

        <div className="sidebar-section" style={{ flex: 1, overflow: 'auto' }}>
          <div className="sidebar-heading">Volumes</div>
          {volumes.length === 0 ? (
            <p style={{ fontSize: '.75rem', padding: '0 .75rem', opacity: .5 }}>
              No volumes
            </p>
          ) : (
            <ul className="sidebar-volume-list">
              {volumes.map((v) => (
                <li key={v.id}>
                  <button
                    className={`sidebar-volume-item ${v.id === selectedVolumeId ? 'active' : ''}`}
                    onClick={() => { setSelectedVolumeId(v.id); setActiveView('files'); }}
                  >
                    <HardDrive size={14} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.name}
                    </span>
                    <span className="sidebar-volume-meta">{v.size} GB</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-nav-item" onClick={handleLogout}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="main-content">
        {activeView === 'files' ? (
          selectedVolumeId ? (
            <FileManager
              volumeId={selectedVolumeId}
              volumeName={selectedVolume?.name || selectedVolumeId}
            />
          ) : (
            <div className="content-body">
              <div className="empty-state">
                <div className="empty-state-icon"><HardDrive size={40} /></div>
                <h3>No volume selected</h3>
                <p>Select a volume from the sidebar or create one in Volumes.</p>
              </div>
            </div>
          )
        ) : (
          <VolumeManager onVolumesChanged={loadVolumes} />
        )}
      </main>
    </div>
  );
}

export default App;
