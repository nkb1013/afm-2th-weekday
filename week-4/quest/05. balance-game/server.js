const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Database Connection ---
const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || 'postgresql://postgres.omkuaglgzbbjiigxppml:EQRsyNNjz7UFlDQz@aws-1-us-east-1.pooler.supabase.com:6543/postgres').trim(),
  ssl: { rejectUnauthorized: false },
});

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// --- Lazy DB Initialization ---
let dbInitialized = false;

async function initDB() {
  if (dbInitialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      option_a VARCHAR(60) NOT NULL,
      option_b VARCHAR(60) NOT NULL,
      votes_a INTEGER DEFAULT 0,
      votes_b INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  dbInitialized = true;
}

app.use('/api', async (_req, res, next) => {
  try {
    await initDB();
    next();
  } catch (err) {
    console.error('DB init error:', err);
    res.status(500).json({ success: false, message: 'Database initialization failed' });
  }
});

// --- Helper: add computed fields to a question row ---
function withComputed(row) {
  const total_votes = row.votes_a + row.votes_b;
  const percent_a = total_votes > 0 ? parseFloat(((row.votes_a / total_votes) * 100).toFixed(1)) : 50;
  const percent_b = total_votes > 0 ? parseFloat(((row.votes_b / total_votes) * 100).toFixed(1)) : 50;
  return { ...row, total_votes, percent_a, percent_b };
}

// --- GET /api/questions ---
app.get('/api/questions', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM questions ORDER BY created_at DESC');
    res.json({ success: true, data: rows.map(withComputed) });
  } catch (err) {
    console.error('GET /api/questions error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch questions' });
  }
});

// --- POST /api/questions ---
app.post('/api/questions', async (req, res) => {
  try {
    const { title, option_a, option_b } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'title is required' });
    }
    if (!option_a || !option_a.trim()) {
      return res.status(400).json({ success: false, message: 'option_a is required' });
    }
    if (!option_b || !option_b.trim()) {
      return res.status(400).json({ success: false, message: 'option_b is required' });
    }

    const { rows } = await pool.query(
      'INSERT INTO questions (title, option_a, option_b) VALUES ($1, $2, $3) RETURNING *',
      [title.trim(), option_a.trim(), option_b.trim()]
    );
    res.status(201).json({ success: true, data: withComputed(rows[0]) });
  } catch (err) {
    console.error('POST /api/questions error:', err);
    res.status(500).json({ success: false, message: 'Failed to create question' });
  }
});

// --- PUT /api/questions/:id ---
app.put('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, option_a, option_b } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'title is required' });
    }
    if (!option_a || !option_a.trim()) {
      return res.status(400).json({ success: false, message: 'option_a is required' });
    }
    if (!option_b || !option_b.trim()) {
      return res.status(400).json({ success: false, message: 'option_b is required' });
    }

    const { rows, rowCount } = await pool.query(
      'UPDATE questions SET title = $1, option_a = $2, option_b = $3 WHERE id = $4 RETURNING *',
      [title.trim(), option_a.trim(), option_b.trim(), id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    res.json({ success: true, data: withComputed(rows[0]) });
  } catch (err) {
    console.error('PUT /api/questions/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to update question' });
  }
});

// --- DELETE /api/questions/:id ---
app.delete('/api/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM questions WHERE id = $1', [id]);

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    res.json({ success: true, message: 'Question deleted' });
  } catch (err) {
    console.error('DELETE /api/questions/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete question' });
  }
});

// --- PATCH /api/questions/:id/vote ---
app.patch('/api/questions/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { option } = req.body;

    if (!option || (option !== 'A' && option !== 'B')) {
      return res.status(400).json({ success: false, message: 'option must be "A" or "B"' });
    }

    const column = option === 'A' ? 'votes_a' : 'votes_b';
    const { rows, rowCount } = await pool.query(
      `UPDATE questions SET ${column} = ${column} + 1 WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    res.json({ success: true, data: withComputed(rows[0]) });
  } catch (err) {
    console.error('PATCH /api/questions/:id/vote error:', err);
    res.status(500).json({ success: false, message: 'Failed to register vote' });
  }
});

// --- SPA Fallback (Express 5 syntax) ---
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Start / Export ---
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
