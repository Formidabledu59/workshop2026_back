require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { testConnection } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Workshop API',
      version: '1.0.0',
      description: 'API pour Workshop Mobile M1 2025-2026'
    },
    servers: [{ url: `http://localhost:${PORT}` }]
  },
  apis: ['./routes/*.js']
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Page d'accueil
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Import et utilisation des routes
app.use('/api', require('./routes/apps'));
app.use('/questions', require('./routes/questions'));
app.use('/scores', require('./routes/scores'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} non trouvée`
  });
});

// Erreur globale
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Erreur serveur'
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 Serveur lancé: http://localhost:${PORT}`);
  console.log(`📖 Swagger: http://localhost:${PORT}/api-docs`);
  console.log(`📱 Nouvelles routes: http://localhost:${PORT}/api/apps`);
  
  // Test BDD
  await testConnection();
});

module.exports = app;