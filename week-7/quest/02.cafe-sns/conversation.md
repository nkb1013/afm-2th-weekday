# atcham 카페 신메뉴 SNS 포스터 디자인 과정

## 1. 신메뉴 정의

**앗참(atcham) 컨셉 분석**
- 슬로건: "a calm morning, a full beginning"
- 타겟: 하루를 시작하기 전 평온하고 충만한 아침을 원하는 손님
- 기존 시그니처: 갈색설탕 오트 라떼, 캐모마일 허니 밀크, 모닝 플레이트
- 톤: 따뜻하고 수제 느낌 (butter/sage/coral/brown)

**신메뉴 확정**

| 항목 | 내용 |
|------|------|
| 메뉴명 | 호지차 오트 크림 라떼 (Hojicha Oat Cream Latte) |
| 가격 | HOT 6,500 / ICE 7,000 |
| 한 줄 설명 | 은은한 고소함 위에 오트 크림이 포근하게 내려앉는, 아침을 위한 한 잔 |
| 태그 | 여름 한정 (Summer Limited) |

**선정 이유**
1. 브랜드 핏 — 호지차(볶은 녹차)는 저카페인 + 고소하고 따뜻한 풍미. "calm morning" 컨셉과 부합
2. 글로벌 트렌드 — 2025~26 런던/도쿄/NYC 스페셜티 카페에서 호지차 급부상
3. SNS 비주얼 — 앰버-카라멜 톤 + 흰 오트 크림 레이어드 비주얼
4. 여름 한정 포지셔닝 — 구매 긴급성 + 아이스 버전으로 시즌 매출 견인

---

## 2. 후킹 카피

**메인 카피**: 고소하게 물드는 아침
**보조 정보**: 여름 한정 · 6,500원부터

- "고소하게 물드는" — 호지차의 핵심 풍미 + 크림이 번지는 비주얼을 동시에 암시
- "아침" — atcham 브랜드 키워드 연결
- 4단어로 여백 확보, 시선 분산 없음

---

## 3. 포스터 디자인 요구사항

- 사이즈: 1080×1350 (인스타 4:5)
- 신메뉴 사진/일러스트가 포스터의 50% 이상 차지
- 빅 타이포그래피 + 강조색으로 카피 부각

---

## 4. 디자인 이터레이션

### v1 — 초기 디자인
- 상단: atcham 브랜드 + Summer Limited 뱃지
- 중앙: 음료 이미지 (560px) + 원형 베이지 배경
- 하단: 다크 브라운 배경에 메인 카피 + 메뉴명 + 가격/기간
- 컬러: butter/sage/coral/brown 팔레트
- 폰트: Caveat (영문 손글씨) + Gamja Flower (한글) + Inter (가격)

### v2 — 모바일 가독성 개선
- 전체 폰트 사이즈 대폭 상향 (1080px → 모바일 375px 축소 시 최소 38px 이상)
- brand 36→48px, badge 14→28px, 메뉴명 32→56px, 메인카피 72→88px 등

### v3 — 레퍼런스 기반 리디자인
- 레퍼런스 2장 분석:
  - Kenshi (@kenken_morning): 재료 라벨 + 가느다란 선으로 음식 위에 직접 표기
  - Weekly Taste: 큰 손글씨가 음식 위아래 배치, 음식이 주인공
- 음료 이미지 중앙 배치 + 재료 3개를 선으로 연결하는 방식으로 전환
- 재료 라벨: Oat Cream / Hojicha / Oat Milk

### v4 — 하단 다크 배경 제거 + Kalam 폰트
- Caveat → Kalam 폰트 교체
- 하단 다크 브라운 배경 제거, butter 배경 통일
- 메뉴명(한글+영문) 중앙 정렬
- 한글 메뉴명 제거, 영문만 상단에 크게 배치

### v5 — AI 손글씨 이미지 생성
- 웹폰트 대신 OpenAI gpt-image-1로 realistic 손글씨 라벨 이미지 3장 생성
  - label-cream.png: "Oat Cream / 오트 크림"
  - label-hojicha.png: "Hojicha / 호지차"
  - label-oatmilk.png: "Oat Milk / 오트밀크"
