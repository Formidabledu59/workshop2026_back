const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * @swagger
 * /scores:
 *   get:
 *     summary: Récupérer tous les scores
 */
router.get('/', async (req, res) => {
  console.log('GET /scores');
  try {
    const { user_email, app_id } = req.query;
    
    let sql = `
      SELECT 
        s.*, 
        ROUND((s.score / s.total) * 100, 0) as percentage,
        a.name as app_name, 
        a. iconIcon as app_icon
      FROM scores s
      LEFT JOIN app a ON s.app_id = a.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (user_email) {
      conditions.push('s.user_email = ?');
      params.push(user_email);
    }
    
    if (app_id) {
      conditions.push('s.app_id = ?');
      params.push(app_id);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY s.created_at DESC';
    
    const rows = await query(sql, params);
    
    // Format pour mobile
    res.json({
      success: true,
      count: rows.length,
      scores: rows
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /scores/{id}:
 *   get:
 *     summary: Récupérer un score par ID
 */
router.get('/:id', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM scores WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Score not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /scores:
 *   post:
 *     summary: Ajouter un nouveau score (amélioré pour mobile)
 */
router.post('/', async (req, res) => {
  console.log('POST /scores');
  try {
    const { user_email, app_id, theme_id, score, total } = req.body;

    // Si app_id fourni, récupérer theme_id automatiquement
    let finalThemeId = theme_id;
    if (app_id && !theme_id) {
      const appRows = await query('SELECT theme_id FROM app WHERE id = ?', [app_id]);
      if (appRows.length > 0) {
        finalThemeId = appRows[0].theme_id;
      }
    }

    const result = await query(
      `INSERT INTO scores (user_email, app_id, theme_id, score, total) VALUES (?, ?, ?, ?, ?)`,
      [user_email, app_id || null, finalThemeId || theme_id, score, total]
    );

    const percentage = Math.round((score / total) * 100);

    res.status(201).json({
      success: true,
      score_id: result.insertId,
      percentage,
      user_email, app_id, score, total
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /scores/{id}:
 *   put:
 *     summary: Modifier un score
 */
router.put('/:id', async (req, res) => {
  try {
    const { user_email, app_id, theme_id, score, total } = req.body;
    const result = await query(
      `UPDATE scores SET user_email=?, app_id=?, theme_id=?, score=?, total=? WHERE id=?`,
      [user_email, app_id, theme_id, score, total, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Score not found' });
    res.json({ id: req.params.id, user_email, app_id, theme_id, score, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /scores/{id}:
 *   delete:
 *     summary: Supprimer un score
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM scores WHERE id=?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Score not found' });
    res.json({ message: 'Score deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;