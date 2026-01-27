// ✅ 固定讀取的 CSV 檔案（請把檔案放在 index.html 同層）
const DATA_URL = "./data/onmyodo_calendar_v2.csv";

// ✅ Slider 範圍：今天前後一年（±365 天）
const YEAR_WINDOW_DAYS = 365;

// ===== i18n =====
const I18N = {
  "zh-TW": {
    appTitle: "Digital 陰陽寮",
    loading: "讀取資料中...",
    loadFail: "載入失敗",
    initFail: "初始化失敗",
    csvFmtErr: "CSV 格式錯誤：找不到「日期」欄位，或資料為空。",
    csvReadFail: "讀取 CSV 失敗",
    hintSameOrigin: "✅ 請確認：CSV 已放在 GitHub Pages 同源路徑（通常與 index.html 同層），檔名一致。",
    dokoTitle: "土公",
    dokoSubtitle: "當日位置（以高亮標示）",
    dokoLegend: "高亮標示表示當日所在位置",
    dokoTodayPrefix: "當日：",
    labels: {
      ten: "● 天一神",
      tai: "▲ 大將軍",
      nic: "■ 日遊神",
      doko: "▼ 土公神",
      kon: "× 金神",
      spec: "⚠️ 特殊"
    },
    btnAuto: "自動",
    btnPause: "暫停",
    ganzhiFmt: (dayGZ, monthZ) => `${dayGZ}日 | ${monthZ}月`,
    dirs: ["北","東北","東","東南","南","西南","西","西北"]
  },
  "ja": {
    appTitle: "デジタル陰陽寮",
    loading: "データ読込中...",
    loadFail: "読み込み失敗",
    initFail: "初期化失敗",
    csvFmtErr: "CSV形式エラー：「日付」列が見つからない、またはデータが空です。",
    csvReadFail: "CSV読み込み失敗",
    hintSameOrigin: "✅ 確認：CSVはGitHub Pagesの同一オリジン（通常 index.html と同階層）に置き、ファイル名が一致していること。",
    dokoTitle: "土公",
    dokoSubtitle: "当日の位置（ハイライト表示）",
    dokoLegend: "ハイライト表示は当日の位置を示します",
    dokoTodayPrefix: "当日：",
    labels: {
      ten: "● 天一神",
      tai: "▲ 大将軍",
      nic: "■ 日遊神",
      doko: "▼ 土公神",
      kon: "× 金神",
      spec: "⚠️ 特殊"
    },
    btnAuto: "自動",
    btnPause: "一時停止",
    ganzhiFmt: (dayGZ, monthZ) => `${dayGZ}日 | ${monthZ}月`,
    dirs: ["北","北東","東","南東","南","南西","西","北西"]
  },
  "en": {
    appTitle: "Digital Onmyōryō",
    loading: "Loading data...",
    loadFail: "Load failed",
    initFail: "Initialization failed",
    csvFmtErr: "CSV format error: missing '日期' (date) column, or empty data.",
    csvReadFail: "CSV load failed",
    hintSameOrigin: "✅ Check: CSV is hosted on the same origin path (usually next to index.html on GitHub Pages) and the filename matches.",
    dokoTitle: "Doko · Courtyard/Stove/Gate/Well",
    dokoSubtitle: "Today’s position (highlighted)",
    dokoLegend: "The highlighted area indicates today's position.",
    dokoTodayPrefix: "Today: ",
    labels: {
      ten: "● Tenichi",
      tai: "▲ Taishō",
      nic: "■ Nichiyū",
      doko: "▼ Doko",
      kon: "× Konjin",
      spec: "⚠️ Special"
    },
    btnAuto: "Auto",
    btnPause: "Pause",
    ganzhiFmt: (dayGZ, monthZ) => `${dayGZ} Day | ${monthZ} Month`,
    dirs: ["N","NE","E","SE","S","SW","W","NW"]
  }
};

// ===== 錯誤攔截 =====
window.onerror = function(message, source, lineno, colno, error) {
  const el = document.getElementById('error-log');
  el.style.display = 'block';
  el.innerHTML += `錯誤: ${message} <br> (Line: ${lineno})<br>`;
};

