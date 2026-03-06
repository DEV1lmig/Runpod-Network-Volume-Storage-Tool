import axios, { AxiosInstance, AxiosProgressEvent } from 'axios';
import { Volume, FileInfo, ApiCredentials, Datacenter } from '../types';

class ApiClient {
  private client: AxiosInstance;
  private credentials: ApiCredentials | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  setCredentials(credentials: ApiCredentials) {
    this.credentials = credentials;
  }

  getCredentials(): ApiCredentials | null {
    return this.credentials;
  }

  private getHeaders() {
    if (!this.credentials) {
      throw new Error('API credentials not set');
    }
    return {
      'runpod-api-key': this.credentials.apiKey,
      's3-access-key': this.credentials.s3AccessKey,
      's3-secret-key': this.credentials.s3SecretKey,
    };
  }

  private getVolumeHeaders() {
    if (!this.credentials) {
      throw new Error('API credentials not set');
    }
    return {
      'runpod-api-key': this.credentials.apiKey,
    };
  }

  async listVolumes(): Promise<Volume[]> {
    const response = await this.client.get('/volumes', {
      headers: this.getVolumeHeaders(),
    });
    return response.data.volumes;
  }

  async createVolume(name: string, size: number, datacenterId: string): Promise<Volume> {
    const response = await this.client.post(
      '/volumes',
      { name, size, datacenter_id: datacenterId },
      { headers: this.getVolumeHeaders() }
    );
    return response.data;
  }

  async deleteVolume(volumeId: string): Promise<void> {
    await this.client.delete(`/volumes/${volumeId}`, {
      headers: this.getVolumeHeaders(),
    });
  }

  async listFiles(volumeId: string, prefix?: string): Promise<FileInfo[]> {
    const response = await this.client.post(
      `/volumes/${volumeId}/files/list`,
      {},
      {
        headers: this.getHeaders(),
        params: prefix ? { prefix } : {},
      }
    );
    return response.data.files;
  }

  async uploadFile(
    volumeId: string,
    file: File,
    remotePath: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('remote_path', remotePath);

    await this.client.post(`/volumes/${volumeId}/files`, formData, {
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(percent);
        }
      },
    });
  }

  async downloadFile(volumeId: string, remotePath: string): Promise<Blob> {
    const response = await this.client.post(
      `/volumes/${volumeId}/files/download`,
      {},
      {
        headers: this.getHeaders(),
        params: { remote_path: remotePath },
        responseType: 'blob',
      }
    );
    return response.data;
  }

  async deleteFile(volumeId: string, remotePath: string): Promise<void> {
    await this.client.post(
      `/volumes/${volumeId}/files/delete`,
      {},
      {
        headers: this.getHeaders(),
        params: { remote_path: remotePath },
      }
    );
  }

  async listDatacenters(): Promise<Datacenter[]> {
    const response = await this.client.get('/datacenters', {
      headers: this.getVolumeHeaders(),
    });
    return response.data;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', {
        baseURL: '/',
      });
      return response.data.status === 'healthy';
    } catch {
      return false;
    }
  }
}

export const apiClient = new ApiClient();
