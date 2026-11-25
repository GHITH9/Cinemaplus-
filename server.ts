import express from 'express';
import path from 'path';
import { handleApiRequest } from './server/api.ts';

const app = express();
const PORT = process.env.PORT || 3000;

// API routes handled directly
app.use(async (req, res, next) => {
  if (req.url && req.url.startsWith('/api/')) {
    try {
      const handled = await handleApiRequest(req, res);
      if (handled) return;
    } catch (err) {
      console.error('API error:', err);
      res.status(500).json({ error: 'Server error' });
      return;
    }
  }
  next();
});

// Static assets from Vite build and public folder
const distPath = path.resolve(process.cwd(), 'dist');
const publicPath = path.resolve(process.cwd(), 'public');
app.use(express.static(distPath));
app.use(express.static(publicPath));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`🎬 خادم سينما غيثان يعمل بنجاح على المنفذ: ${PORT}`);
});
server.requestTimeout = 0;
server.headersTimeout = 60000;
