// keyboardFeedback.js - 키보드 피드백 모듈

import {
  SECTION_CLASSES
} from './constants.js';

// 전역 이벤트 핸들러 참조 저장 (정리를 위해)
let globalKeyDownHandler = null;
let globalKeyUpHandler = null;

/**
 * 키보드 피드백 시스템 초기화
 */
export const initKeyboardFeedback = () => {
  const keyboardInfoSpans = document.querySelectorAll('.keyboard_info_text p span');
  const mainElement = document.querySelector('main');

  if (keyboardInfoSpans.length < 6) return;

  // 키와 span 요소 매핑
  const keyMapping = {
    'ArrowLeft': {
      span: keyboardInfoSpans[0],
      class: 'arrow-left'
    }, // ←
    'ArrowRight': {
      span: keyboardInfoSpans[1],
      class: 'arrow-right'
    }, // →
    'ArrowUp': {
      span: keyboardInfoSpans[2],
      class: 'arrow-up'
    }, // ↑
    'ArrowDown': {
      span: keyboardInfoSpans[3],
      class: 'arrow-down'
    }, // ↓
    'Tab': {
      span: keyboardInfoSpans[4],
      class: 'tab-key'
    }, // TAB
    'Enter': {
      span: keyboardInfoSpans[5],
      class: 'enter-key'
    } // ENTER
  };

  /**
   * 키가 눌렸을 때 시각적 효과 추가
   */
  const handleKeyDown = (e) => {
    // 메인 화면에서만 작동 (섹션이 활성화되지 않은 상태)
    const isMainScreen = !SECTION_CLASSES.some(className =>
      mainElement.classList.contains(className)
    );

    if (!isMainScreen) return;

    const keyInfo = keyMapping[e.key];
    if (keyInfo && keyInfo.span) {
      // key-pressed 클래스와 특정 키 클래스 추가
      keyInfo.span.classList.add('key-pressed', keyInfo.class);

      // 접근성을 위한 aria 속성 추가
      keyInfo.span.setAttribute('aria-pressed', 'true');
    }
  };

  /**
   * 키를 뗐을 때 시각적 효과 제거 (지연 후)
   */
  const handleKeyUp = (e) => {
    const keyInfo = keyMapping[e.key];
    if (keyInfo && keyInfo.span) {
      // 0.6초 후 효과 제거 (애니메이션 완료 후)
      setTimeout(() => {
        keyInfo.span.classList.remove('key-pressed', keyInfo.class);
        keyInfo.span.removeAttribute('aria-pressed');
      }, 600);
    }
  };

  // 핸들러 참조 저장 (정리를 위해)
  globalKeyDownHandler = handleKeyDown;
  globalKeyUpHandler = handleKeyUp;

  // 이벤트 리스너 등록
  document.addEventListener('keydown', globalKeyDownHandler);
  document.addEventListener('keyup', globalKeyUpHandler);
};

/**
 * 키보드 피드백 시스템 정리 (메모리 누수 방지)
 */
export const cleanupKeyboardFeedback = () => {
  // 전역 이벤트 리스너 제거
  if (globalKeyDownHandler) {
    document.removeEventListener('keydown', globalKeyDownHandler);
    globalKeyDownHandler = null;
  }

  if (globalKeyUpHandler) {
    document.removeEventListener('keyup', globalKeyUpHandler);
    globalKeyUpHandler = null;
  }

  // 활성화된 키 효과들 정리
  const keyClasses = [
    'key-pressed', 'key-pressed-top', 'key-pressed-bottom',
    'key-pressed-left', 'key-pressed-right', 'key-pressed-tab',
    'key-pressed-enter', 'key-pressed-esc', 'key-pressed-space'
  ];

  document.querySelectorAll('.key_top, .key_bottom, .key_left, .key_right, .key_tab, .key_enter, .key_esc, .key_space').forEach(keyElement => {
    keyClasses.forEach(className => {
      keyElement.classList.remove(className);
    });
    keyElement.removeAttribute('aria-pressed');
  });
};