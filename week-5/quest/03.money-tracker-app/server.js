const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// Database Setup
// ========================================

const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || 'postgresql://postgres.omkuaglgzbbjiigxppml:EQRsyNNjz7UFlDQz@aws-1-us-east-1.pooler.supabase.com:5432/postgres').trim(),
  ssl: { rejectUnauthorized: false },
});

let dbInitialized = false;

async function initDB() {
  if (dbInitialized) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS money_app_01_entries (
      id SERIAL PRIMARY KEY,
      type VARCHAR(10) NOT NULL,
      date DATE NOT NULL,
      amount NUMERIC NOT NULL,
      original_amount NUMERIC,
      currency VARCHAR(5) DEFAULT 'KRW',
      category VARCHAR(50) NOT NULL,
      memo TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  dbInitialized = true;
}

// ========================================
// Middleware
// ========================================

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// DB init middleware for /api routes
app.use('/api', async (_req, res, next) => {
  try {
    await initDB();
    next();
  } catch (err) {
    console.error('Database initialization failed:', err);
    res.status(500).json({ success: false, message: 'Database initialization failed' });
  }
});

// ========================================
// API Routes
// ========================================

// GET /api/entries - Get all entries ordered by date DESC, created_at DESC
app.get('/api/entries', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM money_app_01_entries ORDER BY date DESC, created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Failed to fetch entries:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch entries' });
  }
});

// POST /api/entries - Create a new entry
app.post('/api/entries', async (req, res) => {
  try {
    const { type, date, amount, originalAmount, currency, category, memo } = req.body;

    // Validation
    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type. Must be "income" or "expense".' });
    }
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required.' });
    }
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
    }
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required.' });
    }

    const result = await pool.query(
      `INSERT INTO money_app_01_entries (type, date, amount, original_amount, currency, category, memo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [type, date, Number(amount), originalAmount ? Number(originalAmount) : null, currency || 'KRW', category, memo || '']
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Failed to create entry:', err);
    res.status(500).json({ success: false, message: 'Failed to create entry' });
  }
});

// DELETE /api/entries/:id - Delete an entry by id
app.delete('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM money_app_01_entries WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Failed to delete entry:', err);
    res.status(500).json({ success: false, message: 'Failed to delete entry' });
  }
});

// ========================================
// SPA Fallback
// ========================================

app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ========================================
// Start Server / Export
// ========================================

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
