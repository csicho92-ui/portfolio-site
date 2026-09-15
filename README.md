# 조수인 포트폴리오 웹사이트

마케터 채용 지원용 포트폴리오. 메인 원페이지 + 프로젝트별 상세 페이지 8건.
HTML / CSS / Vanilla JS만 사용하며 빌드 도구나 프레임워크 없이 정적 호스팅(GitHub Pages, Vercel, Netlify 등)에 그대로 올릴 수 있습니다.

```
index.html                 메인 (소개 · 대표 프로젝트 · 일하는 방식 · 소개와 경력 · 연락처)
projects/<slug>/index.html 프로젝트 상세 8건 (고유 주소, 새로고침 · 뒤로 가기 정상 동작)
assets/style.css           공통 스타일 (색상 · 글꼴은 맨 위 :root 토큰)
assets/main.js             메뉴 현재 위치 · 분야 필터 · 등장 모션 · 이메일 복사 · 이미지 대체
images/                    썸네일 · 결과물 이미지 (아래 규칙대로 파일만 넣으면 표시됨)
tools/content.js           ★ 모든 글 내용은 이 파일에 있습니다
tools/build.js             content.js → HTML 생성 스크립트
resume.pdf                 이력서 (준비 후 추가)
```

## 1. 내용 수정하기

권장 방법: `tools/content.js`를 수정한 뒤 아래 명령을 실행하면 모든 HTML이 다시 만들어집니다.

```bash
node tools/build.js
```

(Node.js 18 이상. 설치가 어렵다면 HTML 파일을 직접 편집해도 됩니다. 단, 이후 build.js를 실행하면 직접 편집한 내용은 덮어씌워집니다.)

`content.js` 구조:

| 키 | 내용 |
|---|---|
| `site` | 이름 · 직무 · 이메일 · 배포 주소(`baseUrl`) · 이력서 설정 · 외부 채널 |
| `intro` | 첫 화면 문장, 핵심 키워드(최대 3), 대표 지표 3개(각각 연결 프로젝트 slug) |
| `fields` | 분야 필터 목록 |
| `projects` | 프로젝트 8건. 목록 카드용 필드 + `detail`(참여 범위 → 배경 → 목표 → 인사이트 → 전략 → 실행 → 성과 → 한계 → 회고 → 결과물) |
| `approach` | 일하는 방식과 역량 4개 (하는 일 → 실제 사례 → 결과) |
| `tools` | 사용 도구와 수행 업무 표 |
| `about` | 소개 문단, 경력 · 활동 · 교육 (최신순) |

### `[입력 필요]` 표시

노션 원본에 비어 있던 항목은 노란색 `[입력 필요: …]`로 남겨 두었습니다. 공개 전에 실제 자료로 채우거나 해당 문장을 지우세요.
검색: `grep -n "입력 필요" tools/content.js`

현재 남아 있는 항목:
- SNS 채널: 문의 건수 전후 비교
- AI 블로그: 글 수 · 상위 인용 글 제목 · 인용수 화면 캡처
- 공동구매: 회차 평균 매출
- AI 영상: 기업의 과제 · 내가 잡은 메시지 · 제작 방식
- 광고 운영: 소재별 CPC 비교값 · 기간
- CS · VOC: 유형별 문의 건수 전후 비교 · 결품 클레임 기간/건수
- 웹빌딩: 스토어/데모 링크

## 2. 이미지 넣기

파일을 `images/` 폴더에 아래 이름으로 넣기만 하면 됩니다. 파일이 없으면 자동으로 텍스트 대체 화면이 보이고, 파일을 넣으면 이미지가 표시됩니다.

| 용도 | 파일명 | 권장 크기 |
|---|---|---|
| 프로젝트 썸네일 (목록 + 상세 상단) | `images/<slug>.jpg` | 1600×1000 (16:10), 300KB 이하 |
| 상세 페이지 결과물 갤러리 | `images/<slug>-1.jpg`, `<slug>-2.jpg` … (순서는 content.js의 `gallery` 배열) | 1200×900 (4:3) |
| 링크 공유 미리보기 | `images/og.jpg` | 1200×630 |

프로젝트 slug: `sns-channel`, `ai-blog`, `group-buying`, `ai-video`, `ads-measurement`, `voc-system`, `design-100`, `web-building`

이미지 안의 작은 글씨에 중요한 정보를 두지 말고, 핵심 설명은 본문 텍스트에 함께 적습니다 (이미 그렇게 작성되어 있습니다).

## 3. 이력서 PDF

1. `resume.pdf`를 `index.html`과 같은 폴더에 넣습니다.
2. `tools/content.js`에서 `resume: { file: 'resume.pdf', ready: true }`로 바꾸고 `node tools/build.js`.
   → 첫 화면 `이력서 보기`, 소개 섹션, 연락처의 이력서 버튼이 함께 나타납니다. (준비 전에는 모두 숨김)

## 4. 배포

- **GitHub Pages**: 저장소에 올리고 Settings → Pages에서 브랜치 선택. 상세 주소(`/projects/sns-channel/`)는 폴더 구조라 별도 설정 없이 동작합니다.
- **Vercel / Netlify**: 폴더를 그대로 배포 (빌드 명령 없음, 출력 디렉터리 `.`).
- 배포 주소가 정해지면 `content.js`의 `site.baseUrl`에 `https://…` 를 넣고 다시 빌드하면 공유 미리보기(og:url, canonical)가 채워집니다.

## 5. 공개 전 체크리스트 (PRD 13장)

- [ ] `[입력 필요]` 항목을 모두 채우거나 삭제
- [ ] 노션 링크가 걸린 프로젝트 원본 페이지를 **웹에 게시**(Share → Publish) — 아니면 채용담당자가 열 수 없음
- [ ] `images/` 썸네일 8장 + `og.jpg`
- [ ] `resume.pdf` + `ready: true`
- [ ] 360 / 390 / 768 / 1280 / 1440px에서 가로 스크롤 · 잘림 확인
- [ ] 이메일 보내기 · 복사, 외부 링크(새 창) 동작 확인
- [ ] 배포 주소로 링크 공유 미리보기 확인

## 6. 글꼴 · 색상

- 글꼴: Pretendard(jsDelivr CDN) → 시스템 글꼴 대체. 오프라인에서도 시스템 글꼴로 정상 표시됩니다.
- 색상: `assets/style.css` 맨 위 `:root` 토큰 6개만 바꾸면 전체에 반영됩니다.
