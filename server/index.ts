import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/database.js';
import prototypesRouter from './routes/prototypes.js';
import versionsRouter from './routes/versions.js';
import favoritesRouter from './routes/favorites.js';
import shareRouter from './routes/share.js';
import zoneTemplatesRouter from './routes/zone-templates.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initializeDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/prototypes', prototypesRouter);
app.use('/api/prototypes', versionsRouter);  // Version history endpoints nested under prototypes
app.use('/api/favorites', favoritesRouter);
app.use('/api/share', shareRouter);
app.use('/api/zone-templates', zoneTemplatesRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