// ===== 全域變數 =====
let displayData = [];
let dateIndexMeta = []; // { date: Date|null, iso: 'YYYY-MM-DD'|'' }
let currentIndex = 0;

// Slider 限制範圍（索引）
let sliderMinIdx = 0;
let sliderMaxIdx = 0;

// 播放狀態
let isPlaying = false;
let playInterval;

// i18n
let currentLang = (localStorage.getItem("lang") || "zh-TW");
if (!I18N[currentLang]) currentLang = "zh-TW";

// Three.js
let scene, camera, renderer, controls;

// 羅盤/神煞
let compassGroup, tenichiGroup, nichiyuGroup, dokoMesh, taishoMesh, konGroup;
let tenichiGlow, nichiyuGlow;
let plateMesh;

// 方位字 sprite
let dirSprites = [];

// ===== 2D 土公 =====
let dokoCanvas, dokoCtx;

const DOKO_POINTS = {
  "灶": { x: 150, y: 155 },
  "井": { x: 370, y: 155 },
  "庭": { x: 150, y: 365 },
  "門": { x: 370, y: 365 }
};

// ===== 日期工具（用「本地」日期，避免 toISOString() 的 UTC 偏移）=====
function pad2(n){ return String(n).padStart(2, "0"); }

function toLocalISODate(d){
  const y = d.getFullYear();
  const m = pad2(d.getMonth()+1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

function parseISODateStrict(iso){
  const s = String(iso || "").trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  // 檢查溢位（如 2025-02-30）
  if (d.getFullYear() !== Number(m[1]) || (d.getMonth()+1) !== Number(m[2]) || d.getDate() !== Number(m[3])) return null;
  return d;
}

function addDays(d, days){
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + days);
  return x;
}

// ===== i18n 套用 =====
function setLang(lang){
  if (!I18N[lang]) lang = "zh-TW";
  currentLang = lang;
  localStorage.setItem("lang", lang);

  // top title
  document.getElementById("app-title").innerText = I18N[lang].appTitle;

  // loading text（若 overlay 還在）
  const loadingText = document.getElementById("loading-text");
  if (loadingText && loadingText.innerText && loadingText.innerText.includes("讀取") || loadingText.innerText.includes("Loading") || loadingText.innerText.includes("データ")){
    loadingText.innerText = I18N[lang].loading;
  }

  // doko panel labels
  document.getElementById("doko-title").innerText = I18N[lang].dokoTitle;
  document.getElementById("doko-subtitle").innerText = I18N[lang].dokoSubtitle;
  document.getElementById("doko-legend").innerText = I18N[lang].dokoLegend;

  // info labels
  document.getElementById("lbl-ten").innerText = I18N[lang].labels.ten;
  document.getElementById("lbl-tai").innerText = I18N[lang].labels.tai;
  document.getElementById("lbl-nic").innerText = I18N[lang].labels.nic;
  document.getElementById("lbl-doko").innerText = I18N[lang].labels.doko;
  document.getElementById("lbl-kon").innerText = I18N[lang].labels.kon;
  document.getElementById("lbl-spec").innerText = I18N[lang].labels.spec;

  // play button text
  const btnPlay = document.getElementById("btn-play");
  btnPlay.innerText = isPlaying ? I18N[lang].btnPause : I18N[lang].btnAuto;

  // active button style
  document.querySelectorAll("#lang-switch button").forEach(b => {
    b.classList.toggle("active", b.dataset.lang === lang);
  });

  // 更新羅盤方位字（sprite）
  updateDirSprites();

  // 重新繪製土公底板（若已初始化）
  if (dokoCtx && dokoCanvas) {
    drawDokoBlock(currentIndex);
  }

  // 重新刷新 gantzhi 顯示格式
  if (displayData?.length) updateScene(currentIndex);
}

function updateDirSprites(){
  const dirs = (I18N[currentLang]?.dirs) || I18N["zh-TW"].dirs;
  if (!dirSprites || dirSprites.length !== 8) return;
  dirSprites.forEach((sp, i) => {
    if (!sp?.userData) return;
    sp.userData.text = dirs[i] || sp.userData.text;
    redrawTextSprite(sp);
  });
}

// ===== 顯示致命錯誤 =====
function showFatal(msg){
  const overlay = document.getElementById('loading-overlay');
  const log = document.getElementById('error-log');
  document.getElementById('loading-text').innerText = I18N[currentLang].loadFail;
  log.style.display = 'block';
  log.innerHTML = msg;
  overlay.style.opacity = 1;
  overlay.style.display = 'flex';
}

function hideOverlay(){
  const overlay = document.getElementById('loading-overlay');
  overlay.style.opacity = 0;
  setTimeout(() => overlay.style.display = 'none', 800);
}

function init() {
  try {
    // init lang UI first
    wireLanguageButtons();
    setLang(currentLang);

    if (typeof THREE === 'undefined') throw new Error("Three.js 載入失敗");
    if (typeof THREE.OrbitControls === 'undefined') throw new Error("OrbitControls 載入失敗");

    initScene();
    initDokoMap();

    // ✅ 不用 mock；直接讀固定 CSV
    loadCsvFromUrl(DATA_URL);

  } catch (e) {
    console.error(e);
    showFatal(`${I18N[currentLang].initFail}: ${e.message}`);
  }
}

function wireLanguageButtons(){
  document.querySelectorAll("#lang-switch button").forEach(btn => {
    btn.addEventListener("click", () => setLang(btn.dataset.lang));
  });
}

function loadCsvFromUrl(url){
  if (typeof Papa === "undefined") {
    showFatal("PapaParse 載入失敗：無法解析 CSV。");
    return;
  }

  Papa.parse(url, {
    download: true,
    header: true,
    skipEmptyLines: true,
    transformHeader: h => (h || "").trim(),
    complete: function(results) {
      const raw = (results && results.data) ? results.data : [];
      if (!raw.length || !raw[0]['日期']) {
        showFatal(`${I18N[currentLang].csvFmtErr}<br>讀取檔案：${url}`);
        return;
      }

      displayData = raw;

      // 建立日期索引
      dateIndexMeta = raw.map(r => {
        const iso = (r['日期'] ?? "").toString().trim();
        return { iso, date: parseISODateStrict(iso) };
      });

      // ===== 設定 slider：今天前後一年 =====
      const today = new Date();
      const startD = addDays(today, -YEAR_WINDOW_DAYS);
      const endD   = addDays(today,  YEAR_WINDOW_DAYS);

      // 找出落在範圍內的最小/最大索引
      let minI = Infinity;
      let maxI = -Infinity;

      for (let i = 0; i < dateIndexMeta.length; i++){
        const d = dateIndexMeta[i].date;
        if (!d) continue;
        if (d >= startD && d <= endD){
          minI = Math.min(minI, i);
          maxI = Math.max(maxI, i);
        }
      }

      // 若 CSV 不包含這段範圍，就退回全範圍
      if (!isFinite(minI) || maxI < 0){
        minI = 0;
        maxI = displayData.length - 1;
      }

      sliderMinIdx = minI;
      sliderMaxIdx = maxI;

      const slider = document.getElementById('date-slider');
      slider.min = sliderMinIdx;
      slider.max = sliderMaxIdx;

      // 以「今天」定位（使用本地日期字串）；找不到就用範圍中間
      const todayStr = toLocalISODate(today);
      let tIdx = raw.findIndex(r => (r['日期'] && String(r['日期']).trim() === todayStr));

      if (tIdx < sliderMinIdx || tIdx > sliderMaxIdx || tIdx === -1) {
        tIdx = Math.floor((sliderMinIdx + sliderMaxIdx) / 2);
      }

      currentIndex = Math.max(sliderMinIdx, Math.min(tIdx, sliderMaxIdx));
      slider.value = currentIndex;

      updateScene(currentIndex);
      hideOverlay();
    },
    error: function(err) {
      showFatal(`${I18N[currentLang].csvReadFail}：${(err && err.message) ? err.message : err}<br>檔案：${url}<br><br>${I18N[currentLang].hintSameOrigin}`);
    }
  });
}

function initScene() {
  const container = document.getElementById('canvas-container');

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b1222, 0.009);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, -68, 50);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x0b1222, 1);

  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;

  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2.05;
  controls.minDistance = 18;
  controls.maxDistance = 160;

  scene.add(new THREE.AmbientLight(0xffffff, 0.70));

  const hemi = new THREE.HemisphereLight(0xf0f6ff, 0x101a2c, 0.85);
  hemi.position.set(0, 0, 80);
  scene.add(hemi);

  const dir = new THREE.DirectionalLight(0xffffff, 0.95);
  dir.position.set(-30, -40, 80);
  scene.add(dir);

  const sun = new THREE.PointLight(0xffe6b3, 2.6, 170);
  sun.position.set(25, 20, 55);
  scene.add(sun);

  createCompass();
  createDeities();

  compassGroup.rotation.x = THREE.MathUtils.degToRad(-60);

  requestAnimationFrame(animate);
  window.addEventListener('resize', onResize);
}

function onResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// ===== 羅盤 =====
function createCompass() {
  compassGroup = new THREE.Group();

  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x2a3350,
    roughness: 0.32,
    metalness: 0.45,
    transparent: true,
    opacity: 0.42,
    depthWrite: false
  });

  plateMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(15, 15, 0.5, 64),
    plateMat
  );
  plateMesh.rotation.x = Math.PI / 2;
  plateMesh.renderOrder = 0;
  compassGroup.add(plateMesh);

  const innerGlow = new THREE.Mesh(
    new THREE.RingGeometry(0.2, 14.6, 96),
    new THREE.MeshBasicMaterial({
      color: 0xffd76a,
      transparent: true,
      opacity: 0.10,
      depthWrite: false
    })
  );
  innerGlow.rotation.x = Math.PI / 2;
  innerGlow.position.z = 0.33;
  innerGlow.renderOrder = 0.5;
  compassGroup.add(innerGlow);

  // ✅ 方位字：依語系
  const dirs = (I18N[currentLang]?.dirs) || I18N["zh-TW"].dirs;
  const textGroup = new THREE.Group();

  const lineMat = new THREE.LineBasicMaterial({
    color: 0xE7F0FF,
    transparent: true,
    opacity: 0.32,
    depthWrite: false
  });

  dirs.forEach((d, i) => {
    const angle = (90 - i * 45) * Math.PI / 180;

    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(Math.cos(angle) * 3,  Math.sin(angle) * 3,  0.34),
      new THREE.Vector3(Math.cos(angle) * 14, Math.sin(angle) * 14, 0.34)
    ]);

    const line = new THREE.Line(lineGeo, lineMat);
    line.renderOrder = 1;
    compassGroup.add(line);

    const sprite = createTextSprite(d);
    sprite.position.set(Math.cos(angle) * 13, Math.sin(angle) * 13, 1.05);
    sprite.renderOrder = 2;
    textGroup.add(sprite);
    dirSprites.push(sprite);
  });

  compassGroup.add(textGroup);

  const axis = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 20)]),
    new THREE.LineDashedMaterial({
      color: 0xE7F0FF,
      dashSize: 1,
      gapSize: 1,
      opacity: 0.22,
      transparent: true
    })
  );
  axis.computeLineDistances();
  axis.renderOrder = 1;
  compassGroup.add(axis);

  scene.add(compassGroup);
}

