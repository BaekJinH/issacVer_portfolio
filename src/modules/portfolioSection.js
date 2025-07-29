// portfolioSection.js - 포트폴리오 섹션 모듈

import {
  PORTFOLIO_ITEM_HEIGHT_REM,
  PORTFOLIO_VIEW_COUNT
} from './constants.js';
import {
  throttle,
  rafThrottle,
  handleError,
  ErrorTypes,
  safeFetch
} from './utils.js';

// 포트폴리오 섹션 상태 변수
let portfolioData = [];
let currentPortfolioItemIndex = 0;

// DOM 요소 캐싱
let portfolioContentList = null;
let portfolioListContainer = null;
let contentThumbnail = null;

// 이벤트 리스너 참조 (중복 등록 방지용)
let portfolioClickHandler = null;
let portfolioKeyDownHandler = null;
let portfolioWheelHandler = null;

/**
 * 포트폴리오 섹션 DOM 요소들을 초기화합니다.
 */
export const initPortfolioDOMElements = () => {
  const mainElement = document.querySelector('main');
  portfolioListContainer = mainElement.querySelector('.content_list_viewer');
  portfolioContentList = mainElement.querySelector('.content_list');
  contentThumbnail = mainElement.querySelector('.content_thumbnail');
};

/**
 * 포트폴리오 데이터 불러오기 (강화된 에러 핸들링)
 */
export const importPortfolio = async () => {
  // 강화된 에러 핸들링을 위한 폴백 처리 함수
  const handlePortfolioError = (errorType, userMessage) => {
    // 에러 타입별 폴백 데이터 생성
    const fallbackData = {
      [ErrorTypes.NETWORK]: {
        title: "네트워크 연결 오류",
        img: "",
        link: "#",
        description: "인터넷 연결을 확인해주세요.",
        contribution: "0",
        useSkill: [{
          skill: "네트워크 확인 필요",
          percentage: 0
        }]
      },
      [ErrorTypes.NOT_FOUND]: {
        title: "파일을 찾을 수 없음",
        img: "",
        link: "#",
        description: "포트폴리오 데이터 파일이 누락되었습니다.",
        contribution: "0",
        useSkill: [{
          skill: "파일 확인 필요",
          percentage: 0
        }]
      },
      [ErrorTypes.PARSE]: {
        title: "데이터 형식 오류",
        img: "",
        link: "#",
        description: "포트폴리오 데이터 형식에 문제가 있습니다.",
        contribution: "0",
        useSkill: [{
          skill: "데이터 검증 필요",
          percentage: 0
        }]
      }
    };

    const defaultFallback = {
      title: "데이터 로드 실패",
      img: "",
      link: "#",
      description: "포트폴리오 데이터를 불러올 수 없습니다.",
      contribution: "0",
      useSkill: [{
        skill: "오류 발생",
        percentage: 0
      }]
    };

    // 에러 타입에 맞는 폴백 데이터 선택
    const errorData = fallbackData[errorType] || defaultFallback;
    portfolioData = [
      [errorData]
    ];

    // 사용자에게 알림 (선택적)
    showUserNotification(userMessage, 'error');
  };

  // safeFetch 사용하여 안전한 데이터 로딩
  const result = await safeFetch(
    'src/portfolio_data.json',
    '포트폴리오',
    handlePortfolioError
  );

  if (result.success) {
    portfolioData = result.data;
    console.log('✅ 포트폴리오 데이터 검증 완료:', portfolioData[0]?.length, '개 항목');

    // 데이터 유효성 검증
    if (!validatePortfolioData(portfolioData)) {
      handleError(
        new Error('포트폴리오 데이터 유효성 검증 실패'),
        '포트폴리오',
        null,
        (errorType, message) => handlePortfolioError(ErrorTypes.VALIDATION, message)
      );
    }
  }

  fetchPortfolio(); // 데이터 로드 후 포트폴리오 렌더링 시작
};

/**
 * 포트폴리오 데이터 유효성 검증
 * @param {Array} data - 검증할 데이터
 * @returns {boolean} - 유효성 검증 결과
 */
