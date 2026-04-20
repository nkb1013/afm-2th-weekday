const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = (process.env.JWT_SECRET || 'shopping-mall-secret-key-2024').trim();

const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || '').trim(),
  ssl: { rejectUnauthorized: false },
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ======== DB 초기화 (Lazy Init) ========
let dbInitialized = false;
async function initDB() {
  if (dbInitialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS shopping_mall_app_01_users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      nickname VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS shopping_mall_app_01_products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(300) NOT NULL,
      price INTEGER NOT NULL,
      description TEXT,
      category VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS shopping_mall_app_01_cart_items (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES shopping_mall_app_01_users(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES shopping_mall_app_01_products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, product_id)
    )
  `);

  // 상품 시드 데이터 (비어있을 때만)
  // image_url 컬럼 추가 (이미 있으면 무시)
  await pool.query('ALTER TABLE shopping_mall_app_01_products ADD COLUMN IF NOT EXISTS image_url TEXT');

  const { rows } = await pool.query('SELECT COUNT(*) FROM shopping_mall_app_01_products');
  if (parseInt(rows[0].count) === 0) {
    const products = [
      ['신라면 멀티팩', 4480, '자취 필수템! 5개입 멀티팩', '라면', 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=400&fit=crop'],
      ['즉석밥 12개입', 11900, '햇반 210g x 12개, 밥 걱정 끝', '즉석식품', 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44726?w=400&h=400&fit=crop'],
      ['김치찌개 밀키트', 8900, '돼지고기 김치찌개 2인분 밀키트', '밀키트', 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&h=400&fit=crop'],
      ['계란 30구', 6980, '신선한 국내산 계란 30구 한판', '신선식품', 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=400&fit=crop'],
      ['삼겹살 500g', 12900, '국내산 냉장 삼겹살 500g', '신선식품', 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=400&fit=crop'],
      ['참이슬 소주 4팩', 7920, '참이슬 후레쉬 360ml x 4병', '음료', 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&h=400&fit=crop'],
      ['바나나우유 6개입', 5400, '빙그레 바나나맛우유 240ml x 6', '음료', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop'],
      ['키친타올 6롤', 4900, '두꺼운 3겹 키친타올 150매 x 6', '생활용품', 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop'],
      ['섬유유연제 2.5L', 6900, '피죤 섬유유연제 블루 2.5L', '생활용품', 'https://images.unsplash.com/photo-1585441695325-21557ef84837?w=400&h=400&fit=crop'],
      ['컵라면 6개 세트', 3600, '육개장 사발면 6개입 세트', '라면', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop'],
    ];
    for (const [name, price, description, category, image_url] of products) {
      await pool.query(
        'INSERT INTO shopping_mall_app_01_products (name, price, description, category, image_url) VALUES ($1, $2, $3, $4, $5)',
        [name, price, description, category, image_url]
      );
    }
  } else {
    // 기존 데이터에 이미지 업데이트
    const imageMap = {
      '신라면 멀티팩': 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=400&fit=crop',
      '즉석밥 12개입': 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44726?w=400&h=400&fit=crop',
      '김치찌개 밀키트': 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&h=400&fit=crop',
      '계란 30구': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=400&fit=crop',
      '삼겹살 500g': 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=400&fit=crop',
      '참이슬 소주 4팩': 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&h=400&fit=crop',
      '바나나우유 6개입': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop',
      '키친타올 6롤': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop',
      '섬유유연제 2.5L': 'https://images.unsplash.com/photo-1585441695325-21557ef84837?w=400&h=400&fit=crop',
      '컵라면 6개 세트': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop',
    };
    for (const [name, url] of Object.entries(imageMap)) {
      await pool.query('UPDATE shopping_mall_app_01_products SET image_url = $1 WHERE name = $2 AND (image_url IS NULL OR image_url = \'\')', [url, name]);
    }
  }

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
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: '토큰이 만료되었거나 유효하지 않습니다.' });
  }
}

// ======== 인증 API ========

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, nickname } = req.body;
    if (!email || !password || !nickname) {
      return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
    }
    if (password.length < 4) {
      return res.status(400).json({ success: false, message: '비밀번호는 4자 이상이어야 합니다.' });
    }
    const existing = await pool.query('SELECT id FROM shopping_mall_app_01_users WHERE email = $1', [email.trim().toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: '이미 가입된 이메일입니다.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO shopping_mall_app_01_users (email, password, nickname) VALUES ($1, $2, $3) RETURNING id, email, nickname',
      [email.trim().toLowerCase(), hashed, nickname.trim()]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, nickname: user.nickname }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, data: { token, user: { id: user.id, email: user.email, nickname: user.nickname } } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: '회원가입에 실패했습니다.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: '이메일과 비밀번호를 입력해주세요.' });
    }
    const result = await pool.query('SELECT * FROM shopping_mall_app_01_users WHERE email = $1', [email.trim().toLowerCase()]);
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
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: '로그인에 실패했습니다.' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

// ======== 상품 API (인증 불필요) ========

app.get('/api/products', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shopping_mall_app_01_products ORDER BY id ASC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET products error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

// ======== 장바구니 API (인증 필요) ========

// 장바구니 조회 (상품 정보 JOIN)
app.get('/api/cart', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.description, p.category, p.image_url
      FROM shopping_mall_app_01_cart_items c
      JOIN shopping_mall_app_01_products p ON c.product_id = p.id
      WHERE c.user_id = $1
      ORDER BY c.created_at ASC
    `, [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET cart error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch cart' });
  }
});

// 장바구니에 상품 추가 (이미 있으면 수량 +1)
app.post('/api/cart', authMiddleware, async (req, res) => {
  try {
    const { product_id } = req.body;
    if (!product_id) {
      return res.status(400).json({ success: false, message: 'product_id is required' });
    }
    const result = await pool.query(`
      INSERT INTO shopping_mall_app_01_cart_items (user_id, product_id, quantity)
      VALUES ($1, $2, 1)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET quantity = shopping_mall_app_01_cart_items.quantity + 1
      RETURNING *
    `, [req.user.id, product_id]);

    // 상품 정보 포함해서 반환
    const item = await pool.query(`
      SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.description, p.category, p.image_url
      FROM shopping_mall_app_01_cart_items c
      JOIN shopping_mall_app_01_products p ON c.product_id = p.id
      WHERE c.id = $1
    `, [result.rows[0].id]);

    res.status(201).json({ success: true, data: item.rows[0] });
  } catch (err) {
    console.error('POST cart error:', err);
    res.status(500).json({ success: false, message: 'Failed to add to cart' });
  }
});

// 수량 변경
app.put('/api/cart/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'quantity must be >= 1' });
    }
    const result = await pool.query(
      'UPDATE shopping_mall_app_01_cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3 RETURNING *',
      [quantity, req.user.id, productId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('PUT cart error:', err);
    res.status(500).json({ success: false, message: 'Failed to update cart' });
  }
});

// 장바구니에서 상품 제거
app.delete('/api/cart/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    await pool.query(
      'DELETE FROM shopping_mall_app_01_cart_items WHERE user_id = $1 AND product_id = $2',
      [req.user.id, productId]
    );
    res.json({ success: true, message: 'Item removed' });
  } catch (err) {
    console.error('DELETE cart item error:', err);
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
});

// 장바구니 비우기
app.delete('/api/cart', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM shopping_mall_app_01_cart_items WHERE user_id = $1', [req.user.id]);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    console.error('DELETE cart error:', err);
    res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
});

// SPA fallback
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
module.exports = app;
