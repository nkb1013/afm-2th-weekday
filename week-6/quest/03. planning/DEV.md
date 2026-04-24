# DEV.md - noting heal 개발 가이드

> noting heal -- 답을 주지 않고 프레임을 비춰주는 1회성 AI 셀프 리플렉션 도구
> Architecture: Next.js (App Router)

---

## Requirements

- [ ] 상황 입력 (한두 줄 텍스트) -> AI가 프레임을 비추고 열린 질문 하나를 반환
- [ ] 회원가입/로그인 없음. 완전 익명 사용
- [ ] 사용자용 히스토리 UI 없음
- [ ] 피드백 버튼 3개: "오 맞아요" / "음, 글쎄요" / "다시 써볼게요"
- [ ] 익명 데이터 수집: 상황 문장, 생성된 응답, 피드백 결과, 타임스탬프, 세션 ID
- [ ] 이메일 선택 입력 (뉴스레터/후속 발송 리스트 전용, 계정 식별자로 사용 안 함)
- [ ] 랜딩: 별도 페이지 아닌 입력창 위 tagline + 첫 화면 카피. 인스타 -> 3초 안에 입력 화면
- [ ] 반응형 웹 (모바일 퍼스트). 인스타 인앱 브라우저 호환
- [ ] OpenAI GPT-4o API 연동
- [ ] 시스템 프롬프트 반복 튜닝 구조
- [ ] Vercel 배포 + 커스텀 도메인
- [ ] MVP 완전 무료 (결제 기능 없음)

## Non-goals

- 회원가입/로그인 시스템
- 사용자별 히스토리/대시보드 UI
- 네이티브 앱 (Capacitor 등)
- 결제/구독 기능
- 이메일-응답 매칭 (이메일은 발송 리스트 전용)
- 복잡한 대화형 챗봇 (1회성 입력-응답)

## Style

- 모바일 퍼스트 반응형
- 미니멀, 차분한 톤. 명상/리플렉션 무드
- 인스타 인앱 브라우저에서 3초 안에 핵심 화면 도달
- 한국어 UI, 한국어 AI 응답
- Tailwind CSS 기반 스타일링

## Key Concepts

| 용어 | 설명 |
|------|------|
| 프레임 | 가족/직장/관계가 씌운 무의식적 사고 틀. noting heal이 비춰주는 대상 |
| 비추기 | 프레임을 이름 붙이거나 진단하지 않고, 있는 그대로 드러내는 행위 |
| 열린 질문 | 답을 유도하지 않는 질문. AI 응답의 마지막에 하나만 제공 |
| 시스템 프롬프트 | 6년차 명상 강사가 튜닝하는 AI 지시문. 이 앱의 핵심 자산 |
| 세션 ID | 브라우저 세션 기반 임시 식별자. 영구 추적 안 함 |

## Open Questions

- 시스템 프롬프트 초안을 어디까지 코드에 포함할 것인가 (하드코딩 vs DB 관리)
- "다시 써볼게요" 클릭 시 동일 상황 재제출인가, 상황 수정 후 재제출인가
- 이메일 입력 타이밍: 피드백 버튼 클릭 후인가, 별도 하단 영역인가
- 인스타 인앱 브라우저에서 OpenAI 스트리밍 응답이 정상 동작하는지 검증 필요
- 커스텀 도메인 확보 여부 (notingheal.com 등)

---

## 선택된 개발 구조

### 아키텍처 비교

| 기준 | Option 1: Single-File | Option 2: Supabase JS | Option 3: Next.js |
|------|----------------------|----------------------|-------------------|
| AI API 호출 | 프론트에서 직접 호출 시 API 키 노출 위험. single.js에서 프록시 필요 | 프론트에서 직접 호출 시 동일 문제 | API Routes에서 서버사이드 호출. 키 안전 |
| 익명 데이터 수집 | single.js에서 Supabase SDK로 저장 가능 | Supabase JS 클라이언트로 직접 저장 가능 | API Routes + Supabase Server SDK |
| 배포 | Vercel 가능하나 서버 기능 제한 | Vercel 정적 배포 가능 | Vercel 네이티브 지원. 최적화 |
| SEO/OG 태그 | 수동 설정 | 수동 설정 | SSR/메타데이터 자동 지원 |
| 학습 경험 | 이미 사용해봄 | 이미 사용해봄 | 이미 사용해봄 |

