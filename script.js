/* =========================================================
   Gip's HP 동작 파일
   ========================================================= */

/* ---------- 0. 작은 도우미: 저장소 안전하게 쓰기 ----------
   온라인 저장소(cloud.js)가 연결돼 있으면 '내 기록' 이름표들은 온라인으로,
   나머지(방문자 이름, TMDB 키 등)는 지금처럼 이 브라우저에만 저장해요. */
const CLOUD = window.CLOUD && !window.CLOUD.failed ? window.CLOUD : null;
// 기록을 쓰고 고칠 수 있는 사람인지 (온라인 연결 전에는 언제나 가능)
const canEdit = () => !window.CLOUD || (CLOUD !== null && CLOUD.isOwner());
const store = {
  get(key, fallback) {
    if (CLOUD && CLOUD.syncs(key)) return CLOUD.get(key, fallback);
    try { const v = localStorage.getItem(key); return v === null ? fallback : v; }
    catch (e) { return fallback; }
  },
  set(key, value) {
    if (CLOUD && CLOUD.syncs(key)) { CLOUD.set(key, value); return; }
    if (window.CLOUD && window.CLOUD.syncs(key)) return;   // 연결 실패 중에는 쓰지 않아요
    try { localStorage.setItem(key, value); } catch (e) { /* 저장 못 해도 괜찮아요 */ }
  }
};

/* ---------- 1. 개설일과 D+ ---------- */
const OPEN_DATE = '2026-11-21'; // 개설일을 바꾸고 싶으면 여기만 수정하세요

(function setOpenDate() {
  const open = new Date(OPEN_DATE + 'T00:00:00');
  const now = new Date();
  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.floor((today0 - open) / 86400000) + 1;
  document.getElementById('openDate').textContent = OPEN_DATE.replace(/-/g, '.');
  document.getElementById('dday').textContent = Math.max(days, 1);
})();

/* ---------- 2. 방문자 수 (지금은 이 브라우저 기준으로 셉니다) ---------- */
(function countVisit() {
  const todayKey = ymd(new Date());
  let total = parseInt(store.get('gip_total', '0'), 10);
  let today = store.get('gip_today_date', '') === todayKey
    ? parseInt(store.get('gip_today', '0'), 10) : 0;

  // 새로고침할 때마다 늘어나지 않도록, 창을 새로 열었을 때만 1 증가
  let firstInSession = true;
  try { firstInSession = !sessionStorage.getItem('gip_visited'); sessionStorage.setItem('gip_visited', '1'); } catch (e) {}

  const show = (t, all) => {
    document.getElementById('todayCount').textContent = Number(t).toLocaleString();
    document.getElementById('totalCount').textContent = Number(all).toLocaleString();
  };
  // 온라인 연결: 모든 방문자를 함께 세요 (한국 날짜 기준)
  if (CLOUD) {
    document.getElementById('todayCount').textContent = '-';
    document.getElementById('totalCount').textContent = '-';
    CLOUD.hitVisit(firstInSession).then(r => show(r.today, r.total)).catch(() => {});
    return;
  }
  if (firstInSession) {
    total += 1; today += 1;
    store.set('gip_total', total);
    store.set('gip_today', today);
    store.set('gip_today_date', todayKey);
  }
  show(today, total);
})();

/* ---------- 3. 픽셀 아트 그리기 ---------- */
// 글자 지도(map)를 색깔 칸으로 바꿔서 그림을 만들어요.
function pixelSVG(map, palette) {
  const h = map.length, w = map[0].length;
  let rects = '';
  map.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (palette[ch]) rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${palette[ch]}"/>`;
    });
  });
  return `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
}

// 프로필 사진 자리의 픽셀 캐릭터
const avatarMap = [
  '................',
  '.....hhhhhh.....',
  '....hhhhhhhh....',
  '...hhhhhhhhhh...',
  '...hssssssssh...',
  '...hssssssssh...',
  '...hsessssesh...',
  '...hcssssssch...',
  '....sssmmsss....',
  '.....ssssss.....',
  '......ssss......',
  '....bbbbbbbb....',
  '...bbbbwwbbbb...',
  '..bbbbbbbbbbbb..',
  '..bbbbbbbbbbbb..',
  '..bbbbbbbbbbbb..'
];
const avatarColors = { h: '#6b5442', s: '#ffe3cc', e: '#3a2f28', c: '#f5aaa3', m: '#d9776f', b: '#8fb6dd', w: '#fffdf6' };
document.getElementById('avatar').innerHTML = pixelSVG(avatarMap, avatarColors);

// 미니룸 (작은 방 픽셀 아트)
document.getElementById('room').innerHTML = `
<svg viewBox="0 0 160 84" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="paper" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="#fbf4e6"/><rect x="0" width="3" height="8" fill="#edf3f9"/>
      <rect x="5" y="3" width="1" height="1" fill="#f4c8c2"/>
    </pattern>
    <radialGradient id="lampGlow">
      <stop offset="0" stop-color="#fff3c4" stop-opacity=".8"/>
      <stop offset=".45" stop-color="#ffe6a3" stop-opacity=".35"/>
      <stop offset="1" stop-color="#ffe6a3" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- 벽과 바닥 -->
  <rect width="160" height="58" fill="url(#paper)"/>
  <rect y="56" width="160" height="3" fill="#c9a77a"/>
  <rect y="59" width="160" height="25" fill="#dcbf95"/>
  <rect y="65" width="160" height="1" fill="#cfae80"/><rect y="72" width="160" height="1" fill="#cfae80"/><rect y="79" width="160" height="1" fill="#cfae80"/>
  <rect x="30" y="59" width="1" height="6" fill="#cfae80"/><rect x="90" y="66" width="1" height="6" fill="#cfae80"/><rect x="130" y="73" width="1" height="6" fill="#cfae80"/>

  <!-- 창문 -->
  <rect x="16" y="8" width="38" height="30" fill="#8fb6dd"/>
  <g class="day-only">
    <rect x="18" y="10" width="34" height="26" fill="#cfe3f5"/>
    <g class="clouds">
      <rect x="22" y="15" width="10" height="3" fill="#fff"/><rect x="20" y="18" width="15" height="3" fill="#fff"/>
      <rect x="38" y="25" width="8" height="2" fill="#fff"/><rect x="36" y="27" width="12" height="2" fill="#fff"/>
    </g>
  </g>
  <rect class="night-only" x="18" y="10" width="34" height="26" fill="#2e3a66"/>
  <rect x="34" y="10" width="2" height="26" fill="#8fb6dd"/><rect x="18" y="22" width="34" height="2" fill="#8fb6dd"/>
  <rect x="14" y="38" width="42" height="3" fill="#c9a77a"/>
  <!-- 커튼 -->
  <rect x="12" y="6" width="5" height="30" fill="#f4c8c2"/><rect x="53" y="6" width="5" height="30" fill="#f4c8c2"/>
  <rect x="10" y="5" width="50" height="2" fill="#b98b5e"/>

  <!-- 액자 -->
  <rect x="68" y="12" width="16" height="20" fill="#b98b5e"/><rect x="70" y="14" width="12" height="16" fill="#fffdf6"/>
  <rect x="73" y="19" width="2" height="2" fill="#e98b84"/><rect x="77" y="19" width="2" height="2" fill="#e98b84"/>
  <rect x="73" y="21" width="6" height="2" fill="#e98b84"/><rect x="74" y="23" width="4" height="1" fill="#e98b84"/><rect x="75" y="24" width="2" height="1" fill="#e98b84"/>

  <!-- 선반과 책 -->
  <rect x="98" y="24" width="42" height="3" fill="#b98b5e"/>
  <rect x="101" y="14" width="4" height="10" fill="#8fb6dd"/><rect x="105" y="16" width="4" height="8" fill="#f4c8c2"/>
  <rect x="109" y="13" width="3" height="11" fill="#e8d6a8"/><rect x="112" y="15" width="4" height="9" fill="#a8d1b4"/>
  <rect x="122" y="19" width="6" height="5" fill="#e3a57a"/><rect x="123" y="15" width="1" height="4" fill="#7fb38e"/><rect x="125" y="13" width="1" height="6" fill="#7fb38e"/><rect x="127" y="16" width="1" height="3" fill="#7fb38e"/>
  <rect x="132" y="18" width="6" height="6" fill="#fffdf6"/><rect x="134" y="19" width="2" height="2" fill="#6f9cc8"/>

  <!-- 책상과 컴퓨터 -->
  <rect x="12" y="52" width="44" height="4" fill="#b98b5e"/>
  <rect x="14" y="56" width="3" height="16" fill="#a47a50"/><rect x="51" y="56" width="3" height="16" fill="#a47a50"/>
  <rect x="20" y="38" width="20" height="14" fill="#6f9cc8"/><rect x="22" y="40" width="16" height="10" fill="#dcebf8"/>
  <rect x="24" y="42" width="8" height="1" fill="#8fb6dd"/><rect x="24" y="44" width="11" height="1" fill="#8fb6dd"/><rect x="24" y="46" width="6" height="1" fill="#8fb6dd"/>
  <rect x="28" y="52" width="4" height="1" fill="#6f9cc8"/>
  <!-- 스탠드 -->
  <rect x="45" y="42" width="8" height="4" fill="#f4c8c2"/><rect x="48" y="46" width="2" height="5" fill="#a47a50"/><rect x="46" y="51" width="6" height="1" fill="#a47a50"/>
  <rect x="44" y="46" width="10" height="1" fill="#fff3c4"/>

  <!-- 화분 -->
  <rect x="62" y="44" width="2" height="8" fill="#7fb38e"/><rect x="58" y="46" width="4" height="3" fill="#a8d1b4"/>
  <rect x="64" y="42" width="5" height="3" fill="#a8d1b4"/><rect x="59" y="40" width="4" height="3" fill="#7fb38e"/>
  <rect x="59" y="52" width="9" height="8" fill="#e3a57a"/><rect x="58" y="51" width="11" height="2" fill="#d4936a"/>

  <!-- 침대 -->
  <rect x="104" y="40" width="5" height="30" fill="#b98b5e"/>
  <rect x="108" y="54" width="46" height="10" fill="#fffdf6"/>
  <rect x="110" y="50" width="12" height="6" fill="#ffffff"/><rect x="110" y="55" width="12" height="1" fill="#e2d4ba"/>
  <rect x="122" y="52" width="32" height="12" fill="#aecbe8"/>
  <rect x="122" y="56" width="32" height="1" fill="#8fb6dd"/><rect x="122" y="60" width="32" height="1" fill="#8fb6dd"/>
  <rect x="108" y="64" width="46" height="3" fill="#a47a50"/><rect x="150" y="64" width="3" height="7" fill="#a47a50"/>

  <!-- 러그와 고양이 -->
  <rect x="64" y="70" width="34" height="8" fill="#f4c8c2"/>
  <rect x="66" y="72" width="30" height="1" fill="#fbe3df"/><rect x="66" y="75" width="30" height="1" fill="#fbe3df"/>
  <g class="room-cat" id="roomCat">
    <rect x="74" y="66" width="12" height="5" fill="#8d7e6f"/><rect x="84" y="64" width="5" height="6" fill="#8d7e6f"/>
    <rect x="84" y="63" width="1" height="1" fill="#8d7e6f"/><rect x="88" y="63" width="1" height="1" fill="#8d7e6f"/>
    <g class="cat-eyes-open"><rect x="85" y="66" width="1" height="1" fill="#3a2f28"/><rect x="87" y="66" width="1" height="1" fill="#3a2f28"/></g>
    <g class="cat-eyes-closed"><rect x="85" y="66.6" width="1" height=".4" fill="#3a2f28"/><rect x="87" y="66.6" width="1" height=".4" fill="#3a2f28"/></g>
    <rect x="71" y="69" width="4" height="2" fill="#8d7e6f" class="cat-tail"/>
  </g>
  <g class="zzz">
    <rect x="90" y="60" width="1" height="1" fill="#6f9cc8"/><rect x="92" y="58" width="2" height="1" fill="#6f9cc8"/><rect x="95" y="55" width="3" height="1" fill="#6f9cc8"/>
  </g>

  <!-- 밤: 방이 어두워지고, 스탠드·모니터·달·별만 빛나요 -->
  <rect class="night-only" width="160" height="84" fill="#1b2340" fill-opacity=".45"/>
  <g class="night-only">
    <circle cx="49" cy="47" r="24" fill="url(#lampGlow)"/>
    <rect x="45" y="42" width="8" height="4" fill="#ffd9a8"/><rect x="44" y="46" width="10" height="1" fill="#fff8d6"/>
    <rect x="22" y="40" width="16" height="10" fill="#e3f1ff" fill-opacity=".9"/>
    <rect x="24" y="42" width="8" height="1" fill="#8fb6dd"/><rect x="24" y="44" width="11" height="1" fill="#8fb6dd"/><rect x="24" y="46" width="6" height="1" fill="#8fb6dd"/>
    <rect x="23" y="12" width="4" height="1" fill="#fff3c4"/><rect x="22" y="13" width="6" height="4" fill="#fff3c4"/><rect x="23" y="17" width="4" height="1" fill="#fff3c4"/>
    <rect x="24" y="14" width="1" height="1" fill="#efd98f"/><rect x="26" y="15" width="1" height="1" fill="#efd98f"/>
    <rect class="star" x="31" y="13" width="1" height="1" fill="#fff"/><rect class="star s2" x="44" y="12" width="1" height="1" fill="#fff"/>
    <rect class="star s3" x="48" y="17" width="1" height="1" fill="#fff"/><rect class="star s2" x="40" y="15" width="1" height="1" fill="#fff"/>
    <rect class="star s3" x="21" y="30" width="1" height="1" fill="#fff"/><rect class="star" x="46" y="29" width="1" height="1" fill="#fff"/>
    <rect class="star s2" x="28" y="26" width="1" height="1" fill="#fff"/><rect class="star s3" x="39" y="33" width="1" height="1" fill="#fff"/>
  </g>

  <!-- 누를 수 있는 곳 (보이지 않는 칸) -->
  <rect class="hit" id="hitWindow" x="10" y="4" width="50" height="34" fill="#000" fill-opacity="0" tabindex="0" role="button" aria-label="창문"/>
  <rect class="hit" id="hitLamp" x="42" y="40" width="14" height="13" fill="#000" fill-opacity="0" tabindex="0" role="button" aria-label="스탠드"/>
  <rect class="hit" id="hitCat" x="68" y="58" width="24" height="15" fill="#000" fill-opacity="0" tabindex="0" role="button" aria-label="고양이"/>
