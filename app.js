'use strict';
/* =====================================================
   아주팟 데모 v0.3 — 단일 페이지, 데이터는 JS 객체 + localStorage
   ===================================================== */

const MIN = 6e4, HOUR = 36e5, DAYMS = 864e5;
const STORE = 'ajoupot-demo-v3';

/* ---------- 장소 ---------- */
const PLACES = {
  gate:      { name: '아주대 정문',        lat: 37.2796, lng: 127.0438 },
  yulgok:    { name: '아주대 율곡관',      lat: 37.2833, lng: 127.0447 },
  paldal:    { name: '아주대 팔달관',      lat: 37.2841, lng: 127.0441 },
  samgeori:  { name: '아주대삼거리',       lat: 37.2766, lng: 127.0439 },
  suwon:     { name: '수원역',             lat: 37.2660, lng: 126.9997 },
  suwon4:    { name: '수원역 4번 출구',    lat: 37.2655, lng: 127.0016 },
  seryu:     { name: '세류역',             lat: 37.2449, lng: 127.0136 },
  gwanggyo:  { name: '광교중앙역',         lat: 37.2886, lng: 127.0517 },
  yeongtong: { name: '영통역',             lat: 37.2516, lng: 127.0714 },
  mangpo:    { name: '망포역',             lat: 37.2456, lng: 127.0574 },
  ingye:     { name: '인계동 (수원시청역)', lat: 37.2614, lng: 127.0306 },
  lake:      { name: '광교호수공원',       lat: 37.2836, lng: 127.0654 },
  worldcup:  { name: '수원월드컵경기장',   lat: 37.2865, lng: 127.0369 },
  goyang:    { name: '고양종합운동장',     lat: 37.6765, lng: 126.7429 },
  kspo:      { name: 'KSPO DOME (올림픽공원)', lat: 37.5196, lng: 127.1272 },
};
const QUICK = ['gate', 'yulgok', 'suwon', 'gwanggyo'];

const PEOPLE = [
  { nick: '수원역지박령',   dept: '경영학과',       year: '22', manner: 38.2 },
  { nick: '율곡관올빼미',   dept: '소프트웨어학과', year: '21', manner: 41.0 },
  { nick: '광교러버',       dept: '기계공학과',     year: '22', manner: 37.1 },
  { nick: '택시비절약왕',   dept: '경제학과',       year: '23', manner: 36.9 },
  { nick: '막차놓친공대생', dept: '전자공학과',     year: '20', manner: 39.4 },
  { nick: '비오는날싫어',   dept: '심리학과',       year: '24', manner: 36.5 },
  { nick: '시험끝났다',     dept: '화학공학과',     year: '21', manner: 40.2 },
  { nick: '콘서트가즈아',   dept: '미디어학과',     year: '23', manner: 42.3 },
  { nick: '1교시전사',      dept: '산업공학과',     year: '22', manner: 37.8 },
];
const AVATARS = ['🐻', '🦉', '🐱', '🐯', '🦊', '🐶', '🐼', '🐨', '🐹'];

const DAY = ['일', '월', '화', '수', '목', '금', '토'];
const TODAY_PLAN = [
  { t: '10:30–11:45', name: '경영정보시스템', where: '다산관' },
  { t: '15:00–16:15', name: '데이터베이스', where: '팔달관' },
  { t: '21:00–22:30', name: '알고리즘 기말고사', where: '팔달관 407', exam: true },
];
const TIMETABLE = {
  1: [['10:30', '경영정보시스템']], 2: [['09:00', '미디어와사회'], ['15:00', '데이터베이스']],
  3: [['10:30', '경영정보시스템']], 4: [['09:00', '미디어와사회'], ['15:00', '데이터베이스']],
  5: [['21:00', '알고리즘 기말', true]],
};
const BUS = {
  stop: '아주대학교입구',
  arrivals: [
    { no: '13-4', to: '수원역', every: 12, off: 4 },
    { no: '720-2', to: '수원역', every: 15, off: 9 },
    { no: '202', to: '광교중앙역', every: 10, off: 6 },
    { no: '7-2', to: '영통역', every: 14, off: 2 },
  ],
  last: [{ to: '수원역 방면', time: '22:40' }, { to: '광교중앙역 방면', time: '23:10' }, { to: '영통역 방면', time: '23:25' }],
};
const CANNED = ['넵 좋아요!', '저 5분 안에 도착해요 🏃', '정문 편의점 앞에 있을게요', '우산 꼭 챙기세요 ☔', '확인했습니다 👍', '오늘 잘 부탁드려요!'];

/* ---------- 유틸 ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const won = n => Math.round(n).toLocaleString('ko-KR') + '원';
const pad = n => String(n).padStart(2, '0');
const ceil10 = n => Math.ceil(n / 10) * 10;
const perPerson = (fare, n) => ceil10(fare / Math.max(1, n));

function distKm(a, b) {
  const R = 6371, r = x => x * Math.PI / 180;
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
// 직선거리 기반 추정 (도로 거리를 아직 못 받았을 때)
const estRoadKm = (a, b) => { const d = distKm(a, b); return Math.max(0.5, d * (d > 15 ? 1.25 : 1.4)); };
// 실제 도로 거리(OSRM, map.js 캐시)가 있으면 그걸 쓰고, 없으면 추정값
const roadKm = (a, b) => { const r = cachedRoadKm(a, b); return r == null ? estRoadKm(a, b) : Math.max(0.5, r); };
function fareForKm(km, ts) {
  let fare = 4800;
  if (km > 1.6) fare += Math.ceil((km - 1.6) * 1000 / 131) * 100;
  fare *= 1.2; // 시간요금·신호대기 보정
  const h = new Date(ts || Date.now()).getHours();
  const night = h >= 22 || h < 4;
  if (night) fare *= 1.2;
  return { fare: Math.round(fare / 100) * 100, night };
}
function estimateRoute(pts, ts) {
  let km = 0; for (let i = 1; i < pts.length; i++) km += roadKm(pts[i - 1], pts[i]);
  const { fare, night } = fareForKm(km, ts);
  const minutes = Math.round(km / (km > 20 ? 45 : 24) * 60) + 3;
  return { km, fare, minutes, night };
}
const points = p => [p.from, ...(p.stops || []), p.to];
const podEst = p => estimateRoute(points(p), departOf(p));

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); }
function hm(ts) { const d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
function fmtWhen(ts) {
  const d = new Date(ts);
  const dd = Math.round((startOfDay(d) - startOfDay(Date.now())) / DAYMS);
  if (dd === 0) return '오늘 ' + hm(ts);
  if (dd === 1) return '내일 ' + hm(ts);
  if (dd === -1) return '어제 ' + hm(ts);
  return `${d.getMonth() + 1}/${d.getDate()}(${DAY[d.getDay()]}) ${hm(ts)}`;
}
function fmtDate(ts) { const d = new Date(ts); return `${d.getMonth() + 1}/${d.getDate()}(${DAY[d.getDay()]})`; }
function fmtLeft(ts) {
  const diff = ts - Date.now();
  if (diff < 0) return '출발 시간 지남';
  const m = Math.round(diff / MIN);
  if (m < 1) return '곧 출발';
  if (m < 60) return `${m}분 후 출발`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 ${m % 60}분 후`;
  return `${Math.floor(h / 24)}일 후`;
}
function nextOcc(days, time) {
  const [hh, mm] = time.split(':').map(Number);
  for (let i = 0; i < 8; i++) {
    const d = new Date(); d.setDate(d.getDate() + i); d.setHours(hh, mm, 0, 0);
    if (days.includes(d.getDay()) && d.getTime() > Date.now()) return d.getTime();
  }
  return Date.now() + DAYMS;
}
const departOf = p => p.type === 'regular' ? nextOcc(p.days, p.time) : p.departAt;
const daysLabel = days => [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map(d => DAY[d]).join('·');
const toLocalInput = ts => { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${hm(ts)}`; };
const avatarOf = nick => AVATARS[[...nick].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATARS.length];
const roundTo5 = ts => Math.round(ts / (5 * MIN)) * 5 * MIN;

/* ---------- 상태 ---------- */
function nextWeekday(wd, h, m) {
  const d = new Date(); d.setHours(h, m, 0, 0);
  let add = (wd - d.getDay() + 7) % 7; if (add === 0) add = 7;
  d.setDate(d.getDate() + add); return d.getTime();
}

function seed() {
  const now = Date.now();
  const at = min => roundTo5(now + min * MIN);
  let n = 0;
  const mk = o => {
    const p = { id: 'p' + (++n), type: 'once', max: 4, minPeople: 2, memo: '', options: {}, status: 'open', split: 'equal', ...o };
    p.from = { ...PLACES[o.f] }; p.to = { ...PLACES[o.t] }; p.stops = (o.s || []).map(k => ({ ...PLACES[k] }));
    delete p.f; delete p.t; delete p.s;
    const per = perPerson(podEst(p).fare, p.max);
    const last = p.stops.length + 1;
    p.members = o.m.map((i, k) => ({ ...PEOPLE[i], paid: per, drop: o.drops ? o.drops[k] : last }));
    delete p.m; delete p.drops;
    p.host = p.members[0].nick;
    p.chat = [{ sys: true, text: `${p.host}님이 팟을 만들었어요` }];
    if (p.members[1]) p.chat.push({ nick: p.members[1].nick, text: CANNED[p.id.length % CANNED.length] });
    return p;
  };
  const examEnd = new Date(); examEnd.setHours(22, 50, 0, 0);
  const examAt = examEnd.getTime() > now + 30 * MIN ? examEnd.getTime() : at(150);
  const ev1 = nextWeekday(6, 18, 0), ev2 = nextWeekday(0, 14, 0), ev3 = nextWeekday(5, 19, 0);

  const pods = [
    mk({ f: 'gate', t: 'suwon', departAt: at(7), nowPod: true, m: [0, 5, 8], memo: '정문 버스정류장 앞에서 만나요! 우산 쓰고 있어요 ☂️', rec: { type: 'rain', text: '☔ 비 오는 날 · 즐겨찾는 경로 (학교 → 수원역)' } }),
    mk({ f: 'yulgok', t: 'suwon4', departAt: at(40), m: [1, 3, 6], memo: '율곡관 1층 로비에서 출발', rec: { type: 'route', text: '⭐ 즐겨찾는 경로 · 학교 → 수원역' } }),
    mk({ f: 'paldal', t: 'yeongtong', departAt: at(30), m: [6], declineSim: true, memo: '팔달관 정문 앞', rec: { type: 'class', text: '📚 같은 시간에 수업 끝나는 학생 · 같은 방향' } }),
    mk({ f: 'gate', t: 'suwon', departAt: examAt, m: [4, 6], safeShare: true, memo: '알고리즘 기말 끝나고 바로 출발해요', rec: { type: 'exam', text: '📝 시험 종료 22:30 · 수원역 방면 막차 22:40 → 놓칠 수 있어요' } }),
    mk({ f: 'samgeori', t: 'mangpo', departAt: at(9), nowPod: true, m: [3, 5, 7] }),
    mk({ f: 'gate', t: 'ingye', departAt: at(90), max: 3, m: [7], options: { sameGender: true } }),
    mk({ f: 'suwon', t: 'gate', departAt: at(130), m: [0], options: { luggage: true } }),
    mk({ f: 'gate', t: 'seryu', s: ['suwon'], split: 'distance', departAt: at(60), m: [2, 1], drops: [2, 1], memo: '수원역에서 1명 내려요 · 거리 비례 정산', rec: { type: 'route', text: '🧮 경유지 하차 팟 · 거리 비례로 공평하게' } }),
    mk({ f: 'gwanggyo', t: 'gate', type: 'regular', days: [2, 4], time: '08:30', m: [8, 2, 4], memo: '한 학기 같이 다녀요 · 광교중앙역 1번 출구', rec: { type: 'regular', text: '🔁 화·목 1교시 시간표가 겹치는 학생 3명' } }),
    mk({ f: 'suwon', t: 'gate', type: 'regular', days: [1, 3, 5], time: '08:20', m: [0, 3], memo: '월수금 수원역 4번 출구' }),
    mk({ f: 'gate', t: 'goyang', departAt: ev1 - 150 * MIN, eventId: 'e1', dir: 'go', m: [7, 5, 1] }),
    mk({ f: 'goyang', t: 'gate', s: ['suwon'], split: 'distance', departAt: ev1 + 210 * MIN, eventId: 'e1', dir: 'back', m: [7, 0], drops: [2, 1], safeShare: true, memo: '공연 끝나고 W게이트 앞 집합 · 수원역 경유' }),
    mk({ f: 'suwon', t: 'goyang', departAt: ev1 - 150 * MIN, eventId: 'e1', dir: 'go', m: [2] }),
    mk({ f: 'gate', t: 'worldcup', departAt: ev2 - 40 * MIN, eventId: 'e2', dir: 'go', m: [4, 8] }),
    mk({ f: 'worldcup', t: 'gate', departAt: ev2 + 150 * MIN, eventId: 'e2', dir: 'back', m: [4] }),
    mk({ f: 'gate', t: 'lake', departAt: ev3 - 30 * MIN, eventId: 'e3', dir: 'go', m: [3, 6] }),
  ];

  const events = [
    { id: 'e1', emoji: '🎤', color: 'linear-gradient(135deg,#7b3fe4,#e24a8d)', title: 'OO 콘서트 (고양)', place: 'goyang', date: ev1, interest: 128, desc: '주말 대형 콘서트! 공연이 늦게 끝나 귀가가 걱정된다면 학교 사람들과 함께.' },
    { id: 'e2', emoji: '⚽', color: 'linear-gradient(135deg,#0b4aa8,#22a6f2)', title: 'K리그 홈경기', place: 'worldcup', date: ev2, interest: 76, desc: '수원월드컵경기장 직관 가요. 경기 끝나면 버스가 미어터져요.' },
    { id: 'e3', emoji: '✨', color: 'linear-gradient(135deg,#f08c00,#ffc531)', title: '광교호수공원 겨울 빛축제', place: 'lake', date: ev3, interest: 41, desc: '불빛 축제 같이 보러 가요.' },
  ];

  const H = [
    [1, 'gate', 'suwon', 10400, 4, true], [2, 'suwon', 'gate', 9800, 3, false], [4, 'gwanggyo', 'gate', 7200, 3, false],
    [6, 'gate', 'suwon', 11600, 4, false], [8, 'gate', 'yeongtong', 12100, 3, true], [11, 'gwanggyo', 'gate', 7400, 4, false],
    [33, 'gate', 'suwon', 10200, 4, false], [38, 'gate', 'goyang', 61200, 4, true], [44, 'gwanggyo', 'gate', 7100, 3, false],
    [50, 'suwon', 'gate', 9900, 2, false], [57, 'gate', 'mangpo', 9300, 3, false],
  ];
  const history = H.map(([d, a, b, fare, cnt, host], i) => {
    const paid = perPerson(fare, cnt);
    return { id: 'h' + i, date: now - d * DAYMS - 3 * HOUR, route: `${PLACES[a].name} → ${PLACES[b].name}`, fare, n: cnt, paid, solo: fare, km: roadKm(PLACES[a], PLACES[b]), host };
  });

  return { seededAt: now, user: null, pods, events, history, favRoutes: [['gate', 'suwon'], ['gate', 'gwanggyo']] };
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE));
    if (s && Date.now() - s.seededAt < 3 * HOUR) return s;
  } catch (e) { /* ignore */ }
  return seed();
}
let S = load();
function save() { localStorage.setItem(STORE, JSON.stringify(S)); }

