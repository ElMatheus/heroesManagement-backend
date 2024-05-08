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

app.get('/heroes/name/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const result = await pool.query('SELECT * FROM heroes WHERE name = $1', [name]);
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
        return { heroW: hero1, heroD: hero2, countAtacks: hero1CountAtacks };
    } else {
        pool.query('UPDATE heroes SET level = $1 WHERE id = $2 RETURNING *', [hero2.level + 1, hero2.id]);
        return { heroW: hero2, heroD: hero2, countAtacks: hero2CountAtacks };
    }
};

const generateMessageBattle = (winner, countAtacks, loser) => {
    return `${winner.name} venceu a batalha com ${countAtacks} golpes, ${loser.name} foi derrotado`;
};

app.get('/battles', async (req, res) => {
    try {
        const battles = await pool.query('SELECT battles.id AS id_batalha, hero1.name AS nome_heroi1, hero1.level AS level_heroi1, hero1.power AS poder_heroi1, hero1.hp AS hp_heroi1, hero1.attack AS attack_heroi1, hero2.name AS nome_heroi2, hero2.level AS level_heroi2, hero2.power AS poder_heroi2, hero2.hp AS hp_heroi2, hero2.attack AS attack_heroi2,winner.name AS heroi_vencedor, battles.message AS mensagem FROM battles INNER JOIN heroes AS hero1 ON hero1.id = battles.hero1_id INNER JOIN heroes AS hero2 ON hero2.id = battles.hero2_id INNER JOIN heroes AS winner ON winner.id = battles.winner_id;');
        res.json({
            total: battles.rowCount,
            battles: battles.rows,
        });
    } catch (error) {
        console.error('Erro ao buscar batalhas', error);
        res.status(500).send('Erro ao buscar batalhas');
    }
});

app.get('/battles/name/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const battles = await pool.query('SELECT battles.id AS id_batalha, hero1.name AS nome_heroi1, hero1.level AS level_heroi1, hero1.power AS poder_heroi1, hero1.hp AS hp_heroi1, hero1.attack AS attack_heroi1, hero2.name AS nome_heroi2, hero2.level AS level_heroi2, hero2.power AS poder_heroi2, hero2.hp AS hp_heroi2, hero2.attack AS attack_heroi2,winner.name AS heroi_vencedor, battles.message AS mensagem FROM battles INNER JOIN heroes AS hero1 ON hero1.id = battles.hero1_id INNER JOIN heroes AS hero2 ON hero2.id = battles.hero2_id INNER JOIN heroes AS winner ON winner.id = battles.winner_id WHERE hero1.name = $1 OR hero2.name = $1;', [name]);
        if (battles.rowCount === 0) {
            res.status(404).json({ message: 'Heroi ainda não batalhou!' });
        }
        res.json({
            total: battles.rowCount,
            battles: battles.rows,
        });
    } catch (error) {
        console.error('Erro ao buscar batalhas', error);
        res.status(500).send('Erro ao buscar batalhas');
    }
});

app.get('/battles/:heroi1/:heroi2', async (req, res) => {
    try {
        const { heroi1, heroi2 } = req.params;
        const hero1 = await pool.query('SELECT * FROM heroes WHERE id = $1', [heroi1]);
        const hero2 = await pool.query('SELECT * FROM heroes WHERE id = $1', [heroi2]);
        if (hero1.rowCount === 0 || hero2.rowCount === 0) { 
            res.status(404).json({ message: 'Heroi não encontrado' });
        } else {
            console.log(hero1.rows[0], hero2.rows[0]);
            const winner = battle(hero1.rows[0], hero2.rows[0]);
            pool.query('INSERT INTO battles (hero1_id, hero2_id, winner_id, message) VALUES ($1, $2, $3, $4)', [hero1.rows[0].id, hero2.rows[0].id, winner.heroW.id, generateMessageBattle(winner.heroW, winner.countAtacks, winner.heroD)]);
            res.json({
                winner: winner.heroW,
                golpes: winner.countAtacks,
                message: 'Batalha finalizada',
            });
        }
    } catch (error) {
        console.error('Erro ao batalhar', error);
        res.status(500).send('Erro ao batalhar');
    }
});

app.listen(PORT, () => {
    console.log(`O servidor esta rodando na porta ${PORT}`);
});