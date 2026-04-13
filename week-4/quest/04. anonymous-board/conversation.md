# 익명 고민&칭찬 게시판 - 대화 기록

## 1단계: 프론트엔드 만들기

### 사용자 요청
> week-4/quest/04. anonymous-board 여기에 익명 고민&칭찬 게시판 앱을 만들어줘.
> 1. 사용자가 익명으로 글을 작성할 수 있게 해주고 고민, 칭찬, 응원 등 카테고리를 선택하는 기능을 추가해줘
> 2. 다른 사람이 글에 공감 버튼을 누를 수 있게 해줘 (공감 수 +1 업데이트)
> 3. 게시판은 최신순 / 공감순으로 정렬해서 보여줘

### Claude 작업 내용
single-react-dev 에이전트를 사용해서 `index.html` 단일 파일로 앱을 만들었습니다.

**주요 기능:**
- 익명 글 작성 - 고민(😔), 칭찬(🥰), 응원(💪) 카테고리 선택 후 글 작성 (300자 제한)
- 공감 버튼 - 하트 아이콘 클릭 시 공감 수 +1, 바운스 애니메이션 + 플로팅 하트 효과
- 정렬 - 최신순 / 공감순 토글 전환
- localStorage로 데이터 저장 (새로고침해도 유지)
- 샘플 게시글 5개 포함

**기술 스택:**
- React 18 (CDN)
- Tailwind CSS (CDN)
- Babel Standalone (JSX 변환)

**디자인:**
- 따뜻한 파스텔 그라데이션 배경 (orange → pink → purple)
- 프로스티드 글래스 효과 헤더
- 모바일 반응형 (max-w-2xl)

---

## 2단계: 백엔드 API 서버 만들기

### 사용자 요청
> 작성한 게시글을 CRUD 해주고 공감 버튼 클릭될 때마다 업데이트도 가능한 api를 만들어줘
> db url: postgresql://postgres.omkuaglgzbbjiigxppml:EQRsyNNjz7UFlDQz@aws-1-us-east-1.pooler.supabase.com:6543/postgres

### Claude 작업 내용
single-server-specialist 에이전트로 `server.js`와 `package.json`을 생성하고, 프론트엔드를 API 연동으로 업데이트했습니다.

**생성된 파일:**
- `server.js` - Express.js API 서버
- `package.json` - 의존성 (express, pg, cors)
- `vercel.json` - Vercel 배포 설정

**DB 테이블 (posts):**
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL PRIMARY KEY | 게시글 ID |
| category | VARCHAR(20) NOT NULL | worry, praise, cheer |
| content | TEXT NOT NULL | 게시글 내용 |
| empathy | INTEGER DEFAULT 0 | 공감 수 |
| created_at | TIMESTAMP DEFAULT NOW() | 작성 시간 |

**API 엔드포인트:**
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/posts` | 전체 게시글 조회 (최신순) |
| POST | `/api/posts` | 새 게시글 작성 `{ category, content }` |
| PUT | `/api/posts/:id` | 게시글 수정 `{ category, content }` |
| DELETE | `/api/posts/:id` | 게시글 삭제 |
| PATCH | `/api/posts/:id/empathy` | 공감 수 +1 |

**프론트엔드 변경사항:**
- localStorage 제거 → API fetch로 전환
- `createdAt` → `created_at` (DB 컬럼명에 맞춤)
- 낙관적 업데이트(optimistic update) 적용 (공감 버튼)
- 로딩 상태 UI 추가

---

## 3단계: 공감 NaN 버그 수정

### 사용자 피드백
> 공감 누르면 공감 NaN 으로 떠

### 원인
PostgreSQL에서 반환되는 `empathy` 값이 문자열(`"0"`)로 오는 경우가 있어서 `"0" + 1 = "01"` → NaN 체인이 발생했습니다.

### 1차 시도
`handleEmpathy`에서 `Number(p.empathy) + 1`로 수정하고, PATCH 응답으로 서버 값을 동기화하도록 변경했습니다.

### 사용자 피드백
> 음 여전히 공감버튼에 '공감 NaN' 이라고 떠

### 2차 수정 (해결)
API 응답을 받는 시점에서 모든 post 데이터의 empathy를 숫자로 변환하는 `normalizePost` 함수를 추가했습니다.

```javascript
function normalizePost(post) {
  return { ...post, empathy: Number(post.empathy) || 0 };
}
```

`api()` 헬퍼 함수에서 응답 데이터가 배열이면 모든 항목에, 단일 객체면 해당 객체에 `normalizePost`를 적용하도록 수정하여 근본적으로 해결했습니다.

---

## 최종 파일 구조

```
week-4/quest/04. anonymous-board/
├── index.html      # 프론트엔드 (React + Tailwind CDN)
├── server.js       # Express.js API 서버
├── package.json    # npm 의존성
├── vercel.json     # Vercel 배포 설정
└── conversation.md # 이 대화 기록
```

## 실행 방법

```bash
cd "week-4/quest/04. anonymous-board"
npm install
npm start
# http://localhost:3000 접속
```
