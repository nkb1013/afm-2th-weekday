# my-crud 프로젝트 대화 기록

냉장고 재료와 레시피를 저장/관리하는 CRUD 앱을 만드는 과정의 대화 기록입니다.

---

## 1. 프론트엔드(index.html) 생성

**사용자:**
> week-4/quest/my-crud 여기에 냉장고 재료와 레시피를 저장/관리하는 앱을 만들거야
>
> @single-react-dev
>
> 1. 냉장고에 있는 재료를 등록/삭제할 수 있게 해줘
> 2. 레시피를 직접 작성하고 저장할 수 있게 해줘(요리명, 재료, 조리법)
> 3. 저장된 재료와 레시피를 목록으로 조회할 수 있게 해줘
>
> 재료를 태그처럼 추가/삭제할 수 있게 해줘야해

**Claude:**
single-react-dev 에이전트를 사용하여 `week-4/quest/my-crud/index.html`에 단일 파일 React 앱을 생성했습니다.

### 주요 기능
- `/#/fridge` - 냉장고 재료를 태그(칩) 형태로 추가/삭제
- `/#/recipes` - 저장된 레시피 목록 조회 및 삭제
- `/#/recipes/new` - 새 레시피 작성 (요리명, 재료 태그, 조리법)

### 특징
- 재료가 컬러풀한 둥근 태그로 표시되며 X 버튼으로 삭제 가능
- 레시피 작성 시 냉장고에 있는 재료를 바로 추가할 수 있는 단축 버튼 제공
- 모든 데이터가 localStorage에 저장되어 새로고침해도 유지
- 따뜻한 주방 테마 색상의 반응형 UI

### 실행 방법
```bash
npx serve week-4/quest/my-crud
```

---

## 2. 백엔드(server.js) CRUD API 생성

**사용자:**
> week-4/quest/my-crud 이번엔 재료 테이블과 레시피 테이블을 저장/관리할 수 있는 CRUD api를 만들어줘
>
> @single-server-specialist

**Claude:**
single-server-specialist 에이전트를 사용하여 Express.js CRUD API 서버를 생성했습니다.

### 생성된 파일
- `server.js` - Express.js CRUD API 서버
- `package.json` - 의존성 및 스크립트 설정

### API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/ingredients` | 모든 재료 조회 |
| `POST` | `/api/ingredients` | 재료 추가 |
| `DELETE` | `/api/ingredients/:id` | 재료 삭제 |
| `GET` | `/api/recipes` | 모든 레시피 조회 |
| `GET` | `/api/recipes/:id` | 특정 레시피 조회 |
| `POST` | `/api/recipes` | 레시피 추가 |
| `PUT` | `/api/recipes/:id` | 레시피 수정 |
| `DELETE` | `/api/recipes/:id` | 레시피 삭제 |

### 초기 샘플 데이터 (인메모리)
- 재료: 토마토, 양파, 마늘
- 레시피: 토마토 파스타, 마늘볶음밥

### 실행 방법
```bash
cd week-4/quest/my-crud
npm install
npm start
```

---

## 3. 서버 실행

**사용자:**
> 서버 실행해줘

**Claude:**
npm install 후 `node server.js`를 백그라운드로 실행하고, `http://localhost:3000/api/ingredients`로 API 동작을 확인했습니다.

---

## 4. PostgreSQL(Supabase) 연결

**사용자:**
> week-4/quest/my-crud 모든 데이터는 아래에 저장해줘
> db url: postgresql://postgres.omkuaglgzbbjiigxppml:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres

**Claude:**
server.js를 인메모리 → PostgreSQL로 전환했습니다.

- `pg` 패키지 설치
- `Pool`을 사용한 PostgreSQL 연결 설정
- `initDB()` 함수에서 `CREATE TABLE IF NOT EXISTS`로 테이블 자동 생성
- 모든 API 핸들러를 `async/await` + `pool.query()`로 변경

