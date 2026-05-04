const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const ImageKit = require('imagekit');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'danggeun-market-jwt-secret-2024';

// =============================================================================
// ImageKit Configuration
// =============================================================================
const imagekit = new ImageKit({
  publicKey: 'public_fTaKMYd/TNW4xBUMZ1AQbuWZsiE=',
  privateKey: 'private_x2VQjS1ubFK0lwifMovLhz84a0c=',
  urlEndpoint: 'https://ik.imagekit.io/4wt2mpclf',
});

// =============================================================================
// PostgreSQL Configuration
// =============================================================================
const pool = new Pool({
  connectionString:
    'postgresql://postgres.omkuaglgzbbjiigxppml:EQRsyNNjz7UFlDQz@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

// =============================================================================
// Middleware
// =============================================================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Multer: memory storage, 10MB limit, images only, max 3 files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// =============================================================================
// JWT Auth Middleware
// =============================================================================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// =============================================================================
// DB Table Initialization
// =============================================================================
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nickname VARCHAR(100) NOT NULL,
        location VARCHAR(100) NOT NULL,
        manner_temp DECIMAL(3,1) DEFAULT 36.5,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        price INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        category VARCHAR(100),
        images TEXT[] DEFAULT '{}',
        status VARCHAR(20) DEFAULT 'sale',
        likes INTEGER DEFAULT 0,
        chats INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(product_id, buyer_id)
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('DB tables initialized');
  } catch (err) {
    console.error('DB init error:', err.message);
  }
}

// =============================================================================
// Routes: Image Upload (ImageKit)
// =============================================================================
app.post('/api/upload', upload.array('images', 3), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files provided' });
    }

    const uploadPromises = req.files.map((file) =>
      imagekit.upload({
        file: file.buffer.toString('base64'),
        fileName: file.originalname,
        folder: '/danggeun',
      })
    );

    const results = await Promise.all(uploadPromises);
    const urls = results.map((r) => r.url);

    res.json({ success: true, data: { urls } });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ success: false, message: 'Image upload failed' });
  }
});

// =============================================================================
// Routes: Auth (Signup / Login / Me)
// =============================================================================

// POST /api/signup
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, nickname, location } = req.body;

    if (!email || !password || !nickname || !location) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Check duplicate email
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password, nickname, location) VALUES ($1, $2, $3, $4) RETURNING id, email, nickname, location, manner_temp, created_at',
      [email, hashedPassword, nickname, location]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      data: { token, user },
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ success: false, message: 'Signup failed' });
  }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          location: user.location,
          manner_temp: user.manner_temp,
          created_at: user.created_at,
        },
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// GET /api/me
app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, nickname, location, manner_temp, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Me error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to get user info' });
  }
});

// =============================================================================
// Routes: Products CRUD
// =============================================================================

// GET /api/products — list all products with seller info
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id, p.title, p.price, p.description, p.category,
        p.images, p.status, p.likes, p.chats, p.created_at,
        u.nickname, u.location, u.manner_temp
      FROM products p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get products error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to get products' });
  }
});

// GET /api/products/:id — product detail
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT
        p.id, p.title, p.price, p.description, p.category,
        p.images, p.status, p.likes, p.chats, p.created_at,
        p.user_id,
        u.nickname, u.location, u.manner_temp
      FROM products p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Get product error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to get product' });
  }
});

