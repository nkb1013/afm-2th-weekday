const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── Database Setup (lazy init for serverless) ──────────
const DB_PATH = path.join(__dirname, 'todos.db');
let db;
let dbInitialized = false;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDB() {
  if (dbInitialized) return;
  const conn = getDB();

  // 1) Create users table
  conn.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL
    );
  `);

  // 2) Add user_id column to todos (ignore error if already exists)
  try {
    conn.exec(`ALTER TABLE todos ADD COLUMN user_id INTEGER REFERENCES users(id);`);
  } catch (_) {
    // Column already exists — safe to ignore
  }

  // 3) Seed default users if table is empty
  const userCount = conn.prepare('SELECT COUNT(*) AS cnt FROM users').get();
  if (userCount.cnt === 0) {
    const insertUser = conn.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
    insertUser.run('김민수', 'minsu@example.com');
    insertUser.run('이지은', 'jieun@example.com');
  }

  // 4) Assign existing todos to user 1 if they have no user_id
  conn.prepare('UPDATE todos SET user_id = 1 WHERE user_id IS NULL').run();

  dbInitialized = true;
}

// Run DB init before any /api route
app.use('/api', (_req, _res, next) => {
  try {
    initDB();
    next();
  } catch (err) {
    _res.status(500).json({ success: false, message: 'Database initialization failed' });
  }
});

// ── Helper: fetch a single todo with user_name ─────────
function getTodoById(id) {
  const conn = getDB();
  const row = conn.prepare(`
    SELECT t.id, t.todo, t.done, t.user_id, u.name AS user_name
    FROM todos t
    LEFT JOIN users u ON t.user_id = u.id
    WHERE t.id = ?
  `).get(id);
  if (!row) return null;
  return { ...row, done: !!row.done };
}

// ── API Routes ─────────────────────────────────────────

// GET /api/users — 전체 사용자 목록
app.get('/api/users', (_req, res) => {
  try {
    const conn = getDB();
    const users = conn.prepare('SELECT id, name, email FROM users').all();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/todos — 할 일 목록 (user_id 필터 가능)
app.get('/api/todos', (req, res) => {
  try {
    const conn = getDB();
    let sql = `
      SELECT t.id, t.todo, t.done, t.user_id, u.name AS user_name
      FROM todos t
      LEFT JOIN users u ON t.user_id = u.id
    `;
    const params = [];

    if (req.query.user_id) {
      sql += ' WHERE t.user_id = ?';
      params.push(Number(req.query.user_id));
    }

    sql += ' ORDER BY t.id';

    const rows = conn.prepare(sql).all(...params);
    const data = rows.map(r => ({ ...r, done: !!r.done }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/todos — 새 할 일 추가
app.post('/api/todos', (req, res) => {
  try {
    const { todo, user_id } = req.body;
    if (!todo || !todo.trim()) {
      return res.status(400).json({ success: false, message: 'todo is required' });
    }

    const conn = getDB();
    const result = conn.prepare('INSERT INTO todos (todo, done, user_id) VALUES (?, 0, ?)').run(todo.trim(), user_id || null);
    const created = getTodoById(result.lastInsertRowid);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/todos/:id — 할 일 수정
app.put('/api/todos/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const conn = getDB();

    const existing = conn.prepare('SELECT * FROM todos WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    const fields = [];
    const values = [];

    if (req.body.todo !== undefined) {
      fields.push('todo = ?');
      values.push(req.body.todo);
    }
    if (req.body.done !== undefined) {
      fields.push('done = ?');
      values.push(req.body.done ? 1 : 0);
    }
    if (req.body.user_id !== undefined) {
      fields.push('user_id = ?');
      values.push(req.body.user_id);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    conn.prepare(`UPDATE todos SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const updated = getTodoById(id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/todos/:id — 할 일 삭제
app.delete('/api/todos/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const conn = getDB();

    const result = conn.prepare('DELETE FROM todos WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── SPA Fallback (Express 5 syntax) ───────────────────
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start Server / Export for Vercel ───────────────────
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
module.exports = app;
