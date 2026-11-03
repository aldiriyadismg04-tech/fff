// js/collision.js — MONSTRA: WILDBOUND Modular Script

// ============================================================================
// WATER & BRIDGE DETECTION SYSTEM (SUPPORTS WADING + DRY BRIDGE CROSSING)
// ============================================================================
const WaterSystem = {
  isPointOnBridge(wx, wy) {
    if (gameState.currentArea !== 'verdant_wilds') return false;
    // 1. Top Bridge: Jembatan Batu Alpine Utara (X: 738..892, Y: 86..148)
    if (wx >= 738 && wx <= 892 && wy >= 86 && wy <= 148) return true;
    // 2. Bottom Bridge: Jembatan Gantung Ngarai Selatan (X: 650..900, Y: 750..796)
    if (wx >= 650 && wx <= 900 && wy >= 750 && wy <= 796) return true;
    // 3. Dry Mossy Stepping Islands inside the Expanded Aqua Sanctuary
    if (Math.hypot((wx - 555) / 30, (wy - 135) / 19) <= 1.0) return true;
    if (Math.hypot((wx - 415) / 22, (wy - 128) / 15) <= 1.0) return true;
    return false;
  },

  isPointInWater(wx, wy) {
    if (gameState.currentArea !== 'verdant_wilds') return false;
    if (this.isPointOnBridge(wx, wy)) return false;

    // 1. Expanded Habitat #2: Danau & Laguna Teratai Kristal (Vast Multi-Pool Aqua Sanctuary)
    const dMainPool = Math.hypot((wx - 555) / 172, (wy - 132) / 68);
    const dWestPool = Math.hypot((wx - 395) / 96,  (wy - 140) / 52);
    const dEastChannel = Math.hypot((wx - 695) / 86, (wy - 126) / 44);
    if (dMainPool <= 0.96 || dWestPool <= 0.94 || dEastChannel <= 0.92) return true;

    const lx = wx - OX;
    const ly = wy - OY;

    // 2. Northern Upper Alpine Stream (local y: -155 .. -8)
    if (ly >= -155 && ly <= -8) {
      const center = 386 + Math.sin(ly * 0.03) * 8;
      const halfW = 19 + Math.sin(ly * 0.05) * 3;
      if (Math.abs(lx - center) <= halfW) return true;
    }

    // 3. Upper Waterfall Plunge Pool entering the Upper Culvert (Gorong-Gorong Hulu at ly: 90 .. 148)
    if (ly >= 90 && ly <= 148) {
      const progress = Math.max(0, Math.min(1, (ly - 90) / 58));
      const ease = progress * progress * (3 - 2 * progress);
      const center = 388 + ease * 26; // Flows into Upper Culvert Mouth at lx = 414, ly = 148
      const halfW = progress < 0.55
        ? (40 + Math.sin((progress / 0.55) * Math.PI) * 10)
        : (38 - ((progress - 0.55) / 0.45) * 12);
      if (Math.abs(lx - center) <= halfW) return true;
    }

    // 4. Lower Water Tunnel Canal & Southern Gorge Stream (Emerges from Lower Culvert at ly: 376 .. 670)
    if (ly >= 376 && ly <= 670) {
      const t = Math.max(0, Math.min(1, (ly - 376) / 140));
      const center = 392 + Math.sin(t * Math.PI) * 6;
      const halfW = 28 + t * 8;
      if (Math.abs(lx - center) <= halfW) return true;
    }

    return false;
  }
};

