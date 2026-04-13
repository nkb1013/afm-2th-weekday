require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ---------------------------------------------------------------------------
// PostgreSQL Connection
// ---------------------------------------------------------------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ---------------------------------------------------------------------------
// Initialize Tables
// ---------------------------------------------------------------------------
const SEED_INGREDIENTS = [
  { name: '참치캔', quantity: '2개', category: '상온' },
  { name: '계란', quantity: '6개', category: '냉장' },
  { name: '냉동 닭가슴살', quantity: '2팩', category: '냉동' },
  { name: '냉동만두', quantity: '1봉', category: '냉동' },
  { name: '냉동밥', quantity: '3개', category: '냉동' },
  { name: '파', quantity: '2대', category: '냉장' },
  { name: '즉석카레', quantity: '1개', category: '상온' },
  { name: '김치', quantity: '1통', category: '냉장' },
  { name: '우유', quantity: '1팩', category: '냉장' },
  { name: '양파', quantity: '2개', category: '냉장' },
  { name: '라면', quantity: '3봉', category: '상온' },
  { name: '슬라이스 치즈', quantity: '5장', category: '냉장' },
  { name: '두부', quantity: '1모', category: '냉장' },
];

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      quantity VARCHAR(100),
      category VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Add columns if upgrading from older schema
  await pool.query(`
    ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS category VARCHAR(100)
  `);
  await pool.query(`
    ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS quantity VARCHAR(100)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS recipes (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      ingredients TEXT[] NOT NULL DEFAULT '{}',
      instructions TEXT NOT NULL,
      steps TEXT[] NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Add steps column if upgrading from older schema
  await pool.query(`
    ALTER TABLE recipes ADD COLUMN IF NOT EXISTS steps TEXT[] NOT NULL DEFAULT '{}'
  `);

  // Seed ingredients from my-fridge JSON files if table is empty
  const countResult = await pool.query('SELECT COUNT(*) FROM ingredients');
  if (Number(countResult.rows[0].count) === 0) {
    for (const item of SEED_INGREDIENTS) {
      await pool.query(
        'INSERT INTO ingredients (name, quantity, category) VALUES ($1, $2, $3)',
        [item.name, item.quantity, item.category]
      );
    }
    console.log(`Seeded ${SEED_INGREDIENTS.length} ingredients`);
  }

  console.log('Database tables ready');
}

// ---------------------------------------------------------------------------
// Ingredients API
// ---------------------------------------------------------------------------

// GET /api/ingredients - 모든 재료 조회
app.get('/api/ingredients', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, quantity, category, created_at AS "createdAt" FROM ingredients ORDER BY id'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/ingredients - 재료 추가
app.post('/api/ingredients', async (req, res) => {
  const { name, quantity, category } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ success: false, message: 'name is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO ingredients (name, quantity, category) VALUES ($1, $2, $3) RETURNING id, name, quantity, category, created_at AS "createdAt"',
      [
        name.trim(),
        quantity && typeof quantity === 'string' ? quantity.trim() : null,
        category && typeof category === 'string' ? category.trim() : null,
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/ingredients/:id - 재료 삭제
app.delete('/api/ingredients/:id', async (req, res) => {
  const id = Number(req.params.id);

  try {
    const result = await pool.query(
      'DELETE FROM ingredients WHERE id = $1 RETURNING id, name, quantity, category, created_at AS "createdAt"',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Ingredient not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// Recipes API
// ---------------------------------------------------------------------------

// GET /api/recipes - 모든 레시피 조회
app.get('/api/recipes', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, ingredients, instructions, steps, created_at AS "createdAt", updated_at AS "updatedAt" FROM recipes ORDER BY id'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/recipes/:id - 특정 레시피 조회
app.get('/api/recipes/:id', async (req, res) => {
  const id = Number(req.params.id);

  try {
    const result = await pool.query(
      'SELECT id, title, ingredients, instructions, steps, created_at AS "createdAt", updated_at AS "updatedAt" FROM recipes WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Recipe not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/recipes - 레시피 추가
app.post('/api/recipes', async (req, res) => {
  const { title, ingredients: recipeIngredients, instructions, steps } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ success: false, message: 'title is required' });
  }
  if (!Array.isArray(recipeIngredients) || recipeIngredients.length === 0) {
    return res.status(400).json({ success: false, message: 'ingredients must be a non-empty array' });
  }
  if (!instructions || typeof instructions !== 'string' || !instructions.trim()) {
    return res.status(400).json({ success: false, message: 'instructions is required' });
  }

  const recipeSteps = Array.isArray(steps)
    ? steps.map((s) => String(s).trim()).filter((s) => s.length > 0)
    : [];

  try {
    const result = await pool.query(
      `INSERT INTO recipes (title, ingredients, instructions, steps)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, ingredients, instructions, steps, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [title.trim(), recipeIngredients, instructions.trim(), recipeSteps]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/recipes/:id - 레시피 수정
app.put('/api/recipes/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { title, ingredients: recipeIngredients, instructions, steps } = req.body;

  try {
    // Check if recipe exists
    const existing = await pool.query('SELECT id FROM recipes WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Recipe not found' });
    }

    // Build dynamic update
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ success: false, message: 'title must be a non-empty string' });
      }
      updates.push(`title = $${paramIndex++}`);
      values.push(title.trim());
    }

    if (recipeIngredients !== undefined) {
      if (!Array.isArray(recipeIngredients) || recipeIngredients.length === 0) {
        return res.status(400).json({ success: false, message: 'ingredients must be a non-empty array' });
      }
      updates.push(`ingredients = $${paramIndex++}`);
      values.push(recipeIngredients);
    }

    if (instructions !== undefined) {
      if (typeof instructions !== 'string' || !instructions.trim()) {
        return res.status(400).json({ success: false, message: 'instructions must be a non-empty string' });
      }
      updates.push(`instructions = $${paramIndex++}`);
      values.push(instructions.trim());
    }

    if (steps !== undefined) {
      if (!Array.isArray(steps)) {
        return res.status(400).json({ success: false, message: 'steps must be an array' });
      }
      const cleanedSteps = steps.map((s) => String(s).trim()).filter((s) => s.length > 0);
      updates.push(`steps = $${paramIndex++}`);
      values.push(cleanedSteps);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE recipes SET ${updates.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, title, ingredients, instructions, steps, created_at AS "createdAt", updated_at AS "updatedAt"`,
      values
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/recipes/:id - 레시피 삭제
app.delete('/api/recipes/:id', async (req, res) => {
  const id = Number(req.params.id);

  try {
    const result = await pool.query(
      'DELETE FROM recipes WHERE id = $1 RETURNING id, title, ingredients, instructions, steps, created_at AS "createdAt", updated_at AS "updatedAt"',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Recipe not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
if (require.main === module) {
  initDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    });
}

module.exports = app;