function createTextSprite(text) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = 256;
  canvas.height = 128;

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = renderer?.capabilities.getMaxAnisotropy?.() || 1;

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    opacity: 0.98,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3.3, 1.65, 1);

  sprite.userData = { canvas, ctx, text };
  redrawTextSprite(sprite);
  return sprite;
}

function redrawTextSprite(sprite) {
  const { canvas, ctx, text } = sprite.userData;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = "bold 64px 'Microsoft JhengHei', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.lineWidth = 9;
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.fillStyle = "#F2F7FF";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 10;

  ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  sprite.material.map.needsUpdate = true;
}

// ✅ 光圈 sprite（已調小 + 更透明）
function createGlowSprite(colorHex, size=3.6, opacity=0.32){
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const ctx = c.getContext("2d");

  const g = ctx.createRadialGradient(128,128,12,128,128,128);
  g.addColorStop(0.00, "rgba(255,255,255,0.00)");
  g.addColorStop(0.22, "rgba(255,255,255,0.10)");
  g.addColorStop(0.42, "rgba(255,255,255,0.04)");
  g.addColorStop(1.00, "rgba(255,255,255,0.00)");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,256,256);

  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    color: colorHex,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const sp = new THREE.Sprite(mat);
  sp.scale.set(size, size, 1);
  return sp;
}

