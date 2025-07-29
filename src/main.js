// main.js - 리팩토링된 메인 스크립트

// 모듈 import
import {
  SECTION_CLASSES,
  TRANSITION_DURATION,
  DICE_TRANSITION_DURATION
} from './modules/constants.js';
import {
  disableTabIndexOutsideSection,
  restoreTabIndex,
  trapFocusInSection,
  removeFocusTrap
} from './modules/focusManager.js';
import {
  initOptionInfoTexts,
  updateOptionInfo,
  hideAllOptionInfo
} from './modules/optionInfoManager.js';
import {
  initAboutDOMElements,
  initAboutCarousel,
  removeAboutCarouselListener
} from './modules/aboutSection.js';
import {
  initPortfolioDOMElements,
  importPortfolio,
  initPortfolioSection
} from './modules/portfolioSection.js';
import {
  initContactSection
} from './modules/contactSection.js';
import {
  initBlogSection,
  removeBlogNavigationListener
} from './modules/blogSection.js';
import {
  initFullscreenManager
} from './modules/fullscreenManager.js';
import {
  initKeyboardFeedback
} from './modules/keyboardFeedback.js';

!(function () {
  // 1. 상태 변수 선언
  let currentFocusedOptionIndex = 0; // 메인 메뉴 포커스 인덱스

  // 2. DOM 요소 캐싱
  const mainElement = document.querySelector('main');
  const selectOptions = document.querySelectorAll('.select_option button');
  const backButtons = document.querySelectorAll('.back_btn');

  // 3. 모듈 초기화
  initOptionInfoTexts();
  initAboutDOMElements();
  initPortfolioDOMElements();

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
   * 섹션 활성화 및 포커스 이동 핸들러
   * @param {Event} e - 이벤트 객체
   * @param {HTMLElement} option - 클릭된(또는 엔터키 눌린) 옵션 버튼 요소
   */
  const handleOptionActivation = (e, option) => {
    e.preventDefault();
    e.stopPropagation();

    // 섹션 활성화 시 옵션 정보 숨기기
    hideAllOptionInfo();

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
   * 뒤로가기 기능 핸들러
   * 모든 섹션 관련 클래스를 mainElement에서 제거하고, 메뉴 선택 화면으로 돌아옵니다.
   */
  const handleGoBack = () => {
    // contact 섹션에서 나갈 때 특별한 애니메이션 처리
    const isContactActive = mainElement.classList.contains('contact');
    const contactWrapper = mainElement.querySelector('.contact_wrapper');

    if (isContactActive && contactWrapper) {
      // 애니메이션이 진행 중이면 뒤로가기 무시
      const isContactAnimating = contactWrapper._getAnimatingState && contactWrapper._getAnimatingState();
      if (isContactAnimating) return;

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
    // 섹션별 리스너 제거 로직
    SECTION_CLASSES.forEach(className => {
      const sectionWrapper = mainElement.querySelector(`.${className}_wrapper`);
      if (sectionWrapper) {
        removeFocusTrap(sectionWrapper);

        // About 섹션 캐러셀 리스너 제거
        if (className === 'about') {
          removeAboutCarouselListener(sectionWrapper);
        }

        // Blog 섹션 네비게이션 리스너 제거
        if (className === 'blog') {
          removeBlogNavigationListener(sectionWrapper);
        }

        // Contact 섹션 정리
        if (className === 'contact' && sectionWrapper._contactCleanup) {
          sectionWrapper._contactCleanup();
          delete sectionWrapper._contactCleanup;
          delete sectionWrapper._contactExitAnimation;
          delete sectionWrapper._contactDetailExitAnimation;
          delete sectionWrapper._getDetailViewState;
          delete sectionWrapper._getAnimatingState;
        }

        // Blog 섹션 정리
        if (className === 'blog') {
          sectionWrapper.classList.remove('glitch-active');

          // 픽셀 윈도우 닫기
          const pixelWindow = document.querySelector('#pixel_window');
          if (pixelWindow && pixelWindow.classList.contains('visible')) {
            pixelWindow.classList.remove('visible');
          }

          // 스킬 픽셀 윈도우 닫기 및 정리
          const skillWindow = document.querySelector('#skill_pixel_window');
          if (skillWindow) {
            if (skillWindow.classList.contains('visible')) {
              skillWindow.classList.remove('visible');
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
        // 메인 메뉴로 돌아갈 때 현재 포커스된 옵션의 정보 표시
        updateOptionInfo(currentFocusedOptionIndex);
      }
    }, DICE_TRANSITION_DURATION + 50);
  };

  // 메인 메뉴 옵션 버튼 이벤트 리스너 등록
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

      // 옵션 정보 텍스트 업데이트 (메인 메뉴에서만)
      const isAnySectionActive = SECTION_CLASSES.some(className => mainElement.classList.contains(className));
      if (!isAnySectionActive) {
        updateOptionInfo(index);
      }
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

  // 초기화: 페이지 로드 시 첫 번째 옵션에 포커스
  if (selectOptions.length > 0) {
    selectOptions[0].focus();
    // 초기 로드 시 첫 번째 옵션 정보 표시
    updateOptionInfo(0);
  }

  // 뒤로가기 버튼 이벤트 리스너 등록
  backButtons.forEach(backBtn => {
    const handleBackClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleGoBack();
    };

    const handleBackKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        // contact 섹션인 경우 애니메이션 상태 확인
        if (mainElement.classList.contains('contact')) {
          const contactWrapper = mainElement.querySelector('.contact_wrapper');
          const isContactAnimating = contactWrapper && contactWrapper._getAnimatingState && contactWrapper._getAnimatingState();
          if (isContactAnimating) {
            e.preventDefault(); // 애니메이션 중이면 키보드 입력 무시
            return;
          }
        }

        e.preventDefault();
        e.stopPropagation();
        handleGoBack();
      }
    };

    backBtn.addEventListener('click', handleBackClick);
    backBtn.addEventListener('pointerdown', handleBackClick);
    backBtn.addEventListener('touchstart', handleBackClick);
    backBtn.addEventListener('keydown', handleBackKeyDown);
  });

  // 전역 키보드 이벤트: ESC 키로 뒤로가기
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const isAnySectionActive = SECTION_CLASSES.some(className => mainElement.classList.contains(className));
      if (isAnySectionActive) {
        // contact 섹션인 경우 애니메이션 상태 확인
        if (mainElement.classList.contains('contact')) {
          const contactWrapper = mainElement.querySelector('.contact_wrapper');
          const isContactAnimating = contactWrapper && contactWrapper._getAnimatingState && contactWrapper._getAnimatingState();
          if (isContactAnimating) return; // 애니메이션 중이면 ESC 키 무시
        }

        e.preventDefault();
        handleGoBack();
      }
    }
  });

  // 모든 모듈 초기화
  initFullscreenManager();
  initKeyboardFeedback();

  // 포트폴리오 데이터 불러오기
  importPortfolio();
})();