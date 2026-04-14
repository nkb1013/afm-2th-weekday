# my-recipes-app 프로젝트 대화 기록

냉장고 재료 기반 AI 레시피 자동 생성 앱을 만드는 과정의 대화 기록입니다.

---

## 1. AI 레시피 생성 앱 초기 구축

**사용자:**
> week-4/quest/my-fridge/recipes-app 이 폴더에 이제 저장된 재료를 기반으로 AI가 레시피를 자동 생성해주는 기능을 추가해줘.
>
> AI가 생성한 레시피를 DB에 저장해줘야해.
>
> 그리고, 저장된 레시피를 목록으로 조회할 수 있게 해줘.
>
> open AI key :
> YOUR_OPENAI_API_KEY

**Claude:**
기존 my-crud 서버를 기반으로 두 가지 작업을 진행했습니다.

### server.js 수정
- 포트를 3001로 변경 (my-crud가 3000번 사용 중)
- `OPENAI_API_KEY` 상수 추가
- `POST /api/generate-recipe` 엔드포인트 추가:
  1. DB에서 현재 재료 조회
  2. OpenAI API (gpt-4o-mini) 호출하여 레시피 생성
  3. JSON 파싱 (마크다운 코드블록 처리 포함)
  4. DB에 자동 저장 후 반환

### OpenAI 프롬프트 설계
```
너는 한국 가정식 전문 요리사야. 사용자가 제공하는 냉장고 재료로 만들 수 있는
현실적이고 맛있는 레시피를 하나 만들어줘.
반드시 아래 JSON 형식으로만 응답해.
{
  "title": "요리 이름",
  "ingredients": ["사용할 재료1", "사용할 재료2"],
  "instructions": "전체 조리법을 자연스러운 문장으로",
  "steps": ["단계1", "단계2", "단계3"]
}
```

### index.html 생성 (single-react-dev 에이전트)
- `/#/` - AI 레시피 생성 페이지
  - 냉장고 재료를 카테고리별(냉장/냉동/상온)로 표시
  - "AI 레시피 생성하기" 버튼
  - 로딩 애니메이션 (쿠킹 이모지 플로팅 + 바운싱 닷)
  - 생성된 레시피 카드 (제목, 재료 태그, 조리 순서, 요리 팁)
- `/#/recipes` - 저장된 레시피 목록
  - 카드 형태로 레시피 표시
  - 삭제 버튼 + 확인 모달

### 서버 실행 & 테스트
```
Server running on http://localhost:3001
Database tables ready
```

첫 번째 AI 생성 테스트 결과:
```json
{
  "title": "참치 계란 볶음밥",
  "ingredients": ["참치캔", "계란", "양파", "파", "냉동밥", "김치"],
  ...
}
```

---

## 2. 재료 관리 페이지 추가

**사용자:**
> 기존에 있던 재료관리 페이지도 함께 있어야하는데. 그래야 재료를 저장하고 그 db를 기반으로 레시피를 생성하지.

**Claude:**
index.html에 재료 관리(FridgePage)를 추가했습니다.

### Header 네비게이션 업데이트
- "재료 관리" 탭 추가 (`/#/fridge`)
- 기존: 레시피 생성 | 저장된 레시피
- 변경: **재료 관리** | 레시피 생성 | 저장된 레시피

### FridgePage 구현
- 재료 추가 폼: 이름 + 수량 + 카테고리(냉장/냉동/상온) 선택
- 보유 재료 표시: 카테고리별 그룹핑
  - 냉장: 시안/블루 톤 + ❄️ 아이콘
  - 냉동: 인디고 톤 + 🧊 아이콘
  - 상온: 앰버 톤 + 🌾 아이콘
- 각 재료 칩에 이름 + 수량 표시, X 버튼으로 삭제
- "이 재료로 AI 레시피 만들기" 버튼으로 생성 페이지 이동

### 라우트 추가
```jsx
<Route path="/fridge" element={<FridgePage />} />
```

### GeneratePage 개선
- 재료가 없을 때 "재료 추가하러 가기" 버튼으로 재료 관리 페이지 안내

### 전체 흐름
1. **재료 관리** 페이지에서 재료를 등록/삭제 → DB에 저장
2. **레시피 생성** 페이지에서 DB에 저장된 재료 확인 → AI가 레시피 생성 → DB에 자동 저장
3. **저장된 레시피** 페이지에서 모든 레시피 조회/삭제

---

## 3. 스타일 선택 + 조리시간/난이도 + 저장/재생성 기능

**사용자:**
> - 레시피 생성 전에 "간단 요리", "다이어트", "야식" 같은 옵션을 선택할 수 있게 기능을 추가해줘.
> - 나중에 필터링하기 좋게, 생성된 레시피에 예상 조리시간, 난이도를 함께 저장해줘.
> - AI가 만든 레시피가 마음에 들면 저장, 아니면 다시 생성할 수 있는, 사용자가 선택할 수 있게 기능을 추가해줘.

**Claude:**

### 서버 변경

#### DB 스키마 확장
```sql
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cooking_time VARCHAR(50);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS style VARCHAR(50);
```

#### generate-recipe 엔드포인트 변경
- **변경 전:** AI 생성 → 즉시 DB 저장 → 저장된 레시피 반환
- **변경 후:** AI 생성 → DB 저장하지 않고 프리뷰로 반환 (사용자가 저장 결정)

- `style` 파라미터를 request body에서 받아서 AI 프롬프트에 반영
- AI 응답 JSON에 `cookingTime`, `difficulty` 필드 추가 요청

