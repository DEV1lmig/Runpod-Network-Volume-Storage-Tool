import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/api';
import { FileInfo } from '../types';
import {
  File,
  Folder,
  Download,
  Trash2,
  Upload,
  RefreshCw,
  FolderOpen,
  ArrowLeft
} from 'lucide-react';
import FileUpload from './FileUpload';

interface Props {
  volumeId: string;
}

const FileManager: React.FC<Props> = ({ volumeId }) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<string>('');
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [volumeId, currentPath]);

  const loadFiles = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.listFiles(volumeId, currentPath);
      setFiles(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: FileInfo) => {
    try {
      setError('');
      const blob = await apiClient.downloadFile(volumeId, file.key);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.key.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setSuccess(`Downloaded: ${file.key}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to download file');
    }
  };

  const handleDelete = async (file: FileInfo) => {
    if (!window.confirm(`Are you sure you want to delete ${file.key}?`)) {
      return;
    }

    try {
      setError('');
      await apiClient.deleteFile(volumeId, file.key);
      setSuccess(`Deleted: ${file.key}`);
      setTimeout(() => setSuccess(''), 3000);
      loadFiles();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete file');
    }
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    loadFiles();
  };

  const navigateToFolder = (folderPath: string) => {
    setCurrentPath(folderPath);
  };

  const navigateUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/') + (parts.length > 0 ? '/' : ''));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const groupFilesByFolder = () => {
    const folders = new Map<string, FileInfo[]>();
    const rootFiles: FileInfo[] = [];

    files.forEach((file) => {
      const relativePath = currentPath ? file.key.slice(currentPath.length) : file.key;
      const parts = relativePath.split('/').filter(Boolean);

      if (parts.length === 1) {
        rootFiles.push(file);
      } else if (parts.length > 1) {
        const folderName = parts[0];
        if (!folders.has(folderName)) {
          folders.set(folderName, []);
        }
        folders.get(folderName)?.push(file);
      }
    });

    return { folders, rootFiles };
  };

  const { folders, rootFiles } = groupFilesByFolder();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FolderOpen size={24} />
          File Browser
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={loadFiles} className="btn btn-secondary">
            <RefreshCw size={18} />
            Refresh
          </button>
          <button onClick={() => setShowUpload(true)} className="btn btn-primary">
            <Upload size={18} />
            Upload File
          </button>
        </div>
      </div>

      {currentPath && (
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={navigateUp} className="btn btn-secondary">
            <ArrowLeft size={18} />
            Back
          </button>
          <span style={{ color: '#6b7280' }}>Current path: /{currentPath}</span>
        </div>
      )}

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Upload File</h3>
              <button onClick={() => setShowUpload(false)} className="modal-close">
                ✕
              </button>
            </div>
            <FileUpload
              volumeId={volumeId}
              currentPath={currentPath}
              onComplete={handleUploadComplete}
            />
          </div>
        </div>
      )}

      {folders.size === 0 && rootFiles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <File size={48} />
          </div>
          <h3>No files found</h3>
          <p>Upload files to get started</p>
        </div>
      ) : (
        <ul className="file-list">
          {Array.from(folders.entries()).map(([folderName, folderFiles]) => (
            <li key={folderName} className="file-item">
              <div className="file-info">
                <div className="file-name" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Folder size={20} color="#667eea" />
                  {folderName}
                </div>
                <div className="file-meta">{folderFiles.length} items</div>
              </div>
              <div className="file-actions">
                <button
                  onClick={() => navigateToFolder(currentPath + folderName + '/')}
                  className="icon-btn"
                  title="Open folder"
                >
                  <FolderOpen size={20} />
                </button>
              </div>
            </li>
          ))}

          {rootFiles.map((file) => (
            <li key={file.key} className="file-item">
              <div className="file-info">
                <div className="file-name" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <File size={20} color="#6b7280" />
                  {file.key.split('/').pop()}
                </div>
                <div className="file-meta">
                  {formatFileSize(file.size)} • {formatDate(file.last_modified)}
                </div>
              </div>
              <div className="file-actions">
                <button
                  onClick={() => handleDownload(file)}
                  className="icon-btn"
                  title="Download"
                >
                  <Download size={20} />
                </button>
                <button
                  onClick={() => handleDelete(file)}
                  className="icon-btn danger"
                  title="Delete"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FileManager;
