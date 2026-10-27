/* ============================================
   Project 4 — script.js
   1) 헤더 시계   2) 회전하는 카드 링   3) 끊김 없는 마퀴   4) About 빈칸   5) About 스크롤   6) 위아래 흐려짐
   ============================================ */


/* ---------- 1. 시계: 10초마다 뉴욕 시간 표시 ---------- */
const clock = document.getElementById('clock');

function updateClock() {
  clock.textContent = new Date().toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}
updateClock();
setInterval(updateClock, 10000);


/* ---------- 2. 카드 링 ---------- */
const hero  = document.querySelector('.hero');
const cards = document.querySelectorAll('.card');

const BASE_SPEED = 0.0012;  // 기본 회전 속도 (클수록 빠름)
const WHEEL_PUSH = 0.00004; // 링 위에서 휠을 굴릴 때 속도가 얼마나 붙는지
const MAX_BOOST  = 0.06;    // 아무리 세게 굴려도 이 이상은 안 빨라짐
const FRICTION   = 0.94;    // 가속이 줄어드는 정도 (1에 가까울수록 오래 감)

let rotation = 0;  // 지금 원이 얼마나 돌았는지 (라디안)
let boost = 0;     // 휠로 생긴 추가 속도

// 휠 이벤트를 hero에만 걸었기 때문에, 링 밖에서 스크롤하면 아무 변화 없음
hero.addEventListener('wheel', (event) => {
  boost += event.deltaY * WHEEL_PUSH;
  // 너무 빨라지지 않게 위아래 한계를 둠
  boost = Math.max(-MAX_BOOST, Math.min(MAX_BOOST, boost));
});

// 카드들을 타원 위에 배치하는 함수
function placeCards() {
  const rx = hero.clientWidth * 0.42;  // 가로 반지름 (넓게)
  // 세로 반지름 → 타원. 폰처럼 세로로 긴 화면에서 너무 길쭉해지지 않게 제한
  const ry = Math.min(hero.clientHeight * 0.40, rx * 1.3);

  cards.forEach((card, i) => {
    // 각 카드의 각도 = 순서별 간격 + 전체 회전량
    const angle = (i / cards.length) * Math.PI * 2 + rotation;

    const x = Math.cos(angle) * rx;
    const y = Math.sin(angle) * ry;

    // 아래쪽(y가 클수록) 카드는 살짝 크게 → 입체감
    const scale = 0.92 + (Math.sin(angle) + 1) * 0.05;

    card.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  });
}

// 매 프레임(초당 약 60번) 실행되는 루프
function animate() {
  rotation += BASE_SPEED + boost;
  boost *= FRICTION;  // 휠 가속은 점점 사라지고 기본 속도로 돌아옴
  placeCards();
  requestAnimationFrame(animate);
}

// "움직임 줄이기" 설정을 켠 사람에겐 멈춘 상태로 한 번만 배치
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduceMotion) {
  placeCards();
  window.addEventListener('resize', placeCards);
} else {
  animate();
}


/* ---------- 3. 마퀴: 화면을 다 채울 만큼 목록을 복사 ---------- */
const marquee = document.querySelector('.marquee');
const track   = marquee.querySelector('.marquee-track');

function fillMarquee() {
  // 이전에 만든 복사본 지우기 (창 크기 바뀔 때 다시 계산하려고)
  marquee.querySelectorAll('.marquee-clone').forEach((el) => el.remove());

  // 원본 1개 + 복사본들의 총 너비가 "화면 너비 + 원본 1개" 이상이 될 때까지 복사
  // → 한 칸 밀려나도 오른쪽 끝이 비지 않음
  const needed = Math.ceil(marquee.clientWidth / track.offsetWidth) + 1;
  for (let i = 0; i < needed; i++) {
    const clone = track.cloneNode(true);
    clone.classList.add('marquee-clone');
    clone.setAttribute('aria-hidden', 'true');  // 스크린리더는 원본만 읽음
    marquee.appendChild(clone);
  }
}
fillMarquee();
window.addEventListener('resize', fillMarquee);


