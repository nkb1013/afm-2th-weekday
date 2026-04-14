const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'todo-app-01-secret-key';

// ── PostgreSQL ──────────────────────────────────────────
const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || 'postgresql://postgres.omkuaglgzbbjiigxppml:EQRsyNNjz7UFlDQz@aws-1-us-east-1.pooler.supabase.com:5432/postgres').trim(),
  ssl: { rejectUnauthorized: false },
});

// ── Lazy DB Init ────────────────────────────────────────
let dbInitialized = false;

async function initDB() {
  if (dbInitialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todo_app_01_users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      nickname VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todo_app_01 (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES todo_app_01_users(id),
      text VARCHAR(500) NOT NULL,
      done BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  dbInitialized = true;
}

// ── Middleware ───────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// DB init middleware for /api routes
app.use('/api', async (_req, _res, next) => {
  try {
    await initDB();
    next();
  } catch (err) {
    console.error('DB init error:', err);
    _res.status(500).json({ success: false, message: 'Database initialization failed' });
  }
});

// ── Auth Middleware ──────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '로그인이 필요합니다' });
  }
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: '토큰이 만료되었습니다' });
  }
}

// ── Auth Routes ─────────────────────────────────────────

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, nickname } = req.body;
    if (!email || !password || !nickname) {
      return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요' });
    }
    const existing = await pool.query('SELECT id FROM todo_app_01_users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: '이미 가입된 이메일입니다' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO todo_app_01_users (email, password_hash, nickname) VALUES ($1, $2, $3) RETURNING id, email, nickname',
      [email, hash, nickname]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, nickname: user.nickname }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, data: { token, user } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: '회원가입에 실패했습니다' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: '이메일과 비밀번호를 입력해주세요' });
    }
    const result = await pool.query('SELECT * FROM todo_app_01_users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 잘못되었습니다' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 잘못되었습니다' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, nickname: user.nickname }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, data: { token, user: { id: user.id, email: user.email, nickname: user.nickname } } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: '로그인에 실패했습니다' });
  }
});

// GET /api/auth/me - 토큰으로 유저 정보 확인
app.get('/api/auth/me', auth, (req, res) => {
  res.json({ success: true, data: req.user });
});

// ── Todo Routes (인증 필요) ─────────────────────────────

// GET /api/todos
app.get('/api/todos', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM todo_app_01 WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /api/todos error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch todos' });
  }
});

// POST /api/todos
app.post('/api/todos', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'text is required' });
    }
    const result = await pool.query(
      'INSERT INTO todo_app_01 (user_id, text) VALUES ($1, $2) RETURNING *',
      [req.user.id, text.trim()]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('POST /api/todos error:', err);
    res.status(500).json({ success: false, message: 'Failed to create todo' });
  }
});

// PATCH /api/todos/:id
app.patch('/api/todos/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { done, text } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (done !== undefined) { fields.push(`done = $${idx++}`); values.push(done); }
    if (text !== undefined) { fields.push(`text = $${idx++}`); values.push(text.trim()); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id, req.user.id);
    const result = await pool.query(
      `UPDATE todo_app_01 SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('PATCH error:', err);
    res.status(500).json({ success: false, message: 'Failed to update todo' });
  }
});

// DELETE /api/todos/:id
app.delete('/api/todos/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM todo_app_01 WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('DELETE error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete todo' });
  }
});

// ── Local / Vercel dual-mode ────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
