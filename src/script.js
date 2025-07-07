// 1) 컷신 데이터 (JSON에서 로드)
let scenes = [];

// 2) 전역변수
let sceneIndex = 0;
let fullscreenActivated = false;
const wrapperEl = document.querySelector('#wrapper');
const narrationEl = wrapperEl.querySelector('.narrate');
const choiceContainerEl = wrapperEl.querySelector('.choice_container');
const choice1 = wrapperEl.querySelector('.choice_1');
const choice2 = wrapperEl.querySelector('.choice_2');

// 3) JSON 데이터 로드 함수
async function loadScenes() {
  try {
    const response = await fetch('./src/scenes.json');
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
  wrapperEl.className = `scene_${idx + 1}`;

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

// 6) 이벤트 초기화
window.addEventListener('DOMContentLoaded', async () => {
  // 먼저 씬 데이터 로드
  await loadScenes();

  // 첫 번째 씬 렌더링
  renderScene(sceneIndex);

  // 클릭으로 전체화면 or 씬 진행
  document.addEventListener('click', (e) => {
    if (!fullscreenActivated) {
      document.documentElement.requestFullscreen().catch(() => {});
      fullscreenActivated = true;
    } else {
      // 현재 씬에 선택지가 있으면 클릭으로 넘어가지 않음
      const currentScene = scenes[sceneIndex];
      if (!currentScene.choices) {
        nextScene();
      }
    }
  });

  // 키보드 이벤트
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goBack();
    if (e.key === 'F11') {
      e.preventDefault();
      if (!fullscreenActivated) {
        document.documentElement.requestFullscreen().catch(() => {});
        fullscreenActivated = true;
      }
    }
  });

  // 선택지 클릭 핸들러 (기존과 동일)
  choice1.addEventListener('click', (e) => {
    e.stopPropagation();
    const nextIdx = scenes[sceneIndex].choices[0].next;
    if (nextIdx != null) {
      sceneIndex = nextIdx;
      renderScene(sceneIndex);
    }
  });
  choice2.addEventListener('click', (e) => {
    e.stopPropagation();
    const nextIdx = scenes[sceneIndex].choices[1].next;
    if (nextIdx != null) {
      sceneIndex = nextIdx;
      renderScene(sceneIndex);
    }
  });

  // 전체화면 변경 감지 (기존 그대로)
  document.addEventListener('fullscreenchange', () => {
    const modal = document.querySelector('.full_screen_alarm_modal');
    modal.style.display = document.fullscreenElement ? 'none' : 'flex';
  });
});