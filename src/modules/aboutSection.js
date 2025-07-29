// aboutSection.js - About 섹션 모듈

import {
  CHARACTER_STATS,
  CHARACTER_FEATURES
} from './constants.js';
import {
  animateNumber,
  createPixelParticles,
  createSoundEffect,
  addSoundEffectStyles
} from './utils.js';
import {
  removeFocusTrap
} from './focusManager.js';

// About 섹션 상태 변수
let currentAboutContentIndex = 0;
let aboutKeyDownHandler = null;

// DOM 요소 캐싱
let aboutContent = [];

/**
 * About 섹션 DOM 요소들을 초기화합니다.
 */
export const initAboutDOMElements = () => {
  const mainElement = document.querySelector('main');
  const aboutContentSlideWrapper = mainElement.querySelector('.about_content_slide_wrapper');
  aboutContent = aboutContentSlideWrapper ? aboutContentSlideWrapper.querySelectorAll('.about_content') : [];
};

/**
 * About 섹션 슬라이드 클릭 핸들러
 */
const handleAboutClick = (e) => {
  // 클릭된 요소가 슬라이드(.about_content)인지 확인
  const clickedSlide = e.target.closest('.about_content');

  // 슬라이드가 아니거나, 이미 활성화된 슬라이드를 클릭한 경우 무시
  if (!clickedSlide || clickedSlide.classList.contains('active')) {
    return;
  }

  // 클릭된 슬라이드의 인덱스 찾기
  const slideIndex = Array.from(aboutContent).findIndex(slide => slide === clickedSlide);

  if (slideIndex !== -1) {
    currentAboutContentIndex = slideIndex;
    updateAboutCarousel();
    // 새로 활성화된 슬라이드에 포커스
    aboutContent[currentAboutContentIndex]?.focus();
  }
};

/**
 * About 섹션 캐러셀 UI 업데이트
 * 클래스(active, prev, next)와 tabindex를 설정하고, 현재 캐릭터의 특징을 표시합니다.
 */
export const updateAboutCarousel = () => {
  if (!aboutContent || aboutContent.length === 0) return;
  const total = aboutContent.length;

  // 현재 캐릭터의 특징 업데이트
  const characterFeatureElement = document.querySelector('.character_feature span');
  const characterFeatureContainer = document.querySelector('.character_feature');

  if (characterFeatureElement && CHARACTER_FEATURES[currentAboutContentIndex]) {
    characterFeatureElement.innerHTML = CHARACTER_FEATURES[currentAboutContentIndex];

    // 애니메이션 트리거를 위해 클래스 제거 후 다시 추가
    if (characterFeatureContainer) {
      characterFeatureContainer.classList.remove('animate');
      // 강제로 리플로우 발생시켜 클래스 제거를 즉시 적용
      characterFeatureContainer.offsetHeight;
      characterFeatureContainer.classList.add('animate');
    }
  }

  // 각 위치별 스타일 정의 (translateX, translateY, scale, opacity, zIndex)
  const positions = {
    '0': {
      x: '0',
      y: '0',
      scale: 1,
      opacity: 1,
      z: 5
    }, // active (중앙)
    '1': {
      x: '12.5rem',
      y: '-0.5rem',
      scale: 0.8,
      opacity: 0.7,
      z: 4
    }, // next (오른쪽 1)
    '-1': {
      x: '-12.5rem',
      y: '-0.5rem',
      scale: 0.8,
      opacity: 0.7,
      z: 4
    }, // prev (왼쪽 1)
    '2': {
      x: '19rem',
      y: '-6rem',
      scale: 0.6,
      opacity: 0.4,
      z: 3
    }, // 오른쪽 2
    '-2': {
      x: '-19rem',
      y: '-6rem',
      scale: 0.6,
      opacity: 0.4,
      z: 3
    }, // 왼쪽 2
    '3': {
      x: '15rem',
      y: '-11rem',
      scale: 0.4,
      opacity: 0.2,
      z: 2
    }, // 오른쪽 3
    '-3': {
      x: '-15rem',
      y: '-11rem',
      scale: 0.4,
      opacity: 0.2,
      z: 2
    }, // 왼쪽 3
  };

  aboutContent.forEach((slide, index) => {
    // 현재 아이템 기준으로 각 슬라이드의 상대적 위치(offset) 계산
    let offset = index - currentAboutContentIndex;
    const half = Math.floor(total / 2);

    // 무한 순환을 위한 offset 보정
    if (offset > half) {
      offset -= total;
    }
    if (offset < -half) {
      offset += total;
    }

    // positions 객체에서 해당 offset의 스타일 값을 가져옴
    const pos = positions[offset.toString()];

    // 'active' 클래스는 여전히 포커스 표시 등에 유용하므로 유지합니다.
    slide.classList.remove('prev', 'next'); // prev, next 클래스는 더 이상 사용하지 않음
    slide.classList.toggle('active', offset === 0);

    if (pos) {
      // 보이는 아이템들의 스타일 적용
      slide.style.transform = `translateX(${pos.x}) translateY(${pos.y}) scale(${pos.scale})`;
      slide.style.opacity = pos.opacity;
      slide.style.zIndex = pos.z;
      slide.style.pointerEvents = 'auto'; // 상호작용 가능하도록
    } else {
      // 너무 멀리 있는 아이템들은 완전히 숨김
      slide.style.opacity = 0;
      slide.style.transform = `scale(0)`; // 작게 만들어 숨김
      slide.style.pointerEvents = 'none'; // 상호작용 방지
    }

    // 포커스는 중앙(active) 아이템에만 설정
    slide.tabIndex = (offset === 0) ? 0 : -1;
  });

  // 스탯 애니메이션 실행 (약간의 지연 후)
  setTimeout(() => {
    animateCharacterStats(currentAboutContentIndex);
  }, 500);
};

