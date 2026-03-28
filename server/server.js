import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { initializeDatabase } from './database.js';
import { createAuthRoutes } from './routes/auth.js';
import { createProductRoutes } from './routes/products.js';
import { createOrderRoutes } from './routes/orders.js';
import { createAdminRoutes } from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware-ek beállítása
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Postman/curl vagy ugyanazon origin esetén engedjük
    if (!origin) {
      return callback(null, true);
    }

    const isAllowedLocalhost = /^http:\/\/localhost:\d+$/.test(origin);
    const isAllowedConfigured = allowedOrigins.includes(origin);

    if (isAllowedLocalhost || isAllowedConfigured) {
      return callback(null, true);
    }

    return callback(new Error('CORS tiltva ennél az originnél'));
  },
  credentials: true,
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Adatbázis inicializálása
const db = initializeDatabase();

// Útvonalak csatlakoztatása
app.use('/api/auth', createAuthRoutes(db));
app.use('/api/products', createProductRoutes(db));
app.use('/api/orders', createOrderRoutes(db));
app.use('/api/admin', createAdminRoutes(db));

// Egészségi ellenőrzés
app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running' });
});

// Hiba kezelés
app.use((err, req, res, next) => {
  console.error('Hiba:', err);
  res.status(500).json({ error: 'Szerver hiba' });
});

// 404 kezelés
app.use((req, res) => {
  res.status(404).json({ error: 'Útvonal nem található' });
});

app.listen(PORT, () => {
  console.log(`🚀 API szerver elindult a http://localhost:${PORT} címen`);
});
