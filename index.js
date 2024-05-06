const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Rota teste funfando');
});

app.listen(PORT, () => {
    console.log(`O servidor esta rodando na porta ${PORT}`);
});