// ========================================
// noting heal - Backend Server
// ========================================

const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = (process.env.JWT_SECRET || 'noting-heal-secret-key-2024').trim();

// ========================================
// Database Connection
// ========================================

const pool = new Pool({
  connectionString: (process.env.DATABASE_URL || '').trim(),
  ssl: { rejectUnauthorized: false },
});

// ========================================
// Middleware
// ========================================

app.use(cors());
app.use(express.json());

// 정적 파일: prototype-v1.html이 있는 현재 디렉토리
app.use(express.static(path.join(__dirname)));

// 이미지 파일: ../image/ 폴더를 /image/ 경로로 서빙
app.use('/image', express.static(path.join(__dirname, 'image')));

// ========================================
// Database Initialization (Lazy Init)
// ========================================

let dbInitialized = false;

async function initDB() {
  if (dbInitialized) return;

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // 기존 테이블 마이그레이션
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$
    `);
    // TIMESTAMP → TIMESTAMPTZ 마이그레이션
    await client.query(`
      ALTER TABLE users ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
      ALTER TABLE rituals ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS rituals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        room_id INTEGER NOT NULL,
        emotion TEXT NOT NULL,
        place TEXT NOT NULL,
        time_minutes INTEGER NOT NULL,
        noting_method TEXT NOT NULL,
        noting_text TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY,
        floor TEXT NOT NULL,
        theme TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        conditions JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS noting_methods (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        guide TEXT NOT NULL,
        places TEXT[] DEFAULT '{}',
        emotions TEXT[] DEFAULT '{}',
        times INTEGER[] DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Seed rooms if empty
    const roomCount = await client.query('SELECT COUNT(*)::int AS c FROM rooms');
    if (roomCount.rows[0].c === 0) {
      const seedRooms = [
        [101,'1F','감정 룸','비교','SNS 보다 내가 작아질 때','{"emotions":["anxious","confused"]}'],
        [102,'1F','감정 룸','불안','모든 게 무너질 것 같은 순간','{"emotions":["anxious","tense","fear"]}'],
        [103,'1F','감정 룸','분노','참고 또 참다가 터질 때','{"emotions":["irritated","tense"]}'],
        [104,'1F','감정 룸','우울','이유 없이 가라앉는 날','{"emotions":["lethargic","lonely"]}'],
        [201,'2F','공간 룸','지하철','지하철에서 눈을 감았을 때','{"places":["moving"]}'],
        [202,'2F','공간 룸','카페','카페 한 구석에 앉았을 때','{"places":["cafe"]}'],
        [203,'2F','공간 룸','사무실','자리에서 숨이 막힐 때','{"places":["office"]}'],
        [204,'2F','공간 룸','밖','걷다가 문득 멈췄을 때','{"places":["outside"]}'],
        [205,'2F','공간 룸','침대','이불 속에서 나오기 싫을 때','{"places":["home"]}'],
        [301,'3F','시간 룸','새벽','새벽 3시, 잠이 오지 않을 때','{"times":[1,3]}'],
        [302,'3F','시간 룸','출근길','출근길, 발이 무거울 때','{"times":[1]}'],
        [303,'3F','시간 룸','잠들기 전','잠들기 전, 머릿속이 멈추지 않을 때','{"times":[3,5]}'],
        [304,'3F','시간 룸','퇴근길','퇴근길, 오늘도 끝났다 싶을 때','{"times":[1,3]}'],
        [305,'3F','시간 룸','주말 낮','아무 계획 없는 주말 오후','{"times":[3,5]}'],
      ];
      for (const r of seedRooms) {
        await client.query('INSERT INTO rooms (id,floor,theme,title,description,conditions) VALUES ($1,$2,$3,$4,$5,$6)', r);
      }

      // Seed noting methods
      const seedMethods = [
        [null,'눈 위아래로 천천히 굴리기','의자에 앉은 채로 눈을 감고, 눈동자를 천천히 위아래로 움직여보세요.','{office}','{tense,anxious}','{1}'],
        [null,'자리에서 세 번 깊은 숨 쉬기','코로 4초 들이쉬고, 잠깐 멈추고, 입으로 6초 내쉬세요. 세 번 반복합니다.','{office}','{tense}','{3,5}'],
        [null,'복식호흡 3분','편하게 누워서 배 위에 손을 올려보세요.','{home}','{lethargic}','{3,5}'],
        [null,'주위에서 빨간 물체 3개 찾아보기','지금 있는 공간에서 빨간색 물체를 세 개 찾아보세요.','{home}','{lethargic}','{1}'],
        [null,'컵을 두 손으로 감싸고 온기 느끼기','따뜻한 컵이 있다면 두 손으로 감싸보세요.','{cafe}','{calm,anxious}','{1}'],
        [null,'주변 소리 3개 세어보기','눈을 감고 지금 들리는 소리를 하나씩 세어보세요.','{cafe}','{anxious}','{3,5}'],
        [null,'하늘 올려다보고 구름 관찰하기','잠깐 멈춰서 하늘을 올려다보세요.','{outside}','{calm}','{1,3}'],
        [null,'손가락 하나씩 접으며 다섯까지 세기','한 손을 펴고 손가락을 하나씩 천천히 접으며 다섯까지 세어보세요.','{moving}','{anxious,confused}','{1}'],
        [null,'감사한 것 하나 떠올리기','지금 이 순간 감사한 것 하나만 떠올려보세요.','{home}','{joy,grateful}','{1,3}'],
        [null,'눈 감고 호흡 세기','눈을 감고 들숨과 날숨을 하나씩 세어보세요. 열까지 세면 다시 처음부터.','{home}','{confused,fear}','{3,5}'],
      ];
      for (const m of seedMethods) {
        await client.query('INSERT INTO noting_methods (room_id,name,guide,places,emotions,times) VALUES ($1,$2,$3,$4,$5,$6)', m);
      }
      console.log('Seed data inserted.');
    }

    dbInitialized = true;
    console.log('Database tables initialized.');
  } finally {
    client.release();
  }
}

