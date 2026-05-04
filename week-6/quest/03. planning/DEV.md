# DEV.md - noting heal 개발 가이드

> noting heal -- 파란 대문 너머에서 시작되는 마이크로 리추얼. 공간/감정/시간에 맞는 노팅 방법을 건네고, 수행과 기록이 습관으로 쌓이면서 스스로 자신의 프레임을 인식하게 돕는 자기인식 도구.
> Architecture: Next.js (App Router)
> Scope: v1은 heal 모듈에만 집중. 플랫폼 확장(eat/move/rest)은 v1 범위 밖.

---

## Requirements

### 핵심 (v1 필수)
- [ ] 파란 대문 (세계관 진입): 앱을 열면 파란 대문이 등장하고, 문을 여는 행위로 리추얼이 시작된다
- [ ] Self Check-in: 공간(어디에 있는지), 감정(지금 상태), 시간(노팅 가능 시간) 세 가지를 선택한다
- [ ] 맞춤 노팅 방법 추천: 공간/감정/시간 조합에 따라 지금 바로 수행할 수 있는 노팅 방법을 제안한다
- [ ] 노팅 방법 수행: 제안받은 방법의 가이드를 화면에 보여주고 수행한다
- [ ] 한 문장 노팅: 수행 후 판단 없이 지금 떠오르는 것을 한 문장으로 적는다
- [ ] 기록 열람: 쌓인 기록을 날짜별로 돌아볼 수 있다
- [ ] 패턴 시각화: 반복되는 감정 통계, 자주 등장한 단어, 감정 흐름 캘린더
- [ ] 로그인/회원가입 (Supabase Auth -- 소셜 or 이메일)
- [ ] 기록 보존: 로그인 기반으로 사용자별 기록이 유지된다
- [ ] 반응형 웹 (모바일 퍼스트)
- [ ] 한국어 UI
- [ ] Vercel 배포 (기본 도메인)
- [ ] MVP 완전 무료 (결제 기능 없음)

### 후순위 (v1 이후)
- [ ] 리추얼 시간대 알림 (푸시/이메일)
- [ ] 커스텀 도메인 연결
- [ ] UI 폴리싱 (애니메이션, 전환 효과)
- [ ] OG 태그 미리보기 (인스타/카톡 공유)
- [ ] 커뮤니티/소셜 기능 (프라이빗 리추얼 클럽)

## Non-goals

- AI 해석, 분석, 조언, 라벨링 (v1에서 AI 호출 없음)
- 커뮤니티 / 소셜 기능
- Weekly / Monthly / 계절 리추얼
- eat / move / rest 등 다른 모듈
- 네이티브 앱 (Capacitor 등)
- 결제/구독 기능
- 스트리밍 응답 / 챗봇
- 감정에 대한 처방/진단 ("불안하니까 이걸 해봐" 류 -- 감정 라벨을 언급하며 처방하지 않는다)

## Style

- 모바일 퍼스트 반응형
- 한국어 UI
- Tailwind CSS 기반 스타일링

### 파란 대문 UI 가이드

> 노팅힐 영화의 파란 대문이 앱의 시각적 아이덴티티.
> 스크린샷 한 장으로 전달 가능한 아이덴티티이자 바이럴 요소.

- 파란 대문은 앱 진입 화면의 중심 요소
- "문을 연다"는 제스처(탭/클릭)가 리추얼의 시작점
- 대문 열림 시 자연스러운 전환 효과 (CSS transition)
- 대문 색상: 노팅힐 영화 참고, Tailwind blue 계열 (blue-600 ~ blue-800)
- 대문 주변: 미니멀, 여백 넉넉, 텍스트 최소화

### UI 공간감 가이드: "환기" 경험 설계

> 핵심 원칙: 노팅힐은 도구(tool)가 아니라 공간(space)이다.
> 사용자가 "막힌 방에 들어와서, 환기되고, 나가는" 흐름을 체감해야 한다.

#### 톤 전환 (리추얼 플로우 적용)

