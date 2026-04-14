const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: 'postgresql://postgres.omkuaglgzbbjiigxppml:EQRsyNNjz7UFlDQz@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  // 1. Create users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todo_app_01_users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      nickname VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // 2. Add user_id column to todos table (if not exists)
  await pool.query(`
    ALTER TABLE todo_app_01
    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES todo_app_01_users(id)
  `);

  // 3. Clear existing demo data
  await pool.query(`DELETE FROM todo_app_01`);
  await pool.query(`DELETE FROM todo_app_01_users`);

  // 4. Insert 2 demo users (password: 1234)
  const hash = await bcrypt.hash('1234', 10);

  const user1 = await pool.query(
    `INSERT INTO todo_app_01_users (email, password_hash, nickname) VALUES ($1, $2, $3) RETURNING id`,
    ['alice@test.com', hash, '앨리스']
  );

  const user2 = await pool.query(
    `INSERT INTO todo_app_01_users (email, password_hash, nickname) VALUES ($1, $2, $3) RETURNING id`,
    ['bob@test.com', hash, '밥']
  );

  const aliceId = user1.rows[0].id;
  const bobId = user2.rows[0].id;

  // 5. Insert demo todos
  const todos = [
    { user_id: aliceId, text: '리액트 공부하기', done: false },
    { user_id: aliceId, text: '장보기 - 우유, 계란, 빵', done: true },
    { user_id: aliceId, text: '프로젝트 발표 준비', done: false },
    { user_id: bobId, text: '운동 30분 하기', done: true },
    { user_id: bobId, text: 'Node.js 서버 배포', done: false },
    { user_id: bobId, text: '이메일 답장하기', done: false },
  ];

  for (const t of todos) {
    await pool.query(
      `INSERT INTO todo_app_01 (user_id, text, done) VALUES ($1, $2, $3)`,
      [t.user_id, t.text, t.done]
    );
  }

  console.log('Seed complete!');
  console.log(`  alice@test.com (pw: 1234) → ${aliceId}`);
  console.log(`  bob@test.com   (pw: 1234) → ${bobId}`);

  await pool.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