</svg>`;

/* ---------- 3-2. 미니룸 놀이: 고양이 말풍선 + 낮/밤 ----------
   처음에는 접속한 시간(저녁 7시 ~ 아침 6시는 밤)에 맞추고,
   창문이나 버튼을 누르면 직접 바꿀 수 있어요 (이번 접속 동안 기억해요). */
const room = document.getElementById('room');
const roomBubble = document.createElement('p');
roomBubble.className = 'room-bubble';
roomBubble.setAttribute('aria-live', 'polite');
roomBubble.hidden = true;
room.appendChild(roomBubble);

const isNightHour = () => { const h = new Date().getHours(); return h >= 19 || h < 6; };
let themeManual = null;
try { themeManual = sessionStorage.getItem('gip_theme'); } catch (e) {}

function applyTheme(night) {
  document.documentElement.dataset.theme = night ? 'night' : 'day';
  document.getElementById('roomCaption').textContent = night
    ? '창밖엔 달과 별, 스탠드 불빛 아래 잠든 고양이 🌙'
    : '창밖엔 구름, 방 안엔 잠든 고양이 한 마리 🐈';
}
// from: 'window'(창문) 또는 'lamp'(스탠드) — 누른 곳에 따라 말풍선이 조금 달라요
function toggleTheme(from) {
  const night = document.documentElement.dataset.theme !== 'night';
  themeManual = night ? 'night' : 'day';
  try { sessionStorage.setItem('gip_theme', themeManual); } catch (e) {}
  applyTheme(night);
  if (from === 'lamp') sayInRoom(night ? '💡 딸깍! 스탠드를 켰어요' : '💡 딸깍, 스탠드를 끄고 아침이에요');
  else sayInRoom(night ? '🌙 커튼 너머로 밤이 왔어요' : '☀ 커튼을 활짝 열었어요');
}
applyTheme(themeManual ? themeManual === 'night' : isNightHour());
// 직접 고르지 않았으면, 시간이 지나 밤/낮이 바뀔 때 저절로 따라가요
setInterval(() => { if (!themeManual) applyTheme(isNightHour()); }, 5 * 60 * 1000);

let bubbleTimer = null;
function sayInRoom(text, atCat) {
  roomBubble.textContent = text;
  roomBubble.classList.toggle('at-cat', !!atCat);
  roomBubble.hidden = false;
  roomBubble.classList.remove('pop'); void roomBubble.offsetWidth; roomBubble.classList.add('pop');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => { roomBubble.hidden = true; }, 2600);
}

// awake: true면 눈을 뜨고 깨어나요, false면 잠꼬대만 하고 계속 자요
const CAT_DAY = [
  { t: '야옹~ 🐾', awake: true }, { t: '골골골…', awake: false }, { t: '냥? 왜 불렀어?', awake: true },
  { t: 'Zzz… (다시 잠듦)', awake: false }, { t: '츄르 주세요 🐟', awake: true }, { t: '쭈욱~ 기지개', awake: true }
];
const CAT_NIGHT = [
  { t: 'Zzz…', awake: false }, { t: '(쿨쿨) 음냐…', awake: false }, { t: '야옹… 불 꺼 줘', awake: true },
  { t: 'Zzz… 꿈속에서 생선 🐟', awake: false }, { t: '…(귀만 쫑긋)', awake: false },
  { t: '(실눈) …뭐야, 밤이잖아', awake: true }, { t: '하암~ 🥱', awake: true }
];
let catPats = 0, catPatTimer = null, catSleepTimer = null;

// 고양이 깨우기 / 재우기 (깨어 있으면 눈을 뜨고 Zzz가 사라져요)
function setCatAwake(awake) {
  room.classList.toggle('cat-awake', awake);
  clearTimeout(catSleepTimer);
  if (awake) catSleepTimer = setTimeout(() => room.classList.remove('cat-awake'), 3200);   // 조금 있다 다시 스르륵
}
function patCat() {
  catPats++;
  clearTimeout(catPatTimer);
  catPatTimer = setTimeout(() => { catPats = 0; }, 4000);   // 4초 동안 안 누르면 다시 처음부터
  const cat = document.getElementById('roomCat');
  cat.classList.remove('hop'); void cat.getBoundingClientRect(); cat.classList.add('hop');
  if (catPats >= 6) { setCatAwake(true); sayInRoom('그만 만져! 😾 하악', true); catPats = 0; return; }
  const list = document.documentElement.dataset.theme === 'night' ? CAT_NIGHT : CAT_DAY;
  // 이미 깨어 있으면 잠꼬대 말고 깨어 있는 대사 중에서 골라요 (방금 한 말은 빼고)
  const pool = (room.classList.contains('cat-awake') ? list.filter(m => m.awake) : list)
    .filter(m => m.t !== roomBubble.textContent || roomBubble.hidden);
  const pick = pool[Math.floor(Math.random() * pool.length)];
  setCatAwake(pick.awake);
  sayInRoom(pick.t, true);
}

// 누를 수 있는 곳: 마우스·손가락으로 누르거나, Tab으로 골라 Enter/스페이스
function onRoomPress(id, action) {
  const el = document.getElementById(id);
  el.addEventListener('click', action);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); action(); }
  });
}
onRoomPress('hitCat', patCat);
onRoomPress('hitWindow', () => toggleTheme('window'));
onRoomPress('hitLamp', () => toggleTheme('lamp'));

/* ---------- 4. 오늘의 기분 ---------- */
const moods = ['😊 행복', '🌤 맑음', '😌 평온', '🥱 졸림', '💭 생각 중', '🔥 열정', '🥲 꿀꿀', '🌧 우울'];
let moodIndex = parseInt(store.get('gip_mood', '0'), 10) || 0;
const moodValue = document.getElementById('moodValue');
function showMood() {
  moodValue.textContent = moods[moodIndex];
  store.set('gip_mood', moodIndex);
}
document.getElementById('moodPrev').addEventListener('click', () => { if (!canEdit()) return; moodIndex = (moodIndex - 1 + moods.length) % moods.length; showMood(); });
document.getElementById('moodNext').addEventListener('click', () => { if (!canEdit()) return; moodIndex = (moodIndex + 1) % moods.length; showMood(); });
showMood();

/* ---------- 5. 오늘의 한마디 (✎ 버튼으로 수정) ---------- */
const wordText = document.getElementById('wordText');
const editBtn = document.getElementById('editWord');
wordText.textContent = store.get('gip_word', wordText.textContent);

function finishEdit() {
  wordText.contentEditable = 'false';
  editBtn.textContent = '✎';
  const text = wordText.textContent.trim() || '천천히, 그래도 꾸준히 🌱';
  wordText.textContent = text;
  store.set('gip_word', text);
}
editBtn.addEventListener('click', () => {
  if (!canEdit()) return;
  if (wordText.isContentEditable) { finishEdit(); return; }
  wordText.contentEditable = 'true';
  editBtn.textContent = '✔';
  wordText.focus();
  document.getSelection().selectAllChildren(wordText);
});
wordText.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); finishEdit(); } });
wordText.addEventListener('blur', () => { if (wordText.isContentEditable) finishEdit(); });

/* ---------- 6. 메뉴 전환 ---------- */
const homePanel = document.getElementById('homePanel');
const diaryPanel = document.getElementById('diaryPanel');
const moviePanel = document.getElementById('moviePanel');
const bookPanel = document.getElementById('bookPanel');
const travelPanel = document.getElementById('travelPanel');
const photoPanel = document.getElementById('photoPanel');
const guestPanel = document.getElementById('guestPanel');

// 메뉴 화면 목록 (새 메뉴를 만들면 여기에 추가해요)
const panels = { home: homePanel, diary: diaryPanel, movie: moviePanel, book: bookPanel, travel: travelPanel, photo: photoPanel, guest: guestPanel };
const isMobile = () => window.matchMedia('(max-width: 860px)').matches;

function go(name) {
  document.querySelectorAll('.tab').forEach(t => {
    const on = t.dataset.go === name;
    t.classList.toggle('active', on);
    if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  });
  Object.entries(panels).forEach(([key, panel]) => { panel.hidden = key !== name; });
  if (name === 'diary') renderDiary();
  if (name === 'movie') renderMovies();
  if (name === 'book') renderBooks();
  if (name === 'travel') renderTravel();
  if (name === 'photo') renderPhotos();
  if (name === 'guest') renderGuest();
}
document.querySelectorAll('[data-go]').forEach(el => el.addEventListener('click', () => {
  go(el.dataset.go);
  // 모바일: 가로 메뉴에서 고른 탭이 보이게 밀고, 내용이 있는 곳으로 화면을 옮겨요
  if (isMobile()) {
    const tab = document.querySelector(`.tab[data-go="${el.dataset.go}"]`);
    const tabs = document.querySelector('.tabs');
    if (tab) tabs.scrollTo({ left: tab.offsetLeft - (tabs.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
    const content = document.querySelector('.content');
    if (content.getBoundingClientRect().top < 0 || el.closest('.tabs')) content.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}));

/* ---------- 7. 배경음악 플레이어 ----------
   음악 파일 없이, 브라우저가 직접 오르골 같은 8비트 멜로디를 연주해요. */
const tracks = [
  { title: '01. 오후 세 시의 햇살', bpm: 92,
    notes: [72,0,76,79,76,0,74,72, 69,0,72,76,74,0,72,69, 65,69,72,77,76,74,72,0, 71,0,74,79,77,76,74,0],
    bass: [48, 45, 41, 43] },
  { title: '02. 창밖에 비가 내리면', bpm: 76,
    notes: [69,72,76,72,69,72,76,79, 77,76,72,69,65,69,72,0, 67,72,76,72,79,76,72,67, 68,71,76,71,74,71,68,0],
    bass: [45, 41, 48, 40] },
  { title: '03. 별빛 우체통', bpm: 100,
    notes: [77,81,84,81,77,81,84,89, 86,84,81,77,74,77,81,0, 82,77,74,77,82,86,89,86, 84,0,79,76,72,0,0,0],
    bass: [41, 38, 46, 48] },
  { title: '04. 한밤의 스탠드', bpm: 66,
    notes: [64,0,67,72,71,0,67,64, 65,0,69,72,71,69,67,0, 64,67,72,76,74,72,71,67, 69,0,67,65,64,0,0,0],
    bass: [48, 41, 45, 43] },
  { title: '05. 고양이 낮잠', bpm: 108,
    notes: [67,71,74,71,67,0,74,79, 78,76,74,0,71,74,76,0, 72,76,79,76,72,0,79,84, 83,81,79,78,79,0,0,0],
    bass: [43, 40, 36, 38] }
];
// 내가 넣은 음악 파일들 (창고에서 불러와요) — [{ id, title, blob }]
let myMusic = [];
const playlist = () => [
  ...tracks.map(t => ({ kind: 'synth', title: t.title, t })),
  ...myMusic.map((m, i) => ({ kind: 'file', title: `${String(tracks.length + i + 1).padStart(2, '0')}. ${m.title}`, m }))
];

let audioCtx = null, master = null, timer = null;
let current = 0, step = 0, nextTime = 0, playing = false, startedAt = 0;

const bgm = document.getElementById('bgm');
const playBtn = document.getElementById('playBtn');
const trackTitle = document.getElementById('trackTitle');
const progressFill = document.getElementById('progressFill');
const timeEl = document.getElementById('time');
const volume = document.getElementById('volume');

function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

function playNote(midi, time, dur, type, vol) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = midiToFreq(midi);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(vol, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  osc.connect(gain).connect(master);
  osc.start(time);
  osc.stop(time + dur + 0.05);
}

function scheduler() {
  const t = tracks[current];
  const eighth = 60 / t.bpm / 2;
  while (nextTime < audioCtx.currentTime + 0.15) {
    const n = t.notes[step % t.notes.length];
    if (n) playNote(n, nextTime, eighth * 1.8, 'triangle', 0.14);
    if (step % 8 === 0) playNote(t.bass[(step / 8) % t.bass.length], nextTime, eighth * 7.5, 'sine', 0.12);
    nextTime += eighth;
    step++;
  }
  // 진행 막대와 시간 표시
  const loopLen = t.notes.length * eighth;
  const elapsed = audioCtx.currentTime - startedAt;
  progressFill.style.width = ((elapsed % loopLen) / loopLen * 100) + '%';
  const s = Math.floor(elapsed);
  timeEl.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

// 음악 파일은 브라우저의 기본 재생기(Audio)로 틀어요
const bgmAudio = new Audio();
bgmAudio.preload = 'auto';
const fmtTime = (sec) => { const s = Math.floor(sec || 0); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };

function startSynth(t) {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    master = audioCtx.createGain();
    master.connect(audioCtx.destination);
  }
  audioCtx.resume();
  master.gain.value = volume.value / 100 * 0.8;
  step = 0;
  nextTime = audioCtx.currentTime + 0.05;
  startedAt = nextTime;
  clearInterval(timer);
  timer = setInterval(scheduler, 40);
}

function start() {
  const item = playlist()[current];
  clearInterval(timer);
  if (item.kind === 'file') {
    if (!item.m.url) item.m.url = URL.createObjectURL(item.m.blob);
    if (bgmAudio.src !== item.m.url) bgmAudio.src = item.m.url;   // 같은 곡이면 멈춘 곳부터 이어서
    bgmAudio.volume = volume.value / 100;
    bgmAudio.play().catch((e) => {
      stop();
      // 브라우저가 '사람이 누르기 전 자동재생'을 막은 경우와, 파일 자체를 못 읽는 경우를 나눠서 알려요
      trackTitle.textContent = e && e.name === 'NotAllowedError'
        ? `${item.title} — ▶ 버튼을 눌러 재생해 주세요`
        : '⚠ 이 파일은 재생할 수 없어요 (mp3로 다시 넣어 주세요)';
    });
  } else {
    bgmAudio.pause();
    startSynth(item.t);
  }
  playing = true;
  bgm.classList.add('playing');
  playBtn.textContent = '❚❚';
  playBtn.setAttribute('aria-label', '일시정지');
}

function stop() {
  clearInterval(timer);
  bgmAudio.pause();
  playing = false;
  bgm.classList.remove('playing');
  playBtn.textContent = '▶';
  playBtn.setAttribute('aria-label', '재생');
}

const trackSelect = document.getElementById('trackSelect');
const musicDelBtn = document.getElementById('musicDelBtn');

// 곡 고르기 목록 다시 만들기
function renderTrackOptions() {
  const list = playlist();
  if (current >= list.length) current = 0;
  trackSelect.innerHTML = '';
  list.forEach((item, i) => {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = (item.kind === 'file' ? '🎵 ' : '♪ ') + item.title;
    trackSelect.appendChild(o);
  });
  trackSelect.value = current;
  trackTitle.textContent = list[current].title;
  musicDelBtn.hidden = list[current].kind !== 'file';
}

function selectTrack(index) {
  const list = playlist();
  current = (index + list.length) % list.length;
  trackSelect.value = current;
  trackTitle.textContent = list[current].title;
  musicDelBtn.hidden = list[current].kind !== 'file';
  progressFill.style.width = '0%';
  timeEl.textContent = '00:00';
  if (list[current].kind === 'file' && list[current].m.url && bgmAudio.src === list[current].m.url) bgmAudio.currentTime = 0;  // 다시 고르면 처음부터
  if (playing) start();
}
function changeTrack(dir) { selectTrack(current + dir); }

// 음악 파일이 끝나면 다음 곡으로, 재생 중에는 진행 막대를 움직여요
bgmAudio.addEventListener('ended', () => changeTrack(1));
bgmAudio.addEventListener('timeupdate', () => {
  if (playlist()[current].kind !== 'file') return;
  const d = bgmAudio.duration;
  progressFill.style.width = d ? (bgmAudio.currentTime / d * 100) + '%' : '0%';
  timeEl.textContent = fmtTime(bgmAudio.currentTime);
});

playBtn.addEventListener('click', () => (playing ? stop() : start()));
document.getElementById('prevBtn').addEventListener('click', () => changeTrack(-1));
document.getElementById('nextBtn').addEventListener('click', () => changeTrack(1));
trackSelect.addEventListener('change', () => selectTrack(+trackSelect.value));
volume.addEventListener('input', () => {
  if (master) master.gain.value = volume.value / 100 * 0.8;
  bgmAudio.volume = volume.value / 100;
});
renderTrackOptions();

/* =========================================================
   8. DIARY (다이어리)
   일기는 이 브라우저 안에 'gip_diary'라는 이름으로 저장돼요.
   ========================================================= */

// 날짜를 '2026-11-21' 모양의 글자로 바꿔 주는 도우미 (한국 시간 기준)
function ymd(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

// 저장된 일기 불러오기 (처음이면 첫 일기 하나를 넣어 둬요)
function loadDiary() {
  try {
    const raw = store.get('gip_diary', null);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [{
    id: 1, date: OPEN_DATE, mood: '😊 행복',
    title: '미니홈피 문을 열었어요!',
    body: '오늘 나만의 작은 방을 만들었다.\n좋아하는 것들을 하나씩 채워 나가야지.'
  }];
}
let diary = loadDiary();
function saveDiary() { store.set('gip_diary', JSON.stringify(diary)); }

let calY = new Date().getFullYear();
let calM = new Date().getMonth();   // 0 = 1월
let selectedDate = null;             // 달력에서 고른 날짜
let editingId = null;                // 수정 중인 일기 번호
const DIARY_PER_PAGE = 5;            // 한 페이지에 보여줄 일기 수 (바꾸고 싶으면 여기 숫자만 고치세요)
let diaryPage = 1;                   // 지금 보고 있는 페이지

/* 페이지 번호(◀ 1 2 3 ▶)를 만들어 주는 도우미 — 다른 메뉴에서도 다시 쓸 수 있어요 */
function renderPager(nav, page, totalPages, onChange) {
  nav.innerHTML = '';
  nav.hidden = totalPages <= 1;
  if (totalPages <= 1) return;

  const addBtn = (label, target, opts = {}) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pager-btn' + (opts.current ? ' current' : '');
    b.textContent = label;
    if (opts.aria) b.setAttribute('aria-label', opts.aria);
    if (opts.current) b.setAttribute('aria-current', 'page');
    b.disabled = !!opts.disabled;
    b.addEventListener('click', () => onChange(target));
    nav.appendChild(b);
  };

  // 번호는 최대 5개만, 지금 페이지가 가운데 오도록
  let from = Math.max(1, page - 2);
  let to = Math.min(totalPages, from + 4);
  from = Math.max(1, to - 4);

  addBtn('◀', page - 1, { disabled: page === 1, aria: '이전 페이지' });
  for (let p = from; p <= to; p++) addBtn(String(p), p, { current: p === page, aria: p + '페이지' });
  addBtn('▶', page + 1, { disabled: page === totalPages, aria: '다음 페이지' });
}

const calTitle = document.getElementById('calTitle');
const calGrid = document.getElementById('calGrid');
const diaryList = document.getElementById('diaryList');
const diaryFilter = document.getElementById('diaryFilter');
const diaryPager = document.getElementById('diaryPager');
const diaryForm = document.getElementById('diaryForm');
const writeBtn = document.getElementById('writeBtn');
const fDate = document.getElementById('fDate');
const fMood = document.getElementById('fMood');
const fTitle = document.getElementById('fTitle');
const fBody = document.getElementById('fBody');

// 기분 선택 목록은 프로필의 기분 목록을 그대로 써요
moods.forEach(m => { const o = document.createElement('option'); o.value = o.textContent = m; fMood.appendChild(o); });

function sortedDiary() {
  return [...diary].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

/* 달력 그리기 */
function renderCalendar() {
  calTitle.textContent = calY + '.' + String(calM + 1).padStart(2, '0');
  calGrid.innerHTML = '';
  const firstDay = new Date(calY, calM, 1).getDay();
  const lastDate = new Date(calY, calM + 1, 0).getDate();
  const written = new Set(diary.map(e => e.date));
  const todayStr = ymd(new Date());

  for (let i = 0; i < firstDay; i++) calGrid.appendChild(document.createElement('span'));
  for (let d = 1; d <= lastDate; d++) {
    const key = ymd(new Date(calY, calM, d));
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cal-day';
    btn.textContent = d;
    if (written.has(key)) btn.classList.add('has');
    if (key === todayStr) btn.classList.add('today');
    if (key === selectedDate) btn.classList.add('selected');
    btn.addEventListener('click', () => {
      selectedDate = (selectedDate === key) ? null : key;
      diaryPage = 1;
      renderDiary();
    });
    calGrid.appendChild(btn);
  }
}

/* 일기 목록 그리기 */
function renderList() {
  let list = sortedDiary();
  if (selectedDate) list = list.filter(e => e.date === selectedDate);

  diaryFilter.hidden = !selectedDate;
  if (selectedDate) diaryFilter.textContent = `📅 ${selectedDate.replace(/-/g, '.')} 의 일기 · ${list.length}개`;

  diaryList.innerHTML = '';
  if (list.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'diary-empty';
    empty.textContent = selectedDate ? '이 날은 아직 일기가 없어요. ✎ 일기 쓰기를 눌러 보세요!' : '아직 일기가 없어요.';
    diaryList.appendChild(empty);
    renderPager(diaryPager, 1, 0);
    return;
  }

  // 지금 페이지에 해당하는 일기만 골라요
  const totalPages = Math.ceil(list.length / DIARY_PER_PAGE);
  diaryPage = Math.min(Math.max(diaryPage, 1), totalPages);
  const pageItems = list.slice((diaryPage - 1) * DIARY_PER_PAGE, diaryPage * DIARY_PER_PAGE);

  renderPager(diaryPager, diaryPage, totalPages, (p) => {
    diaryPage = p;
    renderList();
    // 목록 맨 위가 화면 위로 올라가 있으면 다시 보이게 스크롤
    if (diaryList.getBoundingClientRect().top < 0) diaryList.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  pageItems.forEach(entry => {
    const li = document.createElement('li');
    li.className = 'diary-item';
    li.innerHTML = `
      <div class="diary-meta"><span class="diary-date"></span><span class="diary-mood"></span></div>
      <h4 class="diary-title"></h4>
      <p class="diary-body"></p>
      <div class="diary-actions">
        <button type="button" class="mini-btn" data-act="edit">수정</button>
        <button type="button" class="mini-btn" data-act="del">삭제</button>
      </div>`;
    // 글 내용은 textContent로 넣어서, 혹시 특수기호를 써도 화면이 깨지지 않게 해요
    const day = WEEK[new Date(entry.date + 'T00:00:00').getDay()];
    li.querySelector('.diary-date').textContent = `${entry.date.replace(/-/g, '.')} (${day})`;
    li.querySelector('.diary-mood').textContent = entry.mood;
    li.querySelector('.diary-title').textContent = entry.title;
    li.querySelector('.diary-body').textContent = entry.body;

    li.querySelector('[data-act="edit"]').addEventListener('click', () => openForm(entry));
    li.querySelector('[data-act="del"]').addEventListener('click', () => {
      if (!confirm('이 일기를 지울까요? 지운 일기는 되돌릴 수 없어요.')) return;
      diary = diary.filter(e => e.id !== entry.id);
      saveDiary();
      renderDiary();
      updateHomeDiary();
    });
    diaryList.appendChild(li);

    // 내용이 칸보다 길면 '스크롤해 읽어요' 안내를 붙여요
    const bodyEl = li.querySelector('.diary-body');
    if (bodyEl.scrollHeight > bodyEl.clientHeight + 2) li.classList.add('is-long');
  });
}

function renderDiary() { renderCalendar(); renderList(); }

/* 일기 쓰기 칸 열기/닫기 */
function openForm(entry) {
  editingId = entry ? entry.id : null;
  document.getElementById('formTitle').textContent = entry ? '일기 고치기' : '새 일기';
  fDate.value = entry ? entry.date : (selectedDate || ymd(new Date()));
  fMood.value = entry ? entry.mood : moods[moodIndex];
  fTitle.value = entry ? entry.title : '';
  fBody.value = entry ? entry.body : '';
  diaryForm.hidden = false;
  writeBtn.hidden = true;
  fTitle.focus();
}
function closeForm() {
  diaryForm.hidden = true;
  writeBtn.hidden = false;
  editingId = null;
}

writeBtn.addEventListener('click', () => openForm(null));
document.getElementById('cancelBtn').addEventListener('click', closeForm);

diaryForm.addEventListener('submit', (e) => {
  e.preventDefault(); // 페이지가 새로고침되지 않게 막아요
  const data = { date: fDate.value, mood: fMood.value, title: fTitle.value.trim(), body: fBody.value.trim() };
  if (!data.date || !data.title || !data.body) return;

  const savedId = editingId || Date.now();
  if (editingId) {
    diary = diary.map(item => item.id === editingId ? { ...item, ...data } : item);
  } else {
    diary.push({ id: savedId, ...data });
  }
  saveDiary();
  // 방금 저장한 일기가 있는 페이지로 이동
  diaryPage = Math.floor(sortedDiary().findIndex(e => e.id === savedId) / DIARY_PER_PAGE) + 1;

  // 저장한 날짜가 있는 달로 달력을 옮겨요
  const d = new Date(data.date + 'T00:00:00');
  calY = d.getFullYear(); calM = d.getMonth();
  selectedDate = null;
  closeForm();
  renderDiary();
  updateHomeDiary();
});

/* 달력 넘기기 */
document.getElementById('calPrev').addEventListener('click', () => {
  calM--; if (calM < 0) { calM = 11; calY--; }
  renderCalendar();
});
document.getElementById('calNext').addEventListener('click', () => {
  calM++; if (calM > 11) { calM = 0; calY++; }
  renderCalendar();
});
document.getElementById('calAll').addEventListener('click', () => { selectedDate = null; diaryPage = 1; renderDiary(); });

/* HOME 화면에 최신 일기 반영 */
function updateHomeDiary() {
  const latest = sortedDiary()[0];
  document.getElementById('diaryCount').textContent = diary.length;
  document.getElementById('newsDiaryTitle').textContent = latest ? latest.title : '아직 일기가 없어요';
  document.getElementById('newsDiaryDate').textContent = latest ? latest.date.slice(5).replace('-', '.') : '';
  // 최근 3일 안에 쓴 일기가 있으면 N 표시
  const recent = latest && (new Date() - new Date(latest.date + 'T00:00:00')) < 3 * 86400000;
  document.getElementById('diaryNew').hidden = !recent;
}
updateHomeDiary();

/* HOME 화면의 게시판 칸을 채워 주는 공용 도우미 (MOVIE, PHOTO에서 사용) */
function setHomeBoard(kind, count, title, date, isNew) {
  const K = kind[0].toUpperCase() + kind.slice(1);
  document.getElementById(kind + 'Count').textContent = count;
  document.getElementById('news' + K + 'Title').textContent = title;
  document.getElementById('news' + K + 'Date').textContent = date ? date.slice(5).replace('-', '.') : '';
  document.getElementById(kind + 'New').hidden = !isNew;
}
// 3일 안에 새로 올린 것인지 확인 (id에는 만든 시각이 들어 있어요)
const isRecent = (ms) => Date.now() - ms < 3 * 86400000;

function loadJSON(key, fallback) {
  try { const raw = store.get(key, null); if (raw) return JSON.parse(raw); } catch (e) {}
  return fallback;
}

/* =========================================================
   9. MOVIE (영화 기록)
   'gip_movie'라는 이름으로 이 브라우저에 저장돼요.
   ========================================================= */
// 장르별 티켓 색깔 (새 장르를 넣고 싶으면 '이름': '색깔' 을 한 줄 추가하면 돼요)
const GENRES = {
  '드라마': '#e9a6a0', '멜로': '#f0a9b8', '로맨스': '#eeb3c4', '로맨틱코미디': '#f2b59a',
  '코미디': '#e8be78', '블랙코미디': '#8f8aa8', '가족': '#f0c98a', '성장': '#a6cfa0',
  '액션': '#e09a7c', '어드벤처': '#9fc5a0', '범죄': '#a08f86', '스릴러': '#9f92bd',
  '미스터리': '#8e9cc0', '공포': '#7d7290', 'SF': '#8fb6dd', '판타지': '#b7a3d6',
  '애니메이션': '#93c6a3', '뮤지컬': '#e7a5c8', '음악': '#d9a7c7', '전쟁': '#9aa58a',
  '역사': '#c2ad86', '전기': '#b9a07f', '서부': '#c99b6d', '스포츠': '#8fc1c9',
  '다큐': '#a8b89a', '독립영화': '#b0a6c4', '단편': '#c4b8a8', '기타': '#b3a89a'
};
const GENRE_MAX = 3;
// 예전 기록(장르 하나)도 새 방식(장르 여러 개)으로 읽어요
const genresOf = (m) => (m.genres && m.genres.length) ? m.genres : [m.genre || '기타'];

let movies = loadJSON('gip_movie', []);
function saveMovies() { store.set('gip_movie', JSON.stringify(movies)); }

let movieSort = 'date';
let movieEditingId = null;
let movieStar = 4;

const movieForm = document.getElementById('movieForm');
const movieList = document.getElementById('movieList');
const movieAddBtn = document.getElementById('movieAddBtn');
const mTitle = document.getElementById('mTitle');
const mDate = document.getElementById('mDate');
const mReview = document.getElementById('mReview');
const mEssay = document.getElementById('mEssay');
const genreBox = document.getElementById('mGenres');
const genreHint = document.getElementById('genreHint');
const GENRE_HINT = '최대 3개 · 처음 고른 장르 색이 티켓 색이 돼요';
const mLink = document.getElementById('mLink');
const mDirector = document.getElementById('mDirector');
const mActors = document.getElementById('mActors');
const mPlace = document.getElementById('mPlace');
const starPick = document.getElementById('starPick');
const starValue = document.getElementById('starValue');

/* 장르 고르기: 이름표 버튼을 눌러 켜고 꺼요 (최대 3개) */
let movieGenres = [];
Object.keys(GENRES).forEach(g => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'genre-chip';
  b.textContent = g;
  b.dataset.g = g;
  b.style.setProperty('--gc', GENRES[g]);
  b.addEventListener('click', () => toggleGenre(g));
  genreBox.appendChild(b);
});
function setGenres(list) {
  movieGenres = list.filter(g => GENRES[g]).slice(0, GENRE_MAX);
  genreBox.querySelectorAll('.genre-chip').forEach(b => {
    const i = movieGenres.indexOf(b.dataset.g);
    b.classList.toggle('on', i >= 0);
    b.classList.toggle('main', i === 0);   // 처음 고른 장르 = 티켓 색
    b.setAttribute('aria-pressed', i >= 0);
  });
  genreHint.textContent = GENRE_HINT;
  genreHint.classList.remove('warn');
}
function toggleGenre(g) {
  if (movieGenres.includes(g)) return setGenres(movieGenres.filter(x => x !== g));
  if (movieGenres.length >= GENRE_MAX) {
    genreHint.textContent = `장르는 ${GENRE_MAX}개까지 고를 수 있어요. 하나를 먼저 꺼 주세요!`;
    genreHint.classList.add('warn');
    return;
  }
  setGenres([...movieGenres, g]);
}

/* 별 하나 그리기: fill(0~1)만큼 왼쪽부터 노랗게 칠해요 (0.5면 반 개) */
function makeStar(fill) {
  const s = document.createElement('span');
  s.className = 'star';
  s.innerHTML = '<span class="star-bg">★</span><span class="star-fill">★</span>';
  s.querySelector('.star-fill').style.width = (fill * 100) + '%';
  return s;
}
/* 별 5개 한 줄 그리기 (예: 3.5 → ★★★½☆) */
function starRow(value) {
  const row = document.createElement('span');
  row.className = 'stars-vis';
  for (let i = 0; i < 5; i++) row.appendChild(makeStar(Math.max(0, Math.min(1, value - i))));
  return row;
}

/* 별점 고르기: 별마다 왼쪽 반(0.5점)·오른쪽 반(1점) 버튼이 숨어 있어요 */
const pickSlots = [];
for (let i = 1; i <= 5; i++) {
  const slot = makeStar(0);
  [i - 0.5, i].forEach((v, side) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'half ' + (side === 0 ? 'l' : 'r');
    b.dataset.v = v;
    b.setAttribute('aria-label', v + '점');
    b.addEventListener('click', () => setStar(v));
    b.addEventListener('mouseenter', () => paintPick(v));   // 마우스를 올리면 미리 보기
    b.addEventListener('focus', () => paintPick(v));
    slot.appendChild(b);
  });
  pickSlots.push(slot);
  starPick.appendChild(slot);
}
starPick.addEventListener('mouseleave', () => paintPick(movieStar));
starPick.addEventListener('focusout', () => paintPick(movieStar));

function paintPick(v) {
  pickSlots.forEach((slot, i) => {
    slot.querySelector('.star-fill').style.width = (Math.max(0, Math.min(1, v - i)) * 100) + '%';
  });
  starValue.textContent = v.toFixed(1);
}
function setStar(v) {
  movieStar = v;
  paintPick(v);
  starPick.querySelectorAll('.half').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.v) === v));
}

/* 링크 주소 정리: http/https 주소만 받아요 (https:// 를 빼먹으면 붙여 줘요) */
function normalizeUrl(text) {
  const t = text.trim();
  if (!t) return '';
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : 'https://' + t);
    return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.includes('.') ? u.href : null;
  } catch (e) { return null; }
}
const naverSearchUrl = (title) => 'https://search.naver.com/search.naver?query=' + encodeURIComponent('영화 ' + title);

// '네이버 검색' 버튼: 제목으로 네이버 검색을 새 탭에 열어요 → 마음에 드는 페이지 주소를 복사해 오면 돼요
document.getElementById('mSearchBtn').addEventListener('click', () => {
  if (!mTitle.value.trim()) { alert('영화 제목을 먼저 적어 주세요!'); mTitle.focus(); return; }
  window.open(naverSearchUrl(mTitle.value.trim()), '_blank', 'noopener');
});

function sortedMovies() {
  return [...movies].sort(movieSort === 'star'
    ? (a, b) => b.star - a.star || b.date.localeCompare(a.date)
    : (a, b) => b.date.localeCompare(a.date) || b.id - a.id);
}

function renderMovies() {
  const list = sortedMovies();
  const summary = document.getElementById('movieSummary');
  if (movies.length) {
    const avg = movies.reduce((s, m) => s + m.star, 0) / movies.length;
    summary.textContent = `🎞 총 ${movies.length}편 · 평균 ★ ${avg.toFixed(1)}`;
  } else {
    summary.textContent = '';
  }

  movieList.innerHTML = '';
  if (!list.length) {
    const empty = document.createElement('li');
    empty.className = 'diary-empty';
    empty.textContent = '아직 기록한 영화가 없어요. ＋ 영화 기록을 눌러 첫 티켓을 만들어 보세요 🎟';
    movieList.appendChild(empty);
    return;
  }

  list.forEach(m => {
    const li = document.createElement('li');
    li.className = 'ticket';
    const gs = genresOf(m);
    li.style.setProperty('--c', GENRES[gs[0]] || GENRES['기타']);
    li.innerHTML = `
      <div class="ticket-stub">
        <span class="stub-label">ADMIT ONE</span>
        <span class="stub-date"></span>
        <span class="stub-year"></span>
      </div>
      <div class="ticket-body">
        <div class="ticket-top"><span class="genre-list"></span><span class="stars"></span></div>
        <h4 class="ticket-title"></h4>
        <dl class="ticket-meta">
          <div data-k="director"><dt>감독</dt><dd></dd></div>
          <div data-k="actors"><dt>출연</dt><dd class="actor-chips"></dd></div>
          <div data-k="place"><dt>본 곳</dt><dd></dd></div>
        </dl>
        <p class="ticket-review"></p>
        <div class="ticket-link">
          <a class="movie-link" target="_blank" rel="noopener noreferrer"></a>
          <button type="button" class="essay-btn" hidden>📝 감상문 읽기</button>
        </div>
        <div class="diary-actions">
          <button type="button" class="mini-btn" data-act="edit">수정</button>
          <button type="button" class="mini-btn" data-act="del">삭제</button>
        </div>
      </div>`;
    li.querySelector('.stub-date').textContent = m.date.slice(5).replace('-', '.');
    li.querySelector('.stub-year').textContent = m.date.slice(0, 4);
    // 장르 이름표 (장르마다 제 색깔)
    gs.forEach(g => {
      const tag = document.createElement('span');
      tag.className = 'genre';
      tag.textContent = g;
      tag.style.setProperty('--c', GENRES[g] || GENRES['기타']);
      li.querySelector('.genre-list').appendChild(tag);
    });

    // 감상문이 있으면 '감상문 읽기' 버튼을 보여 줘요
    if (m.essay) {
      const eb = li.querySelector('.essay-btn');
      eb.hidden = false;
      eb.addEventListener('click', () => openReader({
        kind: 'MOVIE REVIEW',
        title: m.title,
        sub: [dot(m.date), '★ ' + Number(m.star).toFixed(1), gs.join(' · '), m.director && `감독 ${m.director}`].filter(Boolean).join('  ·  '),
        text: m.essay
      }));
    }

    // 포스터가 있으면 티켓 왼쪽 칸에 넣어요 (못 불러오면 원래 색깔 칸으로)
    const posterSrc = posterOf(m);
    if (posterSrc) {
      li.classList.add('has-poster');
      const img = document.createElement('img');
      img.className = 'stub-poster';
      img.alt = m.title + ' 포스터';
      img.referrerPolicy = 'no-referrer';
      img.loading = 'lazy';
      img.onerror = () => { li.classList.remove('has-poster'); img.remove(); };
      img.src = posterSrc;
      li.querySelector('.ticket-stub').prepend(img);
    }

    // 별점 (반 개까지) + 숫자
    const stars = li.querySelector('.stars');
    stars.appendChild(starRow(m.star));
    const num = document.createElement('b');
    num.textContent = Number(m.star).toFixed(1);
    stars.appendChild(num);
    stars.setAttribute('aria-label', `별점 ${m.star}점`);

    li.querySelector('.ticket-title').textContent = m.title;
    li.querySelector('.ticket-review').textContent = m.review ? `“${m.review}”` : '';

    // 감독 · 배우 · 본 곳 (비어 있으면 그 줄은 빼요)
    const meta = li.querySelector('.ticket-meta');
    const row = (k) => meta.querySelector(`[data-k="${k}"]`);
    if (m.director) row('director').querySelector('dd').textContent = m.director; else row('director').remove();
    const actors = (m.actors || '').split(',').map(a => a.trim()).filter(Boolean);
    if (actors.length) {
      actors.forEach(a => { const chip = document.createElement('span'); chip.textContent = a; row('actors').querySelector('dd').appendChild(chip); });
    } else row('actors').remove();
    if (m.place) row('place').querySelector('dd').textContent = m.place; else row('place').remove();
    if (!meta.children.length) meta.remove();

    // 링크: 넣은 주소가 있으면 그 주소로, 없으면 네이버 검색으로
    const link = li.querySelector('.movie-link');
    const url = m.link && normalizeUrl(m.link);
    link.href = url || naverSearchUrl(m.title);
    link.textContent = url ? '🔗 영화 정보 보기' : '🔍 네이버에서 찾기';
    if (!url) link.classList.add('soft');

    li.querySelector('[data-act="edit"]').addEventListener('click', () => openMovieForm(m));
    li.querySelector('[data-act="del"]').addEventListener('click', () => {
      if (!confirm(`'${m.title}' 기록을 지울까요?`)) return;
      movies = movies.filter(x => x.id !== m.id);
      removePoster(m.id);
      saveMovies(); renderMovies(); updateHomeMovie();
    });
    movieList.appendChild(li);
  });
}

function openMovieForm(m) {
  movieEditingId = m ? m.id : null;
  document.getElementById('movieFormTitle').textContent = m ? '영화 기록 고치기' : '새 영화 기록';
  mTitle.value = m ? m.title : '';
  mDate.value = m ? m.date : ymd(new Date());
  setGenres(m ? genresOf(m) : []);
  mReview.value = m ? m.review : '';
  mEssay.value = m ? (m.essay || '') : '';
  updateCount(mEssay);
  autoHint.hidden = true;
  tmdbCandidates.hidden = true;
  mLink.value = m ? (m.link || '') : '';
  mDirector.value = m ? (m.director || '') : '';
  mActors.value = m ? (m.actors || '') : '';
  mPlace.value = m ? (m.place || '') : '';
  setStar(m ? Number(m.star) : 4);
  setPosterDraft(m ? draftFromMovie(m) : null);
  movieForm.hidden = false;
  movieAddBtn.hidden = true;
  mTitle.focus();
}
function closeMovieForm() {
  movieForm.hidden = true;
  movieAddBtn.hidden = false;
  movieEditingId = null;
}

movieAddBtn.addEventListener('click', () => openMovieForm(null));
document.getElementById('movieCancelBtn').addEventListener('click', closeMovieForm);

movieForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const link = normalizeUrl(mLink.value);
  if (link === null) {
    alert('링크 주소가 올바르지 않아요.\n인터넷 주소창의 주소(https://…)를 그대로 복사해 붙여 넣어 주세요.');
    mLink.focus();
    return;
  }
  const data = {
    title: mTitle.value.trim(), date: mDate.value, star: movieStar, review: mReview.value.trim(),
    genres: movieGenres.length ? movieGenres : ['기타'],
    genre: movieGenres[0] || '기타',   // 예전 방식과 맞추기 위해 대표 장르도 함께 저장
    essay: mEssay.value.trim(),
    link,
    director: mDirector.value.trim(),
    // 배우 이름은 쉼표로 나눠서 깔끔하게 다시 이어 붙여요 ("송강호,김혜수 " → "송강호, 김혜수")
    actors: mActors.value.split(',').map(a => a.trim()).filter(Boolean).join(', '),
    place: mPlace.value.trim()
  };
  if (!data.title || !data.date) return;
  const id = movieEditingId || Date.now();
  data.poster = commitPoster(id);
  if (movieEditingId) {
    movies = movies.map(m => m.id === movieEditingId ? { ...m, ...data } : m);
  } else {
    movies.push({ id, ...data });
  }
  saveMovies();
  closeMovieForm();
  renderMovies();
  updateHomeMovie();
});

document.querySelectorAll('#moviePanel .sort-btn').forEach(btn => btn.addEventListener('click', () => {
  movieSort = btn.dataset.sort;
  document.querySelectorAll('#moviePanel .sort-btn').forEach(b => b.classList.toggle('active', b === btn));
  renderMovies();
}));

function updateHomeMovie() {
  const latest = [...movies].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)[0];
  setHomeBoard('movie', movies.length,
    latest ? `${latest.title} ★${Number(latest.star).toFixed(1)}` : '아직 기록이 없어요',
    latest ? latest.date : '',
    latest && isRecent(Math.max(...movies.map(m => m.id))));
}
updateHomeMovie();

/* =========================================================
   10. PHOTO (사진첩)
   사진은 용량이 커서 IndexedDB라는 더 큰 브라우저 창고에 저장해요.
   ========================================================= */
// 브라우저 창고(IndexedDB) 열기 — 'photos'(사진첩), 'posters'(영화 포스터·책 표지), 'tripPhotos'(여행 사진) 칸이 있어요
let hpDBPromise = null;
function openHPDB() {
  if (!hpDBPromise) {
    hpDBPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open('gip_hp', 4); // 2 = 포스터 칸, 3 = 여행 사진 칸, 4 = 음악 칸이 추가된 버전
      req.onupgradeneeded = () => {
        const db = req.result;
        ['photos', 'posters', 'tripPhotos', 'music'].forEach(name => {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
        });
      };
      req.onsuccess = () => {
        const db = req.result;
        // 나중에 창고가 또 업그레이드되면, 이 탭은 창고를 닫아 길을 비켜 줘요
        db.onversionchange = () => db.close();
        resolve(db);
      };
      req.onerror = () => reject(req.error);
      // 예전 버전으로 열린 다른 탭 때문에 업그레이드가 막혔을 때
      req.onblocked = () => alert("다른 탭에 열려 있는 Gip's HP를 닫아 주세요.\n닫으면 사진첩과 포스터가 바로 불러와져요.");
    });
  }
  return hpDBPromise;
}
// 창고의 한 칸을 쉽게 쓰게 해 주는 도우미
function makeStore(name) {
  // 온라인 연결: 사진·포스터·여행 사진은 온라인 저장소에 (배경음악 파일은 이 브라우저에)
  if (CLOUD && CLOUD.usesRecords(name)) return CLOUD.recordStore(name);
  const run = async (mode, action) => {
    const db = await openHPDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(name, mode);
      const req = action(tx.objectStore(name));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
    });
  };
  return {
    all: () => run('readonly', s => s.getAll()),
    put: (item) => run('readwrite', s => s.put(item)),
    remove: (id) => run('readwrite', s => s.delete(id))
  };
}
const photoDB = makeStore('photos');

let photos = [];
let photoView = [];   // 화면에 보이는 순서대로 정렬한 사진들
let lbIndex = -1;     // 크게 보고 있는 사진 번호

/* 앨범(폴더): 목록은 'gip_albums'에 저장하고, 사진마다 albumId(들어 있는 앨범 번호)를 붙여요 */
let albums = loadJSON('gip_albums', []);   // [{ id, name }]
function saveAlbums() { store.set('gip_albums', JSON.stringify(albums)); }
let currentAlbum = 'all';   // 'all'(전체) · 'none'(미분류) · 앨범 번호
let selectMode = false;     // 여러 장 고르기 중인지
const selectedIds = new Set();

const isAlbum = (id) => albums.some(a => a.id === id);
const albumOf = (p) => isAlbum(p.albumId) ? p.albumId : null;   // 지워진 앨범이면 미분류
const albumName = (key) => key === 'all' ? '전체 사진' : key === 'none' ? '미분류' : ((albums.find(a => a.id === key) || {}).name || '앨범');
function inAlbum(p, key) {
  if (key === 'all') return true;
  if (key === 'none') return albumOf(p) === null;
  return p.albumId === key;
}
const byNewest = (a, b) => b.date.localeCompare(a.date) || b.id - a.id;

const photoGrid = document.getElementById('photoGrid');
const photoInput = document.getElementById('photoInput');
const photoStatus = document.getElementById('photoStatus');
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbCaption = document.getElementById('lbCaption');
const lbDate = document.getElementById('lbDate');
const lbAlbum = document.getElementById('lbAlbum');
let lastFocus = null;
let statusTimer = null;

function showStatus(text, autoHide) {
  clearTimeout(statusTimer);
  photoStatus.textContent = text;
  photoStatus.hidden = false;
  if (autoHide) statusTimer = setTimeout(() => { photoStatus.hidden = true; }, 3500);
}

// 사진을 적당한 크기로 줄여서 글자 형태(dataURL)로 바꿔요
function resizeImage(file, max = 1200) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('읽을 수 없는 사진')); };
    img.src = url;
  });
}

function savePhoto(p) {
  return photoDB.put(p).catch(() => showStatus('⚠ 저장 공간이 부족하거나 저장할 수 없어서, 새로고침하면 사라질 수 있어요.'));
}

async function addFiles(fileList) {
  const files = [...fileList].filter(f => f.type.startsWith('image/'));
  if (!files.length) return;
  showStatus(`📷 사진 ${files.length}장을 정리하는 중…`);
  // 앨범 안에서 올리면 그 앨범에 바로 넣어요
  const albumId = isAlbum(currentAlbum) ? currentAlbum : null;
  let ok = 0, fail = 0;
  for (let i = 0; i < files.length; i++) {
    try {
      const data = await resizeImage(files[i]);
      const p = { id: Date.now() + i, date: ymd(new Date(files[i].lastModified || Date.now())), caption: '', data, albumId };
      photos.push(p);
      await savePhoto(p);
      ok++;
    } catch (e) { fail++; }
  }
  renderPhotos();
  updateHomePhoto();
  showStatus(fail
    ? `사진 ${ok}장을 올렸어요. ${fail}장은 열 수 없는 형식이었어요 (예: 아이폰 HEIC → JPG로 바꿔 주세요).`
    : `✔ 사진 ${ok}장을 ${albumId ? `'${albumName(albumId)}' 앨범에 ` : ''}올렸어요!`, !fail);
}

document.getElementById('photoAddBtn').addEventListener('click', () => photoInput.click());
photoInput.addEventListener('change', () => { addFiles(photoInput.files); photoInput.value = ''; });

// 사진을 끌어다 놓아도 올라가요
photoPanel.addEventListener('dragover', (e) => { if (!canEdit()) return; e.preventDefault(); photoPanel.classList.add('dragging'); });
photoPanel.addEventListener('dragleave', (e) => { if (!photoPanel.contains(e.relatedTarget)) photoPanel.classList.remove('dragging'); });
photoPanel.addEventListener('drop', (e) => { if (!canEdit()) return; e.preventDefault(); photoPanel.classList.remove('dragging'); addFiles(e.dataTransfer.files); });

function sortPhotos() {
  // 지금 보고 있는 앨범의 사진만, 최신순으로
  photoView = photos.filter(p => inAlbum(p, currentAlbum)).sort(byNewest);
}

/* 앨범 칸 그리기: 전체 · 미분류 · 내 앨범들 · ＋ 새 앨범 */
const albumShelf = document.getElementById('albumShelf');
function renderAlbums() {
  albumShelf.innerHTML = '';
  const cards = [
    { key: 'all', name: '전체', list: photos },
    { key: 'none', name: '미분류', list: photos.filter(p => albumOf(p) === null) },
    ...albums.map(a => ({ key: a.id, name: a.name, list: photos.filter(p => p.albumId === a.id) }))
  ];
  cards.forEach(c => {
    const li = document.createElement('li');
    li.innerHTML = `
      <button type="button" class="album-card">
        <span class="folder"><span class="folder-photo"></span></span>
        <span class="album-name"></span>
        <span class="album-count"></span>
      </button>`;
    const btn = li.querySelector('button');
    if (c.key === currentAlbum) { btn.classList.add('active'); btn.setAttribute('aria-current', 'true'); }
    const cover = [...c.list].sort(byNewest)[0];   // 가장 최근 사진이 대표 사진
    if (cover) {
      const img = document.createElement('img');
      img.src = cover.data;
      img.alt = '';
      li.querySelector('.folder-photo').appendChild(img);
    } else li.querySelector('.folder-photo').remove();
    li.querySelector('.album-name').textContent = c.name;
    li.querySelector('.album-count').textContent = `${c.list.length}장`;
    btn.addEventListener('click', () => { currentAlbum = c.key; exitSelect(); renderPhotos(); });
    albumShelf.appendChild(li);
  });
  // ＋ 새 앨범
  const add = document.createElement('li');
  add.innerHTML = `<button type="button" class="album-card add"><span class="folder">＋</span><span class="album-name">새 앨범</span><span class="album-count">&nbsp;</span></button>`;
  add.querySelector('button').addEventListener('click', createAlbum);
  albumShelf.appendChild(add);
}

// 앨범 고르는 목록(select) 채우기 — 크게 보기 창, 옮기기 막대에서 사용
function fillAlbumSelect(select, value) {
  select.innerHTML = '';
  [['none', '📁 미분류'], ...albums.map(a => [String(a.id), '📁 ' + a.name])].forEach(([v, t]) => {
    const o = document.createElement('option');
    o.value = v; o.textContent = t;
    select.appendChild(o);
  });
  select.value = value;
}

function renderPhotos() {
  if (currentAlbum !== 'all' && currentAlbum !== 'none' && !isAlbum(currentAlbum)) currentAlbum = 'all';
  sortPhotos();
  renderAlbums();

  // 지금 앨범 이름과 도구
  const mine = isAlbum(currentAlbum);
  document.getElementById('albumNow').textContent = `📂 ${albumName(currentAlbum)} · ${photoView.length}장`;
  document.getElementById('albumRenameBtn').hidden = !mine;
  document.getElementById('albumDeleteBtn').hidden = !mine;
  document.getElementById('selectModeBtn').hidden = selectMode || !photoView.length;
  document.getElementById('selectBar').hidden = !selectMode;
  updateSelectBar();

  photoGrid.innerHTML = '';
  photoGrid.classList.toggle('select-mode', selectMode);
  if (!photoView.length) {
    const empty = document.createElement('li');
    empty.className = 'diary-empty photo-empty';
    empty.textContent = !photos.length
      ? '아직 사진이 없어요. ＋ 사진 올리기를 누르거나, 사진을 이곳으로 끌어다 놓아 보세요 📷'
      : mine
        ? '이 앨범은 비어 있어요. ＋ 사진 올리기로 바로 넣거나, 다른 앨범에서 ☑ 여러 장 고르기로 옮겨 오세요 📁'
        : '여기에는 사진이 없어요.';
    photoGrid.appendChild(empty);
    return;
  }
  photoView.forEach((p, i) => {
    const li = document.createElement('li');
    li.className = 'photo-tile' + (selectedIds.has(p.id) ? ' selected' : '');
    li.innerHTML = `<button type="button" class="tile-btn"><span class="tile-img"><img alt="" loading="lazy"></span><span class="tile-cap"></span><span class="tile-date"></span></button>`;
    const img = li.querySelector('img');
    img.src = p.data;
    img.alt = p.caption || '사진';
    li.querySelector('.tile-cap').textContent = p.caption || ' ';
    li.querySelector('.tile-date').textContent = p.date.replace(/-/g, '.');
    const btn = li.querySelector('button');
    if (selectMode) btn.setAttribute('aria-pressed', selectedIds.has(p.id));
    btn.addEventListener('click', () => {
      if (!selectMode) return openLightbox(i);
      // 고르기 중에는 누를 때마다 체크/해제
      if (selectedIds.has(p.id)) selectedIds.delete(p.id); else selectedIds.add(p.id);
      li.classList.toggle('selected', selectedIds.has(p.id));
      btn.setAttribute('aria-pressed', selectedIds.has(p.id));
      updateSelectBar();
    });
    photoGrid.appendChild(li);
  });
}

/* 앨범 만들기 · 이름 바꾸기 · 지우기 */
function createAlbum() {
  const name = (prompt('새 앨범 이름을 적어 주세요 (예: 2026 가을 제주)') || '').trim().slice(0, 20);
  if (!name) return;
  const a = { id: Date.now(), name };
  albums.push(a);
  saveAlbums();
  currentAlbum = a.id;
  exitSelect();
  renderPhotos();
  showStatus(`📁 '${name}' 앨범을 만들었어요. ＋ 사진 올리기로 넣거나, 다른 앨범에서 사진을 옮겨 오세요!`, true);
}
document.getElementById('albumRenameBtn').addEventListener('click', () => {
  const a = albums.find(x => x.id === currentAlbum);
  if (!a) return;
  const name = (prompt('앨범의 새 이름', a.name) || '').trim().slice(0, 20);
  if (!name || name === a.name) return;
  a.name = name;
  saveAlbums();
  renderPhotos();
});
document.getElementById('albumDeleteBtn').addEventListener('click', () => {
  const a = albums.find(x => x.id === currentAlbum);
  if (!a) return;
  if (!confirm(`'${a.name}' 앨범을 지울까요?\n사진은 지워지지 않고 '미분류'로 옮겨져요.`)) return;
  photos.filter(p => p.albumId === a.id).forEach(p => { p.albumId = null; savePhoto(p); });
  albums = albums.filter(x => x.id !== a.id);
  saveAlbums();
  currentAlbum = 'none';
  renderPhotos();
  showStatus(`'${a.name}' 앨범을 지웠어요. 사진은 미분류에 있어요.`, true);
});

/* 여러 장 고르기 */
const moveTarget = document.getElementById('moveTarget');
function updateSelectBar() {
  document.getElementById('selectCount').textContent = `${selectedIds.size}장 골랐어요`;
  document.getElementById('moveBtn').disabled = !selectedIds.size;
  document.getElementById('selectDeleteBtn').disabled = !selectedIds.size;
}
function exitSelect() {
  selectMode = false;
  selectedIds.clear();
}
document.getElementById('selectModeBtn').addEventListener('click', () => {
  selectMode = true;
  selectedIds.clear();
  // 옮길 곳 기본값: 지금 보고 있지 않은 첫 번째 내 앨범 (없으면 미분류)
  const firstOther = albums.find(a => a.id !== currentAlbum);
  fillAlbumSelect(moveTarget, firstOther ? String(firstOther.id) : 'none');
  renderPhotos();
});
document.getElementById('selectCancelBtn').addEventListener('click', () => { exitSelect(); renderPhotos(); });
document.getElementById('selectAllBtn').addEventListener('click', () => {
  const all = photoView.every(p => selectedIds.has(p.id));
  photoView.forEach(p => { if (all) selectedIds.delete(p.id); else selectedIds.add(p.id); });
  renderPhotos();
});
document.getElementById('moveBtn').addEventListener('click', () => {
  if (!selectedIds.size) return;
  const target = moveTarget.value === 'none' ? null : Number(moveTarget.value);
  const n = selectedIds.size;
  photos.filter(p => selectedIds.has(p.id)).forEach(p => { p.albumId = target; savePhoto(p); });
  exitSelect();
  renderPhotos();
  showStatus(`✔ 사진 ${n}장을 '${target ? albumName(target) : '미분류'}'(으)로 옮겼어요.`, true);
});
document.getElementById('selectDeleteBtn').addEventListener('click', () => {
  const n = selectedIds.size;
  if (!n || !confirm(`고른 사진 ${n}장을 사진첩에서 지울까요? (컴퓨터에 있는 원본 사진은 그대로 남아요)`)) return;
  selectedIds.forEach(id => photoDB.remove(id).catch(() => {}));
  photos = photos.filter(p => !selectedIds.has(p.id));
  exitSelect();
  renderPhotos();
  updateHomePhoto();
  showStatus(`사진 ${n}장을 지웠어요.`, true);
});

/* 크게 보기 */
function showLightbox() {
  const p = photoView[lbIndex];
  lbImg.src = p.data;
  lbImg.alt = p.caption || '사진';
  lbCaption.value = p.caption;
  lbDate.value = p.date;
  fillAlbumSelect(lbAlbum, albumOf(p) === null ? 'none' : String(p.albumId));
  // 방문자는 한마디·날짜를 읽기만 해요
  const edit = canEdit();
  lbCaption.readOnly = !edit;
  lbCaption.placeholder = edit ? '사진에 한마디를 남겨 보세요' : '';
  lbDate.disabled = !edit;
  document.getElementById('lbCount').textContent = `${lbIndex + 1} / ${photoView.length}`;
  const many = photoView.length > 1;
  document.getElementById('lbPrev').hidden = !many;
  document.getElementById('lbNext').hidden = !many;
}
function openLightbox(i) {
  lastFocus = document.activeElement;
  lbIndex = i;
  showLightbox();
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  document.getElementById('lbClose').focus();
}
function closeLightbox() {
  lightbox.hidden = true;
  document.body.style.overflow = '';
  if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus();
}
function moveLightbox(dir) {
  lbIndex = (lbIndex + dir + photoView.length) % photoView.length;
  showLightbox();
}

document.getElementById('lbClose').addEventListener('click', closeLightbox);
document.getElementById('lbPrev').addEventListener('click', () => moveLightbox(-1));
document.getElementById('lbNext').addEventListener('click', () => moveLightbox(1));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (lightbox.hidden) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return; // 글자 입력·앨범 고르는 중에는 화살표로 넘기지 않아요
  if (e.key === 'ArrowLeft') moveLightbox(-1);
  if (e.key === 'ArrowRight') moveLightbox(1);
});

lbCaption.addEventListener('change', () => {
  const p = photoView[lbIndex];
  p.caption = lbCaption.value.trim();
  savePhoto(p); renderPhotos(); updateHomePhoto(); showLightbox();
});
lbDate.addEventListener('change', () => {
  if (!lbDate.value) return;
  const p = photoView[lbIndex];
  p.date = lbDate.value;
  savePhoto(p); renderPhotos(); updateHomePhoto();
  lbIndex = photoView.indexOf(p); // 날짜가 바뀌면 순서도 바뀌어요
  showLightbox();
});
// 크게 보기 창에서 앨범 바꾸기
lbAlbum.addEventListener('change', () => {
  const p = photoView[lbIndex];
  p.albumId = lbAlbum.value === 'none' ? null : Number(lbAlbum.value);
  savePhoto(p);
  renderPhotos();
  showStatus(`✔ '${albumName(p.albumId || 'none')}'(으)로 옮겼어요.`, true);
  // 앨범 안에서 보고 있었다면 이 사진은 목록에서 빠지니, 다음 사진을 보여 줘요
  if (photoView.includes(p)) { lbIndex = photoView.indexOf(p); showLightbox(); return; }
  if (!photoView.length) { closeLightbox(); return; }
  lbIndex = Math.min(lbIndex, photoView.length - 1);
  showLightbox();
});
document.getElementById('lbDelete').addEventListener('click', () => {
  if (!confirm('이 사진을 사진첩에서 지울까요? (컴퓨터에 있는 원본 사진은 그대로 남아요)')) return;
  const p = photoView[lbIndex];
  photos = photos.filter(x => x.id !== p.id);
  photoDB.remove(p.id).catch(() => {});
  renderPhotos(); updateHomePhoto();
  if (!photoView.length) { closeLightbox(); return; }
  lbIndex = Math.min(lbIndex, photoView.length - 1);
  showLightbox();
});

function updateHomePhoto() {
  const latest = [...photos].sort((a, b) => b.id - a.id)[0];
  setHomeBoard('photo', photos.length,
    latest ? (latest.caption || '새 사진을 올렸어요 📷') : '아직 사진이 없어요',
    latest ? latest.date : '',
    latest && isRecent(latest.id));
}

// 처음 열 때 저장된 사진 불러오기
photoDB.all()
  .then(list => { photos = list || []; updateHomePhoto(); if (!photoPanel.hidden) renderPhotos(); })
  .catch(() => showStatus('⚠ 이 브라우저에서는 사진을 저장할 수 없어서, 새로고침하면 사진이 사라져요.'));

/* 인터넷 요청을 보내되, 정해진 시간(기본 15초) 안에 답이 없으면 기다리기를 멈춰요 */
function fetchWithTimeout(url, ms = 15000, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

/* 날짜 '2026-11-21' → '2026.11.21' */
const dot = (d) => d ? d.replace(/-/g, '.') : '';

/* 거르기 버튼 묶음을 연결해 주는 도우미 (BOOK, TRAVEL에서 사용) */
function bindFilter(panelId, onChange) {
  const btns = document.querySelectorAll(`#${panelId} .sort-btn`);
  btns.forEach(btn => btn.addEventListener('click', () => {
    btns.forEach(b => b.classList.toggle('active', b === btn));
    onChange(btn.dataset.filter);
  }));
}