const validatePortfolioData = (data) => {
  try {
    // 기본 구조 검증
    if (!Array.isArray(data) || !data[0] || !Array.isArray(data[0])) {
      console.warn('⚠️ 포트폴리오 데이터 구조가 올바르지 않습니다.');
      return false;
    }

    const portfolioItems = data[0];

    // 각 아이템 필수 필드 검증
    const requiredFields = ['title', 'link'];
    const validItems = portfolioItems.filter(item => {
      return requiredFields.every(field =>
        item.hasOwnProperty(field) && typeof item[field] === 'string'
      );
    });

    if (validItems.length !== portfolioItems.length) {
      console.warn(`⚠️ 일부 포트폴리오 아이템에 필수 필드가 누락되었습니다. (유효: ${validItems.length}/${portfolioItems.length})`);
    }

    return portfolioItems.length > 0;
  } catch (error) {
    console.error('포트폴리오 데이터 검증 중 오류:', error);
    return false;
  }
};

/**
 * 사용자 알림 표시 (간단한 토스트 형태)
 * @param {string} message - 표시할 메시지
 * @param {string} type - 알림 타입 ('error', 'success', 'warning')
 */
const showUserNotification = (message, type = 'info') => {
  // 기존 알림이 있다면 제거
  const existingNotification = document.getElementById('portfolio-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.id = 'portfolio-notification';
  notification.className = `notification notification--${type}`;
  notification.textContent = message;

  // 스타일 적용
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'error' ? '#ff4444' : '#4CAF50'};
    color: white;
    padding: 12px 16px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  // 애니메이션으로 표시
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  });

  // 5초 후 자동 제거
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';

      setTimeout(() => {
        notification.remove();
      }, 300);
    }
  }, 5000);
};

/**
 * 포트폴리오 클릭 이벤트 핸들러
 * @param {Event} e - 클릭 이벤트
 */
const handlePortfolioClick = (e) => {
  const li = e.target.closest('li');
  if (li) {
    updatePortfolioSelection(parseInt(li.dataset.index, 10));
  }
};

/**
 * 포트폴리오 키보드 이벤트 핸들러
 * @param {Event} e - 키보드 이벤트
 */
const handlePortfolioKeyDown = (e) => {
  if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return;
  e.preventDefault();

  const portfolioItems = portfolioData[0];
  if (!portfolioItems) return;

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
};

/**
 * 포트폴리오 휠 스크롤 이벤트 핸들러 (성능 최적화 적용)
 * @param {Event} e - 휠 이벤트
 */
const handlePortfolioWheelBase = (e) => {
  e.preventDefault();

  const portfolioItems = portfolioData[0];
  if (!portfolioItems) return;

  const delta = e.deltaY;
  let newIndex = currentPortfolioItemIndex;
  const total = portfolioItems.length;

  if (delta > 0) {
    // 스크롤 다운 - 다음 항목
    newIndex = (currentPortfolioItemIndex + 1) % total;
  } else {
    // 스크롤 업 - 이전 항목
    newIndex = (currentPortfolioItemIndex - 1 + total) % total;
  }

  if (newIndex !== currentPortfolioItemIndex) {
    updatePortfolioSelection(newIndex);
  }
};

// 휠 이벤트에 throttle 적용 (100ms 간격으로 제한)
const handlePortfolioWheel = throttle(handlePortfolioWheelBase, 100);

/**
 * 포트폴리오 데이터를 li 요소로 생성하여 배치합니다.
 * 원본 기능을 완전히 복원한 버전
 */