// ===== 神煞 =====
function createDeities() {
  // 天一神
  tenichiGroup = new THREE.Group();
  const tMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.95, 0),
    new THREE.MeshStandardMaterial({
      color: 0xFFCC22,
      emissive: 0xFFB000,
      emissiveIntensity: 2.2,
      roughness: 0.12,
      metalness: 0.70
    })
  );

  tenichiGlow = new THREE.Mesh(
    new THREE.SphereGeometry(1.55, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0xFFCC22,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );

  const tenichiRing = createGlowSprite(0xFFCC22, 3.6, 0.30);

  tenichiGroup.add(tMesh);
  tenichiGroup.add(tenichiGlow);
  tenichiGroup.add(tenichiRing);
  tenichiGroup.renderOrder = 5;
  compassGroup.add(tenichiGroup);

  // 日遊神
  nichiyuGroup = new THREE.Group();
  const nMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.10, 1.10, 1.10),
    new THREE.MeshStandardMaterial({
      color: 0xFF1224,
      emissive: 0xFF0010,
      emissiveIntensity: 2.0,
      roughness: 0.16,
      metalness: 0.10
    })
  );

  nichiyuGlow = new THREE.Mesh(
    new THREE.SphereGeometry(1.45, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0xFF1224,
      transparent: true,
      opacity: 0.17,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );

  const nichiyuRing = createGlowSprite(0xFF1224, 3.5, 0.28);

  nichiyuGroup.add(nMesh);
  nichiyuGroup.add(nichiyuGlow);
  nichiyuGroup.add(nichiyuRing);
  nichiyuGroup.renderOrder = 5;
  compassGroup.add(nichiyuGroup);

  // 大將軍
  taishoMesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.76, 3.2, 4),
    new THREE.MeshStandardMaterial({
      color: 0xB000FF,
      emissive: 0x6A00FF,
      emissiveIntensity: 1.75,
      roughness: 0.18,
      metalness: 0.22
    })
  );
  taishoMesh.rotation.x = Math.PI / 2;
  taishoMesh.renderOrder = 6;
  compassGroup.add(taishoMesh);

  const taishoGlow = new THREE.Mesh(
    new THREE.SphereGeometry(1.55, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0xB000FF,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  const taishoRing = createGlowSprite(0xB000FF, 3.6, 0.26);
  taishoGlow.renderOrder = 5.8;
  taishoMesh.add(taishoGlow);
  taishoMesh.add(taishoRing);

  // 土公神
  dokoMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 32, 16, 0, Math.PI * 2, 0, Math.PI / 1.5),
    new THREE.MeshStandardMaterial({
      color: 0xe0caa2,
      roughness: 0.6,
      metalness: 0.05
    })
  );
  dokoMesh.rotation.x = Math.PI;
  dokoMesh.renderOrder = 6;
  compassGroup.add(dokoMesh);

  // 金神（多點）
  konGroup = new THREE.Group();
  const konMat = new THREE.MeshStandardMaterial({
    color: 0xFFD11A,
    emissive: 0xFFB000,
    emissiveIntensity: 1.9,
    roughness: 0.10,
    metalness: 0.85
  });

  const xProto = new THREE.Group();
  const xb1 = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.34, 0.34), konMat);
  const xb2 = xb1.clone();
  xb1.rotation.z = Math.PI / 4;
  xb2.rotation.z = -Math.PI / 4;
  xProto.add(xb1);
  xProto.add(xb2);

  konGroup.userData = { xProto, markers: [] };
  konGroup.renderOrder = 7;
  compassGroup.add(konGroup);
}

