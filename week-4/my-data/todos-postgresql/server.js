require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// Database Connection
// ========================================
const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || '').trim(),
  ssl: { rejectUnauthorized: false },
});

// ========================================
// Middleware
// ========================================
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ========================================
// DB Initialization (Lazy Init Pattern)
// ========================================
let dbInitialized = false;

async function initDB() {
  if (dbInitialized) return;

  // Create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      done BOOLEAN DEFAULT false,
      user_id INTEGER REFERENCES users(id)
    )
  `);

  // Seed default users if table is empty
  const userCount = await pool.query('SELECT COUNT(*) FROM users');
  if (parseInt(userCount.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO users (name, email) VALUES
        ('김민수', 'minsu@example.com'),
        ('이지은', 'jieun@example.com')
    `);
  }

  // Seed default todos if table is empty
  const todoCount = await pool.query('SELECT COUNT(*) FROM todos');
  if (parseInt(todoCount.rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO todos (text, done, user_id) VALUES
        ('장보기 목록 정리하기', false, 1),
        ('운동 30분 하기', false, 1),
        ('이메일 확인하고 답장하기', false, 2),
        ('배추 구매', false, 1),
        ('buy milk', false, 2)
    `);
  }

  dbInitialized = true;
}

// Ensure DB is initialized before API calls
app.use('/api', async (_req, res, next) => {
  try {
    await initDB();
    next();
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    res.status(500).json({ success: false, message: 'Database initialization failed' });
  }
});

// ========================================
// API Routes - Users
// ========================================

// GET /api/users - Returns all users
app.get('/api/users', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email FROM users ORDER BY id');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// ========================================
// API Routes - Todos
// ========================================

// GET /api/todos - Returns todos, optionally filtered by user_id
app.get('/api/todos', async (req, res) => {
  try {
    const { user_id } = req.query;
    let query = `
      SELECT t.id, t.text, t.done, t.user_id, u.name AS user_name
      FROM todos t
      LEFT JOIN users u ON t.user_id = u.id
    `;
    const params = [];

    if (user_id) {
      query += ' WHERE t.user_id = $1';
      params.push(user_id);
    }

    query += ' ORDER BY t.id';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching todos:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch todos' });
  }
});

// POST /api/todos - Create a new todo
app.post('/api/todos', async (req, res) => {
  try {
    const { text, user_id } = req.body;

    if (!text || !user_id) {
      return res.status(400).json({ success: false, message: 'text and user_id are required' });
    }

    const result = await pool.query(
      `INSERT INTO todos (text, done, user_id) VALUES ($1, false, $2) RETURNING id, text, done, user_id`,
      [text, user_id]
    );

    const todo = result.rows[0];

    // Fetch user_name via join
    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [todo.user_id]);
    todo.user_name = userResult.rows[0]?.name || null;

    res.status(201).json({ success: true, data: todo });
  } catch (err) {
    console.error('Error creating todo:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create todo' });
  }
});

// PUT /api/todos/:id - Update a todo
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, done } = req.body;

    // Build dynamic SET clause
    const setClauses = [];
    const params = [];
    let paramIndex = 1;

    if (text !== undefined) {
      setClauses.push(`text = $${paramIndex++}`);
      params.push(text);
    }
    if (done !== undefined) {
      setClauses.push(`done = $${paramIndex++}`);
      params.push(done);
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(id);
    const query = `
      UPDATE todos SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, text, done, user_id
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    const todo = result.rows[0];

    // Fetch user_name
    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [todo.user_id]);
    todo.user_name = userResult.rows[0]?.name || null;

    res.json({ success: true, data: todo });
  } catch (err) {
    console.error('Error updating todo:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update todo' });
  }
});

// DELETE /api/todos/:id - Delete a todo
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting todo:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete todo' });
  }
});

// ========================================
// SPA Fallback
// ========================================
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ========================================
// Start Server / Export for Vercel
// ========================================
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
