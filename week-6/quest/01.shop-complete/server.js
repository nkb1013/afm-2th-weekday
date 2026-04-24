const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const multer = require('multer');
const ImageKit = require('imagekit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ─── App Initialization ─────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = (process.env.JWT_SECRET || 'shopping-mall-secret-key-2024').trim();

// ─── Database Connection ─────────────────────────────────────────────
const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || 'postgresql://postgres.omkuaglgzbbjiigxppml:EQRsyNNjz7UFlDQz@aws-1-us-east-1.pooler.supabase.com:5432/postgres').trim(),
  ssl: { rejectUnauthorized: false },
});

// ─── ImageKit Configuration ──────────────────────────────────────────
const imagekit = new ImageKit({
  publicKey: 'public_fTaKMYd/TNW4xBUMZ1AQbuWZsiE=',
  privateKey: 'private_x2VQjS1ubFK0lwifMovLhz84a0c=',
  urlEndpoint: 'https://ik.imagekit.io/4wt2mpclf',
});

// ─── Multer (Memory Storage) ─────────────────────────────────────────
const upload = multer({ storage: multer.memoryStorage() });

// ─── Middleware ──────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// ─── Product CRUD Routes ─────────────────────────────────────────────

// GET /api/products - 전체 상품 목록 조회
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM shopping_mall_app_01_products ORDER BY created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ success: false, message: '상품 목록 조회에 실패했습니다.' });
  }
});