const fetchPortfolio = () => {
  if (!portfolioContentList || !portfolioData || portfolioData.length === 0 || !portfolioData[0]) {
    console.warn("포트폴리오 데이터를 불러올 수 없거나 요소가 없습니다.");
    return;
  }

  const mainElement = document.querySelector('main');
  const portfolioItems = portfolioData[0];

  // 안전성 검사
  if (!contentThumbnail) {
    console.warn("썸네일 컨테이너를 찾을 수 없습니다.");
    return;
  }

  // 포트폴리오 뷰어의 높이를 상수를 사용해서 동적으로 설정
  if (portfolioListContainer) {
    const maxHeight = `${PORTFOLIO_VIEW_COUNT * PORTFOLIO_ITEM_HEIGHT_REM}rem`;
    portfolioListContainer.style.maxHeight = maxHeight;
  }

  // 기존 요소들 초기화
  contentThumbnail.querySelectorAll('.p-card').forEach(card => card.remove());
  portfolioContentList.innerHTML = '';

  // 기존 이벤트 리스너 제거 (중복 등록 방지)
  if (portfolioClickHandler) {
    portfolioContentList.removeEventListener('click', portfolioClickHandler);
  }
  if (portfolioKeyDownHandler) {
    portfolioContentList.removeEventListener('keydown', portfolioKeyDownHandler);
  }
  if (portfolioWheelHandler) {
    contentThumbnail.removeEventListener('wheel', portfolioWheelHandler);
  }

  // 1. 컨트롤러(li)와 카드(a) DOM 생성
  portfolioItems.forEach((item, index) => {
    // 리스트 아이템 생성
    const li = document.createElement('li');
    li.textContent = item.title;
    li.dataset.index = index;
    li.tabIndex = -1; // 초기엔 포커스 비활성
    portfolioContentList.appendChild(li);

    // 카드 아이템 생성 (원본처럼 a 태그로)
    const card = document.createElement('a');
    card.href = item.link;
    card.className = 'p-card';
    card.dataset.index = index;
    card.target = '_blank';
    card.style.backgroundImage = `url(./src/image/portfolio/portfolio_img_${index+1}.png)`;
    card.tabIndex = -1; // 기본적으로 포커스 불가능

    // 카드 클릭 이벤트 (현재 카드만 링크 작동)
    card.addEventListener('click', (e) => {
      if (!card.classList.contains('card--current')) {
        e.preventDefault(); // 현재 카드가 아니면 링크 비활성화
        updatePortfolioSelection(index);
      }
    });

    contentThumbnail.appendChild(card);
  });

  if (portfolioContentList.children.length > 0) {
    portfolioContentList.children[0].tabIndex = 0; // 첫 아이템만 포커스 가능
  }

  // 2. 이벤트 리스너 등록 (성능 최적화 적용)
  portfolioClickHandler = handlePortfolioClick;
  portfolioKeyDownHandler = handlePortfolioKeyDown;
  portfolioWheelHandler = handlePortfolioWheel; // throttle 적용된 핸들러

  portfolioContentList.addEventListener('click', portfolioClickHandler);
  portfolioContentList.addEventListener('keydown', portfolioKeyDownHandler);
  contentThumbnail.addEventListener('wheel', portfolioWheelHandler, {
    passive: false
  }); // passive: false로 preventDefault 허용

  // 3. 초기 상태 설정
  updatePortfolioSelection(0);
};

/**
 * 포트폴리오 목록 보기 업데이트 (스크롤 위치 조정) - RAF 최적화 적용
 */
const updatePortfolioViewBase = () => {
  if (!portfolioContentList || !portfolioListContainer) return;

  // 현재 선택된 아이템이 뷰포트 중앙에 오도록 스크롤 위치 조정
  const allLiElements = portfolioContentList.querySelectorAll('li');
  if (allLiElements.length === 0) return;

  const currentItem = allLiElements[currentPortfolioItemIndex];
  if (!currentItem) return;

  // 현재 선택된 아이템의 위치를 기준으로 스크롤 오프셋 계산
  const currentItemOffsetTop = currentItem.offsetTop;
  const containerHeight = portfolioListContainer.clientHeight;
  const currentItemHeight = currentItem.offsetHeight;

  // 아이템이 뷰어 중앙에 오도록 스크롤 조정 (약간의 여백 고려)
  const targetScrollTop = currentItemOffsetTop - (containerHeight / 2) + (currentItemHeight / 2);
  portfolioListContainer.scrollTo({
    top: targetScrollTop,
    behavior: 'smooth'
  });
};

