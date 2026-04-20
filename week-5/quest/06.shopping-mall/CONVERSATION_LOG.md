# 자취마켓 쇼핑몰 앱 - 대화 로그

## 1단계: 프론트엔드 생성 (single-react-dev 에이전트)

**요청:**
> week-5/quest/06.shopping-mall 쇼핑몰 앱을 만들거야.
>
> 1. 상품 목록을 만들어줘.
> - 상품명, 가격, 이미지, 간단한 설명
> - 상품 목록은 로그인 없이도 누구나 볼 수 있게 해줘
>
> 2. 회원가입 & 로그인 창이 있어야해
> - 장바구니를 사용하려면 로그인이 필요하도록 만들어줘
>
> 3. 로그인한 사용자가 상품을 장바구니에 담고 관리할 수 있게 해줘
> - 담기: 상품 목록에서 "장바구니 담기" 버튼 클릭
> - 조회: 내 장바구니에 담긴 상품 목록 보기
> - 수량 변경: +/- 버튼으로 수량 조절
> - 삭제: 장바구니에서 상품 제거
> - 합계: 총 금액 자동 계산

**결과:**
- `index.html` 생성 (CDN React 18 + Tailwind CSS 단일 파일)
- 10개 자취생 테마 상품 (신라면, 즉석밥, 계란, 삼겹살 등)
- localStorage 기반 인증/장바구니
- 카테고리 필터, 토스트 알림, 주문 확인 모달
- 반응형 그리드 (2열 모바일 / 3열 태블릿 / 4열 데스크탑)

---

## 2단계: 서버 생성 & DB 연결 (single-server-specialist 에이전트)

**요청:**
> 여기에 실제 서버 만들고 DB 연결해줘
>
> db url: postgresql://postgres.omkuaglgzbbjiigxppml:EQRsyNNjz7UFlDQz@aws-1-us-east-1.pooler.supabase.com:5432/postgres
>
> table prefix: shopping_mall_app_01

**결과:**

### 생성된 파일
- `server.js` — Express 5 + PostgreSQL + JWT 인증
- `package.json` — express, pg, bcryptjs, jsonwebtoken 의존성
- `vercel.json` — Vercel 배포 설정

### DB 테이블 (prefix: shopping_mall_app_01)
- `shopping_mall_app_01_users` — id, email, password(bcrypt), nickname, created_at
- `shopping_mall_app_01_products` — id, name, price, description, category, image_url, created_at
- `shopping_mall_app_01_cart_items` — id, user_id, product_id, quantity, created_at (UNIQUE: user_id + product_id)

### API 엔드포인트

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/api/products` | X | 상품 목록 (10개 시드 데이터) |
| POST | `/api/auth/register` | X | 회원가입 |
| POST | `/api/auth/login` | X | 로그인 |
| GET | `/api/auth/me` | O | 토큰 검증 (자동 로그인) |
| GET | `/api/cart` | O | 장바구니 조회 (상품 정보 JOIN) |
| POST | `/api/cart` | O | 장바구니 담기 (중복 시 수량+1, UPSERT) |
| PUT | `/api/cart/:productId` | O | 수량 변경 |
| DELETE | `/api/cart/:productId` | O | 상품 제거 |
| DELETE | `/api/cart` | O | 장바구니 비우기 |

### 프론트엔드 수정 사항
- **Auth**: localStorage → JWT 서버 인증 (`/api/auth/*`)
  - 토큰을 `localStorage('jachi_token')`에 저장
  - 모든 인증 필요 API에 `Authorization: Bearer {token}` 헤더 전송
  - 앱 시작 시 `/api/auth/me`로 자동 로그인
- **Products**: 하드코딩 배열 → `GET /api/products`에서 로드
  - `useProducts()` 훅 추가
- **Cart**: localStorage → 서버 API (`/api/cart/*`)
  - `addItem`, `removeItem`, `updateQuantity`, `clearCart` 모두 async
  - 로그인 시 서버에서 장바구니 자동 로드
  - `item.id` → `item.product_id`로 키 변경

### 서버 패턴
- Lazy DB 초기화 (cold start 대응)
- `module.exports = app` + `if (require.main === module)` 듀얼 모드
- 상품 시드 데이터 자동 삽입 (테이블 비어있을 때만)
- UPSERT로 장바구니 중복 담기 처리

### API 테스트 결과
```
=== 상품 목록 (인증 불필요) ===
success: True, count: 10
  1. 신라면 멀티팩 - 4480원 [라면]
  2. 즉석밥 12개입 - 11900원 [즉석식품]
  ...

=== 회원가입 ===
{ success: true, data: { token: "eyJ...", user: { id: 1, nickname: "쇼핑왕" } } }

=== 장바구니 담기 ===
{ success: true, data: { product_id: 1, quantity: 1, name: "신라면 멀티팩", price: 4480 } }

=== 수량 변경 ===
{ success: true, data: { product_id: 1, quantity: 3 } }
```

---

## 3단계: 상품 이미지 업데이트

**요청:**
> 지금 올라와있는 상품 이미지들이 상품 항목이랑 안맞네. unsplash 이미지 써서 이미지 업데이트해줘

**결과:**

### 변경 사항
- DB에 `image_url` 컬럼 추가 (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`)
- 기존 picsum.photos 랜덤 이미지 → Unsplash 상품별 매칭 이미지로 교체
- 서버: 신규 삽입 시 image_url 포함 / 기존 데이터는 UPDATE로 이미지 적용
- 프론트: `product.image_url` 우선 사용, 없으면 picsum 폴백
- 장바구니 JOIN 쿼리에도 `p.image_url` 포함

### 상품별 이미지 매핑
| 상품 | Unsplash 이미지 |
|------|----------------|
| 신라면 멀티팩 | 라면 사진 |
| 즉석밥 12개입 | 쌀밥 사진 |
| 김치찌개 밀키트 | 찌개/스튜 사진 |
| 계란 30구 | 계란 사진 |
| 삼겹살 500g | 고기 사진 |
| 참이슬 소주 4팩 | 술/음료 사진 |
| 바나나우유 6개입 | 우유 사진 |
| 키친타올 6롤 | 키친타올 사진 |
| 섬유유연제 2.5L | 세제 사진 |
| 컵라면 6개 세트 | 컵라면 사진 |

---

## 실행 방법

### 로컬 실행
```bash
cd week-5/quest/06.shopping-mall
npm install
DATABASE_URL="postgresql://postgres.omkuaglgzbbjiigxppml:EQRsyNNjz7UFlDQz@aws-1-us-east-1.pooler.supabase.com:5432/postgres" npm start
```

### Vercel 배포
```bash
cd week-5/quest/06.shopping-mall
vercel --prod
# 환경변수 설정: DATABASE_URL, JWT_SECRET
```

---

## 파일 구조
```
week-5/quest/06.shopping-mall/
├── index.html        # React 프론트엔드 (CDN 기반 단일 파일)
├── server.js         # Express 5 + PostgreSQL 백엔드
├── package.json      # Node.js 의존성
├── package-lock.json
└── vercel.json       # Vercel 배포 설정
```

## 기술 스택
- **Frontend**: React 18 (CDN) + Tailwind CSS + Babel Standalone
- **Backend**: Express 5 + Node.js
- **Database**: PostgreSQL (Supabase)
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Deploy**: Vercel (서버리스)