// ============================================================================
// 2. CHUNK MANAGER & OFF-SCREEN TERRAIN CACHING
// ============================================================================
const ChunkManager = {
  chunks: [],
  cols: 4,
  rows: 4,
  fullAreaCache: document.createElement('canvas'),
  activeChunksCount: 0,

  initForArea(areaWidth, areaHeight, drawAreaStaticFn) {
    W = areaWidth;
    H = areaHeight;
    this.cols = Math.ceil(W / CHUNK_W);
    this.rows = Math.ceil(H / CHUNK_H);
    this.chunks = [];

    this.fullAreaCache.width = W;
    this.fullAreaCache.height = H;
    const fullCtx = this.fullAreaCache.getContext('2d');
    fullCtx.imageSmoothingEnabled = false;
    drawAreaStaticFn(fullCtx);

    for (let cy = 0; cy < this.rows; cy++) {
      for (let cx = 0; cx < this.cols; cx++) {
        const cw = Math.min(CHUNK_W, W - cx * CHUNK_W);
        const ch = Math.min(CHUNK_H, H - cy * CHUNK_H);
        const cCanvas = document.createElement('canvas');
        cCanvas.width = cw;
        cCanvas.height = ch;
        const cCtx = cCanvas.getContext('2d');
        cCtx.imageSmoothingEnabled = false;
        cCtx.drawImage(
          this.fullAreaCache,
          cx * CHUNK_W, cy * CHUNK_H, cw, ch,
          0, 0, cw, ch
        );

        this.chunks.push({
          cx,
          cy,
          x: cx * CHUNK_W,
          y: cy * CHUNK_H,
          w: cw,
          h: ch,
          canvas: cCanvas
        });
      }
    }
  },

  renderVisibleChunks(ctx, cam) {
    const viewLeft = cam.x - cam.viewW / 2 - 32;
    const viewRight = cam.x + cam.viewW / 2 + 32;
    const viewTop = cam.y - cam.viewH / 2 - 32;
    const viewBottom = cam.y + cam.viewH / 2 + 32;

    let rendered = 0;
    for (let i = 0; i < this.chunks.length; i++) {
      const ch = this.chunks[i];
      if (
        ch.x + ch.w >= viewLeft &&
        ch.x <= viewRight &&
        ch.y + ch.h >= viewTop &&
        ch.y <= viewBottom
      ) {
        ctx.drawImage(ch.canvas, ch.x, ch.y);
        rendered++;
      }
    }
    this.activeChunksCount = rendered;
  }
};

