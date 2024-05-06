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
    try {
        const result = await pool.query('SELECT * FROM heroes');
        res.json({
            total: result.rowCount,
            heroes: result.rows,
        });
    } catch (error) {
        console.error('Erro ao buscar herois', error);
        res.status(500).send('Erro ao buscar herois');
    }
});

app.get('/heroes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM heroes WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            res.status(404).json({ message: 'Heroi não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar heroi', error);
        res.status(500).send('Erro ao buscar heroi');
    }
});

app.post('/heroes', async (req, res) => {
    try {
        const { name, power, hp, attack } = req.body;
        const result = await pool.query('INSERT INTO heroes (name, level, power, hp, attack) VALUES ($1, $2, $3, $4, $5) RETURNING *', [name, 1, power, hp, attack]);
        res.json({
            message: "Heroi cadastrado com sucesso",
            users: result.rows[0],
        });
    } catch (error) {
        console.error('Erro ao criar herois', error);
        res.status(500).send('Erro ao criar herois');
    }
});

app.put('/heroes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, power, hp, attack } = req.body;
        const result = await pool.query('UPDATE heroes SET name = $1, power = $2, hp = $3, attack = $4 WHERE id = $5 RETURNING *', [name, power, hp, attack, id]);
        if (result.rowCount === 0) {
            res.status(404).json({ message: 'Heroi não encontrado' });
        }
        res.json({
            message: "Heroi atualizado com sucesso",
            users: result.rows[0],
        });
    } catch (error) {
        console.error('Erro ao atualizar heroi', error);
        res.status(500).send('Erro ao atualizar heroi');
    }
});

app.delete('/heroes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM heroes WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            res.status(404).json({ message: 'Heroi não encontrado' });
        }
        res.json({ message: 'Heroi deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar heroi', error);
        res.status(500).send('Erro ao deletar heroi');
    }
});

// battles routes

const battle = (hero1, hero2) => {
    const hero1Attack = hero1.attack;
    const hero2Attack = hero2.attack;
    const hero1Hp = hero1.hp;
    const hero2Hp = hero2.hp;
    let hero1CountAtacks = 0;
    let hero2CountAtacks = 0;
    let hero1Turn = true;
    let hero1CurrentHp = hero1Hp;
    let hero2CurrentHp = hero2Hp;
    while (hero1CurrentHp > 0 && hero2CurrentHp > 0) {
        if (hero1Turn) {
            hero2CurrentHp -= hero1Attack;
            hero1CountAtacks++;
            console.log(hero1.name + ' atacou e tirou ' + hero1Attack + ' de vida do ' + hero2.name + ' deixando com ' + hero2CurrentHp + ' de vida restante');
        } else {
            hero1CurrentHp -= hero2Attack;
            hero2CountAtacks++;
            console.log(hero2.name + ' atacou e tirou ' + hero2Attack + ' de vida do ' + hero1.name + ' deixando com ' + hero1CurrentHp + ' de vida restante');
        }
        hero1Turn = !hero1Turn;
    }
    if (hero1CurrentHp > 0) {
        pool.query('UPDATE heroes SET level = $1 WHERE id = $2 RETURNING *', [hero1.level + 1, hero1.id]);
        return { hero: hero1, countAtacks: hero1CountAtacks };
    } else {
        pool.query('UPDATE heroes SET level = $1 WHERE id = $2 RETURNING *', [hero2.level + 1, hero2.id]);
        return { hero: hero2, countAtacks: hero2CountAtacks };
    }
};

app.get('/battles/:heroi1/:heroi2', async (req, res) => {
    try {
        const { heroi1, heroi2 } = req.params;
        const hero1 = await pool.query('SELECT * FROM heroes WHERE id = $1', [heroi1]);
        const hero2 = await pool.query('SELECT * FROM heroes WHERE id = $1', [heroi2]);
        if (hero1.rowCount === 0 || hero2.rowCount === 0) {
            res.status(404).json({ message: 'Heroi não encontrado' });
        } else {
            const winner = battle(hero1.rows[0], hero2.rows[0]);
            res.json({
                winner: winner.hero,
                golpes: winner.countAtacks,
                message: 'Batalha finalizada',
            });
        }




    } catch (error) {
        console.error('Erro ao buscar batalha', error);
        res.status(500).send('Erro ao buscar batalha');
    }
});

app.listen(PORT, () => {
    console.log(`O servidor esta rodando na porta ${PORT}`);
});