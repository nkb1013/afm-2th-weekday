# Money Tracker (가계부) 앱 - 대화 기록

## 1단계: 기본 가계부 앱 생성

**사용자 요청:**
> week-5/quest/03.money-tracker-app - 사용자가 수입/지출 내역(날짜, 금액, 카테고리, 메모)을 등록할 수 있는 가계부 앱을 만들어줘.
> 1. 등록된 내역을 목록으로 조회할 수 있게 해줘
> 2. 카테고리별 합계를 보여줘(식비, 교통, 주거, 구독료, 경조사 등)

**Claude 작업 내용:**
- `index.html` 단일 파일로 React + Tailwind CSS CDN 기반 앱 생성
- **대시보드**: 총 수입, 총 지출, 잔액을 한눈에 보여주는 다크 그라데이션 헤더
- **입력 폼**: 수입/지출 토글, 날짜, 금액, 카테고리(이모지 포함), 메모 입력
- **카테고리별 합계**: 프로그레스 바로 지출/수입 비중 시각화, 지출/수입 탭 전환
- **내역 목록**: 날짜별 그룹핑, 전체/수입/지출 필터, 2단계 삭제 확인
- **데이터 저장**: localStorage 사용
- 카테고리: 식비, 교통, 주거, 구독료, 경조사, 기타지출 / 급여, 기타수입

---

## 2단계: 다중 통화 지원 + 실시간 환율 변환

**사용자 요청:**
> 수입이랑 지출 적을 때, 통화단위(달러, 엔화) 고를 수 있게 해주고, 외화를 적을 때는 옆에 실시간 환율 기반 원화로 얼마인지 자동으로 환산 표시해줘

**Claude 작업 내용:**
- **지원 통화 추가**: KRW, USD(달러), JPY(엔화), EUR(유로), GBP(파운드), CNY(위안)
- **실시간 환율 API**: `open.er-api.com` API로 환율 조회 (1시간 캐시)
- **환율 변환 표시**: 외화 입력 시 `💱 $100.00 = ₩138,000` 형태로 원화 환산 + 현재 환율 표시
- **환율 새로고침**: ⟳ 버튼으로 수동 갱신 가능
- **내역 목록**: 외화 항목은 원래 통화 금액 + 원화 환산 금액 함께 표시
- **대시보드/합계**: 모든 금액은 원화(KRW) 기준으로 통합 합산
- `useExchangeRates` 커스텀 훅으로 환율 로직 분리

---

## 3단계: 서버 + PostgreSQL DB 연결

**사용자 요청:**
> 여기에 실제 서버 만들고 DB 연결해줘
> db url: postgresql://postgres.omkuaglgzbbjiigxppml:EQRsyNNjz7UFlDQz@aws-1-us-east-1.pooler.supabase.com:5432/postgres
> table prefix: money_app_01

**Claude 작업 내용:**

### 생성된 파일
- **`server.js`** — Express.js 서버
  - PostgreSQL 연결 (pg 라이브러리, SSL 지원)
  - 서버 시작 시 `money_app_01_entries` 테이블 자동 생성
  - API 엔드포인트:
    - `GET /api/entries` — 전체 내역 조회 (날짜 DESC)
    - `POST /api/entries` — 새 내역 등록
    - `DELETE /api/entries/:id` — 내역 삭제
  - 정적 파일 서빙 (index.html)
  - Vercel 배포 호환 (`module.exports = app`)

- **`package.json`** — express, pg 의존성

- **`vercel.json`** — Vercel 배포 설정 (API 리라이트)

### 수정된 파일
- **`index.html`** — 데이터 저장 방식 변경
  - localStorage → API 호출 (`fetch`)로 전환
  - `fetchEntries()`, `createEntry()`, `deleteEntry()` 함수 추가
  - `mapEntry()` — DB의 snake_case → 프론트엔드 camelCase 변환
  - 로딩 상태 추가
  - 기존 UI/기능(통화 선택, 환율 변환 등) 모두 유지

### DB 테이블 구조 (`money_app_01_entries`)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL PRIMARY KEY | 자동 증가 ID |
| type | VARCHAR(10) | income / expense |
| date | DATE | 날짜 |
| amount | NUMERIC | 원화 환산 금액 |
| original_amount | NUMERIC | 원래 통화 금액 |
| currency | VARCHAR(5) | 통화 코드 (KRW, USD 등) |
| category | VARCHAR(50) | 카테고리 ID |
| memo | TEXT | 메모 |
| created_at | TIMESTAMP | 생성 시각 |

---

## 4단계: 서버 실행

**사용자 요청:**
> 안열려. 너가 실행해줘

**Claude 작업 내용:**
- `npm install` 실행 → 의존성 설치 완료
- `node server.js` 백그라운드 실행
- `curl http://localhost:3000/api/entries` 로 서버 정상 동작 확인
- http://localhost:3000 에서 앱 접속 가능

---

## 실행 방법

```bash
cd week-5/quest/03.money-tracker-app
npm install
npm start
```
→ http://localhost:3000

## 기술 스택
- **프론트엔드**: React 18 (CDN) + Tailwind CSS (CDN) + Babel (CDN)
- **백엔드**: Express.js + Node.js
- **데이터베이스**: PostgreSQL (Supabase)
- **환율 API**: open.er-api.com
- **배포**: Vercel 지원 (vercel.json 포함)
