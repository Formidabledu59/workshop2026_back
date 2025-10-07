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
    user: 'root',
    password: '',       // change selon ta config
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
            description: 'API CRUD pour gérer les apps, questions et scores',
        },
        servers: [{ url: `http://localhost:${PORT}` }],
    },
    apis: ['./api.js'], // annotations Swagger dans ce fichier
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

///////////////////////////
// 🔹 CRUD APPS
///////////////////////////

/**
 * @swagger
 * /apps:
 *   get:
 *     summary: Récupérer toutes les applications
 *     responses:
 *       200:
 *         description: Liste des applications
 */
app.get('/apps', async (req, res) => {
    try {
        const apps = await query('SELECT * FROM apps');
        res.json(apps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /apps/{id}:
 *   get:
 *     summary: Récupérer une application par ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Application trouvée
 *       404:
 *         description: Application non trouvée
 */
app.get('/apps/:id', async (req, res) => {
    try {
        const rows = await query('SELECT * FROM apps WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'App not found' });

        let app = rows[0];

        // Si c'est un quiz, on ajoute les questions
        if (app.type === 'quiz') {
            const questions = await query('SELECT * FROM questions WHERE theme_id = ?', [app.theme_id]);
            app.questions = questions.map(q => ({
                id: q.id,
                text: q.text,
                type: q.type,
                choices: JSON.parse(q.choices),
                answer: q.answer,
                difficulty: q.difficulty
            }));
        }

        res.json(app);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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

app.get('/questions/:id', async (req, res) => {
    try {
        const rows = await query('SELECT * FROM questions WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Question not found' });
        res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

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

app.put('/questions/:id', async (req, res) => {
    try {
        const { theme_id, text, type, choices, answer, difficulty, active } = req.body;
        const result = await query(
            `UPDATE questions SET theme_id=?, text=?, type=?, choices=?, answer=?, difficulty=?, active=? WHERE id=?`,
            [theme_id, text, type, JSON.stringify(choices), answer, difficulty || null, active ?? 1, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Question not found' });
        res.json({ id: req.params.id, theme_id, text, type, choices, answer, difficulty, active });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

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

app.get('/scores', async (req, res) => {
    try {
        const rows = await query('SELECT * FROM scores');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/scores/:id', async (req, res) => {
    try {
        const rows = await query('SELECT * FROM scores WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Score not found' });
        res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

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
