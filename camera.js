// js/camera.js — MONSTRA: WILDBOUND Modular Script

// ============================================================================
// ADAPTIVE CAMERA & VIEWPORT SYSTEM
// ============================================================================
const camera = {
  x: OX + 402,
  y: OY + 224,
  targetX: OX + 402,
  targetY: OY + 224,
  zoom: 2.0,
  userZoomOffset: 0,
  mode: 'follow', // 'follow' | 'auto' | 'overview'
  viewW: 800,
  viewH: 450,
  screenW: window.innerWidth,
  screenH: window.innerHeight
};

function recalculateCameraZoom() {
  const sw = window.innerWidth;
  const sh = window.innerHeight;
  camera.screenW = sw;
  camera.screenH = sh;

  let baseZoom = 1.0;
  if (camera.mode === 'overview') {
    baseZoom = Math.max(sw / W, sh / H);
  } else if (camera.mode === 'auto') {
    const isPortrait = sh > sw;
    baseZoom = isPortrait ? Math.max(sw / 420, sh / 680) : Math.max(sw / 760, sh / 440);
  } else {
    const minDim = Math.min(sw, sh);
    baseZoom = minDim < 500 ? 1.85 : (minDim < 820 ? 2.15 : 2.35);
  }

  camera.zoom = Math.max(0.55, Math.min(4.2, baseZoom + camera.userZoomOffset));
  camera.viewW = sw / camera.zoom;
  camera.viewH = sh / camera.zoom;

  const labelEl = document.getElementById('cam-mode-label');
  if (labelEl) {
    const names = { follow: 'Ikuti', auto: 'Otomatis', overview: 'Panorama' };
    labelEl.textContent = `Kamera: ${names[camera.mode] || 'Ikuti'}`;
  }
}

function updateViewportDimensions() {
  viewCanvas.width = window.innerWidth;
  viewCanvas.height = window.innerHeight;
  viewCtx.imageSmoothingEnabled = false;
  recalculateCameraZoom();
}

function cycleCameraMode() {
  playSound('ui');
  const order = ['follow', 'auto', 'overview'];
  const nextIdx = (order.indexOf(camera.mode) + 1) % order.length;
  camera.mode = order[nextIdx];
  camera.userZoomOffset = 0;
  recalculateCameraZoom();
}

function adjustZoom(delta) {
  playSound('ui');
  camera.userZoomOffset = Math.max(-1.0, Math.min(2.2, camera.userZoomOffset + delta));
  if (camera.mode === 'overview' && delta > 0) camera.mode = 'follow';
  recalculateCameraZoom();
}

window.addEventListener('resize', updateViewportDimensions);
window.addEventListener('orientationchange', () => setTimeout(updateViewportDimensions, 120));

// ============================================================================
// 1. WORLD COORDINATE SYSTEM
// ============================================================================
const WorldCoordinateSystem = {
  screenToWorld(clientX, clientY) {
    const rect = viewCanvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const wx = (camera.x - camera.viewW / 2) + sx / camera.zoom;
    const wy = (camera.y - camera.viewH / 2) + sy / camera.zoom;
    return {
      x: Math.max(10, Math.min(W - 10, wx)),
      y: Math.max(10, Math.min(H - 10, wy))
    };
  },

  worldToScreen(wx, wy) {
    const sx = (wx - (camera.x - camera.viewW / 2)) * camera.zoom;
    const sy = (wy - (camera.y - camera.viewH / 2)) * camera.zoom;
    return { x: sx, y: sy };
  },

  worldToChunk(wx, wy) {
    return {
      cx: Math.max(0, Math.min(Math.ceil(W / CHUNK_W) - 1, Math.floor(wx / CHUNK_W))),
      cy: Math.max(0, Math.min(Math.ceil(H / CHUNK_H) - 1, Math.floor(wy / CHUNK_H)))
    };
  },

  getSectorName(areaId, wx, wy) {
    if (areaId === 'ancient_sanctum') return 'Sanctum Reruntuhan Kuno';
    if (areaId === 'cottage_interior') return 'Interior Pondok Liora';
    for (const hab of MONSTER_HABITATS) {
      const normDist = Math.hypot((wx - hab.x) / hab.rx, (wy - hab.y) / hab.ry);
      if (normDist <= 1.05) {
        return `${hab.icon} ${hab.name}`;
      }
    }
    if (wy < OY) return 'Hulu Air Terjun & Tebing Alpine Utara';
    if (wy > OY + 450) return 'Ngarai Sungai Selatan & Jembatan Bawah';
    if (wx < OX) return 'Hutan Bisikan Barat (Whispering Woods)';
    if (wx > OX + 800) return 'Kebun & Pinggiran Desa Timur';
    return 'Lembah Utama Verdant Wilds';
  }
};

function screenToWorld(clientX, clientY) {
  return WorldCoordinateSystem.screenToWorld(clientX, clientY);
}

function worldToScreen(wx, wy) {
  return WorldCoordinateSystem.worldToScreen(wx, wy);
}

// Deterministic 2D Hash & Fractional Brownian Motion (fBm)
