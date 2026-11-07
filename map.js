/* =====================================================
   지도 어댑터
   - config.js 에 KAKAO_MAP_KEY 가 있으면 카카오맵
   - 없으면 Leaflet + OpenStreetMap(HOT 타일)
   app.js 는 이 파일의 makeMap() 이 돌려주는 객체만 사용합니다.
   좌표는 항상 [lat, lng] 배열, 콜백 좌표는 { lat, lng } 객체.
   ===================================================== */
const MAP_PROVIDER = (window.kakao && kakao.maps && kakao.maps.Map) ? 'kakao' : (window.L ? 'leaflet' : null);
const pinHtml = (kind, label) => `<div class="pin ${kind}"><span>${label}</span></div>`;
const LINE = { color: '#0b4aa8', weight: 4, opacity: .8 };   // 직선(임시)
const ROAD = { color: '#0b4aa8', weight: 5, opacity: .85 };  // 실제 도로 경로

/* ---------- Leaflet ---------- */
class LeafletMap {
  constructor(el, center, zoom) {
    this.m = L.map(el, { zoomControl: false }).setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', { maxZoom: 19, subdomains: 'abc', attribution: '© OpenStreetMap contributors, HOT, OSM France' }).addTo(this.m);
  }
  alive() { return !!(this.m._container && this.m._container.isConnected); }
  relayout() { if (this.alive()) this.m.invalidateSize({ animate: false }); }
  setView(ll, zoom) { this.m.setView(ll, zoom); }
  fit(lls, { padding = 30, maxZoom } = {}) {
    this.m.fitBounds(L.latLngBounds(lls), { padding: [padding, padding], maxZoom, animate: false });
  }
  marker(ll, kind, label, { popup, draggable, onDragEnd } = {}) {
    const icon = L.divIcon({ className: '', html: pinHtml(kind, label), iconSize: [30, 30], iconAnchor: [15, 34], popupAnchor: [0, -30] });
    const mk = L.marker(ll, { icon, draggable: !!draggable }).addTo(this.m);
    if (popup) mk.bindPopup(popup);
    if (onDragEnd) mk.on('dragend', () => { const p = mk.getLatLng(); onDragEnd({ lat: p.lat, lng: p.lng }); });
    return { remove: () => mk.remove() };
  }
  line(lls, { solid } = {}) {
    const l = L.polyline(lls, solid ? ROAD : { ...LINE, dashArray: '8 8' }).addTo(this.m);
    return { remove: () => l.remove() };
  }
  onClick(cb) { this.m.on('click', e => cb({ lat: e.latlng.lat, lng: e.latlng.lng })); }
  destroy() { this.m.remove(); }
}

/* ---------- 카카오맵 ---------- */
const KLL = ([lat, lng]) => new kakao.maps.LatLng(lat, lng);
const zoomToLevel = z => Math.min(14, Math.max(1, 19 - z)); // Leaflet 줌 → 카카오 레벨(작을수록 확대)
const stopAll = el => ['mousedown', 'touchstart', 'click', 'dblclick'].forEach(t => el.addEventListener(t, e => e.stopPropagation()));