| 단계 | 상태 | 배경 | 여백 | 의도 |
|------|------|------|------|------|
| 1. 파란 대문 | 진입 전 | 대문 중심, 여백 넓음 | 대문에만 시선 집중 | 일상과 알아차림의 경계 |
| 2. Self Check-in | 선택 중 | 무겁고 밀도 높은 어둠 (stone-900) | 선택지에 시선 집중 | "지금 이 순간"에 집중하게 하는 시작점 |
| 3. 노팅 방법 수행 | 수행 중 | 밀도가 살짝 낮아짐 (stone-850) | 가이드 텍스트에 집중 | 도구를 건네받고 수행하는 공간 |
| 4. 한 문장 노팅 | 쓰기 | 좀 더 열린 톤 (stone-800) | 입력란에 집중, 여백 확장 | 생각을 꺼내놓는 공간 |
| 5. 완료 | 리추얼 완료 | 숨 쉴 수 있는 톤 (stone-750) | 넓은 여백, 완료 메시지만 | "오늘도 했다"는 가벼운 종결감 |

#### 구현 원칙

- **CSS transition만으로 구현**: background-color, padding, opacity 전환
- **전환 시간은 1초 이내**: 즉시성을 해치지 않되, "무언가 바뀌었다"를 인지할 수 있는 최소 시간
- **사운드/비디오/파티클 없음**: 노팅힐은 조용한 공간
- **색상 팔레트**: 어두운 톤 내에서 밀도(density)와 여백(space)으로 단계를 구분

#### 하지 않는 것

- 로딩 중 명상 애니메이션 (과한 연출)
- 앰비언트 사운드/배경 음악
- 스크롤 기반 패럴랙스 효과
- 화려한 달성 뱃지/게이미피케이션

## Key Concepts

| 용어 | 설명 |
|------|------|
| 프레임 | 가족/직장/관계가 씌운 무의식적 사고 틀. 기존 서비스(사주/MBTI/상담)는 새 라벨로 또 다른 프레임을 덧씌움 |
| 비추기 | 이미 일어나고 있는 생각과 감정을 판단 없이 드러내는 행위. 이름 붙이거나 진단하지 않음 |
| 알아차림 | 비춰진 생각/감정의 흐름을 사용자가 스스로 인식하는 것. noting heal의 궁극적 목표 |
| 파란 대문 | 앱의 시각적 아이덴티티이자 리추얼 시작점. 일상과 알아차림의 경계를 만드는 세계관 장치 |
| Self Check-in | 공간/감정/시간 세 가지를 선택하는 단계. 사용자의 현재 맥락을 파악하여 맞춤 노팅 방법을 제안하기 위한 입력 |
| 노팅 방법 | 공간/감정/시간 조합에 따라 제안되는 구체적 수행 활동 (예: 복식호흡, 눈 위아래로 굴리기, 주위 빨간 물체 찾기, 내 자신 칭찬하기 등). 명상 강사가 직접 큐레이션한 콘텐츠 |
| 마이크로 리추얼 | 매일 1~5분의 짧은 루틴. 파란 대문 -> Self Check-in -> 노팅 방법 수행 -> 한 문장 노팅으로 구성 |
| 노팅 | 판단 없이, 지금 떠오르는 것을 한 문장으로 적는 행위 |
| Daily Ritual | 하루에 한 번 수행하는 리추얼 사이클. 파란 대문 -> Self Check-in -> 맞춤 노팅 방법 수행 -> 한 문장 노팅 -> 기록 완료 |
| 패턴 시각화 | 쌓인 기록에서 반복되는 감정과 단어를 보여주는 기능. AI 해석 없이 데이터가 비춰주는 자기인식. 감정일기 앱과의 핵심 차별점 |
| 도구를 건넨다 | noting heal의 핵심 태도. "불안하니까 이걸 해봐"(X) -> "오피스에서 1분 안에 해볼 수 있는 방법이에요"(O). 감정 라벨을 언급하며 처방하지 않고, 상황 기반으로 도구만 제안 |

## Open Questions

- 노팅 방법 콘텐츠 초기 수량 (v1 런칭에 필요한 최소 콘텐츠 수)
- 공간/감정/시간 조합 매트릭스 구조 (몇 가지 공간 x 몇 가지 감정 x 몇 가지 시간 = 총 조합 수)
- 각 조합에 매핑되는 노팅 방법의 중복 허용 범위 (하나의 방법이 여러 조합에 쓰일 수 있는지)
- 30년차 명상 전문가 콘텐츠 큐레이션 작업 일정 및 범위
- 감정 선택지 구체적 목록 (어떤 감정들을 제공할 것인가)
- 공간 선택지 구체적 목록 (어떤 공간들을 제공할 것인가)
- 시간 선택지 (1분/3분/5분 또는 다른 구성)
- 로그인 방식 (소셜 로그인 / 이메일 / 매직링크 중 선택)
- 기록 열람 UI (타임라인 / 캘린더 / 리스트 중 선택)
- 리추얼 시간대 알림 여부 및 방식
- 하루에 여러 번 리추얼 허용 여부 (1일 1회 제한 vs 자유)
- v2 전환 시점 판단 기준

