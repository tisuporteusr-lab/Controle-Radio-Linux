import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import routes from './server/routes.js';
import { getDb } from './server/db.js';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // JSON and URL-encoded body parsing with support for PDF uploads
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ limit: '30mb', extended: true }));

  // Initialize DB
  await getDb();

  // API Healthcheck
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Direct PDF download route for manual without requiring login or web app
  app.get(['/manual-instalacao-oracle-linux.pdf', '/api/manual-instalacao-oracle-linux.pdf'], (req, res) => {
    const candidatePaths = [
      path.join(process.cwd(), 'public', 'manual-instalacao-oracle-linux.pdf'),
      path.join(process.cwd(), 'dist', 'manual-instalacao-oracle-linux.pdf'),
      path.join(process.cwd(), 'manual-instalacao-oracle-linux.pdf'),
    ];
    const foundPath = candidatePaths.find(p => fs.existsSync(p));
    if (foundPath) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="manual-instalacao-oracle-linux.pdf"');
      res.sendFile(foundPath);
    } else {
      res.status(404).send('PDF não encontrado.');
    }
  });

  // Mount application API routes
  app.use('/api', routes);

  // Vite Middleware for development vs Static dist for production
  const isProduction = process.env.NODE_ENV === 'production' || (typeof __filename !== 'undefined' && __filename.includes('dist'));
  if (!isProduction) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        allowedHosts: true,
        hmr: {
          port: PORT !== 3000 ? PORT + 1000 : 24678
        }
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Radio Maintenance Management server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
