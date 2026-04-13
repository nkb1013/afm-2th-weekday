const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Database connection
// ---------------------------------------------------------------------------
const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || 'postgresql://postgres.omkuaglgzbbjiigxppml:EQRsyNNjz7UFlDQz@aws-1-us-east-1.pooler.supabase.com:6543/postgres').trim(),
  ssl: { rejectUnauthorized: false },
});

// ---------------------------------------------------------------------------
// Lazy DB initialisation (cold-start safe)
// ---------------------------------------------------------------------------
let dbInitialized = false;

async function initDB() {
  if (dbInitialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id         SERIAL PRIMARY KEY,
      category   VARCHAR(20) NOT NULL,
      content    TEXT NOT NULL,
      empathy    INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  dbInitialized = true;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Ensure DB is ready before any /api call
app.use('/api', async (_req, res, next) => {
  try {
    await initDB();
    next();
  } catch (err) {
    console.error('DB init error:', err);
    res.status(500).json({ success: false, message: 'Database initialisation failed' });
  }
});

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------

// GET /api/posts – 전체 게시글 조회 (최신순)
app.get('/api/posts', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM posts ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /api/posts error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
});

// POST /api/posts – 새 게시글 작성
app.post('/api/posts', async (req, res) => {
  try {
    const { category, content } = req.body;

    if (!category || !content) {
      return res.status(400).json({ success: false, message: 'category and content are required' });
    }

    const allowed = ['worry', 'praise', 'cheer'];
    if (!allowed.includes(category)) {
      return res.status(400).json({ success: false, message: `category must be one of: ${allowed.join(', ')}` });
    }

    const { rows } = await pool.query(
      'INSERT INTO posts (category, content) VALUES ($1, $2) RETURNING *',
      [category, content]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('POST /api/posts error:', err);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
});

// PUT /api/posts/:id – 게시글 수정
app.put('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, content } = req.body;

    if (!category || !content) {
      return res.status(400).json({ success: false, message: 'category and content are required' });
    }

    const allowed = ['worry', 'praise', 'cheer'];
    if (!allowed.includes(category)) {
      return res.status(400).json({ success: false, message: `category must be one of: ${allowed.join(', ')}` });
    }

    const { rows, rowCount } = await pool.query(
      'UPDATE posts SET category = $1, content = $2 WHERE id = $3 RETURNING *',
      [category, content, id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('PUT /api/posts/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to update post' });
  }
});

// DELETE /api/posts/:id – 게시글 삭제
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { rowCount } = await pool.query(
      'DELETE FROM posts WHERE id = $1',
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    console.error('DELETE /api/posts/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
});

// PATCH /api/posts/:id/empathy – 공감 수 +1
app.patch('/api/posts/:id/empathy', async (req, res) => {
  try {
    const { id } = req.params;

    const { rows, rowCount } = await pool.query(
      'UPDATE posts SET empathy = empathy + 1 WHERE id = $1 RETURNING *',
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('PATCH /api/posts/:id/empathy error:', err);
    res.status(500).json({ success: false, message: 'Failed to update empathy' });
  }
});

// ---------------------------------------------------------------------------
// SPA fallback – serve index.html for non-API routes
// ---------------------------------------------------------------------------
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ---------------------------------------------------------------------------
// Start server (local) / Export app (Vercel serverless)
// ---------------------------------------------------------------------------
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
