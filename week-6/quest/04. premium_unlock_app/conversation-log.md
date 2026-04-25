# BookVault - Premium E-Book Unlock App 대화 기록

> 날짜: 2026-04-25
> 도구: Claude Code (Opus 4.6) + single-react-dev agent + single-server-specialist agent + vercel-deploy-optimizer agent + Chrome CDP
> 배포 URL: https://premium-unlock-app.vercel.app

---

## 1. 프로젝트 시작 - 유료 콘텐츠 잠금 해제 미니앱

### 사용자
> week-6/quest/04. premium_unlock_app 여기에 돈을 낸 사람만 볼 수 있는 유료 콘텐츠 잠금 해제 미니앱을 만들거야. 콘텐츠 주제는 전자책 다운로드야.

### Claude
single-react-dev 에이전트를 실행하여 `index.html` 단일 파일로 전자책 유료 콘텐츠 앱 생성.

**초기 구현 기능:**
- 전자책 4권 카드형 목록 (가격, 잠금 상태 표시)
- 무료 미리보기 (목차/서문)
- 잠금 콘텐츠 blur + 자물쇠 아이콘 오버레이
- 결제 시뮬레이션 (카드번호 입력 폼)
- 잠금 해제 + PDF 다운로드 버튼
- 내 서재 페이지
- localStorage 구매 상태 저장
- 해시 라우팅: `/#/`, `/#/book/:id`, `/#/library`

---

## 2. 토스페이먼츠 결제 + 서버 + DB 연동

### 사용자
> 잠금 콘텐츠에 다음 기능도 추가해줘:
> - 결제 플로우: 토스 결제 위젯 -> 서버 승인 API -> DB purchases 테이블에 기록
> - 열람: purchases에 user_id + content_id가 있으면 본문 공개
> db url: postgresql://postgres.omkuaglgzbbjiigxppml:EQRsyNNjz7UFlDQz@aws-1-us-east-1.pooler.supabase.com:5432/postgres

### Claude
**single-server-specialist 에이전트**로 `server.js` + `package.json` 생성:

**server.js:**
- Express 서버 (포트 3001)
- Supabase PostgreSQL 연결 (pg Pool + SSL)
- 서버 시작 시 `purchases` 테이블 자동 생성
- `POST /api/confirm-payment` - 토스페이먼츠 승인 API 호출 후 DB INSERT
- `GET /api/purchases/:userId` - 구매 목록 조회
- `GET /api/purchases/:userId/:contentId` - 구매 여부 확인
- Vercel 서버리스 대응 (`module.exports = app`)

**index.html 업데이트:**
- 토스페이먼츠 SDK v2 CDN 추가
- PurchaseContext를 localStorage -> 서버 API 기반으로 변경
- PaymentModal을 카드번호 입력 폼 -> TossPaymentWidget으로 교체
- PaymentSuccessHandler 추가 (결제 성공 리다이렉트 처리)
- 잠금 콘텐츠에 "결제하고 열람" 버튼 추가
- 목록 카드에 서문 미리보기 3줄 표시

---

## 3. 토스 결제 위젯 오류 수정

### 사용자
> 토스 결제안되네. @../../toss-payment/ (참고 코드)

### Claude
참고 코드(`week-6/toss-payment/`)와 비교하여 2가지 문제 발견 및 수정:

1. **클라이언트 키 오타**: `test_gck_docs_Ovk5rk1EwkEbP0W23n07xlzm` -> `W43n07xlzm` (23 -> 43)
2. **successUrl 구조 변경**: 토스가 `?paymentKey=&orderId=&amount=`를 자동 추가하므로, 우리 파라미터(`contentId`)만 전달하고 토스 파라미터와 충돌 방지
3. **위젯 초기화 패턴**: 참고 코드와 동일하게 `isRenderedRef`로 한 번만 렌더링
4. **PaymentSuccessHandler**: `paymentKey` 존재 여부로 성공 콜백 감지 (참고 코드 패턴 적용)

---

## 4. 구매 이력 페이지 추가

### 사용자
> 구매 이력 페이지도 만들어줘
> - 로그인한 사용자의 구매한 콘텐츠 목록
> - 언제든 다시 열람 가능 (재결제 X)

### Claude
**PurchaseHistoryPage 컴포넌트 추가** (`/#/history`):
- 상단 요약 카드: 구매 권수 + 총 결제 금액
- 구매한 전자책 리스트: 제목, 저자, 결제일시, 금액, 주문번호
- "열람" 버튼 -> 재결제 없이 바로 상세 페이지 이동
- 빈 상태 UI (구매 기록 없을 때)
- 헤더 네비게이션에 "구매 이력" 탭 추가

**PurchaseContext 확장:**
- `purchaseRecords` 배열에 서버의 상세 정보(날짜, 주문번호) 저장
- `purchaseHistory` computed 값 (책 정보 병합)

---

## 5. Vercel 배포

### 사용자
> Vercel에 배포하고 URL 제출

### Claude
**vercel-deploy-optimizer 에이전트** 실행:
- `vercel.json` 수정 (rewrites -> routes로 변경)
- 환경변수 설정: `DATABASE_URL`, `TOSS_SECRET_KEY`
- `vercel --prod` 배포 성공
- API 엔드포인트 동작 검증 완료

**배포 URL: https://premium-unlock-app.vercel.app**

---

## 6. 대화 기록 + 스크린샷 저장

### 사용자
> 대화 저장해주고 주요기능 앱 스크린샷도 저장해줘

### Claude
Chrome CDP(WebSocket) 직접 스크립트로 스크린샷 6장 촬영:
- `01_book_list.png` - 전자책 목록 (서점)
- `02_locked_content.png` - 상세 페이지 (잠금 상태)
- `02b_locked_chapters.png` - 잠금 챕터들 + "결제하고 열람" 버튼
- `03_payment_widget.png` - 토스페이먼츠 결제 위젯 모달
- `04_my_library.png` - 내 서재
- `05_purchase_history.png` - 구매 이력

---

## 최종 프로젝트 구조

```
week-6/quest/04. premium_unlock_app/
├── index.html          # CDN React + Tailwind 프론트엔드 (토스 결제위젯)
├── server.js           # Express API 서버 (결제 승인 + DB)
├── package.json        # 의존성 (express, pg, cors)
├── vercel.json         # Vercel 배포 설정
├── .env.example        # 환경변수 템플릿
├── conversation-log.md # 이 파일 (대화 기록)
└── screenshots/        # 주요 화면 스크린샷
    ├── 01_book_list.png
    ├── 02_locked_content.png
    ├── 02b_locked_chapters.png
    ├── 03_payment_widget.png
    ├── 04_my_library.png
    └── 05_purchase_history.png
```

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React 18 (CDN) + Tailwind CSS + Babel Standalone |
| 결제 | TossPayments v2 Widget SDK (테스트 모드) |
| 백엔드 | Express.js (Node.js) |
| DB | Supabase PostgreSQL (`purchases` 테이블) |
| 배포 | Vercel (서버리스) |
| 라우팅 | Hash-based (`/#/`, `/#/book/:id`, `/#/library`, `/#/history`) |

## 결제 플로우

```
구매하기 클릭
  -> 토스 결제위젯 모달 (카드/토스페이/페이코/카카오페이/네이버페이)
  -> 결제 진행
  -> successUrl 리다이렉트 (?contentId=N&paymentKey=...&orderId=...&amount=...)
  -> POST /api/confirm-payment (서버에서 토스 승인 API 호출)
  -> DB purchases 테이블 INSERT
  -> 프론트에서 잠금 해제 + 상세 페이지 이동
```
