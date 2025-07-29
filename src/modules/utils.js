// utils.js - 공통 유틸리티 함수들

/**
 * 성능 최적화 유틸리티 함수들
 */

/**
 * Throttle: 지정된 시간 간격으로만 함수 실행을 제한
 * @param {Function} func - 실행할 함수
 * @param {number} delay - 지연 시간 (밀리초)
 * @returns {Function} - throttle이 적용된 함수
 */
export const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;

  return function (...args) {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

/**
 * Debounce: 연속 호출 시 마지막 호출만 지연 후 실행
 * @param {Function} func - 실행할 함수
 * @param {number} delay - 지연 시간 (밀리초)
 * @returns {Function} - debounce가 적용된 함수
 */
export const debounce = (func, delay) => {
  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

/**
 * RAF를 활용한 애니메이션 최적화 래퍼
 * @param {Function} func - 실행할 함수
 * @returns {Function} - RAF가 적용된 함수
 */
export const rafThrottle = (func) => {
  let rafId = null;

  return function (...args) {
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func.apply(this, args);
        rafId = null;
      });
    }
  };
};

/**
 * 메모화 함수 (계산 결과 캐싱)
 * @param {Function} func - 메모화할 함수
 * @returns {Function} - 메모화된 함수
 */
export const memoize = (func) => {
  const cache = new Map();

  return function (...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func.apply(this, args);
    cache.set(key, result);
    return result;
  };
};

/**
 * 이벤트 리스너 안전 추가/제거 헬퍼
 * @param {Element} element - 대상 요소
 * @param {string} event - 이벤트 타입
 * @param {Function} handler - 이벤트 핸들러
 * @param {Object} options - 이벤트 옵션
 */
export const safeAddEventListener = (element, event, handler, options = {}) => {
  if (!element || typeof handler !== 'function') {
    console.warn('safeAddEventListener: 유효하지 않은 요소 또는 핸들러');
    return null;
  }

  element.addEventListener(event, handler, options);

  // 제거 함수 반환
  return () => {
    element.removeEventListener(event, handler, options);
  };
};

/**
 * 에러 핸들링 유틸리티 함수들
 */

/**
 * 에러 타입별 분류
 */
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  PARSE: 'PARSE_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

/**
 * 에러 타입 감지 함수
 * @param {Error} error - 에러 객체
 * @param {Response} response - fetch 응답 객체 (선택적)
 * @returns {string} - 에러 타입
 */
export const getErrorType = (error, response = null) => {
  // 네트워크 에러
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return ErrorTypes.NETWORK;
  }

  // HTTP 상태 코드 기반 분류
  if (response) {
    if (response.status === 404) return ErrorTypes.NOT_FOUND;
    if (response.status === 403 || response.status === 401) return ErrorTypes.PERMISSION;
    if (response.status >= 500) return ErrorTypes.NETWORK;
  }

  // JSON 파싱 에러
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return ErrorTypes.PARSE;
  }

  // 기본값
  return ErrorTypes.UNKNOWN;
};

/**
 * 사용자 친화적 에러 메시지 생성
 * @param {string} errorType - 에러 타입
 * @param {string} context - 에러 발생 맥락
 * @returns {string} - 사용자 친화적 메시지
 */
export const getUserFriendlyMessage = (errorType, context = '') => {
  const messages = {
    [ErrorTypes.NETWORK]: `네트워크 연결을 확인해주세요. ${context} 데이터를 불러올 수 없습니다.`,
    [ErrorTypes.NOT_FOUND]: `${context} 파일을 찾을 수 없습니다. 관리자에게 문의해주세요.`,
    [ErrorTypes.PARSE]: `${context} 데이터 형식에 오류가 있습니다.`,
    [ErrorTypes.PERMISSION]: `${context} 데이터에 접근할 권한이 없습니다.`,
    [ErrorTypes.VALIDATION]: `${context} 데이터가 올바르지 않습니다.`,
    [ErrorTypes.UNKNOWN]: `알 수 없는 오류가 발생했습니다. ${context}`
  };

  return messages[errorType] || messages[ErrorTypes.UNKNOWN];
};

/**
 * 통합 에러 핸들러
 * @param {Error} error - 에러 객체
 * @param {string} context - 에러 발생 맥락
 * @param {Response} response - fetch 응답 객체 (선택적)
 * @param {Function} fallbackCallback - 폴백 처리 함수 (선택적)
 */