- 투명 배경 PNG, 볼펜 필기 스타일

### v6 — 체크포인트 기반 정밀 조정
- 이미지 50%+ 확보: 560px → 680px (포스터 높이의 50.4%)
- 포인트 컬러 강화: #D4603A → #E8491A (비비드 오렌지)
- 가격/기간 명확하게: 사이즈 줄이되 font-weight 600
- 인스타 모바일 프리뷰 목업 추가 (iPhone 프레임 + 인스타 UI)

### v7 — 이미지 센터링 + 라벨 연결 수정
- 이미지 중앙 정렬: hero top 230→300px (가용 공간 정중앙 655px에 맞춤)
- 오트밀크 연결선 방향 및 위치 수정

### v8 — 폰트 역할 분리 + 위치 미세조정
- atcham 브랜드: Kalam → DM Serif Display (클래식 세리프, 차별화)
- 메인카피 + 해시태그: Gamja Flower → Gowun Batang (단정한 명조체)
- 영문 메뉴명: Kalam 유지 (손글씨 느낌)
- 하단 카피 영역 위로 올림 (bottom: 0 → 36px)

### v9 — Figma 전환 + 최종 확정
- HTML 포스터를 Figma로 이관하여 요소별 직접 조정
- 사용자가 Figma에서 직접 수정한 최종 레이아웃:
  - 기간(2026.6.1-8.31)을 상단으로 이동
  - 가격을 메뉴명 바로 아래 배치
  - "고소하게 물드는 아침" 카피 제거 → 비주얼 중심으로 단순화
  - 해시태그 + atcham 로고만 하단에 깔끔하게 마무리

---

## 5. 최종 디자인 스펙

### 레이아웃 (위→아래)
1. SUMMER LIMITED 뱃지 (우상단)
2. 기간: 2026. 6. 1 - 8. 31
3. Hojicha Oat Cream Latte (Kalam 손글씨)
4. 6,500
5. 음료 이미지 (680px) + 재료 손글씨 라벨 3개 (선 연결)
6. #여름한정 #카페인프리 #건강라떼 #다이어트
7. atcham (DM Serif Display)

### 컬러 팔레트
| 토큰 | 값 | 용도 |
|------|-----|------|
| --butter | #FEF6E4 | 배경 |
| --accent | #E8491A | 뱃지, 포인트 |
| --brown | #3A2E25 | 본문, 라벨 |
| --sage | #7EA07A | 해시태그 |
| --muted | #9B8E7E | 보조 텍스트 |

### 폰트
| 폰트 | 용도 |
|------|------|
| DM Serif Display | 브랜드 로고 |
| Kalam 700 | 영문 메뉴명 |
| Gowun Batang | 한글 카피 (최종에서 제거됨) |
| Inter | 가격, 기간, 뱃지 |

### 이미지 생성
- 모델: OpenAI gpt-image-1
- hojicha-latte.png: 호지차 오트크림 라떼 누끼 (1024x1024, transparent)
- label-cream.png: 손글씨 "Oat Cream / 오트 크림" (1024x1024, transparent)
- label-hojicha.png: 손글씨 "Hojicha / 호지차" (1024x1024, transparent)
- label-oatmilk.png: 손글씨 "Oat Milk / 오트밀크" (1024x1024, transparent)

### 파일 구조
```
02.cafe-sns/
  index.html              - HTML 포스터 (작업 과정용)
  conversation.md         - 디자인 과정 기록 (이 파일)
  poster-final.png        - 최종 포스터 이미지
  images/
    hojicha-latte.png      - 호지차 라떼 누끼
    label-cream.png        - 손글씨 라벨: Oat Cream
    label-hojicha.png      - 손글씨 라벨: Hojicha
    label-oatmilk.png      - 손글씨 라벨: Oat Milk
  reference/
    kenshi (@kenken_morning) on Threads.jpeg
    Contact me for collaborations.jpeg
```

### Figma 파일
https://www.figma.com/design/TMbNDM1qtoVVUfTuVOTQfO