function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();

  const t = Date.now() * 0.002;

  if (tenichiGroup) {
    tenichiGroup.position.z += Math.sin(t * 1.5) * 0.0012;
    if (tenichiGlow) tenichiGlow.scale.setScalar(1.0 + Math.sin(t * 3) * 0.06);
  }
  if (nichiyuGlow) nichiyuGlow.scale.setScalar(1.0 + Math.sin(t * 2.6) * 0.05);

  if (renderer && scene && camera) renderer.render(scene, camera);
}

// ===== 解析複數方位（金神等）=====
function parseMultiDirs(dirStr) {
  if (!dirStr) return [];
  const clean = String(dirStr)
    .replace(/宮|大土|小土|\(凶\)|\(吉\)|方/g, "")
    .trim();

  if (/[,\s\/\|、，]+/.test(clean)) {
    return clean.split(/[,\s\/\|、，]+/).filter(Boolean);
  }

  const dirWords = ["東北","西北","西南","東南","北","東","南","西"];
  const hits = [];
  let rest = clean;

  for (const w of dirWords) {
    if (rest.includes(w)) {
      hits.push(w);
      rest = rest.replace(w, "");
    }
  }
  if (hits.length) return hits;
  return Array.from(clean).filter(ch => ch.trim());
}

function getPos(dirStr, radius) {
  if (!dirStr) return null;

  const map = {
    "東北": 45, "西北": 135, "西南": 225, "東南": 315,
    "艮": 45, "乾": 135, "坤": 225, "巽": 315,

    "丑": 30, "寅": 60,
    "戌": 120, "亥": 150,
    "未": 210, "申": 240,
    "辰": 300, "巳": 330,

    "東": 0, "西": 180, "北": 90, "南": 270,
    "卯": 0, "酉": 180, "子": 90, "午": 270,

    "甲": 15, "乙": -15,
    "庚": 195, "辛": 165,
    "壬": 105, "癸": 75,
    "丙": 255, "丁": 285
  };

  const clean = String(dirStr).replace(/宮|大土|小土|\(凶\)|\(吉\)/g, "").trim();
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);

  for (const key of keys) {
    if (clean.includes(key)) {
      const rad = map[key] * Math.PI / 180;
      return { x: radius * Math.cos(rad), y: radius * Math.sin(rad) };
    }
  }
  return null;
}

function moveKonMulti(konGroup, dirStr, radius) {
  if (!konGroup) return;

  const tokens = parseMultiDirs(dirStr);
  const uniq = Array.from(new Set(tokens)).slice(0, 6);

  const ud = konGroup.userData || {};
  ud.markers = ud.markers || [];

  ud.markers.forEach(m => konGroup.remove(m));
  ud.markers.length = 0;

  if (!uniq.length) {
    konGroup.visible = false;
    return;
  }
  konGroup.visible = true;

  uniq.forEach((tok, i) => {
    const p = getPos(tok, radius);
    if (!p) return;

    const marker = ud.xProto.clone(true);
    const ring = createGlowSprite(0xFFD11A, 2.2, 0.22);
    marker.add(ring);

    marker.position.set(p.x, p.y, 0.95 + i * 0.02);
    marker.renderOrder = 7;
    ud.markers.push(marker);
    konGroup.add(marker);
  });

  konGroup.userData = ud;
}

function moveObj(mesh, dirStr, radius, canFly=false, canHide=false, tsuchiState="") {
  if (!mesh || !dirStr) return;

  if (canFly && dirStr.includes("天上")) {
    gsap.to(mesh.position, { x: 0, y: 0, z: 12, duration: 1.5 });
    if (mesh.children[1]) gsap.to(mesh.children[1].scale, { x: 2.7, y: 2.7, z: 2.7, duration: 1 });
    return;
  }

  if (canHide && dirStr.includes("出遊")) {
    gsap.to(mesh.position, { z: -10, duration: 1 });
    return;
  }

  if (tsuchiState && tsuchiState.includes("土")) {
    const p = getPos(dirStr, radius);
    if (p) {
      gsap.to(mesh.position, { x: p.x, y: p.y, z: -0.5, duration: 1 });
      if (mesh.material) mesh.material.color.setHex(0x7a5e44);
    }
    return;
  } else if (tsuchiState === "") {
    if (mesh.material) mesh.material.color.setHex(0xe0caa2);
  }

  const p = getPos(dirStr, radius);
  if (p) {
    gsap.to(mesh.position, { x: p.x, y: p.y, z: (canFly ? 2 : 0.9), duration: 0.8 });
    if (canFly && mesh.children[1]) gsap.to(mesh.children[1].scale, { x: 1, y: 1, z: 1, duration: 0.8 });
    if (mesh === taishoMesh) mesh.lookAt(0, 0, 1);
  }
}

