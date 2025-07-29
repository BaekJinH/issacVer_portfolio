// contactSection.js - Contact 섹션 모듈

import {
  scale,
  lerp
} from './utils.js';

/**
 * 컨택트 섹션 초기화 - 회전하는 텍스트 효과
 * @param {HTMLElement} wrapper - 컨택트 섹션 래퍼 요소
 */
export const initContactSection = (wrapper) => {
  let time = 0;
  let mouseX = window.innerWidth * 0.5;
  let x = 0.5; // 중앙에서 시작하도록
  let animationId = null;
  let isAnimating = false;
  let isDetailView = false; // 현재 뷰 상태 (링/디테일)

  // DOM 요소 캐싱
  const ringsContainer = wrapper.querySelector('.contact_space_container');
  const detailViewContainer = wrapper.querySelector('.detail_view_txt');
  const detailViewBtn = detailViewContainer ? detailViewContainer.querySelector('.detail_view_btn') : null;

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
      minSpeed: 0.007
    },
    {
      baseRadius: 160,
      angleX: 15,
      angleY: 10,
      angleZ: 15,
      speedMultiplier: 1.3,
      minSpeed: 0.008
    },
    {
      baseRadius: 200,
      angleX: 15,
      angleY: -10,
      angleZ: -10,
      speedMultiplier: 0.8,
      minSpeed: 0.005
    }
  ];

  let allRingLetters = []; // 모든 링 글자(span)를 담을 배열

  const rings = wrapper.querySelectorAll('.contact_ring');

  rings.forEach((ring, ringIndex) => {
    const text = ring.getAttribute('data-text');
    const config = ringConfigs[ringIndex];
    const lettersAndBr = [];
    const parts = text.split(/(<br\s*\/?>)/i).filter(Boolean);
    parts.forEach(part => {
      if (part.match(/<br\s*\/?>/i)) {
        lettersAndBr.push('<br>');
      } else {
        lettersAndBr.push(...part.split(''));
      }
    });

    // A. 각 detail_txt_wrapper의 p 태그에 텍스트 span 생성
    const wrapperSelector = `.detail_txt_wrapper_${ringIndex + 1} p`;
    const targetWrapper = wrapper.querySelector(wrapperSelector);

    if (targetWrapper) {
      targetWrapper.innerHTML = ''; // 기존 내용 제거
      lettersAndBr.forEach(item => {
        const span = document.createElement('span');
        if (item === '<br>') {
          span.innerHTML = '<br>';
        } else {
          span.textContent = item === ' ' ? '\u00A0' : item;
          span.style.display = 'inline-block';
        }
        span.style.opacity = '0';
        targetWrapper.appendChild(span);
      });
    }

    // B. 링 글자(span) 생성
    ring.innerHTML = '';
    ring.setAttribute('data-ring-index', ringIndex); // 링 인덱스 설정
    lettersAndBr.forEach((item) => {
      const span = document.createElement('span');
      if (item === '<br>') {
        span.innerHTML = ' '; // 링에서는 공백으로 처리
      } else {
        span.innerHTML = item;
      }
      span.classList.add('preparing');
      span.setAttribute('data-ring-index', ringIndex); // 각 글자에도 링 인덱스 설정
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
      }, globalIndex * 30); // 50ms씩 지연
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
      }, index * 20); // 30ms씩 지연으로 빠르게 떨어짐
    });

    // 모든 애니메이션이 끝난 후 콜백 실행
    setTimeout(() => {
      if (callback) callback();
    }, spanArray.length * 30 + 600);
  };

  // 자세히 보기 상태에서의 퇴장 애니메이션 (글자들이 아래로 떨어짐)
  const startDetailViewExitAnimation = (callback) => {
    isAnimating = true;
    let allSpans = [];

    // visible 상태인 wrapper들에서 p > span 수집
    wrapper.querySelectorAll('.detail_txt_wrapper.visible p span').forEach(span => {
      allSpans.push(span);
    });

    // detail_txt_wrapper 직속 span들도 수집
    wrapper.querySelectorAll('.detail_txt_wrapper.visible > span').forEach(span => {
      allSpans.push(span);
    });

    // 각 span에 순차적으로 퇴장 애니메이션 클래스 추가 (10ms 간격)
    allSpans.forEach((span, index) => {
      setTimeout(() => {
        span.classList.add('detail-exiting');
      }, index * 10); // 10ms씩 지연으로 순차적으로 떨어짐
    });

    // 모든 애니메이션이 끝난 후 콜백 실행
    setTimeout(() => {
      // 애니메이션 완료 후 클래스 정리
      allSpans.forEach(span => {
        span.classList.remove('detail-exiting');
      });
      if (callback) callback();
    }, allSpans.length * 10 + 800);
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

    // 링 애니메이션 중지 (자세히 보기로 갈 때)
    if (toDetail) {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    }

    if (!toDetail) { // wrapper -> 링으로 돌아갈 때
      // 링은 아직 숨겨둔 상태로 유지 (글자들이 모두 돌아온 후에 보이도록)
      // wrapper들 숨기기 (새로운 구조에 맞춤)
      wrapper.querySelectorAll('.detail_txt_wrapper').forEach(detailWrapper => {
        detailWrapper.classList.remove('visible');
      });
    }

    // 애니메이션 완료 카운터
    let totalAnimations = 0;
    let completedAnimations = 0;

    // 전체 애니메이션 수 계산
    rings.forEach((ring, ringIndex) => {
      const ringLetters = Array.from(ring.querySelectorAll('span'));
      // 새로운 구조에 맞춰 직접 셀렉터 사용
      const wrapperP = wrapper.querySelector(`.detail_txt_wrapper_${ringIndex + 1} p`);
      const wrapperSpans = wrapperP ? Array.from(wrapperP.querySelectorAll('span')) : [];

      if (ringLetters.length > 0 && wrapperSpans.length > 0) {
        const sourceElements = toDetail ? ringLetters : wrapperSpans;
        totalAnimations += sourceElements.length;
      }
    });

    // 애니메이션할 글자가 없는 경우 예외 처리
    if (totalAnimations === 0) {
      isAnimating = false;
      if (!toDetail) {
        ringsContainer.style.opacity = '1';
        startMainAnimation();
      }
      return;
    }

    // 각 링별로 처리
    rings.forEach((ring, ringIndex) => {
      const ringLetters = Array.from(ring.querySelectorAll('span'));
      // 새로운 구조에 맞춰 직접 셀렉터 사용
      const wrapperP = wrapper.querySelector(`.detail_txt_wrapper_${ringIndex + 1} p`);
      const wrapperSpans = wrapperP ? Array.from(wrapperP.querySelectorAll('span')) : [];

      if (ringLetters.length === 0 || wrapperSpans.length === 0) return;

      const sourceElements = toDetail ? ringLetters : wrapperSpans;
      const targetElements = toDetail ? wrapperSpans : ringLetters;

      sourceElements.forEach((sourceEl, letterIndex) => {
        const targetEl = targetElements[letterIndex];
        if (!targetEl) return;

        const startPos = sourceEl.getBoundingClientRect();
        const targetPos = targetEl.getBoundingClientRect();

        // 글자 복제본 생성
        const clone = document.createElement('span');
        clone.textContent = sourceEl.textContent;
        clone.className = 'letter-clone';
        clone.style.fontSize = window.getComputedStyle(sourceEl).fontSize;
        clone.style.color = window.getComputedStyle(sourceEl).color;

        // 복제본을 시작 위치에 배치
        clone.style.transform = `translate(${startPos.left}px, ${startPos.top}px)`;
        clone.style.left = '0px';
        clone.style.top = '0px';
        clone.style.opacity = '1'; // 명시적으로 불투명 설정

        document.body.appendChild(clone);

        // 원본 숨기기
        sourceEl.style.opacity = 0;

        // 복제본을 목표 위치로 애니메이션
        requestAnimationFrame(() => {
          clone.classList.add(toDetail ? 'to-detail' : 'to-ring');
          clone.style.transform = `translate(${targetPos.left}px, ${targetPos.top}px)`;
        });

        // 애니메이션 후 정리
        clone.addEventListener('transitionend', () => {
          clone.remove();
          targetEl.style.opacity = 1;

          completedAnimations++;

          // 모든 애니메이션이 완료되었을 때
          if (completedAnimations >= totalAnimations) {
            isAnimating = false;
            if (!toDetail) { // 링으로 돌아왔을 때만 메인 애니메이션 다시 시작
              // 모든 글자가 돌아온 후에 링을 보이게 하고 메인 애니메이션 시작
              setTimeout(() => {
                ringsContainer.style.opacity = '1';
                startMainAnimation();
              }, 150); // 약간의 지연을 주어 자연스럽게
            }
          }
        }, {
          once: true
        });
      });
    });

    if (toDetail) { // 링 -> wrapper로 갈 때
      ringsContainer.style.opacity = '0';
      // wrapper들 보이기 (새로운 구조에 맞춤)
      const allDetailWrappers = wrapper.querySelectorAll('.detail_txt_wrapper');
      allDetailWrappers.forEach((detailWrapper, index) => {
        setTimeout(() => {
          detailWrapper.classList.add('visible');
        }, index * 100); // 순차적으로 나타나게
      });
    } else { // wrapper -> 링으로 갈 때
      // wrapper들 숨기기 (새로운 구조에 맞춤)
      const allDetailWrappers = wrapper.querySelectorAll('.detail_txt_wrapper');
      allDetailWrappers.forEach(detailWrapper => {
        detailWrapper.classList.remove('visible');
      });
      // 링은 애니메이션 완료 후에 보이게 함
      ringsContainer.style.opacity = '0';
    }
  };

  // 디테일 뷰 토글 핸들러
  const handleDetailViewToggle = () => {
    // 애니메이션이 진행 중이면 버튼 클릭 무시
    if (isAnimating) return;

    if (isDetailView) { // 리스트 -> 링
      animateViewChange(false);
    } else { // 링 -> 리스트
      cancelAnimationFrame(animationId);
      animationId = null;
      animateViewChange(true);
    }
    isDetailView = !isDetailView;
    if (detailViewBtn) {
      detailViewBtn.textContent = isDetailView ? '돌아가기' : '자세히 보기';
    }
  };

  const handleMouse = (e) => {
    if (e.type === 'mousemove') {
      mouseX = e.clientX;
    } else if (e.type === 'touchstart' || e.type === 'touchmove') {
      mouseX = e.touches[0]?.clientX || mouseX;
    }
  };

  // 자세히보기 버튼 키보드 이벤트 핸들러
  const handleDetailViewKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      // 애니메이션이 진행 중이면 키보드 입력 무시
      if (isAnimating) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      handleDetailViewToggle();
    }
  };

  // 이벤트 리스너 등록
  wrapper.addEventListener('mousemove', handleMouse);
  wrapper.addEventListener('touchstart', handleMouse);
  wrapper.addEventListener('touchmove', handleMouse);
  if (detailViewBtn) {
    detailViewBtn.addEventListener('click', handleDetailViewToggle); // 버튼 클릭 리스너
    detailViewBtn.addEventListener('keydown', handleDetailViewKeyDown); // 버튼 키보드 리스너
  }

  // 초기 상태 설정 (섹션 재진입 시 항상 링 상태로 시작)
  isDetailView = false;
  ringsContainer.style.opacity = '1';
  ringsContainer.style.visibility = 'visible';

  // wrapper들 숨기기 (새로운 구조에 맞춤)
  wrapper.querySelectorAll('.detail_txt_wrapper').forEach(detailWrapper => {
    detailWrapper.classList.remove('visible');
  });

  // 버튼 텍스트 초기화
  if (detailViewBtn) {
    detailViewBtn.textContent = '자세히 보기';
  }

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

    // 상태 완전 초기화
    isAnimating = false;
    isDetailView = false;

    // 링 컨테이너 상태 리셋
    ringsContainer.style.opacity = '1';
    ringsContainer.style.visibility = 'visible';

    // wrapper들 숨기기 및 정리 (새로운 구조에 맞춤)
    wrapper.querySelectorAll('.detail_txt_wrapper').forEach(detailWrapper => {
      detailWrapper.classList.remove('visible');

      // p 태그 내의 span들 정리
      const wrapperP = detailWrapper.querySelector('p');
      if (wrapperP) {
        wrapperP.innerHTML = ''; // 내용 정리

        // span들의 애니메이션 클래스 정리
        const spans = wrapperP.querySelectorAll('span');
        spans.forEach(span => {
          span.classList.remove('detail-exiting');
          span.style.position = '';
          span.style.left = '';
          span.style.top = '';
          span.style.zIndex = '';
        });
      }
    });

    // 버튼 텍스트 리셋
    if (detailViewBtn) {
      detailViewBtn.textContent = '자세히 보기';
    }
  };

  // 퇴장 애니메이션 함수들과 상태를 wrapper에 저장
  wrapper._contactExitAnimation = startExitAnimation;
  wrapper._contactDetailExitAnimation = startDetailViewExitAnimation;
  wrapper._getDetailViewState = () => isDetailView;
  wrapper._getAnimatingState = () => isAnimating;
};