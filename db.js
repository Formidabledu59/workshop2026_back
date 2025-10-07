require('dotenv').config();
const mysql = require('mysql2/promise');

// Configuration BDD avec .env
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Pool de connexions
const pool = mysql.createPool(dbConfig);

// Fonction pour exécuter les requêtes
async function query(sql, params = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Erreur SQL:', error.message);
    throw error;
  }
}

// Test de connexion
async function testConnection() {
  try {
    await query('SELECT 1');
    console.log('Connexion BDD OK');
    return true;
  } catch (error) {
    console.error('Erreur connexion BDD:', error.message);
    return false;
  }
}

module.exports = { pool, query, testConnection };