### 추천: Option 3 - Next.js (App Router)

**이유:**
1. **API 키 보안**: OpenAI API 키를 서버사이드(Route Handler)에서만 사용. 클라이언트 노출 없음
2. **Vercel 네이티브**: Next.js + Vercel 조합은 배포/도메인/환경변수 설정이 가장 간단
3. **OG 태그/SEO**: 인스타 공유 시 미리보기 카드가 자동 생성됨 (metadata API)
4. **Supabase 연동**: `@supabase/supabase-js`를 Route Handler에서 사용하여 익명 데이터 저장
5. **이미 경험 있음**: week-6에서 Next.js, Supabase, Vercel 모두 사용해본 스택

## 프로젝트 구조

```
noting-heal/
├── app/
│   ├── layout.tsx          # 루트 레이아웃, 메타데이터, 폰트
│   ├── page.tsx            # 메인 (입력 -> 응답 -> 피드백 단일 페이지)
│   ├── globals.css         # Tailwind 글로벌 스타일
│   └── api/
│       ├── reflect/
│       │   └── route.ts    # OpenAI API 호출 (상황 -> 프레임 비추기 + 열린 질문)
│       ├── feedback/
│       │   └── route.ts    # 피드백 저장 (Supabase)
│       └── subscribe/
│           └── route.ts    # 이메일 저장 (Supabase)
├── components/
│   ├── InputSection.tsx    # 상황 입력 폼
│   ├── ResponseSection.tsx # AI 응답 표시 (프레임 비추기 + 열린 질문)
│   ├── FeedbackSection.tsx # 피드백 버튼 3개
│   └── EmailCapture.tsx    # 이메일 선택 입력
├── lib/
│   ├── openai.ts           # OpenAI 클라이언트 초기화
│   ├── supabase.ts         # Supabase 클라이언트 초기화
│   └── prompts.ts          # 시스템 프롬프트 관리
├── public/
│   └── og-image.png        # OG 이미지 (인스타/카톡 공유용)
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
└── .env.local
```

---

## DB 스키마 초안 (Supabase PostgreSQL)

