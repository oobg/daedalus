# Daedalus

웹 기반 2.5D 건물 안내 에디터. 층별 실내 지도를 룸 폴리곤 기반으로 편집하고, 고정 등각 투영(isometric) 뷰로 건물 안내 이미지를 생성합니다.

---

## 주요 기능

- **2D 폴리곤 에디터** — 룸 폴리곤을 그리고 버텍스 단위로 편집. 인접한 룸의 공유 경계가 자동 동기화됨
- **2.5D 미리보기** — 2D 에디터 상태를 실시간으로 등각 투영으로 렌더링
- **플로어플랜 참조 이미지** — 층별로 도면 이미지를 업로드해 편집 기준으로 활용
- **층 높이 설정** — 층별 높이를 지정해 2.5D 수직 배치에 반영
- **저장 / 불러오기** — localStorage 자동 저장 + JSON 파일 내보내기·가져오기
- **내보내기** — PNG / SVG 형식으로 최종 안내 이미지 출력
- **읽기 전용 뷰어** — `/view` 경로에서 에디터 없이 2.5D 안내도만 표시. JSON 파일 업로드로 다른 기기에서도 열람 가능

## 기술 스택

| 역할 | 라이브러리 |
|---|---|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript (strict mode) |
| 스타일 | Tailwind CSS v4 |
| 상태 관리 | Zustand 5 |
| 2D 캔버스 | Konva.js + react-konva |
| 3D 렌더러 | React Three Fiber + Drei + Three.js |
| 아이콘 | lucide-react |

## 시작하기

```bash
npm install
npm run dev
```

`http://localhost:3000` — 에디터  
`http://localhost:3000/view` — 읽기 전용 뷰어

## 빌드

```bash
npm run build
npm start
```

## 테스트

```bash
npm test
```

Node.js 내장 테스트 러너(`node --test`)를 사용합니다. 별도 설치 없이 실행됩니다.

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx          # 에디터 페이지 (/)
│   └── view/             # 읽기 전용 뷰어 (/view)
├── components/
│   ├── editor/           # 2D 캔버스 컴포넌트
│   ├── viewer/           # 2.5D 뷰어 컴포넌트
│   └── organisms/        # 툴바, 사이드바, 속성 패널
├── domain/               # 핵심 도메인 타입 (Floor, Room, Wall, Opening 등)
├── features/
│   ├── editor/           # 룸 폴리곤 편집 로직
│   ├── floor-plan-upload/# 플로어플랜 이미지 업로드·관리
│   ├── project-export/   # PNG / SVG 내보내기
│   ├── project-persistence/ # localStorage / JSON 직렬화
│   ├── renderer/         # 에디터→렌더러 계약 및 어댑터
│   └── viewer/           # 2.5D 뷰어 지오메트리 연산
└── store/                # Zustand 에디터 스토어
```

## 아키텍처 원칙

- **룸 폴리곤 단일 소스** — 공간 편집의 모든 데이터는 룸 폴리곤이 원본. 벽은 폴리곤 엣지에서 파생됨
- **에디터·렌더러 분리** — 렌더러는 정규화된 읽기 전용 계약 타입만 소비. 에디터 뮤테이션 로직에 직접 의존하지 않음
- **MVP 스코프 유지** — 백엔드, 클라우드 스토리지, 공유 URL, CAD 수준 기능은 범위 밖