// API 라우트 진입 전 DB 초기화 미들웨어
app.use('/api', async (_req, _res, next) => {
  try {
    await initDB();
    next();
  } catch (err) {
    console.error('DB init error:', err.message);
    _res.status(500).json({ success: false, message: 'Database initialization failed' });
  }
});

// ========================================
// JWT Authentication Middleware
// ========================================

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userRole = decoded.role || 'user';
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

function adminOnly(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

// ========================================
// Auth API Routes
// ========================================

// POST /api/signup - 회원가입
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 입력값 검증
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    if (password.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters' });
    }

    // 이메일 중복 확인
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    // 비밀번호 해시 및 저장
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role, created_at',
      [email, passwordHash]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: { token, user: { id: user.id, email: user.email, role: user.role } },
      message: 'Account created successfully',
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during signup' });
  }
});

// POST /api/login - 로그인
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // 사용자 조회
    const result = await pool.query('SELECT id, email, password_hash, role FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: { token, user: { id: user.id, email: user.email, role: user.role } },
      message: 'Login successful',
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// ========================================
// Ritual API Routes (인증 필요)
// ========================================

// POST /api/rituals - 리추얼 기록 저장
app.post('/api/rituals', authenticate, async (req, res) => {
  try {
    const { room_id, emotion, place, time_minutes, noting_method, noting_text } = req.body;

    // 입력값 검증
    if (!room_id || !emotion || !place || !time_minutes || !noting_method) {
      return res.status(400).json({
        success: false,
        message: 'room_id, emotion, place, time_minutes, noting_method are required',
      });
    }

    const result = await pool.query(
      `INSERT INTO rituals (user_id, room_id, emotion, place, time_minutes, noting_method, noting_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, room_id, emotion, place, time_minutes, noting_method, noting_text, created_at`,
      [req.userId, room_id, emotion, place, time_minutes, noting_method, noting_text || '']
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Ritual saved',
    });
  } catch (err) {
    console.error('Create ritual error:', err.message);
    res.status(500).json({ success: false, message: 'Server error while saving ritual' });
  }
});

// GET /api/rituals - 내 리추얼 기록 조회
app.get('/api/rituals', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, room_id, emotion, place, time_minutes, noting_method, noting_text, created_at FROM rituals WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error('Get rituals error:', err.message);
    res.status(500).json({ success: false, message: 'Server error while fetching rituals' });
  }
});

// ========================================
// Stats API Route (인증 필요)
// ========================================