### sessions 테이블

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: INSERT only
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon can insert" ON sessions FOR INSERT TO anon WITH CHECK (true);
```

### reflections 테이블

```sql
CREATE TABLE reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  input_text TEXT NOT NULL,
  response_text TEXT,
  feedback TEXT CHECK (feedback IN ('agree', 'unsure', 'retry')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: INSERT only
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon can insert" ON reflections FOR INSERT TO anon WITH CHECK (true);
```

### emails 테이블 (발송 리스트 전용, reflections와 FK 관계 없음)

```sql
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: INSERT only
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon can insert" ON emails FOR INSERT TO anon WITH CHECK (true);
```

> 관리자 조회는 Supabase Dashboard 또는 service_role 키로만 수행.

---

## TODO List

### Phase 1: 디자인 & 프로토타이핑

- [ ] 🟢 UI 프로토타입 -- `prototype-v1.html` (더미 데이터, 서버 불필요)
  - 전체 플로우: tagline/카피 -> 입력창 -> 로딩 -> AI 응답 표시 -> 피드백 버튼 3개 -> 이메일 입력(선택)
  - 모바일 퍼스트 레이아웃 (375px 기준)
  - 차분한 명상/리플렉션 무드 컬러, 타이포그래피
  - 더미 AI 응답으로 전체 화면 전환 시뮬레이션
  - 인스타 인앱 브라우저 뷰포트 감안 (상단/하단 바 영역)

📌 체크포인트: 브라우저에서 prototype-v1.html을 직접 열어 모바일 뷰로 전체 플로우 확인 가능
📌 git commit

### Phase 2: 기본 기능 (쉬운 것부터)

- [ ] 🟢 Next.js 프로젝트 초기화 (`npx create-next-app@latest`, TypeScript, Tailwind CSS, App Router)
- [ ] 🟢 prototype-v1.html 디자인을 Next.js 컴포넌트로 전환
  - `app/page.tsx`: 메인 페이지 (상태 머신: idle -> loading -> response -> feedback)
  - `components/InputSection.tsx`: 상황 입력 폼
  - `components/ResponseSection.tsx`: AI 응답 표시
  - `components/FeedbackSection.tsx`: 피드백 버튼 3개
  - `components/EmailCapture.tsx`: 이메일 선택 입력
- [ ] 🟢 메타데이터 설정 (`app/layout.tsx`) -- OG 태그, 타이틀, 설명 (인스타 공유 미리보기용)
- [ ] 🟡 OpenAI API Route 구현 (`app/api/reflect/route.ts`)
  - GPT-4o 호출, 시스템 프롬프트 적용
  - 스트리밍 응답 (ReadableStream)
  - 에러 핸들링 (rate limit, timeout)
- [ ] 🟢 시스템 프롬프트 초안 작성 (`lib/prompts.ts`)
  - 프레임 비추기 + 열린 질문 생성 지시
  - 답/조언/라벨 금지 규칙
  - 한국어 응답 톤 가이드
- [ ] 🟢 프론트엔드 <-> API 연결 -- 입력 제출 -> 스트리밍 응답 표시

📌 체크포인트: 로컬에서 상황 입력 -> GPT-4o 실제 응답 -> 화면 표시까지 동작
📌 git commit
📌 동작 확인 후 다음 Phase로

### Phase 2.5: Supabase 연결 검증

- [ ] 🟡 Supabase 프로젝트 생성 및 테이블 생성 (sessions, reflections, emails)
- [ ] 🟡 RLS 정책 적용 (INSERT only for anon)
- [ ] 🟡 Supabase 클라이언트 초기화 (`lib/supabase.ts`)
- [ ] 🟡 데이터 저장 API Routes 구현
  - `app/api/feedback/route.ts`: 피드백 + 전체 reflection 데이터 저장
  - `app/api/subscribe/route.ts`: 이메일 저장
- [ ] 🟢 세션 ID 생성 로직 (crypto.randomUUID(), sessionStorage 기반)
- [ ] 🟡 프론트엔드 연결: 피드백 버튼 클릭 -> DB 저장 확인

📌 체크포인트: 입력 -> 응답 -> 피드백 클릭 -> Supabase Dashboard에서 데이터 확인 가능
📌 git commit

### Phase 3: 핵심 & 어려운 기능 (불확실한 것부터)

- [ ] 🔴 시스템 프롬프트 튜닝 (반복 작업)
  - 실제 상황 입력 10~20개로 응답 품질 테스트
  - "프레임을 비춘다"는 느낌이 나는지 검증
  - 답/조언을 주는 실패 케이스 수집 및 프롬프트 수정
  - 열린 질문의 품질 검증
  - ⚠️ 실패 시 우회 방안: few-shot 예시를 프롬프트에 직접 포함
- [ ] 🔴 인스타 인앱 브라우저 호환성 테스트
  - iOS/Android 인스타 인앱 브라우저에서 실제 테스트
  - 스트리밍 응답 정상 동작 확인
  - 뷰포트/스크롤 이슈 확인
  - ⚠️ 실패 시 우회 방안: 스트리밍 대신 전체 응답 한번에 표시
- [ ] 🟡 "다시 써볼게요" 플로우 구현
  - 기존 입력 텍스트를 입력창에 유지한 채 idle 상태로 복귀
  - retry도 reflections에 별도 레코드로 저장
- [ ] 🟡 이메일 입력 UX 마무리
  - 피드백 후 자연스럽게 이메일 입력 영역 노출
  - 중복 이메일 처리 (UNIQUE constraint + 프론트 안내)

📌 체크포인트: 시스템 프롬프트가 "프레임 비추기" 품질을 충족하고, 인스타 인앱 브라우저에서 전체 플로우 동작
📌 git commit

### Phase 4: 마무리 & 배포

- [ ] 🟡 UI 폴리싱
  - 로딩 애니메이션 (타이핑 효과 또는 부드러운 fade-in)
  - 에러 상태 UI (API 실패, 네트워크 오류)
  - 빈 입력 방지, 입력 길이 제한
- [ ] 🟢 Vercel 배포
  - GitHub 연결 + 자동 배포 설정
  - 환경변수 설정 (OPENAI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY)
  - 커스텀 도메인 연결
- [ ] 🟡 최종 테스트
  - 모바일 실기기 테스트 (iOS Safari, Android Chrome, 인스타 인앱)
  - Supabase 데이터 수집 확인
  - OG 태그 미리보기 확인 (인스타/카톡 공유)
  - 성능 체크 (첫 화면 3초 이내 로드)
- [ ] 🟢 데모데이 발표 준비
  - 핵심 지표 대시보드 (Supabase Dashboard에서 조회)
  - 시연 시나리오 준비

📌 체크포인트: 커스텀 도메인에서 배포 완료, 인스타 -> 링크 클릭 -> 전체 플로우 정상 동작

---

## 주차별 체크리스트

### 7주차 (4/28 화 ~ 5/3 일): 기반 세팅 + 핵심 기능

- [ ] Phase 1 완료: prototype-v1.html로 전체 UI 확정
- [ ] Phase 2 완료: Next.js 프로젝트 + OpenAI 연동 + 실제 응답 동작
- [ ] Phase 2.5 완료: Supabase 연결 + 데이터 저장 확인
- **이 주가 끝나면**: 로컬에서 "상황 입력 -> AI 응답 -> 피드백 -> DB 저장"이 동작하는 앱

### 8주차 (5/4 월 ~ 5/10 일): 프롬프트 튜닝 + 배포 + 마무리

- [ ] Phase 3 완료: 시스템 프롬프트 튜닝, 인스타 호환성 검증, 피드백 UX 마무리
- [ ] Phase 4 (배포): Vercel 배포 + 커스텀 도메인 + 환경변수
- [ ] Phase 4 (폴리싱): UI 애니메이션, 에러 처리, 모바일 실기기 테스트
- **이 주가 끝나면**: 커스텀 도메인에서 운영 중인 앱 + 프롬프트 품질 검증 완료

### 데모데이 (5/11 월 ~ 5/12 화): 최종 점검 + 발표

- [ ] 최종 모바일 테스트 (인스타 인앱 브라우저 포함)
- [ ] Supabase 데이터 확인 + 간단 지표 정리
- [ ] 시연 시나리오 리허설
- [ ] 발표 자료 준비

---

## 외부 설정 필요 항목

### 필수 (Must Have)

| 항목 | 설명 | 획득 방법 |
|------|------|----------|
| OPENAI_API_KEY | GPT-4o API 호출용 | 이미 확보 완료. `.env.local`에 설정 |
| NEXT_PUBLIC_SUPABASE_URL | Supabase 프로젝트 URL | supabase.com -> New Project -> Settings > API |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase 익명 키 (클라이언트용) | 같은 위치에서 anon/public 키 복사 |
| SUPABASE_SERVICE_ROLE_KEY | Supabase 서비스 키 (서버 전용, RLS 우회 관리용) | 같은 위치에서 service_role 키 복사. 절대 프론트에 노출 금지 |
| Vercel 계정 | 배포용 | vercel.com 가입 (이미 사용 경험 있음) |
| 커스텀 도메인 | 서비스 URL | 도메인 구매 후 Vercel > Project > Domains에서 연결 |

### 선택 (Nice to Have)

| 항목 | 설명 | 획득 방법 |
|------|------|----------|
| Vercel Analytics | 트래픽 모니터링 | Vercel Dashboard에서 Analytics 활성화 |
| OG Image | 인스타/카톡 공유 미리보기 이미지 | 직접 제작 후 public/ 폴더에 배치 |

### .env.local 전체 목록

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 시작하기

```bash
# 1. Phase 1: 프로토타입 (서버 불필요)
# prototype-v1.html 파일 생성 후 브라우저에서 직접 열기

# 2. Phase 2: Next.js 프로젝트 초기화
cd "/Users/keumbinoh/Downloads/afm-2th-weekday/week-6/quest/03. planning/"
npx create-next-app@latest noting-heal --typescript --tailwind --app --src-dir=false --import-alias="@/*" --eslint
cd noting-heal

# 3. 필요 패키지 설치
npm install openai @supabase/supabase-js

# 4. 환경변수 설정
# .env.local 파일 생성 후 위의 환경변수 입력

# 5. 개발 서버 실행
npm run dev
```
