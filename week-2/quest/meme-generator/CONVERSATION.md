# 짤 생성기 (Meme Generator) - 대화 내용 정리

## 1차: 앱 생성

**요청:** Canvas를 활용한 짤 생성기 앱 생성. 이미지 업로드 후 상단/하단 텍스트를 입력하면 밈 이미지를 생성하고, PNG로 다운로드할 수 있게 구현.

**구현 내용:**
- React + Tailwind CSS CDN 기반 단일 HTML 파일
- 이미지 업로드 (클릭 또는 드래그 앤 드롭)
- Canvas를 활용한 이미지 + 텍스트 합성
- 상단/하단 텍스트 입력 (실시간 미리보기)
- 글자 크기, 테두리 두께, 글자 색, 테두리 색 커스터마이징
- PNG 다운로드 및 초기화 기능

## 2차: 텍스트 여백(padding) 조정

**요청:** 텍스트가 이미지 가장자리에서 잘리지 않도록 상단/하단에 충분한 여백 추가. 특히 상단 텍스트는 위쪽에서 일정 거리 떨어지도록 위치 조정.

**수정 내용:**
- 상단 텍스트 여백: `fontSize * 0.8` → `fontSize * 1.4`
- 하단 텍스트 여백: `fontSize * 1.2`
- 좌우 여백: `40px` → `60px`

## 최종 기술 스택

- React 18 (CDN)
- Tailwind CSS (CDN)
- Babel Standalone (JSX 변환)
- HTML5 Canvas API
- Google Fonts (Noto Sans KR)
