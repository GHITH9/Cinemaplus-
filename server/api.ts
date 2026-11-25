import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

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
}

export interface CatalogItem {
  id: string;
  title: string;
  type: 'movie' | 'series';
  genre: string;
  year: string;
  quality: string;
  rating: string;
  duration: string;
  synopsis: string;
  poster: string;
  backdrop?: string;
  videoUrl: string;
  fileSize?: number;
  createdAt: string;
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
const DATA_DIR = path.resolve(process.cwd(), 'data');
const MOVIES_FILE = path.join(DATA_DIR, 'movies.json');
const CATALOG_FILE = path.join(DATA_DIR, 'catalog.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const DEV_AUTH_FILE = path.join(DATA_DIR, 'dev-auth.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const CHUNKS_DIR = path.join(UPLOADS_DIR, 'chunks');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(CHUNKS_DIR)) fs.mkdirSync(CHUNKS_DIR, { recursive: true });
  if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

  if (!fs.existsSync(MOVIES_FILE)) {
    fs.writeFileSync(MOVIES_FILE, JSON.stringify([], null, 2));
  }

  if (!fs.existsSync(CATALOG_FILE)) {
    fs.writeFileSync(CATALOG_FILE, JSON.stringify([], null, 2));
  }

  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(
      SETTINGS_FILE,
      JSON.stringify(
        {
          adminPin: '7121',
          storageProvider: 'local',
          appTitle: 'سينما بلس | Cinema Plus',
          owner: 'غيثان باحاج',
          whatsapp: '+967772908480',
          publicSiteUrl: 'https://cinemaplus.lat',
        },
        null,
        2
      )
    );
  }
}

ensureDirs();

