const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'todo-app-01-secret-key';

// --- Database Connection ---
const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || 'postgresql://postgres.omkuaglgzbbjiigxppml:EQRsyNNjz7UFlDQz@aws-1-us-east-1.pooler.supabase.com:6543/postgres').trim(),
  ssl: { rejectUnauthorized: false },
});

// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// --- Auth Middleware ---
function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// --- Admin Middleware ---
function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

// ========================================
// Auth Routes
// ========================================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const result = await pool.query(
      'SELECT id, email, password_hash, nickname, role FROM todo_app_01_users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access only' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, nickname: user.nickname, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: { token, user: { id: user.id, email: user.email, nickname: user.nickname, role: user.role } },
      message: 'Login successful',
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, nickname, role FROM todo_app_01_users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========================================
// Admin Routes (all require auth + admin)
// ========================================

// GET /api/admin/stats
app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [usersRes, todosRes, completedRes, todayRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM todo_app_01_users'),
      pool.query('SELECT COUNT(*) FROM todo_app_01'),
      pool.query('SELECT COUNT(*) FROM todo_app_01 WHERE done = true'),
      pool.query("SELECT COUNT(*) FROM todo_app_01_users WHERE created_at::date = CURRENT_DATE"),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers: parseInt(usersRes.rows[0].count),
        totalTodos: parseInt(todosRes.rows[0].count),
        completedTodos: parseInt(completedRes.rows[0].count),
        todaySignups: parseInt(todayRes.rows[0].count),
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/admin/users
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.nickname, u.role, u.created_at,
             COUNT(t.id)::int AS todo_count
      FROM todo_app_01_users u
      LEFT JOIN todo_app_01 t ON t.user_id = u.id
      GROUP BY u.id, u.email, u.nickname, u.role, u.created_at
      ORDER BY u.created_at DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Users list error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/admin/users/:id
app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }

    const userCheck = await pool.query('SELECT id FROM todo_app_01_users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete user's todos first, then the user
    await pool.query('DELETE FROM todo_app_01 WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM todo_app_01_users WHERE id = $1', [userId]);

    res.json({ success: true, message: 'User and their todos deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/admin/todos
app.get('/api/admin/todos', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.id, t.user_id, t.text, t.done, t.created_at,
             u.email, u.nickname
      FROM todo_app_01 t
      LEFT JOIN todo_app_01_users u ON u.id = t.user_id
      ORDER BY t.created_at DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Todos list error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/admin/todos/:id
app.delete('/api/admin/todos/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const todoId = parseInt(req.params.id);

    const result = await pool.query('DELETE FROM todo_app_01 WHERE id = $1 RETURNING id', [todoId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    res.json({ success: true, message: 'Todo deleted' });
  } catch (err) {
    console.error('Delete todo error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --- SPA Fallback ---
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Start Server / Export for Vercel ---
if (require.main === module) {
  app.listen(PORT, () => console.log(`Admin server running on http://localhost:${PORT}`));
}
module.exports = app;
