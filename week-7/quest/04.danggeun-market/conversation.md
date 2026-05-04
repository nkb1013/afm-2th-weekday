# 당근마켓 클론 프로젝트 대화 기록

## 1. 초기 앱 생성

**사용자:** 당근마켓 앱을 똑같이 만들어볼거야. 회원가입&로그인 기능 넣어줘. 가입 과정에는 이메일 가입과 동네설정(직접 입력 또는 위치 인증)을 해야해.

**Claude:** `single-react-dev` 에이전트로 단일 `index.html` 파일 생성 (React + Tailwind CDN 기반, 1,548줄)

구현 내용:
- 당근마켓 오렌지(#FF6F0F) 테마, 모바일 퍼스트(430px), Pretendard 폰트
- 해시 라우팅: #home, #community, #write, #chat, #mypage, #login, #signup
- 2단계 회원가입: 기본정보 → 동네설정 (Geolocation API 또는 직접 검색)
- 더미 데이터: 상품 10개, 커뮤니티 4개, 채팅 4개
- localStorage 기반 인증 및 데이터 저장

---

## 2. 상품 등록 기능 (ImageKit + Supabase)

**사용자:** 상품 등록 기능 추가해줘. 이미지(최대 3장) + 제목 + 가격 + 설명 + 카테고리. 본인만 수정/삭제 가능(RLS)

**Claude:** `imagekit-uploader` 에이전트로 백엔드 서버 구축 + 프론트엔드 연동

### 서버 (server.js)
- Express + ImageKit (이미지 업로드) + PostgreSQL/Supabase (상품 CRUD) + JWT 인증
- `POST /api/upload` — 최대 3장 이미지 업로드 (multer + ImageKit SDK)
- `POST /api/signup`, `POST /api/login`, `GET /api/me` — 사용자 인증
- `GET/POST/PUT/DELETE /api/products` — 상품 CRUD (본인만 수정/삭제)
- DB 테이블 자동 생성 (users, products)

### 프론트엔드 (index.html) 변경
- AuthProvider: localStorage → 서버 API (JWT 토큰 기반) 전환
- ProductsProvider: 서버에서 상품 목록 fetch + CRUD 연동
- WritePage: 실제 이미지 파일 선택/미리보기/업로드 + 서버에 상품 등록
- ProductDetailPage: 본인 상품이면 삭제 버튼 표시, 여러 이미지 갤러리
- LoginPage/SignupPage: async 서버 API 호출로 전환

### ImageKit 정보
- publicKey: `public_fTaKMYd/TNW4xBUMZ1AQbuWZsiE=`
- urlEndpoint: `https://ik.imagekit.io/4wt2mpclf`
- Upload folder: `/danggeun`

### Supabase PostgreSQL
- connectionString: `postgresql://postgres.omkuaglgzbbjiigxppml:...@aws-1-us-east-1.pooler.supabase.com:5432/postgres`

---

## 3. 상품 목록 개선 + 상세 페이지 강화

**사용자:** 상품 목록은 최신순 목록 + 카테고리 필터 + 키워드 검색 기능 추가해주고, 상세 페이지는 이미지 슬라이드, 정보, 작성자, "관심" 버튼 기능 추가해줘

**Claude:**

### HomePage 개선
- 최신순 정렬 (createdAt 기준)
- 카테고리 필터 칩 (상단 가로 스크롤, 등록된 카테고리 자동 수집)
- 키워드 통합 검색 (제목 + 설명 + 카테고리)
- 검색 결과 없을 때 "전체 보기" 버튼

### ProductDetailPage 강화
- 터치 스와이프 이미지 슬라이드 (CSS transform + 인디케이터 + 페이지 카운터)
- 작성자 섹션: 프로필 확대, 매너온도 게이지 바 + 이모지
- 상품 정보 정리: 카테고리, 등록 시간, 조회수
- 하단 관심 버튼: 하트 아이콘 + "관심" 라벨, 오렌지 색상 토글

---

## 4. 이미지 슬라이드 버그 수정

**사용자:** 상세페이지 이미지 슬라이드 안되는데

**Claude:** flex 컨테이너 안에서 이미지 크기가 안 잡히는 문제. `min-w-full` 추가하여 해결.

---

## 5. 채팅 기능 추가

**사용자:** 채팅 기능 넣어줘. 상품 상세에서 "채팅하기" 버튼 → 판매자와 1:1 채팅. Polling으로 실시간 메시지.

**Claude:**

### 서버 API 추가
- DB 테이블: `chat_rooms` (product_id, buyer_id, seller_id), `messages` (room_id, sender_id, content)
- `POST /api/chat/rooms` — 채팅방 생성 또는 기존 방 반환
- `GET /api/chat/rooms` — 내 채팅방 목록 (마지막 메시지, 읽지 않은 수 포함)
- `GET /api/chat/rooms/:id/messages` — 메시지 조회 (after 파라미터로 증분 로드)
- `POST /api/chat/rooms/:id/messages` — 메시지 전송

### 프론트엔드
- ChatPage: 서버에서 채팅방 목록 fetch (5초 폴링)
- ChatRoomPage: 1:1 메시지 UI (카카오톡 스타일 말풍선, 날짜 구분선, 2초 폴링, 자동 스크롤)
- ProductDetailPage: "채팅하기" 버튼 → 채팅방 생성 후 이동
- 채팅방 상단에 상품 정보 표시
- 채팅방에서는 하단 탭 숨김
- 라우팅: `#chat-room-{id}` 추가

---

## 6. 마이페이지 개선

**사용자:** 마이페이지에 내가 등록한 상품 / 관심 상품 / 채팅 목록 볼수있게 해줘

**Claude:**

### MyPage 리디자인
- 기존 아이콘 버튼 → 탭 UI 전환 (내 상품 / 관심목록 / 채팅)
- 활성 탭에 오렌지 언더라인 + 카운트 표시
- **내 상품**: 서버에 등록한 상품 필터 (userId 매칭), 없으면 "글쓰기" 바로가기
- **관심목록**: 하트 누른 상품 모아보기
- **채팅**: 서버 채팅방 목록 (상대방, 마지막 메시지, 상품 이미지, 읽지 않은 수)
- 각 항목 클릭 시 해당 상세/채팅방으로 이동

---

## 7. Vercel 배포

**사용자:** vercel 배포 해줘

**Claude:** `vercel-deploy-optimizer` 에이전트로 배포

- `vercel.json` 생성 (server.js → @vercel/node, index.html → @vercel/static)
- `server.js`에 `if (require.main === module)` 가드 추가 (serverless 호환)
- `.vercelignore` 생성
- `vercel --prod` 실행

**배포 URL:** https://04danggeun-market.vercel.app

---

## 최종 파일 구성

| 파일 | 설명 |
|------|------|
| `index.html` | React + Tailwind CDN 기반 프론트엔드 (전체 UI) |
| `server.js` | Express 백엔드 (ImageKit + PostgreSQL + JWT + 채팅) |
| `package.json` | 의존성 (express, imagekit, pg, bcryptjs, jsonwebtoken 등) |
| `vercel.json` | Vercel 배포 설정 |
| `.vercelignore` | 배포 제외 파일 |
| `conversation.md` | 이 대화 기록 |

## 기술 스택

- **Frontend**: React 18 (CDN) + Tailwind CSS + Babel
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (Supabase)
- **Image Storage**: ImageKit
- **Auth**: JWT + bcrypt
- **Deploy**: Vercel (Serverless)
