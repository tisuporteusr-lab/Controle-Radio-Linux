import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import routes from './server/routes.js';
import { getDb } from './server/db.js';

// Define o diretório raiz absoluto do projeto
const rootDir = process.cwd();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3050;

  // JSON e URL-encoded com limite para arquivos pesados (PDFs)
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ limit: '30mb', extended: true }));

  // Inicializar o Banco de Dados
  await getDb();

  // API Healthcheck
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Rotas da API
  app.use('/api', routes);

  // Servir a pasta dist (garantindo o caminho correto /opt/controle-radio/dist)
  const distPath = path.join(rootDir, 'dist');
  app.use(express.static(distPath));

  // Fallback para SPA (React Router) em produção
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Radio Maintenance Management server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});