/* ---------- 4. About 빈칸: 마우스 올리면 랜덤 단어 ---------- */
const blank = document.querySelector('.blank');
const words = ['Drawing', 'Spotifying', 'Working out', 'Designing', 'Talking', 'Watching', 'Gaming'];
let lastWord = '';

function showRandomWord() {
  // 직전과 같은 단어가 연속으로 나오지 않게 다시 뽑음
  let word;
  do {
    word = words[Math.floor(Math.random() * words.length)];
  } while (word === lastWord);
  lastWord = word;

  blank.textContent = word;
  // Drawing일 때만 연필 커서 (CSS의 .is-drawing)
  blank.classList.toggle('is-drawing', word === 'Drawing');
}

function clearBlank() {
  blank.innerHTML = '&nbsp;';  // 다시 빈칸으로
  blank.classList.remove('is-drawing');
}

blank.addEventListener('mouseenter', showRandomWord);
blank.addEventListener('mouseleave', clearBlank);
// 키보드(Tab)로 와도 똑같이 동작하게
blank.addEventListener('focus', showRandomWord);
blank.addEventListener('blur', clearBlank);


/* ---------- 5. About 구간: 왼쪽 라벨 바꾸기 + 목록 진해지기 ---------- */
const pinLabel = document.querySelector('.pin-label');
const posts    = document.querySelectorAll('.about-post');
const LETTERS  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
let scrambleTimer = null;

// 글자를 무작위로 섞다가 한 글자씩 원래 단어로 맞춰지는 효과
function scrambleTo(text) {
  clearInterval(scrambleTimer);
  let frame = 0;

  scrambleTimer = setInterval(() => {
    const fixed = Math.floor(frame / 2);  // 2프레임마다 한 글자씩 확정
    let out = '';
    for (let i = 0; i < text.length; i++) {
      if (i < fixed || text[i] === ' ') {
        out += text[i];                   // 확정된 글자 / 띄어쓰기는 그대로
      } else {
        out += LETTERS[Math.floor(Math.random() * LETTERS.length)];
      }
    }
    pinLabel.textContent = out;

    frame++;
    if (fixed >= text.length) clearInterval(scrambleTimer);
  }, 30);
}

// 화면 가운데 선을 지나는 파트가 바뀌면 라벨을 그 파트 이름으로
const postObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const label = entry.target.dataset.label;
      if (pinLabel.textContent !== label) scrambleTo(label);
    }
  });
}, { rootMargin: '-50% 0px -50% 0px' });  // 화면 정가운데 한 줄만 감지

posts.forEach((post) => postObserver.observe(post));

// 목록 항목이 화면 아래쪽 25% 위로 올라오면 진하게 (한 번 진해지면 유지)
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-on');
      revealObserver.unobserve(entry.target);
    }
  });
}, { rootMargin: '0px 0px -25% 0px' });

document.querySelectorAll('.reveal-list li').forEach((li) => revealObserver.observe(li));


/* ---------- 6. About 글: 화면 위아래 끝에 가까울수록 흐려짐 ---------- */
const fadeItems = document.querySelectorAll('.about-body p, .post-row');
const FADE_ZONE = 0.22;  // 화면 위아래 몇 %에서부터 흐려지기 시작할지

function fadeEdges() {
  const vh = window.innerHeight;
  const zone = vh * FADE_ZONE;

  fadeItems.forEach((el) => {
    const r = el.getBoundingClientRect();
    const middle = r.top + r.height / 2;
    // 위쪽 끝에서의 거리, 아래쪽 끝에서의 거리 중 가까운 쪽 기준
    const distance = Math.min(middle, vh - middle);
    // zone 안이면 0~1 사이로 점점 흐리게, zone 밖이면 1(선명)
    const opacity = Math.max(0, Math.min(1, distance / zone));
    el.style.opacity = opacity;
  });
}

window.addEventListener('scroll', fadeEdges, { passive: true });
window.addEventListener('resize', fadeEdges);
fadeEdges();
