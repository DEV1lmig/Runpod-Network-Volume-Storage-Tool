export interface Volume {
  id: string;
  name: string;
  size: number;
  dataCenterId: string;
}

export interface FileInfo {
  key: string;
  size: number;
  last_modified: string;
}

export interface UploadProgress {
  percent: number;
  loaded: number;
  total: number;
}

export interface ApiCredentials {
  apiKey: string;
  s3AccessKey: string;
  s3SecretKey: string;
}

export interface Datacenter {
  id: string;
  name: string;
  s3_endpoint: string;
  region: string;
}
