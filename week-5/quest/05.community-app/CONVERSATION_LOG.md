# 자취요리 토론장 커뮤니티 앱 - 대화 로그

## 1단계: 프론트엔드 생성 (single-react-dev 에이전트)

**요청:**
> week-5/quest/05.community-app 로그인한 사용자만 글을 쓸 수 있고, 자기 글만 수정/삭제할 수 있는 커뮤니티 앱을 만들어줘.
>
> 로그인한 사용자가 게시글을 작성/조회/수정/삭제할 수 있게 해줘야해.
> - 작성: 로그인한 사람만 글쓰기 가능 (제목 + 내용)
> - 조회: 모든 게시글은 로그인한 누구나 볼 수 있음 (작성자 이름 표시)
> - 수정/삭제: 자기가 쓴 글만 수정/삭제 가능

**결과:**
- `index.html` 생성 (CDN React 18 + Tailwind CSS 단일 파일)
- 사용자 이름만 입력하는 간단한 로그인
- localStorage 기반 게시글 CRUD
- 카드 형태 게시글 목록, 수정 모달, 삭제 확인 모달
- 게시글 수/작성자 아바타/작성일 표시

---

## 2단계: 서버 생성 & DB 연결

**요청:**
> 여기에 실제 서버 만들고 DB 연결해줘
>
> db url: postgresql://postgres.omkuaglgzbbjiigxppml:EQRsyNNjz7UFlDQz@aws-1-us-east-1.pooler.supabase.com:5432/postgres
>
> table prefix: community_app_01

**결과:**

### 생성된 파일
- `server.js` — Express 5 + PostgreSQL CRUD API
- `package.json` — express, pg 의존성
- `vercel.json` — Vercel 배포 설정

### DB 테이블
- `community_app_01_posts` — id, title, content, author, created_at, updated_at

### API 엔드포인트 (초기)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/posts` | 전체 게시글 조회 (최신순) |
| POST | `/api/posts` | 게시글 작성 |
| PUT | `/api/posts/:id` | 게시글 수정 (본인만) |
| DELETE | `/api/posts/:id` | 게시글 삭제 (본인만) |

### 프론트엔드 수정
- `usePosts` 훅: localStorage → `fetch('/api/posts')` 서버 API로 변경
- 모든 API 호출에 `Content-Type: application/json` 헤더
- 로딩 상태 추가 ("불러오는 중...")
- DB 컬럼명에 맞게 `createdAt` → `created_at`, `updatedAt` → `updated_at` 변경

### 테스트 결과
```
POST /api/posts → 201 { success: true, data: { id: 1, title: "테스트 글", author: "홍길동" } }
GET /api/posts → 200 { success: true, data: [...] }
PUT /api/posts/1 → 200 { success: true, data: { title: "수정된 글", updated_at: "..." } }
PUT /api/posts/1 (다른 사람) → 403 "You can only edit your own posts"
DELETE /api/posts/1 → 200 { success: true, message: "Post deleted" }
```

---

## 3단계: JWT 인증 구현

**요청:**
> 로그인 & 회원가입 JWT 방식으로 구현해줘
> 이메일, 비밀번호 사용하는 방식으로 구현해줘

**결과:**

### 패키지 추가
- `bcryptjs` — 비밀번호 해싱
- `jsonwebtoken` — JWT 토큰 생성/검증

### DB 테이블 추가
- `community_app_01_users` — id, email, password(bcrypt), nickname, created_at
- `community_app_01_posts`에 `author_id` 컬럼 추가 (기존 테이블 ALTER)

### 서버 변경
- `authMiddleware` 추가 — JWT 토큰 검증, `req.user = { id, email, nickname }`
- 모든 게시글 API에 `authMiddleware` 적용
- 수정/삭제 시 `author_id`로 본인 확인 (클라이언트가 author를 보내지 않아도 됨)
- 글 작성 시 `req.user.id`와 `req.user.nickname`을 자동 저장

