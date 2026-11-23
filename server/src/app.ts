import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { config } from './config.js';
import { errorHandler, notFound } from './middleware/error.js';
import { resolveTenant } from './middleware/tenant.js';
import { healthRouter } from './routes/health.js';

/** Builds the Express application. Kept separate from `listen` so tests can import it. */
export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: config.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }));

  app.use('/health', healthRouter);

  // Everything under /api knows which forum (if any) it is talking to.
  const api = express.Router();
  api.use(resolveTenant);
  api.get('/', (req, res) => {
    res.json({ name: 'forum-builder', tenant: req.tenant?.subdomain ?? null });
  });
  app.use('/api', api);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
