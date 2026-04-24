# noting heal 프로젝트 대화 기록

> 날짜: 2026-04-24
> 도구: Claude Code + Chrome MCP + Web Search

---

## 1. 앱 아이디어 구체화

### 사용자
> @app-mission-architect 질문 5개만 던져줘봐

### Claude
app-mission-architect 에이전트를 실행하여 5가지 질문 생성:

1. 어떤 문제를 해결하고 싶으신가요?
2. 이 앱은 개인용인가요, 공개용인가요?
3. 현재 이 문제를 어떻게 해결하고 계신가요?
4. v1에서 반드시 있어야 하는 핵심 기능 3~5가지는?
5. 앱이 성공했다고 느끼려면 어떤 상태여야 하나요?

---

## 2. 사용자 답변 (앱의 핵심 정의)

### 사용자

**문제**: 한국 사람들은 가족/직장/관계가 씌운 프레임에 갇혀 살면서 그게 프레임인 줄도 모른다. 기존 자기이해 서비스(사주아이, MBTI, 에니어그램)는 새 라벨을 씌울 뿐. 6년차 명상 강사로서 반대가 필요하다고 느낌 — 라벨을 빼고, 프레임을 거울처럼 비춰주는 서비스. 앱 이름은 노팅힐(Noting Heal). '노팅(noting)' = 의식적으로 알아차림하는 이.

**타겟**: 30-40대 한국 여성. 페르소나 = 경진(38세, 자산운용사). 도전하고 싶지만 쌓아둔 스펙 때문에 불안에 갇혀 있음. 사주 보는 데 진심, 사우나/여행으로 자신을 달램.

**현재 대안의 한계**: 사주아이, 점신, MBTI, 심리상담, 자기계발서, 친구 대화 — 모두 '답을 주는' 구조. 새 라벨이 새 감옥. 심리상담은 비싸고 즉시성 없음. 친구 대화는 친구 프레임이 끼어듦.

**핵심 기능 4가지**:
1. 상황 입력 (한 줄 텍스트)
2. 노팅 거울 응답 (프레임을 비추고 열린 질문으로 닫기, 진단/라벨/조언 없음)
3. 반응 피드백 버튼 ("오 맞아요" / "음, 글쎄요" / "다시 써볼게요")
4. 결과 저장용 이메일 입력 (선택)
- 가장 중요한 건 노팅 언어로 튜닝된 시스템 프롬프트

**성공 지표** (출시 후 2~3주):
- 팔로워 100명 1회 사용, 상황 문장 100건, "오 맞아요" 60%, 공유 5건
- 진짜 성공: 단 한 명이라도 "뭔가 다른 방향으로 보이더라" 후기

### Claude
MISSION.md 파일 생성 → `week-6/noting-heal/MISSION.md`

---

## 3. 파일 이동

### 사용자
> mission.md 파일 week-6/quest/02.chrome-mcp-research 여기에다가 이동해줘

### Claude
`mv` 명령으로 이동 완료. 빈 `noting-heal` 디렉토리 정리.

---

## 4. 안티스코프 추가

### 사용자
> 안티스코프 하나 추가해줘 — "응답을 즐겁게 하거나 위로하려 하지 않는다"

### Claude
MISSION.md 안티스코프 섹션에 해당 항목 추가.

---

## 5. 시스템 프롬프트 정의

### 사용자
시스템 프롬프트 관련 열린 질문에 답변 제공:
- 원칙 5가지 (제품 DNA)
- 시스템 프롬프트 초안 v0.1 전문 (절대 금지 / 반드시 할 것 / 응답 분량 / 톤)

### Claude
MISSION.md에 "제품 DNA 원칙" 섹션과 "시스템 프롬프트 초안 v0.1" 코드블록 추가. 열린 질문에서 답변된 항목 제거.

---

## 6. 서비스 이름 변경 + heal 원칙 + 다수 업데이트

