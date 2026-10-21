import express from 'express';
import { flowers } from './flowers.js';

// createApp() builds the Express app without starting it,
// so the tests can start it on a random port.
export function createApp() {
  const app = express();

  // Health check: Docker and monitoring tools call this to see if the API is alive.
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Return the whole flower catalog.
  app.get('/api/flowers', (req, res) => {
    res.json(flowers);
  });

  // Return one flower by id, or 404 if it does not exist.
  app.get('/api/flowers/:id', (req, res) => {
    const flower = flowers.find((f) => f.id === Number(req.params.id));
    if (!flower) {
      return res.status(404).json({ error: 'Flower not found' });
    }
    res.json(flower);
  });

  // Any other URL returns 404 as JSON.
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
}
