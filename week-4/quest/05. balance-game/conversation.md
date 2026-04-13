# 밸런스 게임 - 대화 기록

## 1단계: 프론트엔드 만들기

### 사용자 요청
> week-4/quest/05. balance-game 여기에 실시간 밸런스 게임 앱을 만들어줘
> 1. 밸런스 게임 질문을 등록할 수 있게 해줘 (예: 월급 500 + 주7일 출근 vs 월급 300 + 주4일 출근)
> 2. 사용자가 둘 중 하나에 투표하면 실시간으로 퍼센티지가 변할 수 있게 해줘
> 3. 투표 결과와 총 참여자 수가 보여져야해

### Claude 작업 내용
single-react-dev 에이전트를 사용해서 `index.html` 단일 파일로 앱을 생성했습니다.

**주요 기능:**
- 질문 등록 모달 - 제목 + 선택지 A(파란팀) / B(빨간팀) 입력
- 투표 - 카드 클릭으로 투표, 투표 후 퍼센티지 바 애니메이션으로 표시
- 투표 후 결과 표시 - 각 선택지 퍼센티지, 표 수, 총 참여자 수
- 투표 전에는 퍼센티지 숨김, 투표 후 공개
- 중복 투표 방지 (localStorage로 추적)
- "MY" 뱃지 - 내가 선택한 항목 표시
- "HOT" 뱃지 - 20표 이상 질문에 자동 표시
- 정렬 - 최신순 / 인기순
- 샘플 질문 5개 포함

**기술 스택:**
- React 18 (CDN)
- Tailwind CSS (CDN)
- Babel Standalone (JSX 변환)

**디자인:**
- 다크 테마 (gray-950 배경)
- 인디고(A팀) vs 로즈(B팀) 대비 컬러
- VS 뱃지 애니메이션, 호버 효과, 쉬머 퍼센티지 바
- 모바일 반응형

---

## 2단계: 백엔드 API 서버 만들기

### 사용자 요청
> 질문/투표 CRUD해주고 투표율 계산해주는 API를 만들어줘
> db url: postgresql://postgres.omkuaglgzbbjiigxppml:EQRsyNNjz7UFlDQz@aws-1-us-east-1.pooler.supabase.com:6543/postgres

### Claude 작업 내용
single-server-specialist 에이전트로 `server.js`, `package.json`, `vercel.json`을 생성하고, 프론트엔드를 API 연동으로 업데이트했습니다.

**생성된 파일:**
- `server.js` - Express.js API 서버
- `package.json` - 의존성 (express, pg, cors)
- `vercel.json` - Vercel 배포 설정

**DB 테이블 (questions):**
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL PRIMARY KEY | 질문 ID |
| title | VARCHAR(100) NOT NULL | 질문 제목 |
| option_a | VARCHAR(60) NOT NULL | 선택지 A |
| option_b | VARCHAR(60) NOT NULL | 선택지 B |
| votes_a | INTEGER DEFAULT 0 | A 투표 수 |
| votes_b | INTEGER DEFAULT 0 | B 투표 수 |
| created_at | TIMESTAMP DEFAULT NOW() | 생성 시간 |

**API 엔드포인트:**
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/questions` | 전체 질문 조회 (투표율 계산 포함, 최신순) |
| POST | `/api/questions` | 새 질문 등록 `{ title, option_a, option_b }` |
| PUT | `/api/questions/:id` | 질문 수정 `{ title, option_a, option_b }` |
| DELETE | `/api/questions/:id` | 질문 삭제 |
| PATCH | `/api/questions/:id/vote` | 투표 `{ option: "A" or "B" }` |

**서버 특징:**
- Lazy DB init: 첫 API 호출 시 테이블 자동 생성 (cold-start 안전)
- `withComputed` 헬퍼: `total_votes`, `percent_a`, `percent_b` 계산 (DB에 저장하지 않고 응답 시 계산)
- Dual-mode: `node server.js` 로컬 실행 + `module.exports = app` Vercel 서버리스 배포

**프론트엔드 변경사항:**
- localStorage 기반 데이터 관리 → API fetch 연동으로 전환
- DB 필드명에 맞춰 전체 수정: `optionA` → `option_a`, `votesA` → `votes_a`, `createdAt` → `created_at`
- `normalize()` 함수: DB에서 받은 votes 값을 항상 Number로 변환 (NaN 방지)
- 투표 시 낙관적 업데이트(optimistic update) 적용 + 서버 응답으로 동기화
- 투표 기록만 localStorage에 유지 (중복 투표 방지용)
- 로딩 상태 UI 추가

### API 테스트 결과
```
POST /api/questions → 질문 생성 성공 (id: 1)
PATCH /api/questions/1/vote {option: "A"} → votes_a: 1, percent_a: 100%
PATCH /api/questions/1/vote {option: "B"} → votes_a: 1, votes_b: 1, percent_a: 50%, percent_b: 50%
GET /api/questions → 전체 조회 + 투표율 계산 정상
DELETE /api/questions/1 → 삭제 정상
```

---

## 최종 파일 구조

```
week-4/quest/05. balance-game/
├── index.html      # 프론트엔드 (React + Tailwind CDN)
├── server.js       # Express.js API 서버
├── package.json    # npm 의존성
├── vercel.json     # Vercel 배포 설정
└── conversation.md # 이 대화 기록
```

## 실행 방법

```bash
cd "week-4/quest/05. balance-game"
npm install
npm start
# http://localhost:3000 접속
```