/* =========================================================
   11. BOOK (책장)
   'gip_book'이라는 이름으로 이 브라우저에 저장돼요.
   ========================================================= */
const BOOK_STATUS = { reading: '읽는 중', done: '다 읽음', wish: '읽고 싶음' };
const SPINE_COLORS = ['#e9a6a0', '#8fb6dd', '#e8be78', '#93c6a3', '#9f92bd', '#c2ad86', '#eeb3c4', '#7fa6c9'];

let books = loadJSON('gip_book', []);
function saveBooks() { store.set('gip_book', JSON.stringify(books)); }

let bookFilter = 'all';
let bookSelected = null;   // 책장에서 고른 책 번호
let bookEditingId = null;

const bookForm = document.getElementById('bookForm');
const bookAddBtn = document.getElementById('bookAddBtn');
const shelf = document.getElementById('shelf');
const bookDetail = document.getElementById('bookDetail');
const bTitle = document.getElementById('bTitle');
const bAuthor = document.getElementById('bAuthor');
const bStatus = document.getElementById('bStatus');
const bDate = document.getElementById('bDate');
const bQuote = document.getElementById('bQuote');
const bMemo = document.getElementById('bMemo');
const bEssay = document.getElementById('bEssay');
const bLink = document.getElementById('bLink');

