// fullscreenManager.js - 전체화면 관리 모듈

import {
  throttle
} from './utils.js';

// 전역 이벤트 핸들러 참조 저장 (정리를 위해)
let fullscreenKeydownHandler = null;
let throttledResizeHandler = null;

/**
 * 전체화면 상태를 토글합니다.
 */
export const toggleFullscreen = async () => {
  const fullscreenIcon = document.querySelector('.fullscreen_icon');
  const fullscreenText = document.querySelector('.fullscreen_text');

  try {
    if (!document.fullscreenElement) {
      // 전체화면 진입
      await document.documentElement.requestFullscreen();
      if (fullscreenIcon) fullscreenIcon.textContent = '⛸'; // 축소 아이콘
      if (fullscreenText) fullscreenText.textContent = '창모드';
    } else {
      // 전체화면 종료
      await document.exitFullscreen();
      if (fullscreenIcon) fullscreenIcon.textContent = '⛶'; // 확대 아이콘
      if (fullscreenText) fullscreenText.textContent = '전체화면';
    }
  } catch (error) {
    console.log('전체화면 전환 중 오류가 발생했습니다:', error);
  }
};

/**
 * 전체화면 상태를 확인하는 함수 (F11과 JavaScript API 모두 지원)
 */
export const isFullscreen = () => {
  // JavaScript API로 전체화면 진입한 경우
  if (document.fullscreenElement) {
    return true;
  }

  // F11 키로 전체화면 진입한 경우 감지
  // Firefox의 window.fullScreen 속성 확인
  if (typeof window.fullScreen !== 'undefined' && window.fullScreen) {
    return true;
  }

  // 화면 크기로 전체화면 여부 판단 (크로스 브라우저 대응)
  if (window.outerHeight === window.screen.height &&
    window.outerWidth === window.screen.width) {
    return true;
  }

  return false;
};

/**
 * 전체화면 상태 변경 감지 및 UI 업데이트 (원본 함수)
 */
const handleFullscreenChangeBase = () => {
  const fullscreenIcon = document.querySelector('.fullscreen_icon');
  const fullscreenText = document.querySelector('.fullscreen_text');

  if (isFullscreen()) {
    if (fullscreenIcon) fullscreenIcon.textContent = '⛸';
    if (fullscreenText) fullscreenText.textContent = '창모드';
  } else {
    if (fullscreenIcon) fullscreenIcon.textContent = '⛶';
    if (fullscreenText) fullscreenText.textContent = '전체화면';
  }
};

// throttle 적용: 리사이즈 이벤트를 150ms 간격으로 제한
const handleFullscreenChange = throttle(handleFullscreenChangeBase, 150);

/**
 * 전체화면 관리자 초기화
 */
export const initFullscreenManager = () => {
  const fullscreenToggleBtn = document.querySelector('.fullscreen_toggle_btn');

  if (fullscreenToggleBtn) {
    // 전체화면 버튼 이벤트 리스너
    fullscreenToggleBtn.addEventListener('click', toggleFullscreen);
    fullscreenToggleBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleFullscreen();
      }
    });

    // F11 키 이벤트 리스너 (전역)
    fullscreenKeydownHandler = (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    document.addEventListener('keydown', fullscreenKeydownHandler);
  }

  // throttle 적용된 핸들러 참조 저장
  throttledResizeHandler = handleFullscreenChange;

  // 전체화면 상태 변경 감지 (throttle 적용)
  document.addEventListener('fullscreenchange', handleFullscreenChangeBase); // fullscreenchange는 자주 발생하지 않으므로 원본 사용
  // F11 키로 인한 전체화면 변화 감지 (resize 이벤트 사용 - throttle 적용)
  window.addEventListener('resize', throttledResizeHandler); // resize는 throttle 적용
};

/**
 * 전체화면 관리자 정리 (메모리 누수 방지)
 */
export const cleanupFullscreenManager = () => {
  // 전역 이벤트 리스너 제거
  if (fullscreenKeydownHandler) {
    document.removeEventListener('keydown', fullscreenKeydownHandler);
    fullscreenKeydownHandler = null;
  }

  if (throttledResizeHandler) {
    window.removeEventListener('resize', throttledResizeHandler);
    throttledResizeHandler = null;
  }

  // fullscreenchange 이벤트 제거
  document.removeEventListener('fullscreenchange', handleFullscreenChangeBase);

  // 버튼 이벤트 리스너 제거
  const fullscreenToggleBtn = document.querySelector('.fullscreen_toggle_btn');
  if (fullscreenToggleBtn) {
    // 새로운 버튼 생성하여 모든 이벤트 리스너 제거 (cloneNode 방식)
    const newBtn = fullscreenToggleBtn.cloneNode(true);
    fullscreenToggleBtn.parentNode.replaceChild(newBtn, fullscreenToggleBtn);
  }
};