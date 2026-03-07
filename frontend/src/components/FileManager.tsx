import React, { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../services/api';
import { FileInfo, UploadTask } from '../types';
import {
  File,
  Folder,
  Download,
  Trash2,
  Upload,
  RefreshCw,
  FolderOpen,
  FolderPlus,
  ArrowLeft,
  Archive,
  CheckCircle,
  AlertCircle,
  X,
  ChevronRight,
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
  const [uploads, setUploads] = useState<UploadTask[]>([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

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

  const handleStartUpload = useCallback((file: File, remotePath: string) => {
    const taskId = crypto.randomUUID();
    const task: UploadTask = {
      id: taskId,
      fileName: file.name,
      remotePath,
      progress: 0,
      status: 'uploading',
    };

    setUploads((prev) => [...prev, task]);
    setShowUpload(false);

    apiClient
      .uploadFile(volumeId, file, remotePath, (percent) => {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === taskId ? { ...u, progress: Math.round(percent) } : u
          )
        );
      })
      .then(() => {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === taskId ? { ...u, progress: 100, status: 'complete' } : u
          )
        );
        loadFiles();
      })
      .catch((err: any) => {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === taskId
              ? {
                  ...u,
                  status: 'error',
                  error: err.response?.data?.detail || 'Upload failed',
                }
              : u
          )
        );
      });
  }, [volumeId]);

  const dismissUpload = (taskId: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== taskId));
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

  const handleDeleteFolder = async (folderName: string) => {
    const folderPath = currentPath + folderName + '/';
    if (
      !window.confirm(
        `Are you sure you want to delete the folder "${folderName}" and ALL its contents?`
      )
    ) {
      return;
    }

    try {
      setError('');
      await apiClient.deleteFolder(volumeId, folderPath);
      setSuccess(`Deleted folder: ${folderName}`);
      setTimeout(() => setSuccess(''), 3000);
      loadFiles();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete folder');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    const folderPath = currentPath + newFolderName.trim() + '/';
    try {
      setError('');
      await apiClient.createFolder(volumeId, folderPath);
      setSuccess(`Created folder: ${newFolderName}`);
      setTimeout(() => setSuccess(''), 3000);
      setNewFolderName('');
      setShowCreateFolder(false);
      loadFiles();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create folder');
    }
  };

  const handleExtract = async (file: FileInfo) => {
    if (!window.confirm(`Extract ${file.key}? This will extract all files to the same directory.`)) {
      return;
    }

    try {
      setError('');
      setSuccess('Extracting zip file... Please wait.');
      const extractedFiles = await apiClient.extractZip(volumeId, file.key);
      setSuccess(`Successfully extracted ${extractedFiles.length} files from ${file.key}`);
      setTimeout(() => setSuccess(''), 5000);
      loadFiles();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to extract zip file');
    }
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

  const handleFolderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreateFolder();
  };

  const pathSegments = currentPath.split('/').filter(Boolean);
  const activeUploads = uploads.filter((u) => u.status === 'uploading');
  const hasActiveUploads = activeUploads.length > 0;
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
          <button onClick={() => setShowCreateFolder(true)} className="btn btn-secondary">
            <FolderPlus size={18} />
            New Folder
          </button>
          <button onClick={() => setShowUpload(true)} className="btn btn-primary">
            <Upload size={18} />
            Upload File
          </button>
        </div>
      </div>

      {/* Breadcrumb navigation */}
      <div className="breadcrumb" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
        {currentPath && (
          <button onClick={navigateUp} className="icon-btn" title="Go back" style={{ marginRight: '0.25rem' }}>
            <ArrowLeft size={18} />
          </button>
        )}
        <button
          onClick={() => setCurrentPath('')}
          className="breadcrumb-segment"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: pathSegments.length === 0 ? 700 : 400,
            color: pathSegments.length === 0 ? '#667eea' : '#6b7280',
            padding: '0.25rem 0.5rem', borderRadius: '4px',
          }}
        >
          Root
        </button>
        {pathSegments.map((seg, idx) => {
          const segPath = pathSegments.slice(0, idx + 1).join('/') + '/';
          const isLast = idx === pathSegments.length - 1;
          return (
            <React.Fragment key={segPath}>
              <ChevronRight size={14} color="#9ca3af" />
              <button
                onClick={() => setCurrentPath(segPath)}
                className="breadcrumb-segment"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontWeight: isLast ? 700 : 400,
                  color: isLast ? '#667eea' : '#6b7280',
                  padding: '0.25rem 0.5rem', borderRadius: '4px',
                }}
              >
                {seg}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* Persistent upload tracker – always visible outside the modal */}
      {uploads.length > 0 && (
        <div className="upload-tracker" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
              Uploads {hasActiveUploads && `(${activeUploads.length} active)`}
            </span>
          </div>
          {uploads.map((task) => (
            <div key={task.id} className="upload-tracker-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                {task.status === 'complete' && <CheckCircle size={16} color="#10b981" />}
                {task.status === 'error' && <AlertCircle size={16} color="#ef4444" />}
                {task.status === 'uploading' && (
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                )}
                <span style={{ fontWeight: 500, fontSize: '0.875rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.fileName}
                </span>
                {task.status === 'uploading' && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#667eea' }}>
                    {task.progress}%
                  </span>
                )}
                {(task.status === 'complete' || task.status === 'error') && (
                  <button
                    onClick={() => dismissUpload(task.id)}
                    className="icon-btn"
                    style={{ padding: '0.125rem' }}
                    title="Dismiss"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {task.status === 'uploading' && (
                <div className="progress-bar" style={{ height: 4 }}>
                  <div className="progress-fill" style={{ width: `${task.progress}%` }}></div>
                </div>
              )}
              {task.status === 'error' && (
                <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{task.error}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
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
              currentPath={currentPath}
              onStartUpload={handleStartUpload}
            />
          </div>
        </div>
      )}

      {/* Create folder modal */}
      {showCreateFolder && (
        <div className="modal-overlay" onClick={() => setShowCreateFolder(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Folder</h3>
              <button onClick={() => setShowCreateFolder(false)} className="modal-close">
                ✕
              </button>
            </div>
            <div className="form-group">
              <label className="label">Folder Name</label>
              <input
                type="text"
                className="input"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="my-folder"
                onKeyDown={handleFolderKeyDown}
                autoFocus
              />
              {currentPath && (
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  Will be created at: /{currentPath}{newFolderName}/
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCreateFolder(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="btn btn-primary"
              >
                <FolderPlus size={18} />
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {folders.size === 0 && rootFiles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <File size={48} />
          </div>
          <h3>No files found</h3>
          <p>Upload files or create a folder to get started</p>
        </div>
      ) : (
        <ul className="file-list">
          {Array.from(folders.entries()).map(([folderName, folderFiles]) => (
            <li key={folderName} className="file-item">
              <div
                className="file-info"
                style={{ cursor: 'pointer' }}
                onClick={() => navigateToFolder(currentPath + folderName + '/')}
              >
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
                <button
                  onClick={() => handleDeleteFolder(folderName)}
                  className="icon-btn danger"
                  title="Delete folder"
                >
                  <Trash2 size={20} />
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
                {(file.key.toLowerCase().endsWith('.zip') || file.key.toLowerCase().endsWith('.7z')) && (
                  <button
                    onClick={() => handleExtract(file)}
                    className="icon-btn"
                    title={`Extract ${file.key.toLowerCase().endsWith('.7z') ? '7z' : 'zip'} file`}
                  >
                    <Archive size={20} />
                  </button>
                )}
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
