require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// Importar rutas
const authRoutes = require('./routes/auth');
const aidRoutes = require('./routes/aids');
const inventoryRoutes = require('./routes/inventory');
const censoRoutes = require('./routes/censo');
const auditRoutes = require('./routes/audit');
const reportRoutes = require('./routes/reports');
const receiptRoutes = require('./routes/receipts');

// Inicializar aplicación
const app = express();

// Middleware de seguridad y análisis
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Pool de conexión a PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME
});

// Hacer pool disponible globalmente
global.db = pool;

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/aids', aidRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/censo', censoRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/receipts', receiptRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sistema de Ayudas está operativo' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    status: err.status || 500
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV}`);
});

module.exports = app;
