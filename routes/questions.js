const express = require('express');
const router = express.Router();
const { query } = require('../db');

/**
 * @swagger
 * /questions:
 *   get:
 *     summary: Récupérer toutes les questions
 */
router.get('/', async (req, res) => {
  console.log('GET /questions');
  try {
    const rows = await query('SELECT * FROM questions ORDER BY app_id, id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /questions/{id}:
 *   get:
 *     summary: Récupérer une question par ID
 */
router.get('/:id', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM questions WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Question not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /questions:
 *   post:
 *     summary: Ajouter une nouvelle question
 */
router.post('/', async (req, res) => {
  console.log('POST /questions');
  try {
    const { app_id, theme_id, text, type, choices, answer, explanation, difficulty, active } = req.body;
    
    const finalAppId = app_id || theme_id || 1;
    
    const result = await query(
      `INSERT INTO questions (app_id, theme_id, text, type, choices, answer, explanation, difficulty, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalAppId,
        theme_id || finalAppId,
        text,
        type,
        choices ? JSON.stringify(choices) : null,
        answer,
        explanation || null,
        difficulty || null,
        active ?? 1
      ]
    );

    res.status(201).json({
      id: result.insertId,
      app_id: finalAppId,
      theme_id: theme_id || finalAppId,
      text, type, choices, answer, explanation, difficulty,
      active: active ?? 1
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /questions/{id}:
 *   put:
 *     summary: Modifier une question
 */
router.put('/:id', async (req, res) => {
  try {
    const { app_id, theme_id, text, type, choices, answer, explanation, difficulty, active } = req.body;
    
    const finalAppId = app_id || theme_id || 1;
    
    const result = await query(
      `UPDATE questions 
       SET app_id=?, theme_id=?, text=?, type=?, choices=?, answer=?, explanation=?, difficulty=?, active=?
       WHERE id=?`,
      [
        finalAppId, theme_id || finalAppId, text, type,
        choices ? JSON.stringify(choices) : null,
        answer, explanation || null, difficulty || null, active ?? 1,
        req.params.id
      ]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: 'Question not found' });
    
    res.json({ id: req.params.id, app_id: finalAppId, text, type, answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /questions/{id}:
 *   delete:
 *     summary: Supprimer une question
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM questions WHERE id=?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Question not found' });
    res.json({ message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;