// 서점 검색 주소 (제목 + 지은이로 찾아요)
const BOOK_STORES = {
  aladin: { name: '알라딘', host: 'aladin.co.kr', search: 'https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=Book&SearchWord=' },
  yes24: { name: '예스24', host: 'yes24.com', search: 'https://www.yes24.com/Product/Search?domain=BOOK&query=' },
  kyobo: { name: '교보문고', host: 'kyobobook.co.kr', search: 'https://search.kyobobook.co.kr/search?keyword=' }
};
function storeSearchUrl(key, title, author) {
  return BOOK_STORES[key].search + encodeURIComponent([title, author].filter(Boolean).join(' '));
}
// 링크 주소를 보고 어느 서점인지 이름 붙이기
function storeNameOf(url) {
  try {
    const host = new URL(url).hostname;
    const s = Object.values(BOOK_STORES).find(x => host === x.host || host.endsWith('.' + x.host));
    return s ? s.name : '';
  } catch (e) { return ''; }
}

document.querySelectorAll('.store-search [data-store]').forEach(btn => {
  btn.addEventListener('click', () => {
    const title = bTitle.value.trim();
    if (!title) { alert('먼저 책 제목을 적어 주세요.'); bTitle.focus(); return; }
    window.open(storeSearchUrl(btn.dataset.store, title, bAuthor.value.trim()), '_blank', 'noopener');
  });
});