// =========================
// 2D 土公：初始化 & 高亮區塊
// =========================
function initDokoMap(){
  dokoCanvas = document.getElementById("doko-map");
  if (!dokoCanvas) return;
  dokoCtx = dokoCanvas.getContext("2d");
}

function drawDokoBlock(idx){
  if (!dokoCtx || !displayData?.length) return;

  const ctx = dokoCtx;
  const W = dokoCanvas.width;
  const H = dokoCanvas.height;

  ctx.clearRect(0, 0, W, H);
  drawFloorBase(ctx, W, H);

  const s = (displayData[idx]?.['土公神'] || "").trim();
  if (!DOKO_POINTS[s]) return;

  const glow = "rgba(255,215,106,0.70)";
  const fill = "rgba(255,215,106,0.18)";
  const stroke = "rgba(255,215,106,0.95)";
  const text = "rgba(242,247,255,0.92)";

  const p = DOKO_POINTS[s];
  const bw = 140;
  const bh = 92;
  const bx = p.x - bw / 2;
  const by = p.y - bh / 2;

  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = 32;
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 6;
  roundRect(ctx, bx, by, bw, bh, 18, true, true);
  ctx.restore();

  ctx.save();
  ctx.font = "bold 22px 'Microsoft JhengHei', sans-serif";
  ctx.fillStyle = text;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(`${I18N[currentLang].dokoTodayPrefix}${s}`, 56, H - 42);
  ctx.restore();
}

