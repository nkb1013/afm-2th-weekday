# Noting Curator 명함 디자인 대화 기록

## 1. 초기 요청

**사용자:**
week-7/quest/03.busn-card 여기에 내 명함 하나 디자인 해줘

앞면에는 아래 정보만 넣어줘:
- Noting Curator
- Keumbi Noh

뒷면에는 아래 정보만 넣어줘:
- 지금 알아차리고 있나요
- thenoting.curator@gmail.com
- @the.noting_
- QR 코드 들어갈 자리

디자인 방향:
- 여백이 많은 고급스러운 디자인

**Claude:**
`index.html` 파일을 생성하여 명함 앞/뒷면을 디자인함.

디자인 요약:
- **앞면**: 중앙 정렬, 여백 극대화. "NOTING CURATOR" (Cormorant Garamond 세리프) + 얇은 구분선 + "KEUMBI NOH" (부드러운 톤다운 컬러)
- **뒷면**: 좌측에 "지금 알아차리고 있나요" (Noto Serif KR) + 이메일/인스타 아이콘 포함, 우측에 QR 코드 플레이스홀더
- **톤**: 크림 배경(#faf8f5) + 차콜 텍스트 + 웜 베이지 포인트
- 인쇄용 `@media print` 스타일 포함 (90mm x 50mm)

---

## 2. 서브 타이틀 추가

**사용자:**
noting curator 아래에 작게 '알아차림 명상 큐레이터' 라고 적어줘

**Claude:**
"NOTING CURATOR" 바로 아래에 Noto Serif KR 폰트로 "알아차림 명상 큐레이터"를 작고 부드러운 톤(#a09788)으로 추가함.

---

## 3. 간격 조정

**사용자:**
noting curator랑 알아차림 명상 큐레이터 사이를 줄여줘

**Claude:**
`.role`의 margin-bottom을 20px에서 6px으로 줄여 두 텍스트 사이 간격을 좁힘.

---

## 4. 이미지 저장

**사용자:**
완성된 이미지 파일 여기에 저장해주고 지금까지의 우리의 대화도 하나의 파일에다 넣어줘

**Claude:**
Playwright로 스크린샷 캡처하여 3개 이미지 저장:
- `business-card-front.png` - 앞면
- `business-card-back.png` - 뒷면
- `business-card-full.png` - 전체 (앞면 + 뒷면)

대화 기록을 `conversation.md`로 저장.

---

## 최종 산출물

| 파일 | 설명 |
|------|------|
| `index.html` | 명함 디자인 원본 (HTML/CSS) |
| `business-card-front.png` | 앞면 이미지 |
| `business-card-back.png` | 뒷면 이미지 |
| `business-card-full.png` | 전체 이미지 |
| `conversation.md` | 이 대화 기록 |
