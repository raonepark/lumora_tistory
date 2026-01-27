# Lumora Lab Tistory Skin - Project Guide ✦

**"Premium & Modern Tech Blog"**

이 문서는 **Lumora Lab** 티스토리 스킨 제작 프로젝트의 **디자인 철학, 기술 스택, 핵심 구현 내용**을 정리한 가이드입니다. 
새로운 챗 세션에서 작업할 때 이 문서를 참고하여 일관성을 유지하세요.

---

## 1. Design Identity (디자인 아이덴티티)

### Concept
*   **Minimalism & Premium:** 불필요한 장식은 배제하고, 여백과 타이포그래피로 고급스러움을 강조합니다.
*   **Confidence:** "숫자보다 콘텐츠". 조회수, 댓글 수 등 수치적 요소를 과감히 숨기거나 삭제하여 콘텐츠 자체에 집중하게 합니다.
*   **Dark Mode Native:** 단순한 반전이 아닌, 깊이감 있는 Dark UI를 지향합니다.

### Color Palette
*   **Background:** `bg-bgBody` - `#101012` (Deep Dark), `bg-bgCard` - `#18181b` (Zinc-900)
*   **Accent:** `#c084fc` (Violet/Purple) - 로고, 강조 텍스트, 아이콘에 사용.
*   **Text:** `text-zinc-200` (Main), `text-zinc-400` ~ `500` (Sub) - 완전한 화이트(`All #fff`) 사용을 지양하여 눈의 피로를 줄임.
*   **Border:** `white/5` ~ `white/10` - 아주 옅은 경계선으로 구분감만 줌.

### UI/UX Rules
*   **Header:** 스크롤 시 `Sticky`. 새로고침 시 '꿀렁임' 방지를 위해 `transition` 속성은 제거됨.
*   **Comments:** 
    *   헤더의 `(Count)` 삭제 (미니멀리즘).
    *   '이전 댓글 더보기' 버튼은 시스템 강제 생성 요소를 CSS(`!important`)로 덮어씌워 버튼화.
*   **Guestbook:** 방명록 대댓글(Nested Reply) 기능은 레이아웃 붕괴 문제로 **삭제**함. 1 Depth 댓글만 허용.
*   **List View:** 
    *   Smart Summary: 제목 길이에 따라 본문 요약 줄 수를 동적으로 조절 (JS).
    *   Empty State: 글이 없는 카테고리는 JS로 감지하여 안내 메시지 출력.

---

## 2. Technical Stack (기술 스택)

*   **Platform:** Tistory (Tistory Skin Guide 준수)
*   **Core:** HTML, CSS (Tailwind-like Utility Classes + Custom CSS), Vanilla JS
*   **Icons:** FontAwesome (Latest)

### File Structure
*   `skin.html`: 티스토리 치환자(`[##_..._##]`)를 포함한 메인 구조.
*   `style.css`: 
    *   초반부: Global Resets, Web Fonts.
    *   후반부: 커스텀 스타일, 시스템 요소 오버라이드(Override).
*   `index.xml`: 스킨 메타데이터, 사이드바 설정, 변수 정의.

---

## 3. Key Implementation Details (핵심 구현 사항)

### 3.1. Header Flicker Fix (헤더 흔들림 방지)
*   **문제:** 페이지 로드 시 헤더나 콘텐츠가 `10px` 정도 튀는 현상.
*   **원인:** `animate-fadeIn` 키프레임에 포함된 `transform: translateY(10px)`가 로딩 시점에 전체 레이아웃을 밀어올림.
*   **해결:** `fadeIn` 애니메이션에서 `transform` 속성 제거, `opacity`만 유지.

### 3.2. Comment Section Customization (댓글창 커스텀)
*   **Pagination:** 티스토리 구형 치환자 `<s_paging>` 블록 삭제 (Raw text 노출 문제 해결).
*   **Load More Button:** `.tt_more_preview_comments_wrap` 클래스를 `style.css`에서 강제 스타일링하여 버튼 형태로 변경.

### 3.3. Guestbook Simplification (방명록 간소화)
*   대댓글 구조(`<s_guest_reply_container>`)가 스타일 충돌을 일으켜 **완전 삭제** 처리. 단순 리스트 형태로 유지.

---

## 4. Current Status & To-Do
*   [x] 기본 레이아웃 및 다크 테마 적용
*   [x] 카테고리/리스트 뷰 스마트 요약 적용
*   [x] 헤더 레이아웃 조정 (Admin 버튼 공간 확보)
*   [x] 댓글/방명록 스타일 안정화
*   [ ] (Future) 검색 결과 페이지 디자인 구체화
*   [ ] (Future) 모바일 메뉴 인터랙션 고도화

---
*Last Updated: 2026-01-14 by Antigravity*