// RAF로 스크롤 업데이트 최적화
const updatePortfolioView = rafThrottle(updatePortfolioViewBase);

/**
 * 기여도 바 UI를 업데이트하는 함수
 * @param {string|number} contribution - 기여도 퍼센티지
 */
const updateContributionBar = (contribution) => {
  const contributionBarFill = document.querySelector('.contribution_bar_fill');
  if (!contributionBarFill) return;

  const contributionValue = typeof contribution === 'string' ? parseInt(contribution, 10) : contribution;
  // requestAnimationFrame을 사용하여 부드러운 애니메이션 보장
  requestAnimationFrame(() => {
    contributionBarFill.style.width = `${contributionValue}%`;
  });
};

/**
 * 스킬 리스트 업데이트 (원본에서 누락된 기능 복원)
 * @param {Array} useSkill - 사용된 스킬 배열
 */
const updateSkillList = (useSkill) => {
  const useSkillList = document.querySelector('.use_skill_list');
  if (!useSkillList) return;

  // 기존 스킬 항목 제거
  useSkillList.innerHTML = '';

  if (!useSkill || useSkill.length === 0) {
    // 스킬 데이터가 없는 경우
    const noSkillItem = document.createElement('li');
    noSkillItem.className = 'no-skills';
    noSkillItem.textContent = '사용 기술 정보 없음';
    useSkillList.appendChild(noSkillItem);
    return;
  }

  // 스킬 항목들 생성
  useSkill.forEach((skillData, index) => {
    const skillItem = document.createElement('li');
    skillItem.className = 'skill-item';

    // 스킬 항목 HTML 구조 생성
    skillItem.innerHTML = `
      <div class="skill-name">${skillData.skill}</div>
      <div class="skill-progress">
        <div class="skill-progress-bar">
          <div class="skill-progress-fill" style="width: 0%;" data-percentage="${skillData.percentage}"></div>
        </div>
      </div>
      <div class="skill-percentage">${skillData.percentage}%</div>
    `;

    useSkillList.appendChild(skillItem);

    // 애니메이션 효과를 위한 지연 실행
    setTimeout(() => {
      const progressFill = skillItem.querySelector('.skill-progress-fill');
      if (progressFill) {
        progressFill.style.transition = 'width 1s ease-out';
        progressFill.style.width = `${skillData.percentage}%`;
      }
    }, index * 100 + 200); // 각 스킬마다 100ms씩 지연, 초기 200ms 대기
  });
};

/**
 * 카드 애니메이션 업데이트 (원본 기능 복원)
 * @param {number} currentIndex - 현재 선택된 인덱스
 * @param {number} previousIndex - 이전 선택된 인덱스
 */
const updateCardAnimation = (currentIndex, previousIndex) => {
  const allCards = contentThumbnail.querySelectorAll('.p-card');
  if (allCards.length === 0) return;

  const portfolioItems = portfolioData[0];
  const total = portfolioItems.length;

  // 모든 카드의 클래스 초기화
  allCards.forEach(card => {
    card.classList.remove('card--current', 'card--next', 'card--out');
    card.tabIndex = -1; // 모든 카드 포커스 비활성화
  });

  // 이전 카드에 나가는 애니메이션 적용
  if (previousIndex !== currentIndex && allCards[previousIndex]) {
    allCards[previousIndex].classList.add('card--out');
  }

  // 현재 카드 활성화
  if (allCards[currentIndex]) {
    allCards[currentIndex].classList.add('card--current');
    allCards[currentIndex].tabIndex = 0; // 현재 카드만 포커스 가능
  }

  // 다음 카드 설정 (스택 효과)
  const nextIndex = (currentIndex + 1) % total;
  if (allCards[nextIndex]) {
    allCards[nextIndex].classList.add('card--next');
  }
};

/**
 * 썸네일 이미지와 정보 업데이트 (원본 기능 복원)
 * @param {string} imgName - 이미지 파일명
 * @param {string} link - 링크 URL
 * @param {string} contribution - 기여도
 */
