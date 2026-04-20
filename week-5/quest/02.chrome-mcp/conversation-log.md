# 02. Chrome MCP 실습 대화 로그

> 날짜: 2026-04-20

---

## Step 1: Chrome MCP 설치 및 연결

### 사용자 요청
```
크롬 mcp 연결해줘
```

### 진행 과정

1. **기존 설정 파일 확인**
   - `/Users/keumbinoh/.claude/settings.json` — 글로벌 설정
   - `afm-2th-weekday/.claude/settings.local.json` — 프로젝트 로컬 설정

2. **chrome-mcp 패키지 동작 확인**
   ```bash
   npx -y chrome-mcp --help
   ```
   - 결과: Chrome MCP Server running on stdio
   - 사용 가능 도구 확인:
     `chrome_navigate`, `chrome_get_current_url`, `chrome_get_title`, `chrome_get_content`, `chrome_get_visible_text`, `chrome_execute_script`, `chrome_click`, `chrome_type`, `chrome_screenshot`, `chrome_open_new_tab`, `chrome_close_tab`, `chrome_list_tabs`, `chrome_reload`, `chrome_go_back`, `chrome_go_forward`

3. **Claude Code에 MCP 서버 등록**
   ```bash
   claude mcp add chrome -- npx -y chrome-mcp
   ```
   - 결과: `Added stdio MCP server chrome with command: npx -y chrome-mcp to local config`

### 결과
Chrome MCP 서버가 성공적으로 연결됨. Chrome 디버그 모드로 실행 시 브라우저 제어 가능.

---

## Step 2: 웰니스/명상 트렌드 콘텐츠 수집

### 사용자 요청
```
웰니스/명상 트렌드 관련 최신 콘텐츠를 아래 사이트에서 탐색하고 주요 내용을 수집해줘
브런치 (웰니스, 명상 키워드)
Medium (wellness, mindfulness)
네이버 블로그 (명상, 힐링 키워드)
```

### 진행 과정

1. **3개 소스 동시 수집** (Agent 도구 활용 — 병렬 탐색)
   - 브런치: WebFetch로 `brunch.co.kr` 웰니스/명상 키워드 검색
   - Medium: WebFetch로 `medium.com` wellness/mindfulness 태그 탐색
   - 네이버 블로그: 크롤링 차단으로 웹 검색 대체 수집

2. **수집 결과 정리**

#### 브런치 — 웰니스 키워드 (6건)

| # | 제목 | 작성자 | 핵심 내용 |
|---|------|--------|----------|
| 1 | 2026년 건강은 어디로 가나 | 전의혁 | 아태 보충제 시장 — 수면/장내 미생물 건강 연결 |
| 2 | 37호. 2025 트렌드 웰니스 | 요가레터 OLLY | 글로벌 웰니스 경제 모니터 — 맞춤형/클린/로컬 웰니스 |
| 3 | 갑자기 웰니스? 그게 뭔데? | 쉘니스 이유리 | 퇴사 후 웰니스 컬리지 입학 경험 |
| 4 | GWS 2026 웰니스 트렌드 | 김치헌PhD | 의료-웰니스 경계 붕괴, 기후 적응형 웰니스 |
| 5 | 자기 인식이 평온한 마음을 만든다 | 배은경 | 셀프 리더십과 자기 인식 |
| 6 | 웰니스 플랫폼 '오붓' | borderless | 웰니스 클래스 검색/예약 플랫폼 체험기 |

#### 브런치 — 명상 키워드 (7건)

| # | 제목 | 작성자 | 핵심 내용 |
|---|------|--------|----------|
| 1 | 조계산 선명상 수료 | 인유당 | 명상 수련 과정 완료 경험 |
| 2 | 무의식의 메커니즘 | 보리 Bori | 요가수트라 중심 무의식 탐구 |
| 3 | 인생이 빛나는 빗자루질의 마법 | 다슈니와 호돌이 | 일상 속 명상적 의미 발견 |
| 4 | 분홍 머리끈과 두 겹의 물결 | 누리봄 | "감정은 내가 아니라, 나의 것" |
| 5 | 부처님 말씀대로 살아보니 | 황인갑 | 불교 심리학과 명상 활용 치유 |
| 6 | 방황하는 마음은 불행한 마음 | 뜻지 | 동국대 명상지도자과정 수강 기록 |
| 7 | 호흡, 그리고 기다림 | 진안 | 내면의 태도 변화 기록 |

#### Medium — #Wellness 태그 (5건)

| # | 제목 | 작성자 | 핵심 내용 |
|---|------|--------|----------|
| 1 | Sleeplessness has a pattern | Swarayu Wellness | 수면 장애 패턴과 자연적 해결법 |
| 2 | NeoBeaute's U.S. Expansion | Casey Tsamis | 웰니스 소비자 기대 수준 진화 |
| 3 | Preventive Healthcare in 2026 | Orovita7 | 2026년 예방 의료 트렌드 |
| 4 | How Your Diet Affects Mental Health | Vinod Kumar | 식단-정신건강 영향 |
| 5 | Why Air Quality Affects Your Lungs | Dr Chris Jackson | 대기질과 호흡기 건강 |

#### Medium — #Mindfulness 태그 (6건)

