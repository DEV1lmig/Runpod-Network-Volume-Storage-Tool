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
  volumeName: string;
}

const FileManager: React.FC<Props> = ({ volumeId, volumeName }) => {
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
    const task: UploadTask = { id: taskId, fileName: file.name, remotePath, progress: 0, status: 'uploading' };
    setUploads((prev) => [...prev, task]);
    setShowUpload(false);

    apiClient
      .uploadFile(volumeId, file, remotePath, (percent) => {
        setUploads((prev) => prev.map((u) => (u.id === taskId ? { ...u, progress: Math.round(percent) } : u)));
      })
      .then(() => {
        setUploads((prev) => prev.map((u) => (u.id === taskId ? { ...u, progress: 100, status: 'complete' } : u)));
        loadFiles();
      })
      .catch((err: any) => {
        setUploads((prev) =>
          prev.map((u) => (u.id === taskId ? { ...u, status: 'error', error: err.response?.data?.detail || 'Upload failed' } : u))
        );
      });
  }, [volumeId]);

  const dismissUpload = (taskId: string) => setUploads((prev) => prev.filter((u) => u.id !== taskId));

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
    if (!window.confirm(`Delete ${file.key}?`)) return;
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
    if (!window.confirm(`Delete folder "${folderName}" and ALL its contents?`)) return;
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
    if (!window.confirm(`Extract ${file.key}?`)) return;
    try {
      setError('');
      setSuccess('Extracting archive…');
      const extracted = await apiClient.extractZip(volumeId, file.key);
      setSuccess(`Extracted ${extracted.length} files from ${file.key}`);
      setTimeout(() => setSuccess(''), 5000);
      loadFiles();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to extract file');
    }
  };

  const navigateToFolder = (p: string) => setCurrentPath(p);
  const navigateUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/') + (parts.length > 0 ? '/' : ''));
  };

  const handleFolderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreateFolder();
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const s = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0) + ' ' + s[i];
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const groupFilesByFolder = () => {
    const folders = new Map<string, FileInfo[]>();
    const rootFiles: FileInfo[] = [];
    files.forEach((file) => {
      const rel = currentPath ? file.key.slice(currentPath.length) : file.key;
      const parts = rel.split('/').filter(Boolean);
      if (parts.length === 1) rootFiles.push(file);
      else if (parts.length > 1) {
        const name = parts[0];
        if (!folders.has(name)) folders.set(name, []);
        folders.get(name)?.push(file);
      }
    });
    return { folders, rootFiles };
  };

  const pathSegments = currentPath.split('/').filter(Boolean);
  const activeUploads = uploads.filter((u) => u.status === 'uploading');
  const { folders, rootFiles } = groupFilesByFolder();

  return (
    <>
      {/* Sticky header bar */}
      <div className="content-header">
        <div className="content-header-title">
          <span>{volumeName}</span>
        </div>
        <div className="content-header-actions">
          <button onClick={loadFiles} className="btn btn-ghost btn-sm" title="Refresh">
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setShowCreateFolder(true)} className="btn btn-sm">
            <FolderPlus size={14} />
            New Folder
          </button>
          <button onClick={() => setShowUpload(true)} className="btn btn-primary btn-sm">
            <Upload size={14} />
            Upload
          </button>
        </div>
      </div>

      <div className="content-body">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          {currentPath && (
            <button onClick={navigateUp} className="icon-btn" title="Back" style={{ marginRight: '.15rem' }}>
              <ArrowLeft size={15} />
            </button>
          )}
          <button
            onClick={() => setCurrentPath('')}
            className="breadcrumb-segment"
            style={{ fontWeight: pathSegments.length === 0 ? 600 : 400, color: pathSegments.length === 0 ? 'var(--c-accent)' : 'var(--c-text-secondary)' }}
          >
            /
          </button>
          {pathSegments.map((seg, idx) => {
            const segPath = pathSegments.slice(0, idx + 1).join('/') + '/';
            const isLast = idx === pathSegments.length - 1;
            return (
              <React.Fragment key={segPath}>
                <ChevronRight size={12} color="#9ca3af" />
                <button
                  onClick={() => setCurrentPath(segPath)}
                  className="breadcrumb-segment"
                  style={{ fontWeight: isLast ? 600 : 400, color: isLast ? 'var(--c-accent)' : 'var(--c-text-secondary)' }}
                >
                  {seg}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {/* Upload tracker */}
        {uploads.length > 0 && (
          <div className="upload-tracker">
            <div className="upload-tracker-title">
              Uploads{activeUploads.length > 0 && ` — ${activeUploads.length} active`}
            </div>
            {uploads.map((task) => (
              <div key={task.id} className="upload-tracker-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  {task.status === 'complete' && <CheckCircle size={14} color="var(--c-success)" />}
                  {task.status === 'error' && <AlertCircle size={14} color="var(--c-danger)" />}
                  {task.status === 'uploading' && <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
                  <span style={{ fontSize: '.78rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.fileName}
                  </span>
                  {task.status === 'uploading' && (
                    <span style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--c-accent)' }}>{task.progress}%</span>
                  )}
                  {(task.status === 'complete' || task.status === 'error') && (
                    <button onClick={() => dismissUpload(task.id)} className="icon-btn" style={{ padding: '.1rem' }}><X size={12} /></button>
                  )}
                </div>
                {task.status === 'uploading' && (
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${task.progress}%` }} /></div>
                )}
                {task.status === 'error' && <span style={{ fontSize: '.7rem', color: 'var(--c-danger)' }}>{task.error}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : folders.size === 0 && rootFiles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><File size={36} /></div>
            <h3>No files yet</h3>
            <p>Upload a file or create a folder to get started.</p>
          </div>
        ) : (
          /* File table */
          <table className="file-table">
            <thead>
              <tr>
                <th style={{ width: '50%' }}>Name</th>
                <th>Size</th>
                <th>Modified</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(folders.entries()).map(([folderName, folderFiles]) => (
                <tr key={folderName}>
                  <td>
                    <div className="file-name-cell clickable" onClick={() => navigateToFolder(currentPath + folderName + '/')}>
                      <Folder size={16} color="var(--c-accent)" />
                      {folderName}
                    </div>
                  </td>
                  <td style={{ color: 'var(--c-text-secondary)', fontSize: '.78rem' }}>{folderFiles.length} items</td>
                  <td style={{ color: 'var(--c-text-secondary)', fontSize: '.78rem' }}>—</td>
                  <td>
                    <div className="file-actions-cell">
                      <button onClick={() => navigateToFolder(currentPath + folderName + '/')} className="icon-btn" title="Open"><FolderPlus size={15} /></button>
                      <button onClick={() => handleDeleteFolder(folderName)} className="icon-btn danger" title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {rootFiles.map((file) => (
                <tr key={file.key}>
                  <td>
                    <div className="file-name-cell">
                      <File size={16} color="var(--c-text-secondary)" />
                      {file.key.split('/').pop()}
                    </div>
                  </td>
                  <td style={{ color: 'var(--c-text-secondary)', fontSize: '.78rem', whiteSpace: 'nowrap' }}>{formatSize(file.size)}</td>
                  <td style={{ color: 'var(--c-text-secondary)', fontSize: '.78rem', whiteSpace: 'nowrap' }}>{formatDate(file.last_modified)}</td>
                  <td>
                    <div className="file-actions-cell">
                      <button onClick={() => handleDownload(file)} className="icon-btn" title="Download"><Download size={15} /></button>
                      {(file.key.toLowerCase().endsWith('.zip') || file.key.toLowerCase().endsWith('.7z')) && (
                        <button onClick={() => handleExtract(file)} className="icon-btn" title="Extract"><Archive size={15} /></button>
                      )}
                      <button onClick={() => handleDelete(file)} className="icon-btn danger" title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Upload File</h3>
              <button onClick={() => setShowUpload(false)} className="modal-close">✕</button>
            </div>
            <FileUpload currentPath={currentPath} onStartUpload={handleStartUpload} />
          </div>
        </div>
      )}

      {/* Create folder modal */}
      {showCreateFolder && (
        <div className="modal-overlay" onClick={() => setShowCreateFolder(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Folder</h3>
              <button onClick={() => setShowCreateFolder(false)} className="modal-close">✕</button>
            </div>
            <div className="form-group">
              <label className="label">Name</label>
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
                <p style={{ fontSize: '.7rem', color: 'var(--c-text-secondary)', marginTop: '.35rem' }}>
                  Path: /{currentPath}{newFolderName}/
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCreateFolder(false)} className="btn">Cancel</button>
              <button onClick={handleCreateFolder} disabled={!newFolderName.trim()} className="btn btn-primary">
                <FolderPlus size={14} /> Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileManager;
