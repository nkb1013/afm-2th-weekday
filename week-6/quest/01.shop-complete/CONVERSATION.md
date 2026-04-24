# 자취용품 쇼핑몰 완성 프로젝트 - 대화 기록

## 1. 관리자앱 구축

### 요청
- `week-6/quest/01.shop-complete`에 자취용품 쇼핑몰 관리자앱 생성
- 기존 쇼핑몰(`week-5/quest/06.shopping-mall`) DB 테이블 재사용
- ImageKit으로 상품 이미지 업로드 (드래그앤드롭 + 파일 선택)
- 상품 목록에 업로드된 이미지 표시

### 사용 에이전트
- `single-server-specialist`

### 결과
- `server.js` - Express 서버 (상품 CRUD API, ImageKit 업로드, 대시보드 통계)
- `index.html` - 관리자 UI (다크 사이드바 + 대시보드 + 상품 관리 테이블 + 이미지 업로드 모달)
- `package.json` - dependencies: express, pg, multer, imagekit
- DB 연결 확인: 상품 10개, 사용자 5명 정상 조회

### DB 정보
- URL: `postgresql://postgres.omkuaglgzbbjiigxppml:...@aws-1-us-east-1.pooler.supabase.com:5432/postgres`
- 테이블: `shopping_mall_app_01_products`, `shopping_mall_app_01_users`, `shopping_mall_app_01_cart_items`

### ImageKit 정보
- Public Key: `public_fTaKMYd/TNW4xBUMZ1AQbuWZsiE=`
- URL Endpoint: `https://ik.imagekit.io/4wt2mpclf`

---

## 2. 쇼핑몰(고객용) 페이지 연동

### 요청
- 관리자에서 등록한 상품이 쇼핑몰 페이지에 보여야 함
- `week-6/quest/01.shop-complete`에 쇼핑몰 페이지도 추가

### 결과
- `shop.html` 생성 - 고객용 쇼핑몰 (상품 목록, 카테고리 필터, 로그인/회원가입, 장바구니, 주문)
- `server.js` 업데이트 - 인증 API(register/login/me) + 장바구니 CRUD API 추가
- 라우트 분리: `/shop` → shop.html, `/admin` → index.html, `/` → shop.html
- `index.html` 사이드바에 "쇼핑몰 보기" 링크 추가
- `package.json`에 bcryptjs, jsonwebtoken 추가

---

## 3. 토스페이먼츠 결제 연동

### 요청
- 장바구니에서 결제 페이지로 이동
- 토스페이먼츠 결제 위젯 연동
- 결제 승인 API는 서버에서 호출 (시크릿키 노출 금지)
- 주문 정보를 DB orders 테이블에 저장

### 사용 에이전트
- `tosspayments-widget-integrator` (연동 가이드 조사)

### TossPayments 테스트 키
- 클라이언트키: `test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm`
- 시크릿키: `test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6`

### 결과

#### server.js 추가
- `shopping_mall_app_01_orders` 테이블 자동 생성 (order_id, user_id, order_name, amount, status, payment_key, items, paid_at)
- `POST /api/orders` - 주문 생성 (결제 전 금액 저장)
- `POST /api/payments/confirm` - 서버에서 토스페이먼츠 승인 API 호출 + 금액 위변조 검증
- `GET /api/orders` - 내 주문 목록 조회

#### shop.html 추가
- 토스페이먼츠 SDK v2 CDN 추가 (`https://js.tosspayments.com/v2/standard`)
- `CheckoutPage` - 주문 요약 + 결제위젯(결제수단 선택 + 이용약관) + 결제 버튼
- `PaymentSuccessPage` - 서버 승인 처리 + 완료 화면
- `PaymentFailPage` - 실패/취소 화면
- 장바구니 "주문하기" → "결제하기"로 변경, 결제 페이지로 이동

### 결제 플로우
1. 장바구니 → "결제하기" 클릭 → 결제 페이지
2. 결제 페이지: 주문 요약 + 토스페이먼츠 위젯 렌더링
3. "결제하기" 클릭 → 서버에 주문 생성(`POST /api/orders`) → 토스페이먼츠 결제 요청
4. 결제 성공 → 서버 승인(`POST /api/payments/confirm`) → DB 업데이트 → 장바구니 비우기 → 완료 화면
5. 결제 실패/취소 → 실패 화면 표시

