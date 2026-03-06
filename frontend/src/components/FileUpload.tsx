import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { apiClient } from '../services/api';
import { Upload, FileText, CheckCircle } from 'lucide-react';

interface Props {
  volumeId: string;
  currentPath: string;
  onComplete: () => void;
}

const FileUpload: React.FC<Props> = ({ volumeId, currentPath, onComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [remotePath, setRemotePath] = useState<string>('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setFileName(file.name);
    const defaultRemotePath = currentPath + file.name;
    setRemotePath(defaultRemotePath);
  }, [currentPath]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!fileName) {
      setError('Please select a file first');
      return;
    }

    if (!remotePath) {
      setError('Please enter a remote path');
      return;
    }

    setUploading(true);
    setError('');
    setProgress(0);

    try {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = input?.files?.[0];

      if (!file) {
        throw new Error('No file selected');
      }

      await apiClient.uploadFile(volumeId, file, remotePath, (percent) => {
        setProgress(Math.round(percent));
      });

      setProgress(100);
      setTimeout(() => {
        onComplete();
      }, 500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload file');
      setUploading(false);
    }
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <Upload size={48} color="#667eea" />
          {isDragActive ? (
            <p>Drop the file here...</p>
          ) : (
            <>
              <p style={{ fontWeight: 600 }}>Drag and drop a file here</p>
              <p style={{ color: '#6b7280' }}>or click to select a file</p>
            </>
          )}
        </div>
      </div>

      {fileName && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '1rem', background: '#f0f4ff', borderRadius: '8px' }}>
            <FileText size={20} color="#667eea" />
            <span style={{ fontWeight: 600 }}>{fileName}</span>
          </div>

          <div className="form-group">
            <label className="label">Remote Path</label>
            <input
              type="text"
              className="input"
              value={remotePath}
              onChange={(e) => setRemotePath(e.target.value)}
              placeholder="path/to/file.txt"
              disabled={uploading}
            />
          </div>

          {error && <div className="error">{error}</div>}

          {uploading && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Uploading...</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#667eea' }}>{progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}

          {progress === 100 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '1rem' }}>
              <CheckCircle size={20} />
              <span style={{ fontWeight: 600 }}>Upload complete!</span>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading || !remotePath}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
