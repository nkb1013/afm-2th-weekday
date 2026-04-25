const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// Database Connection
// ---------------------------------------------------------------------------
const DATABASE_URL =
  (process.env.DATABASE_URL ||
    'postgresql://postgres.omkuaglgzbbjiigxppml:EQRsyNNjz7UFlDQz@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
  ).trim();

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ---------------------------------------------------------------------------
// Lazy DB Initialization
// ---------------------------------------------------------------------------
let dbInitialized = false;

async function initDB() {
  if (dbInitialized) return;

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS purchases (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      content_id INTEGER NOT NULL,
      order_id TEXT UNIQUE NOT NULL,
      payment_key TEXT NOT NULL,
      amount INTEGER NOT NULL,
      purchased_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, content_id)
    );
  `;

  await pool.query(createTableSQL);
  console.log('[DB] purchases table ready');
  dbInitialized = true;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// DB init middleware for /api routes
app.use('/api', async (_req, _res, next) => {
  try {
    await initDB();
    next();
  } catch (err) {
    console.error('[DB] Initialization failed:', err.message);
    _res.status(500).json({ success: false, message: 'Database initialization failed' });
  }
});

// ---------------------------------------------------------------------------
// TossPayments Config
// ---------------------------------------------------------------------------
const TOSS_SECRET_KEY = (process.env.TOSS_SECRET_KEY || 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6').trim();
const TOSS_AUTH = 'Basic ' + Buffer.from(TOSS_SECRET_KEY + ':').toString('base64');

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------

// POST /api/confirm-payment - 결제 승인 후 DB 기록
app.post('/api/confirm-payment', async (req, res) => {
  try {
    const { paymentKey, orderId, amount, userId, contentId } = req.body;

    // Validate required fields
    if (!paymentKey || !orderId || !amount || !userId || contentId === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: paymentKey, orderId, amount, userId, contentId',
      });
    }

    // 1) TossPayments 승인 API 호출
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: TOSS_AUTH,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      console.error('[TossPayments] Confirm failed:', tossData);
      return res.status(tossRes.status).json({
        success: false,
        message: tossData.message || 'Payment confirmation failed',
        code: tossData.code,
      });
    }

    // 2) DB에 구매 기록 INSERT
    try {
      await pool.query(
        `INSERT INTO purchases (user_id, content_id, order_id, payment_key, amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, contentId, orderId, paymentKey, amount]
      );
    } catch (dbErr) {
      // UNIQUE 위반 (이미 구매한 콘텐츠)
      if (dbErr.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'Already purchased this content',
        });
      }
      throw dbErr;
    }

    // 3) 성공 응답
    console.log(`[Payment] User ${userId} purchased content ${contentId} (order: ${orderId})`);
    return res.status(201).json({
      success: true,
      payment: tossData,
    });
  } catch (err) {
    console.error('[API] confirm-payment error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/purchases/:userId - 유저의 전체 구매 목록
app.get('/api/purchases/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT content_id, order_id, purchased_at
       FROM purchases
       WHERE user_id = $1
       ORDER BY purchased_at DESC`,
      [userId]
    );

    return res.json({ purchases: result.rows });
  } catch (err) {
    console.error('[API] get purchases error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/purchases/:userId/:contentId - 특정 콘텐츠 구매 여부
app.get('/api/purchases/:userId/:contentId', async (req, res) => {
  try {
    const { userId, contentId } = req.params;

    const result = await pool.query(
      `SELECT 1 FROM purchases WHERE user_id = $1 AND content_id = $2 LIMIT 1`,
      [userId, parseInt(contentId, 10)]
    );

    return res.json({ purchased: result.rows.length > 0 });
  } catch (err) {
    console.error('[API] check purchase error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// Error Handling Middleware
// ---------------------------------------------------------------------------
app.use((err, _req, res, _next) => {
  console.error('[Server] Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ---------------------------------------------------------------------------
// Server Start / Vercel Export
// ---------------------------------------------------------------------------
if (require.main === module) {
  pool.query('SELECT NOW()')
    .then(() => {
      console.log('[DB] Connected to PostgreSQL (Supabase)');
      app.listen(PORT, () => {
        console.log(`[Server] Running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('[DB] Connection failed:', err.message);
      process.exit(1);
    });
}

module.exports = app;
