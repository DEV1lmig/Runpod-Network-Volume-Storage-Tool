import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';

interface Props {
  currentPath: string;
  onStartUpload: (file: File, remotePath: string) => void;
}

const FileUpload: React.FC<Props> = ({ currentPath, onStartUpload }) => {
  const [fileName, setFileName] = useState<string>('');
  const [remotePath, setRemotePath] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setFileName(file.name);
    setSelectedFile(file);
    const defaultRemotePath = currentPath + file.name;
    setRemotePath(defaultRemotePath);
  }, [currentPath]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const handleUpload = () => {
    if (!selectedFile || !remotePath) return;
    onStartUpload(selectedFile, remotePath);
    setFileName('');
    setRemotePath('');
    setSelectedFile(null);
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
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={!remotePath}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            Upload
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
