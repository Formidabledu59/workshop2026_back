const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

///////////////////////////
// 🔹 Configuration MySQL
///////////////////////////
const dbConfig = {
    host: 'localhost',
    user: 'root',       // remplace par ton utilisateur MySQL local
    password: '',       // remplace par ton mot de passe local
    database: 'workshop2526_bdd'
};

// Fonction utilitaire pour exécuter des requêtes
async function query(sql, params = []) {
    const connection = await mysql.createConnection(dbConfig);
    const [results] = await connection.execute(sql, params);
    await connection.end();
    return results;
}

///////////////////////////
// 🔹 Swagger Configuration
///////////////////////////
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Workshop API',
            version: '1.0.0',
            description: 'API CRUD pour gérer les questions et les scores',
        },
        servers: [{ url: `http://localhost:${PORT}` }],
    },
    apis: ['./api.js'], // les annotations Swagger sont dans ce fichier
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

///////////////////////////
// 🔹 CRUD QUESTIONS
///////////////////////////

/**
 * @swagger
 * /questions:
 *   get:
 *     summary: Récupérer toutes les questions
 *     responses:
 *       200:
 *         description: Liste des questions
 */
app.get('/questions', async (req, res) => {
    try {
        const rows = await query('SELECT * FROM questions');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /questions/{id}:
 *   get:
 *     summary: Récupérer une question par ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Question trouvée
 *       404:
 *         description: Question non trouvée
 */
app.get('/questions/:id', async (req, res) => {
    try {
        const rows = await query('SELECT * FROM questions WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Question not found' });
        res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /questions:
 *   post:
 *     summary: Ajouter une nouvelle question
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme_id:
 *                 type: integer
 *               text:
 *                 type: string
 *               type:
 *                 type: string
 *               choices:
 *                 type: array
 *                 items:
 *                   type: string
 *               answer:
 *                 type: string
 *               difficulty:
 *                 type: integer
 *               active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Question ajoutée
 */
app.post('/questions', async (req, res) => {
    try {
        const { theme_id, text, type, choices, answer, difficulty, active } = req.body;
        const result = await query(
            `INSERT INTO questions (theme_id, text, type, choices, answer, difficulty, active)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [theme_id, text, type, JSON.stringify(choices), answer, difficulty || null, active ?? 1]
        );
        res.status(201).json({ id: result.insertId, theme_id, text, type, choices, answer, difficulty, active });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /questions/{id}:
 *   put:
 *     summary: Modifier une question existante
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Question mise à jour
 */
app.put('/questions/:id', async (req, res) => {
    try {
        const { theme_id, text, type, choices, answer, difficulty, active } = req.body;
        const result = await query(
            `UPDATE questions
             SET theme_id=?, text=?, type=?, choices=?, answer=?, difficulty=?, active=?
             WHERE id=?`,
            [theme_id, text, type, JSON.stringify(choices), answer, difficulty || null, active ?? 1, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Question not found' });
        res.json({ id: req.params.id, theme_id, text, type, choices, answer, difficulty, active });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /questions/{id}:
 *   delete:
 *     summary: Supprimer une question
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Question supprimée
 */
app.delete('/questions/:id', async (req, res) => {
    try {
        const result = await query('DELETE FROM questions WHERE id=?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Question not found' });
        res.json({ message: 'Question deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

///////////////////////////
// 🔹 CRUD SCORES
///////////////////////////

/**
 * @swagger
 * /scores:
 *   get:
 *     summary: Récupérer tous les scores
 *     responses:
 *       200:
 *         description: Liste des scores
 */
app.get('/scores', async (req, res) => {
    try {
        const rows = await query('SELECT * FROM scores');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /scores/{id}:
 *   get:
 *     summary: Récupérer un score par ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Score trouvé
 */
app.get('/scores/:id', async (req, res) => {
    try {
        const rows = await query('SELECT * FROM scores WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Score not found' });
        res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /scores:
 *   post:
 *     summary: Ajouter un nouveau score
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_email:
 *                 type: string
 *               theme_id:
 *                 type: integer
 *               score:
 *                 type: integer
 *               total:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Score ajouté
 */
app.post('/scores', async (req, res) => {
    try {
        const { user_email, theme_id, score, total } = req.body;
        const result = await query(
            `INSERT INTO scores (user_email, theme_id, score, total) VALUES (?, ?, ?, ?)`,
            [user_email, theme_id, score, total]
        );
        res.status(201).json({ id: result.insertId, user_email, theme_id, score, total });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /scores/{id}:
 *   put:
 *     summary: Modifier un score
 */
app.put('/scores/:id', async (req, res) => {
    try {
        const { user_email, theme_id, score, total } = req.body;
        const result = await query(
            `UPDATE scores SET user_email=?, theme_id=?, score=?, total=? WHERE id=?`,
            [user_email, theme_id, score, total, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Score not found' });
        res.json({ id: req.params.id, user_email, theme_id, score, total });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * @swagger
 * /scores/{id}:
 *   delete:
 *     summary: Supprimer un score
 */
app.delete('/scores/:id', async (req, res) => {
    try {
        const result = await query('DELETE FROM scores WHERE id=?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Score not found' });
        res.json({ message: 'Score deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

///////////////////////////
// 🔹 Lancer le serveur
///////////////////////////
app.listen(PORT, () => {
    console.log(`✅ Serveur lancé sur : http://localhost:${PORT}`);
    console.log(`📘 Swagger dispo sur : http://localhost:${PORT}/api-docs`);
});
