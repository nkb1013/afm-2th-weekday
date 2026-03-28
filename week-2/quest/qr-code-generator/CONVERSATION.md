# QR코드 생성기 (QR Code Generator) - 대화 내용 정리

## 1차: 앱 생성

**요청:** 텍스트나 URL을 입력하면 QR코드를 생성하고, 미리보기 + PNG 다운로드 기능 구현.

**구현 내용:**
- React + Tailwind CSS CDN 기반 단일 HTML 파일
- `qrcode` npm 패키지(CDN)로 QR 생성
- 실시간 QR코드 생성 (300ms 디바운스)
- 빠른 입력 프리셋 (웹사이트, 이메일, 전화번호, Wi-Fi)
- QR코드 크기, 색상, 배경색, 오류 복원 수준 커스터마이징
- PNG 다운로드

## 2차: 실시간 생성 및 버튼 수정

**요청:** 입력 시 QR코드가 실시간으로 미리보기에 표시되도록 수정. 버튼 텍스트 줄바꿈 방지.

**수정 내용:**
- 디바운스 제거 → 즉시 생성
- canvas `display: none/block` 전환 방식으로 미리보기 수정
- Button 컴포넌트에 `whitespace-nowrap` 추가, 사이즈 조정

## 3차~5차: 검은 배경 overlay 버그 디버깅

**문제:** 입력창이나 버튼 클릭 시 화면에 검은 배경이 나타나는 버그 반복 발생.

**시도한 해결 방법:**
1. `-webkit-tap-highlight-color: transparent` 적용
2. `transition-all` → `transition-colors` 변경
3. `focus:outline-none` 전역 적용
4. `input[type="color"]` 커스텀 스타일링
5. `QRCode.toCanvas` → `QRCode.toDataURL` + `<img>` 태그로 전환
6. Tailwind CSS 완전 제거, 순수 CSS만 사용
7. React production 빌드 사용
8. Google Fonts `@import` 제거
9. JSX 제거 → `React.createElement` 직접 사용

**결론:** React/Babel/Tailwind 조합이 원인으로, 위 수정으로는 해결되지 않음.

## 6차: 디버깅용 최소 테스트 페이지 생성

**요청:** textarea 1개 + button 1개만 있는 최소 테스트 페이지(`test.html`)로 원인 분리.

**결과:** `test.html`(순수 HTML)에서는 문제 없음 → 앱 프레임워크(React/Babel)가 원인 확정.

## 7차: 완전 독립 파일로 재구현 (최종 해결)

**요청:** 기존 코드 재사용 없이 `qr-code-generator-2.html`을 순수 HTML/CSS/JS로 새로 구현.

**구현 내용:**
- React, Babel, Tailwind 전부 미사용
- `qrcodejs` 라이브러리 (브라우저 전용, file:// 에서도 동작)
- `new QRCode(element, options)` → DOM에 직접 렌더링
- canvas에서 `toDataURL("image/png")` 추출하여 다운로드
- 파일 더블클릭으로 브라우저에서 바로 실행 가능

**결과:** 검은 배경 버그 해결, QR 생성/미리보기/다운로드 모두 정상 동작.

## 핵심 교훈

| 문제 | 원인 | 해결 |
|------|------|------|
| 검은 배경 overlay | React/Babel/Tailwind CDN 조합의 렌더링 부작용 | 순수 HTML/CSS/JS로 전환 |
| QR코드 미생성 | `qrcode` npm 패키지가 file:// 프로토콜에서 전역 객체 미노출 | `qrcodejs` 브라우저 전용 라이브러리로 교체 |

## 최종 파일 구조

```
qr-code-generator/
├── qr-code-generator-2.html  ← 최종 정상 동작 버전 (vanilla JS)
├── index.html                 ← React 버전 (overlay 버그 있음)
└── test.html                  ← 디버깅용 최소 테스트 페이지
```

## 최종 기술 스택

- 순수 HTML / CSS / JavaScript
- qrcodejs 1.0.0 (CDN: cdnjs.cloudflare.com)
