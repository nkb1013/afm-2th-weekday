# My Fridge 프로젝트 대화 기록

## 1. fridge.json 생성

**사용자:** week-4/quest/my-fridge 폴더에 fridge.json 파일을 만들고 냉장고 재료를 JSON 형식으로 저장해줘. 자취생 냉장고 느낌으로 재료를 8~12개, 카테고리는 냉장/냉동/상온으로 정리.

**Claude:** fridge.json 파일을 생성했습니다. 총 12개 재료를 자취생 냉장고 느낌으로 구성:

```json
{
  "ingredients": [
    { "name": "계란", "quantity": "6개", "category": "냉장" },
    { "name": "김치", "quantity": "1통", "category": "냉장" },
    { "name": "파", "quantity": "2대", "category": "냉장" },
    { "name": "우유", "quantity": "1팩", "category": "냉장" },
    { "name": "슬라이스 치즈", "quantity": "5장", "category": "냉장" },
    { "name": "두부", "quantity": "1모", "category": "냉장" },
    { "name": "냉동밥", "quantity": "3개", "category": "냉동" },
    { "name": "냉동만두", "quantity": "1봉", "category": "냉동" },
    { "name": "냉동 닭가슴살", "quantity": "2팩", "category": "냉동" },
    { "name": "라면", "quantity": "3봉", "category": "상온" },
    { "name": "참치캔", "quantity": "2개", "category": "상온" },
    { "name": "즉석카레", "quantity": "1개", "category": "상온" }
  ]
}
```

- **냉장 (6개)**: 계란, 김치, 파, 우유, 슬라이스 치즈, 두부
- **냉동 (3개)**: 냉동밥, 냉동만두, 냉동 닭가슴살
- **상온 (3개)**: 라면, 참치캔, 즉석카레

---

## 2. 개별 재료 JSON 파일 생성

**사용자:** week-4/quest/my-fridge/ingredients 폴더에 각 재료를 개별 json 파일로 만들어줘.

**Claude:** 12개 재료를 각각 개별 JSON 파일로 생성. 처음에는 한국어 파일명으로 생성:

```
ingredients/
├── 계란.json
├── 김치.json
├── 파.json
├── 우유.json
├── 슬라이스치즈.json
├── 두부.json
├── 냉동밥.json
├── 냉동만두.json
├── 냉동닭가슴살.json
├── 라면.json
├── 참치캔.json
└── 즉석카레.json
```

각 파일 형식:
```json
{
  "name": "계란",
  "quantity": "6개",
  "category": "냉장"
}
```

---

## 3. 파일 이름 영어로 변경

**사용자:** 좋은데, 파일 이름 영어로 해줄래

**Claude:** 모든 파일명을 영어로 rename:

```
ingredients/
├── egg.json
├── kimchi.json
├── green-onion.json
├── milk.json
├── slice-cheese.json
├── tofu.json
├── frozen-rice.json
├── frozen-dumpling.json
├── frozen-chicken-breast.json
├── ramen.json
├── canned-tuna.json
└── instant-curry.json
```

---

## 4. 레시피 스킬 업데이트

**사용자:** .claude/skills/recipe/skill.md의 역할은 ingredients 폴더의 JSON 파일들을 먼저 읽고, 재료를 파악하고, 레시피를 생성/저장해야 해. 1인분 기준, 15분 이내, 자취생 난이도로 작성. 부족한 재료가 있다면 추가 필요 재료를 따로 표시.

**Claude:** skill.md 업데이트 완료. 주요 변경사항:

1. **1단계 변경**: `ingredients/` 폴더의 JSON 파일을 먼저 읽어 재료를 파악하도록 변경
2. **재료 섹션 분리**: "냉장고에 있는 재료" / "추가 필요 재료" (`없어도 가능` / `필수` 표시)
3. **경로 통일**: 모든 파일 경로를 `week-4/quest/my-fridge/` 기준으로 설정
4. **레시피 기준**: 1인분, 15분 이내, 자취생 난이도 명시

---

## 5. 썸네일 이미지 생성 (API 연동)

**사용자:** 이미지 생성 API로 Gemini API Key를 제공.

**Claude:** Gemini API 시도 → 무료 플랜에서 이미지 생성 모델 쿼터가 0으로 제한되어 실패.

- `gemini-2.5-flash-image` → 429 (쿼터 초과)
- `gemini-3-pro-image-preview` → 429 (쿼터 초과)
- `gemini-3.1-flash-image-preview` → 429 (쿼터 초과)
- `imagen-4.0-fast-generate-001` → 유료 플랜 필요

**사용자:** OpenAI API Key로 바꿔줘.

**Claude:** OpenAI DALL-E 3 API로 전환하여 성공!

- `kimchi-fried-rice.png` 썸네일 생성 완료 (약 1.6MB)
- skill.md 3단계에 OpenAI DALL-E 3 curl 명령어 템플릿 추가

---

## 6. /recipe 스킬 실행 테스트

**사용자:** `/recipe` 실행

**Claude:** 스킬 워크플로우대로 실행:

1. **재료 파악**: ingredients/ 폴더의 13개 JSON 파일 읽기
2. **레시피 선택**: 계란 치즈 라면 (라면 + 계란 + 슬라이스 치즈 + 파)
3. **썸네일 생성**: DALL-E 3로 `egg-cheese-ramen.png` 생성 (약 1.9MB)
4. **마크다운 저장**: `recipes/egg-cheese-ramen.md`

최종 결과물:
```
recipes/
├── kimchi-fried-rice.md
├── egg-cheese-ramen.md
└── thumbnails/
    ├── kimchi-fried-rice.png
    └── egg-cheese-ramen.png
```

---

## 최종 프로젝트 구조

```
week-4/quest/my-fridge/
├── fridge.json                    # 전체 재료 목록
├── ingredients/                   # 개별 재료 JSON 파일
│   ├── egg.json
│   ├── kimchi.json
│   ├── green-onion.json
│   ├── milk.json
│   ├── slice-cheese.json
│   ├── tofu.json
│   ├── frozen-rice.json
│   ├── frozen-dumpling.json
│   ├── frozen-chicken-breast.json
│   ├── ramen.json
│   ├── canned-tuna.json
│   └── instant-curry.json
└── recipes/                       # 생성된 레시피
    ├── kimchi-fried-rice.md
    ├── egg-cheese-ramen.md
    └── thumbnails/
        ├── kimchi-fried-rice.png
        └── egg-cheese-ramen.png
```