// "지금 바로" 팟은 데모 시간이 지나도 항상 10분 안 출발로 유지
function refreshNowPods() {
  S.pods.forEach(p => {
    if (p.nowPod && p.status === 'open' && !meIn(p) && p.departAt < Date.now() + 3 * MIN) {
      p.departAt = roundTo5(Date.now() + 7 * MIN) + MIN;
    }
  });
}

const meIn = p => S.user && p.members.find(m => m.me);
const isHost = p => S.user && p.host === S.user.nick;
const getPod = id => S.pods.find(p => p.id === id);
const restricted = () => S.user && S.user.penaltyUntil > Date.now();
const meMember = () => ({ nick: S.user.nick, dept: S.user.dept, year: S.user.year, manner: S.user.manner, me: true });

/* ---------- 정산 계산 ---------- */
// 구간별로 나눠서, 그 구간에 타고 있던 사람끼리 나눔
function splitFare(p, total, mode, members = p.members) {
  const pts = points(p);
  if (mode !== 'distance' || pts.length < 3) {
    const per = perPerson(total, members.length);
    return members.map(m => ({ m, amt: per, segs: [] }));
  }
  const L = pts.slice(1).map((q, i) => roadKm(pts[i], q));
  const sum = L.reduce((a, b) => a + b, 0);
  const amt = members.map(() => 0);
  const segs = [];
  L.forEach((len, i) => {
    const segFare = total * len / sum;
    let riders = members.map((m, j) => j).filter(j => (members[j].drop ?? L.length) >= i + 1);
    if (!riders.length) riders = members.map((m, j) => j);
    riders.forEach(j => amt[j] += segFare / riders.length);
    segs.push({ from: pts[i].name, to: pts[i + 1].name, fare: segFare, riders: riders.map(j => members[j].nick) });
  });
  return members.map((m, j) => ({ m, amt: ceil10(amt[j]), segs }));
}
// 참여 시 선결제 금액 (꽉 찬다고 가정한 예상 몫)
function projectedPrepay(p, drop) {
  const est = podEst(p);
  if (p.split !== 'distance' || !p.stops.length) return perPerson(est.fare, p.max);
  const last = p.stops.length + 1;
  const ms = [...p.members.filter(m => !m.me), { nick: '__me', drop }];
  while (ms.length < p.max) ms.push({ nick: '__empty' + ms.length, drop: last });
  return splitFare(p, est.fare, 'distance', ms).find(r => r.m.nick === '__me').amt;
}

/* ---------- 라우터 ---------- */
let stack = [{ v: 'home' }];
let lastKey = '';
const UI = { findMode: 'now', view: 'list', dest: '전체', within: 'all', onlyOpen: true, sameGender: false, sort: 'soon', myTab: 'active' };
const TABS = [['home', '🏠', '추천'], ['find', '🔍', '찾기'], ['events', '🎉', '이벤트'], ['mypods', '🚕', '내 팟'], ['my', '👤', '마이']];
const VIEWS = {};

function go(v, params = {}) { stack.push({ v, ...params }); render(); }
function back() { if (stack.length > 1) stack.pop(); render(); }
function tab(v) { stack = [{ v }]; render(); }

function render() {
  const prevScroll = $('.content') ? $('.content').scrollTop : 0;
  clearMaps(); closeSheet(true);
  const app = $('#app');
  if (!S.user) { app.innerHTML = viewLogin(); lastKey = 'login'; return; }
  refreshNowPods();
  const top = stack[stack.length - 1];
  const view = VIEWS[top.v];
  const isTab = TABS.some(t => t[0] === top.v);
  app.innerHTML = `<div class="screen">${view.html(top)}</div>${isTab ? tabbar(top.v) : ''}`;
  const key = JSON.stringify(top) + UI.findMode + UI.view + UI.myTab;
  if (key === lastKey && $('.content')) $('.content').scrollTop = prevScroll;
  lastKey = key;
  view.mount && view.mount(top);
}
const tabbar = cur => `<nav class="tabbar">${TABS.map(([v, ic, label]) =>
  `<button class="${cur === v ? 'on' : ''}" onclick="tab('${v}')"><span class="ti">${ic}</span>${label}</button>`).join('')}</nav>`;
const header = (title, { backBtn = false, right = '' } = {}) =>
  `<header class="hd">${backBtn ? '<button class="hd-back" onclick="back()">‹</button>' : ''}<h1>${title}</h1>${right}</header>`;

/* ---------- 오버레이 ---------- */
function openSheet(html) {
  closeSheet(true);
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet-bg"></div><div class="sheet"><div class="sheet-handle"></div><div class="sheet-body">${html}</div></div>`;
  $('.phone').appendChild(wrap);
  wrap.querySelector('.sheet-bg').onclick = () => closeSheet();
  requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('show')));
  return wrap.querySelector('.sheet-body');
}
function setSheet(html) { const b = $('.sheet-body'); if (b) b.innerHTML = html; return b; }
function closeSheet(immediate) {
  $$('.sheet-wrap').forEach(w => {
    if (immediate) w.remove();
    else { w.classList.remove('show'); setTimeout(() => w.remove(), 260); }
  });
}
function toast(msg, ms = 2400) {
  const t = document.createElement('div');
  t.className = 'toast'; t.innerHTML = msg;
  $('.phone').appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, ms);
}
function loader(text) {
  const l = document.createElement('div');
  l.className = 'loader'; l.innerHTML = `<div class="spinner"></div><div class="lt">${text}</div>`;
  $('.phone').appendChild(l);
  return { set: t => (l.querySelector('.lt').textContent = t), close: () => l.remove() };
}
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------- 지도 (makeMap / fitLater 는 map.js) ---------- */
function drawRoute(m, p) {
  const pts = points(p);
  const ll = pts.map(x => [x.lat, x.lng]);
  drawRoadRoute(m, ll);
  pts.forEach((x, i) => {
    const kind = i === 0 ? 's' : i === pts.length - 1 ? 'e' : 'p';
    const label = i === 0 ? '출' : i === pts.length - 1 ? '도' : '경';
    m.marker([x.lat, x.lng], kind, label,
      { popup: `<div class="pop"><b>${esc(x.name)}</b>${i === 0 ? '집합 위치' : i === pts.length - 1 ? '목적지' : '경유지 (하차 가능)'}</div>` });
  });
  fitLater(m, ll, { padding: 36 });
}

/* =====================================================
   로그인
   ===================================================== */
function viewLogin() {
  return `<div class="login">
    <div class="login-hero">
      <div class="logo-big">🚕</div>
      <h1>아주팟</h1>
      <p>아주대 학생끼리 타는 택시팟<br><b>"만 원짜리 택시, 넷이 타면 2,500원"</b></p>
    </div>
    <form onsubmit="doLogin(event)">
      <div class="email-field"><input id="loginId" placeholder="포털 아이디" autocomplete="off" value=""><span>@ajou.ac.kr</span></div>
      <input class="inp" type="password" placeholder="비밀번호" autocomplete="off">
      <button class="btn primary block">아주대 계정으로 로그인</button>
      <p class="demo-note">데모: 아무 값이나 입력해도 로그인돼요</p>
    </form>
    <ul class="login-feats">
      <li><span>🎓</span>학교 계정 인증</li>
      <li><span>📅</span>시간표 자동 추천</li>
      <li><span>💳</span>카드 자동 정산</li>
      <li><span>🛡️</span>안심 귀가</li>
    </ul>
  </div>`;
}
async function doLogin(e) {
  if (e) e.preventDefault();
  const id = ($('#loginId') && $('#loginId').value.trim()) || 'student';
  const ld = loader('아주대 계정 인증 중...');
  await wait(900); ld.close();
  openSheet(`<h3>📅 시간표 연동 동의</h3>
    <p class="sub">수업·시험 일정을 불러와서 같은 시간에 끝나는 학우와 팟을 추천해요.<br>시간표는 추천에만 쓰이고 다른 사람에게 공개되지 않아요.</p>
    <div class="choice">
      <label><input type="checkbox" checked> [필수] 시간표·시험 일정 조회 동의</label>
      <label><input type="checkbox" checked> [선택] 위치 정보 (근처 팟·막차 알림)</label>
    </div>
    <button class="btn primary block" id="agreeBtn">동의하고 계속</button>`);
  $('#agreeBtn').onclick = async () => {
    closeSheet(true);
    const l2 = loader('시간표·시험 일정 불러오는 중...');
    await wait(800); l2.set('추천 팟 찾는 중...'); await wait(700); l2.close();
    S.user = { nick: '노란택시', dept: '미디어학과', year: '23', manner: 36.5, email: id + '@ajou.ac.kr', card: null, points: 900, noShows: [], penaltyUntil: 0, safeContacts: ['엄마 · 010-****-5821'] };
    save();
    cardSheet(() => { stack = [{ v: 'home' }]; render(); toast(`✅ 시간표 연동 완료! 추천 팟 ${S.pods.filter(p => p.rec && p.status === 'open').length}개를 찾았어요`); }, true);
  };
}
function logout() { S.user = null; save(); stack = [{ v: 'home' }]; render(); }

/* ---------- 카드 등록 (자동결제, 가짜) ---------- */
function cardSheet(after, fromLogin = false) {
  openSheet(`<h3>💳 결제수단 등록</h3>
    <p class="sub">한 번만 등록하면 선결제·추가결제·정기팟 결제가 <b>버튼 없이 자동</b>으로 처리돼요.</p>
    <div class="choice">
      <label><input type="radio" name="card" value="신한카드 ••••1234" checked> 💳 신한카드 ••••1234<small>데모용 카드 (카드번호 입력 없음)</small></label>
      <label><input type="radio" name="card" value="카카오페이"> 🟡 카카오페이</label>
      <label><input type="radio" name="card" value="토스페이"> 🔵 토스페이</label>
    </div>
    <ul class="pay-notes"><li>PG사 자동결제(빌링키) 방식 — 앱은 카드번호를 저장하지 않고 <b>빌링키만</b> 보관해요</li><li>실제 결제는 일어나지 않는 데모 화면이에요</li></ul>
    <button class="btn primary block" id="cardBtn">등록하기</button>
    ${fromLogin ? '<button class="btn block" style="margin-top:8px;background:none;color:var(--muted)" id="cardLater">나중에 하기</button>' : ''}`);
  $('#cardBtn').onclick = async () => {
    const v = $('input[name=card]:checked').value;
    $('#cardBtn').innerHTML = '<span class="spinner sm"></span> 빌링키 발급 중...';
    await wait(900);
    S.user.card = v; save(); closeSheet(true);
    toast(`💳 ${esc(v)} 등록 완료 · 이제 자동결제돼요`);
    after && after();
  };
  if ($('#cardLater')) $('#cardLater').onclick = () => { closeSheet(true); after && after(); };
}
// 등록된 카드로 자동결제
async function autoPay(amount, label) {
  const ld = loader(`💳 ${S.user.card}로 자동결제 중...`);
  await wait(900); ld.close();
  toast(`💳 ${esc(label)} ${won(amount)} 자동결제 완료`);
}

/* =====================================================
   팟 카드
   ===================================================== */
