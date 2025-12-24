import cors from 'cors';
import express from 'express';
import i18n from './data/i18n.js';
import metadataRoutes from './routes/metadata.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Metadata routes
app.use('/metadata', metadataRoutes);

// I18n handler
app.get('/i18n/languages', (_req, res) => {
  res.status(200).json(i18n.languages);
});

app.get('/i18n/:lang.json', (req, res) => {
  res.status(200).json(i18n[req.params.lang]);
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[Mock Backend] Error:', err.message);
  res
    .status(500)
    .json({ error: 'Internal server error', message: err.message });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`[Mock Backend] Running on http://localhost:${PORT}`);
  console.log(`[Mock Backend] Endpoints available:`);
  console.log(`  - GET /health`);
  console.log(`  - GET /metadata/routes`);
  console.log(`  - GET /metadata/entities`);
  console.log(`  - GET /metadata/entities/:entity`);
  console.log(`  - GET /i18n/languages`);
  console.log(`  - GET /i18n/:lang.json`);
});