#### 수정된 OpenAI 프롬프트
```
{
  "title": "요리 이름",
  "ingredients": ["사용할 재료1", "사용할 재료2"],
  "instructions": "전체 조리법을 자연스러운 문장으로",
  "steps": ["단계1", "단계2", "단계3"],
  "cookingTime": "예상 조리시간 (예: 15분, 30분, 1시간)",
  "difficulty": "난이도 (하, 중, 상 중 하나)"
}
```

사용자가 스타일을 선택하면 프롬프트에 추가:
```
요리 스타일: "야식" 컨셉에 맞는 요리를 만들어줘.
```

#### POST /api/recipes 확장
- `cookingTime`, `difficulty`, `style` 필드 처리 추가

#### 모든 recipe SELECT 쿼리 업데이트
```sql
SELECT id, title, ingredients, instructions, steps,
  cooking_time AS "cookingTime", difficulty, style,
  created_at AS "createdAt", updated_at AS "updatedAt"
FROM recipes
```

### 프론트엔드 변경

#### 스타일 선택 옵션 (6가지)

| 옵션 | 아이콘 | 설명 |
|------|--------|------|
| 간단 요리 | ⚡ | 10~15분 빠른 요리 |
| 다이어트 | 🥗 | 저칼로리 건강식 |
| 야식 | 🌙 | 늦은 밤 간식 |
| 든든한 한끼 | 🍚 | 배부른 메인 요리 |
| 도시락 | 🍱 | 싸기 좋은 메뉴 |
| 안주 | 🍺 | 술과 어울리는 요리 |

- 카드 형태로 표시, 클릭하여 선택/해제
- 선택하지 않으면 자유롭게 추천

#### 미리보기 → 저장/재생성 흐름
- **변경 전:** AI 생성 → 자동 저장 → "저장 완료!" 배지
- **변경 후:**
  1. AI 생성 → "미리보기" 배지로 표시 (DB 미저장)
  2. 사용자 선택:
     - 💾 **이 레시피 저장하기** → `POST /api/recipes`로 DB 저장 → "저장 완료!" 배지
     - 🔄 **다시 생성하기** → 같은 스타일로 새 레시피 재생성
  3. 저장 후:
     - ✨ **다른 레시피 생성하기**
     - 📋 **저장된 레시피 보기**

#### 조리시간 + 난이도 표시
- 미리보기 카드 헤더: ⏱️ 조리시간, 📊 난이도 배지
- 저장된 레시피 목록 카드:
  - ⏱️ 조리시간 (파란색 배지)
  - 📊 난이도 (하: 초록, 중: 노랑, 상: 빨강 배지)
  - 스타일 (보라색 배지)

---

## 4. 커밋 + 보안 처리

**사용자:**
> commit 해줘

**Claude:**
server.js에 DB 비밀번호와 OpenAI API 키가 하드코딩되어 있어 민감 정보 노출 경고를 했습니다.

**사용자:**
> .env로 분리하고 .gitignore에 추가해줘

**Claude:**

### 루트 .gitignore 생성
```
node_modules/
.env
.DS_Store
*.db-shm
*.db-wal
.vercel/
```

### .env 파일 생성
**02. my-crud/.env**
```
DATABASE_URL=postgresql://...
```

**03. my-recipes-app/.env**
```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-proj-...
```

### server.js 수정 (두 프로젝트 모두)
```javascript
// 변경 전
const OPENAI_API_KEY = 'sk-proj-...';
const pool = new Pool({
  connectionString: 'postgresql://...:PASSWORD@...',
});

// 변경 후
require('dotenv').config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

### package.json에 dotenv 의존성 추가
```json
"dotenv": "^16.4.7"
```

### .env.example 파일 생성 (구조 안내용)
```
DATABASE_URL=postgresql://user:password@host:port/database
OPENAI_API_KEY=sk-proj-your-api-key-here
```

### 커밋
```
Add week-4 fridge app: ingredients CRUD, AI recipe generator with PostgreSQL

- Add my-fridge ingredient JSON data (13 items with name/quantity/category)
- Add my-crud: ingredient & recipe CRUD API with PostgreSQL (Supabase)
- Add my-recipes-app: AI-powered recipe generator using OpenAI
  - Style selection (간단요리/다이어트/야식/든든한한끼/도시락/안주)
  - Auto-generated cooking time & difficulty
  - Preview before save workflow (save or regenerate)
- Move secrets to .env files, add .gitignore for security
- Include my-data todo apps (file/JSON/SQLite/PostgreSQL)
```

---

## 최종 프로젝트 구조

```
03. my-recipes-app/
├── .env                 # 환경변수 (DATABASE_URL, OPENAI_API_KEY)
├── .env.example         # 환경변수 템플릿
├── index.html           # React SPA (CDN 기반)
│   ├── /#/fridge        # 재료 관리 (추가/삭제/카테고리별 표시)
│   ├── /#/              # AI 레시피 생성 (스타일 선택 → 미리보기 → 저장)
│   └── /#/recipes       # 저장된 레시피 목록 (조리시간/난이도/스타일 배지)
├── package.json         # express, cors, pg, dotenv
└── server.js            # Express API 서버
    ├── GET  /api/ingredients       # 재료 조회
    ├── POST /api/ingredients       # 재료 추가
    ├── DELETE /api/ingredients/:id  # 재료 삭제
    ├── GET  /api/recipes           # 레시피 조회
    ├── POST /api/recipes           # 레시피 저장
    ├── DELETE /api/recipes/:id     # 레시피 삭제
    └── POST /api/generate-recipe   # AI 레시피 생성 (미리보기)
```

## 실행 방법

```bash
cd "week-4/quest/03. my-recipes-app"
npm install
npm start
# http://localhost:3001
```