function seatsHtml(p) {
  const n = p.members.length;
  return Array.from({ length: p.max }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('') + `<span>${n}/${p.max}명</span>`;
}
function podTags(p) {
  const t = departOf(p), n = p.members.length, left = t - Date.now();
  const tags = [];
  if (p.type === 'regular') tags.push('<span class="tag blue">🔁 정기</span>');
  if (p.type === 'once' && left < 15 * MIN && left > 0) tags.push('<span class="tag red">⏳ 곧 출발</span>');
  if (n >= p.max) tags.push('<span class="tag gray">모집 완료</span>');
  else if (p.max - n === 1) tags.push('<span class="tag orange">1자리 남음</span>');
  if (p.stops && p.stops.length) tags.push(`<span class="tag yellow">경유 ${esc(p.stops[0].name)}</span>`);
  if (p.split === 'distance') tags.push('<span class="tag yellow">🧮 거리 비례</span>');
  if (p.options.sameGender) tags.push('<span class="tag">동성끼리</span>');
  if (p.options.luggage) tags.push('<span class="tag">🧳 짐</span>');
  if (p.safeShare) tags.push('<span class="tag green">🛡️ 안심귀가</span>');
  if (meIn(p)) tags.push('<span class="tag green">참여 중</span>');
  if (p.status === 'riding') tags.push('<span class="tag blue">🚖 이동 중</span>');
  return tags.join('');
}
function podCard(p, { showRec = false, joinBtn = false } = {}) {
  const t = departOf(p);
  const per = perPerson(podEst(p).fare, p.max);
  const canJoin = joinBtn && !meIn(p) && p.members.length < p.max;
  return `<div class="pod-card ${meIn(p) ? 'mine' : ''}" onclick="go('pod',{id:'${p.id}'})">
    <div class="pc-tags">${podTags(p)}</div>
    ${showRec && p.rec ? `<div class="pc-rec">${esc(recText(p))}</div>` : ''}
    <div class="pc-route"><span class="dot s"></span><b>${esc(p.from.name)}</b></div>
    ${(p.stops || []).map(s => `<div class="pc-route" style="font-size:13px;color:var(--muted)"><span class="dot" style="background:var(--blue)"></span>${esc(s.name)} 경유</div>`).join('')}
    <div class="pc-route"><span class="dot e"></span><b>${esc(p.to.name)}</b></div>
    <div class="pc-meta"><span>⏰ ${p.type === 'regular' ? `매주 ${daysLabel(p.days)} ${p.time}` : fmtWhen(t)}</span><span class="pc-left">${fmtLeft(t)}</span></div>
    <div class="pc-bottom">
      <div class="seats">${seatsHtml(p)}</div>
      <div style="display:flex;align-items:center">
        <div class="pc-price">1인 약 <b>${won(per)}</b></div>
        ${canJoin ? `<button class="btn primary sm pc-join" onclick="event.stopPropagation();joinFlow('${p.id}')">참여하기</button>` : ''}
      </div>
    </div>
  </div>`;
}

/* =====================================================
   홈 / 추천
   ===================================================== */
function lastBusInfo() {
  const [h, m] = BUS.last[0].time.split(':').map(Number);
  const d = new Date(); d.setHours(h, m, 0, 0);
  return { ts: d.getTime(), left: Math.round((d.getTime() - Date.now()) / MIN) };
}
function monthStats() {
  const since = Date.now() - 30 * DAYMS;
  const hs = S.history.filter(h => h.date >= since);
  const saved = hs.reduce((a, h) => a + Math.max(0, h.solo - h.paid), 0);
  const co = hs.reduce((a, h) => a + (h.n - 1), 0);
  const co2 = hs.reduce((a, h) => a + h.km * (h.n - 1) / h.n * 0.17, 0);
  const allSaved = S.history.reduce((a, h) => a + Math.max(0, h.solo - h.paid), 0);
  return { rides: hs.length, saved, co, co2, allSaved, allRides: S.history.length, allCo: S.history.reduce((a, h) => a + h.n - 1, 0) };
}

/* ---------- 실제 날씨 (Open-Meteo, 키 없음 · 아주대 기준) ----------
   데모용 강제 설정: 주소 뒤에 ?weather=rain 또는 ?weather=clear */
const WX = { ready: false, temp: null, code: null, now: 'clear', soonProb: 0 };
const WX_FORCE = new URLSearchParams(location.search).get('weather');
const WX_RAIN = c => (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || c >= 95;
const WX_SNOW = c => (c >= 71 && c <= 77) || c === 85 || c === 86;
function wxIcon(c) {
  if (c == null) return '🌡️';
  if (c >= 95) return '⛈️'; if (WX_SNOW(c)) return '🌨️'; if (WX_RAIN(c)) return '🌧️';
  if (c === 45 || c === 48) return '🌫️'; if (c === 0) return '☀️'; if (c <= 2) return '🌤️'; return '☁️';
}
function wxText(c) {
  if (c == null) return '';
  if (c >= 95) return '뇌우'; if (WX_SNOW(c)) return '눈'; if (WX_RAIN(c)) return c <= 57 ? '이슬비' : '비';
  if (c === 45 || c === 48) return '안개'; if (c === 0) return '맑음'; if (c <= 2) return '구름 조금'; return '흐림';
}
const isRaining = () => WX_FORCE ? WX_FORCE === 'rain' : WX.now === 'rain' || WX.now === 'snow';
async function loadWeather() {
  try {
    const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=37.2796&longitude=127.0438&current=temperature_2m,weather_code&hourly=precipitation_probability&forecast_hours=3&timezone=Asia%2FSeoul');
    const j = await r.json();
    WX.temp = Math.round(j.current.temperature_2m); WX.code = j.current.weather_code;
    WX.now = WX_RAIN(WX.code) ? 'rain' : WX_SNOW(WX.code) ? 'snow' : 'clear';
    WX.soonProb = Math.max(0, ...(j.hourly.precipitation_probability || []).filter(x => x != null));
    WX.ready = true;
  } catch (e) { return; } // 실패하면 날씨 영역만 숨김
  const top = stack[stack.length - 1];
  if (top.v === 'home' && S.user && !$('.sheet-wrap') && document.activeElement.tagName !== 'INPUT') render();
}
// 비 추천 문구는 실제로 비가 올 때만, 아니면 평범한 즐겨찾기 문구로
const recText = p => (p.rec.type === 'rain' && !isRaining()) ? '⭐ 즐겨찾는 경로 (학교 → 수원역)' : p.rec.text;
function weatherBanner(rainCount) {
  const tempTxt = WX.ready ? ` · ${WX.temp}°C` : '';
  if (isRaining()) return `<div class="alert-rain" onclick="findWith('수원역','now')"><div class="ar-ic">${WX.now === 'snow' ? '🌨️' : '☔'}</div><div><b>지금 ${WX.now === 'snow' ? '눈이' : '비가'} 와요${tempTxt}</b><br><span>수원역 가는 팟 ${rainCount}개 모집 중 · 지금 바로 참여 →</span></div></div>`;
  if (WX.ready && WX.soonProb >= 60) return `<div class="alert-rain" style="background:linear-gradient(120deg,#3b5b8a,#5b7fb5)" onclick="findWith('수원역','book')"><div class="ar-ic">🌂</div><div><b>3시간 안에 비 소식 (${WX.soonProb}%)</b><br><span>미리 수원역 가는 팟 예약해 두기 →</span></div></div>`;
  return '';
}

VIEWS.home = {
  html() {
    const open = S.pods.filter(p => p.status === 'open' && !p.eventId);
    const rainCount = open.filter(p => p.to.name.includes('수원역') && p.type === 'once').length;
    const recs = open.filter(p => p.rec && p.type === 'once' && !meIn(p));
    const regRec = open.find(p => p.rec && p.type === 'regular' && !meIn(p));
    const mine = S.pods.filter(p => meIn(p) && ['open', 'riding'].includes(p.status)).sort((a, b) => departOf(a) - departOf(b));
    const lb = lastBusInfo();
    const ms = monthStats();
    const busPer = perPerson(estimateRoute([PLACES.gate, PLACES.suwon]).fare, 4);
    const busEst = estimateRoute([PLACES.gate, PLACES.suwon]);
    const arrivals = BUS.arrivals.map(b => ({ ...b, min: ((b.off - Math.floor(Date.now() / MIN)) % b.every + b.every) % b.every + 1 }))
      .sort((a, b) => a.min - b.min);
    return header('<span class="logo">🚕 아주팟</span>', { right: '<button class="icon-btn" onclick="showNotifs()">🔔<i class="badge-dot"></i></button>' }) + `
    <div class="content">
      <div class="hello">안녕하세요, <b>${esc(S.user.nick)}</b>님 👋<br><small>오늘도 같이 타고 아껴요${WX.ready ? ` · <span class="wx-chip">${wxIcon(WX.code)} 아주대 ${WX.temp}°C ${wxText(WX.code)}</span>` : ''}</small></div>
      ${restricted() ? `<div class="penalty-on" style="margin-top:12px">🚫 노쇼 누적으로 ${fmtDate(S.user.penaltyUntil)}까지 팟 참여가 제한돼요</div>` : ''}
      ${mine.length ? `<div class="next-ride" onclick="go('pod',{id:'${mine[0].id}'})">🚕 내 다음 탑승 · ${fmtLeft(departOf(mine[0]))}<b>${esc(mine[0].from.name)} → ${esc(mine[0].to.name)}</b></div>` : ''}

      ${weatherBanner(rainCount)}
      <div class="alert-rain" style="margin-top:8px;background:linear-gradient(120deg,#8a4b00,#d97706)" onclick="go('pod',{id:'p4'})"><div class="ar-ic">🚌</div><div><b>${BUS.last[0].to} 막차 ${BUS.last[0].time}${lb.left > 0 && lb.left <= 90 ? ` (${lb.left}분 후 종료)` : ''}</b><br><span>시험 종료 22:30 → 막차 놓칠 수 있어요. 같은 시험 학우 팟 보기 →</span></div></div>

      <section>
        <div class="sec-hd"><h2>🚌 버스 vs 택시팟</h2><span class="muted">${BUS.stop} 정류장</span></div>
        <div class="card">
          <div style="font-size:13px;color:var(--sub);margin-bottom:10px">학교 → 수원역 기준</div>
          <div class="vs">
            <div class="vs-col"><span>🚌 버스</span><b>35분</b><small>1,500원 · 만원 버스 😵</small></div>
            <div class="vs-mid">VS</div>
            <div class="vs-col win"><span>🚕 택시팟 (4명)</span><b>${busEst.minutes}분</b><small>${won(busPer)} · 앉아서 편하게</small></div>
          </div>
          <div class="bus-list">${arrivals.slice(0, 3).map(b => `<div><span class="bus-no">${b.no}</span> ${b.to} 방면 <b>${b.min}분 후</b></div>`).join('')}</div>
          <p class="hint">※ 버스 정보는 데모용 가짜 데이터 (실제: 공공 버스 정보 API)</p>
        </div>
      </section>

      <section>
        <div class="sec-hd"><h2>📅 오늘 내 일정</h2><span class="muted">시간표 연동됨</span></div>
        <div class="plan">${TODAY_PLAN.map(x => `<div class="plan-item ${x.exam ? 'exam' : ''}"><span class="pt">${x.t}</span><span>${x.exam ? '📝 <b>' + x.name + '</b>' : x.name} · <span class="muted">${x.where}</span></span></div>`).join('')}</div>
      </section>

      <section>
        <div class="sec-hd"><h2>✨ 나에게 맞는 추천 팟</h2><span class="muted">${recs.length}개</span></div>
        ${recs.map(p => podCard(p, { showRec: true, joinBtn: true })).join('') || '<div class="empty">지금은 추천할 팟이 없어요</div>'}
      </section>

      ${regRec ? `<section>
        <div class="sec-hd"><h2>🔁 정기 통학팟 제안</h2></div>
        <div class="reg-suggest" onclick="go('pod',{id:'${regRec.id}'})">
          <div class="rs-top">${esc(regRec.rec.text)}</div>
          <h4>매주 ${daysLabel(regRec.days)} ${regRec.time}</h4>
          <p>${esc(regRec.from.name)} → ${esc(regRec.to.name)} · 학기 단위 고정 멤버</p>
          <div class="rs-bottom"><div class="seats">${seatsHtml(regRec)}</div><b>1회 ${won(perPerson(podEst(regRec).fare, regRec.max))}</b></div>
        </div>
      </section>` : ''}

      <section>
        <div class="save-mini" onclick="tab('my')">
          <div><small>이번 달 (최근 30일)</small><b>${won(ms.saved)} 아꼈어요 💰</b><small>택시팟 ${ms.rides}회 · 함께 탄 학우 ${ms.co}명</small></div><span>›</span>
        </div>
        <div class="save-mini" style="margin-top:8px;background:#fff;color:var(--text)" onclick="go('calc')">
          <div><small style="color:var(--muted)">목적지가 다를 때</small><b>🧮 거리 비례 정산 계산기</b><small style="color:var(--muted)">1/N vs 거리 비례 비교</small></div><span>›</span>
        </div>
      </section>

      <section>
        <div class="sec-hd"><h2>⭐ 즐겨찾는 경로</h2></div>
        <div class="chips">${S.favRoutes.map(([a, b]) => `<button class="chip" onclick="findWith('${PLACES[b].name}','book')">${PLACES[a].name} → ${PLACES[b].name}</button>`).join('')}</div>
      </section>
    </div>`;
  },
};
function findWith(dest, mode) { UI.dest = dest; UI.findMode = mode || 'book'; UI.view = 'list'; tab('find'); }

function showNotifs() {
  const items = [
    ...(isRaining() ? [['☔', `${WX.now === 'snow' ? '눈' : '비'} 오는 날! 수원역 가는 팟 모집 중${WX.ready ? ` (지금 ${WX.temp}°C)` : ''}`, '방금', "findWith('수원역','now')"]] : []),
    ['🚌', '수원역 방면 막차 22:40 · 시험 종료(22:30) 후 막차를 놓칠 수 있어요. 같은 시험 학우 팟이 있어요', '10분 전', "go('pod',{id:'p4'})"],
    ['🔁', '화·목 08:30 광교중앙역 → 아주대 정기팟을 추천해요', '1시간 전', "go('pod',{id:'p9'})"],
    ['🎤', 'OO 콘서트 오는 편 팟 · 안심 귀가 공유 기본 ON', '어제', "go('event',{id:'e1'})"],
  ];
  openSheet(`<h3>🔔 알림</h3>${items.map(([ic, t, w, act]) => `<div class="notif" onclick="closeSheet(true);${act}"><span class="ni">${ic}</span><div><p>${t}</p><small>${w}</small></div></div>`).join('')}`);
}

/* =====================================================
   찾기 (지금 바로 / 예약)
   ===================================================== */
function filteredPods() {
  const now = Date.now();
  let list = S.pods.filter(p => p.status === 'open' && !p.eventId);
  if (UI.findMode === 'now') {
    return list.filter(p => p.type === 'once' && departOf(p) - now <= 10 * MIN && departOf(p) > now).sort((a, b) => departOf(a) - departOf(b));
  }
  if (UI.dest !== '전체') list = list.filter(p => p.to.name.includes(UI.dest) || (UI.dest === '아주대' && p.to.name.includes('아주대')));
  if (UI.within === '1h') list = list.filter(p => departOf(p) - now <= HOUR);
  if (UI.within === 'today') list = list.filter(p => departOf(p) < startOfDay(now) + DAYMS);
  if (UI.onlyOpen) list = list.filter(p => p.members.length < p.max || meIn(p));
  if (UI.sameGender) list = list.filter(p => p.options.sameGender);
  list.sort(UI.sort === 'soon' ? (a, b) => departOf(a) - departOf(b) : (a, b) => (a.max - a.members.length) - (b.max - b.members.length) || departOf(a) - departOf(b));
  return list;
}
VIEWS.find = {
  html() {
    const list = filteredPods();
    const dests = ['전체', '수원역', '광교중앙역', '영통역', '세류역', '아주대'];
    const top = `<div class="seg" style="margin-bottom:12px">
        <button class="${UI.findMode === 'now' ? 'on' : ''}" onclick="UI.findMode='now';render()">⚡ 지금 바로</button>
        <button class="${UI.findMode === 'book' ? 'on' : ''}" onclick="UI.findMode='book';render()">📅 예약</button>
      </div>`;
    if (UI.findMode === 'now') {
      return header('팟 찾기') + `<div class="content">${top}
        <p class="hint" style="margin:-2px 0 12px">10분 안에 출발하는 근처 팟이에요. 바로 참여하세요!</p>
        ${list.map(p => nowCard(p)).join('') || `<div class="empty"><span class="big">🕊️</span>10분 안에 출발하는 팟이 없어요<br><button class="btn primary sm" style="margin-top:12px" onclick="startCreate({mins:10})">지금 출발 팟 만들기</button></div>`}
      </div><button class="fab" onclick="startCreate({mins:10})">＋ 팟 만들기</button>`;
    }
    return header('팟 찾기', { right: `<div class="seg" style="width:120px"><button class="${UI.view === 'list' ? 'on' : ''}" onclick="UI.view='list';render()">목록</button><button class="${UI.view === 'map' ? 'on' : ''}" onclick="UI.view='map';render()">지도</button></div>` }) + `
    <div class="content">${top}
      <div class="find-bar">
        <div class="chips scroll">${dests.map(d => `<button class="chip ${UI.dest === d ? 'on' : ''}" onclick="UI.dest='${d}';render()">${d === '아주대' ? '🏫 등교(아주대)' : d}</button>`).join('')}</div>
        <div class="find-row">
          <select onchange="UI.within=this.value;render()">
            <option value="all" ${UI.within === 'all' ? 'selected' : ''}>전체 시간</option>
            <option value="1h" ${UI.within === '1h' ? 'selected' : ''}>1시간 이내</option>
            <option value="today" ${UI.within === 'today' ? 'selected' : ''}>오늘</option>
          </select>
          <select onchange="UI.sort=this.value;render()">
            <option value="soon" ${UI.sort === 'soon' ? 'selected' : ''}>곧 출발순</option>
            <option value="closing" ${UI.sort === 'closing' ? 'selected' : ''}>마감 임박순</option>
          </select>
          <label class="check"><input type="checkbox" ${UI.onlyOpen ? 'checked' : ''} onchange="UI.onlyOpen=this.checked;render()">빈자리</label>
          <label class="check"><input type="checkbox" ${UI.sameGender ? 'checked' : ''} onchange="UI.sameGender=this.checked;render()">동성</label>
        </div>
      </div>
      ${UI.view === 'map' ? '<div class="map-box tall" id="findMap"></div>' : `<div class="count-line">${list.length}개의 팟</div>${list.map(p => podCard(p, { joinBtn: true })).join('') || '<div class="empty"><span class="big">🔍</span>조건에 맞는 팟이 없어요<br>직접 만들어 보세요!</div>'}`}
    </div>
    <button class="fab" onclick="startCreate()">＋ 팟 만들기</button>`;
  },
  mount() {
    if (UI.findMode !== 'book' || UI.view !== 'map') return;
    const m = makeMap($('#findMap'), [37.2760, 127.0300], 13);
    if (!m) return;
    const list = filteredPods();
    list.forEach(p => {
      m.marker([p.from.lat, p.from.lng], 'p', p.members.length + '/' + p.max,
        { popup: `<div class="pop"><b>${esc(p.from.name)} → ${esc(p.to.name)}</b>${p.type === 'regular' ? '매주 ' + daysLabel(p.days) + ' ' + p.time : fmtWhen(departOf(p))}<br><button onclick="go('pod',{id:'${p.id}'})">상세보기</button></div>` });
    });
    if (list.length) fitLater(m, list.map(p => [p.from.lat, p.from.lng]), { padding: 40, maxZoom: 15 });
  },
};
function nowCard(p) {
  const t = departOf(p), left = Math.max(0, Math.round((t - Date.now()) / MIN));
  const per = perPerson(podEst(p).fare, p.max);
  return `<div class="now-card" onclick="go('pod',{id:'${p.id}'})">
    <div class="nc-top"><span class="nc-count"><b>${left}</b>분 후 출발</span><div class="seats">${seatsHtml(p)}</div></div>
    <div class="nc-route">${esc(p.from.name)} <span>→</span> ${esc(p.to.name)}</div>
    <div class="nc-meta">📍 집합: ${esc(p.from.name)} · 약 ${won(per)} / 1인</div>
    ${meIn(p) ? '<div class="tag green" style="margin-top:10px">참여 중</div>' : `<button class="btn yellow block" style="margin-top:12px" onclick="event.stopPropagation();joinFlow('${p.id}')">⚡ 바로 참여하기</button>`}
  </div>`;
}

/* =====================================================
   팟 만들기
   ===================================================== */
let draft = null;
function startCreate(pref = {}) {
  if (restricted()) return toast('🚫 노쇼 제재 기간에는 팟을 만들 수 없어요');
  draft = {
    from: pref.from ? { ...pref.from } : { ...PLACES.gate }, to: pref.to ? { ...pref.to } : null, stop: null,
    pick: pref.to ? 'from' : 'to', type: 'once', dt: toLocalInput(roundTo5(Date.now() + (pref.mins || 30) * MIN)),
    days: [], time: '08:30', max: 4, minPeople: 2, split: 'equal', sameGender: false, luggage: false, safeShare: false, memo: '',
    eventId: pref.eventId || null, dir: pref.dir || null,
  };
  if (pref.at) draft.dt = toLocalInput(pref.at);
  go('create');
}
let cMap = null, cMarkers = {};
VIEWS.create = {
  html() {
    const d = draft;
    const placeOpts = Object.values(PLACES);
    const acField = (key, label, color) => `<label class="field"><span>${label}</span>
      <div class="ac"><input type="text" id="in_${key}" data-key="${key}" placeholder="장소 검색 (예: 수원역 4번 출구)" value="${esc(d[key] ? d[key].name : '')}" autocomplete="off">
      <div class="ac-list" id="ac_${key}"></div></div></label>
      <div class="chips" style="margin-top:6px">${QUICK.map(k => `<button class="chip" onclick="setPoint('${key}',PLACES.${k})">${PLACES[k].name}</button>`).join('')}</div>`;
    return header(d.eventId ? '이벤트 팟 만들기' : '팟 만들기', { backBtn: true }) + `
    <div class="content">
      <div class="map-box" id="createMap"></div>
      <div class="pick-toggle">
        <button data-pick="from" class="${d.pick === 'from' ? 'on' : ''}">🟢 출발지</button>
        <button data-pick="stop" class="${d.pick === 'stop' ? 'on' : ''}">🔵 경유지</button>
        <button data-pick="to" class="${d.pick === 'to' ? 'on' : ''}">🔴 도착지</button>
      </div>
      <p class="hint">버튼을 고르고 지도를 탭하면 핀이 꽂혀요 · 핀은 드래그로 조정</p>
      ${acField('from', '출발지', 'var(--green)')}
      <label class="field"><span>경유지 (선택) — 중간에 내리는 사람이 있을 때</span>
        <div class="ac" style="display:flex;gap:6px"><input type="text" id="in_stop" data-key="stop" placeholder="예: 수원역 (없으면 비워두세요)" value="${esc(d.stop ? d.stop.name : '')}" autocomplete="off">
        ${d.stop ? '<button class="btn sm" onclick="setPoint(\'stop\',null)">삭제</button>' : ''}
        <div class="ac-list" id="ac_stop"></div></div></label>
      ${acField('to', '도착지', 'var(--red)')}

      <div class="field"><span class="field-label">유형</span>
        <div class="seg"><button class="${d.type === 'once' ? 'on' : ''}" onclick="draft.type='once';rerenderCreate()">1회성</button><button class="${d.type === 'regular' ? 'on' : ''}" onclick="draft.type='regular';rerenderCreate()">정기 (매주 반복)</button></div>
      </div>
      ${d.type === 'once' ? `<label class="field"><span>출발 시각</span><input type="datetime-local" id="dtInput" value="${d.dt}"></label>` : `
        <div class="field"><span class="field-label">요일</span><div class="days">${[1, 2, 3, 4, 5].map(i => `<button class="${d.days.includes(i) ? 'on' : ''}" onclick="toggleDay(${i})">${DAY[i]}</button>`).join('')}</div></div>
        <label class="field"><span>출발 시각</span><input type="time" id="timeInput" value="${d.time}"></label>
        <p class="hint">ℹ️ 학기 단위로 운영돼요 (종강 시 자동 종료) · 등록 카드로 매회 자동결제</p>`}

      <div class="field"><span class="field-label">모집 인원 (나 포함)</span>
        <div class="seg">${[2, 3, 4].map(n => `<button class="${d.max === n ? 'on' : ''}" onclick="draft.max=${n};draft.minPeople=Math.min(draft.minPeople,${n});rerenderCreate()">${n}명</button>`).join('')}</div></div>
      <div class="field"><span class="field-label">최소 출발 인원</span>
        <div class="seg">${[2, 3, 4].filter(n => n <= d.max).map(n => `<button class="${d.minPeople === n ? 'on' : ''}" onclick="draft.minPeople=${n};rerenderCreate()">${n}명</button>`).join('')}</div>
        <p class="hint">출발 10분 전까지 다 안 차면 참여자 전원에게 "이 인원으로 출발할까요?" 확인해요. 최소 인원 미달이면 자동 취소·전액 환불.</p></div>
      <div class="field"><span class="field-label">정산 방식</span>
        <div class="seg"><button class="${d.split === 'equal' ? 'on' : ''}" onclick="draft.split='equal';rerenderCreate()">1/N로 나누기</button><button class="${d.split === 'distance' ? 'on' : ''}" onclick="draft.split='distance';rerenderCreate()">거리 비례</button></div>
        ${d.split === 'distance' && !d.stop ? '<p class="hint" style="color:var(--orange)">⚠️ 경유지가 없으면 거리 비례 = 1/N과 같아요. 경유지를 추가해 보세요.</p>' : ''}</div>
      <div class="field"><span class="field-label">옵션</span>
        <div class="opts">
          <label class="check"><input type="checkbox" ${d.sameGender ? 'checked' : ''} onchange="draft.sameGender=this.checked">동성끼리만</label>
          <label class="check"><input type="checkbox" ${d.luggage ? 'checked' : ''} onchange="draft.luggage=this.checked">짐 있음</label>
          <label class="check"><input type="checkbox" id="safeChk" ${d.safeShare ? 'checked' : ''} onchange="draft.safeShare=this.checked">🛡️ 안심 귀가</label>
        </div></div>
      <label class="field"><span>메모</span><textarea id="memoInput" placeholder="예: 정문 버스정류장 앞에서 만나요">${esc(d.memo)}</textarea></label>
      <div class="est-box" id="estBox"></div>
      <button class="btn primary block" style="margin-top:16px" onclick="submitCreate()">팟 등록하고 자동 선결제</button>
    </div>`;
  },
  mount() {
    const d = draft;
    $$('.pick-toggle button').forEach(b => b.onclick = () => { d.pick = b.dataset.pick; $$('.pick-toggle button').forEach(x => x.classList.toggle('on', x === b)); });
    ['from', 'stop', 'to'].forEach(k => {
      const inp = $('#in_' + k), list = $('#ac_' + k);
      let timer = null, seq = 0;
      const show = (hits, loading) => {
        list.innerHTML = hits.length
          ? hits.map((p, i) => `<div data-i="${i}">${p.addr ? '🔎' : '📍'} ${esc(p.name)}${p.addr ? `<span class="ac-addr">${esc(p.addr)}</span>` : ''}</div>`).join('')
            + (loading ? '<div class="ac-src">카카오 장소 검색 중…</div>' : '')
          : `<div style="color:var(--muted)">${loading ? '카카오 장소 검색 중…' : '검색 결과 없음 — 지도에서 핀으로 지정해 주세요'}</div>`;
        list.classList.add('show');
        $$('div[data-i]', list).forEach(el => el.onclick = () => { const h = hits[+el.dataset.i]; setPoint(k, { name: h.name, lat: h.lat, lng: h.lng }); list.classList.remove('show'); });
      };
      inp.oninput = () => {
        const raw = inp.value.trim(), q = raw.replace(/\s/g, '');
        clearTimeout(timer);
        if (!q) { list.classList.remove('show'); return; }
        const local = Object.values(PLACES).filter(p => p.name.replace(/\s/g, '').includes(q));
        if (!HAS_PLACES) { show(local, false); return; }
        show(local, true);
        const my = ++seq;
        timer = setTimeout(async () => {   // 타이핑 멈추고 0.25초 뒤 카카오 검색
          const remote = await searchPlaces(raw);
          if (my !== seq || document.activeElement !== inp) return; // 더 입력했거나 입력칸을 벗어났으면 버림
          const seen = new Set(local.map(p => p.name));
          show([...local, ...remote.filter(p => !seen.has(p.name))], false);
        }, 250);
      };
      inp.onblur = () => setTimeout(() => list.classList.remove('show'), 200);
    });
    if ($('#dtInput')) $('#dtInput').onchange = e => { d.dt = e.target.value; autoSafe(); updateEstimate(); };
    if ($('#timeInput')) $('#timeInput').onchange = e => { d.time = e.target.value; updateEstimate(); };
    $('#memoInput').oninput = e => d.memo = e.target.value;

    cMap = makeMap($('#createMap'));
    cMarkers = {};
    if (cMap) {
      cMap.onClick(ll => {
        const near = nearestPlace(ll);
        setPoint(d.pick, { name: near ? `${near.name} 근처` : '지도에서 선택한 위치', lat: ll.lat, lng: ll.lng });
        if (!near) fillAddress(d.pick);
      });
    }
    drawCreateMarkers(true);
    updateEstimate();
  },
};
function autoSafe() {
  if (draft.type !== 'once') return;
  const h = new Date(draft.dt).getHours();
  if ((h >= 23 || h < 4) && !draft.safeShare) { draft.safeShare = true; const c = $('#safeChk'); if (c) c.checked = true; toast('🌙 밤 11시 이후 팟은 안심 귀가 공유가 기본으로 켜져요'); }
}
function rerenderCreate() {
  const m = $('#memoInput'); if (m) draft.memo = m.value;
  render();
}
function toggleDay(i) { const s = draft.days; draft.days = s.includes(i) ? s.filter(x => x !== i) : [...s, i]; rerenderCreate(); }
function nearestPlace(ll) {
  let best = null, bd = 0.6;
  Object.values(PLACES).forEach(p => { const dd = distKm(p, { lat: ll.lat, lng: ll.lng }); if (dd < bd) { bd = dd; best = p; } });
  return best;
}
// 지도에서 찍은 위치를 실제 주소 이름으로 바꾸기 (그 사이 다른 곳을 찍었으면 무시)
async function fillAddress(key) {
  const p = draft[key]; if (!p) return;
  const addr = await addressOf(p.lat, p.lng);
  if (!addr || draft[key] !== p) return;
  p.name = addr;
  const inp = $('#in_' + key); if (inp) inp.value = addr;
}
function setPoint(key, place) {
  draft[key] = place ? { name: place.name, lat: place.lat, lng: place.lng } : null;
  const inp = $('#in_' + key); if (inp) inp.value = place ? place.name : '';
  if (key === 'stop' && !place) { rerenderCreate(); return; }
  if (key === 'stop' && place && draft.split === 'equal') { draft.split = 'distance'; rerenderCreate(); toast('🧮 경유지가 있어서 거리 비례 정산으로 바꿨어요'); return; }
  drawCreateMarkers(true);
  updateEstimate();
}
function drawCreateMarkers(fit) {
  if (!cMap) return;
  Object.values(cMarkers).forEach(mk => mk.remove()); cMarkers = {};
  const cfg = { from: ['s', '출'], stop: ['p', '경'], to: ['e', '도'] };
  ['from', 'stop', 'to'].forEach(k => {
    const p = draft[k]; if (!p) return;
    cMarkers[k] = cMap.marker([p.lat, p.lng], ...cfg[k], {
      draggable: true,
      onDragEnd: ll => {
        const near = nearestPlace(ll);
        draft[k] = { name: near ? `${near.name} 근처` : '지도에서 선택한 위치', lat: ll.lat, lng: ll.lng };
        $('#in_' + k).value = draft[k].name; drawCreateMarkers(false); updateEstimate();
        if (!near) fillAddress(k);
      },
    });
  });
  const pts = ['from', 'stop', 'to'].map(k => draft[k]).filter(Boolean);
  if (pts.length > 1) cMarkers.line = drawRoadRoute(cMap, pts.map(p => [p.lat, p.lng]));
  if (fit && pts.length) {
    if (pts.length === 1) cMap.setView([pts[0].lat, pts[0].lng], 15);
    else fitLater(cMap, pts.map(p => [p.lat, p.lng]), { padding: 30 });
  }
}
function draftDepart() { return draft.type === 'once' ? new Date(draft.dt).getTime() : nextOcc(draft.days.length ? draft.days : [1], draft.time); }
function updateEstimate() {
  const box = $('#estBox'); if (!box) return;
  const d = draft;
  if (!d.from || !d.to) { box.className = 'est-box empty-est'; box.innerHTML = '출발지와 도착지를 정하면 예상 요금이 계산돼요'; return; }
  box.className = 'est-box';
  const pts = [d.from, d.stop, d.to].filter(Boolean);
  const est = estimateRoute(pts, draftDepart());
  const fake = { from: d.from, to: d.to, stops: d.stop ? [d.stop] : [], split: d.split, max: d.max, members: [], type: d.type, departAt: draftDepart(), days: d.days, time: d.time };
  const myPay = projectedPrepay(fake, pts.length - 1);
  let segHtml = '';
  if (d.stop) {
    const a = roadKm(d.from, d.stop), b = roadKm(d.stop, d.to);
    segHtml = `<div class="er"><span>구간 ① ${esc(d.from.name)} → ${esc(d.stop.name)}</span><span>${won(est.fare * a / (a + b))}</span></div>
               <div class="er"><span>구간 ② ${esc(d.stop.name)} → ${esc(d.to.name)}</span><span>${won(est.fare * b / (a + b))}</span></div>`;
  }
  box.innerHTML = `
    <div class="er"><span>예상 거리 · 시간</span><span>${est.km.toFixed(1)}km · 약 ${est.minutes}분</span></div>
    <div class="er"><span>예상 요금 ${est.night ? '(심야할증 포함)' : ''}</span><span>${won(est.fare)}</span></div>
    ${segHtml}
    <div class="er big"><span>내 선결제 (${d.max}명 기준${d.split === 'distance' && d.stop ? ', 끝까지 탑승' : ''})</span><b>${won(myPay)}</b></div>`;
}
async function submitCreate() {
  const d = draft;
  if (!d.from || !d.to) return toast('출발지와 도착지를 정해 주세요');
  if (distKm(d.from, d.to) < 0.2) return toast('출발지와 도착지가 너무 가까워요');
  if (d.type === 'once' && new Date(d.dt).getTime() < Date.now()) return toast('출발 시각은 현재 이후로 정해 주세요');
  if (d.type === 'regular' && !d.days.length) return toast('정기팟 요일을 하나 이상 골라 주세요');
  if (!S.user.card) return cardSheet(() => submitCreate());
  const p = {
    id: 'p' + Date.now(), type: d.type, max: d.max, minPeople: d.minPeople, memo: d.memo.trim(), status: 'open', split: d.split,
    from: d.from, to: d.to, stops: d.stop ? [d.stop] : [], options: { sameGender: d.sameGender, luggage: d.luggage }, safeShare: d.safeShare,
    eventId: d.eventId, dir: d.dir, members: [], host: S.user.nick, chat: [],
  };
  if (d.type === 'once') p.departAt = new Date(d.dt).getTime(); else { p.days = [...d.days]; p.time = d.time; }
  const amt = projectedPrepay(p, p.stops.length + 1);
  await autoPay(amt, '팟 생성 선결제');
  p.members.push({ ...meMember(), paid: amt, drop: p.stops.length + 1 });
  p.prepaid = amt;
  p.chat.push({ sys: true, text: `${S.user.nick}님이 팟을 만들었어요 (방장)` });
  S.pods.push(p); save();
  stack.pop(); go('pod', { id: p.id });
  setTimeout(() => botJoin(p.id), 6000);
}
// 데모: 내가 만든 팟에 잠시 후 한 명이 참여
function botJoin(id) {
  const p = getPod(id); if (!p || p.status !== 'open' || p.members.length >= p.max) return;
  const cand = PEOPLE.find(x => !p.members.some(m => m.nick === x.nick));
  const per = perPerson(podEst(p).fare, p.max);
  p.members.push({ ...cand, paid: per, drop: p.stops.length + 1 });
  p.chat.push({ sys: true, text: `${cand.nick}님이 참여했어요 (${p.members.length}/${p.max})` });
  p.chat.push({ nick: cand.nick, text: '안녕하세요! 같이 타요 🙌' });
  save();
  const top = stack[stack.length - 1];
  if (top.v === 'pod' && top.id === id && !$('.sheet-wrap')) render();
  toast(`🙌 ${esc(cand.nick)}님이 내 팟에 참여했어요`);
}

/* =====================================================
   팟 상세
   ===================================================== */
VIEWS.pod = {
  html(top) {
    const p = getPod(top.id);
    if (!p) return header('팟 상세', { backBtn: true }) + '<div class="content"><div class="empty">팟을 찾을 수 없어요</div></div>';
    const me = meIn(p);
    const t = departOf(p), est = podEst(p), n = p.members.length;
    const per = perPerson(est.fare, p.max);
    const full = n >= p.max;
    const ev = p.eventId && S.events.find(e => e.id === p.eventId);
    const lastIdx = p.stops.length + 1;
    const pts = points(p);

    const membersHtml = p.members.map(m => `<div class="member">
        <div class="avatar">${m.me ? '😎' : avatarOf(m.nick)}</div>
        <div class="mi"><b>${esc(m.nick)}${m.me ? ' (나)' : ''}</b> ${p.host === m.nick ? '<span class="tag yellow">👑 방장</span>' : ''}
          <small>${esc(m.dept)} · ${m.year}학번 · 🎓 인증${pts.length > 2 ? ` · 하차: ${esc(pts[m.drop ?? lastIdx].name)}` : ''}</small></div>
        <span class="temp">${m.manner.toFixed(1)}℃</span></div>`).join('') +
      Array.from({ length: p.max - n }, () => '<div class="member empty-seat"><div class="avatar">＋</div><div class="mi">빈자리 · 모집 중</div></div>').join('');

    let actions = '';
    if (me && p.status === 'open') {
      actions = `<section class="actions">
        <div class="paid-info">💳 ${esc(S.user.card || '등록 카드')}로 선결제 완료 · ${won(me.paid)}${p.payMode === 'weekly' ? ' (주 단위 묶음)' : ''}</div>
        <div class="act-grid">
          <button onclick="checkIn('${p.id}')" ${p.checkedIn ? 'disabled' : ''}>${p.checkedIn ? '✅ 도착 체크 완료' : '📍 도착했어요'}</button>
          <button class="taxi" onclick="callTaxi('${p.id}')">🚕 택시 부르기</button>
        </div>
        ${!isHost(p) ? `<p class="hint">택시 호출·결제는 방장(${esc(p.host)})이 해요. 데모에서는 직접 눌러볼 수 있어요.</p>` : '<p class="hint">👑 방장 혜택: 회당 300P 적립 · 매너 점수 가산</p>'}
        ${n < p.max ? `<div class="under-box"><b>⏳ 인원 미달 처리</b><small>최소 출발 인원 ${p.minPeople}명 · 현재 ${n}명</small>
          <button class="btn sm" onclick="underFlow('${p.id}')">(데모) 출발 10분 전 상황 재현</button></div>` : ''}
        <button class="btn ghost danger block" style="margin-top:10px" onclick="cancelFlow('${p.id}')">참여 취소</button>
      </section>`;
    } else if (me && p.status === 'riding') {
      actions = `<section class="actions"><div class="riding"><span class="car">🚖</span><b>${esc(p.to.name)}(으)로 이동 중</b><br><span class="plate">${esc(p.car)}</span>
        <p class="hint">차량 번호가 팟 기록에 저장됐어요${p.safeShare ? ' · 🛡️ 안심 귀가 공유 중' : ''}</p></div>
        <button class="btn primary block" style="margin-top:12px" onclick="settleFlow('${p.id}')">🧾 하차 · 실제 요금 입력</button></section>`;
    } else if (p.status === 'cancelled') {
      actions = `<section class="actions"><div class="penalty-on" style="margin:0">❌ 취소된 팟이에요 · ${esc(p.cancelReason || '')}</div></section>`;
    }
    if (p.lastSettle && me) {
      const s = p.lastSettle;
      actions += `<section class="actions settle-sum"><div class="sec-hd"><h2>🧾 정산 내역</h2><span class="muted">${s.mode === 'distance' ? '거리 비례' : '1/N'}</span></div>
        <div class="er"><span>실제 요금</span><b>${won(s.actual)}</b></div>
        <div class="er"><span>내 확정 금액</span><b>${won(s.mine)}</b></div>
        <div class="er"><span>선결제</span><span>${won(s.prepaid)}</span></div>
        <div class="er"><span>${s.diff > 0 ? '자동 추가결제' : s.diff < 0 ? '자동 부분환불' : '차액'}</span><b class="${s.diff > 0 ? 'plus' : 'minus'}">${s.diff === 0 ? '없음' : won(Math.abs(s.diff))}</b></div>
        <div class="er"><span>혼자 탔으면</span><span>${won(s.solo)} → <b class="minus">${won(s.solo - s.mine)} 절약</b></span></div></section>`;
    }

    const safety = me ? `<section class="actions">
        <div class="sec-hd" style="margin-bottom:4px"><h2>🛡️ 안전</h2></div>
        <div class="switch-row" style="border:0;margin:0;padding:6px 0"><span>안심 귀가 공유<br><small class="muted" style="font-weight:400">실시간 경로를 보호자에게 공유 · 도착 시 자동 알림</small></span>
          <label class="switch"><input type="checkbox" ${p.safeShare ? 'checked' : ''} onchange="toggleSafe('${p.id}',this.checked)"><i></i></label></div>
        <div class="list-row"><span>🚘 차량 번호 기록</span><span class="r">${p.car ? esc(p.car) : '택시 호출 후 자동 기록'}</span></div>
      </section>` : '';

    const regBox = p.type === 'regular' ? `<div class="reg-box"><b>🔁 매주 ${daysLabel(p.days)} ${p.time}</b>
        학기 단위 운영 · 종강(12/19) 시 자동 종료 · 다음 운행 ${fmtWhen(t)}
        ${me ? `<label class="switch-row"><span>이번 주 빠짐</span><label class="switch"><input type="checkbox" ${p.skipWeek ? 'checked' : ''} onchange="toggleSkip('${p.id}',this.checked)"><i></i></label></label>
        <small class="muted">빠지면 이번 주 빈자리는 1회성 참여자로 자동 모집돼요</small>` : ''}</div>` : '';

    const compare = pts.length > 2 ? splitCompareHtml(p, est.fare, me ? p.members : [...p.members, { ...meMember(), drop: lastIdx }]) : '';

    const chat = me ? `<section class="chat"><div class="sec-hd"><h2>💬 팟 채팅</h2><span class="muted">${n}명</span></div>
        <div class="chat-list" id="chatList">${p.chat.map(chatMsg).join('')}</div>
        <form class="chat-form" onsubmit="sendChat(event,'${p.id}')"><input placeholder="메시지 입력" autocomplete="off"><button>전송</button></form></section>` : '';

    const bottom = !me && p.status === 'open'
      ? `<div class="bottom-bar"><div class="bb-price"><small>1인 선결제 (예상)</small><b>${won(per)}</b></div>
         <button class="btn primary" ${full || restricted() ? 'disabled' : ''} onclick="joinFlow('${p.id}')">${full ? '모집 완료' : restricted() ? '참여 제한 중' : '참여하기'}</button></div>` : '';

    return header(ev ? `${ev.emoji} ${p.dir === 'go' ? '가는 편' : '오는 편'}` : '팟 상세', { backBtn: true, right: '<button class="sos-btn" onclick="sosSheet(\'' + p.id + '\')">🚨 긴급</button>' }) + `
    <div class="content">
      <div class="map-box" id="podMap"></div>
      <div class="pd-card">
        <div class="pc-tags">${podTags(p)}</div>
        ${p.rec ? `<div class="pc-rec">${esc(recText(p))}</div>` : ''}
        <div class="pd-route">
          <div class="pc-route"><span class="dot s"></span>${esc(p.from.name)}</div>
          ${p.stops.map(s => `<div class="pc-route" style="font-size:14px;color:var(--sub)"><span class="dot" style="background:var(--blue)"></span>${esc(s.name)} (경유·하차 가능)</div>`).join('')}
          <div class="pc-route"><span class="dot e"></span>${esc(p.to.name)}</div>
        </div>
        <div class="pd-when"><span>⏰ ${p.type === 'regular' ? `매주 ${daysLabel(p.days)} ${p.time}` : fmtWhen(t)}</span><b style="color:var(--orange)">${fmtLeft(t)}</b></div>
        <div class="grid3">
          <div><small>거리 · 시간</small><b>${est.km.toFixed(1)}km · ${est.minutes}분</b></div>
          <div><small>예상 요금</small><b>${won(est.fare)}</b>${est.night ? '<em>심야할증</em>' : ''}</div>
          <div><small>1인 (${p.max}명)</small><b class="accent">${won(per)}</b></div>
        </div>
        <div class="memo" style="display:flex;justify-content:space-between"><span>👥 최소 출발 ${p.minPeople}명</span><span>🧮 ${p.split === 'distance' ? '거리 비례 정산' : '1/N 정산'}</span></div>
        ${p.memo ? `<div class="memo">📝 ${esc(p.memo)}</div>` : ''}
      </div>
      ${regBox}
      <section><div class="sec-hd"><h2>👥 참여자</h2><span class="muted">${n}/${p.max}</span></div><div class="members">${membersHtml}</div></section>
      ${compare}
      ${actions ? `<section>${actions}</section>` : ''}
      ${safety ? `<section>${safety}</section>` : ''}
      ${chat ? `<section>${chat}</section>` : ''}
      <div class="policy"><b>💳 결제 안내</b> 예상 요금의 내 몫을 등록 카드로 자동 선결제 → 하차 후 실제 요금에 맞춰 자동 추가결제/부분환불 (상한: 예상의 30%).<br>
      <b>⏱ 취소</b> 1시간 전까지 전액 환불 · 1시간~10분 전 50% 차감 · 10분 전 이후/노쇼 환불 없음</div>
    </div>${bottom}`;
  },
  mount(top) {
    const p = getPod(top.id); if (!p) return;
    const m = makeMap($('#podMap'));
    if (m) drawRoute(m, p);
    const cl = $('#chatList'); if (cl) cl.scrollTop = cl.scrollHeight;
  },
};
function splitCompareHtml(p, total, members) {
  const eq = splitFare(p, total, 'equal', members), di = splitFare(p, total, 'distance', members);
  const pts = points(p);
  return `<section><div class="sec-hd"><h2>🧮 예상 분담금 비교</h2><span class="muted">예상 ${won(total)} 기준</span></div>
    <div class="card"><table class="cmp"><tr><th>참여자</th><th>하차</th><th>1/N</th><th>거리 비례</th></tr>
    ${members.map((m, i) => `<tr class="${m.me ? 'me' : ''}"><td>${esc(m.nick)}${m.me ? ' (나)' : ''}</td><td>${esc(pts[m.drop ?? pts.length - 1].name)}</td><td>${won(eq[i].amt)}</td><td><b>${won(di[i].amt)}</b></td></tr>`).join('')}
    </table><p class="hint">구간별로 나눠서, 그 구간에 타고 있던 사람끼리 나눠요. 구간 요금은 지도 거리 비율로 추정 → 실제 총 요금에 맞춰 조정.</p></div></section>`;
}
function chatMsg(m) {
  if (m.sys) return `<div class="msg sys">${esc(m.text)}</div>`;
  if (m.me) return `<div class="msg me"><span class="bubble">${esc(m.text)}</span></div>`;
  return `<div class="msg"><div class="who">${esc(m.nick)}</div><span class="bubble">${esc(m.text)}</span></div>`;
}
function refreshChat(p) {
  const cl = $('#chatList'); if (!cl) return;
  cl.innerHTML = p.chat.map(chatMsg).join(''); cl.scrollTop = cl.scrollHeight;
}
function sendChat(e, id) {
  e.preventDefault();
  const inp = e.target.querySelector('input'); const text = inp.value.trim(); if (!text) return;
  const p = getPod(id);
  p.chat.push({ me: true, text }); inp.value = ''; save(); refreshChat(p);
  const others = p.members.filter(m => !m.me);
  if (others.length) setTimeout(() => {
    const o = others[Math.floor(Math.random() * others.length)];
    p.chat.push({ nick: o.nick, text: CANNED[Math.floor(Math.random() * CANNED.length)] }); save(); refreshChat(p);
  }, 1300);
}
function checkIn(id) {
  const p = getPod(id); p.checkedIn = true;
  p.chat.push({ sys: true, text: `📍 ${S.user.nick}님이 집합 장소에 도착했어요` }); save(); render();
  toast('📍 도착 체크인 완료! 노쇼 판정에서 제외돼요');
}
function toggleSkip(id, on) {
  const p = getPod(id); p.skipWeek = on;
  p.chat.push({ sys: true, text: on ? `📅 ${S.user.nick}님이 이번 주 빠져요 → 빈자리 1회성 참여자 자동 모집 중` : `📅 ${S.user.nick}님이 이번 주 다시 참여해요` });
  save(); render(); toast(on ? '이번 주 빈자리를 1회성으로 모집할게요' : '이번 주 참여로 바꿨어요');
}
function toggleSafe(id, on) {
  const p = getPod(id); p.safeShare = on; save();
  if (!on) { render(); return toast('안심 귀가 공유를 껐어요'); }
  openSheet(`<h3>🛡️ 안심 귀가 공유</h3>
    <p class="sub">탑승 중 실시간 경로를 보호자에게 링크로 공유하고, 목적지에 도착하면 "안전하게 도착했어요" 알림을 자동으로 보내요.</p>
    <div class="route-mini"><div>🔗 <b>ajoupot.app/s/${p.id.slice(-4)}x9k</b></div></div>
    <div class="choice">${S.user.safeContacts.map(c => `<label><input type="checkbox" checked> ${esc(c)}</label>`).join('')}<label><input type="checkbox"> 친구 · 010-****-2207</label></div>
    <button class="btn primary block" onclick="closeSheet();render();toast('🛡️ 안심 귀가 공유 켜짐 (데모: 실제 전송 없음)')">공유 시작</button>`);
}
function sosSheet(id) {
  const p = getPod(id);
  openSheet(`<h3 style="color:var(--red)">🚨 긴급 신고</h3>
    <p class="sub">112에 연결하고 아래 정보를 함께 전송해요.</p>
    <div class="route-mini">
      <div>📍 현재 위치: ${esc(p.from.name)} 부근</div>
      <div>🚘 차량 번호: ${esc(p.car || '미기록')}</div>
      <div>👥 동승자: ${p.members.map(m => esc(m.nick)).join(', ')}</div>
    </div>
    <button class="btn block" style="background:var(--red);color:#fff;margin-top:14px" onclick="this.innerHTML='📞 (데모) 112 연결 화면 — 실제 전화는 걸리지 않아요'">📞 112 연결</button>
    <button class="btn ghost block" style="margin-top:8px" onclick="closeSheet();toast('보호자에게 위치와 차량 번호를 보냈어요 (데모)')">보호자에게 위치 알림</button>`);
}

/* ---------- 참여 ---------- */
function joinFlow(id) {
  const p = getPod(id);
  if (!p) return;
  if (restricted()) return toast(`🚫 노쇼 누적으로 ${fmtDate(S.user.penaltyUntil)}까지 참여가 제한돼요`);
  if (meIn(p)) return go('pod', { id });
  if (p.members.length >= p.max) return toast('이미 모집이 끝난 팟이에요');
  if (!S.user.card) return cardSheet(() => joinFlow(id));
  const pts = points(p);
  const last = pts.length - 1;
  const t = departOf(p);
  const amtFor = drop => projectedPrepay(p, drop);
  openSheet(`<h3>팟 참여하기</h3>
    <p class="sub">${esc(p.from.name)} → ${esc(p.to.name)} · ${p.type === 'regular' ? `매주 ${daysLabel(p.days)} ${p.time}` : fmtWhen(t)}</p>
    ${pts.length > 2 ? `<div class="field"><span class="field-label">어디서 내리세요? (거리 비례 정산)</span>
      <div class="choice" style="margin:0">${pts.slice(1).map((x, i) => `<label><input type="radio" name="drop" value="${i + 1}" ${i + 1 === last ? 'checked' : ''}> ${esc(x.name)}<small>예상 선결제 ${won(amtFor(i + 1))}</small></label>`).join('')}</div></div>` : ''}
    ${p.type === 'regular' ? `<div class="field"><span class="field-label">정기팟 결제 방식</span>
      <div class="choice" style="margin:0">
        <label><input type="radio" name="pm" value="each" checked> 매회 자동결제<small>운행할 때마다 1회분 자동결제</small></label>
        <label><input type="radio" name="pm" value="weekly"> 주 단위 묶음 결제<small>한 주(${p.days.length}회분)를 한 번에</small></label>
      </div></div>` : ''}
    <div class="calc"><div class="er"><span>결제 수단</span><b>💳 ${esc(S.user.card)}</b></div><div class="er big"><span>자동 선결제 금액</span><b id="joinAmt">${won(amtFor(last))}</b></div></div>
    <ul class="pay-notes"><li>하차 후 실제 요금에 맞춰 자동 추가결제 / 부분환불돼요</li><li>출발 1시간 전까지 취소하면 전액 환불</li><li>인원 미달로 팟이 취소되면 전액 환불 (패널티 없음)</li></ul>
    <button class="btn primary block" id="joinBtn">참여하고 자동결제</button>`);
  const calcAmt = () => {
    const dropEl = $('input[name=drop]:checked'); const drop = dropEl ? +dropEl.value : last;
    const pmEl = $('input[name=pm]:checked'); const weekly = pmEl && pmEl.value === 'weekly';
    const a = amtFor(drop);
    $('#joinAmt').textContent = won(weekly ? a * p.days.length : a);
    return { drop, a, weekly };
  };
  $$('input[name=drop],input[name=pm]').forEach(i => i.onchange = calcAmt);
  $('#joinBtn').onclick = async () => {
    const { drop, a, weekly } = calcAmt();
    closeSheet(true);
    await autoPay(weekly ? a * p.days.length : a, '선결제');
    p.members.push({ ...meMember(), paid: a, drop });
    p.payMode = weekly ? 'weekly' : 'each';
    p.chat.push({ sys: true, text: `${S.user.nick}님이 참여했어요 (${p.members.length}/${p.max})` });
    if (p.members.length >= p.max) p.chat.push({ sys: true, text: '🎉 팟이 꽉 찼어요! 방장이 택시를 부를 수 있어요' });
    const h = new Date(departOf(p)).getHours();
    if ((h >= 23 || h < 4 || p.dir === 'back') && !p.safeShare) { p.safeShare = true; p.chat.push({ sys: true, text: '🌙 심야/귀가 팟이라 안심 귀가 공유가 자동으로 켜졌어요' }); }
    save();
    const top = stack[stack.length - 1];
    if (top.v === 'pod' && top.id === id) render(); else go('pod', { id });
    const other = p.members.find(m => !m.me);
    if (other) setTimeout(() => { p.chat.push({ nick: other.nick, text: '환영해요! 🙌' }); save(); refreshChat(p); }, 1200);
  };
}

/* ---------- 인원 미달 처리 ---------- */
function underFlow(id) {
  const p = getPod(id), n = p.members.length;
  const est = podEst(p);
  if (n < p.minPeople) return autoCancel(p, `최소 출발 인원(${p.minPeople}명) 미달`);
  const newPer = perPerson(est.fare, n);
  const me = meIn(p);
  const others = p.members.filter(m => !m.me);
  openSheet(`<h3>⏳ 출발 10분 전 · 인원 미달</h3>
    <p class="sub">${p.max}명 모집 팟에 현재 ${n}명이에요.</p>
    <div class="under-q">현재 ${n}명이에요.<br><b>1인 예상 ${won(newPer)}</b>으로 출발할까요?</div>
    <div class="resp">${others.map(m => `<div class="list-row"><span>${avatarOf(m.nick)} ${esc(m.nick)}</span><span class="r" data-r="${esc(m.nick)}">응답 대기…</span></div>`).join('')}</div>
    <p class="hint">전원 동의 → 바뀐 금액으로 선결제 자동 조정(추가결제 ${won(Math.max(0, newPer - me.paid))}) · 한 명이라도 거절하면 자동 취소·전액 환불(패널티 없음)</p>
    <div style="display:flex;gap:8px;margin-top:14px"><button class="btn ghost block" id="uNo">취소</button><button class="btn primary block" id="uYes">출발</button></div>`);
  $('#uNo').onclick = () => { closeSheet(true); autoCancel(p, `${S.user.nick}님이 출발을 거절`); };
  $('#uYes').onclick = async () => {
    $('#uYes').disabled = true; $('#uNo').disabled = true; $('#uYes').textContent = '응답 기다리는 중…';
    let declined = null;
    for (let i = 0; i < others.length; i++) {
      await wait(800);
      const no = p.declineSim && i === others.length - 1;
      const el = $(`[data-r="${others[i].nick}"]`);
      if (el) { el.innerHTML = no ? '<b style="color:var(--red)">❌ 거절</b>' : '<b style="color:var(--green)">✅ 동의</b>'; }
      if (no) { declined = others[i].nick; break; }
    }
    await wait(700);
    closeSheet(true);
    if (declined) return autoCancel(p, `${declined}님이 출발을 거절`);
    const add = newPer - me.paid;
    p.members.forEach(m => m.paid = newPer);
    p.max = n;
    p.chat.push({ sys: true, text: `✅ 전원 동의 · ${n}명이 1인 ${won(newPer)}으로 출발해요` });
    save();
    if (add > 0) await autoPay(add, '인원 미달 추가결제');
    render();
  };
}
function autoCancel(p, reason) {
  const me = meIn(p);
  const refund = me ? me.paid : 0;
  p.status = 'cancelled'; p.cancelReason = reason;
  p.chat.push({ sys: true, text: `❌ 팟 자동 취소 (${reason}) · 전원 전액 환불` });
  save(); render();
  const sim = S.pods.filter(x => x.status === 'open' && x.id !== p.id && !meIn(x) && x.type === 'once' && !x.eventId && x.members.length < x.max)
    .sort((a, b) => (distKm(a.to, p.to) - distKm(b.to, p.to)) || (departOf(a) - departOf(b))).slice(0, 2);
  openSheet(`<h3>팟이 자동 취소됐어요</h3>
    <p class="sub">${esc(reason)} → 참여자 전원 <b>전액 환불</b> · 패널티 없음</p>
    <div class="calc"><div class="er big"><span>💳 환불 금액</span><b class="minus">${won(refund)}</b></div></div>
    <div class="sec-hd"><h2>🔁 비슷한 시간·경로의 다른 팟</h2></div>
    ${sim.map(x => podCard(x, { joinBtn: true })).join('') || '<div class="empty">비슷한 팟이 없어요</div>'}`);
}

/* ---------- 참여 취소 & 노쇼 ---------- */
function cancelFlow(id) {
  const p = getPod(id), me = meIn(p);
  const mins = (departOf(p) - Date.now()) / MIN;
  const rate = mins >= 60 ? 1 : mins >= 10 ? 0.5 : 0;
  const refund = Math.round(me.paid * rate), lost = me.paid - refund;
  const cur = rate === 1 ? 0 : rate === 0.5 ? 1 : 2;
  openSheet(`<h3>참여를 취소할까요?</h3>
    <p class="sub">출발까지 <b>${Math.max(0, Math.round(mins))}분</b> 남았어요.</p>
    <div class="rules" style="margin-top:12px">
      <div class="rule ${cur === 0 ? 'cur' : ''}"><span>출발 1시간 전까지</span><span>전액 환불</span></div>
      <div class="rule ${cur === 1 ? 'cur' : ''}"><span>1시간 ~ 10분 전</span><span>50% 차감</span></div>
      <div class="rule ${cur === 2 ? 'cur' : ''}"><span>10분 전 이후 · 노쇼</span><span>환불 없음 + 노쇼 1회</span></div>
    </div>
    <div class="calc"><div class="er"><span>선결제</span><span>${won(me.paid)}</span></div><div class="er"><span>차감</span><span class="plus">-${won(lost)}</span></div><div class="er big"><span>환불 예정</span><b class="minus">${won(refund)}</b></div></div>
    ${rate === 0 ? '<p class="hint" style="color:var(--red)">⚠️ 노쇼 2회 → 7일, 3회 이상 → 30일 참여 제한. 차감 금액은 남은 사람들의 부담을 줄이는 데 쓰여요.</p>' : ''}
    ${isHost(p) && p.members.length > 1 ? `<p class="hint">👑 방장 권한은 ${esc(p.members.find(m => !m.me).nick)}님에게 넘어가요.</p>` : ''}
    <div style="display:flex;gap:8px;margin-top:12px"><button class="btn ghost block" onclick="closeSheet()">돌아가기</button><button class="btn block" style="background:var(--red);color:#fff" id="doCancel">취소하기</button></div>`);
  $('#doCancel').onclick = () => {
    p.members = p.members.filter(m => !m.me);
    p.checkedIn = false; p.skipWeek = false;
    p.chat.push({ sys: true, text: `${S.user.nick}님이 참여를 취소했어요` });
    if (p.host === S.user.nick) {
      if (p.members.length) { p.host = p.members[0].nick; p.chat.push({ sys: true, text: `👑 ${p.host}님이 새 방장이 됐어요` }); }
      else S.pods = S.pods.filter(x => x !== p);
    }
    if (rate === 0) addNoShow(`${p.from.name} → ${p.to.name}`);
    save(); closeSheet(true);
    if (!getPod(id)) { back(); } else render();
    toast(rate === 0 ? `😢 노쇼 처리 · 환불 없음 (누적 ${S.user.noShows.length}회)` : `💳 ${won(refund)} 자동 환불됐어요`);
  };
}
function addNoShow(route) {
  S.user.noShows.push({ date: Date.now(), route });
  const c = S.user.noShows.length;
  if (c >= 3) S.user.penaltyUntil = Date.now() + 30 * DAYMS;
  else if (c === 2) S.user.penaltyUntil = Date.now() + 7 * DAYMS;
  S.user.manner = Math.max(0, +(S.user.manner - 1.5).toFixed(1));
  save();
}

/* ---------- 택시 부르기 ---------- */
function uberLink(p) {
  const e = encodeURIComponent;
  return `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${p.from.lat}&pickup[longitude]=${p.from.lng}&pickup[nickname]=${e(p.from.name)}` +
    `&dropoff[latitude]=${p.to.lat}&dropoff[longitude]=${p.to.lng}&dropoff[nickname]=${e(p.to.name)}`;
}
function callTaxi(id) {
  const p = getPod(id);
  openSheet(`<h3>🚕 택시 부르기</h3>
    <p class="sub">출발지·목적지가 입력된 상태로 호출 앱이 열려요. 아주팟은 직접 배차하지 않고 호출 앱으로 "이어주는" 역할이에요.</p>
    <div class="route-mini"><div><span class="dot s"></span>${esc(p.from.name)}</div>${p.stops.map(s => `<div><span class="dot" style="background:var(--blue)"></span>${esc(s.name)} (경유)</div>`).join('')}<div><span class="dot e"></span>${esc(p.to.name)}</div></div>
    <button class="call kakao" onclick="kakaoMock('${id}')"><span class="call-logo">T</span><span><b>카카오 T</b><small>앱 연결 연출 · 출발/도착 자동입력은 제휴 필요</small></span></button>
    <button class="call uber" onclick="uberCall('${id}')"><span class="call-logo">Uber</span><span><b>Uber</b><small>공식 딥링크로 실제 연결 (새 창)</small></span></button>
    <p class="hint">호출 후 차량 번호가 팟 기록에 자동 저장·공유돼요 (안전용)</p>`);
}
function uberCall(id) {
  const p = getPod(id);
  window.open(uberLink(p), '_blank', 'noopener');
  setSheet(`<h3>Uber에서 호출하셨나요?</h3>
    <p class="sub">새 창에서 Uber가 출발/도착이 입력된 상태로 열렸어요. 배차된 차량 번호를 입력하면 팟에 기록·공유돼요.</p>
    <label class="field"><span>차량 번호</span><input type="text" id="carNo" value="경기 12가 3456"></label>
    <button class="btn primary block" style="margin-top:14px" onclick="startRide('${id}',document.getElementById('carNo').value)">차량 번호 공유하고 탑승 시작</button>`);
}
async function kakaoMock(id) {
  const p = getPod(id), est = podEst(p);
  setSheet(`<div class="kt"><div class="kt-hd">kakao T <small>데모 연출 화면</small></div><div class="kt-body">
    <div class="kt-row">🟢 ${esc(p.from.name)}</div>${p.stops.map(s => `<div class="kt-row">🔵 ${esc(s.name)}</div>`).join('')}<div class="kt-row">🔴 ${esc(p.to.name)}</div>
    <div class="kt-fare"><span>일반호출 예상</span><b>${won(est.fare)}</b></div>
    <button class="kt-btn" id="ktCall">호출하기</button></div></div>
    <p class="hint">※ 실제 카카오T는 앱 실행까지만 확실하고, 출발/도착 자동입력은 카카오모빌리티 제휴(파트너 API)가 필요해요.</p>`);
  $('#ktCall').onclick = async () => {
    setSheet(`<div class="searching"><div class="radar">🚕</div><b>주변 택시를 찾고 있어요…</b></div>`);
    await wait(1600);
    const car = '경기 31바 2741';
    setSheet(`<div class="searching"><div style="font-size:44px">🚖</div><b>배차 완료!</b><br><span class="plate">${car}</span><p class="hint">쏘나타 · 흰색 · 3분 후 도착</p></div>
      <button class="btn primary block" onclick="startRide('${id}','${car}')">차량 번호 공유하고 탑승 시작</button>`);
  };
}
function startRide(id, car) {
  const p = getPod(id);
  p.status = 'riding'; p.car = (car || '').trim() || '미기록';
  p.chat.push({ sys: true, text: `🚕 택시 호출 완료 · 차량번호 ${p.car} (안전을 위해 기록·공유됨)` });
  if (p.safeShare) p.chat.push({ sys: true, text: '🛡️ 보호자에게 실시간 경로 공유 시작' });
  save(); closeSheet(true); render();
  toast('🚖 탑승 시작! 차량 번호가 기록됐어요');
}

/* ---------- 정산 ---------- */
function settleFlow(id) {
  const p = getPod(id), est = podEst(p);
  const hasStops = p.stops.length > 0;
  let mode = p.split === 'distance' && hasStops ? 'distance' : 'equal';
  const suggest = Math.round((est.fare * 1.15) / 100) * 100;
  openSheet(`<h3>🧾 하차 · 실제 요금 입력</h3>
    <p class="sub">${isHost(p) ? '방장이 실제 요금을 입력하면 모두에게 자동 정산돼요.' : '(데모) 방장이 입력하는 화면이에요.'} 예상 요금 ${won(est.fare)}</p>
    <label class="field"><span>실제 택시 요금</span><input type="number" id="actualFare" value="${suggest}" step="100" min="1000"></label>
    <label class="receipt" id="rcpt"><input type="file" accept="image/*" onchange="this.parentNode.classList.add('done');this.parentNode.lastChild.textContent=' 영수증 첨부됨'">📷<span> 영수증 사진 첨부</span></label>
    ${hasStops ? `<div class="seg" style="margin-top:12px"><button data-m="equal">1/N</button><button data-m="distance">거리 비례</button></div>` : ''}
    <div class="calc" id="calc"></div>
    <button class="btn primary block" id="settleBtn">정산 확정</button>`);
  const calc = () => {
    const actual = Math.max(0, +$('#actualFare').value || 0);
    const rows = splitFare(p, actual, mode);
    $$('.sheet .seg button').forEach(b => b.classList.toggle('on', b.dataset.m === mode));
    const cap = est.fare * 1.3;
    $('#calc').innerHTML = `<table class="cmp"><tr><th>참여자</th><th>선결제</th><th>확정</th><th>차액</th></tr>
      ${rows.map(r => { const d = r.amt - r.m.paid; return `<tr class="${r.m.me ? 'me' : ''}"><td>${esc(r.m.nick)}${r.m.me ? ' (나)' : ''}</td><td>${won(r.m.paid)}</td><td>${won(r.amt)}</td><td class="${d > 0 ? 'plus' : 'minus'}">${d > 0 ? '+' : ''}${d === 0 ? '-' : won(d)}</td></tr>`; }).join('')}</table>
      ${mode === 'distance' ? `<div style="margin-top:8px">${rows[0].segs.map((s, i) => `<div class="er" style="font-size:12px"><span>구간${i + 1} ${esc(s.from)}→${esc(s.to)}</span><span>${won(s.fare)} ÷ ${s.riders.length}명</span></div>`).join('')}</div>` : ''}
      <div class="er big"><span>👑 방장(${esc(p.host)})에게 일괄 지급</span><b>${won(rows.reduce((a, r) => a + r.amt, 0))}</b></div>
      ${actual > cap ? '<p class="hint" style="color:var(--orange)">⚠️ 예상 요금의 130% 초과 — 상한 초과분은 참여자 확인 후 청구돼요</p>' : ''}`;
    return { actual, rows };
  };
  $('#actualFare').oninput = calc;
  $$('.sheet .seg button').forEach(b => b.onclick = () => { mode = b.dataset.m; calc(); });
  calc();
  $('#settleBtn').onclick = async () => {
    const { actual, rows } = calc();
    if (actual < 1000) return toast('실제 요금을 입력해 주세요');
    const mineRow = rows.find(r => r.m.me);
    const diff = mineRow.amt - mineRow.m.paid;
    closeSheet(true);
    const ld = loader(diff > 0 ? `💳 1인 차액 자동 추가결제 중...` : diff < 0 ? '💳 차액 자동 부분환불 중...' : '정산 중...');
    await wait(1000); ld.close();
    // 혼자 탔으면: 내 하차 지점까지 구간 요금 (실제/예상 비율로 보정)
    const pts = points(p).slice(0, (mineRow.m.drop ?? p.stops.length + 1) + 1);
    const soloEst = estimateRoute(pts, departOf(p)).fare;
    const solo = Math.round(soloEst * (actual / est.fare) / 100) * 100;
    const finalSolo = pts.length === points(p).length ? actual : solo;
    p.lastSettle = { actual, mine: mineRow.amt, prepaid: mineRow.m.paid, diff, solo: finalSolo, mode };
    S.history.unshift({ id: 'h' + Date.now(), date: Date.now(), route: `${p.from.name} → ${pts[pts.length - 1].name}`, fare: actual, n: p.members.length, paid: mineRow.amt, solo: finalSolo, km: estimateRoute(pts).km, host: isHost(p) });
    p.chat.push({ sys: true, text: `🧾 정산 완료 · 실제 ${won(actual)} · ${diff > 0 ? `1인 ${won(diff)} 추가결제` : diff < 0 ? `1인 ${won(-diff)} 부분환불` : '차액 없음'}` });
    if (p.safeShare) p.chat.push({ sys: true, text: '🛡️ "안전하게 도착했어요" 알림을 보호자에게 보냈어요' });
    let hostBonus = 0;
    if (isHost(p)) { hostBonus = 300; S.user.points += 300; S.user.hostRides = (S.user.hostRides || 0) + 1; }
    if (p.type === 'regular') { p.status = 'open'; p.checkedIn = false; p.car = null; p.skipWeek = false; }
    else p.status = 'done';
    save(); render();
    rateFlow(p, finalSolo, mineRow.amt, diff, hostBonus);
  };
}
function rateFlow(p, solo, mine, diff, hostBonus) {
  const others = p.members.filter(m => !m.me);
  openSheet(`<div class="saved-hero"><small>혼자 탔으면 ${won(solo)}</small><b>오늘 ${won(Math.max(0, solo - mine))} 아꼈어요 🎉</b>
    <span>${diff > 0 ? `차액 ${won(diff)} 자동 추가결제 완료` : diff < 0 ? `차액 ${won(-diff)} 자동 환불 완료` : '추가 정산 없음'}${hostBonus ? ` · 👑 방장 포인트 +${hostBonus}P` : ''}</span></div>
    <h3 style="margin-top:16px">함께 탄 학우를 평가해 주세요</h3>
    <p class="sub">매너 온도에 반영돼요</p>
    ${others.map((m, i) => `<div class="rate-row"><span>${avatarOf(m.nick)} <b>${esc(m.nick)}</b></span><div class="rate-btns" data-i="${i}"><button data-v="1">😊</button><button data-v="0" class="on">😐</button><button data-v="-1">😞</button></div></div>`).join('')}
    <button class="btn primary block" style="margin-top:14px" id="rateBtn">평가 완료</button>`);
  $$('.rate-btns').forEach(g => g.onclick = e => { const b = e.target.closest('button'); if (!b) return; $$('button', g).forEach(x => x.classList.toggle('on', x === b)); });
  $('#rateBtn').onclick = () => {
    $$('.rate-btns').forEach(g => { const v = +$('button.on', g).dataset.v; const m = others[+g.dataset.i]; m.manner = +(m.manner + v * 0.3).toFixed(1); });
    S.user.manner = +(S.user.manner + 0.2 + (hostBonus ? 0.1 : 0)).toFixed(1);
    save(); closeSheet(); render();
    toast(`평가 완료! 내 매너 온도 +${hostBonus ? '0.3' : '0.2'}℃`);
  };
}

/* =====================================================
   거리 비례 정산 계산기
   ===================================================== */
const CALC = { total: 14000, people: [{ nick: 'A', drop: 1 }, { nick: 'B', drop: 2 }] };
VIEWS.calc = {
  html() {
    const p = { from: PLACES.gate, stops: [PLACES.suwon], to: PLACES.seryu };
    const pts = points(p);
    const eq = splitFare(p, CALC.total, 'equal', CALC.people);
    const di = splitFare(p, CALC.total, 'distance', CALC.people);
    return header('거리 비례 정산 계산기', { backBtn: true }) + `<div class="content">
      <div class="card">
        <div style="font-size:13px;color:var(--sub)">예시 경로</div>
        <div class="pd-route"><div class="pc-route"><span class="dot s"></span>아주대 정문</div><div class="pc-route"><span class="dot" style="background:var(--blue)"></span>수원역 (경유·하차)</div><div class="pc-route"><span class="dot e"></span>세류역</div></div>
        <label class="field"><span>총 택시 요금</span><input type="number" step="100" value="${CALC.total}" onchange="CALC.total=Math.max(0,+this.value||0);render()"></label>
      </div>
      <section><div class="sec-hd"><h2>👥 탑승자 & 하차 위치</h2>${CALC.people.length < 4 ? '<button class="btn sm" onclick="CALC.people.push({nick:String.fromCharCode(65+CALC.people.length),drop:2});render()">＋ 추가</button>' : ''}</div>
        <div class="card">${CALC.people.map((m, i) => `<div class="list-row"><b>${m.nick}</b>
          <div class="seg" style="width:200px">${[1, 2].map(d => `<button class="${m.drop === d ? 'on' : ''}" onclick="CALC.people[${i}].drop=${d};render()">${pts[d].name}</button>`).join('')}</div>
          ${CALC.people.length > 2 ? `<button class="btn sm" onclick="CALC.people.splice(${i},1);render()">✕</button>` : ''}</div>`).join('')}</div></section>
      <section><div class="sec-hd"><h2>구간별 요금 (지도 거리 비율)</h2></div>
        <div class="card">${di[0].segs.map((s, i) => `<div class="list-row"><span>구간${i + 1} ${s.from} → ${s.to}</span><span class="r">${won(s.fare)} ÷ <b>${s.riders.join('·')}</b></span></div>`).join('')}</div></section>
      <section><div class="sec-hd"><h2>1/N vs 거리 비례</h2></div>
        <div class="card"><table class="cmp"><tr><th>탑승자</th><th>하차</th><th>1/N</th><th>거리 비례</th></tr>
        ${CALC.people.map((m, i) => `<tr><td><b>${m.nick}</b></td><td>${pts[m.drop].name}</td><td>${won(eq[i].amt)}</td><td><b style="color:var(--blue)">${won(di[i].amt)}</b></td></tr>`).join('')}</table>
        <p class="hint">💡 먼저 내리는 사람은 자기가 탄 구간만 나눠 내고, 끝까지 가는 사람은 남은 구간을 더 내요. 팟을 만들 때 "1/N" 또는 "거리 비례"를 고를 수 있어요.</p></div></section>
    </div>`;
  },
};

/* =====================================================
   이벤트
   ===================================================== */
VIEWS.events = {
  html() {
    const evs = [...S.events].sort((a, b) => b.interest - a.interest);
    return header('이벤트 팟', { right: '<button class="btn sm primary" onclick="proposeEvent()">＋ 제안</button>' }) + `<div class="content">
      <p class="hint" style="margin:0 0 12px">콘서트·축제·경기 등 행사 단위로 가는 편 / 오는 편 팟을 모아봐요. 오는 편(심야 귀가)은 🛡️ 안심 귀가 공유가 기본으로 켜져요.</p>
      ${evs.map((e, i) => {
        const pods = S.pods.filter(p => p.eventId === e.id && p.status === 'open');
        const liked = (S.user.likes || []).includes(e.id);
        return `<div class="ev-card" onclick="go('event',{id:'${e.id}'})">
          <div class="ev-emoji" style="background:${e.color}">${e.emoji}</div>
          <div class="ev-body">${i === 0 ? '<span class="tag red">🔥 인기</span>' : ''}<b>${esc(e.title)}</b><small>📍 ${esc(PLACES[e.place] ? PLACES[e.place].name : e.place)} · 📅 ${fmtWhen(e.date)}</small>
            <div class="ev-counts"><span class="tag blue">가는 편 ${pods.filter(p => p.dir === 'go').length}팟</span><span class="tag yellow">오는 편 ${pods.filter(p => p.dir === 'back').length}팟</span></div></div>
          <button class="ev-like ${liked ? 'on' : ''}" onclick="event.stopPropagation();likeEvent('${e.id}')">♥<span>${e.interest}</span></button></div>`;
      }).join('')}
    </div>`;
  },
};
function likeEvent(id) {
  const e = S.events.find(x => x.id === id); S.user.likes = S.user.likes || [];
  if (S.user.likes.includes(id)) { S.user.likes = S.user.likes.filter(x => x !== id); e.interest--; } else { S.user.likes.push(id); e.interest++; }
  save(); render();
}
function proposeEvent() {
  const opts = Object.entries(PLACES).filter(([k]) => !['gate', 'yulgok', 'paldal', 'samgeori'].includes(k));
  openSheet(`<h3>🎉 이벤트 제안하기</h3><p class="sub">누구나 제안할 수 있어요. 관심이 많은 이벤트는 상단에 노출돼요.</p>
    <label class="field"><span>이벤트 이름</span><input type="text" id="evTitle" placeholder="예: 수원 화성 문화제"></label>
    <label class="field"><span>아이콘</span><select id="evEmoji">${['🎤', '🎪', '⚽', '⚾', '🎆', '🎭', '🏃'].map(x => `<option>${x}</option>`).join('')}</select></label>
    <label class="field"><span>장소</span><select id="evPlace">${opts.map(([k, p]) => `<option value="${k}">${p.name}</option>`).join('')}</select></label>
    <label class="field"><span>시작 시각</span><input type="datetime-local" id="evDate" value="${toLocalInput(roundTo5(Date.now() + 3 * DAYMS))}"></label>
    <button class="btn primary block" style="margin-top:16px" id="evBtn">제안하기</button>`);
  $('#evBtn').onclick = () => {
    const title = $('#evTitle').value.trim(); if (!title) return toast('이벤트 이름을 입력해 주세요');
    const e = { id: 'e' + Date.now(), emoji: $('#evEmoji').value, color: 'linear-gradient(135deg,#12a066,#2f6fe0)', title, place: $('#evPlace').value, date: new Date($('#evDate').value).getTime(), interest: 1, desc: '학우가 제안한 이벤트예요.' };
    S.events.push(e); S.user.likes = [...(S.user.likes || []), e.id]; save(); closeSheet(true); go('event', { id: e.id });
    toast('🎉 이벤트가 등록됐어요. 가는 편 팟을 만들어 보세요!');
  };
}
VIEWS.event = {
  html(top) {
    const e = S.events.find(x => x.id === top.id);
    const place = PLACES[e.place];
    const pods = S.pods.filter(p => p.eventId === e.id && p.status !== 'cancelled' && p.status !== 'done');
    const go_ = pods.filter(p => p.dir === 'go'), back_ = pods.filter(p => p.dir === 'back');
    return header('이벤트', { backBtn: true }) + `<div class="content">
      <div class="ev-hero" style="background:${e.color}"><div class="eh-emoji">${e.emoji}</div><h2>${esc(e.title)}</h2>
        <p>📍 ${esc(place.name)} · 📅 ${fmtWhen(e.date)}<br>${esc(e.desc)}</p><p style="margin-top:8px">♥ 관심 ${e.interest}명</p></div>
      <section><div class="dir-hd"><h3>🏫 → ${esc(place.name)} <span class="muted">가는 편</span></h3>
        <button class="btn sm" onclick="startCreate({from:PLACES.gate,to:PLACES['${e.place}'],eventId:'${e.id}',dir:'go',at:${e.date - 120 * MIN}})">＋ 만들기</button></div>
        ${go_.map(p => podCard(p, { joinBtn: true })).join('') || '<div class="empty" style="padding:20px">아직 가는 편 팟이 없어요</div>'}</section>
      <section><div class="dir-hd"><h3>${esc(place.name)} → 🏫 <span class="muted">오는 편</span></h3>
        <button class="btn sm" onclick="startCreate({from:PLACES['${e.place}'],to:PLACES.gate,eventId:'${e.id}',dir:'back',at:${e.date + 180 * MIN}})">＋ 만들기</button></div>
        <p class="hint" style="margin:-2px 0 8px">🛡️ 오는 편은 안심 귀가 공유가 기본으로 켜져요</p>
        ${back_.map(p => podCard(p, { joinBtn: true })).join('') || '<div class="empty" style="padding:20px">아직 오는 편 팟이 없어요</div>'}</section>
    </div>`;
  },
};

/* =====================================================
   내 팟
   ===================================================== */
VIEWS.mypods = {
  html() {
    const mine = S.pods.filter(p => meIn(p));
    const active = mine.filter(p => p.type === 'once' && ['open', 'riding'].includes(p.status)).sort((a, b) => departOf(a) - departOf(b));
    const regular = mine.filter(p => p.type === 'regular');
    const ended = S.pods.filter(p => (p.status === 'cancelled' && p.members.some(m => m.me)) || (p.status === 'done' && meIn(p)));
    const segBtn = (k, label, n) => `<button class="${UI.myTab === k ? 'on' : ''}" onclick="UI.myTab='${k}';render()">${label}${n ? ` ${n}` : ''}</button>`;
    let body = '';
    if (UI.myTab === 'active') body = active.map(p => podCard(p)).join('') || `<div class="empty"><span class="big">🚕</span>참여 중인 팟이 없어요<br><button class="btn primary sm" style="margin-top:12px" onclick="tab('find')">팟 찾으러 가기</button></div>`;
    if (UI.myTab === 'regular') body = regular.map(p => podCard(p)).join('') || `<div class="empty"><span class="big">🔁</span>참여 중인 정기 통학팟이 없어요<br><button class="btn primary sm" style="margin-top:12px" onclick="go('pod',{id:'p9'})">추천 정기팟 보기</button></div>`;
    if (UI.myTab === 'past') body = ended.map(p => podCard(p)).join('') + S.history.map(h => `<div class="hist"><div><b>${esc(h.route)}</b><small>${fmtWhen(h.date)} · ${h.n}명 · 총 ${won(h.fare)}${h.host ? ' · 👑방장' : ''}</small></div>
        <div class="save"><b>${won(h.paid)}</b>${won(Math.max(0, h.solo - h.paid))} 절약</div></div>`).join('');
    return header('내 팟') + `<div class="content">
      <div class="seg" style="margin-bottom:14px">${segBtn('active', '참여·예정', active.length)}${segBtn('regular', '정기', regular.length)}${segBtn('past', '지난 팟', 0)}</div>
      ${body}</div>`;
  },
};

/* =====================================================
   마이
   ===================================================== */
VIEWS.my = {
  html() {
    const u = S.user, ms = monthStats();
    const pct = Math.min(100, u.manner / 60 * 100);
    const ns = u.noShows.length;
    const ranking = [['미디어학과', 412300], ['소프트웨어학과', 398800], ['경영학과', 351200], ['기계공학과', 287400]];
    const hostRides = S.history.filter(h => h.host).length;
    return header('마이') + `<div class="content">
      <div class="card">
        <div class="profile"><div class="avatar">😎</div><div>
          <h2>${esc(u.nick)}</h2><p>${esc(u.dept)} · ${u.year}학번 · ${esc(u.email)}</p>
          <span class="verified">🎓 아주대 인증</span> ${hostRides >= 3 ? '<span class="verified" style="background:var(--yellow-soft);color:#9a6a00">👑 믿음직한 방장</span>' : ''}</div></div>
        <div class="manner"><div class="manner-top"><span>매너 온도</span><b>${u.manner.toFixed(1)}℃</b></div><div class="manner-bar"><i style="width:${pct}%"></i></div></div>
      </div>

      <section>
        <div class="sec-hd"><h2>💰 절약 대시보드</h2><span class="muted">최근 30일</span></div>
        <div class="save-dash">
          <small>이번 달 택시비</small><b>${won(ms.saved)} 아꼈어요</b>
          <div class="sd-grid"><div><span>🚕</span>${ms.rides}회<small>이용</small></div><div><span>🤝</span>${ms.co}명<small>함께 탄 학우</small></div><div><span>🌱</span>${ms.co2.toFixed(1)}kg<small>탄소 절감*</small></div></div>
          <button class="btn yellow block" style="margin-top:14px" onclick="semesterCard()">📸 학기 결산 카드 보기</button>
        </div>
        <p class="hint">* 혼자 탈 때 대비 대략 추정치 (km당 0.17kg)</p>
        <div class="card" style="margin-top:10px"><div style="font-size:13px;font-weight:700;margin-bottom:6px">🏆 학과별 절약 랭킹 (이번 학기)</div>
          ${ranking.map(([d, v], i) => `<div class="list-row"><span>${['🥇', '🥈', '🥉', '4'][i]} ${d}${d === u.dept ? ' <span class="tag blue">내 학과</span>' : ''}</span><span class="r">${won(v)}</span></div>`).join('')}</div>
      </section>

      <section>
        <div class="sec-hd"><h2>👑 방장 포인트</h2></div>
        <div class="card"><div class="list-row"><span>보유 포인트</span><b style="color:var(--blue)">${u.points.toLocaleString()}P</b></div>
          <div class="list-row"><span>방장으로 탄 횟수</span><span class="r">${hostRides}회</span></div>
          <p class="hint">방장(택시 호출·결제 담당)은 회당 300P 적립 · 다음 팟 결제나 제휴 매장 쿠폰으로 사용해요</p></div>
      </section>

      <section>
        <div class="sec-hd"><h2>💳 결제수단</h2></div>
        <div class="card">${u.card ? `<div class="list-row"><span>💳 ${esc(u.card)} <span class="tag green">자동결제</span></span><button class="btn sm" onclick="cardSheet(render)">변경</button></div>
          <p class="hint">PG 빌링키 방식 · 앱은 카드번호를 저장하지 않아요</p>` : `<div class="list-row"><span>등록된 결제수단이 없어요</span><button class="btn sm primary" onclick="cardSheet(render)">등록</button></div>`}</div>
      </section>

      <section>
        <div class="sec-hd"><h2>🚫 노쇼 이력 & 제재</h2><span class="muted">누적 ${ns}회</span></div>
        <div class="card">
          ${restricted() ? `<div class="penalty-on">🚫 ${fmtDate(u.penaltyUntil)}까지 팟 참여 제한 중</div>` : ''}
          <div class="rules">
            <div class="rule ${ns === 1 ? 'cur' : ''}"><span>노쇼 1회</span><span>경고 · 매너 온도 하락</span></div>
            <div class="rule ${ns === 2 ? 'cur' : ''}"><span>노쇼 2회</span><span>7일 참여 제한</span></div>
            <div class="rule ${ns >= 3 ? 'cur' : ''}"><span>노쇼 3회 이상</span><span>30일 참여 제한</span></div>
          </div>
          ${u.noShows.map(x => `<div class="list-row"><span>${fmtWhen(x.date)}</span><span class="r">${esc(x.route)}</span></div>`).join('') || '<p class="hint">노쇼 이력이 없어요 👍</p>'}
          <button class="btn sm" style="margin-top:8px" onclick="addNoShow('(데모) 아주대 정문 → 수원역');render();toast('노쇼 1회가 추가됐어요 (데모)')">(데모) 노쇼 판정 체험</button>
        </div>
      </section>

      <section>
        <div class="sec-hd"><h2>📅 내 시간표</h2><span class="muted">포털 연동 (데모)</span></div>
        <div class="card"><table class="tt"><tr>${[1, 2, 3, 4, 5].map(d => `<th>${DAY[d]}</th>`).join('')}</tr><tr>${[1, 2, 3, 4, 5].map(d => `<td>${(TIMETABLE[d] || []).map(([t, n, ex]) => `<div class="cls ${ex ? 'exam' : ''}">${t}<br>${n}</div>`).join('')}</td>`).join('')}</tr></table></div>
      </section>

      <section>
        <div class="sec-hd"><h2>⭐ 즐겨찾는 장소 · 경로</h2></div>
        <div class="chips">${QUICK.map(k => `<span class="chip">📍 ${PLACES[k].name}</span>`).join('')}${S.favRoutes.map(([a, b]) => `<span class="chip">⭐ ${PLACES[a].name} → ${PLACES[b].name}</span>`).join('')}</div>
      </section>

      <section>
        <div class="sec-hd"><h2>⚙️ 설정</h2></div>
        <div class="card">
          <div class="list-row"><span>🛡️ 안심 귀가 연락처</span><span class="r">${u.safeContacts.map(esc).join(', ')}</span></div>
          <div class="list-row"><span>🔔 알림 (날씨·막차·시험)</span><span class="r">켜짐</span></div>
          <div class="list-row" style="cursor:pointer" onclick="resetDemo()"><span>↺ 데모 데이터 초기화</span><span class="r">›</span></div>
          <div class="list-row" style="cursor:pointer" onclick="logout()"><span>로그아웃</span><span class="r">›</span></div>
        </div>
      </section>
    </div>`;
  },
};
function semesterCard() {
  const ms = monthStats();
  openSheet(`<div class="sem-card">
      <small>2026-2학기 아주팟 결산</small>
      <h2>${esc(S.user.nick)}님은 이번 학기<br><b>${won(ms.allSaved)}</b> 아꼈어요!</h2>
      <div class="sd-grid"><div><span>🚕</span>${ms.allRides}회<small>택시팟</small></div><div><span>🤝</span>${ms.allCo}명<small>함께 탄 학우</small></div><div><span>🌡️</span>${S.user.manner.toFixed(1)}℃<small>매너 온도</small></div></div>
      <p>🏫 ${esc(S.user.dept)} 절약 랭킹 1위 기여 중</p>
      <div class="sem-logo">🚕 아주팟</div>
    </div>
    <button class="btn primary block" style="margin-top:14px" onclick="closeSheet();toast('📸 (데모) 공유용 이미지가 저장됐어요')">SNS에 공유하기</button>`);
}

/* =====================================================
   발표 시나리오 바로가기
   ===================================================== */
function ensureLogin() {
  if (!S.user) {
    S.user = { nick: '노란택시', dept: '미디어학과', year: '23', manner: 36.5, email: 'student@ajou.ac.kr', card: '신한카드 ••••1234', points: 900, noShows: [], penaltyUntil: 0, safeContacts: ['엄마 · 010-****-5821'] };
    save();
  }
  if (!S.user.card) { S.user.card = '신한카드 ••••1234'; save(); }
}
function silentJoin(id, drop) {
  const p = getPod(id);
  if (!p || meIn(p) || p.status !== 'open') return;
  const d = drop ?? p.stops.length + 1;
  p.members.push({ ...meMember(), paid: projectedPrepay(p, d), drop: d });
  p.chat.push({ sys: true, text: `${S.user.nick}님이 참여했어요 (${p.members.length}/${p.max})` });
  save();
}
function demoGo(kind) {
  closeSheet(true);
  if (kind === 'login') { S.user = null; save(); render(); return; }
  ensureLogin();
  if (kind === 'home') { stack = [{ v: 'home' }]; render(); return; }
  if (kind === 'rain') { UI.findMode = 'now'; stack = [{ v: 'find' }]; render(); return; }
  if (kind === 'under') {
    let p = getPod('p3');
    if (!p || p.status !== 'open') { S = seed(); ensureLogin(); p = getPod('p3'); }
    silentJoin('p3'); stack = [{ v: 'mypods' }, { v: 'pod', id: 'p3' }]; render(); setTimeout(() => underFlow('p3'), 400); return;
  }
  if (kind === 'settle') {
    let p = getPod('p8');
    if (!p || p.status === 'done') { S = seed(); ensureLogin(); }
    silentJoin('p8'); stack = [{ v: 'mypods' }, { v: 'pod', id: 'p8' }]; render(); return;
  }
  if (kind === 'exam') { stack = [{ v: 'home' }, { v: 'pod', id: 'p4' }]; render(); return; }
  if (kind === 'concert') { stack = [{ v: 'events' }, { v: 'event', id: 'e1' }]; render(); return; }
  if (kind === 'regular') { stack = [{ v: 'home' }, { v: 'pod', id: 'p9' }]; render(); return; }
  if (kind === 'create') { stack = [{ v: 'find' }]; UI.findMode = 'book'; render(); startCreate(); return; }
  if (kind === 'calc') { stack = [{ v: 'home' }, { v: 'calc' }]; render(); return; }
  if (kind === 'save') { stack = [{ v: 'my' }]; render(); return; }
}
function resetDemo() {
  const keepUser = !!S.user;
  S = seed();
  if (keepUser) ensureLogin();
  save(); stack = [{ v: 'home' }]; render();
  toast('↺ 데모 데이터를 초기화했어요');
}

/* ---------- 시작 ---------- */
function tickClock() { const c = $('#clock'); if (c) c.textContent = hm(Date.now()); }
tickClock(); setInterval(tickClock, 15000);
// 1분마다 남은 시간 갱신 (시트가 열려 있거나 입력 중이면 건너뜀)
setInterval(() => {
  const top = stack[stack.length - 1];
  if (!S.user || $('.sheet-wrap') || $('.loader') || top.v === 'create' || document.activeElement.tagName === 'INPUT') return;
  render();
}, 60000);
// 실제 도로 거리가 새로 도착하면 거리·요금 다시 그리기
onRoadKm = () => {
  const top = stack[stack.length - 1];
  if (top.v === 'create') { updateEstimate(); return; }
  if (!S.user || $('.sheet-wrap') || $('.loader') || document.activeElement.tagName === 'INPUT') return;
  render();
};
save();
render();
loadWeather(); setInterval(loadWeather, 15 * 60000);
