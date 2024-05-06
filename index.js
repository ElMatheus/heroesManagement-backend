const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = 3000;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'heroes',
    password: 'ds564',
    port: 5432,
});

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Rota teste funfando');
});

app.get('/heroes', async (req, res) => {
    const result = await pool.query('SELECT * FROM heroes');
    res.json({
        total: result.rowCount,
        heroes: result.rows,
    });
});

app.get('/heroes/:id', async (req, res) => {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM heroes WHERE id = $1', [id]);
    if(result.rowCount === 0) {
        res.status(404).json({ message: 'Heroi não encontrado' });
    }
    res.json(result.rows[0]);
});

app.listen(PORT, () => {
    console.log(`O servidor esta rodando na porta ${PORT}`);
});