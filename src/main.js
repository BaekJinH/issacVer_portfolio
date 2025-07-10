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
  let currentAboutContentIndex = 0; // About 섹션 슬라이드 인덱스 (이름 명확화)
  let aboutKeyDownHandler = null; // About 섹션 이벤트 핸들러 참조 저장용
  let portfolioData = []; // 포트폴리오 데이터
  let currentPortfolioItemIndex = 0; // 포트폴리오 목록에서 현재 선택된 아이템 인덱스
  let currentBlogIconIndex = 0; // 블로그 섹션 아이콘 네비게이션 인덱스
  let blogKeyDownHandler = null; // 블로그 섹션 이벤트 핸들러 참조 저장용
  let originalTabIndexes = new Map();

  // 3. 상수 정의
  const SECTION_CLASSES = ['portfolio', 'about', 'contact', 'blog', 'restart'];
  const TRANSITION_DURATION = 300; // 섹션 활성화/비활성화 트랜지션 시간 (ms)
  const DICE_TRANSITION_DURATION = 200; // dice_wrapper 트랜지션 시간 (ms)
  const PORTFOLIO_ITEM_HEIGHT_REM = 3; // 포트폴리오 리스트 li 한 칸의 높이 (rem)
  const PORTFOLIO_VIEW_COUNT = 8; // 포트폴리오 목록에 한 번에 보여지는 아이템 수

  // About 섹션 캐릭터별 특징 배열
  const CHARACTER_FEATURES = [
    "첫 취업 웹 퍼블리셔 / 실무 경험 부족 /<br>자신감 부족 상태",
    "경력 1년 8개월 / 잦은 파견 및 과도한 업무로 실무경험 다량 /<br>주변인, 경영진의 평가가 좋음",
    "경력 포기 후 컨텐츠 작업 다수 위해 인턴 취업 /<br>자신의 역량 파악 후 자신감 더욱 상승 / 주변인, 경영진의 평가가 좋음",
    "고등학교 3학년 원하는 바였던<br>서양학과를 포기 후 진로 미결정",
    "비슷한 과인 디지털 미디어과 입학하였으나<br>생각과 많이 다름 / 코딩 첫 경험",
    "대학 자퇴 후 방황 중 군 입대",
    "전역 후 대학 때 첫 경험한 코딩이 흥미로웠다는걸<br>느끼고 코딩 공부 시작 / 퍼블리싱 아카데미 시작"
  ];

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
        } else if (activatedSectionClass === 'blog') {
          initBlogSection(activeSectionWrapper);
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

    if (isContactActive && contactWrapper) {
      // 자세히 보기 상태인지 확인
      const isDetailView = contactWrapper._getDetailViewState && contactWrapper._getDetailViewState();

      if (isDetailView && contactWrapper._contactDetailExitAnimation) {
        // 자세히 보기 상태에서의 특별한 퇴장 애니메이션 실행
        contactWrapper._contactDetailExitAnimation(() => {
          // 애니메이션 완료 후 실제 뒤로가기 처리
          performGoBack();
        });
      } else if (contactWrapper._contactExitAnimation) {
        // 일반 contact 섹션 퇴장 애니메이션 실행
        contactWrapper._contactExitAnimation(() => {
          // 애니메이션 완료 후 실제 뒤로가기 처리
          performGoBack();
        });
      } else {
        // 애니메이션 함수가 없으면 바로 뒤로가기
        performGoBack();
      }
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
        // [추가] Blog 섹션 네비게이션 리스너 제거
        if (className === 'blog') {
          removeBlogNavigationListener(sectionWrapper);
        }
        // [추가] Contact 섹션 정리
        if (className === 'contact' && sectionWrapper._contactCleanup) {
          sectionWrapper._contactCleanup();
          delete sectionWrapper._contactCleanup;
          delete sectionWrapper._contactExitAnimation;
        }
        // [추가] Blog 섹션 정리
        if (className === 'blog') {
          sectionWrapper.classList.remove('glitch-active');

          // 픽셀 윈도우 닫기
          const pixelWindow = document.querySelector('#pixel_window');
          if (pixelWindow && pixelWindow.classList.contains('visible')) {
            closePixelWindow();
          }

          // 스킬 픽셀 윈도우 닫기 및 정리
          const skillWindow = document.querySelector('#skill_pixel_window');
          if (skillWindow) {
            if (skillWindow.classList.contains('visible')) {
              closeSkillPixelWindow();
            }
            // 스킬 윈도우 이벤트 리스너 정리
            if (skillWindow._closeListeners) {
              document.removeEventListener('keydown', skillWindow._closeListeners.keydown);
              document.removeEventListener('keydown', skillWindow._closeListeners.focusTrap);
              skillWindow.removeEventListener('click', skillWindow._closeListeners.click);
              delete skillWindow._closeListeners;
            }
          }

          // 팝업 닫기
          const popupWrapper = document.querySelector('#popup_wrapper');
          if (popupWrapper) {
            popupWrapper.classList.remove('visible');
            // 팝업 이벤트 리스너 정리
            if (popupWrapper._closeListeners) {
              document.removeEventListener('keydown', popupWrapper._closeListeners.keydown);
              popupWrapper.removeEventListener('click', popupWrapper._closeListeners.click);
              delete popupWrapper._closeListeners;
            }
          }
          // 검색 기능 정리
          if (sectionWrapper._searchCleanup) {
            sectionWrapper._searchCleanup();
            delete sectionWrapper._searchCleanup;
          }
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

    // 키보드 네비게이션 (화살표 키, Tab 키, Enter 키)
    option.addEventListener('keydown', function (e) {
      const isAnySectionActive = SECTION_CLASSES.some(className => mainElement.classList.contains(className));

      // 섹션이 활성화된 상태에서는 메인 메뉴 네비게이션 비활성화
      if (isAnySectionActive) {
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentFocusedOptionIndex > 0 ? currentFocusedOptionIndex - 1 : selectOptions.length - 1;
        selectOptions[prevIndex].focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentFocusedOptionIndex < selectOptions.length - 1 ? currentFocusedOptionIndex + 1 : 0;
        selectOptions[nextIndex].focus();
      } else if (e.key === 'Tab') {
        // Tab 키로 메뉴 내에서 순환 (Shift+Tab은 역방향)
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Tab: 이전 옵션으로
          const prevIndex = currentFocusedOptionIndex > 0 ? currentFocusedOptionIndex - 1 : selectOptions.length - 1;
          selectOptions[prevIndex].focus();
        } else {
          // Tab: 다음 옵션으로
          const nextIndex = currentFocusedOptionIndex < selectOptions.length - 1 ? currentFocusedOptionIndex + 1 : 0;
          selectOptions[nextIndex].focus();
        }
      } else if (e.key === 'Enter') {
        handleOptionActivation(e, option);
      }
    });

    // 블러 이벤트 시 포커스 유지 (메인 메뉴에서만 작동)
    option.addEventListener('blur', function (e) {
      const isAnySectionActive = SECTION_CLASSES.some(className => mainElement.classList.contains(className));
      if (!isAnySectionActive && !e.relatedTarget?.closest('.select_option')) {
        // 약간의 지연을 두고 포커스를 다시 설정 (다른 이벤트들이 완료된 후)
        setTimeout(() => {
          const stillNoSectionActive = !SECTION_CLASSES.some(className => mainElement.classList.contains(className));
          if (stillNoSectionActive && !document.activeElement?.closest('.select_option')) {
            selectOptions[currentFocusedOptionIndex].focus();
          }
        }, 0);
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

  // 전체화면 토글 기능
  const fullscreenToggleBtn = document.querySelector('.fullscreen_toggle_btn');
  const fullscreenIcon = document.querySelector('.fullscreen_icon');
  const fullscreenText = document.querySelector('.fullscreen_text');

  /**
   * 전체화면 상태를 토글합니다.
   */
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // 전체화면 진입
        await document.documentElement.requestFullscreen();
        fullscreenIcon.textContent = '⛸'; // 축소 아이콘
        fullscreenText.textContent = '창모드';
      } else {
        // 전체화면 종료
        await document.exitFullscreen();
        fullscreenIcon.textContent = '⛶'; // 확대 아이콘
        fullscreenText.textContent = '전체화면';
      }
    } catch (error) {
      console.log('전체화면 전환 중 오류가 발생했습니다:', error);
    }
  };

  /**
   * 전체화면 상태 변경 감지 및 UI 업데이트
   */
  const handleFullscreenChange = () => {
    if (document.fullscreenElement) {
      fullscreenIcon.textContent = '⛸';
      fullscreenText.textContent = '창모드';
    } else {
      fullscreenIcon.textContent = '⛶';
      fullscreenText.textContent = '전체화면';
    }
  };

  // 전체화면 버튼 이벤트 리스너
  if (fullscreenToggleBtn) {
    fullscreenToggleBtn.addEventListener('click', toggleFullscreen);
    fullscreenToggleBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleFullscreen();
      }
    });
  }

  // 전체화면 상태 변경 감지
  document.addEventListener('fullscreenchange', handleFullscreenChange);

  // 키보드 입력 시각적 피드백 시스템
  const keyboardInfoSpans = document.querySelectorAll('.keyboard_info_text p span');

  /**
   * 키보드 입력에 대한 시각적 피드백을 제공합니다.
   */
  const handleKeyboardFeedback = () => {
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

  // 키보드 피드백 시스템 초기화
  if (keyboardInfoSpans.length >= 6) {
    handleKeyboardFeedback();
  }

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
   * 클래스(active, prev, next)와 tabindex를 설정하고, 현재 캐릭터의 특징을 표시합니다.
   */
  const updateAboutCarousel = () => {
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

    // 자세히 보기 상태에서의 퇴장 애니메이션 (글자들이 아래로 떨어짐)
    const startDetailViewExitAnimation = (callback) => {
      isAnimating = true;
      const detailSpans = detailViewList.querySelectorAll('li span');
      const spanArray = Array.from(detailSpans);

      // 글자들을 아래로 떨어뜨리는 애니메이션
      spanArray.forEach((span, index) => {
        setTimeout(() => {
          const rect = span.getBoundingClientRect();
          span.style.setProperty('--start-x', `${rect.left}px`);
          span.style.setProperty('--start-y', `${rect.top}px`);

          span.classList.add('detail-exiting');
        }, index * 20); // 20ms씩 지연으로 순차적으로 떨어짐
      });

      // 모든 애니메이션이 끝난 후 콜백 실행
      setTimeout(() => {
        if (callback) callback();
      }, spanArray.length * 20 + 800);
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

    // 퇴장 애니메이션 함수들과 상태를 wrapper에 저장
    wrapper._contactExitAnimation = startExitAnimation;
    wrapper._contactDetailExitAnimation = startDetailViewExitAnimation;
    wrapper._getDetailViewState = () => isDetailView;
  };

  /**
   * 포트폴리오 섹션 초기화
   * @param {HTMLElement} wrapper - 포트폴리오 섹션 래퍼 요소
   */
  const initPortfolioSection = (wrapper) => {
    // 이 함수는 이제 첫 포커스만 담당합니다.
    // 실제 데이터 렌더링은 importPortfolio가 완료된 후 fetchPortfolio에서 처리됩니다.
    const firstPortfolioItem = portfolioContentList ? portfolioContentList.querySelector('li') : null;
    if (firstPortfolioItem) {
      firstPortfolioItem.focus();
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

  /**
   * 블로그 섹션 초기화 - 화면 전체 글리치 효과
   * @param {HTMLElement} wrapper - 블로그 섹션 래퍼 요소
   */
  const initBlogSection = (wrapper) => {
    const screenWrapper = wrapper.querySelector('.screen_wrapper');
    const screenInner = wrapper.querySelector('.screen_inner');
    if (!screenInner) return;

    // CSS로 정의된 배경색을 정확하게 가져오기
    const computedStyle = window.getComputedStyle(screenInner);
    let backgroundColor = computedStyle.backgroundColor;

    // 배경색이 투명하거나 없으면 기본값 설정
    if (!backgroundColor || backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
      backgroundColor = '#999'; // 블로그 래퍼의 배경색과 동일하게
    }

    // html2canvas로 .screen_wrapper 요소를 캡처
    html2canvas(screenWrapper, {
      backgroundColor: backgroundColor,
      useCORS: true,
      allowTaint: true,
      scale: 1,
      logging: false,
      removeContainer: true
    }).then(canvas => {
      // 캡처가 완료되면, 생성된 canvas에 글리치 효과를 적용
      applyGlitchEffect(canvas);

      // 캡처 후 원래대로 숨김
      wrapper.style.transition = 'transform 0.3s ease-in-out';
      mainElement.classList.remove('blog');
      setTimeout(() => mainElement.classList.add('blog'), 20);

      // 블로그 섹션 네비게이션 초기화
      initBlogNavigation(wrapper);

      // 뒤로가기 버튼에 포커스 설정 (기본 동작)
      const backBtn = wrapper.querySelector('.back_btn');
      if (backBtn) {
        backBtn.focus();
      }

      // Tab 키로 검색창에 접근할 수 있도록 tabindex 설정
      const searchInput = wrapper.querySelector('.search_wrapper input');
      if (searchInput) {
        searchInput.tabIndex = 0;
      }
    }).catch(error => {
      console.error('html2canvas 에러:', error);
    });
  };

  /**
   * 생성된 캔버스에 글리치 효과를 적용하고 화면에 표시
   * @param {HTMLCanvasElement} canvas - html2canvas로 생성된 캔버스
   */
  const applyGlitchEffect = (canvas) => {
    // 글리치 효과를 담을 전체 화면 오버레이 생성
    const glitchOverlay = document.createElement('div');
    glitchOverlay.className = 'glitch-canvas-overlay';

    // 캔버스의 내용을 배경 이미지로 사용하는 레이어 2개 생성 (글리치 효과용)
    const glitchLayer1 = document.createElement('div');
    glitchLayer1.className = 'glitch-layer';
    glitchLayer1.style.backgroundImage = `url(${canvas.toDataURL()})`;

    const glitchLayer2 = glitchLayer1.cloneNode(true);

    // 오버레이에 레이어들 추가
    glitchOverlay.appendChild(glitchLayer1);
    glitchOverlay.appendChild(glitchLayer2);

    // body에 오버레이 추가
    document.body.appendChild(glitchOverlay);

    // 글리치 애니메이션이 끝나면 오버레이 제거
    setTimeout(() => {
      glitchOverlay.remove();
    }, 800); // 0.8초 후 제거 (CSS 애니메이션 시간과 맞춤)
  };

  /**
   * 블로그 섹션 네비게이션 초기화
   * @param {HTMLElement} wrapper - 블로그 섹션 래퍼 요소
   */
  const initBlogNavigation = (wrapper) => {
    // 네비게이션 가능한 아이콘들 선택 (뒤로가기 버튼 제외)
    const blogIcons = wrapper.querySelectorAll('.screen_inner ul li a');
    if (blogIcons.length === 0) return;

    // 초기 인덱스 설정
    currentBlogIconIndex = 0;

    /**
     * 블로그 아이콘 선택 상태 업데이트
     */
    const updateBlogIconSelection = () => {
      blogIcons.forEach((icon, index) => {
        icon.classList.toggle('focused', index === currentBlogIconIndex);
        if (index === currentBlogIconIndex) {
          icon.focus();
        }
      });
    };

    /**
     * 블로그 아이콘 활성화 (Enter/Space 키 또는 클릭 시)
     * @param {HTMLElement} icon - 활성화할 아이콘 요소
     */
    const activateBlogIcon = (icon) => {
      if (!icon) return;

      // Skill Note 버튼인 경우
      if (icon.id === 'skill_note_btn' || icon.classList.contains('skill_note_btn')) {
        handleSkillNoteClick({
          preventDefault: () => {},
          stopPropagation: () => {}
        });
        return;
      }

      // 외부 링크인 경우 (GitHub, Notion) - 픽셀 윈도우에서 열기
      const href = icon.getAttribute('href');

      if (href && href !== '#none') {
        const iconText = icon.querySelector('.icon_text');
        const siteName = iconText ? iconText.textContent : 'Website';
        openPixelWindow(href, siteName);
      }
    };

    /**
     * Skill Note 버튼 클릭 핸들러
     * @param {Event} e - 클릭 이벤트
     */
    const handleSkillNoteClick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      // 스킬 데이터 로드 및 픽셀 윈도우 표시
      loadSkillData()
        .then(skillData => {
          createSkillList(skillData);
          openSkillPixelWindow();
        })
        .catch(error => {
          console.error('스킬 데이터 로드 실패:', error);
          // 에러 발생 시에도 윈도우는 보여주되, 에러 메시지 표시
          createErrorSkillList();
          openSkillPixelWindow();
        });
    };

    /**
     * 현재 검색된 아이콘들을 가져오는 함수
     * @returns {Array} 검색된 아이콘들의 배열
     */
    const getVisibleIcons = () => {
      return Array.from(blogIcons).filter(icon => {
        const listItem = icon.closest('li');
        return !listItem.classList.contains('search-hidden');
      });
    };

    /**
     * 블로그 섹션 키보드 이벤트 핸들러
     * @param {KeyboardEvent} e - 키보드 이벤트
     */
    blogKeyDownHandler = (e) => {
      // 뒤로가기 버튼에 포커스가 있으면 방향키 처리 안함
      if (document.activeElement === wrapper.querySelector('.back_btn')) {
        return;
      }

      // 검색창에 포커스가 있으면 방향키 처리 안함 (검색창 자체 핸들러가 처리)
      if (document.activeElement === wrapper.querySelector('.search_wrapper input')) {
        return;
      }

      // Enter 또는 Space 키로 현재 선택된 아이콘 활성화
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();

        const currentIcon = blogIcons[currentBlogIconIndex];
        if (currentIcon) {
          activateBlogIcon(currentIcon);
        }
        return;
      }

      // 현재 보이는 아이콘들로 네비게이션 제한
      const visibleIcons = getVisibleIcons();
      if (visibleIcons.length === 0) return;

      // 현재 선택된 아이콘이 보이는 아이콘들 중 몇 번째인지 찾기
      const currentVisibleIndex = visibleIcons.findIndex(icon =>
        Array.from(blogIcons).indexOf(icon) === currentBlogIconIndex
      );

      // 방향키 네비게이션 (검색된 아이콘들만 대상)
      const newVisibleIndex = handleListNavigation(
        e,
        visibleIcons,
        currentVisibleIndex >= 0 ? currentVisibleIndex : 0,
        (newIndex) => {
          // 실제 아이콘 배열에서의 인덱스 찾기
          const selectedIcon = visibleIcons[newIndex];
          currentBlogIconIndex = Array.from(blogIcons).indexOf(selectedIcon);
          updateBlogIconSelection();
        },
        true // 무한 순환
      );
    };

    // 각 아이콘에 이벤트 추가
    blogIcons.forEach((icon, index) => {
      // 포커스 시 현재 인덱스 업데이트
      icon.addEventListener('focus', () => {
        currentBlogIconIndex = index;
        updateBlogIconSelection();
      });

      // 모든 아이콘의 클릭 이벤트를 커스텀 처리
      icon.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        currentBlogIconIndex = index;
        updateBlogIconSelection();
        activateBlogIcon(icon);
      });
    });

    // 키보드 이벤트 리스너 등록
    wrapper.addEventListener('keydown', blogKeyDownHandler);

    // 스킬 픽셀 윈도우 초기화
    initSkillPixelWindow();

    // 검색 기능 초기화
    initBlogSearchFeature(wrapper, blogIcons);

    // 픽셀 윈도우 초기화
    initPixelWindow();

    // 초기 선택 상태 설정
    updateBlogIconSelection();
  };

  /**
   * 블로그 섹션 네비게이션 리스너 제거
   * @param {HTMLElement} wrapper - 블로그 섹션 래퍼 요소
   */
  const removeBlogNavigationListener = (wrapper) => {
    if (wrapper && blogKeyDownHandler) {
      wrapper.removeEventListener('keydown', blogKeyDownHandler);
      blogKeyDownHandler = null;
    }
  };

  /**
   * 스킬 데이터를 JSON 파일에서 로드
   * @returns {Promise<Array>} 스킬 데이터 배열
   */
  const loadSkillData = async () => {
    try {
      const response = await fetch('./src/skillList.json');
      if (!response.ok) {
        throw new Error('스킬 데이터를 불러올 수 없습니다.');
      }
      return await response.json();
    } catch (error) {
      console.error('스킬 데이터 로드 실패:', error);
      throw error;
    }
  };

  /**
   * 스킬 리스트 UI 생성
   * @param {Array} skillData - 스킬 데이터 배열
   */
  const createSkillList = (skillData) => {
    const skillListContainer = document.querySelector('#skill_pixel_window .skill_list');
    if (!skillListContainer) return;

    // 기존 리스트 초기화
    skillListContainer.innerHTML = '';

    skillData.forEach((skill, index) => {
      // li 요소 생성
      const listItem = document.createElement('li');
      listItem.className = 'skill_item';
      listItem.style.animationDelay = `${index * 0.1}s`; // 순차적 애니메이션

      // 스킬 이름
      const skillName = document.createElement('span');
      skillName.className = 'skill_name';
      skillName.textContent = skill.skill;

      // 퍼센티지 바 컨테이너
      const percentageContainer = document.createElement('div');
      percentageContainer.className = 'percentage_container';

      // 퍼센티지 바 배경
      const percentageBar = document.createElement('div');
      percentageBar.className = 'percentage_bar';

      // 퍼센티지 바 채우기
      const percentageFill = document.createElement('div');
      percentageFill.className = 'percentage_fill';
      percentageFill.style.width = '0%'; // 초기값
      percentageFill.setAttribute('data-percentage', skill.percentage);

      // 퍼센티지 텍스트
      const percentageText = document.createElement('span');
      percentageText.className = 'percentage_text';
      percentageText.textContent = `${skill.percentage}%`;

      // 요소들 조립
      percentageBar.appendChild(percentageFill);
      percentageContainer.appendChild(percentageBar);
      percentageContainer.appendChild(percentageText);

      listItem.appendChild(skillName);
      listItem.appendChild(percentageContainer);
      skillListContainer.appendChild(listItem);
    });

    // 애니메이션 트리거 (약간의 지연 후)
    setTimeout(() => {
      animateSkillBars();
    }, 300);
  };

  /**
   * 스킬 바 애니메이션 실행
   */
  const animateSkillBars = () => {
    const skillFills = document.querySelectorAll('.percentage_fill');

    skillFills.forEach((fill, index) => {
      const targetPercentage = fill.getAttribute('data-percentage');

      setTimeout(() => {
        fill.style.transition = 'width 1.5s ease-out';
        fill.style.width = `${targetPercentage}%`;
      }, index * 200); // 순차적 애니메이션
    });
  };

  /**
   * 에러 발생 시 기본 스킬 리스트 생성
   */
  const createErrorSkillList = () => {
    const errorSkills = [{
        skill: "데이터 로드 실패",
        percentage: 0
      },
      {
        skill: "다시 시도해주세요",
        percentage: 0
      }
    ];
    createSkillList(errorSkills);
  };

  /**
   * 블로그 검색 기능 초기화
   * @param {HTMLElement} wrapper - 블로그 섹션 래퍼 요소
   * @param {NodeList} blogIcons - 검색 대상 아이콘들
   */
  const initBlogSearchFeature = (wrapper, blogIcons) => {
    const searchInput = wrapper.querySelector('.search_wrapper input');
    const focusInfoTxt = wrapper.querySelector('.search_wrapper .focus_info_txt');
    if (!searchInput) return;

    // 검색 가능한 아이콘 데이터 생성
    const searchableIcons = Array.from(blogIcons).map((icon, index) => {
      const iconText = icon.querySelector('.icon_text');
      const text = iconText ? iconText.textContent.toLowerCase() : '';
      const keywords = [text];

      // 각 아이콘별 추가 키워드 설정
      if (icon.classList.contains('icon_github')) {
        keywords.push('github', 'git', '깃허브', '깃', 'repository', 'repo', 'code', '코드');
      } else if (icon.classList.contains('icon_notion')) {
        keywords.push('notion', '노션', 'note', '노트', 'wiki', '위키', 'docs', '문서');
      } else if (icon.id === 'skill_note_btn') {
        keywords.push('skill', 'note', '스킬', '노트', 'tech', '기술', 'ability', '능력');
      }

      return {
        element: icon,
        listItem: icon.closest('li'),
        index,
        keywords,
        originalText: iconText ? iconText.textContent : ''
      };
    });

    let filteredIcons = [...searchableIcons];

    /**
     * 검색 결과에 따라 아이콘들 필터링
     * @param {string} searchTerm - 검색어
     */
    const filterIcons = (searchTerm) => {
      const trimmedTerm = searchTerm.trim().toLowerCase();

      if (!trimmedTerm) {
        // 검색어가 없으면 모든 아이콘 표시
        filteredIcons = [...searchableIcons];
        searchableIcons.forEach(iconData => {
          iconData.listItem.classList.remove('search-hidden', 'search-highlighted', 'search-dimmed');
        });
      } else {
        // 검색어와 매칭되는 아이콘들 찾기
        filteredIcons = searchableIcons.filter(iconData => {
          const isMatch = iconData.keywords.some(keyword =>
            keyword.includes(trimmedTerm)
          );

          if (isMatch) {
            iconData.listItem.classList.remove('search-hidden', 'search-dimmed');
            iconData.listItem.classList.add('search-highlighted');
          } else {
            iconData.listItem.classList.add('search-hidden');
            iconData.listItem.classList.remove('search-highlighted', 'search-dimmed');
          }

          return isMatch;
        });

        // 검색 결과가 있을 때 매칭되지 않은 아이콘들을 흐리게 처리
        if (filteredIcons.length > 0 && filteredIcons.length < searchableIcons.length) {
          searchableIcons.forEach(iconData => {
            if (!iconData.listItem.classList.contains('search-highlighted') &&
              !iconData.listItem.classList.contains('search-hidden')) {
              iconData.listItem.classList.add('search-dimmed');
            }
          });
        }
      }

      // 현재 선택된 아이콘이 필터링된 결과에 없으면 첫 번째로 이동 (포커스는 이동 안함)
      const currentIconVisible = filteredIcons.some(iconData =>
        iconData.index === currentBlogIconIndex
      );

      if (!currentIconVisible && filteredIcons.length > 0) {
        currentBlogIconIndex = filteredIcons[0].index;
        // 아이콘 선택 상태만 업데이트 (포커스는 검색창에 유지)
        blogIcons.forEach((icon, index) => {
          icon.classList.toggle('focused', index === currentBlogIconIndex);
        });
      }

      // 검색 결과가 정확히 하나일 때 자동 포커스 이동
      // if (filteredIcons.length === 1 && trimmedTerm) {
      //   setTimeout(() => {
      //     // 검색창이 여전히 포커스를 가지고 있을 때만 이동
      //     if (document.activeElement === searchInput) {
      //       filteredIcons[0].element.focus();
      //     }
      //   }, 300); // 약간의 딜레이로 사용자가 더 타이핑할 수 있는 시간 제공
      // }
      // 검색 결과가 없을 때 처리
      displaySearchResults(filteredIcons.length, trimmedTerm);
    };

    /**
     * 검색 결과 표시
     * @param {number} resultCount - 검색 결과 수
     * @param {string} searchTerm - 검색어
     */
    const displaySearchResults = (resultCount, searchTerm) => {
      // 기존 검색 결과 메시지 제거
      const existingMessage = wrapper.querySelector('.search-result-message');
      if (existingMessage) {
        existingMessage.remove(); // 즉시 제거
      }

      if (searchTerm && resultCount === 0) {
        // 검색 결과가 없을 때 메시지 표시
        const noResultMessage = document.createElement('div');
        noResultMessage.className = 'search-result-message';

        // 에러 메시지들의 배열
        const errorMessages = [{
          main: "검색 결과가 없습니다.",
          sub: `"${searchTerm}"와 일치하는 항목을 찾을 수 없습니다.`
        }];

        // 랜덤하게 메시지 선택
        const randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];

        // 처음부터 빈 텍스트로 HTML 생성
        noResultMessage.innerHTML = `
          <p></p>
          <small></small>
        `;

        const screenInner = wrapper.querySelector('.screen_inner');
        screenInner.appendChild(noResultMessage);

        // 타이핑 효과 추가
        const mainText = noResultMessage.querySelector('p');
        const subText = noResultMessage.querySelector('small');

        // 초기 상태: 텍스트는 비어있고 투명
        mainText.style.opacity = '0';
        subText.style.opacity = '0';

        // 타이핑 효과 시뮬레이션
        setTimeout(() => {
          mainText.style.opacity = '1';
          typewriterEffect(mainText, randomMessage.main, 20);
        }, 200);

        setTimeout(() => {
          subText.style.opacity = '1';
          typewriterEffect(subText, randomMessage.sub, 30);
        }, 500);

        // 3초 후 자동으로 메시지 제거
        setTimeout(() => {
          if (noResultMessage.parentNode) {
            noResultMessage.style.animation = 'searchErrorGlitch 0.3s ease-out reverse';
            setTimeout(() => noResultMessage.remove(), 300);
          }
        }, 3000);
      }
    };

    /**
     * 타이핑 효과 함수
     * @param {HTMLElement} element - 텍스트를 표시할 요소
     * @param {string} text - 표시할 텍스트
     * @param {number} speed - 타이핑 속도 (ms)
     */
    const typewriterEffect = (element, text, speed) => {
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
     * 검색 입력 이벤트 핸들러
     * @param {Event} e - 입력 이벤트
     */
    const handleSearchInput = (e) => {
      const searchTerm = e.target.value;
      filterIcons(searchTerm);
    };

    /**
     * 검색창에서의 키보드 이벤트 핸들러
     * @param {KeyboardEvent} e - 키보드 이벤트
     */
    const handleSearchKeydown = (e) => {
      // 검색창에서 방향키 사용 시 아이콘 네비게이션으로 전환
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();

        if (filteredIcons.length > 0) {
          // 첫 번째 검색 결과로 포커스 이동
          const firstVisibleIcon = filteredIcons[0];
          currentBlogIconIndex = firstVisibleIcon.index;
          // 아이콘 선택 상태 업데이트 및 포커스 이동
          blogIcons.forEach((icon, index) => {
            icon.classList.toggle('focused', index === currentBlogIconIndex);
          });
          firstVisibleIcon.element.focus();
        }
      }

      // Enter 키로 첫 번째 검색 결과 실행
      if (e.key === 'Enter' && filteredIcons.length > 0) {
        e.preventDefault();
        const firstVisibleIcon = filteredIcons[0];
        activateBlogIcon(firstVisibleIcon.element);
      }
    };

    // 이벤트 리스너 등록
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keydown', handleSearchKeydown);

    // 검색창 포커스 시 초기화 및 정보 텍스트 표시
    searchInput.addEventListener('focus', () => {
      searchInput.select(); // 전체 텍스트 선택
      if (focusInfoTxt) {
        focusInfoTxt.classList.add('visible');
      }
    });

    // 검색창 블러 시 정보 텍스트 숨기기
    searchInput.addEventListener('blur', () => {
      if (focusInfoTxt) {
        focusInfoTxt.classList.remove('visible');
      }
    });

    // 정리 함수 저장 (뒤로가기 시 이벤트 리스너 제거용)
    wrapper._searchCleanup = () => {
      searchInput.removeEventListener('input', handleSearchInput);
      searchInput.removeEventListener('keydown', handleSearchKeydown);

      // 포커스 정보 텍스트 숨기기 및 이벤트 제거
      if (focusInfoTxt) {
        focusInfoTxt.classList.remove('visible');
      }

      // 검색 필터 초기화
      searchableIcons.forEach(iconData => {
        iconData.listItem.classList.remove('search-hidden', 'search-highlighted', 'search-dimmed');
      });

      // 검색 결과 메시지 제거
      const existingMessage = wrapper.querySelector('.search-result-message');
      if (existingMessage) {
        existingMessage.remove();
      }
    };
  };

  /**
   * 픽셀 윈도우 열기
   * @param {string} url - 열 URL
   * @param {string} title - 윈도우 제목
   */
  const openPixelWindow = (url, title = 'Browser') => {
    const pixelWindow = document.querySelector('#pixel_window');
    const iframe = document.querySelector('#pixel-iframe');
    const addressText = document.querySelector('.address-text');
    const windowTitleText = document.querySelector('.window-title-text');
    const windowBody = document.querySelector('.pixel-window-body');
    const loadingIndicator = document.querySelector('.loading-indicator');

    if (!pixelWindow || !iframe) return;

    // 윈도우 제목 및 주소창 설정
    windowTitleText.textContent = `${title} - Browser`;
    addressText.textContent = url;

    // 로딩 상태 표시
    windowBody.classList.remove('loaded');
    loadingIndicator.style.display = 'flex';

    // iframe 로드
    iframe.src = url;

    // iframe 로드 완료 처리
    const handleIframeLoad = () => {
      setTimeout(() => {
        windowBody.classList.add('loaded');
        loadingIndicator.style.display = 'none';
      }, 1000); // 로딩 애니메이션을 위한 최소 시간
    };

    iframe.addEventListener('load', handleIframeLoad, {
      once: true
    });

    // 윈도우 열기 애니메이션
    pixelWindow.classList.add('visible', 'opening');

    // 애니메이션 완료 후 opening 클래스 제거
    setTimeout(() => {
      pixelWindow.classList.remove('opening');
    }, 500);

    // 포커스 설정
    const closeBtn = pixelWindow.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.focus();
    }
  };

  /**
   * 픽셀 윈도우 닫기
   */
  const closePixelWindow = () => {
    const pixelWindow = document.querySelector('#pixel_window');
    const iframe = document.querySelector('#pixel-iframe');

    if (!pixelWindow) return;

    // 닫기 애니메이션
    pixelWindow.classList.remove('visible', 'opening', 'maximized');

    // iframe 정리
    setTimeout(() => {
      if (iframe) {
        iframe.src = '';
      }
    }, 300);
  };

  /**
   * 픽셀 윈도우 최대화/복원 토글
   */
  const toggleMaximizePixelWindow = () => {
    const pixelWindow = document.querySelector('#pixel_window');
    if (!pixelWindow) return;

    pixelWindow.classList.toggle('maximized');
  };

  /**
   * 픽셀 윈도우 새로고침
   */
  const refreshPixelWindow = () => {
    const iframe = document.querySelector('#pixel-iframe');
    const windowBody = document.querySelector('.pixel-window-body');
    const loadingIndicator = document.querySelector('.loading-indicator');

    if (!iframe || !windowBody) return;

    // 로딩 상태 표시
    windowBody.classList.remove('loaded');
    loadingIndicator.style.display = 'flex';

    // iframe 새로고침
    iframe.src = iframe.src;

    // 로드 완료 처리
    const handleRefreshLoad = () => {
      setTimeout(() => {
        windowBody.classList.add('loaded');
        loadingIndicator.style.display = 'none';
      }, 1000);
    };

    iframe.addEventListener('load', handleRefreshLoad, {
      once: true
    });
  };

  /**
   * 픽셀 윈도우 초기화
   */
  const initPixelWindow = () => {
    const pixelWindow = document.querySelector('#pixel_window');
    if (!pixelWindow) return;

    // 컨트롤 버튼들
    const closeBtn = pixelWindow.querySelector('.close-btn');
    const maximizeBtn = pixelWindow.querySelector('.maximize-btn');
    const minimizeBtn = pixelWindow.querySelector('.minimize-btn');
    const refreshBtn = pixelWindow.querySelector('.refresh-btn');

    // 닫기 버튼 이벤트
    if (closeBtn) {
      closeBtn.addEventListener('click', closePixelWindow);
      closeBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          closePixelWindow();
        }
      });
    }

    // 최대화 버튼 이벤트
    if (maximizeBtn) {
      maximizeBtn.addEventListener('click', toggleMaximizePixelWindow);
      maximizeBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleMaximizePixelWindow();
        }
      });
    }

    // 최소화 버튼 이벤트 (실제로는 닫기와 동일하게 처리)
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', closePixelWindow);
      minimizeBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          closePixelWindow();
        }
      });
    }

    // 새로고침 버튼 이벤트
    if (refreshBtn) {
      refreshBtn.addEventListener('click', refreshPixelWindow);
      refreshBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          refreshPixelWindow();
        }
      });
    }

    // 픽셀 윈도우 전용 ESC 키 이벤트
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && pixelWindow.classList.contains('visible')) {
        e.preventDefault();
        e.stopPropagation();
        closePixelWindow();
      }
    });

    // 윈도우 외부 클릭으로 닫기 (선택사항)
    pixelWindow.addEventListener('click', (e) => {
      if (e.target === pixelWindow) {
        closePixelWindow();
      }
    });

    // taskbar의 외부 링크들도 픽셀 윈도우에서 열기
    const taskbarIcons = document.querySelectorAll('#task_bar .sub_blog_icons a[href]:not([href="#none"])');
    taskbarIcons.forEach(icon => {
      icon.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const href = icon.getAttribute('href');
        if (href && href !== '#none') {
          const img = icon.querySelector('img');
          let siteName = 'Website';

          if (img && img.src.includes('github')) {
            siteName = 'GITHUB';
          } else if (img && img.src.includes('notion')) {
            siteName = 'NOTION';
          }

          openPixelWindow(href, siteName);
        }
      });
    });

    // taskbar의 스킬 노트 버튼 별도 처리
    const taskbarSkillNoteBtn = document.querySelector('#task_bar .sub_blog_icons .skill_note_btn');
    if (taskbarSkillNoteBtn) {
      taskbarSkillNoteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // 스킬 데이터 로드 및 픽셀 윈도우 표시
        loadSkillData()
          .then(skillData => {
            createSkillList(skillData);
            openSkillPixelWindow();
          })
          .catch(error => {
            console.error('스킬 데이터 로드 실패:', error);
            // 에러 발생 시에도 윈도우는 보여주되, 에러 메시지 표시
            createErrorSkillList();
            openSkillPixelWindow();
          });
      });
    }
  };

  /**
   * 스킬 픽셀 윈도우 열기
   */
  const openSkillPixelWindow = () => {
    const skillWindow = document.querySelector('#skill_pixel_window');
    if (skillWindow) {
      skillWindow.classList.add('visible');

      // 창이 열리면 즉시 첫 번째 포커스 가능한 요소에 포커스 설정
      setTimeout(() => {
        const firstFocusableElement = skillWindow.querySelector('.skill-close-btn, .skill-maximize-btn, .skill-minimize-btn');
        if (firstFocusableElement) {
          firstFocusableElement.focus();
        }
      }, 50); // 애니메이션 시작 후 포커스 설정
    }
  };

  /**
   * 스킬 픽셀 윈도우 닫기
   */
  const closeSkillPixelWindow = () => {
    const skillWindow = document.querySelector('#skill_pixel_window');
    if (skillWindow) {
      skillWindow.classList.remove('visible');
    }
  };

  /**
   * 스킬 픽셀 윈도우 최대화/복원 토글
   */
  const toggleMaximizeSkillPixelWindow = () => {
    const skillWindow = document.querySelector('#skill_pixel_window');
    if (skillWindow) {
      skillWindow.classList.toggle('maximized');
    }
  };

  /**
   * 스킬 픽셀 윈도우 초기화
   */
  const initSkillPixelWindow = () => {
    const skillWindow = document.querySelector('#skill_pixel_window');
    if (!skillWindow) return;

    const closeBtn = skillWindow.querySelector('.skill-close-btn');
    const maximizeBtn = skillWindow.querySelector('.skill-maximize-btn');
    const minimizeBtn = skillWindow.querySelector('.skill-minimize-btn');

    /**
     * 스킬 윈도우 포커스 트랩 구현
     * @param {KeyboardEvent} e - 키보드 이벤트
     */
    const handleSkillWindowFocusTrap = (e) => {
      if (!skillWindow.classList.contains('visible')) return;

      if (e.key === 'Tab') {
        const focusableElements = skillWindow.querySelectorAll(
          '.skill-close-btn, .skill-maximize-btn, .skill-minimize-btn, .skill_list button, .skill_list a, [tabindex]:not([tabindex="-1"])'
        );
        const focusableArray = Array.from(focusableElements);

        if (focusableArray.length === 0) return;

        const firstElement = focusableArray[0];
        const lastElement = focusableArray[focusableArray.length - 1];

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

    /**
     * 스킬 윈도우 키보드 이벤트 핸들러
     * @param {KeyboardEvent} e - 키보드 이벤트
     */
    const handleSkillWindowKeydown = (e) => {
      if (!skillWindow.classList.contains('visible')) return;

      // ESC 키로 윈도우 닫기
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeSkillPixelWindow();
        return;
      }

      // Enter 또는 Space 키로 버튼 활성화
      if (e.key === 'Enter' || e.key === ' ') {
        const activeElement = document.activeElement;

        if (activeElement === closeBtn) {
          e.preventDefault();
          e.stopPropagation();
          closeSkillPixelWindow();
          return;
        }

        if (activeElement === maximizeBtn) {
          e.preventDefault();
          e.stopPropagation();
          toggleMaximizeSkillPixelWindow();
          return;
        }

        if (activeElement === minimizeBtn) {
          e.preventDefault();
          e.stopPropagation();
          closeSkillPixelWindow();
          return;
        }
      }
    };

    /**
     * 스킬 윈도우 외부 클릭 이벤트 핸들러
     * @param {MouseEvent} e - 마우스 이벤트
     */
    const handleSkillWindowClick = (e) => {
      // 윈도우 내부 클릭은 무시
      if (e.target.closest('.skill-pixel-window-content') ||
        e.target.closest('.skill-pixel-window-header')) {
        return;
      }

      // 윈도우 외부 클릭 시 닫기
      if (skillWindow.classList.contains('visible')) {
        closeSkillPixelWindow();
      }
    };

    // 각 버튼에 tabindex와 키보드 이벤트 설정
    [closeBtn, maximizeBtn, minimizeBtn].forEach(btn => {
      if (btn) {
        btn.tabIndex = 0; // 포커스 가능하도록 설정

        // 클릭 이벤트
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          if (btn === closeBtn || btn === minimizeBtn) {
            closeSkillPixelWindow();
          } else if (btn === maximizeBtn) {
            toggleMaximizeSkillPixelWindow();
          }
        });

        // 키보드 이벤트 (개별 버튼용)
        btn.addEventListener('keydown', (e) => {
          if (!skillWindow.classList.contains('visible')) return;

          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            btn.click(); // 클릭 이벤트 트리거
          }
        });
      }
    });

    // 글로벌 이벤트 리스너
    document.addEventListener('keydown', handleSkillWindowKeydown);
    document.addEventListener('keydown', handleSkillWindowFocusTrap);
    skillWindow.addEventListener('click', handleSkillWindowClick);

    // 정리 함수 저장 (뒤로가기 시 이벤트 리스너 제거용)
    skillWindow._closeListeners = {
      keydown: handleSkillWindowKeydown,
      focusTrap: handleSkillWindowFocusTrap,
      click: handleSkillWindowClick
    };
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

    const portfolioItems = portfolioData[0];
    const thumbnailContainer = mainElement.querySelector('.content_thumbnail');

    // 포트폴리오 뷰어의 높이를 상수를 사용해서 동적으로 설정
    if (portfolioListContainer) {
      const maxHeight = `${PORTFOLIO_VIEW_COUNT * PORTFOLIO_ITEM_HEIGHT_REM}rem`;
      portfolioListContainer.style.maxHeight = maxHeight;
    }

    // 기존 요소들 초기화
    thumbnailContainer.querySelectorAll('.p-card').forEach(card => card.remove());
    portfolioContentList.innerHTML = ''; // 썸네일 컨테이너도 비움

    // 1. 컨트롤러(li)와 카드(div) DOM 생성
    portfolioItems.forEach((item, index) => {
      // 리스트 아이템 생성
      const li = document.createElement('li');
      li.textContent = item.title;
      li.dataset.index = index;
      li.tabIndex = -1; // 초기엔 포커스 비활성
      portfolioContentList.appendChild(li);

      // 카드 아이템 생성
      const card = document.createElement('a');
      card.href = item.link;
      card.className = 'p-card';
      card.dataset.index = index;
      card.target = '_blank';
      card.style.backgroundImage = `url(./src/image/${item.img}.jpg)`;
      thumbnailContainer.insertBefore(card, thumbnailContainer.firstChild);
    });

    if (portfolioContentList.children.length > 0) {
      portfolioContentList.children[0].tabIndex = 0; // 첫 아이템만 포커스 가능
    }

    // 2. 이벤트 리스너 등록 (이벤트 위임 사용)
    portfolioContentList.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (li) {
        updatePortfolioSelection(parseInt(li.dataset.index, 10));
      }
    });

    portfolioContentList.addEventListener('keydown', (e) => {
      if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();

      let newIndex = currentPortfolioItemIndex;
      const total = portfolioItems.length;

      if (e.key === 'ArrowUp') {
        newIndex = (currentPortfolioItemIndex - 1 + total) % total;
      } else if (e.key === 'ArrowDown') {
        newIndex = (currentPortfolioItemIndex + 1) % total;
      }

      if (newIndex !== currentPortfolioItemIndex) {
        const items = portfolioContentList.children;
        items[currentPortfolioItemIndex].tabIndex = -1;
        items[newIndex].tabIndex = 0;
        items[newIndex].focus();
        updatePortfolioSelection(newIndex);
      }
    });

    // 3. 마우스 휠 이벤트
    // if (portfolioListContainer) {
    //   portfolioListContainer.addEventListener('wheel', (e) => {
    //     e.preventDefault();
    //     const total = portfolioItems.length;
    //     let newIndex = currentPortfolioItemIndex;

    //     if (e.deltaY > 0) {
    //       newIndex = (currentPortfolioItemIndex + 1) % total;
    //     } else {
    //       newIndex = (currentPortfolioItemIndex - 1 + total) % total;
    //     }
    //     updatePortfolioSelection(newIndex, false); // 휠 스크롤 시에는 li에 포커스 이동 안함
    //   });
    // }

    // 4. 초기 상태 설정
    updatePortfolioSelection(0);
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
   * [신규] 기여도 바 UI를 업데이트하는 함수
   * @param {string|number} contribution - 기여도 퍼센티지
   */
  function updateContributionBar(contribution) {
    const contributionBarFill = document.querySelector('.contribution_bar_fill');
    if (!contributionBarFill) return;

    const contributionValue = typeof contribution === 'string' ? parseInt(contribution, 10) : contribution;
    // requestAnimationFrame을 사용하여 부드러운 애니메이션 보장
    requestAnimationFrame(() => {
      contributionBarFill.style.width = `${contributionValue || 0}%`;
    });
  }

  /**
   * [신규] 사용 스킬 목록을 업데이트하는 함수
   * @param {Array} useSkills - 사용된 스킬 배열 (문자열 배열 또는 객체 배열)
   */
  async function updateUseSkillList(useSkills) {
    const useSkillList = document.querySelector('.use_skill_list');
    if (!useSkillList || !useSkills || useSkills.length === 0) {
      if (useSkillList) {
        useSkillList.innerHTML = '<li class="no-skills">사용 스킬 정보가 없습니다.</li>';
      }
      return;
    }

    try {
      // 첫 번째 요소가 객체인지 문자열인지 확인
      const isObjectFormat = typeof useSkills[0] === 'object' && useSkills[0].skill;

      // 기존 li 요소들 제거
      useSkillList.innerHTML = '';

      // 객체 형태가 아닌 경우에만 skillList.json 로드
      let skillData = null;
      if (!isObjectFormat) {
        skillData = await loadSkillData();
      }

      // 각 사용 스킬에 대해 li 요소 생성
      useSkills.forEach((skillItem, index) => {
        let skillName, skillPercentage;

        if (isObjectFormat) {
          // 객체 형태: {skill: "JavaScript", percentage: 75}
          skillName = skillItem.skill;
          skillPercentage = skillItem.percentage;
        } else {
          // 문자열 형태: "JavaScript"
          skillName = skillItem;
          skillPercentage = 0; // 기본값

          // 1. 프로젝트 데이터에 useSkillPercentage 배열이 있는지 확인
          const currentProject = portfolioData[0][currentPortfolioItemIndex];
          if (currentProject.useSkillPercentage && currentProject.useSkillPercentage[index]) {
            skillPercentage = currentProject.useSkillPercentage[index];
          } else {
            // 2. skillList.json에서 퍼센테이지 찾기 (fallback)
            const skillInfo = skillData.find(skill =>
              skill.skill.toLowerCase() === skillName.toLowerCase()
            );
            skillPercentage = skillInfo ? skillInfo.percentage : 0;
          }
        }

        const li = document.createElement('li');
        li.className = 'skill-item';
        li.style.animationDelay = `${index * 0.1}s`; // 순차적 애니메이션

        // 퍼센테이지가 있으면 프로그레스 바와 함께 표시
        if (skillPercentage > 0) {
          li.innerHTML = `
            <span class="skill-name">${skillName}</span>
            <div class="skill-progress">
              <div class="skill-progress-bar">
                <div class="skill-progress-fill" data-percentage="${skillPercentage}"></div>
              </div>
              <span class="skill-percentage">${skillPercentage}%</span>
            </div>
          `;
        } else {
          // 퍼센테이지가 없는 경우 기본 스타일로 표시
          li.innerHTML = `
            <span class="skill-name">${skillName}</span>
            <div class="skill-progress">
              <div class="skill-progress-bar">
                <div class="skill-progress-fill" data-percentage="0"></div>
              </div>
              <span class="skill-percentage">-</span>
            </div>
          `;
        }

        useSkillList.appendChild(li);
      });

      // 애니메이션 트리거 (약간의 지연 후)
      setTimeout(() => {
        animateSkillProgressBars();
      }, 100);

    } catch (error) {
      console.error('사용스킬 데이터 로드 실패:', error);
      // 에러 발생 시 스킬명만 표시
      useSkillList.innerHTML = '';
      useSkills.forEach((skillItem, index) => {
        const skillName = typeof skillItem === 'object' ? skillItem.skill : skillItem;
        const li = document.createElement('li');
        li.className = 'skill-item error';
        li.style.animationDelay = `${index * 0.1}s`;
        li.innerHTML = `
          <span class="skill-name">${skillName}</span>
          <div class="skill-progress">
            <span class="skill-percentage">-</span>
          </div>
        `;
        useSkillList.appendChild(li);
      });
    }
  }

  /**
   * [신규] 스킬 프로그레스 바 애니메이션 실행
   */
  function animateSkillProgressBars() {
    const skillFills = document.querySelectorAll('.use_skill_list .skill-progress-fill');

    skillFills.forEach((fill, index) => {
      const targetPercentage = fill.getAttribute('data-percentage');

      setTimeout(() => {
        fill.style.transition = 'width 1s ease-out';
        fill.style.width = `${targetPercentage}%`;
      }, index * 150); // 150ms씩 지연하여 순차적 애니메이션
    });
  }

  /**
   * 포트폴리오 선택 아이템 업데이트 (active 클래스 및 썸네일)
   */
  function updatePortfolioSelection(newIndex, focusLi = true) {
    const oldIndex = currentPortfolioItemIndex;
    if (newIndex === oldIndex && newIndex !== 0) return;

    currentPortfolioItemIndex = newIndex;
    const allLiElements = portfolioContentList.querySelectorAll('li');

    // 컨트롤러(li) 활성 상태 업데이트
    allLiElements.forEach((li, index) => {
      li.classList.toggle('active', index === newIndex);
    });

    if (focusLi) {
      allLiElements[newIndex]?.focus();
    }

    const selectedItem = portfolioData[0][newIndex];
    if (selectedItem) {
      updateContributionBar(selectedItem.contribution);
      // 사용 스킬 목록 업데이트
      updateUseSkillList(selectedItem.useSkill);
    }

    // 카드 애니메이션 업데이트
    updateCardAnimation(newIndex, oldIndex);
  }

  /**
   * 카드 스택 애니메이션을 제어하는 함수
   */
  function updateCardAnimation(currentIndex, previousIndex) {
    const thumbnailContainer = mainElement.querySelector('.content_thumbnail');
    if (!thumbnailContainer) return;

    const cards = thumbnailContainer.querySelectorAll('.p-card');
    const totalCards = cards.length;

    // 다음 카드의 인덱스 계산
    const nextIndex = (currentIndex + 1) % totalCards;

    // 모든 카드의 상태 클래스 초기화
    cards.forEach(card => card.classList.remove('card--current', 'card--next', 'card--out'));

    // 이전 카드에 퇴장 애니메이션 클래스 추가
    if (previousIndex !== undefined && cards[previousIndex]) {
      cards[previousIndex].classList.add('card--out');
    }

    // 현재 카드와 다음 카드에 상태 클래스 추가
    if (cards[currentIndex]) {
      cards[currentIndex].classList.add('card--current');
    }
    if (cards[nextIndex]) {
      cards[nextIndex].classList.add('card--next');
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
   * @param {string} imgName - 이미지 파일 경로 (확장자 포함)
   * @param {string} link - 연결할 URL
   * @param {string|number} contribution - 기여도 퍼센티지
   */
  function updateThumbnail(imgName, link, contribution) {
    const thumbnailAnchor = document.querySelector('.content_thumbnail a');
    const contributionBarFill = document.querySelector('.contribution_bar_fill');
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

    if (contributionBarFill && contribution !== undefined) {
      const contributionValue = typeof contribution === 'string' ? parseInt(contribution, 10) : contribution;
      contributionBarFill.style.width = `${contributionValue}%`;
    }
  }

  // 초기 포트폴리오 데이터 로드
  importPortfolio();
})();