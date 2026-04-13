# 익명 연봉/지출 비교 앱 - 대화 기록

## 1단계: 프론트엔드 만들기

### 사용자 요청
> week-4/quest/06. salary-compare 익명 연봉/지출 비교 앱을 만들어줘
> 1. 사용자가 익명으로 월급, 월 지출, 직군/연차 등을 입력할 수 있게 해줘
> 2. 제출하면 전체 평균, 분포, 내 위치 (상위 몇 %)를 보여줘
> 3. 카테고리별 평균 지출(식비, 주거, 교통, 구독료 등)도 비교할 수 있게 해줘

### Claude 작업 내용
single-react-dev 에이전트를 사용해서 `index.html` 단일 파일로 앱을 생성했습니다.

**입력 폼:**
- 월급 (만원 단위)
- 직군 선택: 개발/IT, 디자인, 마케팅, 경영/사무, 금융, 교육, 의료, 서비스업, 기타
- 연차 선택: 신입(1년 미만), 1-3년, 3-5년, 5-10년, 10년 이상
- 카테고리별 월 지출 8항목: 식비, 주거비, 교통비, 구독료, 쇼핑/의류, 여가/문화, 저축/투자, 기타

**대시보드 (제출 후):**
- 원형 SVG 게이지로 "상위 X%" 표시
- 연봉 분포 바 차트 (내 위치 하이라이트)
- 5개 통계 카드: 총 참여자, 평균 월급, 중위 월급, 평균 지출, 평균 저축률
- 개인 통계: 총 지출, 저축률, 월급 대비 지출 비율
- 카테고리별 지출 비교 (나 vs 평균, 초록=덜 씀, 빨강=더 씀)
- 직군별/연차별 평균 월급 차트

**기술 스택:**
- React 18 (CDN), Tailwind CSS (CDN), Babel Standalone
- 샘플 데이터 45건 포함 (직군/연차별 현실적 범위)
- localStorage 기반 데이터 저장

---

## 2단계: 백엔드 API 서버 만들기

### 사용자 요청
> 이제 데이터를 등록하고 통계/비교가 가능한 API를 만들어줘
> db url: postgresql://postgres.omkuaglgzbbjiigxppml:EQRsyNNjz7UFlDQz@aws-1-us-east-1.pooler.supabase.com:6543/postgres

### Claude 작업 내용
single-server-specialist 에이전트로 `server.js`, `package.json`, `vercel.json`을 생성하고, 프론트엔드를 API 연동으로 업데이트했습니다.

**생성된 파일:**
- `server.js` - Express.js API 서버
- `package.json` - 의존성 (express, pg, cors)
- `vercel.json` - Vercel 배포 설정

**DB 테이블 (entries):**
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL PRIMARY KEY | 데이터 ID |
| salary | INTEGER NOT NULL | 월급 (만원) |
| job | VARCHAR(20) NOT NULL | 직군 |
| experience | VARCHAR(20) NOT NULL | 연차 |
| food | INTEGER DEFAULT 0 | 식비 |
| housing | INTEGER DEFAULT 0 | 주거비 |
| transport | INTEGER DEFAULT 0 | 교통비 |
| subscriptions | INTEGER DEFAULT 0 | 구독료 |
| shopping | INTEGER DEFAULT 0 | 쇼핑/의류 |
| leisure | INTEGER DEFAULT 0 | 여가/문화 |
| savings | INTEGER DEFAULT 0 | 저축/투자 |
| other | INTEGER DEFAULT 0 | 기타 |
| created_at | TIMESTAMP DEFAULT NOW() | 생성 시간 |

**API 엔드포인트:**
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/entries` | 전체 데이터 조회 (최신순) |
| POST | `/api/entries` | 새 데이터 등록 |
| PUT | `/api/entries/:id` | 데이터 수정 |
| DELETE | `/api/entries/:id` | 데이터 삭제 |
| GET | `/api/stats` | 전체 통계 (아래 상세) |
| GET | `/api/stats/percentile?salary=300` | 내 연봉 상위 몇 % |

**GET /api/stats 응답 상세:**
```json
{
  "totalCount": 46,
  "avgSalary": 385,
  "medianSalary": 350,
  "avgTotalSpending": 198,
  "avgSavingsRate": 15,
  "avgSpending": { "food": 52, "housing": 61, ... },
  "byJob": { "개발/IT": 420, "디자인": 310, ... },
  "byExperience": { "신입(1년 미만)": 250, "1-3년": 300, ... },
  "salaryDistribution": [{ "range": "200", "count": 3 }, ...]
}
```

**서버 특징:**
- Lazy DB init: 첫 API 호출 시 테이블 자동 생성
- 통계는 JS에서 계산 (median, distribution buckets, savings rate 등)
- avgTotalSpending은 savings 제외한 지출만 합산
- Dual-mode: `node server.js` 로컬 + `module.exports = app` Vercel 서버리스

**프론트엔드 변경사항:**
- 샘플 데이터 생성 코드 + localStorage 데이터 관리 → 전체 삭제
- API helper 함수 추가 (`api()`)
- Dashboard: 클라이언트 통계 계산 → `/api/stats` + `/api/stats/percentile` API 호출로 전환
- `SalaryDistribution` → `SalaryDistributionFromStats` (API 분포 데이터 사용)
- 제출 시 POST, 재제출 시 PUT (myEntry.id 기반)
- 내 entry ID만 localStorage에 유지 (재방문 시 대시보드 바로 표시)
- 불필요한 유틸 함수 제거 (`median`, `percentileRank`)
- 필드명 매핑: `medSalary` → `medianSalary`, `avgTotalSpend` → `avgTotalSpending`, `byExp` → `byExperience`

### API 테스트 결과
```
POST /api/entries (개발/IT, 350만원) → id: 1 생성
POST /api/entries (금융, 500만원) → id: 2 생성
GET /api/stats → count: 2, avgSalary: 425, median: 425
GET /api/stats/percentile?salary=350 → percentile: 100 (상위 100% = 최하위)
```

---

## 최종 파일 구조

```
week-4/quest/06. salary-compare/
├── index.html      # 프론트엔드 (React + Tailwind CDN)
├── server.js       # Express.js API 서버
├── package.json    # npm 의존성
├── vercel.json     # Vercel 배포 설정
└── conversation.md # 이 대화 기록
```

## 실행 방법

```bash
cd "week-4/quest/06. salary-compare"
npm install
npm start
# http://localhost:3000 접속
```
