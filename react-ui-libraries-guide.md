# React UI 컴포넌트 라이브러리 완벽 가이드 (2026년)

> 최종 업데이트: 2026년 4월 | React 호환 디자인 시스템 및 UI 라이브러리 비교 분석

---

## 요약 비교표

| 라이브러리 | GitHub Stars | 유형 | 스타일링 방식 | 최적 용도 | npm 설치 |
|---|---|---|---|---|---|
| **MUI (Material UI)** | ~97,000+ | 풀 컴포넌트 | Emotion/CSS-in-JS | 엔터프라이즈, 대규모 앱 | `npm install @mui/material @emotion/react @emotion/styled` |
| **Ant Design** | ~93,000+ | 풀 컴포넌트 | CSS-in-JS (cssinjs) | 엔터프라이즈, 관리자 대시보드 | `npm install antd` |
| **shadcn/ui** | ~75,000+ | 복사-붙여넣기 | Tailwind CSS | 커스텀 디자인 시스템 | `npx shadcn@latest init` |
| **Chakra UI** | ~40,000+ | 풀 컴포넌트 | CSS-in-JS / Panda CSS | 빠른 프로토타이핑, SaaS | `npm install @chakra-ui/react` |
| **DaisyUI** | ~40,600+ | CSS 컴포넌트 | Tailwind CSS 플러그인 | 빠른 UI 구축, 테마 활용 | `npm install daisyui` |
| **Mantine** | ~31,000+ | 풀 컴포넌트 | CSS Modules | 올인원 솔루션 | `npm install @mantine/core @mantine/hooks` |
| **Headless UI** | ~28,000+ | 헤드리스 | 스타일 없음 (Tailwind 권장) | Tailwind 프로젝트 | `npm install @headlessui/react` |
| **HeroUI (NextUI)** | ~27,000+ | 풀 컴포넌트 | Tailwind CSS | 모던 UI, Next.js | `npm install @heroui/react` |
| **Blueprint** | ~21,600+ | 풀 컴포넌트 | CSS/Sass | 데이터 밀집 데스크톱 앱 | `npm install @blueprintjs/core` |
| **Fluent UI** | ~19,900+ | 풀 컴포넌트 | CSS-in-JS | Microsoft 생태계 | `npm install @fluentui/react-components` |
| **Radix UI** | ~18,700+ | 헤드리스 프리미티브 | 스타일 없음 | 커스텀 디자인 시스템 기반 | `npm install @radix-ui/react-dialog` (개별 설치) |
| **React Aria** | ~14,500+ | 헤드리스 훅/컴포넌트 | 스타일 없음 | 접근성 중심 앱 | `npm install react-aria-components` |
| **Semantic UI React** | ~13,300+ | 풀 컴포넌트 | CSS | 시맨틱 HTML 중심 | `npm install semantic-ui-react` |
| **Evergreen** | ~12,400+ | 풀 컴포넌트 | CSS-in-JS | 중소규모 B2B 앱 | `npm install evergreen-ui` |
| **Base UI** | ~9,200+ | 헤드리스 | 스타일 없음 | 장기 커스텀 디자인 시스템 | `npm install @base-ui-components/react` |
| **PrimeReact** | ~8,300+ | 풀 컴포넌트 | 자체 CSS/테마 | 고급 데이터 컴포넌트 필요 시 | `npm install primereact` |
| **Ark UI** | ~5,000+ | 헤드리스 | 스타일 없음 | 멀티 프레임워크 지원 필요 시 | `npm install @ark-ui/react` |

### 유형 분류 한눈에 보기

```
풀 컴포넌트 (스타일 포함)          헤드리스 (스타일 없음)           하이브리드
================================  ==============================  ====================
MUI, Ant Design, Chakra UI        Radix UI, React Aria            shadcn/ui (복사-붙여넣기)
Mantine, HeroUI, Blueprint        Headless UI, Base UI            DaisyUI (Tailwind 플러그인)
Fluent UI, Evergreen               Ark UI
PrimeReact, Semantic UI React
```

---

## 1. MUI (Material UI)