| # | 제목 | 작성자 | 핵심 내용 |
|---|------|--------|----------|
| 1 | Are You Getting Angry at an Empty Boat? | Smritistanley | "빈 배" 비유로 분노 줄이기 |
| 2 | Anger Unlearned | Shweta Sehrawat | 분노를 내려놓는 과정 성찰 |
| 3 | I Stopped Checking My Phone Every Morning | yasuaki | 디지털 디톡스 실천기 |
| 4 | Seeing People for Who They Really Are | Florin | 자기 인식 심화와 관계 변화 |
| 5 | The Biological Bedrock of Belief | Gary L. Fretwell | 고대 명상 + 현대 뇌과학 연결 |
| 6 | The Birthday Paradox | Viidhu Sharma | 타인 시선 밖에서 일어나는 성장 |

#### 국내 블로그 — 명상 관련 (7건)

| # | 제목 | 출처 | 핵심 내용 |
|---|------|------|----------|
| 1 | 숙면을 도와주는 마음챙김 명상 챌린지 후기 | 마보 블로그 | 3주 꿀잠 챌린지 — 수면 개선 효과 |
| 2 | 마음챙김 명상 입문 가이드 | 얼웨이즈 | 과학적 근거 기반 명상 입문법 |
| 3 | 마음챙김 명상 6가지 효과 | 마보 블로그 | 수면/우울감/스트레스/집중력 등 과학적 효과 |
| 4 | 틱낫한 스님의 명상 책 추천 3선 | 마보 블로그 | 마음챙김 명상 서적 추천 |
| 5 | 마음챙김 명상하는 4가지 방법 | 마보 블로그 | 호흡/걷기/먹기/바디스캔 명상 안내 |
| 6 | 당신의 명상이 효과적이지 않은 이유 | 디스턴싱 | 명상 실패 이유와 올바른 방법 |
| 7 | 영화로 보는 명상 | 마보 블로그 | 명상 주제 영화 소개 |

#### 국내 블로그 — 힐링 관련 (6건)

| # | 제목 | 출처 | 핵심 내용 |
|---|------|------|----------|
| 1 | 97%가 만족한 15만 평 치유의 숲 | 텔트립 | 평창 치유의 숲 개장 — 복합 힐링 프로그램 |
| 2 | 제주도 혼자 여행 2026 봄 힐링 플랜 | 아이코노미유 | 제주 혼자 여행 코스 6곳 |
| 3 | 힐링하기 좋은 국내 여행지 BEST 12 | 트립닷컴 | 계절별 힐링 여행지 총정리 |
| 4 | 힐링 여행지로 제격인 국내 명소들 | 브런치 텔트립 | 국내 힐링 여행지 엄선 |
| 5 | 당일치기 힐링숲 기차여행 | 현대로템 블로그 | 기차로 떠나는 힐링 숲 여행 |
| 6 | 2026 여행 트렌드 | 트립닷컴 | 힐링/치유 중심 여행 수요 증가 |

3. **결과 파일 저장**
   - `wellness-meditation-trends.md` 로 전체 리포트 저장

### 핵심 트렌드 3가지
1. **의료-웰니스 경계 붕괴** — 예방 의료, 수면-장내미생물 연결, 식단-정신건강 등 과학 기반 웰니스 확대
2. **일상 속 마음챙김** — 디지털 디톡스, 걷기/청소 명상, 분노 다루기 등 생활 밀착형 명상 실천기 인기
3. **자연 기반 힐링** — 평창 치유의 숲(만족도 97%), 제주 힐링 여행 등 산림 치유와 느린 여행이 주류화

---

## Step 3: 노션 노팅 페이지에 업로드

### 사용자 요청
```
정리된 내용 노션 노팅 페이지에
```

### 진행 과정

1. **노션 검색** — `notion-search`로 "노팅" 검색
   - 메인 페이지 발견: `🧘‍♀️ 노팅` (ID: `1cbfdd14-eb1e-4b3c-8dda-d1de0a6615e6`)

2. **페이지 구조 확인** — `notion-fetch`로 노팅 페이지 하위 구조 파악
   - 히스토리 섹션 아래 콘텐츠 달력, 입문 가이드, 브랜드 전략 등 다양한 하위 페이지 존재

3. **새 페이지 생성** — `notion-create-pages`로 하위 페이지 생성
   - 부모: 노팅 페이지
   - 제목: `🔍 웰니스/명상 트렌드 리서치 — 2026.04.20`
   - 내용: 핵심 트렌드 요약 + 브런치/Medium/국내 블로그 수집 결과 + 노팅 콘텐츠 기획 인사이트

### 결과
- 노션 페이지 생성 완료
- URL: https://www.notion.so/348a574ce637811abcf8d8e86372d412

---

## 사용한 도구 요약

| 도구 | 용도 |
|------|------|
| `Bash` | chrome-mcp 패키지 확인, Claude Code MCP 서버 등록 |
| `Read` | 기존 설정 파일 확인 |
| `Agent (general-purpose)` | 3개 사이트 병렬 콘텐츠 수집 |
| `WebFetch` / `WebSearch` | 브런치, Medium, 네이버 블로그 콘텐츠 탐색 |
| `Write` | 수집 결과 마크다운 파일 저장 |
| `notion-search` | 노션에서 노팅 페이지 검색 |
| `notion-fetch` | 노팅 페이지 구조 확인 |
| `notion-create-pages` | 트렌드 리서치 페이지 생성 |
