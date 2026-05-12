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
    // guide_copy 컬럼 추가 (기존 테이블 대응)
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE rooms ADD COLUMN guide_copy TEXT DEFAULT '';
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$
    `);
    // steps 컬럼 추가 (기존 테이블 대응)
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE rooms ADD COLUMN steps JSONB DEFAULT '[]';
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
        steps JSONB DEFAULT '[]',
        guide_copy TEXT DEFAULT '',
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

    // Upsert rooms with latest data
    const seedRooms = [
      [101,'1F','감정 층','작아지는 마음의 방','SNS나 타인의 성취를 본 뒤, 나를 비교하고 초라하게 느낄 때','{"emotions":["anxious","shrunk"]}','[{"name":"화면 내려놓기","guide":"화면을 내려놓고, 눈을 감아보세요. 지금 내 안에서 어떤 감각이 느껴지나요."},{"name":"그 느낌 바라보기","guide":"작아지는 느낌이 어디에서 오는지, 판단하지 말고 그냥 바라봐보세요."},{"name":"한 문장 노팅","guide":"지금 떠오르는 것을 한 문장으로 적어보세요. 바꾸려 하지 않아도 괜찮아요."}]','작아지는 마음의 결로 안내드릴게요'],
      [102,'1F','감정 층','발바닥으로 돌아오는 방','걱정이 커져서 몸이 붕 뜨고, 지금 여기에 있지 않은 느낌이 들 때','{"emotions":["anxious","tense"]}','[{"name":"발바닥 착지","guide":"두 발이 바닥에 닿아 있는 걸 느껴보세요. 발바닥의 감각에 집중합니다."},{"name":"세 번 내쉬기","guide":"코로 4초 들이쉬고, 잠깐 멈추고, 입으로 6초 내쉬세요. 세 번."},{"name":"한 문장 노팅","guide":"지금 떠오르는 것을 한 문장으로 적어보세요."}]','발바닥으로 돌아오는 결로 안내드릴게요'],
      [103,'1F','감정 층','힘이 들어간 곳의 방','화가 나거나 억울해서 턱, 어깨, 주먹 등에 힘이 들어갈 때','{"emotions":["irritated","tense"]}','[{"name":"힘이 간 곳 찾기","guide":"몸 어딘가에 힘이 들어가 있어요. 턱, 주먹, 어깨. 지금 그곳을 찾아보세요."},{"name":"쥐었다 펴기","guide":"두 손을 꽉 쥐고 5초. 그리고 천천히 펴보세요."},{"name":"한 문장 노팅","guide":"지금 떠오르는 것을 한 문장으로 적어보세요."}]','힘이 들어간 곳의 결로 안내드릴게요'],
      [104,'1F','감정 층','가라앉은 날의 방','특별한 이유 없이 기운이 없고, 마음이 아래로 가라앉을 때','{"emotions":["lethargic","lonely"]}','[{"name":"무거움 인정하기","guide":"오늘은 가라앉는 날이구나, 하고 한 번 인정해보세요."},{"name":"배 위에 손 올리기","guide":"편하게 누워서 배 위에 손을 올려보세요. 올라오고, 내려가고."},{"name":"한 문장 노팅","guide":"지금 떠오르는 것을 한 문장으로 적어보세요."}]','가라앉은 날의 결로 안내드릴게요'],
      [105,'1F','감정 층','혼자인 것 같은 방','사람들 사이에 있어도 나만 동떨어진 것처럼 느껴질 때','{"emotions":["lonely","shrunk"]}','[{"name":"그 감각 찾기","guide":"혼자인 느낌이 몸 어디에 있는지 찾아보세요."},{"name":"나에게 말 건네기","guide":"조용히 괜찮아를 세 번 속으로 말해보세요."},{"name":"한 문장 노팅","guide":"지금 떠오르는 것을 한 문장으로 적어보세요."}]','혼자인 것 같은 결로 안내드릴게요'],
      [106,'1F','감정 층','자꾸 떠오르는 사람의 방','누군가의 말, 표정, 행동이 계속 생각나고 마음에 걸릴 때','{"emotions":["lonely","irritated"]}','[{"name":"질문 방향 바꾸기","guide":"그 사람은 왜 대신, 나는 어떤 마음으로 보고 있을까."},{"name":"내 상태 알아차리기","guide":"인정받고 싶은 건지, 서운한 건지, 그리운 건지."},{"name":"한 문장 노팅","guide":"지금 떠오르는 것을 한 문장으로. 상대가 아닌 나에 대해."}]','자꾸 떠오르는 사람의 결로 안내드릴게요'],
      [107,'1F','감정 층','내려놓는 연습의 방','내가 바꿀 수 없는 일인데도 계속 붙잡고 신경 쓰일 때','{"emotions":["anxious","confused"]}','[{"name":"구분하기","guide":"지금 이 상황은, 내가 통제할 수 있는가?"},{"name":"인정하고 놓기","guide":"이건 내가 바꿀 수 없구나. 한 번 인정하고 내려놓기."},{"name":"한 문장 노팅","guide":"다음 스텝을 하나 선택해보세요. 그리고 적어보세요."}]','내려놓는 연습의 결로 안내드릴게요'],
      [108,'1F','감정 층','굳어진 몸의 방','긴장해서 몸이 뻣뻣하고, 어깨·목·가슴에 힘이 들어갈 때','{"emotions":["tense","shrunk"]}','[{"name":"몸 훑어보기","guide":"머리부터 발끝까지 천천히 훑어보세요. 어디에 힘이 들어가 있나요?"},{"name":"어깨 내려놓기","guide":"어깨를 귀까지 올려 3초 유지, 툭 내려놓기. 세 번."},{"name":"한 문장 노팅","guide":"지금 떠오르는 것을 한 문장으로 적어보세요."}]','굳어진 몸의 결로 안내드릴게요'],
      [201,'2F','공간 층','흔들리는 칸의 방','지하철이나 대중교통 안에서 잠깐 마음을 가라앉히고 싶을 때','{"places":["moving"]}','[{"name":"이어폰 빼기","guide":"지금 들리는 소리를 그냥 들어보세요. 그대로 두는 것."},{"name":"손가락 세기","guide":"손가락을 하나씩 천천히 접으며 다섯까지. 딱 그것만."},{"name":"한 문장 노팅","guide":"지금 떠오르는 것을 한 문장으로 적어보세요."}]','흔들리는 칸의 결로 안내드릴게요'],
      [202,'2F','공간 층','한 모금의 방','카페나 조용한 자리에서 감각을 천천히 되찾고 싶을 때','{"places":["cafe"]}','[{"name":"온기 느끼기","guide":"따뜻한 컵을 두 손으로 감싸보세요. 손바닥의 온기에 집중."},{"name":"한 모금 맛보기","guide":"한 모금 머금어보세요. 온도, 맛, 향. 조금 더 천천히."},{"name":"한 문장 노팅","guide":"지금 떠오르는 것을 한 문장으로 적어보세요."}]','한 모금의 결로 안내드릴게요'],
      [203,'2F','공간 층','숨이 좁아지는 자리의 방','사무실이나 책상 앞에서 답답하고 숨이 막히는 느낌이 들 때','{"places":["office"]}','[{"name":"눈 굴리기","guide":"눈을 감고 눈동자를 천천히 위아래로. 그게 시작이에요."},{"name":"세 번 깊은 숨","guide":"코로 4초, 멈추고, 입으로 6초. 세 번."},{"name":"한 문장 노팅","guide":"지금 떠오르는 것을 한 문장으로 적어보세요."}]','숨이 좁아지는 자리의 결로 안내드릴게요'],
      [204,'2F','공간 층','멈춰 서는 길의 방','걷는 중에 생각이 많아져서 잠시 감각으로 돌아오고 싶을 때','{"places":["outside"]}','[{"name":"발바닥 느끼기","guide":"발바닥에 전해지는 감각. 딱딱한지, 부드러운지. 지금 여기에 착지."},{"name":"하늘 올려다보기","guide":"잠깐 멈춰서 하늘을 올려다보세요. 구름의 모양, 움직임."},{"name":"한 문장 노팅","guide":"지금 떠오르는 것을 한 문장으로 적어보세요."}]','멈춰 서는 길의 결로 안내드릴게요'],
      [205,'2F','공간 층','이불 속의 방','침대나 이불 속에서 나오기 싫고 몸이 무겁게 느껴질 때','{"places":["home"]}','[{"name":"이불 감촉 느끼기","guide":"이불이 피부에 닿는 감촉. 부드러운지, 따뜻한지."},{"name":"배 위에 손","guide":"배 위에 손을 올리고, 올라오고 내려가는 걸 느끼기."},{"name":"한 문장 노팅","guide":"지금 떠오르는 것을 한 문장으로. 나오기 싫어도 괜찮아요."}]','이불 속의 결로 안내드릴게요'],
      [206,'2F','공간 층','첫 한입의 방','밥을 먹고 있지만 맛을 잘 못 느끼거나 무심하게 먹고 있을 때','{"places":["home","cafe"]}','[{"name":"첫 한 입 느끼기","guide":"다음 한 입을 천천히. 씹는 소리, 식감, 온도."},{"name":"향 알아차리기","guide":"접시 위 음식의 향을 한 번 맡아보세요."},{"name":"한 문장 노팅","guide":"오늘 식사에서 가장 기억나는 감각을 한 문장으로."}]','첫 한입의 결로 안내드릴게요'],
      [207,'2F','공간 층','나를 마주보는 방','거울 속 내 모습이 낯설거나, 자꾸 평가하게 될 때','{"places":["home"]}','[{"name":"판단 멈추기","guide":"좋다 나쁘다 없이 그냥 바라봐보세요. 3초간."},{"name":"한 단어로 표현하기","guide":"지금 어떤 마음으로 나를 보고 있을까? 단어 하나만."},{"name":"한 문장 노팅","guide":"그 단어를 포함해서 한 문장을 적어보세요."}]','나를 마주보는 결로 안내드릴게요'],
      [301,'3F','시간 층','잠들지 못한 새벽의 방','새벽에 깨어 있고, 생각이 많아 다시 잠들기 어려울 때','{"times":[1,3]}','[{"name":"생각 흘려보내기","guide":"머릿속 생각을 구름이라고 상상해보세요. 지나가는 걸 지켜봐보세요."},{"name":"호흡 세기","guide":"들숨과 날숨을 하나씩 세기. 열까지 세면 다시 처음부터."},{"name":"한 문장 노팅","guide":"지금 떠오르는 것을 한 문장으로. 잠이 안 와도 괜찮아요."}]','잠들지 못한 새벽의 결로 안내드릴게요'],
      [302,'3F','시간 층','발이 무거운 아침의 방','출근길이나 하루 시작 전, 몸과 마음이 무겁게 느껴질 때','{"times":[1]}','[{"name":"한 발씩 착지","guide":"발바닥이 땅에 닿는 감각. 한 발, 한 발. 지금 여기에 착지."},{"name":"세 가지 소리","guide":"이어폰을 빼고, 들리는 소리를 세 가지만."},{"name":"한 문장 노팅","guide":"지금 떠오르는 것을 한 문장으로 적어보세요."}]','발이 무거운 아침의 결로 안내드릴게요'],
      [303,'3F','시간 층','멈추지 않는 머릿속의 방','잠들기 전인데 머릿속 생각이 계속 이어질 때','{"times":[3,5]}','[{"name":"감사 하나","guide":"오늘 감사한 것 하나만. 작은 것 하나면 충분합니다."},{"name":"몸 이완하기","guide":"발끝부터 머리까지 힘을 빼보세요. 이불의 감촉, 베개의 온도."},{"name":"한 문장 노팅","guide":"오늘 하루를 한 문장으로 마무리해보세요."}]','멈추지 않는 머릿속의 결로 안내드릴게요'],
      [304,'3F','시간 층','오늘을 내려놓는 방','퇴근길이나 하루 끝에, 아직 긴장과 생각이 남아 있을 때','{"times":[1,3]}','[{"name":"좋았던 감각 하나","guide":"아주 작아도 괜찮아요. 오늘 좋았던 감각 하나."},{"name":"바람 느끼기","guide":"얼굴에 닿는 바람. 방향, 온도. 알아차려보는 것."},{"name":"한 문장 노팅","guide":"지금 떠오르는 것을 한 문장으로 적어보세요."}]','오늘을 내려놓는 결로 안내드릴게요'],
      [305,'3F','시간 층','아무것도 안 해도 되는 방','계획 없는 시간이 어색하고, 쉬어도 되는지 잘 모르겠을 때','{"times":[3,5]}','[{"name":"아무것도 안 하기","guide":"1분간 아무것도 하지 않아보세요. 그냥 있어보세요."},{"name":"감각 하나 찾기","guide":"가장 먼저 느껴지는 감각 하나. 소리, 빛, 온도, 촉감."},{"name":"한 문장 노팅","guide":"지금 떠오르는 것을 한 문장으로 적어보세요."}]','아무것도 안 해도 되는 결로 안내드릴게요'],
      [306,'3F','시간 층','나른해지는 오후의 방','점심 후 몸이 처지고, 집중력과 에너지가 떨어질 때','{"times":[1]}','[{"name":"초록색 세 가지","guide":"초록색을 세 가지 찾아보세요. 찾는 동안 잠시 고요해져요."},{"name":"어깨 내려놓기","guide":"어깨가 올라가 있다면 살짝 내려놓아보세요."},{"name":"한 문장 노팅","guide":"지금 떠오르는 것을 한 문장으로 적어보세요."}]','나른해지는 오후의 결로 안내드릴게요'],
      [307,'3F','시간 층','다시 시작되는 방','월요일 아침이나 새로운 시작 앞에서 부담이 올라올 때','{"times":[1,3]}','[{"name":"세 번 깊은 숨","guide":"코로 4초, 멈추고, 입으로 6초. 한 주 시작 전에, 잠시."},{"name":"내 상태 한 단어","guide":"지금 마음 상태를 단어 하나로. 바꾸려 하지 않아도 괜찮아요."},{"name":"한 문장 노팅","guide":"그 단어를 포함해서 한 문장을. 알아차리는 것이 시작이에요."}]','다시 시작되는 결로 안내드릴게요'],
    ];
    for (const r of seedRooms) {
      await client.query(
        `INSERT INTO rooms (id,floor,theme,title,description,conditions,steps,guide_copy) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO UPDATE SET floor=$2, theme=$3, title=$4, description=$5, conditions=$6, steps=$7, guide_copy=$8, updated_at=NOW()`,
        r
      );
    }
    console.log('Rooms synced.');

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
// Public API — 방 데이터 (앱에서 사용)
// ========================================

app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await pool.query('SELECT * FROM rooms WHERE is_active = true ORDER BY id');
    res.json({ success: true, data: rooms.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/methods', async (req, res) => {
  try {
    const methods = await pool.query('SELECT * FROM noting_methods WHERE is_active = true ORDER BY id');
    res.json({ success: true, data: methods.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
    const { title, description, floor, theme, conditions, steps, guide_copy, is_active } = req.body;
    const result = await pool.query(
      `UPDATE rooms SET title=$1, description=$2, floor=$3, theme=$4, conditions=$5, steps=$6, guide_copy=$7, is_active=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [title, description, floor, theme, JSON.stringify(conditions), JSON.stringify(steps || []), guide_copy || '', is_active, req.params.id]
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
    const { id, title, description, floor, theme, conditions, steps, guide_copy } = req.body;
    const result = await pool.query(
      'INSERT INTO rooms (id,floor,theme,title,description,conditions,steps,guide_copy) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [id, floor, theme, title, description, JSON.stringify(conditions || {}), JSON.stringify(steps || []), guide_copy || '']
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
