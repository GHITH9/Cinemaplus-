import { Movie, UploadSession } from '../types';

const STORAGE_KEY = 'ghaithan_movies_cache';
const DRAFT_KEY = 'ghaithan_movie_draft';
export const MAX_VIDEO_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
export const OFFICIAL_SITE_URL = 'https://remix-cinema-plus-5101.ai.studio';

function getApiBase(): string {
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return OFFICIAL_SITE_URL;
  }
  return '';
}

// Format bytes into human readable (GB, MB, KB)
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 بايت';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت', 'تيرابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Format seconds into Arabic readable duration
export function formatSecondsArabic(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return 'جاري الحساب...';
  if (seconds < 60) return `${Math.round(seconds)} ثانية تقريباً`;
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = Math.round(seconds % 60);
  if (minutes < 60) {
    return `${minutes} دقيقة و ${remainingSecs} ثانية`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours} ساعة و ${remainingMins} دقيقة`;
}

// Fetch all movies (always fresh from server so all visitors see newly published movies)
export async function fetchMovies(): Promise<Movie[]> {
  try {
    const res = await fetch(`${getApiBase()}/api/movies`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('Backend movies endpoint unreachable, using local storage cache:', err);
  }

  // Fallback to local storage cache
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (e) {
    return [];
  }
}

// Upload poster cover image to server so all visitors can load it fast
export async function uploadPosterImage(file: File): Promise<string> {
  const extMatch = file.name.match(/\.[a-zA-Z0-9]+$/);
  const ext = extMatch ? extMatch[0].toLowerCase() : '.jpg';

  try {
    const res = await fetch(`${getApiBase()}/api/upload/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'x-image-ext': ext,
      },
      body: file,
    });
    if (res.ok) {
      const data = await res.json();
      if (data.imageUrl) return data.imageUrl;
    }
  } catch (err) {
    console.warn('Poster image upload fallback to DataURL:', err);
  }

  // Fallback to DataURL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('تعذر قراءة صورة الغلاف'));
    reader.readAsDataURL(file);
  });
}

// Save or Create a Movie
export async function createMovie(movie: Omit<Movie, 'id' | 'createdAt'>): Promise<Movie> {
  const newMovie: Movie = {
    ...movie,
    id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    views: 0,
  };

  const res = await fetch(`${getApiBase()}/api/movies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newMovie),
  });

  if (!res.ok) {
    throw new Error('فشل حفظ الفيلم على الخادم. يرجى المحاولة مرة أخرى.');
  }

  const saved = await res.json();
  const cached = await fetchMovies();
  const updated = [saved, ...cached.filter((m) => m.id !== saved.id)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return saved;
}

// Update an existing Movie
export async function updateMovie(id: string, updates: Partial<Movie>): Promise<Movie | null> {
  const res = await fetch(`${getApiBase()}/api/movies/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    throw new Error('فشل تحديث بيانات الفيلم على الخادم.');
  }

  const updated = await res.json();
  const cached = await fetchMovies();
  const next = cached.map((m) => (m.id === id ? updated : m));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return updated;
}

