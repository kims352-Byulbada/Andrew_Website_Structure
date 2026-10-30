/* ============================================
   figure.js — About 오른쪽 3D 모델 (Three.js)
   - 가만히 있으면 천천히 혼자 돎
   - 마우스로 잡고 끌면 360도 아무 방향으로나 돌릴 수 있음
   - 놓으면 관성으로 조금 더 돌다가 다시 천천히 돎
   ============================================ */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ───── 바꿔 보기 좋은 값들 ───── */
const MODEL_FILE     = 'cursor.glb'; // index.html과 같은 폴더에 둘 3D 파일
const MODEL_SIZE     = 2.2;          // 화면 안에서 모델 크기
let AUTO_SPIN      = 0.004;        // 혼자 도는 속도
const DRAG_POWER     = 0.008;        // 끌 때 얼마나 많이 도는지
const INERTIA        = 0.94;         // 놓은 뒤 관성 (1에 가까울수록 오래 돎)

const box = document.querySelector('.side-figure');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;


/* 1. 장면·카메라·렌더러 — 배경은 투명 */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 0, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
box.appendChild(renderer.domElement);

// 은은한 실내 조명 느낌의 반사
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// 칸 크기에 맞춰 캔버스 크기 조절
function resize() {
  const w = box.clientWidth, h = box.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resize();
new ResizeObserver(resize).observe(box);


/* 2. 3D 파일 불러오기 */
const pivot = new THREE.Group();   // 이 그룹을 돌리면 모델이 제자리에서 돎
scene.add(pivot);

// cursor.glb가 폴더에 없으면 빈 회색 상자 대신 그 자리를 숨김
const gltf = await new GLTFLoader().loadAsync(MODEL_FILE).catch((error) => {
  box.hidden = true;
  throw error;
});
const model = gltf.scene;

// 모델 중심을 가운데로, 크기를 MODEL_SIZE에 맞춤
const bounds = new THREE.Box3().setFromObject(model);
const size = bounds.getSize(new THREE.Vector3());
const center = bounds.getCenter(new THREE.Vector3());
model.position.sub(center);
pivot.add(model);
pivot.scale.setScalar(MODEL_SIZE / Math.max(size.x, size.y, size.z));

box.classList.add('is-loaded');  // 불러오면 회색 배경 없앰 (style.css)


/* 3. 드래그로 돌리기 */
let dragging = false;
let lastX = 0, lastY = 0;
let speedX = 0, speedY = AUTO_SPIN;  // 지금 도는 속도 (x축, y축)

box.addEventListener('pointerdown', (e) => {
  dragging = true;
  lastX = e.clientX; lastY = e.clientY;
  box.setPointerCapture(e.pointerId);  // 칸 밖으로 나가도 계속 끌 수 있게
  box.classList.add('is-dragging');
});

box.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  // 마우스가 움직인 만큼 속도로 바꿈 → 좌우로 끌면 y축, 위아래로 끌면 x축 회전
  speedY = (e.clientX - lastX) * DRAG_POWER;
  speedX = (e.clientY - lastY) * DRAG_POWER;
  lastX = e.clientX; lastY = e.clientY;
});

function stopDrag() {
  dragging = false;
  box.classList.remove('is-dragging');
}
box.addEventListener('pointerup', stopDrag);
box.addEventListener('pointercancel', stopDrag);


/* 4. 매 프레임 회전 */
const spinAxisX = new THREE.Vector3(1, 0, 0);
const spinAxisY = new THREE.Vector3(0, 1, 0);

function tick() {
  if (!dragging) {
    // 놓으면 관성으로 줄어들다가 기본 회전으로 돌아옴
    speedX *= INERTIA;
    speedY = AUTO_SPIN + (speedY - AUTO_SPIN) * INERTIA;
  }
  // 화면 기준 축으로 돌려서, 어느 각도에서든 끄는 방향 그대로 돎
  pivot.rotateOnWorldAxis(spinAxisY, speedY);
  pivot.rotateOnWorldAxis(spinAxisX, speedX);
  if (dragging) { speedX *= 0.5; speedY *= 0.5; }  // 마우스를 멈추고 잡고만 있으면 멈춤

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

if (reduceMotion) {
  // 움직임 줄이기 설정: 자동 회전 없이 드래그만
  AUTO_SPIN = 0;
  speedY = 0;
}
tick();
