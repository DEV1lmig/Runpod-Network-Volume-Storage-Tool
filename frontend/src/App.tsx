import React, { useState, useEffect } from 'react';
import { apiClient } from './services/api';
import { ApiCredentials } from './types';
import CredentialsForm from './components/CredentialsForm';
import VolumeSelector from './components/VolumeSelector';
import FileManager from './components/FileManager';
import VolumeManager from './components/VolumeManager';
import './styles/App.css';

type Tab = 'files' | 'volumes';

function App() {
  const [credentials, setCredentials] = useState<ApiCredentials | null>(null);
  const [selectedVolumeId, setSelectedVolumeId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<Tab>('files');
  const [serverStatus, setServerStatus] = useState<boolean | null>(null);

  useEffect(() => {
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    const healthy = await apiClient.checkHealth();
    setServerStatus(healthy);
  };

  const handleCredentialsSubmit = (creds: ApiCredentials) => {
    apiClient.setCredentials(creds);
    setCredentials(creds);
  };

  const handleLogout = () => {
    setCredentials(null);
    setSelectedVolumeId('');
    apiClient.setCredentials({ apiKey: '', s3AccessKey: '', s3SecretKey: '' });
  };

  if (serverStatus === false) {
    return (
      <div className="container">
        <div className="header">
          <h1>Runpod Storage Manager</h1>
        </div>
        <div className="card">
          <div className="error">
            <h3>Server Connection Error</h3>
            <p>Unable to connect to the API server. Please ensure the server is running on http://localhost:8000</p>
            <p style={{ marginTop: '1rem' }}>Start the server with: <code>uv run runpod-storage-server</code></p>
          </div>
        </div>
      </div>
    );
  }

  if (!credentials) {
    return (
      <div className="container">
        <div className="header">
          <h1>Runpod Storage Manager</h1>
          <p>Manage your Runpod network volumes and files with ease</p>
        </div>
        <div className="card">
          <CredentialsForm onSubmit={handleCredentialsSubmit} />
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Runpod Storage Manager</h1>
        <p>Manage your Runpod network volumes and files</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'files' ? 'active' : ''}`}
              onClick={() => setActiveTab('files')}
            >
              File Operations
            </button>
            <button
              className={`tab ${activeTab === 'volumes' ? 'active' : ''}`}
              onClick={() => setActiveTab('volumes')}
            >
              Volume Management
            </button>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>

        {activeTab === 'files' ? (
          <>
            <VolumeSelector
              selectedVolumeId={selectedVolumeId}
              onVolumeSelect={setSelectedVolumeId}
            />
            {selectedVolumeId && <FileManager volumeId={selectedVolumeId} />}
          </>
        ) : (
          <VolumeManager />
        )}
      </div>
    </div>
  );
}

export default App;