export const handleError = (error, context, response = null, fallbackCallback = null) => {
  const errorType = getErrorType(error, response);
  const userMessage = getUserFriendlyMessage(errorType, context);

  // 개발자용 상세 로그
  console.group(`🚨 ${context} 에러 발생`);
  console.error('에러 타입:', errorType);
  console.error('사용자 메시지:', userMessage);
  console.error('원본 에러:', error);
  if (response) {
    console.error('응답 상태:', response.status, response.statusText);
  }
  console.groupEnd();

  // 폴백 처리 실행
  if (typeof fallbackCallback === 'function') {
    try {
      fallbackCallback(errorType, userMessage);
    } catch (fallbackError) {
      console.error('폴백 처리 중 에러:', fallbackError);
    }
  }

  return {
    type: errorType,
    message: userMessage,
    originalError: error
  };
};

/**
 * 안전한 JSON 페치 함수 (에러 핸들링 포함)
 * @param {string} url - 요청 URL
 * @param {string} context - 에러 발생 맥락
 * @param {Function} fallbackCallback - 폴백 처리 함수
 * @returns {Promise} - JSON 데이터 또는 에러 정보
 */
export const safeFetch = async (url, context = 'API', fallbackCallback = null) => {
  try {
    console.log(`📡 ${context} 데이터 요청: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ ${context} 데이터 로드 성공`);

    return {
      success: true,
      data
    };

  } catch (error) {
    const errorInfo = handleError(error, context, null, fallbackCallback);
    return {
      success: false,
      error: errorInfo
    };
  }
};

/**
 * 범용 리스트 네비게이션 핸들러 함수
 * @param {Event} e - 키보드 이벤트 객체
 * @param {HTMLElement[]} items - 탐색할 항목 요소들의 NodeList 또는 배열
 * @param {number} currentIndex - 현재 선택된 항목의 인덱스 참조
 * @param {Function} updateCallback - 인덱스 변경 시 호출될 콜백 함수 (예: UI 업데이트)
 * @param {boolean} loop - 리스트의 끝/시작에서 순환할지 여부
 * @returns {number} - 업데이트된 인덱스
 */
