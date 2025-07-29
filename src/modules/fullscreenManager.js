// fullscreenManager.js - 전체화면 관리 모듈

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
 * 전체화면 상태 변경 감지 및 UI 업데이트
 */
const handleFullscreenChange = () => {
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

    // F11 키 이벤트 리스너
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    });
  }

  // 전체화면 상태 변경 감지
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  // F11 키로 인한 전체화면 변화 감지 (resize 이벤트 사용)
  window.addEventListener('resize', handleFullscreenChange);
};