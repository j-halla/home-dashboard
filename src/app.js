import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from './config/index.js';
import { requestLogger } from './middleware/logging.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/api.js';
import sseRoutes from './routes/sse.js';

// Services
import { stationboardService } from './services/stationboardService.js';
import { lightService } from './services/lightService.js';
import { calendarService } from './services/calendarService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api', apiRoutes);
app.use('/sse', sseRoutes);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve node_modules for Bootstrap (from project root)
app.use('/node_modules', express.static(path.join(__dirname, '..', 'node_modules')));

// Error handler (must be last)
app.use(errorHandler);

// Initialize services and start server
async function start() {
  // Start all service polling
  await lightService.startPolling();
  stationboardService.startPolling();
  calendarService.startPolling();

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

start();
