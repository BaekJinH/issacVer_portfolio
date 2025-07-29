// 1) 컷신 데이터 (JSON에서 로드)
let scenes = [];

// 2) 전역변수
let sceneIndex = 0;
let currentImageClass = null; // 현재 활성화된 이미지 클래스 추적
const wrapperEl = document.querySelector('#wrapper');
const narrationEl = wrapperEl.querySelector('.narrate');
const choiceContainerEl = wrapperEl.querySelector('.choice_container');
const choice1 = wrapperEl.querySelector('.choice_1');
const choice2 = wrapperEl.querySelector('.choice_2');

// 3) JSON 데이터 로드 함수
async function loadScenes() {
  try {
    const response = await fetch('src/scenes.json'); // HTML 기준 경로
    if (!response.ok) {
      throw new Error('씬 데이터를 불러올 수 없습니다.');
    }
    scenes = await response.json();
  } catch (error) {
    console.error('씬 데이터 로드 실패:', error);
    // 기본 데이터로 대체
    scenes = [{
      text: "데이터를 불러오는 중 오류가 발생했습니다."
    }];
  }
}

// 3) 씬 넘길 때마다 그려지는 소리(삭삭거리는 소리) 재생
const drawSound = new Audio('./src/draw.mp3');

// 4) 씬 렌더링 함수
function renderScene(idx) {
  const scene = scenes[idx];

  if (scene.text)
    narrationEl.innerHTML = scene.text;

  // 기존 scene_idx 관련 클래스들 제거 (scene_1, scene_2 등)
  const classList = Array.from(wrapperEl.classList);
  classList.forEach(className => {
    if (className.startsWith('scene_') && !className.startsWith('scene_img_')) {
      wrapperEl.classList.remove(className);
    }
  });

  // 새로운 scene_idx 클래스 추가
  wrapperEl.classList.add(`scene_${idx + 1}`);

  // 새로운 sceneNumber가 있을 때만 이미지 클래스 교체
  if (scene.sceneNumber !== undefined) {
    // 기존 이미지 클래스 제거
    if (currentImageClass) {
      wrapperEl.classList.remove(currentImageClass);
    }

    // 새로운 이미지 클래스 추가
    const newImageClass = `scene_img_${scene.sceneNumber}`;
    wrapperEl.classList.add(newImageClass);
    currentImageClass = newImageClass;
  }
  // sceneNumber가 없으면 기존 이미지 클래스 유지

  if (scene.choices) {
    choiceContainerEl.style.display = 'block';
    choice1.textContent = scene.choices[0].label;
    choice2.textContent = scene.choices[1].label;
  } else {
    choiceContainerEl.style.display = 'none';
  }
}

// 5) 씬 이동 함수
function nextScene() {
  if (sceneIndex < scenes.length - 1) {
    sceneIndex++;
    renderScene(sceneIndex);
  }
}

function goBack() {
  if (sceneIndex > 0) {
    sceneIndex--;
    renderScene(sceneIndex);
  }
}

// 6) 전체화면 토글 기능
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
  // 토글 버튼 UI 업데이트
  if (document.fullscreenElement) {
    fullscreenIcon.textContent = '⛸';
    fullscreenText.textContent = '창모드';
  } else {
    fullscreenIcon.textContent = '⛶';
    fullscreenText.textContent = '전체화면';
  }
};

// 7) 이벤트 초기화
window.addEventListener('DOMContentLoaded', async () => {
  // 먼저 씬 데이터 로드
  await loadScenes();

  // 첫 번째 씬 렌더링
  renderScene(sceneIndex);

  // 전체화면 버튼 이벤트 리스너
  if (fullscreenToggleBtn) {
    fullscreenToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // 클릭 이벤트 전파 방지
      toggleFullscreen();
    });
    fullscreenToggleBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        toggleFullscreen();
      }
    });
  }

  // 전체화면 상태 변경 감지
  document.addEventListener('fullscreenchange', handleFullscreenChange);

  // 클릭으로 씬 진행 (전체화면 자동 전환 제거)
  document.addEventListener('click', (e) => {
    // 전체화면 버튼 클릭은 무시
    if (e.target.closest('.fullscreen_toggle_btn')) {
      return;
    }

    const currentScene = scenes[sceneIndex];
    if (!currentScene.choices) {
      // 마지막 텍스트(씬)일 때
      if (sceneIndex === scenes.length - 1) {
        window.location.href = './main.html';
      } else {
        nextScene();
      }
    }
  });

  // 키보드 이벤트
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goBack();
    if (e.key === 'F11') {
      e.preventDefault();
      toggleFullscreen();
    }
  });

  // 선택지 클릭 핸들러
  choice1.addEventListener('click', (e) => {
    e.stopPropagation();
    const choice = scenes[sceneIndex].choices[0];
    const label = choice.label.toLowerCase();

    // 스킵하기 관련 키워드 체크
    if (label.includes('넘기') || label.includes('스킵') || label.includes('skip')) {
      // main.html로 이동
      window.location.href = './main.html';
      return;
    }

    // 일반적인 씬 이동
    const nextIdx = choice.next;
    if (nextIdx != null) {
      sceneIndex = nextIdx;
      renderScene(sceneIndex);
    }
  });

  choice2.addEventListener('click', (e) => {
    e.stopPropagation();
    const choice = scenes[sceneIndex].choices[1];
    const label = choice.label.toLowerCase();

    // 스킵하기 관련 키워드 체크
    if (label.includes('넘기') || label.includes('스킵') || label.includes('skip')) {
      // main.html로 이동
      window.location.href = './main.html';
      return;
    }

    // 일반적인 씬 이동
    const nextIdx = choice.next;
    if (nextIdx != null) {
      sceneIndex = nextIdx;
      renderScene(sceneIndex);
    }
  });
});