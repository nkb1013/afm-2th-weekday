const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Database connection ---
const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || 'postgresql://postgres.omkuaglgzbbjiigxppml:EQRsyNNjz7UFlDQz@aws-1-us-east-1.pooler.supabase.com:6543/postgres').trim(),
  ssl: { rejectUnauthorized: false },
});

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// --- Validation constants ---
const VALID_JOBS = ['개발/IT', '디자인', '마케팅', '경영/사무', '금융', '교육', '의료', '서비스업', '기타'];
const VALID_EXPERIENCE = ['신입(1년 미만)', '1-3년', '3-5년', '5-10년', '10년 이상'];
const SPENDING_FIELDS = ['food', 'housing', 'transport', 'subscriptions', 'shopping', 'leisure', 'savings', 'other'];
const SALARY_BUCKETS = [200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800];

// --- Lazy DB init ---
let dbInitialized = false;

async function initDB() {
  if (dbInitialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS entries (
      id SERIAL PRIMARY KEY,
      salary INTEGER NOT NULL,
      job VARCHAR(20) NOT NULL,
      experience VARCHAR(20) NOT NULL,
      food INTEGER DEFAULT 0,
      housing INTEGER DEFAULT 0,
      transport INTEGER DEFAULT 0,
      subscriptions INTEGER DEFAULT 0,
      shopping INTEGER DEFAULT 0,
      leisure INTEGER DEFAULT 0,
      savings INTEGER DEFAULT 0,
      other INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  dbInitialized = true;
}

app.use('/api', async (_req, res, next) => {
  try {
    await initDB();
    next();
  } catch (err) {
    console.error('Database initialization failed:', err.message);
    res.status(500).json({ success: false, message: 'Database initialization failed' });
  }
});

// --- Validation helper ---
function validateEntry(body) {
  const { salary, job, experience } = body;

  if (!salary || salary <= 0) {
    return 'salary is required and must be greater than 0';
  }
  if (!VALID_JOBS.includes(job)) {
    return `job must be one of: ${VALID_JOBS.join(', ')}`;
  }
  if (!VALID_EXPERIENCE.includes(experience)) {
    return `experience must be one of: ${VALID_EXPERIENCE.join(', ')}`;
  }
  return null;
}

// --- API Routes ---

// GET /api/entries - Get all entries
app.get('/api/entries', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM entries ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /api/entries error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch entries' });
  }
});