function atomicWriteJson(filePath: string, data: unknown) {
  ensureDirs();
  const tmpFile = `${filePath}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2));
  fs.renameSync(tmpFile, filePath);
}

export function getMovies(): Movie[] {
  try {
    ensureDirs();
    return JSON.parse(fs.readFileSync(MOVIES_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

export function saveMovies(movies: Movie[]) {
  atomicWriteJson(MOVIES_FILE, movies);
}

export function getCatalog(): CatalogItem[] {
  try {
    ensureDirs();
    return JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

export function saveCatalog(items: CatalogItem[]) {
  atomicWriteJson(CATALOG_FILE, items);
}

export function getSettings() {
  try {
    ensureDirs();
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
  } catch {
    return { adminPin: '7121' };
  }
}

export function saveSettings(settings: Record<string, unknown>) {
  atomicWriteJson(SETTINGS_FILE, settings);
}

interface DevAuthStore {
  tokenSecret: string;
  pinHash?: string;
  pinSalt?: string;
}

function getDevAuthStore(): DevAuthStore {
  ensureDirs();
  try {
    if (fs.existsSync(DEV_AUTH_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DEV_AUTH_FILE, 'utf-8'));
      if (parsed && typeof parsed.tokenSecret === 'string') {
        return parsed;
      }
    }
  } catch {}
  const initial: DevAuthStore = {
    tokenSecret: crypto.randomBytes(32).toString('hex'),
  };
  atomicWriteJson(DEV_AUTH_FILE, initial);
  return initial;
}

function saveDevAuthStore(store: DevAuthStore) {
  atomicWriteJson(DEV_AUTH_FILE, store);
}

function hashPin(pin: string, salt: string): string {
  return crypto.scryptSync(pin, salt, 32).toString('hex');
}

function verifyPinMatch(pin: string, salt: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashPin(pin, salt), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

function createDevToken(secret: string): string {
  const payload = Buffer.from(
    JSON.stringify({ iat: Date.now(), exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyDevToken(authHeader: string | undefined): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7).trim();
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const store = getDevAuthStore();
  const expectedSig = crypto.createHmac('sha256', store.tokenSecret).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    return typeof decoded.exp === 'number' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_.-]/g, '');
}

function getSafeVideoExt(fileName: string): string {
  const ext = path.extname(fileName || '').toLowerCase();
  const allowed = ['.mp4', '.webm', '.mkv', '.mov', '.m4v'];
  return allowed.includes(ext) ? ext : '.mp4';
}

function getVideoMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.webm':
      return 'video/webm';
    case '.mkv':
      return 'video/x-matroska';
    case '.mov':
      return 'video/quicktime';
    case '.m4v':
    case '.mp4':
    default:
      return 'video/mp4';
  }
}

function resolveVideoPath(fileId: string): string | null {
  const safeId = sanitizeId(fileId);
  if (!safeId) return null;

  const directPath = path.join(VIDEOS_DIR, safeId);
  if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
    return directPath;
  }

  for (const ext of ['.mp4', '.webm', '.mkv', '.mov', '.m4v']) {
    const candidate = path.join(VIDEOS_DIR, `${safeId}${ext}`);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

function removeMediaAssets(videoUrl?: string, posterUrl?: string) {
  if (videoUrl && videoUrl.startsWith('/api/video/')) {
    const fileId = videoUrl.replace('/api/video/', '');
    const videoPath = resolveVideoPath(fileId);
    if (videoPath) {
      try {
        fs.unlinkSync(videoPath);
      } catch {}
    }
  }
  if (posterUrl && posterUrl.startsWith('/api/image/')) {
    const imgName = sanitizeId(posterUrl.replace('/api/image/', ''));
    const imgPath = path.join(IMAGES_DIR, imgName);
    if (fs.existsSync(imgPath)) {
      try {
        fs.unlinkSync(imgPath);
      } catch {}
    }
  }
}

export async function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

async function streamRequestToFile(req: IncomingMessage, destPath: string): Promise<number> {
  const tmpPath = `${destPath}.part_${Date.now()}`;
  return new Promise((resolve, reject) => {
    let bytesWritten = 0;
    const writeStream = fs.createWriteStream(tmpPath);

    req.on('data', (chunk: Buffer) => {
      bytesWritten += chunk.length;
    });

    req.on('aborted', () => {
      writeStream.destroy();
      try {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch {}
      reject(new Error('Upload request aborted'));
    });

    writeStream.on('error', (err) => {
      try {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch {}
      reject(err);
    });

    writeStream.on('finish', () => {
      try {
        fs.renameSync(tmpPath, destPath);
        resolve(bytesWritten);
      } catch (err) {
        reject(err);
      }
    });

    req.pipe(writeStream);
  });
}

function appendChunkToStream(chunkPath: string, writeStream: fs.WriteStream): Promise<void> {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(chunkPath, { highWaterMark: 1024 * 1024 });
    readStream.on('error', reject);
    readStream.on('end', resolve);
    readStream.pipe(writeStream, { end: false });
  });
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (pathname.startsWith('/api/upload/') || pathname.startsWith('/api/video/') || pathname === '/api/media') {
    req.setTimeout?.(0);
    res.setTimeout?.(0);
  }

  const setCors = () => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, Range, x-upload-id, x-chunk-index, x-total-chunks, x-file-name, x-total-size, x-image-ext'
    );
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
  };

  if (req.method === 'OPTIONS') {
    setCors();
    res.statusCode = 204;
    res.end();
    return true;
  }

  // ========================
  // Cinema Plus Endpoints
  // ========================

  // GET /api/site-config
  if (pathname === '/api/site-config' && req.method === 'GET') {
    setCors();
    const hostHeader = String(req.headers['x-forwarded-host'] || req.headers.host || '');
    const currentHost = hostHeader.split(':')[0];
    const isCustomDomainActive =
      Boolean(currentHost) &&
      !currentHost.startsWith('ais-dev-') &&
      !currentHost.startsWith('ais-pre-') &&
      currentHost !== 'localhost' &&
      currentHost !== '127.0.0.1';

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        publicSiteUrl: 'https://cinemaplus.lat',
        currentHost: currentHost || 'remix-cinema-plus-5101.ai.studio',
        isCustomDomainActive,
      })
    );
    return true;
  }

  // GET /api/catalog (shared catalog visible to everyone worldwide)
  if (pathname === '/api/catalog' && req.method === 'GET') {
    setCors();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.statusCode = 200;
    res.end(JSON.stringify({ items: getCatalog() }));
    return true;
  }

  // GET /api/dev/status
  if (pathname === '/api/dev/status' && req.method === 'GET') {
    setCors();
    const envPin = (process.env.DEV_PIN || '').trim();
    const store = getDevAuthStore();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        hasConfiguredPin: Boolean(envPin || (store.pinHash && store.pinSalt)),
        managedByEnv: Boolean(envPin),
      })
    );
    return true;
  }

  // POST /api/dev/claim (set initial 8-digit developer PIN)
  if (pathname === '/api/dev/claim' && req.method === 'POST') {
    setCors();
    try {
      const data = await parseJsonBody(req);
      const pin = String(data.pin || '').trim();
      if (!/^\d{8}$/.test(pin)) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'يجب أن يتكون رمز المطور من 8 أرقام' }));
        return true;
      }

      const envPin = (process.env.DEV_PIN || '').trim();
      const store = getDevAuthStore();
      if (envPin || (store.pinHash && store.pinSalt)) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 409;
        res.end(JSON.stringify({ error: 'تم تعيين رمز المطور مسبقاً' }));
        return true;
      }

      const salt = crypto.randomBytes(16).toString('hex');
      store.pinSalt = salt;
      store.pinHash = hashPin(pin, salt);
      saveDevAuthStore(store);

      const token = createDevToken(store.tokenSecret);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ token, claimed: true }));
      return true;
    } catch {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'طلب غير صالح' }));
      return true;
    }
  }

  // POST /api/dev/login (verify 8-digit developer PIN)
  if (pathname === '/api/dev/login' && req.method === 'POST') {
    setCors();
    try {
      const data = await parseJsonBody(req);
      const pin = String(data.pin || '').trim();
      const envPin = (process.env.DEV_PIN || '').trim();
      const store = getDevAuthStore();

      let valid = false;
      if (envPin) {
        const a = Buffer.from(pin);
        const b = Buffer.from(envPin);
        valid = a.length === b.length && crypto.timingSafeEqual(a, b);
      } else if (store.pinHash && store.pinSalt) {
        valid = verifyPinMatch(pin, store.pinSalt, store.pinHash);
      }

      if (!valid) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'رمز المطور غير صحيح، حاول مرة أخرى' }));
        return true;
      }

      const token = createDevToken(store.tokenSecret);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ token }));
      return true;
    } catch {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'طلب غير صالح' }));
      return true;
    }
  }

  // POST /api/dev/pin (update 8-digit developer PIN)
  if (pathname === '/api/dev/pin' && req.method === 'POST') {
    setCors();
    if (!verifyDevToken(req.headers.authorization)) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'يرجى تسجيل الدخول كـ مطوّر أولاً' }));
      return true;
    }
    try {
      const envPin = (process.env.DEV_PIN || '').trim();
      if (envPin) {
        res.statusCode = 403;
        res.end(JSON.stringify({ error: 'الرمز مُدار من إعدادات البيئة' }));
        return true;
      }

      const data = await parseJsonBody(req);
      const oldPin = String(data.oldPin || '').trim();
      const newPin = String(data.newPin || '').trim();
      if (!/^\d{8}$/.test(newPin)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'يجب أن يتكون الرمز الجديد من 8 أرقام' }));
        return true;
      }

      const store = getDevAuthStore();
      if (!store.pinHash || !store.pinSalt || !verifyPinMatch(oldPin, store.pinSalt, store.pinHash)) {
        res.statusCode = 401;
        res.end(JSON.stringify({ error: 'الرمز الحالي غير صحيح' }));
        return true;
      }

      const salt = crypto.randomBytes(16).toString('hex');
      store.pinSalt = salt;
      store.pinHash = hashPin(newPin, salt);
      saveDevAuthStore(store);

      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
      return true;
    } catch {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'تعذر تحديث الرمز' }));
      return true;
    }
  }

  // POST /api/media (publish uploaded 5GB movie/series to shared global catalog)
  if (pathname === '/api/media' && req.method === 'POST') {
    setCors();
    if (!verifyDevToken(req.headers.authorization)) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'يرجى فتح وضع المطور أولاً' }));
      return true;
    }
    try {
      const data = await parseJsonBody(req);
      const title = String(data.title || '').trim();
      const videoUrl = String(data.videoUrl || '').trim();
      if (!title) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'يرجى إدخال عنوان الفيلم أو المسلسل' }));
        return true;
      }
      if (!videoUrl || videoUrl.startsWith('blob:')) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'يرجى انتظار اكتمال رفع ملف الفيديو أو إدخال رابط تشغيل صحيح' }));
        return true;
      }
      const isLocalMedia = videoUrl.startsWith('/api/video/');
      const isHttpMedia = /^https?:\/\/.+/i.test(videoUrl);
      if (!isLocalMedia && !isHttpMedia) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'رابط الفيديو غير صالح، يجب أن يبدأ بـ http:// أو https://' }));
        return true;
      }
      const rawPoster = String(data.poster || '').trim();
      const safePoster =
        rawPoster.startsWith('/api/image/') ||
        /^https?:\/\/.+/i.test(rawPoster) ||
        /^data:image\/[a-z0-9.+-]+;base64,/i.test(rawPoster)
          ? rawPoster
          : '';
      const fileSize = Number(data.fileSize) || 0;
      if (fileSize > MAX_UPLOAD_BYTES) {
        res.statusCode = 413;
        res.end(JSON.stringify({ error: 'الحد الأقصى لحجم الفيلم هو 5 جيجابايت (5GB)' }));
        return true;
      }

      const newItem: CatalogItem = {
        id: sanitizeId(String(data.id || '')) || `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title,
        type: data.type === 'series' ? 'series' : 'movie',
        genre: String(data.genre || 'أكشن'),
        year: String(data.year || '2026'),
        quality: String(data.quality || '4K UHD'),
        rating: String(data.rating || '9.0'),
        duration: String(data.duration || (data.type === 'series' ? 'مسلسل' : 'فيلم كامل')),
        synopsis: String(data.synopsis || '').trim() || 'عمل مرئي مرفوع عبر منصة سينما بلس.',
        poster: safePoster,
        backdrop: String(data.backdrop || safePoster || ''),
        videoUrl,
        fileSize,
        createdAt: new Date().toISOString(),
      };

      const items = getCatalog();
      items.unshift(newItem);
      saveCatalog(items);

      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 201;
      res.end(JSON.stringify({ item: newItem }));
      return true;
    } catch (err: any) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: err?.message || 'فشل حفظ العمل' }));
      return true;
    }
  }

  // DELETE /api/media/:id
  if (pathname.startsWith('/api/media/') && req.method === 'DELETE') {
    setCors();
    if (!verifyDevToken(req.headers.authorization)) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'يرجى فتح وضع المطور أولاً' }));
      return true;
    }
    const id = decodeURIComponent(pathname.replace('/api/media/', ''));
    const items = getCatalog();
    const target = items.find((item) => item.id === id);
    if (!target) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'العنصر غير موجود' }));
      return true;
    }
    saveCatalog(items.filter((item) => item.id !== id));
    removeMediaAssets(target.videoUrl, target.poster);

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, id }));
    return true;
  }

  // ========================
  // Legacy / Shared Movie & 5GB Chunked Upload Endpoints
  // ========================

  // 1. GET /api/movies
  if (pathname === '/api/movies' && req.method === 'GET') {
    setCors();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.statusCode = 200;
    res.end(JSON.stringify(getMovies()));
    return true;
  }

  // 2. POST /api/movies
  if (pathname === '/api/movies' && req.method === 'POST') {
    setCors();
    try {
      const data = await parseJsonBody(req);
      const movies = getMovies();
      const newMovie: Movie = {
        id: data.id || `movie_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: data.title || 'فيلم بدون عنوان',
        coverImage: data.coverImage || '',
        genre: data.genre || 'عام',
        duration: data.duration || '0 دقيقة',
        rating: Number(data.rating) || 8.0,
        description: data.description || '',
        videoUrl: data.videoUrl || '',
        fileSize: data.fileSize || 0,
        createdAt: new Date().toISOString(),
        status: data.status === 'draft' ? 'draft' : 'published',
        views: 0,
      };
      movies.unshift(newMovie);
      saveMovies(movies);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 201;
      res.end(JSON.stringify(newMovie));
      return true;
    } catch (err: any) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: err?.message || 'Invalid movie payload' }));
      return true;
    }
  }

  // 3. PUT /api/movies/:id
  if (pathname.startsWith('/api/movies/') && req.method === 'PUT') {
    setCors();
    const id = pathname.replace('/api/movies/', '');
    try {
      const data = await parseJsonBody(req);
      const movies = getMovies();
      const index = movies.findIndex((m) => m.id === id);
      if (index === -1) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Movie not found' }));
        return true;
      }
      movies[index] = { ...movies[index], ...data, id };
      saveMovies(movies);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify(movies[index]));
      return true;
    } catch (err: any) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: err?.message || 'Update failed' }));
      return true;
    }
  }

  // 4. DELETE /api/movies/:id
  if (pathname.startsWith('/api/movies/') && req.method === 'DELETE') {
    setCors();
    const id = pathname.replace('/api/movies/', '');
    const movies = getMovies();
    const target = movies.find((m) => m.id === id);
    saveMovies(movies.filter((m) => m.id !== id));

    if (target) {
      removeMediaAssets(target.videoUrl, target.coverImage);
    }

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, id }));
    return true;
  }

  // 5. Admin Authentication: POST /api/admin/login
  if (pathname === '/api/admin/login' && req.method === 'POST') {
    setCors();
    try {
      const data = await parseJsonBody(req);
      const settings = getSettings();
      const inputPin = String(data.pin || '').trim();
      const actualPin = String(settings.adminPin || '7121').trim();

      if (inputPin === actualPin) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, token: `ghaithan_dev_${Date.now()}` }));
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 401;
        res.end(JSON.stringify({ success: false, error: 'رمز المرور غير صحيح' }));
      }
      return true;
    } catch {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'خطأ في التحقق' }));
      return true;
    }
  }

  // 6. Admin Settings / Change PIN: POST /api/admin/change-pin
  if (pathname === '/api/admin/change-pin' && req.method === 'POST') {
    setCors();
    try {
      const data = await parseJsonBody(req);
      const settings = getSettings();
      if (data.newPin && String(data.newPin).length >= 4) {
        settings.adminPin = String(data.newPin).trim();
        saveSettings(settings);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, message: 'تم تحديث رمز المرور بنجاح' }));
      } else {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'رمز المرور يجب أن يتكون من 4 أرقام أو أكثر' }));
      }
      return true;
    } catch {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'فشل التحديث' }));
      return true;
    }
  }

  // 7. GET /api/settings
  if (pathname === '/api/settings' && req.method === 'GET') {
    setCors();
    const settings = getSettings();
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        storageProvider: settings.storageProvider || 'local',
        appTitle: settings.appTitle || 'سينما بلس | Cinema Plus',
        owner: settings.owner || 'غيثان باحاج',
        whatsapp: '+967772908480',
        officialDomain: 'https://cinemaplus.lat',
      })
    );
    return true;
  }

  // 7.5 Upload Poster Image: POST /api/upload/image
  if (pathname === '/api/upload/image' && req.method === 'POST') {
    setCors();
    try {
      ensureDirs();
      const rawExt = String(req.headers['x-image-ext'] || '.jpg').toLowerCase();
      const allowedImgExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const ext = allowedImgExt.includes(rawExt) ? rawExt : '.jpg';
      const imgId = `poster_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
      const destPath = path.join(IMAGES_DIR, imgId);
      await streamRequestToFile(req, destPath);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, imageUrl: `/api/image/${imgId}` }));
      return true;
    } catch (err: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err?.message || 'Image upload failed' }));
      return true;
    }
  }

  // 7.6 Serve Poster Image: GET /api/image/:imgId
  if (pathname.startsWith('/api/image/') && (req.method === 'GET' || req.method === 'HEAD')) {
    setCors();
    const imgId = sanitizeId(pathname.replace('/api/image/', ''));
    const imgPath = path.join(IMAGES_DIR, imgId);
    if (!imgId || !fs.existsSync(imgPath)) {
      res.statusCode = 404;
      res.end('الصورة غير موجودة');
      return true;
    }
    const ext = path.extname(imgPath).toLowerCase();
    const mime =
      ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
    const stat = fs.statSync(imgPath);
    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Length': stat.size,
      'Cache-Control': 'public, max-age=86400',
    });
    if (req.method === 'HEAD') {
      res.end();
      return true;
    }
    fs.createReadStream(imgPath).pipe(res);
    return true;
  }

  // 8. Chunked Upload Session: POST /api/upload/init
  if (pathname === '/api/upload/init' && req.method === 'POST') {
    setCors();
    try {
      ensureDirs();
      const data = await parseJsonBody(req);
      const fileSize = Number(data.fileSize) || 0;
      if (fileSize > MAX_UPLOAD_BYTES) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 413;
        res.end(JSON.stringify({ error: 'حجم الملف يتجاوز الحد الأقصى المسموح به (5 جيجابايت).' }));
        return true;
      }

      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const sessionDir = path.join(CHUNKS_DIR, uploadId);
      fs.mkdirSync(sessionDir, { recursive: true });

      const metadata = {
        uploadId,
        fileName: data.fileName || 'video.mp4',
        fileExt: getSafeVideoExt(data.fileName || 'video.mp4'),
        fileSize,
        totalChunks: Number(data.totalChunks) || 1,
        chunkSize: Number(data.chunkSize) || 5 * 1024 * 1024,
        createdAt: new Date().toISOString(),
      };

      fs.writeFileSync(path.join(sessionDir, 'meta.json'), JSON.stringify(metadata, null, 2));

      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify(metadata));
      return true;
    } catch (err: any) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: err?.message || 'Failed to initialize upload' }));
      return true;
    }
  }

  // 9. Chunk Upload Status: GET /api/upload/status
  if (pathname === '/api/upload/status' && req.method === 'GET') {
    setCors();
    const uploadId = sanitizeId(url.searchParams.get('uploadId') || '');
    if (!uploadId) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Missing uploadId' }));
      return true;
    }

    const sessionDir = path.join(CHUNKS_DIR, uploadId);
    if (!fs.existsSync(sessionDir)) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ exists: false, uploadedChunks: [] }));
      return true;
    }

    const files = fs.readdirSync(sessionDir);
    const uploadedChunks = files
      .filter((f) => /^chunk_\d+$/.test(f))
      .map((f) => parseInt(f.replace('chunk_', ''), 10))
      .filter((n) => !isNaN(n));

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ exists: true, uploadedChunks }));
    return true;
  }

  // 10. Upload Individual Chunk: POST /api/upload/chunk
  if (pathname === '/api/upload/chunk' && req.method === 'POST') {
    setCors();
    try {
      ensureDirs();
      const uploadId = sanitizeId((req.headers['x-upload-id'] as string) || '');
      const chunkIndex = parseInt(req.headers['x-chunk-index'] as string, 10);
      const totalSize = parseInt((req.headers['x-total-size'] as string) || '0', 10);

      if (!uploadId || isNaN(chunkIndex) || chunkIndex < 0) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Missing x-upload-id or x-chunk-index header' }));
        return true;
      }

      if (totalSize > MAX_UPLOAD_BYTES) {
        res.statusCode = 413;
        res.end(JSON.stringify({ error: 'حجم الملف يتجاوز 5 جيجابايت' }));
        return true;
      }

      const sessionDir = path.join(CHUNKS_DIR, uploadId);
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }

      const chunkFilePath = path.join(sessionDir, `chunk_${chunkIndex}`);
      const bytesReceived = await streamRequestToFile(req, chunkFilePath);

      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, chunkIndex, bytesReceived }));
      return true;
    } catch (err: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err?.message || 'Failed writing chunk' }));
      return true;
    }
  }

  // 11. Finalize Chunk Merge: POST /api/upload/complete
  if (pathname === '/api/upload/complete' && req.method === 'POST') {
    setCors();
    try {
      ensureDirs();
      const data = await parseJsonBody(req);
      const uploadId = sanitizeId(String(data.uploadId || ''));
      if (!uploadId) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Missing uploadId' }));
        return true;
      }

      const sessionDir = path.join(CHUNKS_DIR, uploadId);
      if (!fs.existsSync(sessionDir)) {
        const existingVideo = resolveVideoPath(uploadId);
        if (existingVideo) {
          const stat = fs.statSync(existingVideo);
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(
            JSON.stringify({
              success: true,
              videoUrl: `/api/video/${uploadId}`,
              fileSize: stat.size,
              message: 'اكتمل رفع ملف الفيلم وتجميعه بنجاح!',
            })
          );
          return true;
        }
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Upload session not found' }));
        return true;
      }

      const metaPath = path.join(sessionDir, 'meta.json');
      const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf-8')) : {};
      const totalChunks = Number(data.totalChunks || meta.totalChunks || 1);
      const ext = meta.fileExt || getSafeVideoExt(data.fileName || meta.fileName || '.mp4');
      const finalFileName = `${uploadId}${ext}`;
      const finalFilePath = path.join(VIDEOS_DIR, finalFileName);
      const tempFinalPath = `${finalFilePath}.merging`;

      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(sessionDir, `chunk_${i}`);
        if (!fs.existsSync(chunkPath)) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: `القطعة رقم ${i} مفقودة، يرجى استئناف الرفع.` }));
          return true;
        }
      }

      const writeStream = fs.createWriteStream(tempFinalPath, { highWaterMark: 1024 * 1024 });
      const writeErrorPromise = new Promise<never>((_, reject) => {
        writeStream.on('error', reject);
      });

      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(sessionDir, `chunk_${i}`);
        await Promise.race([appendChunkToStream(chunkPath, writeStream), writeErrorPromise]);
        try {
          fs.unlinkSync(chunkPath);
        } catch {}
      }

      await new Promise<void>((resolve, reject) => {
        writeStream.on('error', reject);
        writeStream.on('finish', resolve);
        writeStream.end();
      });

      fs.renameSync(tempFinalPath, finalFilePath);
      const finalStat = fs.statSync(finalFilePath);

      try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      } catch {}

      const videoUrl = `/api/video/${uploadId}`;
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          success: true,
          videoUrl,
          fileSize: finalStat.size || meta.fileSize || 0,
          fileName: meta.fileName || finalFileName,
          message: 'اكتمل رفع ملف الفيلم وتجميعه بنجاح!',
        })
      );
      return true;
    } catch (err: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err?.message || 'Failed merging video chunks' }));
      return true;
    }
  }

  // 12. Video Streaming with HTTP Range & HEAD Support
  if (pathname.startsWith('/api/video/') && (req.method === 'GET' || req.method === 'HEAD')) {
    setCors();
    const fileId = pathname.replace('/api/video/', '');
    const videoFilePath = resolveVideoPath(fileId);

    if (!videoFilePath) {
      res.statusCode = 404;
      res.end('الفيديو غير موجود');
      return true;
    }

    const stat = fs.statSync(videoFilePath);
    const fileSize = stat.size;
    const mimeType = getVideoMimeType(videoFilePath);
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? Math.min(parseInt(parts[1], 10), fileSize - 1) : fileSize - 1;

      if (isNaN(start) || start < 0 || start >= fileSize || end < start) {
        res.statusCode = 416;
        res.setHeader('Content-Range', `bytes */${fileSize}`);
        res.end();
        return true;
      }

      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600',
      });

      if (req.method === 'HEAD') {
        res.end();
        return true;
      }

      const fileStream = fs.createReadStream(videoFilePath, { start, end, highWaterMark: 512 * 1024 });
      fileStream.on('error', () => {
        if (!res.headersSent) res.statusCode = 500;
        res.end();
      });
      res.on('close', () => {
        fileStream.destroy();
      });
      fileStream.pipe(res);
      return true;
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      });

      if (req.method === 'HEAD') {
        res.end();
        return true;
      }

      const fileStream = fs.createReadStream(videoFilePath, { highWaterMark: 512 * 1024 });
      fileStream.on('error', () => {
        if (!res.headersSent) res.statusCode = 500;
        res.end();
      });
      res.on('close', () => {
        fileStream.destroy();
      });
      fileStream.pipe(res);
      return true;
    }
  }

  return false;
}
