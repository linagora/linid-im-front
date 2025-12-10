import express from 'express';
import cors from 'cors';
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

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[Mock Backend] Error:', err.message);
  res
    .status(500)
    .json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`[Mock Backend] Running on http://localhost:${PORT}`);
  console.log(`[Mock Backend] Endpoints available:`);
  console.log(`  - GET /health`);
  console.log(`  - GET /metadata/routes`);
  console.log(`  - GET /metadata/entities`);
  console.log(`  - GET /metadata/entities/:entity`);
});