Object.entries(BOOK_STATUS).forEach(([v, t]) => { const o = document.createElement('option'); o.value = v; o.textContent = t; bStatus.appendChild(o); });

function sortedBooks() {
  return [...books].sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id - a.id);
}

function renderBooks() {
  const count = (s) => books.filter(b => b.status === s).length;
  document.getElementById('bookSummary').textContent = books.length
    ? `📖 다 읽은 책 ${count('done')}권 · 읽는 중 ${count('reading')}권 · 읽고 싶은 책 ${count('wish')}권` : '';

  const list = sortedBooks().filter(b => bookFilter === 'all' || b.status === bookFilter);
  shelf.innerHTML = '';
  if (!list.length) {
    const empty = document.createElement('p');
    empty.className = 'shelf-empty';
    empty.textContent = books.length ? '이 칸에는 아직 책이 없어요.' : '책장이 비어 있어요. ＋ 책 꽂기를 눌러 첫 책을 꽂아 보세요 📚';
    shelf.appendChild(empty);
  }
  list.forEach(b => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'spine ' + b.status + (b.id === bookSelected ? ' selected' : '');
    // 책마다 색·높이·두께가 조금씩 달라요
    btn.style.setProperty('--c', SPINE_COLORS[b.id % SPINE_COLORS.length]);
    btn.style.setProperty('--h', (112 + (b.id % 5) * 8) + 'px');
    btn.style.setProperty('--w', (30 + Math.min(b.title.length, 12)) + 'px');
    btn.setAttribute('aria-label', `${b.title} (${BOOK_STATUS[b.status]})`);
    const span = document.createElement('span');
    span.className = 'spine-book';
    span.textContent = b.title;
    btn.appendChild(span);
    btn.addEventListener('click', () => {
      bookSelected = (bookSelected === b.id) ? null : b.id;
      renderBooks();
    });
    shelf.appendChild(btn);
  });
  renderBookDetail();
}

function renderBookDetail() {
  const b = books.find(x => x.id === bookSelected);
  bookDetail.innerHTML = '';
  if (!b) {
    if (books.length) {
      const hint = document.createElement('p');
      hint.className = 'bk-hint';
      hint.textContent = '👆 책등을 누르면 자세히 볼 수 있어요';
      bookDetail.appendChild(hint);
    }
    return;
  }
  const card = document.createElement('div');
  card.className = 'bk-card';
  card.style.setProperty('--c', SPINE_COLORS[b.id % SPINE_COLORS.length]);
  card.innerHTML = `
    <div class="bk-top"><span class="bk-status"></span><span class="bk-date"></span></div>
    <div class="bk-head">
      <div class="bk-cover"></div>
      <div class="bk-info">
        <h4 class="bk-title"></h4>
        <p class="bk-author"></p>
        <div class="bk-links"></div>
      </div>
    </div>
    <blockquote class="bk-quote"></blockquote>
    <p class="bk-memo"></p>
    <div class="bk-essay">
      <p class="bk-essay-label">📝 감상문</p>
      <p class="bk-essay-preview"></p>
      <button type="button" class="essay-btn">전체 읽기 →</button>
    </div>
    <div class="diary-actions">
      <button type="button" class="mini-btn" data-act="edit">수정</button>
      <button type="button" class="mini-btn" data-act="del">삭제</button>
    </div>`;
  card.querySelector('.bk-status').textContent = BOOK_STATUS[b.status];
  card.querySelector('.bk-date').textContent = dot(b.date);
  card.querySelector('.bk-title').textContent = b.title;
  card.querySelector('.bk-author').textContent = b.author ? `${b.author} 지음` : '';

  // 표지: 있으면 이미지, 없으면 책 색깔 표지에 제목
  const coverBox = card.querySelector('.bk-cover');
  const coverSrc = coverOfBook(b);
  if (coverSrc) {
    const img = document.createElement('img');
    img.alt = `${b.title} 표지`;
    img.referrerPolicy = 'no-referrer';
    img.loading = 'lazy';
    img.onerror = () => { img.remove(); coverBox.textContent = b.title; coverBox.classList.add('blank'); };
    img.src = coverSrc;
    coverBox.appendChild(img);
  } else {
    coverBox.textContent = b.title;
    coverBox.classList.add('blank');
  }

  // 서점 링크: 저장한 링크가 있으면 그 링크, 없으면 세 서점 검색
  const links = card.querySelector('.bk-links');
  const addLink = (href, text, soft) => {
    const a = document.createElement('a');
    a.className = 'movie-link' + (soft ? ' soft' : '');
    a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.textContent = text;
    links.appendChild(a);
  };
  const link = b.link && normalizeUrl(b.link);
  if (link) {
    const store = storeNameOf(link);
    addLink(link, store ? `🔗 ${store}에서 보기` : '🔗 책 정보 보기');
  } else {
    const label = document.createElement('span');
    label.className = 'bk-links-label';
    label.textContent = '서점에서 찾기';
    links.appendChild(label);
    Object.keys(BOOK_STORES).forEach(k => addLink(storeSearchUrl(k, b.title, b.author), BOOK_STORES[k].name, true));
  }

  const q = card.querySelector('.bk-quote');
  if (b.quote) q.textContent = b.quote; else q.remove();
  card.querySelector('.bk-memo').textContent = b.memo;
  // 감상문: 앞부분만 미리 보여 주고, 전체는 읽기 창에서
  const essayBox = card.querySelector('.bk-essay');
  if (b.essay) {
    essayBox.querySelector('.bk-essay-preview').textContent = b.essay;
    essayBox.querySelector('.essay-btn').addEventListener('click', () => openReader({
      kind: 'BOOK REVIEW',
      title: b.title,
      sub: [b.author && `${b.author} 지음`, BOOK_STATUS[b.status], dot(b.date)].filter(Boolean).join('  ·  '),
      text: b.essay
    }));
  } else essayBox.remove();
  card.querySelector('[data-act="edit"]').addEventListener('click', () => openBookForm(b));
  card.querySelector('[data-act="del"]').addEventListener('click', () => {
    if (!confirm(`'${b.title}'을(를) 책장에서 뺄까요?`)) return;
    books = books.filter(x => x.id !== b.id);
    removeBookCover(b.id);
    bookSelected = null;
    saveBooks(); renderBooks(); updateHomeBook();
  });
  bookDetail.appendChild(card);
}

function openBookForm(b) {
  bookEditingId = b ? b.id : null;
  document.getElementById('bookFormTitle').textContent = b ? '책 정보 고치기' : '새 책';
  bTitle.value = b ? b.title : '';
  bAuthor.value = b ? b.author : '';
  bStatus.value = b ? b.status : 'reading';
  bDate.value = b ? b.date : ymd(new Date());
  bQuote.value = b ? b.quote : '';
  bMemo.value = b ? b.memo : '';
  bEssay.value = b ? (b.essay || '') : '';
  bLink.value = b ? (b.link || '') : '';
  setCoverDraft(b ? draftFromBook(b) : null);
  updateCount(bEssay);
  bookForm.hidden = false;
  bookAddBtn.hidden = true;
  bTitle.focus();
}
function closeBookForm() {
  bookForm.hidden = true;
  bookAddBtn.hidden = false;
  bookEditingId = null;
}
bookAddBtn.addEventListener('click', () => openBookForm(null));
document.getElementById('bookCancelBtn').addEventListener('click', closeBookForm);

bookForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = {
    title: bTitle.value.trim(), author: bAuthor.value.trim(), status: bStatus.value,
    date: bDate.value, quote: bQuote.value.trim(), memo: bMemo.value.trim(),
    essay: bEssay.value.trim(), link: normalizeUrl(bLink.value)
  };
  if (!data.title) return;
  if (data.link === null) { alert('책 링크 주소가 올바르지 않아요. https:// 로 시작하는 주소를 붙여 넣어 주세요.'); bLink.focus(); return; }
  if (bookEditingId) {
    data.cover = commitBookCover(bookEditingId);
    books = books.map(b => b.id === bookEditingId ? { ...b, ...data } : b);
    bookSelected = bookEditingId;
  } else {
    const id = Date.now();
    data.cover = commitBookCover(id);
    books.push({ id, ...data });
    bookSelected = id;
  }
  saveBooks();
  closeBookForm();
  renderBooks();
  updateHomeBook();
});

bindFilter('bookPanel', (f) => { bookFilter = f; renderBooks(); });

function updateHomeBook() {
  const latest = [...books].sort((a, b) => b.id - a.id)[0];
  setHomeBoard('book', books.length,
    latest ? `${latest.title} · ${BOOK_STATUS[latest.status]}` : '아직 꽂힌 책이 없어요',
    latest ? (latest.date || ymd(new Date(latest.id))) : '',
    latest && isRecent(latest.id));
}
updateHomeBook();

/* =========================================================
   12. TRAVEL (여행 지도)
   'gip_travel'이라는 이름으로 이 브라우저에 저장돼요.
   지도는 Leaflet + OpenStreetMap/CARTO를 인터넷에서 불러와요.
   ========================================================= */
let trips = loadJSON('gip_travel', []);
function saveTrips() { store.set('gip_travel', JSON.stringify(trips)); }

let tripFilter = 'all';
let tripEditingId = null;
let map = null;
let mapFitted = false;
let markers = {};
let tempMarker = null;
let pickLatLng = null;   // 지도에서 고른 위치

const travelForm = document.getElementById('travelForm');
const travelAddBtn = document.getElementById('travelAddBtn');
const tripList = document.getElementById('tripList');
const pickHint = document.getElementById('pickHint');
const tPlace = document.getElementById('tPlace');
const tStatus = document.getElementById('tStatus');
const tStart = document.getElementById('tStart');
const tEnd = document.getElementById('tEnd');
const tMemo = document.getElementById('tMemo');

/* ---------- 여행 사진 ----------
   여행 하나의 사진들을 묶어서 창고(IndexedDB) 'tripPhotos' 칸에 저장해요.
   사진마다 크게 볼 이미지(data)와 작은 미리보기(thumb)를 같이 만들어 둬요. */
const tripPhotoDB = makeStore('tripPhotos');
const tripPhotoCache = {};   // 여행 번호 → [{ data, thumb }]
const TRIP_PHOTO_MAX = 20;
let tripPhotoDraft = [];     // 쓰기 칸에 올려 둔 사진들 (첫 번째 = 대표 사진)
let tripPhotoBusy = false;   // 사진을 정리하는 중인지

const tPhotoPick = document.getElementById('tPhotoPick');
const tPhotoList = document.getElementById('tPhotoList');
const tPhotoHint = document.getElementById('tPhotoHint');
const tPhotoInput = document.getElementById('tPhotoInput');
const TRIP_PHOTO_HINT = '💡 여러 장을 한 번에 골라도 돼요 · 끌어다 놓기, Ctrl+V도 돼요 · 사진을 누르면 대표 사진(맨 앞)이 돼요';

const tripPhotosOf = (t) => tripPhotoCache[t.id] || [];

function renderTripDraft(message) {
  tPhotoList.innerHTML = '';
  tripPhotoDraft.forEach((p, i) => {
    const li = document.createElement('li');
    li.className = 'trip-thumb' + (i === 0 ? ' cover' : '');
    const pick = document.createElement('button');
    pick.type = 'button';
    pick.className = 'trip-thumb-img';
    pick.title = i === 0 ? '대표 사진' : '누르면 대표 사진이 돼요';
    const img = document.createElement('img');
    img.src = p.thumb; img.alt = `여행 사진 ${i + 1}`;
    pick.appendChild(img);
    pick.addEventListener('click', () => {
      if (i === 0) return;
      tripPhotoDraft.unshift(tripPhotoDraft.splice(i, 1)[0]);
      renderTripDraft('✔ 대표 사진을 바꿨어요.');
    });
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'trip-thumb-del';
    del.setAttribute('aria-label', `사진 ${i + 1} 빼기`);
    del.textContent = '✕';
    del.addEventListener('click', () => { tripPhotoDraft.splice(i, 1); renderTripDraft(); });
    li.append(pick, del);
    if (i === 0) { const tag = document.createElement('span'); tag.className = 'trip-thumb-tag'; tag.textContent = '대표'; li.appendChild(tag); }
    tPhotoList.appendChild(li);
  });
  document.getElementById('tPhotoCount').textContent = tripPhotoDraft.length ? `${tripPhotoDraft.length} / ${TRIP_PHOTO_MAX}장` : '';
  tPhotoHint.textContent = message || TRIP_PHOTO_HINT;
}

async function addTripPhotos(files) {
  const list = [...files].filter(f => f && f.type.startsWith('image/'));
  if (!list.length || tripPhotoBusy) return;
  const room = TRIP_PHOTO_MAX - tripPhotoDraft.length;
  if (room <= 0) { renderTripDraft(`사진은 여행 하나에 ${TRIP_PHOTO_MAX}장까지 넣을 수 있어요.`); return; }
  const todo = list.slice(0, room);
  tripPhotoBusy = true;
  let failed = 0;
  for (let i = 0; i < todo.length; i++) {
    tPhotoHint.textContent = `사진을 정리하는 중… (${i + 1}/${todo.length})`;
    try {
      const data = await resizeImage(todo[i], 1280);
      const thumb = await resizeImage(todo[i], 240);
      tripPhotoDraft.push({ data, thumb });
    } catch (e) { failed++; }
  }
  tripPhotoBusy = false;
  const notes = [`✔ ${todo.length - failed}장을 넣었어요! 저장하기를 누르면 함께 저장돼요.`];
  if (failed) notes.push(`${failed}장은 열 수 없는 이미지라 뺐어요.`);
  if (list.length > room) notes.push(`${TRIP_PHOTO_MAX}장이 넘는 ${list.length - room}장은 빠졌어요.`);
  renderTripDraft(notes.join(' '));
}

document.getElementById('tPhotoBtn').addEventListener('click', () => tPhotoInput.click());
tPhotoInput.addEventListener('change', () => { addTripPhotos(tPhotoInput.files); tPhotoInput.value = ''; });
travelForm.addEventListener('paste', (e) => {
  const files = [...(e.clipboardData ? e.clipboardData.items : [])].filter(i => i.type.startsWith('image/')).map(i => i.getAsFile());
  if (!files.length) return;
  e.preventDefault();
  addTripPhotos(files);
});
tPhotoPick.addEventListener('dragover', (e) => { e.preventDefault(); tPhotoPick.classList.add('dragging'); });
tPhotoPick.addEventListener('dragleave', () => tPhotoPick.classList.remove('dragging'));
tPhotoPick.addEventListener('drop', (e) => {
  e.preventDefault();
  tPhotoPick.classList.remove('dragging');
  addTripPhotos(e.dataTransfer.files);
});

function commitTripPhotos(id) {
  if (tripPhotoDraft.length) {
    const list = tripPhotoDraft.slice();
    tripPhotoCache[id] = list;
    tripPhotoDB.put({ id, photos: list })
      .catch(() => alert('여행 사진을 저장하지 못했어요. 새로고침하면 사진이 사라질 수 있어요.'));
  } else {
    removeTripPhotos(id);
  }
}
function removeTripPhotos(id) {
  delete tripPhotoCache[id];
  tripPhotoDB.remove(id).catch(() => {});
}

// 여행 사진 크게 보기 창
const tripViewer = document.getElementById('tripViewer');
const tvImg = document.getElementById('tvImg');
let tvTrip = null, tvIndex = 0, tvLastFocus = null;

function showTripPhoto() {
  const list = tripPhotosOf(tvTrip);
  tvImg.src = list[tvIndex].data;
  tvImg.alt = `${tvTrip.place} 사진 ${tvIndex + 1}`;
  document.getElementById('tvCount').textContent = `${tvIndex + 1} / ${list.length}`;
  const many = list.length > 1;
  document.getElementById('tvPrev').hidden = !many;
  document.getElementById('tvNext').hidden = !many;
  const strip = document.getElementById('tvStrip');
  strip.innerHTML = '';
  if (many) list.forEach((p, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = i === tvIndex ? 'on' : '';
    btn.setAttribute('aria-label', `사진 ${i + 1}`);
    const img = document.createElement('img'); img.src = p.thumb; img.alt = '';
    btn.appendChild(img);
    btn.addEventListener('click', () => { tvIndex = i; showTripPhoto(); });
    li.appendChild(btn);
    strip.appendChild(li);
  });
}
function openTripViewer(t, i) {
  if (!tripPhotosOf(t).length) return;
  tvLastFocus = document.activeElement;
  tvTrip = t; tvIndex = i || 0;
  document.getElementById('tvTitle').textContent = `✈ ${t.place} · ${tripDates(t)}`;
  showTripPhoto();
  tripViewer.hidden = false;
  document.body.style.overflow = 'hidden';
  document.getElementById('tvClose').focus();
}
function closeTripViewer() {
  tripViewer.hidden = true;
  document.body.style.overflow = '';
  if (tvLastFocus && document.body.contains(tvLastFocus)) tvLastFocus.focus();
}
function moveTripPhoto(dir) {
  const n = tripPhotosOf(tvTrip).length;
  tvIndex = (tvIndex + dir + n) % n;
  showTripPhoto();
}
document.getElementById('tvClose').addEventListener('click', closeTripViewer);
document.getElementById('tvPrev').addEventListener('click', () => moveTripPhoto(-1));
document.getElementById('tvNext').addEventListener('click', () => moveTripPhoto(1));
tripViewer.addEventListener('click', (e) => { if (e.target === tripViewer) closeTripViewer(); });
document.addEventListener('keydown', (e) => {
  if (tripViewer.hidden) return;
  if (e.key === 'Escape') closeTripViewer();
  if (e.key === 'ArrowLeft') moveTripPhoto(-1);
  if (e.key === 'ArrowRight') moveTripPhoto(1);
});