// POST /api/products — create product (auth required)
app.post('/api/products', authMiddleware, async (req, res) => {
  try {
    const { title, price, description, category, images } = req.body;

    if (!title || price === undefined) {
      return res.status(400).json({ success: false, message: 'Title and price are required' });
    }

    const result = await pool.query(
      `INSERT INTO products (user_id, title, price, description, category, images)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, title, price, description || '', category || '', images || []]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Create product error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
});

// PUT /api/products/:id — update product (owner only)
app.put('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const existing = await pool.query('SELECT user_id FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    }

    const { title, price, description, category, images, status } = req.body;

    const result = await pool.query(
      `UPDATE products
       SET title = COALESCE($1, title),
           price = COALESCE($2, price),
           description = COALESCE($3, description),
           category = COALESCE($4, category),
           images = COALESCE($5, images),
           status = COALESCE($6, status)
       WHERE id = $7
       RETURNING *`,
      [title, price, description, category, images, status, id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Update product error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

// DELETE /api/products/:id — delete product (owner only)
app.delete('/api/products/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const existing = await pool.query('SELECT user_id FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (existing.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this product' });
    }

    await pool.query('DELETE FROM products WHERE id = $1', [id]);

    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    console.error('Delete product error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});

// =============================================================================
// Routes: Chat
// =============================================================================

// POST /api/chat/rooms — create or get existing room
app.post('/api/chat/rooms', authMiddleware, async (req, res) => {
  try {
    const { product_id, seller_id } = req.body;
    if (!product_id || !seller_id) {
      return res.status(400).json({ success: false, message: 'product_id and seller_id required' });
    }
    if (req.user.id === seller_id) {
      return res.status(400).json({ success: false, message: 'Cannot chat with yourself' });
    }
    // Check if room already exists
    const existing = await pool.query(
      'SELECT id FROM chat_rooms WHERE product_id = $1 AND buyer_id = $2',
      [product_id, req.user.id]
    );
    if (existing.rows.length > 0) {
      return res.json({ success: true, data: { room_id: existing.rows[0].id } });
    }
    const result = await pool.query(
      'INSERT INTO chat_rooms (product_id, buyer_id, seller_id) VALUES ($1, $2, $3) RETURNING id',
      [product_id, req.user.id, seller_id]
    );
    res.status(201).json({ success: true, data: { room_id: result.rows[0].id } });
  } catch (err) {
    console.error('Create room error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create chat room' });
  }
});

// GET /api/chat/rooms — list my chat rooms
app.get('/api/chat/rooms', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        cr.id, cr.product_id, cr.buyer_id, cr.seller_id, cr.created_at,
        p.title AS product_title, p.images AS product_images, p.price AS product_price,
        buyer.nickname AS buyer_name,
        seller.nickname AS seller_name,
        (SELECT content FROM messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) AS last_message,
        (SELECT created_at FROM messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
        (SELECT COUNT(*)::int FROM messages WHERE room_id = cr.id AND sender_id != $1 AND created_at > COALESCE(
          (SELECT MAX(created_at) FROM messages WHERE room_id = cr.id AND sender_id = $1), cr.created_at
        )) AS unread
      FROM chat_rooms cr
      JOIN products p ON cr.product_id = p.id
      JOIN users buyer ON cr.buyer_id = buyer.id
      JOIN users seller ON cr.seller_id = seller.id
      WHERE cr.buyer_id = $1 OR cr.seller_id = $1
      ORDER BY COALESCE(
        (SELECT MAX(created_at) FROM messages WHERE room_id = cr.id),
        cr.created_at
      ) DESC
    `, [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('List rooms error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to list chat rooms' });
  }
});

// GET /api/chat/rooms/:id/messages — get messages
app.get('/api/chat/rooms/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    // Verify user is in the room
    const room = await pool.query(
      'SELECT * FROM chat_rooms WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
      [id, req.user.id]
    );
    if (room.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not a member of this room' });
    }
    const after = req.query.after || '1970-01-01';
    const result = await pool.query(
      `SELECT m.id, m.sender_id, m.content, m.created_at, u.nickname AS sender_name
       FROM messages m JOIN users u ON m.sender_id = u.id
       WHERE m.room_id = $1 AND m.created_at > $2
       ORDER BY m.created_at ASC`,
      [id, after]
    );
    res.json({ success: true, data: { room: room.rows[0], messages: result.rows } });
  } catch (err) {
    console.error('Get messages error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to get messages' });
  }
});

// POST /api/chat/rooms/:id/messages — send message
app.post('/api/chat/rooms/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content required' });
    }
    // Verify user is in the room
    const room = await pool.query(
      'SELECT * FROM chat_rooms WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
      [id, req.user.id]
    );
    if (room.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Not a member of this room' });
    }
    const result = await pool.query(
      `INSERT INTO messages (room_id, sender_id, content) VALUES ($1, $2, $3)
       RETURNING id, sender_id, content, created_at`,
      [id, req.user.id, content.trim()]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Send message error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// =============================================================================
// Error Handling
// =============================================================================
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File size exceeds 10 MB limit' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ success: false, message: 'Maximum 3 images allowed' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ success: false, message: err.message });
  }
  console.error('Server error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// =============================================================================
// Start Server
// =============================================================================
if (require.main === module) {
  (async function start() {
    await initDB();
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })();
}

module.exports = app;