const updateThumbnail = (imgName, link, contribution) => {
  const currentCard = contentThumbnail.querySelector('.p-card.card--current');
  if (currentCard) {
    currentCard.style.backgroundImage = `url(${imgName})`;
    currentCard.href = link;
  }

  // 기여도 바 업데이트
  if (contribution) {
    updateContributionBar(contribution);
  }
};

/**
 * 현재 선택된 포트폴리오 항목 업데이트
 * @param {number} index 선택할 인덱스
 * @param {boolean} shouldFocus 포커스 이동 여부 (기본값: true)
 */
const updatePortfolioSelection = (index, shouldFocus = true) => {
  if (!portfolioData || !portfolioData[0] || index < 0 || index >= portfolioData[0].length) return;

  const portfolioItems = portfolioData[0];
  const previousIndex = currentPortfolioItemIndex;
  currentPortfolioItemIndex = index;

  // 선택된 포트폴리오 아이템 스타일 적용
  const allLiElements = portfolioContentList.querySelectorAll('li');
  allLiElements.forEach((li, i) => {
    li.classList.toggle('selected', i === index);
    li.classList.toggle('active', i === index); // CSS에서 사용하는 active 클래스도 추가
  });

  // 카드 애니메이션 업데이트 (원본 기능 복원!)
  updateCardAnimation(index, previousIndex);

  // 현재 아이템 정보 업데이트
  const currentItem = portfolioItems[index];

  // 제목 업데이트
  const titleElement = document.querySelector('.content_title');
  if (titleElement && currentItem.title) {
    titleElement.textContent = currentItem.title;
  }

  // 설명 업데이트 (description 필드가 있는 경우)
  const descElement = document.querySelector('.content_desc');
  if (descElement) {
    if (currentItem.description) {
      descElement.textContent = currentItem.description;
    } else {
      // description이 없으면 기본 텍스트
      descElement.textContent = '프로젝트 상세 정보';
    }
  }

  // 기여도 바 업데이트
  if (currentItem.contribution) {
    updateContributionBar(currentItem.contribution);
  }

  // 스킬 리스트 업데이트 (원본에서 누락된 기능 복원!)
  if (currentItem.useSkill) {
    updateSkillList(currentItem.useSkill);
  }

  // 썸네일 업데이트 (원본 기능 복원!)
  updateThumbnail(
    `./src/image/portfolio/portfolio_img_${index+1}.png`,
    currentItem.link,
    currentItem.contribution
  );

  // 스크롤 위치 업데이트 (RAF 최적화 적용)
  updatePortfolioView();
};

/**
 * 포트폴리오 섹션 정리 (이벤트 리스너 제거)
 */
export const cleanupPortfolioSection = () => {
  if (portfolioContentList) {
    if (portfolioClickHandler) {
      portfolioContentList.removeEventListener('click', portfolioClickHandler);
      portfolioClickHandler = null;
    }
    if (portfolioKeyDownHandler) {
      portfolioContentList.removeEventListener('keydown', portfolioKeyDownHandler);
      portfolioKeyDownHandler = null;
    }
  }
  if (contentThumbnail && portfolioWheelHandler) {
    contentThumbnail.removeEventListener('wheel', portfolioWheelHandler);
    portfolioWheelHandler = null;
  }

  // 알림 정리
  const notification = document.getElementById('portfolio-notification');
  if (notification) {
    notification.remove();
  }
};

/**
 * 포트폴리오 섹션 초기화
 * @param {HTMLElement} wrapper - 포트폴리오 섹션 래퍼 요소
 */
export const initPortfolioSection = (wrapper) => {
  // 첫 번째 포트폴리오 아이템에 포커스 설정
  const firstPortfolioItem = portfolioContentList ? portfolioContentList.querySelector('li') : null;
  if (firstPortfolioItem) {
    firstPortfolioItem.focus();
  } else {
    // 포트폴리오 아이템이 없으면 다른 포커스 가능한 요소 찾기
    const focusableElements = wrapper.querySelectorAll('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }
};