**실행 결과:** 비밀번호 인증 실패 (PASSWORD 플레이스홀더)

---

## 5. DB 비밀번호 입력

**사용자:**
> EQRsyNNjz7UFlDQz

**Claude:**
connection string에 실제 비밀번호를 반영하고 서버를 재시작했습니다.

```
Server running on http://localhost:3000
Database tables ready
{"success":true,"data":[]}
```

---

## 6. 테이블 컬럼 추가 (category, steps)

**사용자:**
> ingredients 테이블에 category도 추가해줘 recipe 테이블에는 steps도 추가해줘

**Claude:**

### ingredients 테이블
- `category VARCHAR(100)` 컬럼 추가 (선택적)
- POST/GET API 응답에 `category` 포함

### recipes 테이블
- `steps TEXT[]` 컬럼 추가 (조리 단계 배열)
- POST/PUT 요청에서 `steps` 배열 받기
- GET 응답에 `steps` 포함

기존 테이블에 대해 `ALTER TABLE ADD COLUMN IF NOT EXISTS`로 안전하게 마이그레이션.

---

## 7. my-fridge 재료 데이터 시드

**사용자:**
> week-4/quest/my-fridge/my-crud 여기 데이터에 @../my-fridge/ingredients/ 안에 있는 재료들 들어가있어야하는데

**Claude:**
`my-fridge/ingredients/` 디렉토리의 13개 JSON 파일을 모두 읽어서 DB에 시드했습니다.

### 읽어온 재료 (13개)

| 이름 | 수량 | 카테고리 |
|------|------|----------|
| 참치캔 | 2개 | 상온 |
| 계란 | 6개 | 냉장 |
| 냉동 닭가슴살 | 2팩 | 냉동 |
| 냉동만두 | 1봉 | 냉동 |
| 냉동밥 | 3개 | 냉동 |
| 파 | 2대 | 냉장 |
| 즉석카레 | 1개 | 상온 |
| 김치 | 1통 | 냉장 |
| 우유 | 1팩 | 냉장 |
| 양파 | 2개 | 냉장 |
| 라면 | 3봉 | 상온 |
| 슬라이스 치즈 | 5장 | 냉장 |
| 두부 | 1모 | 냉장 |

### 변경 사항
- `ingredients` 테이블에 `quantity VARCHAR(100)` 컬럼 추가
- `SEED_INGREDIENTS` 배열을 server.js에 추가
- `initDB()`에서 테이블이 비어있을 때 자동 시드
- POST/GET API에 `quantity` 필드 포함

---

## 8. 프론트엔드 API 연결

**사용자:**
> 추가된 재료들 안보여. week-4/quest/my-fridge/my-crud/index.html 여기에 연결해줘.

**Claude:**
index.html의 DataProvider를 localStorage → API 호출로 전면 변경했습니다.

### 변경 사항

**DataProvider (localStorage → API)**
- `GET /api/ingredients`, `GET /api/recipes`로 데이터 fetch
- `POST`, `DELETE`로 서버와 동기화
- 로딩/에러 상태 처리 추가

**재료 관리 페이지 (FridgePage)**
- 기존: 이름만 입력하는 단순 TagInput
- 변경: 이름 + 수량 + 카테고리(냉장/냉동/상온) 입력 폼
- 카테고리별 그룹핑 (냉장: 시안, 냉동: 블루, 상온: 앰버 컬러)
- 각 칩에 `이름 + 수량` 표시, id 기반 삭제

**레시피 목록 (RecipeListPage)**
- `recipe.name` → `recipe.title` 사용
- `steps` 배열을 번호 리스트로 표시
- 삭제 시 API 호출

**새 레시피 (NewRecipePage)**
- `title` 필드 사용
- `steps` 입력 추가 (한 줄에 한 단계)
- 냉장고 재료 객체에서 이름 추출하여 빠른 추가

### 결과
`http://localhost:3000` 에서 13개 재료가 카테고리별로 그룹화되어 표시됨.
