// main.js

!(function () {
  // 1. DOM 요소 캐싱
  const mainElement = document.querySelector('main');
  const selectOptions = document.querySelectorAll('.select_option button');
  const backButtons = document.querySelectorAll('.back_btn');
  const aboutWrapper = mainElement.querySelector('.about_wrapper');
  const aboutContentSlideWrapper = mainElement.querySelector('.about_content_slide_wrapper');
  const aboutContent = aboutContentSlideWrapper ? aboutContentSlideWrapper.querySelectorAll('.about_content') : [];
  const portfolioListContainer = mainElement.querySelector('.content_list_viewer');
  const portfolioContentList = mainElement.querySelector('.content_list');

  // 2. 상태 변수
  let currentFocusedOptionIndex = 0; // 메인 메뉴 포커스 인덱스
  let currentAboutContentIndex = 0; // [수정] About 섹션 슬라이드 인덱스 (이름 명확화)
  let aboutKeyDownHandler = null; // [추가] About 섹션 이벤트 핸들러 참조 저장용
  let portfolioData = []; // 포트폴리오 데이터
  let currentPortfolioItemIndex = 0; // 포트폴리오 목록에서 현재 선택된 아이템 인덱스
  let originalTabIndexes = new Map();

  // 3. 상수 정의
  const SECTION_CLASSES = ['portfolio', 'about', 'contact', 'blog', 'restart'];
  const TRANSITION_DURATION = 300; // 섹션 활성화/비활성화 트랜지션 시간 (ms)
  const DICE_TRANSITION_DURATION = 200; // dice_wrapper 트랜지션 시간 (ms)
  const PORTFOLIO_ITEM_HEIGHT_REM = 3; // 포트폴리오 리스트 li 한 칸의 높이 (rem)
  const PORTFOLIO_VIEW_COUNT = 8; // 포트폴리오 목록에 한 번에 보여지는 아이템 수

  /**
   * 포커스 관리 함수들
   */

  /**
   * 현재 활성 섹션 외부의 모든 포커스 가능한 요소들을 비활성화합니다.
   * (tabIndex = -1 설정)
   * @param {string} activeSectionClass - 현재 활성화된 섹션 클래스명
   */
  const disableTabIndexOutsideSection = (activeSectionClass) => {
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
  const restoreTabIndex = () => {
    originalTabIndexes.forEach((originalValue, element) => {
      element.tabIndex = originalValue;
    });
    originalTabIndexes.clear(); // 맵 비우기
  };

  /**
   * 특정 섹션 내부에서 포커스가 순환되도록 (Focus Trap) 처리합니다.
   * @param {HTMLElement} sectionWrapper - 포커스 트랩을 적용할 섹션 래퍼 요소
   */
  const trapFocusInSection = (sectionWrapper) => {
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
  const removeFocusTrap = (sectionWrapper) => {
    if (sectionWrapper && sectionWrapper._trapFocusHandler) {
      sectionWrapper.removeEventListener('keydown', sectionWrapper._trapFocusHandler);
      delete sectionWrapper._trapFocusHandler;
    }
  };

  /**
   * 4. 섹션 활성화 및 포커스 이동 핸들러
   * @param {Event} e - 이벤트 객체
   * @param {HTMLElement} option - 클릭된(또는 엔터키 눌린) 옵션 버튼 요소
   */
  const handleOptionActivation = (e, option) => {
    e.preventDefault();
    e.stopPropagation();

    SECTION_CLASSES.forEach(className => mainElement.classList.remove(className));

    const activatedSectionClass = Array.from(option.classList).find(cls => SECTION_CLASSES.includes(cls));
    if (activatedSectionClass) {
      mainElement.classList.add(activatedSectionClass);
      disableTabIndexOutsideSection(activatedSectionClass);
    }

    setTimeout(() => {
      const activeSectionWrapper = activatedSectionClass ? mainElement.querySelector(`.${activatedSectionClass}_wrapper`) : null;

      if (activeSectionWrapper) {
        if (activatedSectionClass === 'portfolio') {
          initPortfolioSection(activeSectionWrapper);
        } else if (activatedSectionClass === 'about') {
          initAboutCarousel(activeSectionWrapper);
        } else if (activatedSectionClass === 'contact') {
          initContactSection(activeSectionWrapper);
        } else if (activatedSectionClass === 'restart') {
          initRestartSection(activeSectionWrapper);
        } else {
          const focusableElements = activeSectionWrapper.querySelectorAll('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
          if (focusableElements.length > 0) focusableElements[0].focus();
        }
        trapFocusInSection(activeSectionWrapper);
      }
    }, TRANSITION_DURATION + 50);
  };

  /**
   * 5. 뒤로가기 기능 핸들러
   * 모든 섹션 관련 클래스를 mainElement에서 제거하고, 메뉴 선택 화면으로 돌아옵니다.
   */
  const handleGoBack = () => {
    // contact 섹션에서 나갈 때 특별한 애니메이션 처리
    const isContactActive = mainElement.classList.contains('contact');
    const contactWrapper = mainElement.querySelector('.contact_wrapper');

    if (isContactActive && contactWrapper && contactWrapper._contactExitAnimation) {
      // contact 섹션 퇴장 애니메이션 실행
      contactWrapper._contactExitAnimation(() => {
        // 애니메이션 완료 후 실제 뒤로가기 처리
        performGoBack();
      });
    } else {
      // 다른 섹션들은 바로 뒤로가기 처리
      performGoBack();
    }
  };

  /**
   * 실제 뒤로가기 처리 함수
   */
  const performGoBack = () => {
    // [수정] 섹션별 리스너 제거 로직 추가
    SECTION_CLASSES.forEach(className => {
      const sectionWrapper = mainElement.querySelector(`.${className}_wrapper`);
      if (sectionWrapper) {
        removeFocusTrap(sectionWrapper);
        // [추가] About 섹션 캐러셀 리스너 제거
        if (className === 'about') {
          removeAboutCarouselListener(sectionWrapper);
        }
        // [추가] Contact 섹션 정리
        if (className === 'contact' && sectionWrapper._contactCleanup) {
          sectionWrapper._contactCleanup();
          delete sectionWrapper._contactCleanup;
          delete sectionWrapper._contactExitAnimation;
        }
      }
    });

    restoreTabIndex();
    SECTION_CLASSES.forEach(className => mainElement.classList.remove(className));

    setTimeout(() => {
      if (selectOptions.length > 0) {
        selectOptions[currentFocusedOptionIndex].focus();
      }
    }, DICE_TRANSITION_DURATION + 50);
  };

  // 6. 모든 메인 메뉴 옵션 버튼에 이벤트 리스너 등록
  selectOptions.forEach((option, index) => {
    option.tabIndex = 0; // 접근성을 위해 tabIndex 설정

    // 클릭, 포인터다운, 터치 이벤트 통합
    option.addEventListener('click', (e) => handleOptionActivation(e, option));
    option.addEventListener('pointerdown', (e) => handleOptionActivation(e, option));
    option.addEventListener('touchstart', (e) => handleOptionActivation(e, option));

    // 포커스 시 현재 인덱스 업데이트 및 'focused' 클래스 관리
    option.addEventListener('focus', function () {
      currentFocusedOptionIndex = index;
      selectOptions.forEach(otherOption => {
        otherOption.classList.remove('focused');
      });
      option.classList.add('focused');
    });

    // 키보드 네비게이션 (화살표 키, Enter 키)
    option.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentFocusedOptionIndex > 0 ? currentFocusedOptionIndex - 1 : selectOptions.length - 1;
        selectOptions[prevIndex].focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentFocusedOptionIndex < selectOptions.length - 1 ? currentFocusedOptionIndex + 1 : 0;
        selectOptions[nextIndex].focus();
      } else if (e.key === 'Enter') {
        handleOptionActivation(e, option);
      }
    });

    // 블러 이벤트 시 포커스 유지 (메인 메뉴에서만 작동)
    option.addEventListener('blur', function (e) {
      const isAnySectionActive = SECTION_CLASSES.some(className => mainElement.classList.contains(className));
      if (!isAnySectionActive && !e.relatedTarget?.closest('.select_option')) {
        e.preventDefault();
        selectOptions[currentFocusedOptionIndex].focus();
      }
    });
  });

  // 8. 초기화: 페이지 로드 시 첫 번째 옵션에 포커스
  if (selectOptions.length > 0) {
    selectOptions[0].focus();
  }

  // 9. 뒤로가기 버튼 이벤트 리스너 등록
  backButtons.forEach(backBtn => {
    const handleBackClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleGoBack();
    };
    backBtn.addEventListener('click', handleBackClick);
    backBtn.addEventListener('pointerdown', handleBackClick);
    backBtn.addEventListener('touchstart', handleBackClick);
  });

  // 10. 전역 키보드 이벤트: ESC 키로 뒤로가기
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const isAnySectionActive = SECTION_CLASSES.some(className => mainElement.classList.contains(className));
      if (isAnySectionActive) {
        e.preventDefault();
        handleGoBack();
      }
    }
  });

  // 전체화면 진입 (첫 번째 사용자 상호작용 시)
  let hasRequestedFullscreen = false;
  const requestFullscreenOnce = () => {
    if (!hasRequestedFullscreen && !document.fullscreenElement) {
      hasRequestedFullscreen = true;
      document.documentElement.requestFullscreen().catch(() => {
        console.log('전체화면 진입이 허용되지 않았습니다.');
      });
    }
  };
  document.addEventListener('click', requestFullscreenOnce, {
    once: true
  });
  document.addEventListener('keydown', requestFullscreenOnce, {
    once: true
  });
  document.addEventListener('touchstart', requestFullscreenOnce, {
    once: true
  });

  /**
   * 범용 리스트 네비게이션 핸들러 함수
   * @param {Event} e - 키보드 이벤트 객체
   * @param {HTMLElement[]} items - 탐색할 항목 요소들의 NodeList 또는 배열
   * @param {number} currentIndex - 현재 선택된 항목의 인덱스 참조
   * @param {Function} updateCallback - 인덱스 변경 시 호출될 콜백 함수 (예: UI 업데이트)
   * @param {boolean} loop - 리스트의 끝/시작에서 순환할지 여부
   * @returns {number} - 업데이트된 인덱스
   */
  const handleListNavigation = (e, items, currentIndex, updateCallback, loop = true) => {
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
   * 11-0. About 섹션 슬라이드 클릭 핸들러
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
   * 11-1. About 섹션 캐러셀 UI 업데이트
   * 클래스(active, prev, next)와 tabindex를 설정합니다.
   */
  const updateAboutCarousel = () => {
    if (!aboutContent || aboutContent.length === 0) return;
    const total = aboutContent.length;

    // 각 위치별 스타일 정의 (translateX, translateY, scale, opacity, zIndex)
    // 이 값을 조절해서 아치의 모양과 크기를 커스텀할 수 있습니다! ✨
    const positions = {
      '0': {
        x: '0',
        y: '0',
        scale: 1,
        opacity: 1,
        z: 5
      }, // active (중앙)
      '1': {
        x: '20rem',
        y: '-1rem',
        scale: 0.8,
        opacity: 0.7,
        z: 4
      }, // next (오른쪽 1)
      '-1': {
        x: '-20rem',
        y: '-1rem',
        scale: 0.8,
        opacity: 0.7,
        z: 4
      }, // prev (왼쪽 1)
      '2': {
        x: '35rem',
        y: '-6rem',
        scale: 0.6,
        opacity: 0.4,
        z: 3
      }, // 오른쪽 2
      '-2': {
        x: '-35rem',
        y: '-6rem',
        scale: 0.6,
        opacity: 0.4,
        z: 3
      }, // 왼쪽 2
      '3': {
        x: '30rem',
        y: '-12rem',
        scale: 0.4,
        opacity: 0.2,
        z: 2
      }, // 오른쪽 3
      '-3': {
        x: '-30rem',
        y: '-12rem',
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
  };
  /**
   * 11-2. About 섹션 키보드 이벤트 핸들러 (좌우 방향키)
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
   * 11-3. About 섹션 캐러셀 초기화
   */
  const initAboutCarousel = (wrapper) => {
    if (!aboutContent || aboutContent.length === 0) return;
    aboutContent.forEach(slide => {
      if (!slide.hasAttribute('tabindex')) {
        slide.tabIndex = -1;
      }
    });
    currentAboutContentIndex = Math.floor(aboutContent.length / 2);
    updateAboutCarousel();

    // 키보드 이벤트 리스너 등록
    aboutKeyDownHandler = handleAboutKeyDown;
    wrapper.addEventListener('keydown', aboutKeyDownHandler);

    // [추가] 클릭 이벤트 리스너 등록
    wrapper.addEventListener('click', handleAboutClick);

    // 초기 포커스 설정
    aboutContent[currentAboutContentIndex]?.focus();
  };

  /**
   * 11-4. About 섹션 캐러셀 이벤트 리스너 제거
   */
  const removeAboutCarouselListener = (wrapper) => {
    if (wrapper) {
      // 키보드 리스너 제거
      if (aboutKeyDownHandler) {
        wrapper.removeEventListener('keydown', aboutKeyDownHandler);
        aboutKeyDownHandler = null;
      }
      // [추가] 클릭 리스너 제거
      wrapper.removeEventListener('click', handleAboutClick);
    }
  };

  /**
   * 컨택트 섹션 초기화 - 회전하는 텍스트 효과
   * @param {HTMLElement} wrapper - 컨택트 섹션 래퍼 요소
   */
  const initContactSection = (wrapper) => {
    let time = 0;
    let mouseX = window.innerWidth * 0.5;
    let x = 0.5; // [수정] 중앙에서 시작하도록
    let animationId = null;
    let isAnimating = false;
    let isDetailView = false; // [추가] 현재 뷰 상태 (링/디테일)

    // DOM 요소 캐싱
    const ringsContainer = wrapper.querySelector('.contact_space_container');
    const detailViewContainer = wrapper.querySelector('.detail_view_txt');
    const detailViewList = detailViewContainer.querySelector('ul');
    const detailViewBtn = detailViewContainer.querySelector('.detail_view_btn');

    const opt = {
      baseRadius: 100,
      radiusY: 0.4,
      maxSpeed: 0.01,
      maxRotation: 30,
      minOpacity: 0.4,
      spacer: ' ',
      minRadius: 80,
      maxRadius: 300,
    };

    // 각 링의 기본 설정 (반지름, 각도, 속도 배수, 최소 속도)
    const ringConfigs = [{
        baseRadius: 120,
        angleX: 15,
        angleY: 0,
        angleZ: 0,
        speedMultiplier: 1.0,
        minSpeed: 0.003
      },
      {
        baseRadius: 160,
        angleX: 15,
        angleY: 10,
        angleZ: 15,
        speedMultiplier: 1.3,
        minSpeed: 0.005
      },
      {
        baseRadius: 200,
        angleX: 15,
        angleY: -10,
        angleZ: -10,
        speedMultiplier: 0.8,
        minSpeed: 0.002
      }
    ];

    let allRingLetters = []; // 모든 링 글자(span)를 담을 배열

    const scale = (a, b, c, d, e) => {
      return ((a - b) * (e - d)) / (c - b) + d;
    };

    const lerp = (v0, v1, t) => {
      return v0 * (1 - t) + v1 * t;
    };

    const rings = wrapper.querySelectorAll('.contact_ring');

    // 각 링에 대해 텍스트를 span으로 분할하고 설정 적용
    detailViewList.innerHTML = ''; // 리스트 초기화
    rings.forEach((ring, ringIndex) => {
      const text = ring.getAttribute('data-text');
      const config = ringConfigs[ringIndex];
      const letters = text.split('');

      // A. 디테일 뷰 리스트(li) 생성
      const li = document.createElement('li');
      letters.forEach(char => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char; // 공백문자 처리
        li.appendChild(span);
      });
      detailViewList.appendChild(li);

      // B. 링 글자(span) 생성
      ring.innerHTML = '';
      letters.forEach((letterChar) => {
        const span = document.createElement('span');
        span.innerHTML = letterChar;
        span.classList.add('preparing');
        ring.appendChild(span);
        allRingLetters.push(span); // 배열에 추가
      });
      ring.style.transform = `rotateX(${config.angleX}deg) rotateY(${config.angleY}deg) rotateZ(${config.angleZ}deg)`;
      ring.style.transformStyle = 'preserve-3d';
    });

    // 진입 애니메이션 시작
    const startEnterAnimation = () => {
      isAnimating = true;
      const allSpans = wrapper.querySelectorAll('.contact_ring span');

      allSpans.forEach((span, globalIndex) => {
        // 해당 span이 속한 링과 링 내에서의 인덱스 찾기
        let ringIndex = 0;
        let letterIndex = 0;
        let currentCount = 0;

        rings.forEach((ring, rIndex) => {
          const ringSpans = ring.querySelectorAll('span');
          if (globalIndex >= currentCount && globalIndex < currentCount + ringSpans.length) {
            ringIndex = rIndex;
            letterIndex = globalIndex - currentCount;
          }
          currentCount += ringSpans.length;
        });

        // 해당 글자의 최종 위치 계산 (회전 애니메이션에서 사용하는 것과 동일한 로직)
        const config = ringConfigs[ringIndex];
        const ringSpans = rings[ringIndex].querySelectorAll('span');
        const theta = letterIndex / ringSpans.length;
        const ringTime = ringIndex * Math.PI * 0.5; // 링마다 위상차
        const baseRadius = config.baseRadius;

        // 최종 위치 계산 (초기 상태)
        const finalX = baseRadius * Math.sin(ringTime + theta * Math.PI * 2);
        const finalY = baseRadius * opt.radiusY * Math.cos(ringTime + theta * Math.PI * 2);

        // span에 초기 목표 위치 저장
        span.setAttribute('data-final-x', finalX);
        span.setAttribute('data-final-y', finalY);

        // CSS 변수로 최종 위치 설정
        span.style.setProperty('--final-x', `${finalX}px`);
        span.style.setProperty('--final-y', `${finalY}px`);

        setTimeout(() => {
          span.classList.remove('preparing');
          span.classList.add('entering');

          // 진입 애니메이션 완료 후 클래스 제거
          setTimeout(() => {
            // 1. CSS 애니메이션의 최종 위치를 JS 인라인 스타일로 고정합니다.
            const finalX = span.getAttribute('data-final-x');
            const finalY = span.getAttribute('data-final-y');
            span.style.transform = `translate3d(${finalX}px, ${finalY}px, 0)`;

            // 2. 이제 안심하고 애니메이션 클래스를 제거합니다.
            span.classList.remove('entering');

            // 3. 마지막 글자 애니메이션이 끝나면 메인 루프를 시작합니다.
            if (globalIndex === allSpans.length - 1) {
              isAnimating = false;
              startMainAnimation();
            }
          }, 800); // spanEnter 애니메이션 지속 시간(800ms)과 동일
        }, globalIndex * 50); // 50ms씩 지연
      });
    };

    // 퇴장 애니메이션 시작
    const startExitAnimation = (callback) => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }

      isAnimating = true;
      const allSpans = wrapper.querySelectorAll('.contact_ring span');
      const spanArray = Array.from(allSpans);

      // 랜덤 순서로 섞기
      for (let i = spanArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [spanArray[i], spanArray[j]] = [spanArray[j], spanArray[i]];
      }

      spanArray.forEach((span, index) => {
        setTimeout(() => {
          const startX = span.dataset.lastX || 0;
          const startY = span.dataset.lastY || 0;
          span.style.setProperty('--start-x', `${startX}px`);
          span.style.setProperty('--start-y', `${startY}px`);

          span.classList.add('exiting');
        }, index * 30); // 30ms씩 지연으로 빠르게 떨어짐
      });

      // 모든 애니메이션이 끝난 후 콜백 실행
      setTimeout(() => {
        if (callback) callback();
      }, spanArray.length * 30 + 600);
    };

    const startMainAnimation = () => {
      const animate = () => {
        if (isAnimating) {
          animationId = requestAnimationFrame(animate);
          return;
        }

        rings.forEach((ring, ringIndex) => {
          const letters = ring.querySelectorAll('span:not(.entering):not(.exiting):not(.preparing)');
          if (!letters.length) return;

          x = lerp(x, mouseX / window.innerWidth, 0.1);
          const rotation = -opt.maxRotation + x * opt.maxRotation * 2;
          const baseSpeed = -opt.maxSpeed + x * opt.maxSpeed * 2;
          const modY = 1 + x * -2;

          const config = ringConfigs[ringIndex];

          // 마우스 위치에 따른 반지름 계산
          const centerX = window.innerWidth / 2;
          const distanceFromCenter = Math.abs(mouseX - centerX);
          const maxDistance = centerX;
          const currentRadius = scale(distanceFromCenter, 0, maxDistance, opt.minRadius, opt.maxRadius) * (config.baseRadius / opt.baseRadius);

          // 최소 속도를 보장하는 속도 계산
          const finalSpeed = Math.max(Math.abs(baseSpeed * config.speedMultiplier), config.minSpeed) * Math.sign(baseSpeed || -1);
          time -= finalSpeed; // 각 링마다 다른 속도와 최소 속도 적용

          letters.forEach((letter, letterIndex) => {
            const theta = letterIndex / letters.length;
            const ringTime = time + ringIndex * Math.PI * 0.5; // 링마다 위상차
            const xPos = currentRadius * Math.sin(ringTime + theta * Math.PI * 2);
            const yPos = currentRadius * opt.radiusY * Math.cos(modY + ringTime + theta * Math.PI * 2);
            const opacity = scale(yPos, -currentRadius * opt.radiusY, currentRadius * opt.radiusY, opt.minOpacity, 1);

            Object.assign(letter.style, {
              zIndex: Math.min(10, Math.max(-10, Math.ceil(yPos))),
              filter: `blur(${Math.max(0, 2 - 3 * opacity)}px)`,
              opacity: opacity,
              transform: `translate3d(${xPos}px, ${yPos}px, 0) rotate(${rotation}deg)`,
            });

            letter.dataset.lastX = xPos;
            letter.dataset.lastY = yPos;
          });
        });
        animationId = requestAnimationFrame(animate);
      };
      animate();
    };

    const animateViewChange = (toDetail) => {
      if (isAnimating) return;
      isAnimating = true;

      const sourceElements = toDetail ? allRingLetters : Array.from(detailViewList.querySelectorAll('li span'));
      const targetElements = toDetail ? Array.from(detailViewList.querySelectorAll('li span')) : allRingLetters;

      if (!toDetail) { // 리스트 -> 링으로 돌아갈 때
        ringsContainer.style.opacity = '1';
        detailViewContainer.classList.remove('visible');
      }

      // 1. 목표 위치 계산
      const targetPositions = targetElements.map(el => el.getBoundingClientRect());

      sourceElements.forEach((sourceEl, index) => {
        const startPos = sourceEl.getBoundingClientRect();
        const targetPos = targetPositions[index];

        // 2. 글자 복제본 생성
        const clone = document.createElement('span');
        clone.textContent = sourceEl.textContent;
        clone.className = 'letter-clone';
        clone.style.fontSize = window.getComputedStyle(sourceEl).fontSize;

        // 3. 복제본을 시작 위치에 배치
        clone.style.transform = `translate(${startPos.left}px, ${startPos.top}px)`;
        clone.style.left = '0px';
        clone.style.top = '0px';

        document.body.appendChild(clone);

        // 원본 숨기기
        sourceEl.style.opacity = 0;

        // 4. 복제본을 목표 위치로 애니메이션
        requestAnimationFrame(() => {
          clone.classList.add(toDetail ? 'to-detail' : 'to-ring');
          clone.style.transform = `translate(${targetPos.left}px, ${targetPos.top}px)`;
        });

        // 5. 애니메이션 후 정리
        clone.addEventListener('transitionend', () => {
          clone.remove();
          targetElements[index].style.opacity = 1;
          if (index === sourceElements.length - 1) {
            isAnimating = false;
            if (!toDetail) { // 링으로 돌아왔을 때만 메인 애니메이션 다시 시작
              startMainAnimation();
            }
          }
        }, {
          once: true
        });
      });

      if (toDetail) { // 링 -> 리스트로 갈 때
        ringsContainer.style.opacity = '0';
        detailViewContainer.classList.add('visible');
        detailViewContainer.querySelectorAll('li').forEach((li, i) => {
          li.style.transitionDelay = `${i * 0.1}s`;
        });
      }
    };

    // 6. [신규] 디테일 뷰 토글 핸들러
    const handleDetailViewToggle = () => {
      if (isDetailView) { // 리스트 -> 링
        animateViewChange(false);
      } else { // 링 -> 리스트
        cancelAnimationFrame(animationId);
        animationId = null;
        animateViewChange(true);
      }
      isDetailView = !isDetailView;
      detailViewBtn.textContent = isDetailView ? '돌아가기' : '자세히 보기';
    };

    const handleMouse = (e) => {
      if (e.type === 'mousemove') {
        mouseX = e.clientX;
      } else if (e.type === 'touchstart' || e.type === 'touchmove') {
        mouseX = e.touches[0]?.clientX || mouseX;
      }
    };

    // 이벤트 리스너 등록
    wrapper.addEventListener('mousemove', handleMouse);
    wrapper.addEventListener('touchstart', handleMouse);
    wrapper.addEventListener('touchmove', handleMouse);
    detailViewBtn.addEventListener('click', handleDetailViewToggle); // 버튼 클릭 리스너

    // 진입 애니메이션 시작
    setTimeout(() => {
      startEnterAnimation();
    }, 100);

    // 포커스 설정
    const backBtn = wrapper.querySelector('.back_btn');
    if (backBtn) backBtn.focus();

    // 정리 함수를 wrapper에 저장 (나중에 섹션을 벗어날 때 사용)
    wrapper._contactCleanup = () => {
      if (animationId) cancelAnimationFrame(animationId);

      wrapper.removeEventListener('mousemove', handleMouse);
      wrapper.removeEventListener('touchstart', handleMouse);
      wrapper.removeEventListener('touchmove', handleMouse);
    };

    // 퇴장 애니메이션 함수를 wrapper에 저장
    wrapper._contactExitAnimation = startExitAnimation;
  };

  /**
   * 포트폴리오 섹션 초기화
   * @param {HTMLElement} wrapper - 포트폴리오 섹션 래퍼 요소
   */
  const initPortfolioSection = (wrapper) => {
    const firstPortfolioItem = portfolioContentList ? portfolioContentList.querySelector('li') : null;
    if (firstPortfolioItem) {
      firstPortfolioItem.focus();
      updatePortfolioSelection();
    } else {
      const focusableElements = wrapper.querySelectorAll('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
      if (focusableElements.length > 0) focusableElements[0].focus();
    }
  };

  /**
   * 리스타트 섹션 초기화
   * @param {HTMLElement} wrapper - 리스타트 섹션 래퍼 요소
   */
  const initRestartSection = (wrapper) => {
    let startTime = null;

    const checkTimeAndRedirect = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (elapsed >= 2000) { // 2초 경과 시
        window.location.href = 'index.html';
      } else {
        requestAnimationFrame(checkTimeAndRedirect);
      }
    };

    requestAnimationFrame(checkTimeAndRedirect);
  };


  // 12. 포트폴리오 데이터 불러오기 및 렌더링
  async function importPortfolio() {
    try {
      const response = await fetch('./src/portfolio_data.json');
      if (!response.ok) {
        throw new Error('데이터를 불러올 수 없습니다.');
      }
      portfolioData = await response.json();
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      // 데이터 로드 실패 시 기본 데이터로 대체
      portfolioData = [{
        title: "데이터 로드 실패",
        img: "",
        link: "#"
      }];
    }
    fetchPortfolio(); // 데이터 로드 후 포트폴리오 렌더링 시작
  }

  /**
   * 포트폴리오 데이터를 li 요소로 생성하여 배치합니다.
   */
  function fetchPortfolio() {
    if (!portfolioContentList || !portfolioData || portfolioData.length === 0 || !portfolioData[0]) {
      console.warn("포트폴리오 데이터를 불러올 수 없거나 요소가 없습니다.");
      return;
    }

    const portfolioItems = portfolioData[0]; // portfolioData는 이중 배열이므로 첫 번째 배열을 가져옴

    // 기존 li 요소들 제거
    portfolioContentList.innerHTML = '';

    portfolioItems.forEach((item, index) => {
      const li = document.createElement('li');
      li.textContent = item.title;
      li.setAttribute('data-img', item.img);
      li.setAttribute('data-link', item.link);
      li.setAttribute('data-index', index);
      li.tabIndex = 0; // li 요소도 포커스 가능하도록 tabIndex 설정

      // 클릭/터치 이벤트: 선택된 아이템 업데이트
      li.addEventListener('pointerdown', () => {
        currentPortfolioItemIndex = index;
        updatePortfolioSelection();
      });

      // 키보드 이벤트: 범용 핸들러를 사용하여 이동 및 선택
      li.addEventListener('keydown', (e) => {
        currentPortfolioItemIndex = handleListNavigation(
          e,
          Array.from(portfolioContentList.children), // NodeList를 배열로 변환
          currentPortfolioItemIndex,
          (newIndex) => {
            currentPortfolioItemIndex = newIndex; // 인덱스 업데이트
            updatePortfolioSelection(); // 선택 상태 업데이트
          },
          true // 무한 순환
        );
      });

      portfolioContentList.appendChild(li);
    });

    // 초기 포트폴리오 뷰 설정
    currentPortfolioItemIndex = 0; // 항상 첫 번째 항목부터 시작
    updatePortfolioSelection(); // 초기 선택 상태 및 썸네일 업데이트

    // 마우스 휠 이벤트를 viewer에 추가 (passive: false로 기본 스크롤 방지)
    if (portfolioListContainer) {
      portfolioListContainer.addEventListener('wheel', handlePortfolioWheel, {
        passive: false
      });
    }
  }

  /**
   * 포트폴리오 목록 보기 업데이트 (스크롤 위치 조정)
   */
  function updatePortfolioView() {
    if (!portfolioContentList) return;

    // 현재 선택된 아이템이 뷰포트 중앙에 오도록 스크롤 위치 조정
    const allLiElements = portfolioContentList.querySelectorAll('li');
    if (allLiElements.length === 0) return;

    // 현재 선택된 아이템의 위치를 기준으로 스크롤 오프셋 계산
    const currentItemOffsetTop = allLiElements[currentPortfolioItemIndex].offsetTop;
    const containerScrollTop = portfolioListContainer.scrollTop;
    const containerHeight = portfolioListContainer.clientHeight;
    const currentItemHeight = allLiElements[currentPortfolioItemIndex].offsetHeight;

    // 아이템이 뷰어 중앙에 오도록 스크롤 조정 (약간의 여백 고려)
    const targetScrollTop = currentItemOffsetTop - (containerHeight / 2) + (currentItemHeight / 2);
    portfolioListContainer.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });
  }


  /**
   * 포트폴리오 선택 아이템 업데이트 (active 클래스 및 썸네일)
   */
  function updatePortfolioSelection() {
    if (!portfolioContentList || portfolioData.length === 0 || !portfolioData[0]) return;

    const allLiElements = portfolioContentList.querySelectorAll('li');
    // 모든 li에서 active 클래스 제거
    allLiElements.forEach(li => li.classList.remove('active'));

    // 현재 선택된 아이템에 active 클래스 추가
    if (allLiElements[currentPortfolioItemIndex]) {
      allLiElements[currentPortfolioItemIndex].classList.add('active');

      // 썸네일 이미지 업데이트
      const selectedItem = portfolioData[0][currentPortfolioItemIndex];
      if (selectedItem) {
        updateThumbnail(selectedItem.img, selectedItem.link);
      }
    }
  }

  /**
   * 포트폴리오 마우스 휠 핸들러 (아이템 단위 무한 롤링)
   */
  function handlePortfolioWheel(e) {
    e.preventDefault(); // 기본 스크롤 동작 방지

    const portfolioItems = portfolioData[0] || [];
    if (portfolioItems.length === 0) return;

    let newIndex = currentPortfolioItemIndex;

    if (e.deltaY > 0) { // 아래로 스크롤 (다음 아이템)
      newIndex = (currentPortfolioItemIndex + 1) % portfolioItems.length;
    } else { // 위로 스크롤 (이전 아이템)
      newIndex = (currentPortfolioItemIndex - 1 + portfolioItems.length) % portfolioItems.length;
    }

    if (newIndex !== currentPortfolioItemIndex) {
      currentPortfolioItemIndex = newIndex;
      // 휠로 이동 시 해당 li에 포커스를 주지 않고 썸네일만 업데이트
      // 포커스는 키보드 네비게이션 시에만 li에 줍니다.
      updatePortfolioSelection();
    }
  }

  /**
   * 썸네일 이미지 및 링크 업데이트
   * @param {string} imgName - 이미지 파일명 (확장자 제외)
   * @param {string} link - 연결할 URL
   */
  function updateThumbnail(imgName, link) {
    const thumbnailAnchor = document.querySelector('.content_thumbnail a');
    if (thumbnailAnchor) {
      thumbnailAnchor.style.backgroundImage = `url(./src/image/${imgName}.jpg)`;
      thumbnailAnchor.href = link || '#none'; // 링크가 없으면 #none으로 설정

      // 링크 유무에 따라 커서 및 클릭 이벤트 변경
      if (link && link !== '#none') {
        thumbnailAnchor.style.cursor = 'pointer';
        thumbnailAnchor.onclick = (e) => {
          e.preventDefault(); // 기본 링크 이동 방지
          window.open(link, '_blank'); // 새 탭에서 열기
        };
      } else {
        thumbnailAnchor.style.cursor = 'default';
        thumbnailAnchor.onclick = null; // 클릭 이벤트 제거
      }
    }
  }

  // 초기 포트폴리오 데이터 로드
  importPortfolio();
})();