const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * @swagger
 * /api/apps:
 *   get:
 *     summary: Liste toutes les applications
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/apps', async (req, res) => {
  console.log('GET /api/apps');
  try {
    const rows = await query(`
      SELECT 
        id, name, icon, color, type, theme_id, description, background_url
      FROM app 
      WHERE active = TRUE 
      ORDER BY theme_id, id
    `);

    res.json({
      success: true,
      count: rows.length,
      apps: rows
    });
  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @swagger
 * /api/app/{id}:
 *   get:
 *     summary: Détail app + questions
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/app/:id', async (req, res) => {
  const appId = parseInt(req.params.id);
  console.log(`GET /api/app/${appId}`);
  
  try {
    // Récupérer l'app
    const appRows = await query(`
      SELECT id, name, type, theme_id, background_url as background, description
      FROM app 
      WHERE id = ? AND active = TRUE
    `, [appId]);

    if (appRows.length === 0) {
      return res.status(404).json({ success: false, error: 'App non trouvée' });
    }

    // Récupérer les questions
    const questionRows = await query(`
      SELECT id, text, type, choices, answer, explanation
      FROM questions 
      WHERE app_id = ? AND active = TRUE
      ORDER BY id
    `, [appId]);

    // Formatter les questions (JSON choices)
    const questions = questionRows.map(q => {
      let choices = null;
      if (q.choices) {
        try {
          choices = typeof q.choices === 'string' ? JSON.parse(q.choices) : q.choices;
        } catch (e) {
          choices = null;
        }
      }
      
      return {
        id: q.id,
        text: q.text,
        type: q.type,
        choices,
        answer: q.answer,
        explanation: q.explanation
      };
    });

    const app = appRows[0];
    app.questions = questions;

    res.json({ success: true, app });

  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: Statistiques globales
 */
router.get('/stats', async (req, res) => {
  console.log('GET /api/stats');
  try {
    // Stats globales
    const globalStats = await query(`
      SELECT 
        COUNT(DISTINCT s.user_email) as total_users,
        COUNT(s.id) as total_scores,
        ROUND(AVG(s.score / s.total * 100), 2) as avg_percentage
      FROM scores s
      JOIN app a ON s.app_id = a.id
      WHERE a.active = TRUE
    `);

    // Stats par app
    const appStats = await query(`
      SELECT 
        a.id, a.name, a.icon,
        COUNT(s.id) as play_count,
        ROUND(AVG(s.score / s.total * 100), 2) as avg_score
      FROM app a
      LEFT JOIN scores s ON a.id = s.app_id
      WHERE a.active = TRUE
      GROUP BY a.id, a.name, a.icon
      ORDER BY play_count DESC
    `);

    res.json({
      success: true,
      global_stats: globalStats[0] || { total_users: 0, total_scores: 0, avg_percentage: 0 },
      app_stats: appStats
    });

  } catch (err) {
    console.error('Erreur:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;