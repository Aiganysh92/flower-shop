import { createApp } from './app.js';

// The port comes from the PORT environment variable (default 3000).
const PORT = process.env.PORT || 3000;

createApp().listen(PORT, () => {
  console.log(`Flower Shop API listening on http://localhost:${PORT}`);
});