// 처음 열 때 저장된 여행 사진 불러오기
tripPhotoDB.all()
  .then(list => {
    (list || []).forEach(r => { tripPhotoCache[r.id] = r.photos || []; });
    if (!travelPanel.hidden) renderTravel();
  })
  .catch(() => {});

const PIN_COLORS = { visited: '#e98b84', wish: '#6f9cc8', pick: '#f0b53c' };
const PIN_MAP = ['..ppp..', '.ppppp.', 'ppwwwpp', 'ppwwwpp', '.ppppp.', '..ppp..', '...p...', '...p...'];
function pinIcon(color) {
  return L.divIcon({
    className: 'px-pin',
    html: pixelSVG(PIN_MAP, { p: color, w: '#fffdf6' }),
    iconSize: [21, 24], iconAnchor: [10, 24], popupAnchor: [0, -22]
  });
}

function tripDates(t) {
  if (t.status === 'wish') return '☆ 언젠가 꼭 가 보고 싶은 곳';
  if (!t.start) return '다녀온 곳';
  if (t.end && t.end !== t.start) return `${dot(t.start)} ~ ${dot(t.end).slice(5)}`;
  return dot(t.start);
}

function initMap() {
  if (map) return;
  if (!window.L) { document.getElementById('mapMsg').hidden = false; return; }
  map = L.map('travelMap', { scrollWheelZoom: false }).setView([36.3, 127.8], 6);
  // 지도 그림: OpenStreetMap (예전에 쓰던 CARTO는 이제 키가 있어야 해서 바꿨어요)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    className: 'soft-tiles'
  }).addTo(map);
  // 지도를 누르면 그 자리를 여행 위치로 골라요
  map.on('click', (e) => {
    if (!canEdit()) return;   // 방문자는 지도를 구경만 해요
    if (travelForm.hidden) openTravelForm(null);
    setPick({ lat: e.latlng.lat, lng: e.latlng.lng });
  });
}

function setPick(latlng) {
  pickLatLng = latlng;
  pickHint.textContent = latlng
    ? '📍 위치를 골랐어요 ✓ (지도를 다시 누르면 옮겨져요)'
    : (map ? '📍 지도를 눌러 위치를 골라 주세요 (안 골라도 저장돼요)' : '');
  if (!map) return;
  if (tempMarker) { tempMarker.remove(); tempMarker = null; }
  if (latlng) tempMarker = L.marker(latlng, { icon: pinIcon(PIN_COLORS.pick), zIndexOffset: 1000 }).addTo(map);
}

function popupNode(t) {
  const box = document.createElement('div');
  box.className = 'trip-pop';
  // 대표 사진이 있으면 말풍선 맨 위에 (누르면 크게 보기)
  const shots = tripPhotosOf(t);
  if (shots.length) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'trip-pop-photo';
    btn.setAttribute('aria-label', `${t.place} 사진 크게 보기`);
    const img = document.createElement('img'); img.src = shots[0].thumb; img.alt = '';
    btn.appendChild(img);
    if (shots.length > 1) { const n = document.createElement('span'); n.textContent = `📷 ${shots.length}`; btn.appendChild(n); }
    btn.addEventListener('click', () => openTripViewer(t, 0));
    box.appendChild(btn);
  }
  const b = document.createElement('b'); b.textContent = t.place; box.appendChild(b);
  const s = document.createElement('span'); s.textContent = tripDates(t); box.appendChild(s);
  if (t.memo) { const p = document.createElement('p'); p.textContent = t.memo; box.appendChild(p); }
  return box;
}

function renderMarkers() {
  if (!map) return;
  Object.values(markers).forEach(m => m.remove());
  markers = {};
  trips.filter(t => t.lat != null).forEach(t => {
    markers[t.id] = L.marker([t.lat, t.lng], { icon: pinIcon(PIN_COLORS[t.status]) })
      .bindPopup(popupNode(t))
      .addTo(map);
  });
}

function sortedTrips() {
  return [...trips].sort((a, b) =>
    (a.status === b.status ? 0 : a.status === 'visited' ? -1 : 1) ||
    (b.start || '').localeCompare(a.start || '') || b.id - a.id);
}

function renderTravel() {
  initMap();
  renderMarkers();
  if (map) {
    // 숨겨져 있던 지도가 화면에 나타나면 크기를 다시 계산해야 해요
    setTimeout(() => {
      map.invalidateSize();
      const pts = trips.filter(t => t.lat != null).map(t => [t.lat, t.lng]);
      if (!mapFitted && pts.length) { map.fitBounds(pts, { padding: [30, 30], maxZoom: 10 }); }
      mapFitted = true;
    }, 0);
  }

  const v = trips.filter(t => t.status === 'visited').length;
  document.getElementById('travelSummary').textContent = trips.length
    ? `✈ 다녀온 곳 ${v}곳 · 가고 싶은 곳 ${trips.length - v}곳` : '';

  const list = sortedTrips().filter(t => tripFilter === 'all' || t.status === tripFilter);
  tripList.innerHTML = '';
  if (!list.length) {
    const empty = document.createElement('li');
    empty.className = 'diary-empty';
    empty.textContent = trips.length ? '이 칸에는 아직 기록이 없어요.' : '아직 여행 기록이 없어요. 지도를 눌러 첫 핀을 꽂아 보세요 ✈';
    tripList.appendChild(empty);
    return;
  }
  list.forEach(t => {
    const li = document.createElement('li');
    li.className = 'trip ' + t.status;
    li.innerHTML = `
      <button type="button" class="trip-stamp">
        <span class="trip-kind"></span>
        <span class="trip-place"></span>
        <span class="trip-date"></span>
        <span class="trip-memo"></span>
      </button>
      <ul class="trip-photos"></ul>
      <div class="diary-actions">
        <button type="button" class="mini-btn" data-act="edit">수정</button>
        <button type="button" class="mini-btn" data-act="del">삭제</button>
      </div>`;
    li.querySelector('.trip-kind').textContent = t.status === 'wish' ? 'WISH' : 'VISITED';
    li.querySelector('.trip-place').textContent = t.place;
    li.querySelector('.trip-date').textContent = tripDates(t);
    li.querySelector('.trip-memo').textContent = t.memo;
    // 사진 미리보기 (최대 4칸, 더 있으면 마지막 칸에 +숫자)
    const shots = tripPhotosOf(t);
    const strip = li.querySelector('.trip-photos');
    if (!shots.length) strip.remove();
    shots.slice(0, 4).forEach((p, i) => {
      const cell = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', `${t.place} 사진 ${i + 1} 크게 보기`);
      const img = document.createElement('img'); img.src = p.thumb; img.alt = ''; img.loading = 'lazy';
      btn.appendChild(img);
      if (i === 3 && shots.length > 4) {
        const more = document.createElement('span'); more.className = 'more'; more.textContent = `+${shots.length - 4}`;
        btn.appendChild(more);
      }
      btn.addEventListener('click', () => openTripViewer(t, i));
      cell.appendChild(btn);
      strip.appendChild(cell);
    });
    // 도장을 누르면 지도에서 그 장소로 이동해요
    li.querySelector('.trip-stamp').addEventListener('click', () => {
      if (!map || t.lat == null) return;
      map.getContainer().scrollIntoView({ behavior: 'smooth', block: 'center' });
      map.flyTo([t.lat, t.lng], 11);
      markers[t.id].openPopup();
    });
    li.querySelector('[data-act="edit"]').addEventListener('click', () => openTravelForm(t));
    li.querySelector('[data-act="del"]').addEventListener('click', () => {
      if (!confirm(`'${t.place}' 기록을 지울까요?`)) return;
      trips = trips.filter(x => x.id !== t.id);
      removeTripPhotos(t.id);
      saveTrips(); renderTravel(); updateHomeTravel();
    });
    tripList.appendChild(li);
  });
}

function toggleDates() { document.getElementById('tDates').hidden = tStatus.value === 'wish'; }
tStatus.addEventListener('change', toggleDates);

function openTravelForm(t) {
  tripEditingId = t ? t.id : null;
  document.getElementById('travelFormTitle').textContent = t ? '여행 기록 고치기' : '새 여행 기록';
  tPlace.value = t ? t.place : '';
  tStatus.value = t ? t.status : 'visited';
  tStart.value = t ? t.start : '';
  tEnd.value = t ? t.end : '';
  tMemo.value = t ? t.memo : '';
  tripPhotoDraft = t ? tripPhotosOf(t).slice() : [];
  renderTripDraft();
  toggleDates();
  setPick(t && t.lat != null ? { lat: t.lat, lng: t.lng } : null);
  travelForm.hidden = false;
  travelAddBtn.hidden = true;
  tPlace.focus({ preventScroll: true });
}
function closeTravelForm() {
  travelForm.hidden = true;
  travelAddBtn.hidden = false;
  tripEditingId = null;
  tripPhotoDraft = [];
  setPick(null);
}
travelAddBtn.addEventListener('click', () => openTravelForm(null));
document.getElementById('travelCancelBtn').addEventListener('click', closeTravelForm);

travelForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const wish = tStatus.value === 'wish';
  const data = {
    place: tPlace.value.trim(), status: tStatus.value,
    start: wish ? '' : tStart.value,
    end: wish ? '' : (tEnd.value && tEnd.value >= tStart.value ? tEnd.value : ''),
    memo: tMemo.value.trim(),
    lat: pickLatLng ? +pickLatLng.lat.toFixed(5) : null,
    lng: pickLatLng ? +pickLatLng.lng.toFixed(5) : null
  };
  if (!data.place) return;
  if (tripPhotoBusy) { alert('사진을 정리하는 중이에요. 잠깐 뒤에 다시 저장해 주세요.'); return; }
  if (tripEditingId) {
    commitTripPhotos(tripEditingId);
    trips = trips.map(t => t.id === tripEditingId ? { ...t, ...data } : t);
  } else {
    const id = Date.now();
    commitTripPhotos(id);
    trips.push({ id, ...data });
  }
  saveTrips();
  closeTravelForm();
  renderTravel();
  updateHomeTravel();
});

bindFilter('travelPanel', (f) => { tripFilter = f; renderTravel(); });

function updateHomeTravel() {
  const latest = [...trips].sort((a, b) => b.id - a.id)[0];
  setHomeBoard('travel', trips.length,
    latest ? latest.place + (latest.status === 'wish' ? ' (가고 싶은 곳)' : '') : '아직 여행 기록이 없어요',
    latest ? (latest.start || ymd(new Date(latest.id))) : '',
    latest && isRecent(latest.id));
}
updateHomeTravel();

/* =========================================================
   13. MOVIE 포스터
   - 직접 올리거나 붙여 넣은 포스터: 작게 줄여서 IndexedDB 'posters' 칸에 저장
   - 링크에서 불러온 포스터: 그 이미지의 인터넷 주소만 저장
   ========================================================= */
const posterDB = makeStore('posters');
const posterCache = {};     // 영화 번호 → 저장된 포스터 이미지
let posterDraft = null;     // 쓰기 칸에 올려 둔 포스터 { type:'url', value } 또는 { type:'local', data }

const posterPreview = document.getElementById('posterPreview');
const posterHint = document.getElementById('posterHint');
const posterClearBtn = document.getElementById('posterClearBtn');
const posterInput = document.getElementById('posterInput');
const POSTER_HINT = '💡 다른 사이트에서 포스터를 우클릭 → "이미지 복사" 한 뒤, 이 칸에서 Ctrl+V 해도 돼요';

// 영화의 포스터 이미지 주소 (없으면 빈 글자)
function posterOf(m) {
  if (m.poster === 'local') return posterCache[m.id] || '';
  return m.poster && /^https?:\/\//.test(m.poster) ? m.poster : '';
}
function draftFromMovie(m) {
  if (m.poster === 'local') return posterCache[m.id] ? { type: 'local', data: posterCache[m.id] } : null;
  return posterOf(m) ? { type: 'url', value: m.poster } : null;
}

// 쓰기 칸의 포스터 미리보기 바꾸기
function setPosterDraft(draft, message) {
  posterDraft = draft;
  posterPreview.innerHTML = '';
  const src = draft ? (draft.type === 'local' ? draft.data : draft.value) : '';
  if (src) {
    const img = document.createElement('img');
    img.alt = '포스터 미리보기';
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => {
      posterPreview.textContent = '⚠';
      posterHint.textContent = '이 이미지는 사이트에서 막아 두어 보여줄 수 없어요. 파일 올리기나 Ctrl+V를 써 주세요.';
    };
    img.src = src;
    posterPreview.appendChild(img);
  } else {
    posterPreview.textContent = '🎞';
  }
  posterClearBtn.hidden = !draft;
  posterHint.textContent = message || POSTER_HINT;
}

// 이미지 파일(올리기·붙여넣기·끌어다 놓기)을 포스터로 쓰기
async function usePosterFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  posterHint.textContent = '포스터를 정리하는 중…';
  try {
    const data = await resizeImage(file, 480); // 사진첩에서 만든 '사진 줄이기' 도우미를 다시 써요
    setPosterDraft({ type: 'local', data }, '✔ 포스터를 넣었어요! 저장하기를 누르면 함께 저장돼요.');
  } catch (e) {
    setPosterDraft(posterDraft, '이 이미지는 열 수 없어요. JPG나 PNG 이미지로 다시 해 주세요.');
  }
}

// ✨ 링크에서 포스터 불러오기 (Microlink 무료 서비스로 그 페이지의 대표 이미지를 찾아요)
document.getElementById('posterFetchBtn').addEventListener('click', async () => {
  const url = normalizeUrl(mLink.value);
  if (!url) { alert('먼저 위의 링크 칸에 영화 페이지 주소를 넣어 주세요.'); mLink.focus(); return; }
  posterHint.textContent = '🔎 그 페이지에서 포스터를 찾는 중…';
  try {
    const res = await fetchWithTimeout('https://api.microlink.io/?url=' + encodeURIComponent(url));
    const json = await res.json();
    const img = json && json.status === 'success' && json.data && json.data.image && normalizeUrl(json.data.image.url || '');
    if (!img) throw new Error('no image');
    setPosterDraft({ type: 'url', value: img }, '✔ 불러왔어요! 포스터가 아니면 ✕ 지우기 후 직접 넣어 주세요.');
  } catch (e) {
    posterHint.textContent = '이 페이지에서는 이미지를 찾지 못했어요 (또는 오늘 무료 횟수를 다 썼어요). 파일 올리기나 Ctrl+V를 써 주세요.';
  }
});

document.getElementById('posterFileBtn').addEventListener('click', () => posterInput.click());
posterInput.addEventListener('change', () => { usePosterFile(posterInput.files[0]); posterInput.value = ''; });
posterClearBtn.addEventListener('click', () => setPosterDraft(null));

// Ctrl+V: 복사한 이미지가 있으면 포스터로 (글자만 복사했으면 평소처럼 글자가 붙어요)
movieForm.addEventListener('paste', (e) => {
  const item = [...(e.clipboardData ? e.clipboardData.items : [])].find(i => i.type.startsWith('image/'));
  if (!item) return;
  e.preventDefault();
  usePosterFile(item.getAsFile());
});

// 포스터 칸에 이미지 끌어다 놓기
posterPreview.addEventListener('dragover', (e) => { e.preventDefault(); posterPreview.classList.add('dragging'); });
posterPreview.addEventListener('dragleave', () => posterPreview.classList.remove('dragging'));
posterPreview.addEventListener('drop', (e) => {
  e.preventDefault();
  posterPreview.classList.remove('dragging');
  usePosterFile(e.dataTransfer.files[0]);
});

// 저장할 때: 영화에 적을 포스터 값을 돌려주고, 직접 넣은 이미지는 창고에 저장해요
function commitPoster(id) {
  if (posterDraft && posterDraft.type === 'local') {
    posterCache[id] = posterDraft.data;
    posterDB.put({ id, data: posterDraft.data })
      .catch(() => alert('포스터를 저장하지 못했어요. 새로고침하면 포스터가 사라질 수 있어요.'));
    return 'local';
  }
  removePoster(id);
  return posterDraft ? posterDraft.value : '';
}
function removePoster(id) {
  delete posterCache[id];
  posterDB.remove(id).catch(() => {});
}

setPosterDraft(null);

// 처음 열 때 저장된 포스터 불러오기
posterDB.all()
  .then(list => {
    (list || []).forEach(p => { posterCache[p.id] = p.data; });
    if (!moviePanel.hidden) renderMovies();
    if (!document.getElementById('bookPanel').hidden) renderBooks();
  })
  .catch(() => {});

/* =========================================================
   13-2. BOOK 표지
   - 포스터 창고를 같이 써요 (책은 'book-번호' 이름으로 저장)
   - ✨ 표지 불러오기: ① 책 링크 페이지의 대표 이미지 → ② Google Books 검색
   ========================================================= */
const coverKey = (id) => 'book-' + id;
let coverDraft = null;      // { type:'url', value } 또는 { type:'local', data }

const coverPreview = document.getElementById('coverPreview');
const coverHint = document.getElementById('coverHint');
const coverClearBtn = document.getElementById('coverClearBtn');
const coverInput = document.getElementById('coverInput');
const coverFetchBtn = document.getElementById('coverFetchBtn');
const COVER_HINT = '💡 예스24 링크를 넣으면 표지가 가장 잘 불러와져요. 링크가 없으면 제목으로 찾아요. 표지 이미지를 복사해서 Ctrl+V 해도 돼요';

function coverOfBook(b) {
  if (b.cover === 'local') return posterCache[coverKey(b.id)] || '';
  return b.cover && /^https?:\/\//.test(b.cover) ? b.cover : '';
}
function draftFromBook(b) {
  if (b.cover === 'local') return posterCache[coverKey(b.id)] ? { type: 'local', data: posterCache[coverKey(b.id)] } : null;
  return coverOfBook(b) ? { type: 'url', value: b.cover } : null;
}

function setCoverDraft(draft, message) {
  coverDraft = draft;
  coverPreview.innerHTML = '';
  const src = draft ? (draft.type === 'local' ? draft.data : draft.value) : '';
  if (src) {
    const img = document.createElement('img');
    img.alt = '표지 미리보기';
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => {
      coverPreview.textContent = '⚠';
      coverHint.textContent = '이 이미지는 사이트에서 막아 두어 보여줄 수 없어요. 파일 올리기나 Ctrl+V를 써 주세요.';
    };
    img.src = src;
    coverPreview.appendChild(img);
  } else {
    coverPreview.textContent = '📕';
  }
  coverClearBtn.hidden = !draft;
  coverHint.textContent = message || COVER_HINT;
}

