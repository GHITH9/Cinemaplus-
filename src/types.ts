export type AppMode = 'client' | 'developer';

export interface Movie {
  id: string;
  title: string;
  coverImage: string;
  genre: string;
  duration: string;
  rating: number;
  description: string;
  videoUrl: string;
  fileSize?: number;
  createdAt: string;
  status: 'published' | 'draft';
  views?: number;
  releaseYear?: number;
}

export interface UploadSession {
  uploadId: string;
  fileName: string;
  fileSize: number;
  chunkSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  status: 'idle' | 'uploading' | 'paused' | 'merging' | 'completed' | 'error';
  progressPercent: number;
  speedBytesPerSec: number;
  etaSeconds: number;
  uploadedBytes: number;
  errorMessage?: string;
  videoUrl?: string;
}

export interface AppSettings {
  adminPin: string;
  storageProvider: 'local' | 'cloudflare-r2' | 'backblaze' | 's3';
  storageBucket?: string;
  storageEndpoint?: string;
  appTitle: string;
  owner: string;
  whatsapp1: string;
  whatsapp2: string;
}
