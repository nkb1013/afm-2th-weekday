# Money Tracker Agent - Supabase MCP 연동 & 소비 분석 대화 기록

## 1단계: Supabase MCP 연결

**사용자 요청:**
> supabase mcp 연결해줘

**Claude 작업 내용:**
- 기존 MCP 서버 목록 확인 (`claude mcp list`)
- Supabase MCP 서버 추가:
  ```bash
  claude mcp add supabase -e SUPABASE_ACCESS_TOKEN=... -- npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref omkuaglgzbbjiigxppml
  ```
- Personal Access Token 필요하다고 안내
  - 발급 경로: https://supabase.com/dashboard/account/tokens

---

## 2단계: Supabase 토큰 설정

**사용자 요청:**
> sbp_eb21ed5e6b0a7e6081b1a9fdbbfe859ede5f7d2a

**Claude 작업 내용:**
- 기존 supabase MCP 제거 후 토큰 포함하여 재설정:
  ```bash
  claude mcp remove supabase
  claude mcp add supabase \
    -e SUPABASE_ACCESS_TOKEN=sbp_eb21ed5e6b0a7e6081b1a9fdbbfe859ede5f7d2a \
    -- npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref omkuaglgzbbjiigxppml
  ```
- 프로젝트 로컬 설정에 저장 완료

---

## 3단계: 나고야 여행 소비 패턴 분석

**사용자 요청:**
> money_app_01_entries 테이블에서, 여행 상황(나고야 주말 여행)을 고려했을 때 이 소비 패턴이 합리적인지 평가해줘

**Claude 작업 내용:**
- `GET /api/entries` API로 전체 16건의 데이터 조회
- 모든 항목이 JPY(엔화)로 기록됨, 2박3일 나고야 여행

### 데이터 분석 결과

**일자별 지출 요약:**

| 날짜 | 엔화 합계 | 원화 합계 |
|------|----------:|----------:|
| 4/17 (금) | ¥29,892 | ₩277,298 |
| 4/18 (토) | ¥23,161 | ₩214,856 |
| 4/19 (일) | ¥24,081 | ₩223,393 |
| **총합계** | **¥77,134** | **₩715,547** |

**주요 지출 항목:**
- 식비 14건: ₩678,440 (94.8%)
- 기타(코인락카) 2건: ₩37,107 (5.2%)

**합리적인 부분:**
- 나고야 명물 (요시다키시멘 ¥7,958, 장어 히츠마부시 ¥14,350) 잘 소비
- 토리키조쿠(저가 이자카야) 적절한 선택
- 지브리 파크 카페 — 관광지 물가 감안 시 정상
- 코인락카 — 여행 필수 지출

**지적 사항:**
- 1일차 로손 ¥9,069 — 편의점 치고 높음 (도착일 대량 구매 추정)
- 카페 지출 비중 높음 — 코메다, 스타벅스, 하리오, 하브스, 블랑지 등 카페만 ¥11,537 (₩107,000), 전체의 15%
- 숙박/교통비 미기록 — 항공, 호텔, 지하철 등 빠져 있음

**총평:**
2박 3일 나고야 여행 식비+기타 ₩71만원은 **적당~약간 넉넉한 수준**. 하루 평균 ₩24만원으로 관광지 식사+카페 포함 시 무리한 소비는 아님. 절약 포인트는 카페 빈도 줄이기.

---

## 기술 환경

- **데이터 소스**: Supabase PostgreSQL (`money_app_01_entries` 테이블)
- **프로젝트 Ref**: omkuaglgzbbjiigxppml
- **MCP 서버**: `@supabase/mcp-server-supabase` (read-only 모드)
- **데이터 접근 방식**: 로컬 서버 API (`http://localhost:3000/api/entries`)를 통해 조회
