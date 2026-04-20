const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = (process.env.JWT_SECRET || 'community-app-secret-key-2024').trim();

// DB 연결
const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || '').trim(),
  ssl: { rejectUnauthorized: false },
});

// 미들웨어
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// DB 초기화 (Lazy Init)
let dbInitialized = false;
async function initDB() {
  if (dbInitialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS community_app_01_users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      nickname VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS community_app_01_posts (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER REFERENCES community_app_01_users(id),
      author VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS community_app_01_comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES community_app_01_posts(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      author_id INTEGER REFERENCES community_app_01_users(id),
      author VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
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

// ======== JWT 인증 미들웨어 ========

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, nickname }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: '토큰이 만료되었거나 유효하지 않습니다.' });
  }
}

// ======== 인증 API ========

// 회원가입
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, nickname } = req.body;
    if (!email || !password || !nickname) {
      return res.status(400).json({ success: false, message: '이메일, 비밀번호, 닉네임을 모두 입력해주세요.' });
    }
    if (password.length < 4) {
      return res.status(400).json({ success: false, message: '비밀번호는 4자 이상이어야 합니다.' });
    }
    // 이메일 중복 체크
    const existing = await pool.query(
      'SELECT id FROM community_app_01_users WHERE email = $1', [email.trim().toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: '이미 사용 중인 이메일입니다.' });
    }
    // 비밀번호 해싱 & 저장
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO community_app_01_users (email, password, nickname) VALUES ($1, $2, $3) RETURNING id, email, nickname, created_at',
      [email.trim().toLowerCase(), hashed, nickname.trim()]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, nickname: user.nickname }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, data: { token, user: { id: user.id, email: user.email, nickname: user.nickname } } });
  } catch (err) {
    console.error('POST /api/auth/register error:', err);
    res.status(500).json({ success: false, message: '회원가입에 실패했습니다.' });
  }
});

// 로그인
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: '이메일과 비밀번호를 입력해주세요.' });
    }
    const result = await pool.query(
      'SELECT * FROM community_app_01_users WHERE email = $1', [email.trim().toLowerCase()]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, nickname: user.nickname }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, data: { token, user: { id: user.id, email: user.email, nickname: user.nickname } } });
  } catch (err) {
    console.error('POST /api/auth/login error:', err);
    res.status(500).json({ success: false, message: '로그인에 실패했습니다.' });
  }
});

// 토큰 검증 (자동 로그인용)
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

// ======== 게시글 API (인증 필요) ========

// 게시글 전체 조회 (인증 불필요 → 인증 필요로 변경)
app.get('/api/posts', authMiddleware, async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM community_app_01_posts ORDER BY created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /api/posts error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
});

// 게시글 작성
app.post('/api/posts', authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: '제목과 내용을 입력해주세요.' });
    }
    const result = await pool.query(
      'INSERT INTO community_app_01_posts (title, content, author_id, author) VALUES ($1, $2, $3, $4) RETURNING *',
      [title.trim(), content.trim(), req.user.id, req.user.nickname]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('POST /api/posts error:', err);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
});

// 게시글 수정 (본인만)
app.put('/api/posts/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: '제목과 내용을 입력해주세요.' });
    }
    const existing = await pool.query(
      'SELECT * FROM community_app_01_posts WHERE id = $1', [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    if (existing.rows[0].author_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '본인의 글만 수정할 수 있습니다.' });
    }
    const result = await pool.query(
      'UPDATE community_app_01_posts SET title = $1, content = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [title.trim(), content.trim(), id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('PUT /api/posts/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to update post' });
  }
});

// 게시글 삭제 (본인만)
app.delete('/api/posts/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query(
      'SELECT * FROM community_app_01_posts WHERE id = $1', [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    if (existing.rows[0].author_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '본인의 글만 삭제할 수 있습니다.' });
    }
    await pool.query('DELETE FROM community_app_01_posts WHERE id = $1', [id]);
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    console.error('DELETE /api/posts/:id error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
});

// ======== 댓글 API (인증 필요) ========

// 특정 게시글의 댓글 조회
app.get('/api/posts/:postId/comments', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const result = await pool.query(
      'SELECT * FROM community_app_01_comments WHERE post_id = $1 ORDER BY created_at ASC',
      [postId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET comments error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
});

// 댓글 작성
app.post('/api/posts/:postId/comments', authMiddleware, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: '댓글 내용을 입력해주세요.' });
    }
    const result = await pool.query(
      'INSERT INTO community_app_01_comments (post_id, content, author_id, author) VALUES ($1, $2, $3, $4) RETURNING *',
      [postId, content.trim(), req.user.id, req.user.nickname]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('POST comment error:', err);
    res.status(500).json({ success: false, message: 'Failed to create comment' });
  }
});

// 댓글 삭제 (본인만)
app.delete('/api/comments/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query(
      'SELECT * FROM community_app_01_comments WHERE id = $1', [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    if (existing.rows[0].author_id !== req.user.id) {
      return res.status(403).json({ success: false, message: '본인의 댓글만 삭제할 수 있습니다.' });
    }
    await pool.query('DELETE FROM community_app_01_comments WHERE id = $1', [id]);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    console.error('DELETE comment error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
});

// SPA fallback
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Local / Vercel dual-mode
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
module.exports = app;