async function useCoverFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  coverHint.textContent = '표지를 정리하는 중…';
  try {
    const data = await resizeImage(file, 480);
    setCoverDraft({ type: 'local', data }, '✔ 표지를 넣었어요! 저장하기를 누르면 함께 저장돼요.');
  } catch (e) {
    setCoverDraft(coverDraft, '이 이미지는 열 수 없어요. JPG나 PNG 이미지로 다시 해 주세요.');
  }
}

// ① 책 링크 페이지에서 대표 이미지 찾기 (Microlink)
async function coverFromLink(url) {
  const res = await fetchWithTimeout('https://api.microlink.io/?url=' + encodeURIComponent(url));
  const json = await res.json();
  return (json && json.status === 'success' && json.data && json.data.image && normalizeUrl(json.data.image.url || '')) || '';
}
// 예스24 링크는 상품번호만 알면 표지 주소를 바로 만들 수 있어요 (다른 서비스가 필요 없어요)
function yes24Cover(url) {
  try {
    const u = new URL(url);
    if (!/(^|\.)yes24\.com$/.test(u.hostname)) return '';
    const m = u.pathname.match(/\/goods\/(?:detail\/)?(\d+)/i);
    return m ? `https://image.yes24.com/goods/${m[1]}/XL` : '';
  } catch (e) { return ''; }
}
// ③ Open Library(무료 공개 도서관 자료)에서 제목(+지은이)으로 표지 찾기
async function coverFromOpenLibrary(title, author) {
  const search = async (params) => {
    const res = await fetchWithTimeout('https://openlibrary.org/search.json?limit=10&fields=cover_i&' + params);
    if (!res.ok) throw new Error('openlibrary ' + res.status);
    const hit = ((await res.json()).docs || []).find(d => d.cover_i);
    return hit ? `https://covers.openlibrary.org/b/id/${hit.cover_i}-L.jpg` : '';
  };
  const t = 'title=' + encodeURIComponent(title);
  return (author && await search(t + '&author=' + encodeURIComponent(author))) || await search(t);
}
// 제목으로 찾기: Google Books → (안 되면) Open Library
async function coverFromTitle(title, author) {
  for (const [name, find] of [['Google Books', coverFromGoogle], ['Open Library', coverFromOpenLibrary]]) {
    try {
      const src = await find(title, author);
      if (src) return { src, name };
    } catch (e) { /* 이 서비스가 막혀 있으면 다음 서비스로 */ }
  }
  return null;
}
// ② Google Books에서 제목(+지은이)으로 표지 찾기
async function coverFromGoogle(title, author) {
  const search = async (q) => {
    const res = await fetchWithTimeout('https://www.googleapis.com/books/v1/volumes?maxResults=10&q=' + encodeURIComponent(q));
    if (!res.ok) throw new Error('google ' + res.status);
    const json = await res.json();
    const hit = (json.items || []).find(it => it.volumeInfo && it.volumeInfo.imageLinks);
    if (!hit) return '';
    const links = hit.volumeInfo.imageLinks;
    const src = (links.thumbnail || links.smallThumbnail || '').replace(/^http:/, 'https:').replace('&edge=curl', '');
    return normalizeUrl(src) || '';
  };
  return (author && await search(`intitle:${title} inauthor:${author}`)) || await search(`intitle:${title}`) || await search(title);
}

coverFetchBtn.addEventListener('click', async () => {
  const link = normalizeUrl(bLink.value);
  const title = bTitle.value.trim();
  if (!link && !title) { alert('먼저 책 제목이나 책 링크를 적어 주세요.'); bTitle.focus(); return; }
  coverFetchBtn.disabled = true;   // 두 번 눌러도 한 번만 찾아요
  try {
    if (link) {
      const y24 = yes24Cover(link);
      if (y24) { setCoverDraft({ type: 'url', value: y24 }, '✔ 예스24 링크에서 불러왔어요!'); return; }
      coverHint.textContent = '🔎 책 링크 페이지에서 표지를 찾는 중…';
      try {
        const src = await coverFromLink(link);
        if (src) { setCoverDraft({ type: 'url', value: src }, '✔ 책 링크에서 불러왔어요! 표지가 아니면 ✕ 지우기 후 다시 넣어 주세요.'); return; }
      } catch (e) { /* 아래 제목 검색으로 넘어가요 */ }
    }
    if (!title) { coverHint.textContent = '링크에서 표지를 찾지 못했어요. 책 제목을 적고 다시 눌러 보세요.'; return; }
    coverHint.textContent = '🔎 책 제목으로 표지를 찾는 중…';
    const found = await coverFromTitle(title, bAuthor.value.trim());
    if (found) setCoverDraft({ type: 'url', value: found.src }, `✔ ${found.name}에서 불러왔어요! 다른 책 표지면 ✕ 지우기 후 직접 넣어 주세요.`);
    else coverHint.textContent = '표지를 찾지 못했어요. 예스24 링크를 넣거나, 서점에서 표지를 복사해 Ctrl+V 해 주세요.';
  } catch (e) {
    coverHint.textContent = '지금은 표지를 불러오지 못했어요 (인터넷 연결이나 무료 횟수 문제일 수 있어요). 파일 올리기나 Ctrl+V를 써 주세요.';
  } finally {
    coverFetchBtn.disabled = false;
  }
});

document.getElementById('coverFileBtn').addEventListener('click', () => coverInput.click());
coverInput.addEventListener('change', () => { useCoverFile(coverInput.files[0]); coverInput.value = ''; });
coverClearBtn.addEventListener('click', () => setCoverDraft(null));

bookForm.addEventListener('paste', (e) => {
  const item = [...(e.clipboardData ? e.clipboardData.items : [])].find(i => i.type.startsWith('image/'));
  if (!item) return;
  e.preventDefault();
  useCoverFile(item.getAsFile());
});
coverPreview.addEventListener('dragover', (e) => { e.preventDefault(); coverPreview.classList.add('dragging'); });
coverPreview.addEventListener('dragleave', () => coverPreview.classList.remove('dragging'));
coverPreview.addEventListener('drop', (e) => {
  e.preventDefault();
  coverPreview.classList.remove('dragging');
  useCoverFile(e.dataTransfer.files[0]);
});

function commitBookCover(id) {
  if (coverDraft && coverDraft.type === 'local') {
    posterCache[coverKey(id)] = coverDraft.data;
    posterDB.put({ id: coverKey(id), data: coverDraft.data })
      .catch(() => alert('표지를 저장하지 못했어요. 새로고침하면 표지가 사라질 수 있어요.'));
    return 'local';
  }
  removeBookCover(id);
  return coverDraft ? coverDraft.value : '';
}
function removeBookCover(id) {
  delete posterCache[coverKey(id)];
  posterDB.remove(coverKey(id)).catch(() => {});
}

setCoverDraft(null);

/* =========================================================
   14. 감상문 읽기 창 + 글자 수 세기 (MOVIE, BOOK 공용)
   ========================================================= */
const reader = document.getElementById('reader');
let readerLastFocus = null;

function openReader({ kind, title, sub, text }) {
  readerLastFocus = document.activeElement;
  document.getElementById('readerKind').textContent = kind;
  document.getElementById('readerTitle').textContent = title;
  document.getElementById('readerSub').textContent = sub;
  const body = document.getElementById('readerText');
  body.textContent = text;
  reader.hidden = false;
  body.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  document.getElementById('readerClose').focus();
}
function closeReader() {
  reader.hidden = true;
  document.body.style.overflow = '';
  if (readerLastFocus && document.body.contains(readerLastFocus)) readerLastFocus.focus();
}
document.getElementById('readerClose').addEventListener('click', closeReader);
reader.addEventListener('click', (e) => { if (e.target === reader) closeReader(); });
document.addEventListener('keydown', (e) => { if (!reader.hidden && e.key === 'Escape') closeReader(); });

// 감상문 칸 오른쪽 아래에 글자 수를 보여 줘요
function updateCount(textarea) {
  const n = textarea.value.length;
  textarea.nextElementSibling.textContent = n ? `${n.toLocaleString()}자` : '';
}
document.querySelectorAll('textarea[data-count]').forEach(t => t.addEventListener('input', () => updateCount(t)));

/* =========================================================
   15. 영화 정보 자동 채우기 (위키데이터)
   위키데이터는 누구나 쓸 수 있는 무료 공개 정보 창고예요.
   영화 제목으로 찾아서 감독 · 주요 배우 · 장르를 채워 줘요.
   ========================================================= */
const autoHint = document.getElementById('autoHint');
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php?format=json&origin=*&';
// '영화'로 볼 수 있는 종류들 (영화, 장편, 애니메이션 영화, 다큐멘터리 영화, TV 영화, 단편 영화 등)
const FILM_TYPES = ['Q11424', 'Q24869', 'Q202866', 'Q93204', 'Q506240', 'Q24862', 'Q229390', 'Q20650540', 'Q17123180'];

// 위키데이터 장르 이름 → 내 장르 (위에서부터 먼저 맞는 것을 써요)
const GENRE_ALIASES = [
  ['블랙코미디', '블랙코미디'], ['로맨틱코미디', '로맨틱코미디'], ['멜로', '멜로'], ['로맨스', '로맨스'], ['코미디', '코미디'],
  ['스릴러', '스릴러'], ['미스터리', '미스터리'], ['공포', '공포'], ['호러', '공포'],
  ['범죄', '범죄'], ['갱스터', '범죄'], ['누아르', '범죄'], ['느와르', '범죄'],
  ['과학', 'SF'], ['sf', 'SF'], ['판타지', '판타지'], ['애니메이션', '애니메이션'], ['뮤지컬', '뮤지컬'], ['음악', '음악'],
  ['전쟁', '전쟁'], ['시대극', '역사'], ['사극', '역사'], ['역사', '역사'], ['전기', '전기'], ['서부', '서부'], ['스포츠', '스포츠'],
  ['다큐', '다큐'], ['가족', '가족'], ['성장', '성장'], ['모험', '어드벤처'], ['어드벤처', '어드벤처'], ['액션', '액션'],
  ['독립', '독립영화'], ['단편', '단편'], ['드라마', '드라마'],
  // 한국어 이름이 없어서 영어로 올 때
  ['blackcomedy', '블랙코미디'], ['romanticcomedy', '로맨틱코미디'], ['melodrama', '멜로'], ['romance', '로맨스'], ['comedy', '코미디'],
  ['thriller', '스릴러'], ['mystery', '미스터리'], ['horror', '공포'], ['crime', '범죄'], ['gangster', '범죄'], ['noir', '범죄'],
  ['sciencefiction', 'SF'], ['fantasy', '판타지'], ['animat', '애니메이션'], ['musical', '뮤지컬'], ['music', '음악'],
  ['war', '전쟁'], ['histor', '역사'], ['biograph', '전기'], ['western', '서부'], ['sport', '스포츠'], ['documentary', '다큐'],
  ['family', '가족'], ['comingofage', '성장'], ['adventure', '어드벤처'], ['action', '액션'], ['independent', '독립영화'],
  ['short', '단편'], ['drama', '드라마']
];
function mapGenres(labels) {
  const out = [];
  labels.forEach(label => {
    const n = label.toLowerCase().replace(/\s|영화|film/g, '');
    const hit = GENRE_ALIASES.find(([key]) => n.includes(key));
    if (hit && !out.includes(hit[1])) out.push(hit[1]);
  });
  return out.slice(0, GENRE_MAX);
}

async function wikidata(params) {
  const res = await fetchWithTimeout(WIKIDATA_API + new URLSearchParams(params));
  if (!res.ok) throw new Error('network');
  return res.json();
}
// 어떤 항목의 속성값(다른 항목 번호들)을 꺼내요. 예: P57 = 감독, P161 = 출연, P136 = 장르
const claimIds = (item, prop) => ((item.claims && item.claims[prop]) || [])
  .map(c => c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value && c.mainsnak.datavalue.value.id)
  .filter(Boolean);
const labelOf = (item) => (item && item.labels && (item.labels.ko || item.labels.en) || {}).value || '';

// 제목으로 '영화'인 항목 찾기 (한국어로 먼저, 없으면 영어로)
async function findFilm(title) {
  for (const lang of ['ko', 'en']) {
    const s = await wikidata({ action: 'wbsearchentities', search: title, language: lang, uselang: 'ko', type: 'item', limit: '10' });
    const ids = (s.search || []).map(x => x.id);
    if (!ids.length) continue;
    const e = await wikidata({ action: 'wbgetentities', ids: ids.join('|'), props: 'claims|labels|sitelinks', languages: 'ko|en', sitefilter: 'kowiki' });
    const items = ids.map(id => e.entities[id]).filter(Boolean);
    const film = items.find(it => claimIds(it, 'P31').some(t => FILM_TYPES.includes(t))) || items.find(it => claimIds(it, 'P57').length);
    if (film) return film;
  }
  return null;
}

async function autoFillFromWikidata() {
  const title = mTitle.value.trim();
  autoHint.hidden = false;
  if (!title) { autoHint.textContent = '영화 제목을 먼저 적어 주세요!'; mTitle.focus(); return; }
  autoHint.textContent = '🔎 위키데이터에서 찾는 중…';
  try {
    const film = await findFilm(title);
    if (!film) {
      autoHint.textContent = `'${title}'을(를) 찾지 못했어요. 띄어쓰기까지 정확한 제목이나 원제(영어)로 다시 해 보거나, 직접 적어 주세요.`;
      return;
    }
    // 감독(최대 3) · 출연(최대 6) · 장르의 이름을 한꺼번에 받아와요
    const dirIds = claimIds(film, 'P57').slice(0, 3);
    const castIds = claimIds(film, 'P161').slice(0, 6);
    const genreIds = claimIds(film, 'P136').slice(0, 10);
    const all = [...new Set([...dirIds, ...castIds, ...genreIds])];
    const labels = {};
    if (all.length) {
      const r = await wikidata({ action: 'wbgetentities', ids: all.join('|'), props: 'labels', languages: 'ko|en' });
      all.forEach(id => { labels[id] = labelOf(r.entities[id]); });
    }
    const names = (ids) => ids.map(id => labels[id]).filter(Boolean);
    const directors = names(dirIds);
    const cast = names(castIds);
    const genres = mapGenres(names(genreIds));

    // 칸 채우기 (링크 칸이 비어 있으면 한국어 위키백과 주소도)
    applyMovieInfo({
      directors, cast, genres,
      link: film.sitelinks && film.sitelinks.kowiki
        ? 'https://ko.wikipedia.org/wiki/' + encodeURIComponent(film.sitelinks.kowiki.title.replace(/ /g, '_')) : ''
    });

    const time = film.claims && film.claims.P577 && film.claims.P577[0].mainsnak.datavalue;
    const year = time ? time.value.time.slice(1, 5) : '';
    const missing = [!directors.length && '감독', !cast.length && '배우', !genres.length && '장르'].filter(Boolean);
    autoHint.textContent = `✔ '${labelOf(film)}${year ? ` (${year})` : ''}' 정보를 채웠어요.`
      + (missing.length ? ` (${missing.join('·')} 정보는 없어서 직접 적어 주세요)` : '')
      + ' 다른 영화라면 제목을 더 정확히 적어 주세요.';
  } catch (e) {
    autoHint.textContent = e.name === 'AbortError'
      ? '⏳ 위키데이터가 지금 응답이 느려요. 잠시 후 다시 눌러 주세요.'
      : '정보를 불러오지 못했어요. 인터넷 연결을 확인하거나, 직접 적어 주세요.';
  }
}
document.getElementById('mAutoBtn').addEventListener('click', autoFillMovie);

/* 불러온 정보를 쓰기 칸에 채워요 (TMDB·위키데이터 공용)
   이미 적어 둔 감독·배우·포스터가 있으면 바꿀지 먼저 물어봐요. force = 묻지 않고 바꾸기 */
function applyMovieInfo(info, force) {
  const directors = info.directors || [], cast = info.cast || [], genres = info.genres || [];
  const already = (mDirector.value.trim() && directors.length) || (mActors.value.trim() && cast.length) || (posterDraft && info.poster);
  const overwrite = force || !already || confirm('이미 적어 둔 감독·배우·포스터를 불러온 정보로 바꿀까요?');
  if (directors.length && (overwrite || !mDirector.value.trim())) mDirector.value = directors.join(', ');
  if (cast.length && (overwrite || !mActors.value.trim())) mActors.value = cast.join(', ');
  if (genres.length && (overwrite || !movieGenres.length)) setGenres(genres);
  if (info.link && (force || !mLink.value.trim())) mLink.value = info.link;
  if (info.poster && (overwrite || !posterDraft)) setPosterDraft({ type: 'url', value: info.poster }, '✔ 포스터도 불러왔어요! 다른 걸 원하면 ✕ 지우기 후 직접 넣어 주세요.');
}

/* =========================================================
   16. TMDB (세계 최대 공개 영화 정보 서비스)
   - API 키는 코드에 적지 않고, 이 브라우저에만 'gip_tmdb_key'로 저장해요.
   - 키가 있으면 TMDB를 먼저 쓰고, 못 찾으면 위키데이터로 넘어가요.
   ========================================================= */
const TMDB_API = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';
const HANGUL = /[가-힣]/;
const tmdbKey = () => store.get('gip_tmdb_key', '').trim();

// TMDB에 묻기 ('API 읽기 액세스 토큰'은 eyJ로 시작하고, 'API 키'는 32글자예요. 둘 다 돼요)
async function tmdbFetch(path, params = {}) {
  const key = tmdbKey();
  const isToken = key.startsWith('eyJ');
  const q = new URLSearchParams(params);
  if (!isToken) q.set('api_key', key);
  const res = await fetchWithTimeout(`${TMDB_API}${path}?${q}`, 15000,
    isToken ? { headers: { Authorization: 'Bearer ' + key } } : {});
  if (res.status === 401) { const err = new Error('키가 맞지 않아요'); err.name = 'KeyError'; throw err; }
  if (!res.ok) throw new Error('TMDB ' + res.status);
  return res.json();
}

// 사람 이름을 한국어로 (TMDB에 한국어 이름이 없으면 원래 이름 그대로)
async function koreanName(person) {
  if (HANGUL.test(person.name)) return person.name;
  try {
    const p = await tmdbFetch(`/person/${person.id}`, { language: 'ko-KR' });
    if (HANGUL.test(p.name)) return p.name;
    return (p.also_known_as || []).find(n => HANGUL.test(n)) || person.name;
  } catch (e) { return person.name; }
}

// 제목으로 찾기: 제목이 똑같은 영화를 먼저, 그다음은 많이 알려진 순서로
async function tmdbSearch(title) {
  const r = await tmdbFetch('/search/movie', { query: title, language: 'ko-KR', include_adult: 'false' });
  const norm = (s) => (s || '').replace(/\s/g, '').toLowerCase();
  const same = (m) => norm(m.title) === norm(title) || norm(m.original_title) === norm(title);
  return (r.results || []).slice(0, 10)
    .sort((a, b) => (same(b) - same(a)) || ((b.popularity || 0) - (a.popularity || 0)));
}
const yearOf = (m) => (m.release_date || '').slice(0, 4);