// ============================================================================
// 3. COLLISION SYSTEM (TREES, ROCKS, BUILDINGS, CLIFFS, BRIDGES)
// ============================================================================
const CollisionSystem = {
  colliders: [],
  walkableOverrides: [],

  clear() {
    this.colliders = [];
    this.walkableOverrides = [];
  },

  addCircle(x, y, r, tag = 'prop') {
    this.colliders.push({ type: 'circle', x, y, r, tag });
  },

  addBox(x, y, w, h, tag = 'structure') {
    this.colliders.push({ type: 'box', x, y, w, h, tag });
  },

  addWalkableOverride(x, y, w, h, tag = 'bridge') {
    this.walkableOverrides.push({ x, y, w, h, tag });
  },

  isPointInWalkableOverride(px, py) {
    for (const ov of this.walkableOverrides) {
      if (px >= ov.x && px <= ov.x + ov.w && py >= ov.y && py <= ov.y + ov.h) {
        return true;
      }
    }
    return false;
  },

  isPositionWalkable(nx, ny, radius = player.radius) {
    const margin = 16;
    if (nx < margin || nx > W - margin || ny < margin + 10 || ny > H - margin) {
      return false;
    }

    const onOverride = this.isPointInWalkableOverride(nx, ny);

    for (const col of this.colliders) {
      if (col.tag === 'water') continue;
      if (onOverride && (col.tag === 'cliff' || col.tag === 'ravine' || col.tag === 'tree' || col.tag === 'ruins')) {
        continue;
      }
      if (col.type === 'circle') {
        const dist = Math.hypot(nx - col.x, ny - col.y);
        if (dist < radius + col.r) return false;
      } else if (col.type === 'box') {
        const closestX = Math.max(col.x, Math.min(nx, col.x + col.w));
        const closestY = Math.max(col.y, Math.min(ny, col.y + col.h));
        const dist = Math.hypot(nx - closestX, ny - closestY);
        if (dist < radius) return false;
      }
    }
    return true;
  },

  resolveMovement(currX, currY, nextX, nextY) {
    if (this.isPositionWalkable(nextX, nextY)) {
      return { x: nextX, y: nextY };
    }
    if (this.isPositionWalkable(nextX, currY)) {
      return { x: nextX, y: currY };
    }
    if (this.isPositionWalkable(currX, nextY)) {
      return { x: currX, y: nextY };
    }
    if (!this.isPositionWalkable(currX, currY)) {
      for (let r = 4; r <= 36; r += 4) {
        for (let a = 0; a < 8; a++) {
          const ang = (a / 8) * Math.PI * 2;
          const tx = currX + Math.cos(ang) * r;
          const ty = currY + Math.sin(ang) * r;
          if (this.isPositionWalkable(tx, ty)) {
            return { x: tx, y: ty };
          }
        }
      }
    }
    return { x: currX, y: currY };
  },

  renderDebug(ctx) {
    if (!gameState.debugOverlay) return;
    ctx.save();

    // 1. Crisp 32x32 RPG World Tile Grid (only within camera view for performance)
    const TILE_SIZE = 32;
    const startX = Math.max(0, Math.floor((camera.x - camera.viewW / 2) / TILE_SIZE) * TILE_SIZE);
    const endX = Math.min(W, Math.ceil((camera.x + camera.viewW / 2) / TILE_SIZE) * TILE_SIZE);
    const startY = Math.max(0, Math.floor((camera.y - camera.viewH / 2) / TILE_SIZE) * TILE_SIZE);
    const endY = Math.min(H, Math.ceil((camera.y + camera.viewH / 2) / TILE_SIZE) * TILE_SIZE);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    for (let x = startX; x <= endX; x += TILE_SIZE) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += TILE_SIZE) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // 2. Chunk Boundaries (400x225)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 5]);
    for (const ch of ChunkManager.chunks) {
      ctx.strokeRect(ch.x, ch.y, ch.w, ch.h);
    }
    ctx.setLineDash([]);

    // 3. Walkable Stair & Bridge Passages (Green)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.24)';
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.85)';
    ctx.lineWidth = 1.2;
    for (const ov of this.walkableOverrides) {
      ctx.fillRect(ov.x, ov.y, ov.w, ov.h);
      ctx.strokeRect(ov.x, ov.y, ov.w, ov.h);
    }

    // 4. Impassable Mountain, Cliff, Building, Fence & Tree Colliders
    for (const col of this.colliders) {
      if (col.tag === 'fence') {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.22)';
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
        ctx.lineWidth = 0.6;
      } else {
        ctx.fillStyle = col.tag === 'cliff' ? 'rgba(220, 38, 38, 0.28)' : 'rgba(249, 115, 22, 0.28)';
        ctx.strokeStyle = col.tag === 'cliff' ? 'rgba(248, 113, 113, 0.85)' : 'rgba(251, 146, 60, 0.85)';
        ctx.lineWidth = 1.1;
      }
      if (col.type === 'circle') {
        ctx.beginPath();
        ctx.arc(col.x, col.y, col.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(col.x, col.y, col.w, col.h);
        ctx.strokeRect(col.x, col.y, col.w, col.h);
      }
    }
    ctx.restore();
  }
};

function toggleDebugOverlay() {
  playSound('ui');
  gameState.debugOverlay = !gameState.debugOverlay;
  const btn = document.getElementById('debug-toggle-btn');
  if (btn) {
    btn.classList.toggle('border-emerald-400', gameState.debugOverlay);
  }
  showToast(gameState.debugOverlay ? 'Debug Grid & Collider: AKTIF' : 'Debug Grid & Collider: MATI');
}