### 사용자
5가지 변경 요청:
1. "노팅 거울" → "noting heal"로 통일
2. heal 원칙 추가 (결과 약속 단어 사용 금지, 나쁜 예/좋은 예)
3. 첫 화면 카피 업데이트
4. 시스템 프롬프트 절대 금지에 결과 약속 단어 추가
5. 안티스코프에 치유/회복 약속 금지 추가

### Claude
8건의 Edit으로 모든 변경 적용. 일관성 점검 결과 보고 — 놓친 부분 없음.

---

## 7. 미션 스테이트먼트 한 문단 정리 + Tagline

### 사용자
> MISSION.md 내용을 "이 앱을 왜 만드는가?"의 대답으로 한 문단으로 정리해줘. 문제 정의 → 타겟 유저 → 해결 방법 순서로.

### Claude
한 문단 작성:
> 한국 사람들은 가족·직장·관계가 씌운 프레임에 갇혀 살면서... noting heal은 답·조언·라벨을 일체 주지 않고, 사용자가 쓴 한두 줄의 상황에서 작동 중인 프레임을 거울처럼 드러낸 뒤 열린 질문 하나로 돌려주는 서비스다.

### 사용자
> 영어 한 줄 Tagline까지 만들어줘

### Claude
> **noting heal — See the frame, not the answer.**

### 사용자
> 정리된 한문단과 영어한줄 mission.md 파일에 업데이트 해줘

### Claude
MISSION.md 상단에 Tagline + 한 문단 미션 스테이트먼트 반영.

---

## 8. 경쟁 서비스 선정

### 사용자
> 노팅힐 프로젝트와 비슷한 기능 또는 타겟을 가진 서비스 3개 선정해줘 (국내 1 + 해외 1 + 인접 카테고리 1)

### Claude
Web Search로 리서치 후 3개 선정:
1. **포스텔러** (국내) — 사주·타로 운세 콘텐츠 플랫폼. 답을 준다.
2. **Reflection.app** (해외) — AI 저널링+코칭. 질문을 던지지만 패턴/인사이트를 라벨링.
3. **심스페이스** (인접) — AI 마음일기. 공감+위로+감정 46종 분류.

포지셔닝 비교표 제공 — noting heal만 유일하게 "이름을 빼는" 쪽.

---

## 9. Chrome MCP로 경쟁 서비스 자동 탐색

### 사용자
> 크롬 MCP로 각 서비스 랜딩/기능/가격 페이지 방문, 핵심 가치 제안·주요 기능·가격 정리, 스크린샷 자동 저장

### Chrome 연결 트러블슈팅

Chrome MCP 연결이 반복 실패. 원인 진단:

| 시도 | 방법 | 실패 원인 |
|------|------|-----------|
| 1 | 기본 실행 | Chrome이 디버그 모드가 아니었음 |
| 2 | `pkill` → 재실행 | 기존 Chrome이 완전히 안 죽어 새 인스턴스가 합류 |
| 3 | `open -a` 명령 | 이미 실행 중인 앱에 args 전달 안 됨 |
| 4 | 직접 바이너리 실행 | 같은 user-data-dir 프로필 잠금 → 디버그 포트 무시 |
| 5 | `--user-data-dir=/tmp/chrome-debug-profile` | **성공** |

**근본 원인**: Chrome은 동일 user-data-dir로 이미 인스턴스가 있으면 `--remote-debugging-port`를 무시. 별도 프로필 디렉토리 지정으로 해결.

### chrome_navigate hang 문제

연결 성공 후 `chrome_navigate` 호출 시 6분간 hang 발생.

사용자가 복구 절차 지시:
1. ps로 프로세스 확인 → CPU 200% 과부하 상태
2. 사용자에게 수동 접속 가능 여부 확인 → "안 됨"
3. Chrome 재시작 → 포트 연결 확인
4. `chrome_list_tabs` (가벼운 명령) 테스트 → 성공
5. `chrome_navigate` 다시 시도 → WebSocket readyState 3 (CLOSED) 에러

