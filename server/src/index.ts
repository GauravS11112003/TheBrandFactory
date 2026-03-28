import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { setupRoutes } from './routes';

dotenv.config({ path: '../.env' }); // Read root project .env
dotenv.config();                     // Also read server/.env (for PEXELS_API_KEY etc)

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

setupRoutes(app);

// In production, serve the built Vite frontend
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../../client-dist');
  app.use(express.static(clientDistPath));
  
  // SPA catch-all: serve index.html for all non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Brand Factory API server running on port ${PORT}`);
});