### 인증 API
| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/auth/register` | 회원가입 (bcrypt 해싱, JWT 발급) |
| POST | `/api/auth/login` | 로그인 (JWT 토큰 발급, 7일 만료) |
| GET | `/api/auth/me` | 토큰 검증 (자동 로그인용) |

### 프론트엔드 변경
- **AuthContext**: JWT 기반으로 전환
  - `login(email, password)` / `register(email, password, nickname)` — async
  - 토큰을 `localStorage('community_token')`에 저장
  - 앱 시작 시 `/api/auth/me`로 자동 로그인
- **LoginScreen**: 이메일+비밀번호 입력, 로그인/회원가입 탭 전환
- **getAuthHeaders()**: 모든 API 호출에 `Authorization: Bearer {token}` 헤더
- **usePosts**: author 파라미터 제거 (서버에서 JWT로 식별)
- **PostCard**: `user.username` → `user.nickname`, 소유권 체크 `user.id === post.author_id`

### 테스트 결과
```
회원가입 → 201 { token: "eyJ...", user: { id: 1, nickname: "테스터" } }
로그인 → 200 { token: "eyJ...", user: { id: 1, nickname: "테스터" } }
토큰으로 글 작성 → 201 { title: "JWT 인증 테스트", author: "테스터", author_id: 1 }
인증 없이 조회 → 401 "로그인이 필요합니다."
```

---

## 4단계: 목록/상세 뷰 분리

**요청:**
> 전체 게시글을 최신순으로 보여주는 목록 화면을 만들어줘
> - 제목, 작성자, 작성 시간 표시
> - 클릭하면 상세 내용 보기

**결과:**

### 프론트엔드 변경
- **PostCard** 제거 → **PostListItem** + **PostDetail** 2개 컴포넌트로 분리
- **PostListItem**: 테이블 행 형태 (제목 / 작성자 / 작성일), 클릭 시 상세 보기
- **PostDetail**: 전체 본문 표시, 작성자 아바타/닉네임/시간, 본인 글일 때 수정/삭제 버튼
- **BoardPage**: `selectedPost` 상태 추가, 목록↔상세 뷰 전환
  - 상세 보기 중 삭제하면 자동으로 목록 복귀
  - 수정 후 posts 배열에서 최신 데이터 반영
- 테이블 헤더 (제목 / 작성자 / 작성일) 추가
- "목록으로" 뒤로가기 버튼

---

## 5단계: 이름 변경 & 댓글 기능

**요청:**
> 이 게시판을 자취요리 토론장으로 이름 바꿔주고, 댓글 기능도 추가해줘

**결과:**

### 이름 변경
- 페이지 제목: `커뮤니티 게시판` → `자취요리 토론장`
- 헤더 제목: `게시판` → `자취요리 토론장`
- 로그인 화면 제목도 변경
- 헤더/로그인 아이콘: SVG → 🍳 이모지, 색상 indigo → orange

### DB 테이블 추가
- `community_app_01_comments` — id, post_id, content, author_id, author, created_at
  - `ON DELETE CASCADE` — 게시글 삭제 시 댓글도 자동 삭제

### 댓글 API
| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/api/posts/:postId/comments` | O | 댓글 조회 (오래된 순) |
| POST | `/api/posts/:postId/comments` | O | 댓글 작성 |
| DELETE | `/api/comments/:id` | O | 댓글 삭제 (본인만) |

### 프론트엔드 추가
- **useComments(postId)** 훅: 댓글 CRUD (fetch/add/delete)
- **CommentSection** 컴포넌트:
  - 댓글 입력폼 (텍스트 + 등록 버튼)
  - 댓글 목록 (작성자 아바타, 닉네임, 시간, 내용)
  - 본인 댓글에만 "삭제" 버튼
  - 댓글 수 표시
  - 빈 상태 메시지
- **PostDetail** 하단에 `<CommentSection postId={post.id} />` 추가

### 테스트 결과
```
댓글 작성 → 201 { content: "맛있어 보여요!", author: "테스터" }
댓글 조회 → 200 { data: [{ content: "맛있어 보여요!", ... }] }
```

---