---

## 4. 마이페이지 구축

### 요청
- 로그인한 사용자의 주문 내역 조회
- 각 주문의 상품명/금액/주문일/주문번호 표시
- 본인 주문만 볼 수 있도록 권한 제어

### 결과
- 헤더에 "마이페이지" 버튼 추가 (로그인 시만 표시)
- `MyPage` 컴포넌트 추가:
  - 사용자 정보 (이메일) 표시
  - 주문 내역 목록: 상태 배지(결제완료/대기/실패), 주문명, 주문번호, 금액, 주문일시
  - 아코디언 클릭 시 개별 상품 상세 (상품명 x 수량, 소계)
  - 비로그인 시 로그인 유도 화면
- 권한 제어: `GET /api/orders` API가 `authMiddleware` + `WHERE user_id = $1`로 본인 주문만 조회

---

## 5. Vercel 배포

### 사용 에이전트
- `vercel-deploy-optimizer`

### 결과
- Production URL: https://01shop-complete.vercel.app
- 쇼핑몰: https://01shop-complete.vercel.app/shop
- 관리자: https://01shop-complete.vercel.app/admin
- `vercel.json` 수정: 모든 요청을 server.js로 라우팅
- 환경변수 Vercel 대시보드 등록: `DATABASE_URL`, `TOSS_SECRET_KEY`, `JWT_SECRET`
- 검증: `/api/products`, `/shop`, `/admin` 모두 정상

### 산출물
- `DEPLOY.md` - 배포 결과 정리

---

## 6. 스크린샷

### 요청
- 앱 주요 기능 스크린샷: 상품 목록 → 장바구니 → 결제 → 마이페이지

### 결과 (`screenshots/` 폴더)
| 파일 | 화면 |
|------|------|
| `01-product-list.png` | 상품 목록 (카테고리 필터 + 이미지 + 가격) |
| `02-cart.png` | 장바구니 (컵라면 + 섬유유연제, 총 10,500원) |
| `03-checkout.png` | 결제 페이지 (주문 요약 + 토스페이먼츠 위젯) |
| `04-mypage.png` | 마이페이지 (사용자 정보 + 주문 내역) |

---

## 최종 파일 구조

```
week-6/quest/01.shop-complete/
├── server.js          # Express 서버 (API 전체)
├── index.html         # 관리자 페이지
├── shop.html          # 쇼핑몰 고객 페이지
├── package.json       # 의존성
├── vercel.json        # Vercel 배포 설정
├── DEPLOY.md          # 배포 결과
├── CONVERSATION.md    # 대화 기록 (이 파일)
├── .env.example       # 환경변수 예시
├── take-screenshots.js # 스크린샷 스크립트
└── screenshots/
    ├── 01-product-list.png
    ├── 02-cart.png
    ├── 03-checkout.png
    └── 04-mypage.png
```

## API 엔드포인트 전체 목록

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| GET | /api/products | 상품 목록 | X |
| POST | /api/products | 상품 등록 | X |
| PUT | /api/products/:id | 상품 수정 | X |
| DELETE | /api/products/:id | 상품 삭제 | X |
| GET | /api/stats | 대시보드 통계 | X |
| POST | /api/upload | ImageKit 이미지 업로드 | X |
| POST | /api/auth/register | 회원가입 | X |
| POST | /api/auth/login | 로그인 | X |
| GET | /api/auth/me | 내 정보 | O |
| GET | /api/cart | 장바구니 조회 | O |
| POST | /api/cart | 장바구니 추가 | O |
| PUT | /api/cart/:productId | 수량 변경 | O |
| DELETE | /api/cart/:productId | 항목 삭제 | O |
| DELETE | /api/cart | 장바구니 비우기 | O |
| POST | /api/orders | 주문 생성 | O |
| GET | /api/orders | 내 주문 목록 | O |
| POST | /api/payments/confirm | 결제 승인 | O |