function drawFloorBase(ctx, W, H){
  ctx.save();

  const wall = "rgba(242,247,255,0.55)";
  const thin = "rgba(242,247,255,0.20)";
  const label = "rgba(242,247,255,0.90)";
  const fillA = "rgba(255,255,255,0.03)";

  ctx.lineWidth = 10;
  ctx.strokeStyle = wall;
  ctx.fillStyle = fillA;
  roundRect(ctx, 32, 32, W - 64, H - 64, 18, true, true);

  ctx.lineWidth = 6;
  ctx.strokeStyle = wall;

  ctx.beginPath();
  ctx.moveTo(W * 0.58, 70);
  ctx.lineTo(W * 0.58, H - 70);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(W * 0.58, H * 0.52);
  ctx.lineTo(W - 70, H * 0.52);
  ctx.stroke();

  ctx.lineWidth = 4;
  ctx.strokeStyle = thin;

  ctx.beginPath();
  ctx.moveTo(70, H * 0.28);
  ctx.lineTo(W * 0.58, H * 0.28);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(70, H * 0.40);
  ctx.lineTo(W * 0.58, H * 0.40);
  ctx.stroke();

  ctx.font = "bold 34px 'Microsoft JhengHei', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = label;

  ["灶","井","庭","門"].forEach(k => {
    const p = DOKO_POINTS[k];
    if (!p) return;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    roundRect(ctx, p.x - 40, p.y - 28, 80, 56, 14, true, false);
    ctx.fillStyle = label;
    ctx.fillText(k, p.x, p.y);
    ctx.restore();
  });

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r, fill, stroke){
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function updateScene(idx) {
  if (!displayData[idx]) return;
  const row = displayData[idx];

  document.getElementById('date-display').innerText = row['日期'] ?? '---';

  const dayGZ = row['日干支'] ?? '---';
  const monthZ = row['月支'] ?? '---';
  document.getElementById('ganzhi-display').innerText = I18N[currentLang].ganzhiFmt(dayGZ, monthZ);

  document.getElementById('val-ten').innerText = row['天一神'] ?? '---';
  document.getElementById('val-nic').innerText = row['日遊'] ?? '---';
  document.getElementById('val-tai').innerText = row['大將軍'] ?? '---';
  document.getElementById('val-doko').innerText = row['土公神'] ?? '---';
  document.getElementById('val-kon').innerText = row['金神'] ?? '---';

  let specs = [];
  if (row['天赦日'] === 'True') specs.push("天赦日");
  if (row['八專'] === 'True') specs.push("八專");
  if (row['三箇惡日']) specs.push(row['三箇惡日']);
  document.getElementById('val-spec').innerText = specs.length ? specs.join(' · ') : "---";

  moveObj(tenichiGroup, row['天一神'], 10, true);
  moveObj(nichiyuGroup, row['日遊'], 4.5, false, true);
  moveObj(dokoMesh, row['土公神'], 7.5, false, false, row['大小土']);
  moveObj(taishoMesh, row['大將軍'], 13);
  moveKonMulti(konGroup, row['金神'], 13);

  drawDokoBlock(idx);

  // Sync date picker
  const picker = document.getElementById('date-picker');
  if(picker && row['日期']){
    // row['日期'] format is YYYY-MM-DD
    picker.value = row['日期'];
  }
}

// ===== UI/控制（slider：限制在今天±一年範圍內）=====
const slider = document.getElementById('date-slider');
const datePicker = document.getElementById('date-picker');

// Date Picker Event
if(datePicker){
  datePicker.addEventListener('change', (e) => {
    stopPlay();
    const val = e.target.value; // YYYY-MM-DD
    if(!val) return;

    // Find closest index
    const targetDate = parseISODateStrict(val);
    if(!targetDate) return;
    
    // Simple search in dateIndexMeta
    // Since dateIndexMeta is sorted by date, we could use binary search, 
    // but linear scan is fine for ~3000 rows.
    let bestIdx = -1;
    let minDiff = Infinity;

    for(let i=0; i<dateIndexMeta.length; i++){
       const d = dateIndexMeta[i].date;
       if(!d) continue;
       const diff = Math.abs(d - targetDate);
       if(diff < minDiff){
         minDiff = diff;
         bestIdx = i;
       }
    }

    if(bestIdx !== -1){
      // Clamp to slider range if needed, or expand range? 
      // Current design limits slider range. Let's just set it.
      // If the picked date is outside the slider range (today ± 1 year), 
      // the slider UI might look weird or we should update sliderMin/Max.
      // For now, let's just jump to it.
      currentIndex = bestIdx;
      
      // Update slider value if within range
      if(currentIndex >= slider.min && currentIndex <= slider.max){
        slider.value = currentIndex;
      } else {
         // If out of range, maybe we should warn or just let it be?
         // Let's at least update the scene.
         // Note: If slider is out of sync, next interaction with slider might jump.
      }
      updateScene(currentIndex);
    }
  });
}


function clampToSliderRange(v){
  const minV = Number(slider.min);
  const maxV = Number(slider.max);
  return Math.max(minV, Math.min(v, maxV));
}

function setIndex(i){
  stopPlay();
  currentIndex = clampToSliderRange(i);
  slider.value = currentIndex;
  updateScene(currentIndex);
}

slider.addEventListener('input', (e) => {
  stopPlay();
  currentIndex = clampToSliderRange(parseInt(e.target.value, 10));
  e.target.value = currentIndex;
  updateScene(currentIndex);
});

document.getElementById('btn-next').addEventListener('click', () => {
  setIndex(currentIndex + 1);
});

document.getElementById('btn-prev').addEventListener('click', () => {
  setIndex(currentIndex - 1);
});

const btnPlay = document.getElementById('btn-play');

function stopPlay() {
  clearInterval(playInterval);
  isPlaying = false;
  btnPlay.innerText = I18N[currentLang].btnAuto;
}

btnPlay.addEventListener('click', () => {
  if (isPlaying) stopPlay();
  else {
    isPlaying = true;
    btnPlay.innerText = I18N[currentLang].btnPause;
    playInterval = setInterval(() => {
      const maxV = Number(slider.max);
      if (currentIndex < maxV) {
        currentIndex++;
        slider.value = currentIndex;
        updateScene(currentIndex);
      } else stopPlay();
    }, 800);
  }
});

window.onload = init;