---

## 선택된 개발 구조

### Next.js App Router

**선택 이유:**
1. **Supabase Auth 연동**: 서버 컴포넌트 + Route Handler에서 안전한 인증 처리
2. **Vercel 네이티브**: Next.js + Vercel 조합은 배포/환경변수 설정이 가장 간단
3. **SSR/메타데이터**: OG 태그, SEO가 자동 지원됨
4. **RLS + Server SDK**: Supabase Row Level Security와 서버사이드 데이터 접근을 깔끔하게 분리
5. **이미 경험 있음**: week-6에서 Next.js, Supabase, Vercel 모두 사용해본 스택

## 프로젝트 구조

```
noting-heal/
├── app/
│   ├── layout.tsx              # 루트 레이아웃, 메타데이터, 폰트
│   ├── page.tsx                # 파란 대문 (세계관 진입 화면)
│   ├── globals.css             # Tailwind 글로벌 스타일
│   ├── ritual/
│   │   └── page.tsx            # 통합 리추얼 플로우 (Self Check-in -> 맞춤 노팅 방법 -> 수행 -> 한 문장 노팅 -> 완료)
│   ├── history/
│   │   └── page.tsx            # 기록 열람 페이지
│   ├── insights/
│   │   └── page.tsx            # 패턴 시각화 페이지 (감정 통계, 반복 단어, 캘린더)
│   ├── auth/
│   │   ├── callback/
│   │   │   └── route.ts        # OAuth 콜백 처리
│   │   └── login/
│   │       └── page.tsx        # 로그인 페이지
│   └── api/
│       └── ritual/
│           └── route.ts        # 리추얼 기록 저장 API (서버사이드)
├── components/
│   ├── BlueDoor.tsx            # 파란 대문 UI (탭하여 문 열기 인터랙션)
│   ├── SelfCheckIn.tsx         # Self Check-in (공간/감정/시간 3가지 선택)
│   ├── NotingMethod.tsx        # 맞춤 노팅 방법 표시 + 수행 가이드
│   ├── NotingInput.tsx         # 한 문장 노팅 입력
│   ├── RitualComplete.tsx      # 리추얼 완료 화면
│   ├── HistoryList.tsx         # 기록 목록 (날짜별)
│   ├── HistoryItem.tsx         # 개별 기록 항목 (감정 + 공간 + 노팅 방법 + 한 문장)
│   ├── EmotionStats.tsx        # 주간 감정 통계 (가장 많이 고른 감정, 빈도)
│   ├── FrequentWords.tsx       # 자주 등장한 단어/키워드
│   ├── EmotionCalendar.tsx     # 감정 흐름 캘린더 (날짜별 감정 색상)
│   ├── AuthForm.tsx            # 로그인/회원가입 폼
│   └── Navigation.tsx          # 네비게이션 (리추얼/기록/인사이트/로그아웃)
├── lib/
│   ├── supabase-browser.ts     # Supabase 브라우저 클라이언트
│   ├── supabase-server.ts      # Supabase 서버 클라이언트
│   ├── noting-methods.ts       # 노팅 방법 콘텐츠 데이터 + 공간/감정/시간 조합 매핑 로직
│   ├── emotions.ts             # 감정 선택지 데이터
│   ├── locations.ts            # 공간 선택지 데이터
│   └── time-options.ts         # 시간 선택지 데이터
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
└── .env.local
```

---

## DB 스키마 (Supabase PostgreSQL)

### profiles 테이블

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
```

### rituals 테이블

```sql
CREATE TABLE rituals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  location TEXT NOT NULL,
  emotion TEXT NOT NULL,
  time_minutes INT NOT NULL,
  noting_method TEXT NOT NULL,
  noting_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rituals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own rituals"
  ON rituals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own rituals"
  ON rituals FOR SELECT USING (auth.uid() = user_id);