// GET /api/stats - 감정 통계 + 반복 단어
app.get('/api/stats', authenticate, async (req, res) => {
  try {
    // 감정별 통계
    const emotionStats = await pool.query(
      `SELECT emotion, COUNT(*)::int AS count
       FROM rituals WHERE user_id = $1
       GROUP BY emotion ORDER BY count DESC`,
      [req.userId]
    );

    // 전체 기록 가져오기 (반복 단어 분석용)
    const allRecords = await pool.query(
      'SELECT noting_text FROM rituals WHERE user_id = $1 AND noting_text IS NOT NULL AND noting_text != \'\'',
      [req.userId]
    );

    // 반복 단어 추출 (프로토타입의 extractFrequentWords 로직 서버 구현)
    const stopWords = new Set([
      '나', '내', '는', '은', '이', '가', '을', '를', '의', '에', '에서',
      '도', '만', '좀', '와', '과', '한', '그', '것', '수', '안', '못',
      '더', '다', '로', '으로', '하고', '있는', '없는', '하는', '되는',
      '했다', '있다', '없다', '같다', '되다', '너무', '진짜', '정말',
      '되게', '약간', '그냥', '좀', '다시',
    ]);

    const wordCount = {};
    allRecords.rows.forEach((row) => {
      const words = row.noting_text
        .replace(/[.,!?~\-()'"]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 2);
      words.forEach((w) => {
        if (!stopWords.has(w)) {
          wordCount[w] = (wordCount[w] || 0) + 1;
        }
      });
    });

    const frequentWords = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word, count]) => ({ word, count }));

    // 감정 라벨 매핑
    const EMOTION_LABELS = {
      anxious: '불안', tense: '긴장', lethargic: '무기력',
      irritated: '짜증', confused: '혼란', lonely: '외로움',
      calm: '차분함', joy: '기쁨', excited: '기대',
      grateful: '감사', fear: '두려움', energetic: '활기',
    };

    const emotions = emotionStats.rows.map((row) => ({
      key: row.emotion,
      label: EMOTION_LABELS[row.emotion] || row.emotion,
      count: row.count,
    }));

    // 총 기록 수
    const totalResult = await pool.query(
      'SELECT COUNT(*)::int AS total FROM rituals WHERE user_id = $1',
      [req.userId]
    );

    res.json({
      success: true,
      data: {
        totalRituals: totalResult.rows[0].total,
        emotions,
        frequentWords,
      },
    });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).json({ success: false, message: 'Server error while fetching stats' });
  }
});

// ========================================
// Admin API Routes
// ========================================

// Admin 라우트 보호
app.use('/api/admin', authenticate, adminOnly);

// GET /api/admin/rooms - 전체 방 목록
app.get('/api/admin/rooms', async (req, res) => {
  try {
    const rooms = await pool.query('SELECT * FROM rooms ORDER BY id');
    res.json({ success: true, data: rooms.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/rooms/:id - 방 수정
app.put('/api/admin/rooms/:id', async (req, res) => {
  try {
    const { title, description, floor, theme, conditions, is_active } = req.body;
    const result = await pool.query(
      `UPDATE rooms SET title=$1, description=$2, floor=$3, theme=$4, conditions=$5, is_active=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [title, description, floor, theme, JSON.stringify(conditions), is_active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/rooms - 새 방 추가
app.post('/api/admin/rooms', async (req, res) => {
  try {
    const { id, title, description, floor, theme, conditions } = req.body;
    const result = await pool.query(
      'INSERT INTO rooms (id,floor,theme,title,description,conditions) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [id, floor, theme, title, description, JSON.stringify(conditions || {})]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/rooms/:id - 방 삭제
app.delete('/api/admin/rooms/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM rooms WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/methods - 전체 노팅 방법
app.get('/api/admin/methods', async (req, res) => {
  try {
    const methods = await pool.query('SELECT * FROM noting_methods ORDER BY id');
    res.json({ success: true, data: methods.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/methods - 새 노팅 방법 추가
app.post('/api/admin/methods', async (req, res) => {
  try {
    const { room_id, name, guide, places, emotions, times, is_active } = req.body;
    const result = await pool.query(
      'INSERT INTO noting_methods (room_id,name,guide,places,emotions,times,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [room_id || null, name, guide, places || [], emotions || [], times || [], is_active !== false]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/methods/:id - 노팅 방법 수정
app.put('/api/admin/methods/:id', async (req, res) => {
  try {
    const { room_id, name, guide, places, emotions, times, is_active } = req.body;
    const result = await pool.query(
      `UPDATE noting_methods SET room_id=$1, name=$2, guide=$3, places=$4, emotions=$5, times=$6, is_active=$7
       WHERE id=$8 RETURNING *`,
      [room_id || null, name, guide, places || [], emotions || [], times || [], is_active !== false, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Method not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/methods/:id - 노팅 방법 삭제
app.delete('/api/admin/methods/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM noting_methods WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================================
// Root Route - prototype-v1.html 서빙
// ========================================

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'prototype-v1.html'));
});

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ========================================
// Local: start server / Vercel: export app
// ========================================

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`noting heal server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