class KakaoMap {
  constructor(el, center, zoom) {
    this.el = el;
    this.m = new kakao.maps.Map(el, { center: KLL(center), level: zoomToLevel(zoom) });
    this.pop = null;
    kakao.maps.event.addListener(this.m, 'click', () => this.closePopup());
  }
  alive() { return this.el.isConnected; }
  relayout() {
    if (!this.alive()) return;
    const c = this.m.getCenter(); this.m.relayout(); this.m.setCenter(c);
  }
  setView(ll, zoom) { this.m.setLevel(zoomToLevel(zoom)); this.m.setCenter(KLL(ll)); }
  fit(lls, { padding = 30, maxZoom } = {}) {
    if (lls.length === 1) { this.setView(lls[0], maxZoom || 15); return; }
    const b = new kakao.maps.LatLngBounds(); lls.forEach(p => b.extend(KLL(p)));
    this.m.setBounds(b, padding, padding, padding, padding);
    if (maxZoom && this.m.getLevel() < zoomToLevel(maxZoom)) this.m.setLevel(zoomToLevel(maxZoom));
  }
  openPopup(pos, html) {
    this.closePopup();
    const d = document.createElement('div'); d.className = 'kpop'; d.innerHTML = html; stopAll(d);
    this.pop = new kakao.maps.CustomOverlay({ position: KLL(pos), content: d, xAnchor: 0.5, yAnchor: 1, zIndex: 10 });
    this.pop.setMap(this.m);
  }
  closePopup() { if (this.pop) { this.pop.setMap(null); this.pop = null; } }
  marker(ll, kind, label, { popup, draggable, onDragEnd } = {}) {
    let pos = [...ll], dragged = false;
    const wrap = document.createElement('div'); wrap.className = 'kpin'; wrap.innerHTML = pinHtml(kind, label);
    stopAll(wrap);
    const ov = new kakao.maps.CustomOverlay({ position: KLL(pos), content: wrap, xAnchor: 0.5, yAnchor: 1, zIndex: 2 });
    ov.setMap(this.m);
    if (popup) wrap.addEventListener('click', () => { if (!dragged) this.openPopup(pos, popup); });
    if (draggable) {
      wrap.style.cursor = 'grab';
      const xy = e => (e.touches ? e.touches[0] : e);
      const start = e => {
        e.preventDefault(); dragged = false;
        const proj = this.m.getProjection(), rect = this.el.getBoundingClientRect();
        const p0 = proj.containerPointFromCoords(KLL(pos)), c0 = xy(e);
        const dx = c0.clientX - rect.left - p0.x, dy = c0.clientY - rect.top - p0.y;
        this.m.setDraggable(false);
        const move = ev => {
          ev.preventDefault(); dragged = true;
          const c = xy(ev), r = this.el.getBoundingClientRect();
          const ll2 = proj.coordsFromContainerPoint(new kakao.maps.Point(c.clientX - r.left - dx, c.clientY - r.top - dy));
          pos = [ll2.getLat(), ll2.getLng()]; ov.setPosition(ll2);
        };
        const up = () => {
          ['mousemove', 'touchmove'].forEach(t => document.removeEventListener(t, move));
          ['mouseup', 'touchend'].forEach(t => document.removeEventListener(t, up));
          this.m.setDraggable(true);
          if (dragged && onDragEnd) onDragEnd({ lat: pos[0], lng: pos[1] });
        };
        document.addEventListener('mousemove', move); document.addEventListener('touchmove', move, { passive: false });
        document.addEventListener('mouseup', up); document.addEventListener('touchend', up);
      };
      wrap.addEventListener('mousedown', start); wrap.addEventListener('touchstart', start, { passive: false });
    }
    return { remove: () => ov.setMap(null) };
  }
  line(lls, { solid } = {}) {
    const s = solid ? ROAD : LINE;
    const pl = new kakao.maps.Polyline({ map: this.m, path: lls.map(KLL), strokeWeight: s.weight, strokeColor: s.color, strokeOpacity: s.opacity, strokeStyle: solid ? 'solid' : 'dash' });
    return { remove: () => pl.setMap(null) };
  }
  onClick(cb) { kakao.maps.event.addListener(this.m, 'click', e => cb({ lat: e.latLng.getLat(), lng: e.latLng.getLng() })); }
  destroy() { this.closePopup(); }
}

/* ---------- 공통 진입점 ---------- */
let maps = [];
function clearMaps() { maps.forEach(m => m.destroy()); maps = []; }
function makeMap(el, center = [37.2796, 127.0438], zoom = 14) {
  if (!el) return null;
  if (!MAP_PROVIDER) { el.innerHTML = '<div class="map-off">🗺️ 지도를 불러오지 못했어요<br>(지도는 인터넷 연결이 필요해요)</div>'; return null; }
  const m = MAP_PROVIDER === 'kakao' ? new KakaoMap(el, center, zoom) : new LeafletMap(el, center, zoom);
  maps.push(m);
  setTimeout(() => m.relayout(), 60);
  return m;
}
/* ---------- 장소 검색 · 주소 변환 (카카오 services 라이브러리) ----------
   카카오맵 키가 없으면 둘 다 빈 결과(앱은 기존 장소 목록만 사용) */