// POST /api/entries - Create a new entry
app.post('/api/entries', async (req, res) => {
  try {
    const error = validateEntry(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const { salary, job, experience } = req.body;
    const food = req.body.food || 0;
    const housing = req.body.housing || 0;
    const transport = req.body.transport || 0;
    const subscriptions = req.body.subscriptions || 0;
    const shopping = req.body.shopping || 0;
    const leisure = req.body.leisure || 0;
    const savings = req.body.savings || 0;
    const other = req.body.other || 0;

    const result = await pool.query(
      `INSERT INTO entries (salary, job, experience, food, housing, transport, subscriptions, shopping, leisure, savings, other)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [salary, job, experience, food, housing, transport, subscriptions, shopping, leisure, savings, other]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('POST /api/entries error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create entry' });
  }
});

// PUT /api/entries/:id - Update an entry
app.put('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const error = validateEntry(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const { salary, job, experience } = req.body;
    const food = req.body.food || 0;
    const housing = req.body.housing || 0;
    const transport = req.body.transport || 0;
    const subscriptions = req.body.subscriptions || 0;
    const shopping = req.body.shopping || 0;
    const leisure = req.body.leisure || 0;
    const savings = req.body.savings || 0;
    const other = req.body.other || 0;

    const result = await pool.query(
      `UPDATE entries
       SET salary=$1, job=$2, experience=$3, food=$4, housing=$5, transport=$6,
           subscriptions=$7, shopping=$8, leisure=$9, savings=$10, other=$11
       WHERE id=$12
       RETURNING *`,
      [salary, job, experience, food, housing, transport, subscriptions, shopping, leisure, savings, other, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('PUT /api/entries/:id error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update entry' });
  }
});

// DELETE /api/entries/:id - Delete an entry
app.delete('/api/entries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM entries WHERE id=$1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('DELETE /api/entries/:id error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete entry' });
  }
});

// GET /api/stats - Computed statistics
app.get('/api/stats', async (_req, res) => {
  try {
    const allResult = await pool.query('SELECT * FROM entries');
    const rows = allResult.rows;

    if (rows.length === 0) {
      return res.json({
        success: true,
        data: {
          totalCount: 0,
          avgSalary: 0,
          medianSalary: 0,
          avgTotalSpending: 0,
          avgSavingsRate: 0,
          avgSpending: Object.fromEntries(SPENDING_FIELDS.map(f => [f, 0])),
          byJob: {},
          byExperience: {},
          salaryDistribution: SALARY_BUCKETS.map(b => ({ range: String(b), count: 0 })),
        },
      });
    }

    const totalCount = rows.length;

    // Average salary
    const avgSalary = Math.round(rows.reduce((sum, r) => sum + r.salary, 0) / totalCount);

    // Median salary
    const sortedSalaries = rows.map(r => r.salary).sort((a, b) => a - b);
    const mid = Math.floor(totalCount / 2);
    const medianSalary = totalCount % 2 === 0
      ? Math.round((sortedSalaries[mid - 1] + sortedSalaries[mid]) / 2)
      : sortedSalaries[mid];

    // Average total spending (food+housing+transport+subscriptions+shopping+leisure+other, NOT savings)
    const spendingFields = ['food', 'housing', 'transport', 'subscriptions', 'shopping', 'leisure', 'other'];
    const totalSpendings = rows.map(r => spendingFields.reduce((sum, f) => sum + (r[f] || 0), 0));
    const avgTotalSpending = Math.round(totalSpendings.reduce((sum, s) => sum + s, 0) / totalCount);

    // Average savings rate: average of (savings/salary*100)
    const savingsRates = rows.map(r => r.salary > 0 ? (r.savings || 0) / r.salary * 100 : 0);
    const avgSavingsRate = Math.round(savingsRates.reduce((sum, s) => sum + s, 0) / totalCount);

    // Average spending per category (including savings)
    const avgSpending = {};
    for (const field of SPENDING_FIELDS) {
      const total = rows.reduce((sum, r) => sum + (r[field] || 0), 0);
      avgSpending[field] = Math.round(total / totalCount);
    }

    // Average salary by job
    const byJob = {};
    const jobGroups = {};
    for (const r of rows) {
      if (!jobGroups[r.job]) jobGroups[r.job] = [];
      jobGroups[r.job].push(r.salary);
    }
    for (const [job, salaries] of Object.entries(jobGroups)) {
      byJob[job] = Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length);
    }

    // Average salary by experience
    const byExperience = {};
    const expGroups = {};
    for (const r of rows) {
      if (!expGroups[r.experience]) expGroups[r.experience] = [];
      expGroups[r.experience].push(r.salary);
    }
    for (const [exp, salaries] of Object.entries(expGroups)) {
      byExperience[exp] = Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length);
    }

    // Salary distribution
    const salaryDistribution = SALARY_BUCKETS.map(bucket => {
      const isLast = bucket === 800;
      const count = isLast
        ? rows.filter(r => r.salary >= 800).length
        : rows.filter(r => r.salary >= bucket && r.salary < bucket + 50).length;
      return { range: String(bucket), count };
    });

    res.json({
      success: true,
      data: {
        totalCount,
        avgSalary,
        medianSalary,
        avgTotalSpending,
        avgSavingsRate,
        avgSpending,
        byJob,
        byExperience,
        salaryDistribution,
      },
    });
  } catch (err) {
    console.error('GET /api/stats error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to compute statistics' });
  }
});

// GET /api/stats/percentile - Percentile rank for a given salary
app.get('/api/stats/percentile', async (req, res) => {
  try {
    const salary = parseInt(req.query.salary, 10);
    if (isNaN(salary) || salary <= 0) {
      return res.status(400).json({ success: false, message: 'salary query parameter is required and must be > 0' });
    }

    const totalResult = await pool.query('SELECT COUNT(*) AS total FROM entries');
    const total = parseInt(totalResult.rows[0].total, 10);

    if (total === 0) {
      return res.json({ success: true, data: { percentile: 0 } });
    }

    const belowResult = await pool.query('SELECT COUNT(*) AS below FROM entries WHERE salary < $1', [salary]);
    const below = parseInt(belowResult.rows[0].below, 10);

    const percentile = Math.round((1 - below / total) * 100);

    res.json({ success: true, data: { percentile } });
  } catch (err) {
    console.error('GET /api/stats/percentile error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to compute percentile' });
  }
});

// --- SPA fallback ---
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Start server / Export for Vercel ---
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