/**
 * About 섹션 키보드 이벤트 핸들러 (좌우 방향키)
 * @param {Event} e - 키보드 이벤트
 */
const handleAboutKeyDown = (e) => {
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    const total = aboutContent.length;
    currentAboutContentIndex = (currentAboutContentIndex - 1 + total) % total;
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    const total = aboutContent.length;
    currentAboutContentIndex = (currentAboutContentIndex + 1) % total;
  } else {
    return; // 다른 키는 무시
  }

  updateAboutCarousel();
  // 새로 활성화된 슬라이드에 포커스
  const activeSlide = aboutContent[currentAboutContentIndex];
  if (activeSlide) {
    activeSlide.focus();
  }
};

/**
 * 스탯 애니메이션 시스템
 */
const resetCharacterStats = () => {
  // 모든 스탯 요소의 애니메이션 상태 리셋
  document.querySelectorAll('.floating_info_text li.stat').forEach(statElement => {
    statElement.classList.remove('animate', 'loading', 'high-level');
    const progressFill = statElement.querySelector('.stat-progress-fill');
    const valueElement = statElement.querySelector('.stat-value');

    if (progressFill) progressFill.style.width = '0%';
    if (valueElement) valueElement.textContent = '0';

    // 파티클 제거
    statElement.querySelectorAll('.pixel-particle').forEach(particle => {
      particle.remove();
    });
  });
};

const animateCharacterStats = (characterIndex) => {
  // 먼저 모든 스탯 리셋
  resetCharacterStats();

  const activeContent = document.querySelector('.about_content.active');
  if (!activeContent) return;

  const statElements = activeContent.querySelectorAll('.floating_info_text li.stat');
  const stats = CHARACTER_STATS[characterIndex];

  statElements.forEach((statElement, index) => {
    const statType = ['speed', 'exp', 'skill'][index];
    const targetValue = stats[statType];

    // 글리치 효과 먼저
    statElement.classList.add('loading');
    createSoundEffect('glitch');
    setTimeout(() => {
      statElement.classList.remove('loading');
      animateStatBar(statElement, targetValue, statType);
    }, 300);
  });
};