export const handleListNavigation = (e, items, currentIndex, updateCallback, loop = true) => {
  if (!['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
    return currentIndex; // 관련 없는 키는 무시
  }

  e.preventDefault(); // 기본 스크롤 동작 방지

  let newIndex = currentIndex;

  if (e.key === 'ArrowUp') {
    newIndex = currentIndex > 0 ? currentIndex - 1 : (loop ? items.length - 1 : 0);
  } else if (e.key === 'ArrowDown') {
    newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : (loop ? 0 : items.length - 1);
  } else if (e.key === 'Enter') {
    // Enter 키는 별도 로직이 필요한 경우 (예: 클릭 이벤트 트리거)
    // 현재는 updateCallback에서 처리되므로 별도 동작 불필요
  }

  if (newIndex !== currentIndex) {
    items[newIndex].focus(); // 새로운 항목으로 포커스 이동
    updateCallback(newIndex); // UI 업데이트 콜백 호출
  } else if (e.key === 'Enter') {
    // 현재 포커스된 항목에서 Enter 키를 눌렀을 때도 콜백 호출 (클릭과 유사한 동작)
    updateCallback(newIndex);
  }
  return newIndex;
};

/**
 * 수학 유틸리티 함수들
 */
export const scale = (a, b, c, d, e) => {
  return ((a - b) * (e - d)) / (c - b) + d;
};

export const lerp = (v0, v1, t) => {
  return v0 * (1 - t) + v1 * t;
};

/**
 * 픽셀 게임 느낌의 타이핑 효과
 * @param {HTMLElement} element - 타이핑 효과를 적용할 요소
 * @param {Function} [onComplete] - 타이핑 완료 후 실행할 콜백
 */
export const startTypingEffect = (element, onComplete) => {
  if (!element) return;

  const text = element.getAttribute('data-text');
  const glitchChars = '█▓▒░▄▀■□▪▫◘◙☻☺♠♣♥♦•◦‣∅∞≡±≠≤≥∴∵∶∷∸∹∺∻∼∽∾∿≀≁≂≃';
  let currentIndex = 0;

  // 초기 상태: 빈 텍스트
  element.textContent = '';
  element.classList.add('typing-active');

  const typeChar = () => {
    if (currentIndex >= text.length) {
      // 타이핑 완료
      element.classList.remove('typing-active');
      element.classList.add('typing-complete');
      if (typeof onComplete === 'function') {
        onComplete();
      }
      return;
    }

    const targetChar = text[currentIndex];

    // 글리치 효과: 랜덤 글자 2-3개 보여주기
    const glitchCount = Math.floor(Math.random() * 3) + 2;
    let glitchStep = 0;

    const showGlitch = () => {
      if (glitchStep < glitchCount) {
        // 랜덤 글리치 글자 표시
        const randomChar = glitchChars[Math.floor(Math.random() * glitchChars.length)];
        const currentText = element.textContent;
        element.textContent = currentText.slice(0, currentIndex) + randomChar;

        glitchStep++;
        setTimeout(showGlitch, 50); // 50ms마다 글리치 변경
      } else {
        // 올바른 글자 표시
        const currentText = element.textContent;
        element.textContent = currentText.slice(0, currentIndex) + targetChar;
        currentIndex++;

        // 다음 글자로 진행 (속도 랜덤화)
        const nextDelay = Math.random() * 80 + 20; // 80-100ms 사이
        setTimeout(typeChar, nextDelay);
      }
    };

    showGlitch();
  };

  // 타이핑 시작
  typeChar();
};

/**
 * 타이핑 효과 함수
 * @param {HTMLElement} element - 텍스트를 표시할 요소
 * @param {string} text - 표시할 텍스트
 * @param {number} speed - 타이핑 속도 (ms)
 */
export const typewriterEffect = (element, text, speed) => {
  element.textContent = '';
  let i = 0;
  const timer = setInterval(() => {
    element.textContent += text.charAt(i);
    i++;
    if (i >= text.length) {
      clearInterval(timer);
    }
  }, speed);
};

/**
 * 숫자 카운트업 애니메이션
 * @param {HTMLElement} element - 숫자를 표시할 요소
 * @param {number} targetValue - 목표 값
 */
export const animateNumber = (element, targetValue) => {
  let currentValue = 0;
  const increment = targetValue / 50; // 50프레임에 걸쳐 애니메이션
  const duration = 1500; // 1.5초
  const frameTime = duration / 50;

  const updateNumber = () => {
    currentValue += increment;
    if (currentValue >= targetValue) {
      currentValue = targetValue;
      element.textContent = Math.round(currentValue);
      return;
    }

    element.textContent = Math.round(currentValue);
    element.classList.add('counting');

    setTimeout(() => {
      element.classList.remove('counting');
    }, 100);

    setTimeout(updateNumber, frameTime);
  };

  updateNumber();
};

/**
 * 파티클 생성 함수
 * @param {HTMLElement} statElement - 파티클을 생성할 요소
 * @param {string} statType - 스탯 타입 ('speed', 'exp', 'skill')
 */
export const createPixelParticles = (statElement, statType) => {
  const colors = {
    speed: '#4CAF50',
    exp: '#FF9800',
    skill: '#9C27B0'
  };

  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      const particle = document.createElement('div');
      particle.className = 'pixel-particle';
      particle.style.background = colors[statType];
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;

      statElement.appendChild(particle);

      // 파티클 제거
      setTimeout(() => {
        particle.remove();
      }, 1000);
    }, i * 100);
  }
};

/**
 * 시각적 사운드 효과 (실제 사운드 대신)
 * @param {string} type - 사운드 타입
 */
export const createSoundEffect = (type) => {
  const soundEffects = {
    'stat-load': '♪',
    'stat-fill': '♫',
    'level-up': '★',
    'glitch': '◈'
  };

  const soundElement = document.createElement('div');
  soundElement.textContent = soundEffects[type] || '♪';
  soundElement.style.cssText = `
    // position: fixed;
    // top: 20px;
    // right: 20px;
    // font-size: 1.5rem;
    // color: #FFD700;
    // z-index: 10000;
    // pointer-events: none;
    // animation: soundEffectPop 0.8s ease-out forwards;
  `;

  document.body.appendChild(soundElement);

  setTimeout(() => {
    soundElement.remove();
  }, 800);
};

/**
 * 사운드 효과 스타일 추가
 */
export const addSoundEffectStyles = () => {
  if (!document.getElementById('sound-effect-styles')) {
    const style = document.createElement('style');
    style.id = 'sound-effect-styles';
    style.textContent = `
      @keyframes soundEffectPop {
        0% {
          transform: scale(0) rotate(0deg);
          opacity: 1;
        }
        50% {
          transform: scale(1.2) rotate(180deg);
          opacity: 1;
        }
        100% {
          transform: scale(0.8) translateY(-50px) rotate(360deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
};