const HAS_PLACES = MAP_PROVIDER === 'kakao' && !!(kakao.maps.services);
const AJOU = [37.2796, 127.0438];
function searchPlaces(q) {
  if (!HAS_PLACES || !q) return Promise.resolve([]);
  return new Promise(res => {
    new kakao.maps.services.Places().keywordSearch(q, (data, status) => {
      if (status !== kakao.maps.services.Status.OK) return res([]);
      res(data.slice(0, 7).map(d => ({ name: d.place_name, addr: d.road_address_name || d.address_name, lat: +d.y, lng: +d.x })));
    }, { location: KLL(AJOU), radius: 20000, sort: kakao.maps.services.SortBy.ACCURACY });
  });
}
function addressOf(lat, lng) {
  if (!HAS_PLACES) return Promise.resolve(null);
  return new Promise(res => {
    new kakao.maps.services.Geocoder().coord2Address(lng, lat, (data, status) => {
      if (status !== kakao.maps.services.Status.OK || !data[0]) return res(null);
      const a = data[0];
      res((a.road_address && (a.road_address.building_name || a.road_address.address_name)) || (a.address && a.address.address_name) || null);
    });
  });
}

/* ---------- 실제 도로 경로 (OSRM 공개 서버, 키 없음) ---------- */
const routeCache = {};
function fetchRoute(lls) {
  const q = lls.map(([lat, lng]) => `${lng.toFixed(5)},${lat.toFixed(5)}`).join(';');
  if (!routeCache[q]) {
    routeCache[q] = fetch(`https://router.project-osrm.org/route/v1/driving/${q}?overview=full&geometries=geojson`)
      .then(r => (r.ok ? r.json() : null))
      .then(j => (j && j.code === 'Ok' ? { path: j.routes[0].geometry.coordinates.map(([x, y]) => [y, x]), km: j.routes[0].distance / 1000 } : null))
      .catch(() => null);
    routeCache[q].then(r => { if (!r) delete routeCache[q]; }); // 실패는 다음에 다시 시도
  }
  return routeCache[q];
}
/* 구간별 실제 도로 거리(km) — 요금·정산 계산용
   cachedRoadKm(a, b): 캐시에 있으면 km, 없으면 null 을 돌려주고 뒤에서 받아 옴.
   받아 오면 localStorage 에 저장하고 onRoadKm() 을 불러 화면을 갱신. */
const SEG_STORE = 'ajoupot.roadkm.v1';
let segKm = {};
try { segKm = JSON.parse(localStorage.getItem(SEG_STORE) || '{}'); } catch (e) { segKm = {}; }
const segKey = (a, b) => `${a.lat.toFixed(4)},${a.lng.toFixed(4)}>${b.lat.toFixed(4)},${b.lng.toFixed(4)}`;
const segQueue = [], segPending = new Set();
let segBusy = false, onRoadKm = null;
function cachedRoadKm(a, b) {
  const k = segKey(a, b);
  if (k in segKm) return segKm[k];
  if (!segPending.has(k)) { segPending.add(k); segQueue.push([k, a, b]); setTimeout(pumpSeg, 0); }
  return null;
}
async function pumpSeg() {
  if (segBusy) return;
  segBusy = true;
  let changed = false;
  while (segQueue.length) {           // 공개 서버라 한 번에 하나씩
    const [k, a, b] = segQueue.shift();
    const r = await fetchRoute([[a.lat, a.lng], [b.lat, b.lng]]);
    segPending.delete(k);
    if (r) { segKm[k] = Math.round(r.km * 100) / 100; changed = true; }
  }
  segBusy = false;
  if (changed) {
    try { localStorage.setItem(SEG_STORE, JSON.stringify(segKm)); } catch (e) { /* 저장 실패는 무시 */ }
    if (onRoadKm) onRoadKm();
  }
}

// 일단 점선 직선을 그리고, 도로 경로가 오면 실선으로 교체 (실패하면 직선 유지)
function drawRoadRoute(m, lls) {
  let ln = m.line(lls), dead = false;
  fetchRoute(lls).then(r => {
    if (dead || !r || !m.alive()) return;
    ln.remove(); ln = m.line(r.path, { solid: true });
  });
  return { remove: () => { dead = true; ln.remove(); } };
}

// 컨테이너 크기가 잡힌 뒤에 범위 맞추기
function fitLater(m, lls, opts) {
  m.fit(lls, opts);
  [120, 400].forEach(ms => setTimeout(() => { if (!m.alive()) return; m.relayout(); m.fit(lls, opts); }, ms));
}
