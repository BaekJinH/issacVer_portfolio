// keyboardFeedback.js - 키보드 피드백 모듈

import {
  SECTION_CLASSES
} from './constants.js';

/**
 * 키보드 입력에 대한 시각적 피드백을 제공합니다.
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

  // 이벤트 리스너 등록
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
};