## 6단계: Vercel 배포

**요청:**
> Vercel에 배포

**결과:**
- vercel-deploy-optimizer 에이전트로 배포
- 환경변수 설정: `DATABASE_URL`, `JWT_SECRET`
- **Production URL: https://05community-app.vercel.app**
- 검증: 메인 페이지 200 OK, API 401 정상 (인증 미들웨어 작동)

---

## 7단계: E2E 테스트 & 스크린샷

**요청:**
> week-5/quest/05.community-app 주요기능을 테스트해줘
> 그리고 각 기능들이 잘 작동하는지 스크린샷으로 남겨줘

**결과:**
- Puppeteer 기반 자동화 테스트 스크립트 (`test-screenshots.js`) 작성
- 17개 주요 기능 테스트 전체 통과
- `screenshots/` 폴더에 PNG 파일 저장

### 테스트 항목 & 결과
| # | 기능 | 결과 |
|---|------|------|
| 01 | 로그인 화면 | 정상 - 이메일/비밀번호 폼, 로그인/회원가입 탭 |
| 02-03 | 회원가입 | 정상 - 닉네임+이메일+비밀번호 입력 |
| 04 | 회원가입 후 자동 로그인 | 정상 - 게시판 진입 |
| 05-07 | 글쓰기 | 정상 - 제목+내용 입력 후 등록 |
| 08 | 게시글 목록 | 정상 - 제목, 작성자, 작성일 표시 |
| 09 | 상세 보기 | 정상 - 클릭 시 본문 + 댓글 섹션 표시 |
| 10-11 | 댓글 작성 | 정상 - 댓글 입력/등록, 삭제 버튼 표시 |
| 12-13 | 글 수정 | 정상 - 모달에서 제목 수정, (수정됨) 표시 |
| 14-15 | 글 삭제 | 정상 - 확인 모달 후 삭제, 목록 복귀 |
| 16 | 로그아웃 | 정상 - 로그인 화면으로 이동 |
| 17 | 재로그인 | 정상 - 기존 데이터 유지 확인 |

---

## 최종 파일 구조
```
week-5/quest/05.community-app/
├── index.html              # React 프론트엔드 (CDN 기반 단일 파일)
├── server.js               # Express 5 + PostgreSQL + JWT 백엔드
├── package.json            # Node.js 의존성
├── package-lock.json
├── vercel.json             # Vercel 배포 설정
├── .env.local              # 로컬 환경변수
├── .env.example            # 환경변수 예시
├── test-screenshots.js     # Puppeteer E2E 테스트
├── CONVERSATION_LOG.md     # 이 파일
└── screenshots/            # 테스트 스크린샷 (17개)
    ├── 01_login_screen.png
    ├── 02_register_tab.png
    ├── ...
    └── 17_relogin.png
```

## 최종 API 명세
| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/api/auth/register` | X | 회원가입 |
| POST | `/api/auth/login` | X | 로그인 |
| GET | `/api/auth/me` | O | 토큰 검증 |
| GET | `/api/posts` | O | 게시글 목록 (최신순) |
| POST | `/api/posts` | O | 게시글 작성 |
| PUT | `/api/posts/:id` | O | 게시글 수정 (본인만) |
| DELETE | `/api/posts/:id` | O | 게시글 삭제 (본인만) |
| GET | `/api/posts/:postId/comments` | O | 댓글 조회 |
| POST | `/api/posts/:postId/comments` | O | 댓글 작성 |
| DELETE | `/api/comments/:id` | O | 댓글 삭제 (본인만) |

## 기술 스택
- **Frontend**: React 18 (CDN) + Tailwind CSS + Babel Standalone
- **Backend**: Express 5 + Node.js
- **Database**: PostgreSQL (Supabase)
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Deploy**: Vercel (서버리스)
- **Test**: Puppeteer (E2E 스크린샷)

## 실행 방법
```bash
cd week-5/quest/05.community-app
npm install
DATABASE_URL="postgresql://..." npm start
```

## 배포 URL
- **https://05community-app.vercel.app**
