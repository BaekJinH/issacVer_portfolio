// blogSection.js - Blog 섹션 모듈

import {
  handleListNavigation,
  startTypingEffect,
  typewriterEffect
} from './utils.js';

// Blog 섹션 상태 변수
let currentBlogIconIndex = 0;
let blogKeyDownHandler = null;

/**
 * 블로그 섹션 초기화 - 화면 전체 글리치 효과
 * @param {HTMLElement} wrapper - 블로그 섹션 래퍼 요소
 */
export const initBlogSection = (wrapper) => {
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
    const mainElement = document.querySelector('main');
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
export const removeBlogNavigationListener = (wrapper) => {
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
    const response = await fetch('src/skillList.json'); // HTML 기준 경로
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

// 픽셀 윈도우 관련 함수들은 별도 파일로 분리하는 것이 좋겠지만, 현재는 여기에 포함합니다.
// 추후 pixelWindow.js로 분리 가능합니다.

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

  // GitHub, Notion 등 알려진 차단 사이트들은 바로 리다이렉트 메시지 표시
  const blockedSites = ['github.com', 'notion.so', 'notion.site'];
  const isBlockedSite = blockedSites.some(site => url.includes(site));

  if (isBlockedSite) {
    // 윈도우 제목 및 주소창 설정
    windowTitleText.textContent = `${title} - Browser`;
    addressText.textContent = url;

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

    // 바로 리다이렉트 메시지 표시 (1초 후)
    setTimeout(() => {
      showRedirectMessage(url, windowBody, loadingIndicator);
    }, 2000);

    return;
  }

  // 윈도우 제목 및 주소창 설정
  windowTitleText.textContent = `${title} - Browser`;
  addressText.textContent = url;

  // 로딩 상태 표시
  windowBody.classList.remove('loaded');
  loadingIndicator.style.display = 'flex';

  // iframe 로드
  iframe.src = url;

  // iframe 로딩 실패 감지 타이머 (2초로 단축)
  const loadTimeout = setTimeout(() => {
    if (!windowBody.classList.contains('loaded')) {
      showRedirectMessage(url, windowBody, loadingIndicator);
    }
  }, 2000);

  // iframe 로드 완료 처리
  const handleIframeLoad = () => {
    // iframe이 실제로 의미있는 콘텐츠를 로드했는지 확인
    try {
      // 동일 출처가 아닌 경우 접근 시 에러 발생 (정상적인 외부 사이트)
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

      // 문서에 접근할 수 있고 실제 내용이 있는 경우에만 성공으로 간주
      if (iframeDoc && iframeDoc.body && iframeDoc.body.children.length > 0) {
        clearTimeout(loadTimeout);
        setTimeout(() => {
          windowBody.classList.add('loaded');
          loadingIndicator.style.display = 'none';
        }, 1000);
      } else {
        // 빈 페이지이거나 내용이 없으면 차단된 것으로 간주
        // 타이머는 그대로 두어서 3초 후 리다이렉트 메시지 표시
      }
    } catch (error) {
      // 크로스 오리진 에러 - 정상적인 외부 사이트로 간주
      if (error.name === 'SecurityError' || error.message.includes('cross-origin')) {
        clearTimeout(loadTimeout);
        setTimeout(() => {
          windowBody.classList.add('loaded');
          loadingIndicator.style.display = 'none';
        }, 1000);
      } else {
        // 다른 에러는 로딩 실패로 간주
        // 타이머 그대로 두기
      }
    }
  };

  // iframe 에러 처리
  const handleIframeError = () => {
    clearTimeout(loadTimeout);
    showRedirectMessage(url, windowBody, loadingIndicator);
  };

  iframe.addEventListener('load', handleIframeLoad, {
    once: true
  });
  iframe.addEventListener('error', handleIframeError, {
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
 * blog 섹션 느낌의 리다이렉트 메시지 표시
 * @param {string} url - 리다이렉트할 URL
 * @param {HTMLElement} windowBody - 윈도우 바디 요소
 * @param {HTMLElement} loadingIndicator - 로딩 인디케이터 요소
 */
const showRedirectMessage = (url, windowBody, loadingIndicator) => {
  // 로딩 인디케이터 숨기기
  loadingIndicator.style.display = 'none';

  // 리다이렉트 메시지 컨테이너 생성
  const redirectMessage = document.createElement('div');
  redirectMessage.className = 'redirect-message';

  // blog 섹션 느낌의 픽셀아트 스타일 메시지
  redirectMessage.innerHTML = `
    <div class="redirect-content">
      <div class="pixel-character">
        <div class="pixel-face">
          <span class="pixel-eye">●</span>
          <span class="pixel-eye">●</span>
          <div class="pixel-mouth">○</div>
        </div>
      </div>
      <div class="redirect-text">
        <p class="redirect-main-text" data-text="이런! 웹 사이트로 연결할게요!"></p>
        <p class="redirect-emoji">:)</p>
      </div>
      <div class="redirect-loading">
        <span class="loading-dot">●</span>
        <span class="loading-dot">●</span>
        <span class="loading-dot">●</span>
      </div>
    </div>
  `;

  // 윈도우 바디에 메시지 추가
  windowBody.appendChild(redirectMessage);
  windowBody.classList.add('redirecting');

  // 타이핑 효과 시작 (0.5초 후)
  setTimeout(() => {
    startTypingEffect(
      redirectMessage.querySelector('.redirect-main-text'),
      () => {
        setTimeout(() => {
          window.open(url, '_blank');
          closePixelWindow();
        }, 500);
      }
    );
  }, 500);
};

/**
 * 픽셀 윈도우 닫기
 */
const closePixelWindow = () => {
  const pixelWindow = document.querySelector('#pixel_window');
  const iframe = document.querySelector('#pixel-iframe');
  const windowBody = document.querySelector('.pixel-window-body');

  if (!pixelWindow) return;

  // 닫기 애니메이션
  pixelWindow.classList.remove('visible', 'opening', 'maximized');

  // iframe과 리다이렉트 메시지 정리
  setTimeout(() => {
    if (iframe) {
      iframe.src = '';
    }

    if (windowBody) {
      windowBody.classList.remove('loaded', 'redirecting');

      // 리다이렉트 메시지 제거
      const redirectMessage = windowBody.querySelector('.redirect-message');
      if (redirectMessage) {
        redirectMessage.remove();
      }
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