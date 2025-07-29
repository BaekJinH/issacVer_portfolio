// optionInfoManager.js - 옵션 정보 관리 모듈

// 현재 활성화된 정보 텍스트 인덱스
let currentActiveInfoIndex = -1;

// 옵션 정보 텍스트 요소들
let optionInfoTexts = [];

/**
 * 옵션 정보 텍스트 요소들을 초기화합니다.
 */
export const initOptionInfoTexts = () => {
  const optionInfoWrapper = document.querySelector('.option_info_wrapper');
  if (optionInfoWrapper) {
    optionInfoTexts = Array.from(optionInfoWrapper.querySelectorAll('.option_info_text'));
  }
};

/**
 * 옵션 정보 텍스트를 업데이트합니다.
 * @param {number} index - 활성화할 텍스트의 인덱스
 */
export const updateOptionInfo = (index) => {
  if (!optionInfoTexts || optionInfoTexts.length === 0) return;

  // 모든 텍스트의 애니메이션을 즉시 중단하고 숨김
  optionInfoTexts.forEach((text, textIndex) => {
    // 모든 애니메이션 클래스 제거
    text.classList.remove('active', 'exiting');

    // 현재 선택된 인덱스가 아닌 모든 텍스트 숨김
    if (textIndex !== index) {
      text.style.opacity = '0';
      text.style.visibility = 'hidden';
    }
  });

  // 선택된 텍스트만 즉시 활성화 (지연 없음)
  if (optionInfoTexts[index]) {
    const targetText = optionInfoTexts[index];

    // 스타일 초기화
    targetText.style.opacity = '';
    targetText.style.visibility = '';

    // 작은 지연 후 활성화 (DOM 업데이트 보장)
    requestAnimationFrame(() => {
      targetText.classList.add('active');
    });

    currentActiveInfoIndex = index;
  }
};

/**
 * 모든 옵션 정보 텍스트를 숨깁니다.
 */
export const hideAllOptionInfo = () => {
  optionInfoTexts.forEach(text => {
    text.classList.remove('active', 'exiting');
    text.style.opacity = '0';
    text.style.visibility = 'hidden';
  });
  currentActiveInfoIndex = -1;
};

/**
 * 현재 활성화된 정보 텍스트 인덱스를 반환합니다.
 * @returns {number} 현재 활성화된 인덱스
 */
export const getCurrentActiveInfoIndex = () => {
  return currentActiveInfoIndex;
};