| 항목 | 내용 |
|---|---|
| **공식 사이트** | [https://mui.com](https://mui.com) |
| **GitHub** | [github.com/mui/material-ui](https://github.com/mui/material-ui) |
| **GitHub Stars** | ~97,000+ |
| **주간 다운로드** | 4,500,000+ |
| **라이선스** | MIT |

### 핵심 특징
- Google Material Design 구현체로 가장 오래되고 성숙한 React UI 라이브러리
- 방대한 컴포넌트 수 (50개 이상의 기본 컴포넌트)
- MUI X로 고급 Data Grid, Date Picker, Charts 등 제공 (유료 포함)
- 강력한 테마 시스템 (`createTheme`)으로 깊은 커스터마이징 가능
- TypeScript 완벽 지원

### 적합한 경우
- 대규모 엔터프라이즈 애플리케이션
- Material Design 가이드라인을 따르는 프로젝트
- 빠른 프로토타이핑이 필요한 경우
- 충분한 문서와 커뮤니티 지원이 필요한 경우

### 장점
- 가장 큰 커뮤니티와 생태계
- 매우 상세한 문서 및 예제
- 지속적인 업데이트와 안정성
- Joy UI, Base UI 등 다양한 파생 라이브러리

### 단점
- 번들 사이즈가 큼
- Material Design 스타일에서 벗어나기 위한 오버라이드가 복잡할 수 있음
- CSS-in-JS (Emotion) 런타임 오버헤드
- 학습 곡선이 있음 (sx prop, styled API, theme 구조)

### 설치
```bash
npm install @mui/material @emotion/react @emotion/styled
```

---

## 2. Ant Design

| 항목 | 내용 |
|---|---|
| **공식 사이트** | [https://ant.design](https://ant.design) |
| **GitHub** | [github.com/ant-design/ant-design](https://github.com/ant-design/ant-design) |
| **GitHub Stars** | ~93,000+ |
| **주간 다운로드** | 1,700,000+ |
| **라이선스** | MIT |

### 핵심 특징
- 알리바바에서 개발한 엔터프라이즈급 디자인 시스템
- 60개 이상의 고품질 컴포넌트
- Ant Design v5에서 CSS-in-JS 기반으로 전환 (cssinjs)
- 강력한 Form, Table, Tree 등 복잡한 데이터 컴포넌트
- 국제화(i18n) 기본 내장
- Ant Design Pro, Ant Design Charts 등 풍부한 생태계

### 적합한 경우
- 대규모 관리자 패널 / 백오피스 시스템
- 데이터 집약적인 B2B 애플리케이션
- 중국 시장 대상 프로젝트 (중국어 문서 및 커뮤니티 강점)
- 복잡한 폼과 테이블이 많은 프로젝트

### 장점
- 매우 풍부한 컴포넌트 세트 (Table, Form, DatePicker 등 강력)
- 일관된 디자인 언어
- 기업용 기능 (국제화, RTL, 접근성)
- ProComponents로 즉시 사용 가능한 고급 레이아웃

### 단점
- 번들 사이즈가 매우 큼
- 중국어 중심 커뮤니티 (영문 문서는 있으나 가끔 번역 품질 이슈)
- 디자인 커스터마이징에 제한적 (Ant Design 고유 스타일이 강함)
- CSS-in-JS 전환 이후 일부 성능 이슈 보고

### 설치
```bash
npm install antd
```

---

## 3. shadcn/ui

| 항목 | 내용 |
|---|---|
| **공식 사이트** | [https://ui.shadcn.com](https://ui.shadcn.com) |
| **GitHub** | [github.com/shadcn-ui/ui](https://github.com/shadcn-ui/ui) |
| **GitHub Stars** | ~75,000+ |
| **주간 다운로드** | 560,000+ |
| **라이선스** | MIT |

### 핵심 특징
- **라이브러리가 아닌 복사-붙여넣기 방식** -- 컴포넌트 코드를 직접 프로젝트에 복사
- Radix UI 프리미티브 + Tailwind CSS 기반 (2026년부터 Base UI도 지원)
- `npx shadcn@latest add button` 형태로 개별 컴포넌트 추가
- 2026년 Visual Builder로 설정 마찰 최소화
- 컴포넌트 소유권이 개발자에게 있음 (100% 커스터마이징)

### 적합한 경우
- Tailwind CSS를 사용하는 모든 React/Next.js 프로젝트
- 완전한 디자인 커스터마이징이 필요한 경우
- 번들 사이즈를 최소화하고 싶은 경우
- 자체 디자인 시스템을 구축하려는 경우

### 장점
- 런타임 오버헤드 제로 (의존성이 아닌 코드 복사)
- 완전한 커스터마이징 자유도
- 2026년 기준 가장 빠르게 성장하는 React UI 프로젝트
- 아름다운 기본 디자인
- Next.js, Vite 등 다양한 프레임워크와 호환

### 단점
- Tailwind CSS 의존적 (Tailwind를 안 쓰면 사용 불가)
- 업데이트가 자동이 아님 (코드를 복사했으므로 직접 관리 필요)
- 컴포넌트 수가 전통적 라이브러리 대비 적음
- 대규모 팀에서 일관성 유지에 추가 노력 필요

### 설치
```bash
npx shadcn@latest init
# 개별 컴포넌트 추가
npx shadcn@latest add button
npx shadcn@latest add dialog
```

---

## 4. Chakra UI

| 항목 | 내용 |
|---|---|
| **공식 사이트** | [https://chakra-ui.com](https://chakra-ui.com) |
| **GitHub** | [github.com/chakra-ui/chakra-ui](https://github.com/chakra-ui/chakra-ui) |
| **GitHub Stars** | ~40,000+ |
| **주간 다운로드** | 4,000,000+ |
| **라이선스** | MIT |

### 핵심 특징
- 접근성 우선 설계 (WAI-ARIA 준수)
- Zag.js 상태 머신 기반으로 재작성 (v3)
- 직관적인 prop 기반 스타일링 (`<Box bg="red.500" p={4}>`)
- Panda CSS 기반 스타일링으로 전환 중
- Ark UI, Panda CSS 등 파생 프로젝트 생태계

### 적합한 경우
- 빠른 프로토타이핑 및 MVP 개발
- 접근성이 중요한 프로젝트
- 직관적인 DX(개발자 경험)를 원하는 경우
- SaaS 제품 개발

### 장점
- 뛰어난 개발자 경험 (DX)
- prop 기반 스타일링으로 빠른 개발
- 우수한 접근성 기본 지원
- 테마 커스터마이징이 쉬움

### 단점
- v2에서 v3로의 큰 변경 (마이그레이션 비용)
- CSS-in-JS에서 Panda CSS로 전환 중인 과도기
- MUI나 Ant Design 대비 컴포넌트 수 적음
- 고급 데이터 컴포넌트 (DataGrid 등) 부족

### 설치
```bash
npm install @chakra-ui/react
```

---

## 5. Mantine

| 항목 | 내용 |
|---|---|
| **공식 사이트** | [https://mantine.dev](https://mantine.dev) |
| **GitHub** | [github.com/mantinedev/mantine](https://github.com/mantinedev/mantine) |
| **GitHub Stars** | ~31,000+ |
| **주간 다운로드** | 5,000,000+ |
| **라이선스** | MIT |

### 핵심 특징
- 100개 이상의 컴포넌트 + 60개 이상의 커스텀 훅
- CSS Modules 기반 (제로 런타임 CSS-in-JS)
- Rich Text Editor, Date Picker, Notifications 등 올인원
- 폼 관리 (`@mantine/form`), 차트 (`@mantine/charts`) 내장
- Spotlight (커맨드 팔레트), Dropzone 등 독특한 컴포넌트

### 적합한 경우
- 올인원 솔루션을 원하는 프로젝트
- 추가 라이브러리 설치를 최소화하고 싶은 경우
- 빠르게 성장 중인 활발한 라이브러리를 원하는 경우
- 서버 사이드 렌더링 (Next.js)과 함께 사용

### 장점
- 가장 포괄적인 기능 세트 (UI + 훅 + 폼 + 차트 + 알림 등)
- CSS Modules 기반으로 런타임 성능 우수
- 뛰어난 문서화
- 빠른 성장세 (MUI 주간 다운로드에 근접)
- 단일 개발자(Vitaly) 주도이지만 500+ 기여자

### 단점
- 단일 주요 관리자에 대한 의존도
- MUI 대비 커뮤니티 규모 아직 작음
- v6 → v7 등 메이저 업데이트 시 마이그레이션 비용
- 디자인 가이드라인이 Material Design처럼 엄격하지 않음

### 설치
```bash
npm install @mantine/core @mantine/hooks
# 추가 패키지
npm install @mantine/form @mantine/dates @mantine/charts
```

---

## 6. Radix UI

| 항목 | 내용 |
|---|---|
| **공식 사이트** | [https://www.radix-ui.com](https://www.radix-ui.com) |
| **GitHub** | [github.com/radix-ui/primitives](https://github.com/radix-ui/primitives) |
| **GitHub Stars** | ~18,700+ |
| **월간 npm 다운로드** | 130,000,000+ |
| **라이선스** | MIT |

### 핵심 특징
- **헤드리스(unstyled) 프리미티브 컴포넌트** 라이브러리
- 접근성, 키보드 네비게이션, 포커스 관리 기본 제공
- 개별 패키지로 설치 (tree-shakeable)
- shadcn/ui의 기반 레이어
- Dialog, Dropdown, Tooltip, Popover 등 인터랙티브 패턴 전문

### 적합한 경우
- 자체 디자인 시스템을 처음부터 구축하는 경우
- 접근성을 확실하게 보장해야 하는 경우
- 스타일링에 완전한 자유가 필요한 경우
- shadcn/ui를 사용하거나 직접 래핑하려는 경우

### 장점
- 접근성 구현의 골든 스탠다드
- 스타일 자유도 100%
- 개별 패키지로 번들 사이즈 최소화
- 매우 넓은 생태계 (shadcn/ui 등)

### 단점
- 스타일링을 직접 해야 함 (시간 투자 필요)
- WorkOS 인수 이후 업데이트 속도 둔화
- 즉시 사용 가능한 UI가 아님
- 각 컴포넌트를 개별 설치해야 함

### 설치
```bash
# 개별 프리미티브 설치
npm install @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-tooltip
```

---

## 7. HeroUI (구 NextUI)

| 항목 | 내용 |
|---|---|
| **공식 사이트** | [https://www.heroui.com](https://www.heroui.com) |
| **GitHub** | [github.com/heroui-inc/heroui](https://github.com/heroui-inc/heroui) |
| **GitHub Stars** | ~27,000+ |
| **주간 다운로드** | 120,000+ |
| **라이선스** | MIT |

### 핵심 특징
- NextUI에서 HeroUI로 리브랜딩
- Tailwind CSS + React Aria 기반
- 부드러운 애니메이션과 모던한 디자인
- 다크 모드 기본 내장
- Next.js와의 뛰어난 통합

### 적합한 경우
- 모던하고 세련된 UI가 필요한 프로젝트
- Next.js 기반 프로젝트
- Tailwind CSS 사용 프로젝트
- 스타트업 / 랜딩 페이지 / SaaS

### 장점
- 아름다운 기본 디자인과 애니메이션
- Tailwind CSS 기반으로 커스터마이징 용이
- React Aria 기반 접근성
- 개발자 친화적 API

### 단점
- 상대적으로 작은 커뮤니티
- 컴포넌트 수가 MUI/Ant Design 대비 적음
- Tailwind CSS v4 지원 진행 중
- 엔터프라이즈급 복잡한 컴포넌트 부족

### 설치
```bash
npm install @heroui/react
```

---

## 8. Headless UI

| 항목 | 내용 |
|---|---|
| **공식 사이트** | [https://headlessui.com](https://headlessui.com) |
| **GitHub** | [github.com/tailwindlabs/headlessui](https://github.com/tailwindlabs/headlessui) |
| **GitHub Stars** | ~28,000+ |
| **주간 다운로드** | 2,600,000+ |
| **라이선스** | MIT |

### 핵심 특징
- Tailwind Labs에서 공식 개발
- 완전히 스타일이 없는 접근성 컴포넌트
- Tailwind CSS와 완벽한 호환
- Menu, Listbox, Switch, Dialog, Popover 등 핵심 인터랙티브 패턴
- React + Vue 지원

### 적합한 경우
- Tailwind CSS 프로젝트에서 인터랙티브 컴포넌트가 필요한 경우
- Tailwind UI (유료) 템플릿을 사용하는 경우
- 최소한의 헤드리스 컴포넌트만 필요한 경우

### 장점
- Tailwind Labs 공식 지원
- 매우 가벼움
- 접근성 우수
- Tailwind CSS와 자연스러운 통합

### 단점
- 컴포넌트 수가 매우 제한적 (~10개 내외)
- Radix UI 대비 컴포넌트 범위가 좁음
- 자체적으로는 완전한 UI 라이브러리가 될 수 없음
- Tailwind CSS 없이는 활용도가 낮음

### 설치
```bash
npm install @headlessui/react
```

---

## 9. React Aria (Adobe)

| 항목 | 내용 |
|---|---|
| **공식 사이트** | [https://react-aria.adobe.com](https://react-aria.adobe.com) |
| **GitHub** | [github.com/adobe/react-spectrum](https://github.com/adobe/react-spectrum) |
| **GitHub Stars** | ~14,500+ |
| **라이선스** | Apache 2.0 |

### 핵심 특징
- Adobe에서 개발한 접근성 중심 헤드리스 라이브러리
- React Aria Components (컴포넌트) + React Aria (훅) 이중 API
- 키보드 네비게이션, 스크린 리더, 국제화(i18n) 최고 수준
- 터치, 마우스, 키보드 인터랙션을 모두 정교하게 처리
- React Spectrum (Adobe의 디자인 시스템)의 기반 레이어

### 적합한 경우
- 접근성(a11y)이 최우선인 프로젝트
- 정부/공공기관/금융 등 접근성 규정 준수 필요
- 국제화가 중요한 글로벌 서비스
- HeroUI의 기반 기술로도 사용됨

### 장점
- 업계 최고 수준의 접근성 구현
- Adobe의 장기적 지원
- 매우 정교한 인터랙션 처리
- 훅 기반으로 유연한 사용

### 단점
- 학습 곡선이 높음
- 문서가 다른 라이브러리 대비 복잡
- 커뮤니티 규모가 작음
- 스타일링을 완전히 직접 해야 함

### 설치
```bash
npm install react-aria-components
# 또는 훅 기반
npm install react-aria
```

---

## 10. Fluent UI (Microsoft)

| 항목 | 내용 |
|---|---|
| **공식 사이트** | [https://fluent2.microsoft.design](https://fluent2.microsoft.design) |
| **GitHub** | [github.com/microsoft/fluentui](https://github.com/microsoft/fluentui) |
| **GitHub Stars** | ~19,900+ |
| **라이선스** | MIT |

### 핵심 특징
- Microsoft의 Fluent Design System 구현체
- Microsoft 365 제품군과 동일한 디자인 언어
- Griffel CSS-in-JS 엔진 사용
- React, Web Components 지원
- Fluent UI v9 (React Components)가 최신 버전

### 적합한 경우
- Microsoft 생태계와 통합하는 프로젝트
- Teams, Outlook, SharePoint 등과 일관된 UX 필요
- 기업 내부 도구 개발

### 장점
- Microsoft 공식 지원 및 장기 유지보수
- Microsoft 제품과 시각적 일관성
- 엔터프라이즈급 안정성
- 접근성 우수

### 단점
- Microsoft 디자인 이외의 커스터마이징이 어려움
- 복잡한 패키지 구조
- 학습 곡선이 높음
- Microsoft 밖에서는 채택률이 낮음

### 설치
```bash
npm install @fluentui/react-components
```

---

## 11. Blueprint (Palantir)

| 항목 | 내용 |
|---|---|
| **공식 사이트** | [https://blueprintjs.com](https://blueprintjs.com) |
| **GitHub** | [github.com/palantir/blueprint](https://github.com/palantir/blueprint) |
| **GitHub Stars** | ~21,600+ |
| **라이선스** | Apache 2.0 |

### 핵심 특징
- Palantir에서 개발한 데이터 집약적 UI 툴킷
- **데스크톱 웹 애플리케이션에 최적화** (모바일 우선이 아님)
- 복잡한 데이터 테이블, DateTime 선택기, 멀티셀렉트 등
- CSS/Sass 기반 스타일링
- Blueprint v5가 최신 메이저 버전

### 적합한 경우
- 데이터 분석 대시보드
- 복잡한 데스크톱 웹 애플리케이션
- Palantir 스타일의 데이터 밀집 인터페이스
- 내부 도구 / 어드민 패널

### 장점
- 데이터 밀집 UI에 최적화된 컴포넌트
- DateRangePicker, MultiSelect 등 고급 입력 컴포넌트
- 안정적이고 성숙한 라이브러리
- 다크 모드 기본 지원

### 단점
- 모바일 대응이 부족
- 디자인이 다소 보수적
- 커뮤니티가 MUI/Ant Design 대비 작음
- 모던한 스타일링 트렌드(Tailwind 등)와는 거리가 있음

### 설치
```bash
npm install @blueprintjs/core
# 추가 패키지
npm install @blueprintjs/table @blueprintjs/datetime2
```

---

## 12. Evergreen (Segment)

| 항목 | 내용 |
|---|---|
| **공식 사이트** | [https://evergreen.segment.com](https://evergreen.segment.com) |
| **GitHub** | [github.com/segmentio/evergreen](https://github.com/segmentio/evergreen) |
| **GitHub Stars** | ~12,400+ |
| **라이선스** | MIT |

### 핵심 특징
- Segment(현 Twilio Segment)에서 개발
- "기업용 웹 앱을 위한 디자인 시스템"
- ui-box 기반의 CSS-in-JS 스타일링
- 30개 이상의 폴리싱된 컴포넌트

### 적합한 경우
- 중소규모 B2B SaaS 제품
- 깔끔하고 미니멀한 기업용 UI가 필요한 경우

### 장점
- 깔끔하고 미니멀한 디자인
- 기본 컴포넌트가 즉시 사용 가능
- Figma 키트 제공

### 단점
- 업데이트 빈도가 매우 낮음 (유지보수 모드에 가까움)
- 컴포넌트 수가 제한적
- 커뮤니티가 작음
- 2026년 기준 새 프로젝트에는 추천하기 어려움

### 설치
```bash
npm install evergreen-ui
```

---

## 13. Semantic UI React

| 항목 | 내용 |
|---|---|
| **공식 사이트** | [https://react.semantic-ui.com](https://react.semantic-ui.com) |
| **GitHub** | [github.com/Semantic-Org/Semantic-UI-React](https://github.com/Semantic-Org/Semantic-UI-React) |
| **GitHub Stars** | ~13,300+ |
| **라이선스** | MIT |

### 핵심 특징
- Semantic UI의 공식 React 래퍼
- 시맨틱(의미론적) HTML 클래스명 기반
- jQuery 의존성 없는 순수 React 구현
- 선언적 API (`<Button primary>`, `<Grid columns={3}>`)

### 적합한 경우
- Semantic UI 디자인을 좋아하는 경우
- 빠르게 기본적인 UI를 구성하려는 경우
- 레거시 Semantic UI 프로젝트의 React 마이그레이션

### 장점
- 직관적인 API와 클래스명
- jQuery 없는 순수 React
- 풍부한 예제

### 단점
- 핵심 Semantic UI CSS의 업데이트가 거의 중단됨
- 2026년 기준 레거시로 분류되는 추세
- TypeScript 지원 미흡
- 새 프로젝트에는 비추천

### 설치
```bash
npm install semantic-ui-react semantic-ui-css
```

---

## 14. PrimeReact

| 항목 | 내용 |
|---|---|
| **공식 사이트** | [https://primereact.org](https://primereact.org) |
| **GitHub** | [github.com/primefaces/primereact](https://github.com/primefaces/primereact) |
| **GitHub Stars** | ~8,300+ |
| **주간 다운로드** | 200,000+ |
| **라이선스** | MIT |

### 핵심 특징
- **80개 이상의 컴포넌트** -- React UI 라이브러리 중 가장 많은 수
- Gantt Chart, Organization Chart, TreeTable 등 희귀한 고급 컴포넌트
- 다양한 테마 (Material, Bootstrap, Tailwind, Lara 등)
- PrimeBlocks, PrimeFlex, PrimeIcons 생태계
- PrimeFaces(Java), PrimeNG(Angular), PrimeVue(Vue) 시리즈

### 적합한 경우
- 고급 데이터 시각화 컴포넌트가 필요한 경우 (Gantt, OrgChart 등)
- 하나의 라이브러리로 모든 컴포넌트를 해결하고 싶은 경우
- 멀티 프레임워크 팀 (Angular, Vue와 동일한 API)

### 장점
- 가장 많은 컴포넌트 수 (80개+)
- DataTable이 매우 강력 (정렬, 필터링, 가상 스크롤, 편집 등)
- 다양한 테마 시스템
- 엔터프라이즈 수준의 기능

### 단점
- GitHub Stars가 상대적으로 적어 커뮤니티가 작음
- 일부 고급 기능/테마는 유료
- 디자인 품질이 MUI/shadcn 대비 세련되지 않을 수 있음
- 번들 사이즈 최적화 필요

### 설치
```bash
npm install primereact primeicons
```

---

## 15. DaisyUI

| 항목 | 내용 |
|---|---|
| **공식 사이트** | [https://daisyui.com](https://daisyui.com) |
| **GitHub** | [github.com/saadeghi/daisyui](https://github.com/saadeghi/daisyui) |
| **GitHub Stars** | ~40,600+ |
| **npm 다운로드 (2025년)** | 22,000,000+ |
| **라이선스** | MIT |

### 핵심 특징
- **Tailwind CSS 플러그인** (React 전용이 아님 -- 모든 프레임워크에서 사용 가능)
- CSS 클래스 기반 (`class="btn btn-primary"`)
- 35개 이상의 테마 기본 제공
- JavaScript 런타임 제로
- 63개 컴포넌트

### 적합한 경우
- Tailwind CSS를 사용하면서 유틸리티 클래스를 줄이고 싶은 경우
- 다양한 테마를 빠르게 적용하고 싶은 경우
- React뿐 아니라 다른 프레임워크에서도 동일한 UI를 사용하고 싶은 경우
- 빠른 프로토타이핑

### React에서의 사용
```jsx
// DaisyUI는 CSS 클래스 기반이므로 React에서 직접 사용
<button className="btn btn-primary">버튼</button>

// 또는 react-daisyui 래퍼 사용
import { Button } from 'react-daisyui';
<Button color="primary">버튼</Button>
```

### 장점
- JavaScript 런타임 오버헤드 제로
- 35개 이상의 아름다운 빌트인 테마
- Tailwind CSS의 유틸리티 클래스 양을 88% 줄여줌
- 프레임워크에 독립적
- 매우 가벼움

### 단점
- React 전용이 아님 (React 상태 관리와 통합은 직접 해야 함)
- 복잡한 인터랙티브 컴포넌트(Modal, Dropdown 등)는 JS 로직을 직접 구현해야 함
- 접근성 기능이 기본 제공되지 않음
- react-daisyui 래퍼의 커뮤니티가 작음 (1.1k stars)

### 설치
```bash
npm install daisyui
# React 래퍼 (선택)
npm install react-daisyui
```

---

## 신규/트렌딩 라이브러리

### Base UI

| 항목 | 내용 |
|---|---|
| **공식 사이트** | [https://base-ui.com](https://base-ui.com) |
| **GitHub** | [github.com/mui/base-ui](https://github.com/mui/base-ui) |
| **GitHub Stars** | ~9,200+ |
| **라이선스** | MIT |

- MUI 팀 + Radix/Floating UI 핵심 개발자가 함께 만든 **차세대 헤드리스 라이브러리**
- Radix UI의 구조적 한계를 개선하려는 목표
- shadcn/ui가 2026년부터 Base UI를 프리미티브 레이어로 지원
- 안정적인 API, 뛰어난 TypeScript 지원
- MUI의 핵심 투자 프로젝트로 장기적 지원 보장

```bash
npm install @base-ui-components/react
```

### Ark UI

| 항목 | 내용 |
|---|---|
| **공식 사이트** | [https://ark-ui.com](https://ark-ui.com) |
| **GitHub** | [github.com/chakra-ui/ark](https://github.com/chakra-ui/ark) |
| **GitHub Stars** | ~5,000+ |
| **라이선스** | MIT |

- Chakra UI 팀에서 개발한 **헤드리스 컴포넌트 라이브러리**
- Zag.js 상태 머신 기반
- React, Vue, Solid, Svelte 모두 지원 (프레임워크 독립적)
- Park UI라는 스타일 레이어와 함께 사용 가능

```bash
npm install @ark-ui/react
```

---

## 2026년 트렌드 요약

### 주요 트렌드

| 트렌드 | 설명 |
|---|---|
| **복사-붙여넣기 방식의 부상** | npm install 대신 코드를 직접 복사하는 방식 (shadcn/ui)이 주류로 |
| **헤드리스 라이브러리 70% 성장** | 스타일이 포함된 라이브러리보다 헤드리스 방식의 채택이 급증 |
| **Tailwind CSS 중심** | Tailwind CSS와 결합하는 패턴이 업계 표준으로 자리잡음 |
| **조합형 아키텍처** | 하나의 라이브러리에 의존하기보다 여러 도구를 조합하는 방식 선호 |

### 2026년 추천 조합

```
일반적인 새 프로젝트:
  shadcn/ui (기본 UI) + Tailwind CSS + 필요시 전문 라이브러리 추가

엔터프라이즈 / 대규모:
  MUI 또는 Ant Design (풀 스택 솔루션)

데이터 밀집 대시보드:
  Blueprint 또는 PrimeReact + 차트 라이브러리

접근성 최우선:
  React Aria + 자체 스타일링

빠른 프로토타이핑:
  Mantine (올인원) 또는 Chakra UI

Microsoft 생태계:
  Fluent UI
```

### 선택 가이드 플로우차트

```
프로젝트 시작
    |
    ├── Tailwind CSS 사용? ──── Yes ──── shadcn/ui (+ Radix/Base UI)
    |                                         또는 DaisyUI (빠른 테마)
    |                                         또는 HeroUI (모던 디자인)
    |
    ├── Material Design 필요? ── Yes ──── MUI
    |
    ├── 엔터프라이즈 관리자? ──── Yes ──── Ant Design 또는 MUI
    |
    ├── 올인원 솔루션? ───────── Yes ──── Mantine
    |
    ├── 접근성 최우선? ────────── Yes ──── React Aria
    |
    ├── 데이터 밀집 데스크톱? ── Yes ──── Blueprint 또는 PrimeReact
    |
    ├── Microsoft 통합? ─────── Yes ──── Fluent UI
    |
    └── 커스텀 디자인 시스템? ── Yes ──── Radix UI 또는 Base UI (헤드리스)
```

---

## 참고 자료

- [MUI 공식 사이트](https://mui.com)
- [Ant Design 공식 사이트](https://ant.design)
- [shadcn/ui 공식 사이트](https://ui.shadcn.com)
- [Chakra UI 공식 사이트](https://chakra-ui.com)
- [Mantine 공식 사이트](https://mantine.dev)
- [Radix UI 공식 사이트](https://www.radix-ui.com)
- [HeroUI 공식 사이트](https://www.heroui.com)
- [Headless UI 공식 사이트](https://headlessui.com)
- [React Aria 공식 사이트](https://react-aria.adobe.com)
- [Fluent UI 공식 사이트](https://fluent2.microsoft.design)
- [Blueprint 공식 사이트](https://blueprintjs.com)
- [Evergreen 공식 사이트](https://evergreen.segment.com)
- [Semantic UI React 공식 사이트](https://react.semantic-ui.com)
- [PrimeReact 공식 사이트](https://primereact.org)
- [DaisyUI 공식 사이트](https://daisyui.com)
- [Base UI GitHub](https://github.com/mui/base-ui)
- [Ark UI 공식 사이트](https://ark-ui.com)
- [14 Best React UI Component Libraries in 2026 - Untitled UI](https://www.untitledui.com/blog/react-component-libraries)
- [15 Best React UI Libraries for 2026 - Builder.io](https://www.builder.io/blog/react-component-libraries-2026)
- [Best React Component Libraries 2026 - DesignRevision](https://designrevision.com/blog/best-react-component-libraries)
- [5 Best React UI Libraries for 2026 - DEV Community](https://dev.to/ansonch/5-best-react-ui-libraries-for-2026-and-when-to-use-each-1p4j)