```

> profiles 테이블은 Auth trigger로 자동 생성하거나, 첫 로그인 시 upsert.
> rituals 테이블은 사용자 본인의 기록만 읽고 쓸 수 있도록 RLS 설정.
> rituals에 location, time_minutes, noting_method 컬럼 추가 -- Self Check-in 데이터와 추천된 노팅 방법을 함께 기록.

### Auth trigger (profiles 자동 생성)

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## TODO List

### Phase 1: 디자인 & 프로토타이핑

- [ ] 🟢 UI 프로토타입 -- `prototype-v1.html` (더미 데이터, 서버 불필요)
  - 파란 대문 화면: 대문 탭 시 열리는 인터랙션, 세계관 진입
  - Self Check-in 화면: 공간 선택 -> 감정 선택 -> 시간 선택 (3단계 또는 한 화면)
  - 맞춤 노팅 방법 추천 화면: 조합에 따른 노팅 방법 카드 표시 + 수행 가이드
  - 한 문장 노팅 화면: 수행 후 한 문장 입력
  - 리추얼 완료 화면: 완료 메시지
  - 기록 열람 화면: 날짜별 과거 기록 리스트 (감정 + 공간 + 노팅 방법 + 한 문장)
  - 패턴 시각화 화면: 감정 통계, 반복 단어, 감정 캘린더 (더미 데이터)
  - 모바일 퍼스트 레이아웃 (375px 기준)
  - 톤 전환 시뮬레이션 (파란 대문 -> 체크인 -> 수행 -> 노팅 -> 완료)
  - 더미 공간/감정/시간 선택지 + 더미 노팅 방법 데이터 + 더미 기록 데이터
  - 네비게이션: 리추얼 / 기록 열람 / 인사이트 전환

📌 체크포인트: 더미 데이터로 모든 화면이 보이고 전체 플로우(파란 대문 -> 체크인 -> 노팅 방법 -> 수행 -> 기록 -> 열람 -> 시각화) 네비게이션이 동작 (브라우저에서 파일을 직접 열어 확인)
📌 git commit

### Phase 2: 기본 기능 (쉬운 것부터)

- [ ] 🟢 Next.js 프로젝트 초기화 (TypeScript, Tailwind CSS, App Router)
- [ ] 🟢 prototype-v1.html -> Next.js 컴포넌트 전환
  - `app/layout.tsx`: 루트 레이아웃, 폰트, 메타데이터
  - `app/page.tsx`: 파란 대문 화면
  - `components/BlueDoor.tsx`: 파란 대문 UI (탭하여 문 열기)
  - `components/SelfCheckIn.tsx`: 공간/감정/시간 선택 UI
  - `components/NotingMethod.tsx`: 맞춤 노팅 방법 표시 + 수행 가이드
  - `components/NotingInput.tsx`: 한 문장 노팅 입력
  - `components/RitualComplete.tsx`: 리추얼 완료 화면
  - `components/Navigation.tsx`: 네비게이션
- [ ] 🟢 Self Check-in 데이터 정의
  - `lib/emotions.ts`: 감정 선택지 목록 (임시 목록 사용, Open Question 확정 전)
  - `lib/locations.ts`: 공간 선택지 목록 (집, 오피스, 카페, 밖 등)
  - `lib/time-options.ts`: 시간 선택지 (1분, 3분, 5분)
- [ ] 🟡 노팅 방법 콘텐츠 데이터 + 조합 매핑 로직 (`lib/noting-methods.ts`)
  - 공간/감정/시간 조합에 따라 적절한 노팅 방법을 반환하는 로직
  - 초기 노팅 방법 콘텐츠 (더미 또는 초기 버전, 추후 전문가 큐레이션으로 교체)
  - 각 노팅 방법: 이름, 설명, 수행 가이드 텍스트, 예상 소요 시간
- [ ] 🟡 통합 리추얼 플로우 구현 (`app/ritual/page.tsx`)
  - 상태 머신: checkin -> method -> perform -> noting -> complete
  - Self Check-in (공간 -> 감정 -> 시간 선택)
  - 조합에 따른 맞춤 노팅 방법 추천 + 수행 가이드 표시
  - 수행 후 한 문장 입력 -> 완료 화면 전환
  - 톤 전환 CSS transition 적용
  - 데이터는 아직 저장하지 않음 (UI 동작만 확인)
- [ ] 🟢 기록 열람 UI 구현 (`app/history/page.tsx`)
  - 더미 데이터로 날짜별 기록 리스트 렌더링
  - `components/HistoryList.tsx`, `components/HistoryItem.tsx`
  - 각 기록 항목: 감정 + 공간 + 노팅 방법 + 한 문장 + 날짜

📌 체크포인트: 로컬에서 파란 대문 -> Self Check-in -> 맞춤 노팅 방법 추천 -> 수행 -> 한 문장 노팅 -> 완료 전체 플로우와 기록 열람 UI가 더미 데이터로 동작
📌 git commit
📌 동작 확인 후 다음 Phase로 진행. 실패 시 이전 커밋으로 롤백 가능.

### Phase 2.5: Supabase 연결 검증

- [ ] 🟡 Supabase 프로젝트 생성 (supabase.com)
- [ ] 🟡 DB 테이블 생성: profiles, rituals (위 스키마 참고 -- location, time_minutes, noting_method 컬럼 포함)
- [ ] 🟡 RLS 정책 적용 + Auth trigger 설정
- [ ] 🟡 Supabase Auth 설정 (이메일 or 소셜 로그인 활성화)
- [ ] 🟡 Supabase 클라이언트 초기화
  - `lib/supabase-browser.ts` (클라이언트 컴포넌트용)
  - `lib/supabase-server.ts` (서버 컴포넌트/Route Handler용)
- [ ] 🟡 로그인/회원가입 구현
  - `components/AuthForm.tsx`
  - `app/auth/callback/route.ts` (OAuth 콜백)
  - 로그인 상태에 따라 리추얼 페이지 접근 제어
- [ ] 🟡 리추얼 기록 저장 연결
  - 리추얼 완료 시 rituals 테이블에 INSERT (location, emotion, time_minutes, noting_method, noting_text)
  - Supabase Dashboard에서 데이터 저장 확인
- [ ] 🟡 기록 열람 실데이터 연결
  - 더미 데이터 -> rituals 테이블 SELECT로 교체
  - 본인 기록만 조회 (RLS 자동 적용)

📌 체크포인트: 로그인 -> 파란 대문 -> Self Check-in -> 노팅 방법 수행 -> 한 문장 기록 -> DB 저장 -> 기록 열람에서 실데이터 표시까지 동작
📌 git commit
📌 동작 확인 후 다음 Phase로 진행. 실패 시 이전 커밋으로 롤백 가능.

### Phase 3: 핵심 & 어려운 기능 (불확실한 것부터)

- [ ] 🟡 패턴 시각화 구현 (`app/insights/page.tsx`)
  - `components/EmotionStats.tsx`: 주간 감정 통계 (가장 많이 고른 감정, 빈도 차트)
  - `components/FrequentWords.tsx`: 노팅에서 자주 등장한 단어/키워드 추출 및 표시
  - `components/EmotionCalendar.tsx`: 날짜별 감정 색상 캘린더 (월간 뷰)
  - 데이터: rituals 테이블에서 집계 쿼리 (클라이언트 or 서버사이드)
  - ⚠️ 실패 시 우회 방안: 단어 추출을 단순 split + 빈도 카운트로 구현. 차트 라이브러리 없이 CSS bar로 대체
- [ ] 🟡 인증 상태 미들웨어 (`middleware.ts`)
  - 비로그인 사용자의 /ritual, /history, /insights 접근 차단 -> 로그인 페이지로 리다이렉트
  - Supabase Auth 세션 갱신 처리
  - ⚠️ 실패 시 우회 방안: 미들웨어 대신 각 페이지 컴포넌트에서 직접 인증 체크
- [ ] 🟡 기록 열람 UI 고도화
  - 날짜별 그룹핑 (오늘 / 어제 / 이번 주 / 이전)
  - 무한 스크롤 또는 페이지네이션 (기록이 쌓였을 때 대응)
  - ⚠️ 실패 시 우회 방안: 단순 리스트 + "더 보기" 버튼
- [ ] 🟡 Vercel 배포 + 환경변수 설정
  - GitHub 연결 + 자동 배포
  - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY 설정
  - 배포 후 전체 플로우 검증 (로그인 -> 파란 대문 -> 체크인 -> 노팅 -> 기록 열람 -> 시각화)

📌 체크포인트: 배포된 URL에서 전체 플로우가 정상 동작
📌 git commit

### Phase 4: 마무리 & 배포

- [ ] 🟡 UI 폴리싱
  - 에러 상태 처리 (네트워크 에러, 인증 만료 등)
  - 로딩 상태 UI (리추얼 저장 중, 기록 불러오는 중)
  - 빈 상태 UI (첫 사용자, 기록 없음, 시각화 데이터 부족)
  - 파란 대문 열림 애니메이션 다듬기
- [ ] 🟡 메타데이터/OG 태그 설정 (`app/layout.tsx`)
  - 페이지 제목, 설명, OG 이미지
- [ ] 🟢 최종 테스트
  - 회원가입 -> 파란 대문 -> Self Check-in -> 노팅 방법 수행 -> 한 문장 기록 -> 기록 열람 -> 패턴 시각화 전체 플로우
  - 모바일 브라우저에서 동작 확인
  - 다른 계정으로 로그인 시 기록 분리 확인

📌 체크포인트: 배포 완료, 실사용자에게 공유 가능한 상태
📌 git commit

### v1 이후 (선택)

- [ ] 리추얼 시간대 알림 (이메일 or 푸시)
- [ ] 노팅 방법 콘텐츠 확대 (전문가 큐레이션 콘텐츠 추가)
- [ ] 커스텀 도메인 연결
- [ ] Vercel Analytics 활성화
- [ ] 기록 열람 캘린더 뷰
- [ ] 커뮤니티/소셜 기능 (프라이빗 리추얼 클럽)

---

## 성공 지표

### MVP 학습 지표 (출시 후 2~4주)

| 지표 | 목표 | 기간 |
|------|------|------|
| 첫 리추얼 완료율 | 가입자 중 70% 이상 | 출시 직후 |
| D1 리텐션 (다음 날 복귀) | 30% 이상 | 2주차 측정 |
| D7 리텐션 (7일 내 재방문) | 15% 이상 | 3주차 측정 |
| 3회 이상 리추얼 완료 유저 비율 | 전체 가입자 중 20% 이상 | 4주차 측정 |
| 평균 리추얼 소요 시간 | 1~5분 범위 내 | 상시 |

### 진짜 성공 지표 (정성적)

| 지표 | 목표 | 기간 |
|------|------|------|
| "다르게 보이기 시작했다" 류 피드백 | 1건 이상 | 출시 후 4주 |
| 자발적 재방문 (알림 없이 돌아옴) | 5명 이상 | 출시 후 4주 |
| "매일 하고 있어요" 자발적 공유 | 1건 이상 | 출시 후 4주 |

> 단 한 명이라도 "뭔가 다른 방향으로 보이더라"는 후기를 남기면, 이 방향은 가는 거다. 습관 앱에서 진짜 성공은 숫자가 아니라, 사용자의 인식에 변화가 일어났다는 증거다.

---

## 외부 설정 필요 항목

### 필수 (Must Have)

| 항목 | 설명 | 획득 방법 |
|------|------|----------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase 프로젝트 URL | supabase.com -> New Project -> Settings > API |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase 익명 키 (클라이언트용) | 같은 위치에서 anon/public 키 복사 |
| SUPABASE_SERVICE_ROLE_KEY | Supabase 서비스 키 (서버 전용, RLS 우회 관리용) | 같은 위치에서 service_role 키 복사. 절대 프론트에 노출 금지 |
| Vercel 계정 | 배포용 | vercel.com 가입 (이미 사용 경험 있음) |

### 선택 (v1 이후)

| 항목 | 설명 | 획득 방법 |
|------|------|----------|
| 커스텀 도메인 | 서비스 URL | 도메인 구매 후 Vercel > Project > Domains에서 연결 |
| Vercel Analytics | 트래픽 모니터링 | Vercel Dashboard에서 Analytics 활성화 |
| OG Image | 인스타/카톡 공유 미리보기 이미지 | 직접 제작 후 public/ 폴더에 배치 |

### Supabase Auth 설정 절차

1. Supabase Dashboard -> Authentication -> Providers
2. 이메일 로그인: Email 기본 활성화 (Confirm email 옵션 선택)
3. 소셜 로그인 (선택): Google/Kakao OAuth -> 해당 서비스에서 Client ID/Secret 발급 후 Supabase에 입력
4. Redirect URL 설정: `https://your-domain/auth/callback` (로컬 개발 시 `http://localhost:3000/auth/callback`)

### .env.local 전체 목록

```env
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
npm install @supabase/supabase-js @supabase/ssr

# 4. 환경변수 설정
# .env.local 파일 생성 후 위의 환경변수 입력

# 5. 개발 서버 실행
npm run dev
```