// 영화 한 편의 자세한 정보(감독·배우·장르·포스터)를 가져와 칸에 채워요
async function fillFromTmdb(id, force) {
  const d = await tmdbFetch(`/movie/${id}`, { language: 'ko-KR', append_to_response: 'credits' });
  const crew = (d.credits && d.credits.crew) || [];
  const dirs = crew.filter(c => c.job === 'Director').slice(0, 3);
  const cast = ((d.credits && d.credits.cast) || []).slice(0, 6);
  const names = await Promise.all([...dirs, ...cast].map(koreanName));
  applyMovieInfo({
    directors: names.slice(0, dirs.length),
    cast: names.slice(dirs.length),
    genres: mapGenres((d.genres || []).map(g => g.name)),
    poster: d.poster_path ? TMDB_IMG + d.poster_path : '',
    link: `https://www.themoviedb.org/movie/${d.id}?language=ko`
  }, force);
  autoHint.textContent = `✔ TMDB에서 '${d.title}${yearOf(d) ? ` (${yearOf(d)})` : ''}' 정보를 채웠어요.`
    + (dirs.length ? '' : ' (감독 정보는 없어요)');
  return d;
}

// "혹시 이 영화인가요?" 다른 후보 보여 주기
const tmdbCandidates = document.getElementById('tmdbCandidates');
function showCandidates(list, currentId) {
  const others = list.filter(m => m.id !== currentId).slice(0, 5);
  tmdbCandidates.innerHTML = '';
  tmdbCandidates.hidden = !others.length;
  if (!others.length) return;
  const label = document.createElement('span');
  label.textContent = '다른 영화인가요?';
  tmdbCandidates.appendChild(label);
  others.forEach(m => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cand-btn';
    b.textContent = `${m.title}${yearOf(m) ? ` (${yearOf(m)})` : ''}`;
    b.addEventListener('click', async () => {
      autoHint.textContent = '🔎 불러오는 중…';
      try {
        mTitle.value = m.title;
        await fillFromTmdb(m.id, true);   // 후보를 바꿀 때는 묻지 않고 바꿔요
        showCandidates(list, m.id);
      } catch (e) { autoHint.textContent = '불러오지 못했어요. 잠시 후 다시 눌러 주세요.'; }
    });
    tmdbCandidates.appendChild(b);
  });
}

// ✨ 정보 자동 채우기: 끝날 때까지 버튼을 잠가서, 두 번 눌러도 섞이지 않게 해요
async function autoFillMovie() {
  const btn = document.getElementById('mAutoBtn');
  if (btn.disabled) return;
  btn.disabled = true;
  try { await autoFillSteps(); } finally { btn.disabled = false; }
}
// TMDB 키가 있으면 TMDB 먼저, 아니면(또는 못 찾으면) 위키데이터
async function autoFillSteps() {
  tmdbCandidates.hidden = true;
  if (!tmdbKey()) return autoFillFromWikidata();
  const title = mTitle.value.trim();
  autoHint.hidden = false;
  if (!title) { autoHint.textContent = '영화 제목을 먼저 적어 주세요!'; mTitle.focus(); return; }
  autoHint.textContent = '🔎 TMDB에서 찾는 중…';
  try {
    const list = await tmdbSearch(title);
    if (!list.length) return autoFillFromWikidata();
    const d = await fillFromTmdb(list[0].id, false);
    showCandidates(list, d.id);
  } catch (e) {
    if (e.name === 'KeyError') { autoHint.textContent = '🔑 TMDB 키가 맞지 않아요. 위의 ⚙ TMDB 버튼을 눌러 다시 넣어 주세요.'; return; }
    return autoFillFromWikidata(); // TMDB에 연결이 안 되면 위키데이터로
  }
}

/* TMDB 연결 상자 */
const tmdbBox = document.getElementById('tmdbBox');
const tmdbToggle = document.getElementById('tmdbToggle');
const tmdbKeyInput = document.getElementById('tmdbKeyInput');
const tmdbMsg = document.getElementById('tmdbMsg');

function refreshTmdbToggle() {
  const on = !!tmdbKey();
  tmdbToggle.textContent = on ? '⚙ TMDB 연결됨 ✓' : '⚙ TMDB 연결하기';
  tmdbToggle.classList.toggle('on', on);
}
tmdbToggle.addEventListener('click', () => {
  tmdbBox.hidden = !tmdbBox.hidden;
  tmdbKeyInput.value = '';
  tmdbMsg.textContent = tmdbKey() ? '지금 연결되어 있어요. 키를 바꾸려면 새 키를 붙여 넣으세요.' : '';
  if (!tmdbBox.hidden) tmdbKeyInput.focus();
});
document.getElementById('tmdbCloseBtn').addEventListener('click', () => { tmdbBox.hidden = true; });
document.getElementById('tmdbRemoveBtn').addEventListener('click', () => {
  store.set('gip_tmdb_key', '');
  refreshTmdbToggle();
  tmdbMsg.textContent = '연결을 끊었어요. 이제 자동 채우기는 위키데이터만 써요.';
});
document.getElementById('tmdbSaveBtn').addEventListener('click', async () => {
  const key = tmdbKeyInput.value.trim();
  if (!key) { tmdbMsg.textContent = '키를 먼저 붙여 넣어 주세요.'; return; }
  const prev = tmdbKey();
  store.set('gip_tmdb_key', key);
  tmdbMsg.textContent = '🔎 키가 맞는지 확인하는 중…';
  try {
    await tmdbFetch('/configuration');   // 키가 맞으면 답이 와요
    tmdbKeyInput.value = '';
    refreshTmdbToggle();
    tmdbMsg.textContent = '✔ 연결됐어요! 이제 ✨ 정보 자동 채우기가 TMDB를 먼저 써요.';
    setTimeout(() => { tmdbBox.hidden = true; }, 1800);
  } catch (e) {
    store.set('gip_tmdb_key', prev);   // 실패하면 예전 상태로 되돌려요
    refreshTmdbToggle();
    tmdbMsg.textContent = e.name === 'KeyError'
      ? '🔑 키가 맞지 않아요. 앞뒤 빈칸 없이 키 전체를 복사했는지 확인해 주세요.'
      : '확인하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.';
  }
});
refreshTmdbToggle();

/* =========================================================
   17. GUEST (방명록) + 도란도란 (한 줄 남기기)
   - 온라인 연결: 'guestbook' 표에 모여서 모든 방문자가 함께 봐요.
     누구나 남길 수 있고, 답글·지우기는 주인장만 할 수 있어요.
   - 연결 전: 이 브라우저 안에만 저장돼요 ('gip_guest', 'gip_ilchon').
   ========================================================= */
const GB = CLOUD ? CLOUD.guestbook : null;
const MINIMI = [
  { h: '#6b5442', b: '#8fb6dd' }, { h: '#3a2f28', b: '#e98b84' }, { h: '#c2873f', b: '#93c6a3' },
  { h: '#8a5a44', b: '#9f92bd' }, { h: '#2f3550', b: '#e8be78' }
];
const minimiSVG = (i) => pixelSVG(avatarMap, { ...avatarColors, ...(MINIMI[i] || MINIMI[0]) });
const GUEST_PER_PAGE = 5;
const OWNER_NAME = 'Gip';

let guests = GB ? [] : loadJSON('gip_guest', []);   // [{ id(남긴 시각), dbId, no, name, text, minimi, reply }]
function saveGuests() { store.set('gip_guest', JSON.stringify(guests)); }
let guestPage = 1;
let minimiChoice = 0;

const guestForm = document.getElementById('guestForm');
const guestList = document.getElementById('guestList');
const gName = document.getElementById('gName');
const gText = document.getElementById('gText');
const minimiPick = document.getElementById('minimiPick');

// 미니미 고르기 (색이 다른 다섯 친구)
MINIMI.forEach((m, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'minimi-btn';
  b.setAttribute('role', 'radio');
  b.setAttribute('aria-label', `미니미 ${i + 1}`);
  b.innerHTML = minimiSVG(i);
  b.addEventListener('click', () => { minimiChoice = i; markMinimi(); });
  minimiPick.appendChild(b);
});
function markMinimi() {
  [...minimiPick.children].forEach((b, i) => {
    b.classList.toggle('on', i === minimiChoice);
    b.setAttribute('aria-checked', i === minimiChoice);
  });
}
markMinimi();
gName.value = store.get('gip_guest_name', '');   // 지난번에 쓴 이름을 기억해요

const stamp = (ms) => { const d = new Date(ms); return dot(ymd(d)) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

function renderGuest() {
  const list = [...guests].sort((a, b) => b.id - a.id);
  guestList.innerHTML = '';
  if (!list.length) {
    const empty = document.createElement('li');
    empty.className = 'diary-empty';
    empty.textContent = '아직 방명록이 비어 있어요. 첫 발자국을 남겨 주세요 🐾';
    guestList.appendChild(empty);
  }
  const totalPages = Math.max(1, Math.ceil(list.length / GUEST_PER_PAGE));
  guestPage = Math.min(Math.max(guestPage, 1), totalPages);
  renderPager(document.getElementById('guestPager'), guestPage, totalPages, (p) => {
    guestPage = p; renderGuest();
    if (guestList.getBoundingClientRect().top < 0) guestList.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  list.slice((guestPage - 1) * GUEST_PER_PAGE, guestPage * GUEST_PER_PAGE).forEach(g => {
    const li = document.createElement('li');
    li.className = 'guest-item';
    li.innerHTML = `
      <div class="guest-head">
        <span class="guest-no"></span><b class="guest-name"></b><span class="guest-date"></span>
        <span class="guest-acts">
          <button type="button" class="guest-act" data-act="reply"></button>
          <button type="button" class="guest-act" data-act="del">삭제</button>
        </span>
      </div>
      <div class="guest-body">
        <div class="guest-minimi" aria-hidden="true"></div>
        <p class="guest-text"></p>
      </div>`;
    li.querySelector('.guest-no').textContent = 'No.' + g.no;
    li.querySelector('.guest-name').textContent = g.name;
    li.querySelector('.guest-date').textContent = stamp(g.id);
    li.querySelector('.guest-minimi').innerHTML = minimiSVG(g.minimi);
    li.querySelector('.guest-text').textContent = g.text;
    const replyBtn = li.querySelector('[data-act="reply"]');
    replyBtn.textContent = g.reply ? '답글 고치기' : '답글';
    if (g.reply) {
      const r = document.createElement('p');
      r.className = 'guest-reply';
      const who = document.createElement('b'); who.textContent = OWNER_NAME;
      const txt = document.createElement('span'); txt.textContent = g.reply;
      r.append('└ ', who, ' ', txt);
      li.appendChild(r);
    }
    replyBtn.addEventListener('click', async () => {
      if (!canEdit()) return;
      const text = prompt(`${g.name}님께 남길 주인장 답글 (지우려면 비워 두세요)`, g.reply || '');
      if (text === null) return;
      const reply = text.trim().slice(0, 150);
      if (GB) {
        try { await GB.reply(g.dbId, reply); } catch (e) { alert('답글을 저장하지 못했어요. 잠시 후 다시 해 주세요.'); return; }
        reloadGuestbook();
        return;
      }
      g.reply = reply;
      saveGuests(); renderGuest();
    });
    li.querySelector('[data-act="del"]').addEventListener('click', async () => {
      if (!canEdit()) return;
      if (!confirm(`${g.name}님의 방명록을 지울까요?`)) return;
      if (GB) {
        try { await GB.remove(g.dbId); } catch (e) { alert('지우지 못했어요. 잠시 후 다시 해 주세요.'); return; }
        reloadGuestbook();
        return;
      }
      guests = guests.filter(x => x.id !== g.id);
      saveGuests(); renderGuest(); updateHomeGuest();
    });
    guestList.appendChild(li);
  });
}

guestForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = gName.value.trim(), text = gText.value.trim();
  if (!name || !text) return;
  if (GB) {
    const btn = guestForm.querySelector('button[type="submit"]');
    btn.disabled = true;   // 두 번 눌러도 한 번만 남겨요
    try {
      await GB.add({ kind: 'guest', name, text, minimi: minimiChoice });
      store.set('gip_guest_name', name);
      gText.value = '';
      guestPage = 1;
      await reloadGuestbook();
    } catch (err) {
      alert('방명록을 남기지 못했어요. 잠시 후 다시 해 주세요.');
    } finally { btn.disabled = false; }
    return;
  }
  const no = guests.reduce((n, g) => Math.max(n, g.no), 0) + 1;
  guests.push({ id: Date.now(), no, name, text, minimi: minimiChoice, reply: '' });
  store.set('gip_guest_name', name);
  saveGuests();
  gText.value = '';
  guestPage = 1;
  renderGuest();
  updateHomeGuest();
});

// 방명록은 Updated news(내가 쓴 기록만)에 올리지 않고, My room의 숫자와 N 뱃지로만 알려요
function updateHomeGuest() {
  const latest = [...guests].sort((a, b) => b.id - a.id)[0];
  document.getElementById('guestCount').textContent = guests.length;
  document.getElementById('guestNew').hidden = !(latest && isRecent(latest.id));
}
updateHomeGuest();

/* 도란도란: 한 줄 남기기 (HOME 미니룸 아래) */
let ilchons = GB ? [] : loadJSON('gip_ilchon', []);   // [{ id(남긴 시각), dbId, name, text }]
function saveIlchons() { store.set('gip_ilchon', JSON.stringify(ilchons)); }
const ILCHON_SHOW = 5;
let ilchonOpen = false;
const ilchonList = document.getElementById('ilchonList');
const ilchonMore = document.getElementById('ilchonMore');
const iName = document.getElementById('iName');
const iText = document.getElementById('iText');
iName.value = store.get('gip_guest_name', '');

function renderIlchon() {
  const list = [...ilchons].sort((a, b) => b.id - a.id);
  ilchonList.innerHTML = '';
  if (!list.length) {
    const li = document.createElement('li');
    li.className = 'ilchon-empty';
    li.textContent = '아직 조용해요. 첫 발도장을 남겨 주세요 🐾';
    ilchonList.appendChild(li);
  }
  (ilchonOpen ? list : list.slice(0, ILCHON_SHOW)).forEach(c => {
    const li = document.createElement('li');
    li.innerHTML = '<span class="ilchon-text"></span><span class="ilchon-who"></span><span class="ilchon-date"></span><button type="button" class="ilchon-del">✕</button>';
    li.querySelector('.ilchon-text').textContent = c.text;
    li.querySelector('.ilchon-who').textContent = `(${c.name})`;
    li.querySelector('.ilchon-date').textContent = dot(ymd(new Date(c.id))).slice(2);
    const del = li.querySelector('.ilchon-del');
    del.setAttribute('aria-label', `${c.name}님의 한 줄 지우기`);
    del.addEventListener('click', async () => {
      if (!canEdit()) return;
      if (!confirm('이 한 줄을 지울까요?')) return;
      if (GB) {
        try { await GB.remove(c.dbId); } catch (e) { alert('지우지 못했어요. 잠시 후 다시 해 주세요.'); return; }
        reloadGuestbook();
        return;
      }
      ilchons = ilchons.filter(x => x.id !== c.id);
      saveIlchons(); renderIlchon();
    });
    ilchonList.appendChild(li);
  });
  ilchonMore.hidden = list.length <= ILCHON_SHOW;
  ilchonMore.textContent = ilchonOpen ? '접기 ▴' : `더 보기 (${list.length - ILCHON_SHOW}개) ▾`;
}
ilchonMore.addEventListener('click', () => { ilchonOpen = !ilchonOpen; renderIlchon(); });
document.getElementById('ilchonForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = iName.value.trim(), text = iText.value.trim();
  if (!name || !text) return;
  if (GB) {
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await GB.add({ kind: 'chat', name, text });
      store.set('gip_guest_name', name);
      iText.value = '';
      await reloadGuestbook();
    } catch (err) {
      alert('남기지 못했어요. 잠시 후 다시 해 주세요.');
    } finally { btn.disabled = false; }
    return;
  }
  ilchons.push({ id: Date.now(), name, text });
  store.set('gip_guest_name', name);
  saveIlchons();
  iText.value = '';
  renderIlchon();
});
renderIlchon();

// 온라인 연결: 방명록·도란도란을 온라인 저장소에서 불러와요
async function reloadGuestbook() {
  if (!GB) return;
  try {
    const rows = await GB.list();   // 오래된 것부터
    let no = 0;
    guests = rows.filter(r => r.kind === 'guest').map(r => ({
      id: Date.parse(r.created_at), dbId: r.id, no: ++no, name: r.name, text: r.text, minimi: r.minimi, reply: r.reply || ''
    }));
    ilchons = rows.filter(r => r.kind === 'chat').map(r => ({ id: Date.parse(r.created_at), dbId: r.id, name: r.name, text: r.text }));
  } catch (e) {
    console.warn('방명록을 불러오지 못했어요', e);
  }
  renderIlchon();
  updateHomeGuest();
  if (!guestPanel.hidden) renderGuest();
}
reloadGuestbook();

/* =========================================================
   18. BGM에 내 음악 파일 넣기
   음악 파일은 창고(IndexedDB) 'music' 칸에 저장해요.
   ========================================================= */
const musicDB = makeStore('music');
const musicInput = document.getElementById('musicInput');
const MUSIC_MAX_MB = 40;

document.getElementById('musicAddBtn').addEventListener('click', () => musicInput.click());
musicInput.addEventListener('change', async () => {
  const files = [...musicInput.files];
  musicInput.value = '';
  const big = files.filter(f => f.size > MUSIC_MAX_MB * 1024 * 1024);
  const ok = files.filter(f => f.size <= MUSIC_MAX_MB * 1024 * 1024 && (f.type.startsWith('audio/') || /\.(mp3|m4a|ogg|wav|aac|flac)$/i.test(f.name)));
  if (big.length) alert(`${MUSIC_MAX_MB}MB가 넘는 파일은 넣을 수 없어요: ${big.map(f => f.name).join(', ')}`);
  if (!ok.length) return;
  const firstNew = playlist().length;
  for (const f of ok) {
    const item = { id: Date.now() + Math.random(), title: f.name.replace(/\.[^.]+$/, '').slice(0, 40), blob: f };
    try {
      await musicDB.put(item);
      myMusic.push(item);
    } catch (e) {
      alert(`'${f.name}'을(를) 저장하지 못했어요. 브라우저 저장 공간이 부족할 수 있어요.`);
    }
  }
  renderTrackOptions();
  if (playlist().length > firstNew) selectTrack(firstNew);   // 새로 넣은 첫 곡을 골라 둬요
});

musicDelBtn.addEventListener('click', () => {
  const item = playlist()[current];
  if (!item || item.kind !== 'file') return;
  if (!confirm(`'${item.m.title}'을(를) 곡 목록에서 뺄까요?`)) return;
  const wasPlaying = playing;
  stop();
  bgmAudio.removeAttribute('src');
  if (item.m.url) URL.revokeObjectURL(item.m.url);
  myMusic = myMusic.filter(m => m !== item.m);
  musicDB.remove(item.m.id).catch(() => {});
  current = Math.min(current, playlist().length - 1);
  renderTrackOptions();
  selectTrack(current);
  if (wasPlaying) start();
});

musicDB.all()
  .then(list => {
    myMusic = (list || []).sort((a, b) => a.id - b.id);
    renderTrackOptions();
  })
  .catch(() => {});