// Delete Movie
export async function deleteMovie(id: string): Promise<boolean> {
  const res = await fetch(`${getApiBase()}/api/movies/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error('فشل حذف الفيلم من الخادم.');
  }
  const cached = await fetchMovies();
  const filtered = cached.filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// Draft Storage Helpers
export function saveMovieDraft(draft: Partial<Movie>) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function getMovieDraft(): Partial<Movie> | null {
  try {
    const draft = localStorage.getItem(DRAFT_KEY);
    return draft ? JSON.parse(draft) : null;
  } catch (e) {
    return null;
  }
}

export function clearMovieDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

// Admin PIN Authentication
export async function verifyAdminPin(pin: string): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('ghaithan_admin_auth', 'true');
        return true;
      }
    }
  } catch (err) {
    console.warn('Admin check fallback to local check');
  }

  const storedPin = localStorage.getItem('ghaithan_custom_pin') || '7121';
  if (pin.trim() === storedPin) {
    sessionStorage.setItem('ghaithan_admin_auth', 'true');
    return true;
  }
  return false;
}

export async function changeAdminPin(newPin: string): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBase()}/api/admin/change-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPin }),
    });
    if (res.ok) {
      localStorage.setItem('ghaithan_custom_pin', newPin);
      return true;
    }
  } catch (e) {
    // fallback
  }
  localStorage.setItem('ghaithan_custom_pin', newPin);
  return true;
}

// ==========================================
// 5GB Chunked Resumable Upload Engine
// ==========================================

export class ChunkedUploader {
  private file: File;
  private chunkSize: number; // 5 MB chunks (safe under 32MB Cloud Run request limit)
  private totalChunks: number;
  private uploadId: string = '';
  private isPaused: boolean = false;
  private isCancelled: boolean = false;
  private uploadedChunks: Set<number> = new Set();
  private onProgress: (session: UploadSession) => void;
  private startTime: number = 0;
  private uploadedBytesInCurrentRun: number = 0;

  constructor(file: File, onProgress: (session: UploadSession) => void, chunkSize = 5 * 1024 * 1024) {
    this.file = file;
    this.onProgress = onProgress;
    this.chunkSize = chunkSize;
    this.totalChunks = Math.max(1, Math.ceil(file.size / this.chunkSize));
  }

  private getSessionStorageKey(): string {
    return `ghaithan_session_${this.file.name}_${this.file.size}_${this.file.lastModified}`;
  }

  public async start(): Promise<{ videoUrl: string; fileSize: number }> {
    if (this.file.size > MAX_VIDEO_SIZE_BYTES) {
      const msg = `حجم الملف (${formatBytes(this.file.size)}) يتجاوز الحد الأقصى المسموح به (5 جيجابايت).`;
      this.emitProgress('error', msg);
      throw new Error(msg);
    }

    this.isPaused = false;
    this.isCancelled = false;
    this.startTime = Date.now();
    this.uploadedBytesInCurrentRun = 0;

    const apiBase = getApiBase();
    const sessionKey = this.getSessionStorageKey();
    const savedSessionRaw = localStorage.getItem(sessionKey);

    if (savedSessionRaw) {
      try {
        const savedSession = JSON.parse(savedSessionRaw);
        this.uploadId = savedSession.uploadId || '';
        this.uploadedChunks = new Set(savedSession.uploadedChunks || []);
      } catch (e) {
        this.uploadId = '';
      }
    }

    // Verify existing session on server if resuming
    if (this.uploadId) {
      try {
        const statusRes = await fetch(`${apiBase}/api/upload/status?uploadId=${encodeURIComponent(this.uploadId)}`, {
          cache: 'no-store',
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.exists && Array.isArray(statusData.uploadedChunks)) {
            this.uploadedChunks = new Set(statusData.uploadedChunks);
          } else {
            // Session expired/cleaned on server, start fresh
            this.uploadId = '';
            this.uploadedChunks.clear();
          }
        }
      } catch (e) {
        console.warn('Could not verify chunk status from server:', e);
      }
    }

    // Initialize new upload session on server if needed
    if (!this.uploadId) {
      const initRes = await fetch(`${apiBase}/api/upload/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: this.file.name,
          fileSize: this.file.size,
          totalChunks: this.totalChunks,
          chunkSize: this.chunkSize,
        }),
      });

      if (!initRes.ok) {
        const errData = await initRes.json().catch(() => ({}));
        const msg = errData.error || 'تعذر الاتصال بخادم الرفع. يرجى التحقق من الإنترنت والمحاولة مرة أخرى.';
        this.emitProgress('error', msg);
        throw new Error(msg);
      }

      const initData = await initRes.json();
      this.uploadId = initData.uploadId;

      localStorage.setItem(
        sessionKey,
        JSON.stringify({
          uploadId: this.uploadId,
          fileName: this.file.name,
          fileSize: this.file.size,
          totalChunks: this.totalChunks,
          uploadedChunks: Array.from(this.uploadedChunks),
        })
      );
    }

    this.emitProgress('uploading');

    // Build list of remaining chunk indices
    const pendingChunks: number[] = [];
    for (let i = 0; i < this.totalChunks; i++) {
      if (!this.uploadedChunks.has(i)) pendingChunks.push(i);
    }

    // Upload remaining chunks with concurrency = 2 for faster 5GB uploads while keeping memory low
    const CONCURRENCY = 2;
    let cursor = 0;

    const uploadWorker = async () => {
      while (cursor < pendingChunks.length) {
        if (this.isCancelled) {
          localStorage.removeItem(sessionKey);
          throw new Error('تم إلغاء عملية الرفع من قبل المستخدم.');
        }

        if (this.isPaused) {
          throw new Error('PAUSED');
        }

        const chunkIndex = pendingChunks[cursor++];
        const start = chunkIndex * this.chunkSize;
        const end = Math.min(start + this.chunkSize, this.file.size);
        const chunkBlob = this.file.slice(start, end);
        const chunkSizeActual = end - start;

        let chunkSuccess = false;
        let attempts = 0;

        while (!chunkSuccess && attempts < 5 && !this.isPaused && !this.isCancelled) {
          attempts++;
          try {
            const chunkRes = await fetch(`${apiBase}/api/upload/chunk`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/octet-stream',
                'x-upload-id': this.uploadId,
                'x-chunk-index': String(chunkIndex),
                'x-total-chunks': String(this.totalChunks),
                'x-file-name': encodeURIComponent(this.file.name),
                'x-total-size': String(this.file.size),
              },
              body: chunkBlob,
            });

            if (chunkRes.ok) {
              chunkSuccess = true;
            } else {
              throw new Error(`Server returned ${chunkRes.status}`);
            }
          } catch (err) {
            if (attempts >= 5) {
              const msg = `فشل رفع القطعة (${chunkIndex + 1}/${this.totalChunks}). يمكنك الضغط على استئناف الرفع عند عودة الإنترنت.`;
              this.emitProgress('error', msg);
              throw new Error(msg);
            }
            await new Promise((r) => setTimeout(r, attempts * 1000));
          }
        }

        if (this.isCancelled) {
          localStorage.removeItem(sessionKey);
          throw new Error('تم إلغاء عملية الرفع من قبل المستخدم.');
        }

        if (this.isPaused) {
          throw new Error('PAUSED');
        }

        this.uploadedChunks.add(chunkIndex);
        this.uploadedBytesInCurrentRun += chunkSizeActual;

        localStorage.setItem(
          sessionKey,
          JSON.stringify({
            uploadId: this.uploadId,
            fileName: this.file.name,
            fileSize: this.file.size,
            totalChunks: this.totalChunks,
            uploadedChunks: Array.from(this.uploadedChunks),
          })
        );

        this.emitProgress('uploading');
      }
    };

    const workers = Array.from({ length: Math.min(CONCURRENCY, Math.max(1, pendingChunks.length)) }, () =>
      uploadWorker()
    );
    await Promise.all(workers);

    // Finalize & merge video on server
    this.emitProgress('merging');

    const completeRes = await fetch(`${apiBase}/api/upload/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId: this.uploadId,
        totalChunks: this.totalChunks,
        fileName: this.file.name,
      }),
    });

    if (!completeRes.ok) {
      const errData = await completeRes.json().catch(() => ({}));
      const msg = errData.error || 'فشل دمج أجزاء الفيديو على الخادم. اضغط إعادة المحاولة لاستكمال التجميع.';
      this.emitProgress('error', msg);
      throw new Error(msg);
    }

    const completeData = await completeRes.json();
    const finalVideoUrl = completeData.videoUrl || `/api/video/${this.uploadId}`;

    localStorage.removeItem(sessionKey);
    this.emitProgress('completed', undefined, finalVideoUrl);

    return {
      videoUrl: finalVideoUrl,
      fileSize: completeData.fileSize || this.file.size,
    };
  }

  public pause() {
    this.isPaused = true;
    this.emitProgress('paused');
  }

  public cancel() {
    this.isCancelled = true;
    localStorage.removeItem(this.getSessionStorageKey());
    this.emitProgress('idle');
  }

  private emitProgress(status: UploadSession['status'], errorMessage?: string, videoUrl?: string) {
    const uploadedChunksCount = this.uploadedChunks.size;
    const progressPercent = Math.min(100, Math.round((uploadedChunksCount / this.totalChunks) * 1000) / 10);
    const uploadedBytes = Math.min(this.file.size, uploadedChunksCount * this.chunkSize);

    const elapsedSeconds = Math.max(0.1, (Date.now() - this.startTime) / 1000);
    const speedBytesPerSec = this.uploadedBytesInCurrentRun / elapsedSeconds;
    const remainingBytes = Math.max(0, this.file.size - uploadedBytes);
    const etaSeconds = speedBytesPerSec > 0 ? remainingBytes / speedBytesPerSec : 0;

    this.onProgress({
      uploadId: this.uploadId,
      fileName: this.file.name,
      fileSize: this.file.size,
      chunkSize: this.chunkSize,
      totalChunks: this.totalChunks,
      uploadedChunks: Array.from(this.uploadedChunks),
      status,
      progressPercent,
      speedBytesPerSec,
      etaSeconds,
      uploadedBytes,
      errorMessage,
      videoUrl,
    });
  }
}
