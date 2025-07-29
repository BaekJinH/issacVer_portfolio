// utils.js - 공통 유틸리티 함수들

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