**우회 해결**: Chrome MCP 도구 대신 Python + websockets로 CDP(Chrome DevTools Protocol) 직접 호출. `Page.navigate` + `Page.captureScreenshot` + `Runtime.evaluate`로 완전 동작.

### 탐색 결과

7개 페이지 방문, 7개 스크린샷 저장:

| 파일 | 서비스 | 페이지 |
|------|--------|--------|
| `01_reflection_landing.png` | Reflection.app | 랜딩 |
| `02_reflection_ai_features.png` | Reflection.app | AI 기능 |
| `03_reflection_pricing.png` | Reflection.app | 가격 |
| `04_forceteller_landing.png` | 포스텔러 | 랜딩 |
| `05_forceteller_appstore.png` | 포스텔러 | App Store |
| `06_seamspace_landing.png` | 심스페이스 | 랜딩 |
| `07_seamspace_appstore.png` | 심스페이스 | App Store |

---

## 10. 비교 리포트 작성

### 사용자
> 비교 리포트 research.md 작성해줘
> - 비교표: 기능/가격/UX 3개 서비스 나란히
> - 차별화 포인트 3가지
> - AUDIENCES.md 인풋: 리뷰/앱스토어/레딧 불만 후기 스크랩

### Claude
Web Search로 유저 불만 데이터 추가 수집 후 `research.md` 작성:

**비교표 3개**: 기능 / 가격 / UX 특징

**차별화 포인트 3가지**:
1. "이름을 빼는" 유일한 서비스
2. "지금 이 순간" 1회성 경험 집중
3. 명상 강사의 언어 + 시스템 프롬프트라는 기술적 해자

**유저 불만 스크랩**:
- Reflection: AI 인사이트가 얕다, 응답 정형화
- 포스텔러: 과금 많이 했는데 안 맞는다, 앱마다 결과가 다르다
- 심스페이스: UX 버그, 디자인 올드, 글자수 제한
- 공통: 제네릭 응답 / 새 라벨의 감옥 / 과금 피로 / 습관 형성 실패 / 위로 피로

---

## 11. 대화 기록 작성

### 사용자
> 이 프로젝트 시작부터 지금까지의 대화 기록해줘

### Claude
본 문서 작성.

---

## 현재 프로젝트 파일 구조

```
week-6/quest/02.chrome-mcp-research/
  MISSION.md          — 앱 미션, 타겟, 핵심기능, 안티스코프, 시스템 프롬프트
  research.md         — 경쟁 서비스 비교 리포트
  conversation-log.md — 본 대화 기록
  screenshots/
    01_reflection_landing.png
    02_reflection_ai_features.png
    03_reflection_pricing.png
    04_forceteller_landing.png
    05_forceteller_appstore.png
    06_seamspace_landing.png
    07_seamspace_appstore.png
```

---

## 기술적 교훈

### Chrome MCP 디버그 모드 실행법
```bash
# 핵심: --user-data-dir를 별도로 지정해야 기존 Chrome과 충돌 없음
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --remote-debugging-address=127.0.0.1 \
  --user-data-dir=/tmp/chrome-debug-profile \
  --no-first-run \
  --no-default-browser-check
```

### Chrome MCP navigate hang 우회법
chrome_navigate가 WebSocket 관리 버그로 hang될 때, Python + websockets로 CDP 직접 호출:
```python
import asyncio, json, websockets, urllib.request

async def navigate(url):
    tabs = json.loads(urllib.request.urlopen('http://127.0.0.1:9222/json').read())
    ws_url = [t['webSocketDebuggerUrl'] for t in tabs if t.get('type')=='page'][0]
    async with websockets.connect(ws_url) as ws:
        await ws.send(json.dumps({
            'id': 1, 'method': 'Page.navigate',
            'params': {'url': url}
        }))
        resp = await asyncio.wait_for(ws.recv(), timeout=15)
```
