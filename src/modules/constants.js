// constants.js - 상수 및 설정 데이터

// 섹션 클래스 목록
export const SECTION_CLASSES = ['portfolio', 'about', 'contact', 'blog', 'restart'];

// 트랜지션 시간 설정
export const TRANSITION_DURATION = 300; // 섹션 활성화/비활성화 트랜지션 시간 (ms)
export const DICE_TRANSITION_DURATION = 200; // dice_wrapper 트랜지션 시간 (ms)

// 포트폴리오 설정
export const PORTFOLIO_ITEM_HEIGHT_REM = 3; // 포트폴리오 리스트 li 한 칸의 높이 (rem)
export const PORTFOLIO_VIEW_COUNT = 8; // 포트폴리오 목록에 한 번에 보여지는 아이템 수

// About 섹션 캐릭터 스탯 데이터
export const CHARACTER_STATS = [{
    speed: 50,
    exp: 40,
    skill: 40
  },
  {
    speed: 70,
    exp: 75,
    skill: 60
  },
  {
    speed: 100,
    exp: 100,
    skill: 100
  },
  {
    speed: 0,
    exp: 0,
    skill: 0
  },
  {
    speed: 0,
    exp: 10,
    skill: 10
  },
  {
    speed: 0,
    exp: 0,
    skill: 0
  },
  {
    speed: 20,
    exp: 25,
    skill: 30
  }
];

// About 섹션 캐릭터별 특징 배열
export const CHARACTER_FEATURES = [
  "첫 취업 웹 퍼블리셔 /<br>실무 경험 부족 /<br>자신감 부족 상태",
  "경력 1년 8개월 / 잦은 파견 및<br>과도한 업무로 실무경험 다량 /<br>주변인, 경영진의 평가가 좋음",
  "경력 포기 후 경험 위해 인턴 취업 /<br>자신의 역량 파악 후 자신감 더욱 상승 /<br>주변인, 경영진의 평가가 좋음",
  "고등학교 3학년 원하는 바였던<br>서양학과를 포기 후 진로 미결정",
  "디지털 미디어과 입학하였으나<br>생각과 많이 다름 / 코딩 첫 경험",
  "대학 자퇴 후 방황 중 군 입대",
  "전역 후 대학 때 첫 경험한 코딩이<br>흥미로웠다는걸 느끼고<br>코딩 공부 시작 / 퍼블리싱 아카데미 시작"
];