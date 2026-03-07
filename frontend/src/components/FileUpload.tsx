import { useState, useCallback } from 'react';
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
    setRemotePath(currentPath + file.name);
  }, [currentPath]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  const handleUpload = () => {
    if (!selectedFile || !remotePath) return;
    onStartUpload(selectedFile, remotePath);
    setFileName('');
    setRemotePath('');
    setSelectedFile(null);
  };

  return (
    <div>
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <Upload size={32} color="var(--c-accent)" />
          {isDragActive ? (
            <p>Drop here…</p>
          ) : (
            <>
              <p style={{ fontWeight: 500 }}>Drop a file or click to browse</p>
            </>
          )}
        </div>
      </div>

      {fileName && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.6rem .75rem', background: 'var(--c-accent-light)', borderRadius: 'var(--radius-sm)', marginBottom: '.75rem' }}>
            <FileText size={16} color="var(--c-accent)" />
            <span style={{ fontWeight: 500, fontSize: '.8rem' }}>{fileName}</span>
          </div>

          <div className="form-group">
            <label className="label">Remote Path</label>
            <input type="text" className="input" value={remotePath} onChange={(e) => setRemotePath(e.target.value)} placeholder="path/to/file.txt" />
          </div>

          <button onClick={handleUpload} disabled={!remotePath} className="btn btn-primary" style={{ width: '100%' }}>
            Upload
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