// POST /api/products - 새 상품 등록
app.post('/api/products', async (req, res) => {
  try {
    const { name, price, description, category, image_url } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({ success: false, message: '상품명, 가격, 카테고리는 필수입니다.' });
    }

    const result = await pool.query(
      `INSERT INTO shopping_mall_app_01_products (name, price, description, category, image_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, parseInt(price), description || null, category, image_url || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ success: false, message: '상품 등록에 실패했습니다.' });
  }
});

// PUT /api/products/:id - 상품 수정
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, category, image_url } = req.body;

    const existing = await pool.query('SELECT * FROM shopping_mall_app_01_products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
    }

    const prev = existing.rows[0];
    const result = await pool.query(
      `UPDATE shopping_mall_app_01_products
       SET name = $1, price = $2, description = $3, category = $4, image_url = $5
       WHERE id = $6
       RETURNING *`,
      [
        name ?? prev.name,
        price !== undefined ? parseInt(price) : prev.price,
        description ?? prev.description,
        category ?? prev.category,
        image_url ?? prev.image_url,
        id,
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ success: false, message: '상품 수정에 실패했습니다.' });
  }
});

// DELETE /api/products/:id - 상품 삭제
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM shopping_mall_app_01_products WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
    }

    res.json({ success: true, message: '상품이 삭제되었습니다.', data: result.rows[0] });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ success: false, message: '상품 삭제에 실패했습니다.' });
  }
});

// ─── Image Upload Route ──────────────────────────────────────────────

// POST /api/upload - 이미지 업로드 (ImageKit)
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '이미지 파일을 선택해주세요.' });
    }

    const response = await imagekit.upload({
      file: req.file.buffer.toString('base64'),
      fileName: req.file.originalname,
      folder: '/shop-complete-products',
    });

    res.json({
      success: true,
      data: {
        url: response.url,
        fileId: response.fileId,
        name: response.name,
      },
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: '이미지 업로드에 실패했습니다.' });
  }
});

// ─── Dashboard Stats Route ───────────────────────────────────────────

// GET /api/stats - 대시보드 통계
app.get('/api/stats', async (req, res) => {
  try {
    const totalProducts = await pool.query('SELECT COUNT(*) FROM shopping_mall_app_01_products');
    const byCategory = await pool.query(
      'SELECT category, COUNT(*) as count FROM shopping_mall_app_01_products GROUP BY category ORDER BY count DESC'
    );
    const totalUsers = await pool.query('SELECT COUNT(*) FROM shopping_mall_app_01_users');

    res.json({
      success: true,
      data: {
        totalProducts: parseInt(totalProducts.rows[0].count),
        byCategory: byCategory.rows,
        totalUsers: parseInt(totalUsers.rows[0].count),
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: '통계 조회에 실패했습니다.' });
  }
});

// ─── JWT Auth Middleware ─────────────────────────────────────────────
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

// ─── Auth API ───────────────────────────────────────────────────────

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

// ─── Cart API ───────────────────────────────────────────────────────

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

app.delete('/api/cart', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM shopping_mall_app_01_cart_items WHERE user_id = $1', [req.user.id]);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    console.error('DELETE cart error:', err);
    res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
});

// ─── Orders DB Init ─────────────────────────────────────────────────
let ordersTableReady = false;
async function ensureOrdersTable() {
  if (ordersTableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shopping_mall_app_01_orders (
      id SERIAL PRIMARY KEY,
      order_id VARCHAR(64) UNIQUE NOT NULL,
      user_id INTEGER REFERENCES shopping_mall_app_01_users(id),
      order_name VARCHAR(300) NOT NULL,
      amount INTEGER NOT NULL,
      status VARCHAR(50) DEFAULT 'PENDING',
      payment_key VARCHAR(200),
      items JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      paid_at TIMESTAMPTZ
    )
  `);
  ordersTableReady = true;
}

// ─── Order API ──────────────────────────────────────────────────────

// POST /api/orders - 주문 생성 (결제 요청 전)
app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    await ensureOrdersTable();
    const { orderId, orderName, amount, items } = req.body;
    if (!orderId || !orderName || !amount) {
      return res.status(400).json({ success: false, message: 'orderId, orderName, amount는 필수입니다.' });
    }
    const result = await pool.query(
      `INSERT INTO shopping_mall_app_01_orders (order_id, user_id, order_name, amount, items)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [orderId, req.user.id, orderName, amount, JSON.stringify(items || [])]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: '주문 생성에 실패했습니다.' });
  }
});

// POST /api/payments/confirm - 결제 승인 (서버에서 토스페이먼츠 API 호출)
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6';

app.post('/api/payments/confirm', authMiddleware, async (req, res) => {
  try {
    await ensureOrdersTable();
    const { paymentKey, orderId, amount } = req.body;
    if (!paymentKey || !orderId || !amount) {
      return res.status(400).json({ success: false, message: 'paymentKey, orderId, amount는 필수입니다.' });
    }

    // DB에서 주문 조회 및 금액 검증
    const orderResult = await pool.query(
      'SELECT * FROM shopping_mall_app_01_orders WHERE order_id = $1 AND user_id = $2',
      [orderId, req.user.id]
    );
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }
    const order = orderResult.rows[0];
    if (order.amount !== Number(amount)) {
      return res.status(400).json({ success: false, message: '결제 금액이 주문 금액과 일치하지 않습니다.' });
    }

    // 토스페이먼츠 결제 승인 API 호출
    const encryptedSecretKey = Buffer.from(TOSS_SECRET_KEY + ':').toString('base64');
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encryptedSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      console.error('Toss confirm error:', tossData);
      await pool.query(
        'UPDATE shopping_mall_app_01_orders SET status = $1 WHERE order_id = $2',
        ['FAILED', orderId]
      );
      return res.status(tossRes.status).json({
        success: false,
        message: tossData.message || '결제 승인에 실패했습니다.',
        code: tossData.code,
      });
    }

    // 결제 성공 - 주문 상태 업데이트
    await pool.query(
      'UPDATE shopping_mall_app_01_orders SET status = $1, payment_key = $2, paid_at = NOW() WHERE order_id = $3',
      ['DONE', paymentKey, orderId]
    );

    // 장바구니 비우기
    await pool.query('DELETE FROM shopping_mall_app_01_cart_items WHERE user_id = $1', [req.user.id]);

    res.json({ success: true, data: tossData });
  } catch (err) {
    console.error('Payment confirm error:', err);
    res.status(500).json({ success: false, message: '결제 승인 처리 중 오류가 발생했습니다.' });
  }
});

// GET /api/orders - 내 주문 목록
app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    await ensureOrdersTable();
    const result = await pool.query(
      'SELECT * FROM shopping_mall_app_01_orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ success: false, message: '주문 목록 조회에 실패했습니다.' });
  }
});

// ─── Page Routes ────────────────────────────────────────────────────
app.get('/shop', (_req, res) => {
  res.sendFile(path.join(__dirname, 'shop.html'));
});

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── SPA Fallback ────────────────────────────────────────────────────
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'shop.html'));
});

// ─── Error Handling Middleware ────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: '서버 내부 오류가 발생했습니다.' });
});

// ─── Start Server / Export ───────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`자취용품 쇼핑몰 관리자 서버: http://localhost:${PORT}`);
  });
}

module.exports = app;
