# atcham 카페 메뉴판 디자인 과정

## 1. 초기 기획

**카페 정보**
- 카페 이름: atcham
- 분위기: cozy
- 타겟 손님: 하루를 시작하기 전 자신의 아침을 평온하고 충만하게 채우고 싶은 손님
- 메뉴 구성: 아침 식사, 커피, 논커피
- 메뉴판 사이즈: 1080 x 1350

---

## 2. 메뉴 구성 확정

### 아침 식사 (Breakfast)
| 메뉴 | 가격 | 비고 |
|------|------|------|
| **atcham 모닝 플레이트** | 14,500 | Signature - 수란, 사워도우 토스트, 아보카도, 제철 샐러드, 과일 |
| 리코타 허니 토스트 | 9,800 | |
| 그래놀라 요거트 볼 | 8,500 | |
| 크로크무슈 | 10,500 | |
| 오늘의 수프 & 빵 | 8,000 | |

### 커피 (Coffee)
| 메뉴 | HOT / ICE | 비고 |
|------|-----------|------|
| **atcham 라떼** | 6,000 / 6,500 | Signature - 갈색설탕 + 오트밀크 |
| 에스프레소 | 4,000 | |
| 아메리카노 | 4,500 / 5,000 | |
| 카페라떼 | 5,500 / 6,000 | |
| 카푸치노 | 5,500 | HOT only |
| 바닐라 라떼 | 6,000 / 6,500 | |
| 콜드브루 | ice 5,500 | ICE only |
| 아인슈페너 | ice 6,500 | ICE only |

### 논커피 (Non-Coffee)
| 메뉴 | HOT / ICE | 비고 |
|------|-----------|------|
| **캐모마일 허니 밀크** | 6,500 / 7,000 | Signature - 캐모마일 + 아카시아 꿀 |
| 말차 라떼 | 6,000 / 6,500 | |
| 얼그레이 밀크티 | 6,000 / 6,500 | |
| 유자 허니티 | 5,500 / 6,000 | |
| 루이보스 | 5,000 | HOT only |
| 핫초코 | 6,000 / 6,500 | |
| 딸기 바나나 스무디 | ice 7,000 | ICE only |

---

## 3. 디자인 이터레이션

### v1 - 초기 디자인
- 컬러: cream `#F5F0E8` / deep brown `#3C2A1A` / terracotta `#C17B4A`
- 폰트: Playfair Display + Noto Sans KR
- 시그니처 카드에 이모지 아이콘 사용
- 점선 리더로 메뉴-가격 연결
- 커피/논커피 2컬럼 그리드

### v2 - Apple HIG + Adobe Spectrum 리디자인
- 컬러: warm off-white `#F5F4F0` / Apple gray `#1D1D1F` / amber `#A56B3A`
- 폰트: Inter (SF Pro 대응) + Playfair Display (브랜드 전용)
- CSS 커스텀 프로퍼티 기반 디자인 토큰 시스템
- 점선 리더 제거 -> space-between + subtle border-bottom
- 시그니처 카드: 순백 surface + multi-layer box-shadow
- tabular-nums로 가격 숫자폭 정렬
- 8px 그리드 기반 spacing

### v3 - DALL-E 이미지 + 플랫 스타일
- OpenAI DALL-E 3로 시그니처 메뉴 이미지 3장 생성
  - morning-plate.png: 오버헤드 푸드 포토
  - atcham-latte.png: 핸드메이드 세라믹 컵 라떼
  - chamomile-milk.png: 캐모마일 허니 밀크 머그
- border-radius 전부 제거 (사용자 요청)
- box-shadow 전부 제거 (사용자 요청)
- 카드 경계를 1px solid border로 처리

### v4 - 레퍼런스 기반 귀여운 스타일
- 레퍼런스 2장 분석:
  - "Cozy Brunch Menu": 세이지 그린 장식 테두리, 코랄 카테고리 태그, 일러스트 배치
  - "Our Summer Mansion": 버터색 배경, 원형 푸드 포토, 손글씨체
- 컬러: butter `#FEF6E4` / sage `#7EA07A` / coral `#D4603A` / brown `#3A2E25`
- 폰트: Caveat (영문 손글씨) + Gamja Flower (한글 손글씨) + Inter (가격)
- 세이지 그린 테두리 + L자 코너 장식 (CSS border)
- 시그니처 3장 원형 포토 쇼케이스 상단 배치
- 코랄색 border-top + border-left 카테고리 태그

### v5 - 최종 (누끼 스티커 스타일)
- OpenAI gpt-image-1 + `background: "transparent"` 로 투명배경 누끼 이미지 3장 재생성
- 원형 크롭 제거 -> 음식 자체의 자연스러운 실루엣
- CSS 스티커 효과:
  - 4방향 `drop-shadow(2px, white)` 흰색 윤곽선
  - `drop-shadow(0 5px 10px)` 부유 그림자
  - drop-shadow가 알파채널을 따라 음식 형태대로 윤곽+그림자 생성
- 수평 정렬 통일 (rotate/translateY 제거, width 고정)
- 폰트 사이즈 전반 +2~4px 상향

---

## 4. 최종 디자인 스펙

### 컬러 팔레트
| 토큰 | 값 | 용도 |
|------|-----|------|
| --butter | #FEF6E4 | 배경 |
| --sage | #7EA07A | 테두리, 장식 |
| --coral | #D4603A | 카테고리 태그, 시그니처 뱃지, 가격 강조 |
| --brown | #3A2E25 | 본문 텍스트 |
| --muted | #9B8E7E | 보조 텍스트 |

### 폰트
| 폰트 | 용도 |
|------|------|
| Caveat 700 | 브랜드명, 영문 카테고리 타이틀, 시그니처 뱃지 |
| Gamja Flower | 한글 메뉴명, 한글 카테고리 서브타이틀 |
| Inter 300-500 | 가격, 온도 라벨, ice 태그 |

### 이미지 생성
- 모델: OpenAI gpt-image-1
- 설정: 1024x1024, background: "transparent"
- 3장: morning-plate.png, atcham-latte.png, chamomile-milk.png

### 파일 구조
```
01.cafe-menu/
  index.html          - 최종 메뉴판 HTML
  conversation.md     - 디자인 과정 기록
  menu-final.png      - 최종 메뉴판 이미지
  images/
    morning-plate.png  - 모닝 플레이트 누끼
    atcham-latte.png   - atcham 라떼 누끼
    chamomile-milk.png - 캐모마일 허니 밀크 누끼
  reference/
    Cozy Brunch Menu Mockup.jpeg
    menu.jpeg
```
