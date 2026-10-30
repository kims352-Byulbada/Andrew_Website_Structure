/* 홈이 아닌 페이지(작업 상세 · Work · Contact)용 스크립트
   script.js는 홈에만 있는 요소(링, 마퀴, 빈칸 등)를 찾기 때문에 여기선 쓰지 않음 */

/* 1. 시계: 뉴욕 현재 시간 (홈의 script.js 1번과 같은 코드) */
const clock = document.getElementById('clock');

function updateClock() {
  clock.textContent = new Date().toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
updateClock();
setInterval(updateClock, 10000);

/* 2. "움직임 줄이기"를 켠 사람에겐 영상이 저절로 재생되지 않게 멈춤 (재생 버튼으로는 볼 수 있음) */
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('video[autoplay]').forEach((video) => {
    video.removeAttribute('autoplay');
    video.pause();
  });
}