const animateStatBar = (statElement, targetValue, statType) => {
  const progressFill = statElement.querySelector('.stat-progress-fill');
  const valueElement = statElement.querySelector('.stat-value');

  // 애니메이션 클래스 추가
  statElement.classList.add('animate');

  // 사운드 효과
  createSoundEffect('stat-fill');

  // 프로그레스 바 애니메이션
  setTimeout(() => {
    progressFill.style.width = `${targetValue}%`;
  }, 100);

  // 숫자 카운트업 애니메이션
  animateNumber(valueElement, targetValue);

  // 파티클 효과 생성
  createPixelParticles(statElement, statType);

  // 90% 이상이면 레벨업 효과
  if (targetValue >= 90) {
    setTimeout(() => {
      statElement.classList.add('high-level');
      createSoundEffect('level-up');
    }, 1500);
  }
};

const initializeCharacterStats = () => {
  // 사운드 효과 스타일 추가
  addSoundEffectStyles();

  aboutContent.forEach((content, index) => {
    const floatingInfo = content.querySelector('.floating_info_text');
    if (!floatingInfo) return;

    // 기존 스탯 li 요소들을 찾거나 생성
    const existingStats = floatingInfo.querySelectorAll('li.stat');

    if (existingStats.length === 0) {
      // 스탯 li가 없다면 생성
      const stats = CHARACTER_STATS[index];
      const statTypes = [{
          key: 'speed',
          label: 'SPEED',
          icon: '⚡'
        },
        {
          key: 'exp',
          label: 'EXP',
          icon: '⭐'
        },
        {
          key: 'skill',
          label: 'SKILL',
          icon: '🎯'
        }
      ];

      statTypes.forEach(statType => {
        const li = document.createElement('li');
        li.className = `stat stat-${statType.key}`;
        li.innerHTML = `
          <div class="stat-label">
            <div class="stat-icon"></div>
            <span>${statType.label}</span>
          </div>
          <div class="stat-progress">
            <div class="stat-progress-bg">
              <div class="stat-progress-fill"></div>
            </div>
          </div>
          <div class="stat-value">0</div>
        `;
        floatingInfo.appendChild(li);
      });
    } else {
      // 기존 스탯 li가 있다면 구조 업데이트
      existingStats.forEach((statElement, statIndex) => {
        const statTypes = ['speed', 'exp', 'skill'];
        const statType = statTypes[statIndex];

        if (!statElement.querySelector('.stat-progress')) {
          statElement.classList.add('stat', `stat-${statType}`);
          statElement.innerHTML = `
            <div class="stat-label">
              <div class="stat-icon"></div>
              <span>${statType.toUpperCase()}</span>
            </div>
            <div class="stat-progress">
              <div class="stat-progress-bg">
                <div class="stat-progress-fill"></div>
              </div>
            </div>
            <div class="stat-value">0</div>
          `;
        }
      });
    }
  });
};

/**
 * About 섹션 캐러셀 초기화
 */
export const initAboutCarousel = (wrapper) => {
  if (!aboutContent || aboutContent.length === 0) return;
  aboutContent.forEach(slide => {
    if (!slide.hasAttribute('tabindex')) {
      slide.tabIndex = -1;
    }
  });
  currentAboutContentIndex = Math.floor(aboutContent.length / 2);

  // 스탯 시스템 초기화
  initializeCharacterStats();
  updateAboutCarousel();

  // 키보드 이벤트 리스너 등록
  aboutKeyDownHandler = handleAboutKeyDown;
  wrapper.addEventListener('keydown', aboutKeyDownHandler);

  // 클릭 이벤트 리스너 등록
  wrapper.addEventListener('click', handleAboutClick);

  // 초기 포커스 설정
  aboutContent[currentAboutContentIndex]?.focus();
};

/**
 * About 섹션 캐러셀 이벤트 리스너 제거
 */
export const removeAboutCarouselListener = (wrapper) => {
  if (wrapper) {
    // 키보드 리스너 제거
    if (aboutKeyDownHandler) {
      wrapper.removeEventListener('keydown', aboutKeyDownHandler);
      aboutKeyDownHandler = null;
    }
    // 클릭 리스너 제거
    wrapper.removeEventListener('click', handleAboutClick);
  }
};