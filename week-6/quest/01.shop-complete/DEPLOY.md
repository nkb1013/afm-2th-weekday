# 자취용품 쇼핑몰 - Vercel 배포 결과

## 배포 정보

| 항목 | 값 |
|------|------|
| Production URL | https://01shop-complete.vercel.app |
| 쇼핑몰 (고객용) | https://01shop-complete.vercel.app/shop |
| 관리자 페이지 | https://01shop-complete.vercel.app/admin |
| Inspect URL | https://vercel.com/nkb1013s-projects/01.shop-complete/A6ezmbp2b9Eoo4UezTPiDXVWbE5S |
| 프로젝트 | nkb1013s-projects/01.shop-complete |
| 배포일 | 2026-04-24 |

## 환경변수 (Vercel 대시보드 등록)

| 변수명 | 설명 |
|--------|------|
| DATABASE_URL | Supabase PostgreSQL 연결 문자열 |
| TOSS_SECRET_KEY | 토스페이먼츠 시크릿키 (서버 전용) |
| JWT_SECRET | JWT 인증 서명 키 |

## 주요 기능

- 쇼핑몰: 상품 목록, 카테고리 필터, 회원가입/로그인, 장바구니, 토스페이먼츠 결제, 마이페이지 주문내역
- 관리자: 대시보드 통계, 상품 CRUD, ImageKit 이미지 업로드

## 기술 스택

- Frontend: React 18 + Tailwind CSS (CDN)
- Backend: Express.js (Node.js)
- Database: PostgreSQL (Supabase)
- 결제: TossPayments Widget v2
- 이미지: ImageKit
- 배포: Vercel

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/products | 상품 목록 |
| POST | /api/products | 상품 등록 (관리자) |
| PUT | /api/products/:id | 상품 수정 (관리자) |
| DELETE | /api/products/:id | 상품 삭제 (관리자) |
| GET | /api/stats | 대시보드 통계 |
| POST | /api/upload | ImageKit 이미지 업로드 |
| POST | /api/auth/register | 회원가입 |
| POST | /api/auth/login | 로그인 |
| GET | /api/auth/me | 내 정보 |
| GET | /api/cart | 장바구니 조회 |
| POST | /api/cart | 장바구니 추가 |
| PUT | /api/cart/:productId | 장바구니 수량 변경 |
| DELETE | /api/cart/:productId | 장바구니 항목 삭제 |
| DELETE | /api/cart | 장바구니 비우기 |
| POST | /api/orders | 주문 생성 |
| GET | /api/orders | 내 주문 목록 |
| POST | /api/payments/confirm | 결제 승인 (서버) |

## 검증 결과

| 엔드포인트 | 상태 |
|------------|------|
| /api/products | 정상 (10개 상품 반환) |
| /shop | 정상 |
| /admin | 정상 |
