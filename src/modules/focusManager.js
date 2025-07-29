// focusManager.js - 포커스 관리 모듈

// 원래 tabindex 값들을 저장하기 위한 맵
let originalTabIndexes = new Map();

/**
 * 현재 활성 섹션 외부의 모든 포커스 가능한 요소들을 비활성화합니다.
 * (tabIndex = -1 설정)
 * @param {string} activeSectionClass - 현재 활성화된 섹션 클래스명
 */
export const disableTabIndexOutsideSection = (activeSectionClass) => {
  const mainElement = document.querySelector('main');
  const allFocusableElements = document.querySelectorAll(
    'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
  );
  const activeSectionWrapper = activeSectionClass ?
    mainElement.querySelector(`.${activeSectionClass}_wrapper`) : null;

  allFocusableElements.forEach(element => {
    if (!originalTabIndexes.has(element)) {
      originalTabIndexes.set(element, element.tabIndex || 0); // 원래 tabindex 저장
    }
    if (!activeSectionWrapper || !activeSectionWrapper.contains(element)) {
      element.tabIndex = -1; // 활성 섹션 외부 요소 비활성화
    }
  });
};

/**
 * 모든 요소들의 tabindex를 원래 값으로 복원합니다.
 */
export const restoreTabIndex = () => {
  originalTabIndexes.forEach((originalValue, element) => {
    element.tabIndex = originalValue;
  });
  originalTabIndexes.clear(); // 맵 비우기
};

/**
 * 특정 섹션 내부에서 포커스가 순환되도록 (Focus Trap) 처리합니다.
 * @param {HTMLElement} sectionWrapper - 포커스 트랩을 적용할 섹션 래퍼 요소
 */
export const trapFocusInSection = (sectionWrapper) => {
  if (!sectionWrapper) return;

  const focusableElements = sectionWrapper.querySelectorAll(
    'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) { // Shift + Tab (역방향)
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else { // Tab (정방향)
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  // 기존에 등록된 핸들러가 있다면 제거 (중복 방지)
  removeFocusTrap(sectionWrapper);
  sectionWrapper.addEventListener('keydown', handleKeyDown);
  sectionWrapper._trapFocusHandler = handleKeyDown; // 이벤트 핸들러 참조 저장
};

/**
 * 섹션의 포커스 트랩 이벤트를 제거합니다.
 * @param {HTMLElement} sectionWrapper - 포커스 트랩을 제거할 섹션 래퍼 요소
 */
export const removeFocusTrap = (sectionWrapper) => {
  if (sectionWrapper && sectionWrapper._trapFocusHandler) {
    sectionWrapper.removeEventListener('keydown', sectionWrapper._trapFocusHandler);
    delete sectionWrapper._trapFocusHandler;
  }
};