import { useState } from 'react';
import { ApiCredentials } from '../types';
import { Key, Database, Lock } from 'lucide-react';

interface Props {
  onSubmit: (credentials: ApiCredentials) => void;
}

const CredentialsForm: React.FC<Props> = ({ onSubmit }) => {
  const [apiKey, setApiKey] = useState('');
  const [s3AccessKey, setS3AccessKey] = useState('');
  const [s3SecretKey, setS3SecretKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ apiKey, s3AccessKey, s3SecretKey });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Runpod Storage</h1>
      <p className="subtitle">
        Enter your credentials to connect.{' '}
        <a href="https://console.runpod.io/user/settings" target="_blank" rel="noopener noreferrer">
          Get keys →
        </a>
      </p>

      <div className="form-group">
        <label className="label">
          <Key size={13} style={{ display: 'inline', marginRight: '.3rem', verticalAlign: '-2px' }} />
          API Key
        </label>
        <input
          type="password"
          className="input"
          placeholder="rpa_..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="label">
          <Database size={13} style={{ display: 'inline', marginRight: '.3rem', verticalAlign: '-2px' }} />
          S3 Access Key
        </label>
        <input
          type="text"
          className="input"
          placeholder="user_..."
          value={s3AccessKey}
          onChange={(e) => setS3AccessKey(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="label">
          <Lock size={13} style={{ display: 'inline', marginRight: '.3rem', verticalAlign: '-2px' }} />
          S3 Secret Key
        </label>
        <input
          type="password"
          className="input"
          placeholder="rps_..."
          value={s3SecretKey}
          onChange={(e) => setS3SecretKey(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
        Connect
      </button>
    </form>
  );
};

export default CredentialsForm;
