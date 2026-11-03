// js/player-npc.js — MONSTRA: WILDBOUND Modular Script

function createPixelLayer(w, h) {
  const buf = new Array(w * h).fill(null);
  return {
    w, h, buf,
    set(x, y, col) {
      const ix = Math.round(x), iy = Math.round(y);
      if (ix >= 0 && ix < w && iy >= 0 && iy < h) buf[iy * w + ix] = col;
    },
    get(x, y) {
      if (x < 0 || x >= w || y < 0 || y >= h) return null;
      return buf[y * w + x];
    },
    fillPoly(pts, colFn) {
      let minX = w, maxX = 0, minY = h, maxY = 0;
      for (const [px, py] of pts) {
        if (px < minX) minX = Math.floor(px);
        if (px > maxX) maxX = Math.ceil(px);
        if (py < minY) minY = Math.floor(py);
        if (py > maxY) maxY = Math.ceil(py);
      }
      minX = Math.max(0, minX); maxX = Math.min(w - 1, maxX);
      minY = Math.max(0, minY); maxY = Math.min(h - 1, maxY);

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          let inside = false;
          for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const xi = pts[i][0], yi = pts[i][1];
            const xj = pts[j][0], yj = pts[j][1];
            const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-6) + xi);
            if (intersect) inside = !inside;
          }
          if (inside) {
            const c = typeof colFn === 'function' ? colFn(x, y) : colFn;
            if (c) buf[y * w + x] = c;
          }
        }
      }
    },
    fillDisc(cx, cy, r, col) {
      const r2 = r * r;
      for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
        for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
          if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r2) this.set(x, y, col);
        }
      }
    },
    strokeLine(x0, y0, x1, y1, r, col) {
      const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        this.fillDisc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, col);
      }
    },
    applyOutline(outlineCol = '#0b1120') {
      const copy = buf.slice();
      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          if (!copy[y * w + x]) {
            for (const [dx, dy] of dirs) {
              if (copy[(y + dy) * w + (x + dx)]) {
                buf[y * w + x] = outlineCol;
                break;
              }
            }
          }
        }
      }
    },
    compositeTo(targetCtx) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const c = buf[y * w + x];
          if (c) {
            targetCtx.fillStyle = c;
            targetCtx.fillRect(x, y, 1, 1);
          }
        }
      }
    }
  };
}

// Bake a single 88x64 high-density pixel-art frame of Aquafly (facing LEFT natively, matching Row 1 of sheet)
// ============================================================================
// 7. HIGH-DENSITY HD-2D SPRITE SHEET RENDERERS:
//    - ARYA (Pengembara Jaket Putih: 64x64 Pixel-Art Baker for All 4 Rows of Sheet!)
//    - AQUAFLY (Tahap 1 Ikan Kepala Elang: 88x64 Pixel-Art Baker for All 4 Rows!)
// ============================================================================
const ARYA_SHEET_CACHE = {
  ready: false,
  idle: [],   // 4 frames (Row 1 of Arya Sprite Sheet)
  walk: [],   // 6 frames (Row 2 of Arya Sprite Sheet)
  attack: [], // 6 frames (Row 3 of Arya Sprite Sheet)
  skill: [],  // 7 frames (Row 4 of Arya Sprite Sheet)
  back: []    // 4 frames (When walking UP / away from camera)
};

// Bake a single 64x64 high-density pixel-art frame of ARYA (facing RIGHT natively, matching the Sprite Sheet!)
function bakeAryaFrame(pose) {
  const fw = 64, fh = 64;
  const can = document.createElement('canvas');
  can.width = fw;
  can.height = fh;
  const ctx = can.getContext('2d');

  const cx = 30 + (pose.dx || 0);
  const by = 56 + (pose.dy || 0); // Foot baseline Y

  // --------------------------------------------------------------------------
  // LAYER 0: ROW 4 COMMAND / SUMMON MAGIC CIRCLE & RISING AURA PILLARS AT FEET
  // --------------------------------------------------------------------------
  if (pose.magicCircle) {
    const mcL = createPixelLayer(fw, fh);
    const rOut = pose.magicCircle === 'full' ? 20 : 17;
    for (let y = by - 6; y <= by + 6; y++) {
      for (let x = cx - rOut - 2; x <= cx + rOut + 2; x++) {
        const nx = (x - cx) / rOut;
        const ny = (y - by) / 5.2;
        const d = Math.hypot(nx, ny);
        if (d <= 1.05 && d >= 0.82) {
          mcL.set(x, y, d > 0.94 ? '#f59e0b' : '#fef08a');
        } else if (d < 0.82 && d >= 0.56) {
          mcL.set(x, y, ((x + y) % 2 === 0) ? '#38bdf8' : '#0284c7');
        } else if (d < 0.56 && ((x * 3 + y * 5) % 7 === 0)) {
          mcL.set(x, y, '#bae6fd');
        }
      }
    }
    // Rising blue/white/gold vertical aura beams around legs (Row 4 Frames 2, 3, 7)
    const beamCols = [-15, -10, -5, 5, 10, 15];
    beamCols.forEach((bxOff, i) => {
      const hBeam = (pose.magicCircle === 'full' ? 18 : 11) + (i % 2) * 5;
      for (let py = 0; py < hBeam; py++) {
        const col = py < 4 ? '#ffffff' : (py < hBeam * 0.65 ? '#38bdf8' : '#1d4ed8');
        mcL.set(cx + bxOff, by - 2 - py, col);
        if (py < hBeam * 0.5) mcL.set(cx + bxOff + 1, by - 2 - py, '#bae6fd');
      }
    });
    mcL.compositeTo(ctx);
  }

  // If facing UP (back view when walking north), bake crisp back-view sprite
  if (pose.isBack) {
    const bodyL = createPixelLayer(fw, fh);
    const lOff = pose.lLegY || 0;
    const rOff = pose.rLegY || 0;
    // Left & Right Legs (Charcoal pants + tan boot cuffs + dark boots)
    bodyL.fillPoly([[cx - 6, by - 14 + lOff], [cx - 1, by - 14 + lOff], [cx - 1, by - 4 + lOff], [cx - 6, by - 4 + lOff]], '#262b38');
    bodyL.fillPoly([[cx + 1, by - 14 + rOff], [cx + 6, by - 14 + rOff], [cx + 6, by - 4 + rOff], [cx + 1, by - 4 + rOff]], '#1e222d');
    bodyL.fillPoly([[cx - 6, by - 5 + lOff], [cx - 1, by - 5 + lOff], [cx - 1, by - 3 + lOff], [cx - 6, by - 3 + lOff]], '#c89d62');
    bodyL.fillPoly([[cx + 1, by - 5 + rOff], [cx + 6, by - 5 + rOff], [cx + 6, by - 3 + rOff], [cx + 1, by - 3 + rOff]], '#b3884e');
    bodyL.fillPoly([[cx - 6, by - 3 + lOff], [cx - 1, by - 3 + lOff], [cx - 1, by + lOff], [cx - 6, by + lOff]], '#26201d');
    bodyL.fillPoly([[cx + 1, by - 3 + rOff], [cx + 6, by - 3 + rOff], [cx + 6, by + rOff], [cx + 1, by + rOff]], '#1f1a17');

    // Back of White Traveler Jacket with Navy Collar & Gold Bottom Trim
    bodyL.fillPoly([[cx - 8, by - 28], [cx + 8, by - 28], [cx + 9, by - 13], [cx - 9, by - 13]], (x, y) => {
      if (y < by - 24) return '#1e293b'; // Navy upper yoke/collar
      if (y >= by - 15) return '#f59e0b'; // Gold hem trim
      return Math.abs(x - cx) < 6 ? '#f8fafc' : '#cbd5e1';
    });
    // Crossbody Leather Satchel Strap & Brown Bag on Left Hip
    bodyL.strokeLine(cx - 5, by - 25, cx + 6, by - 15, 1.2, '#784421');
    bodyL.fillPoly([[cx - 12, by - 20], [cx - 6, by - 20], [cx - 6, by - 12], [cx - 12, by - 12]], (x, y) => y < by - 17 ? '#9c5a2e' : '#6e3d1e');
    // Swinging White Arms
    bodyL.fillPoly([[cx - 11, by - 26 - lOff * 0.5], [cx - 8, by - 26 - lOff * 0.5], [cx - 8, by - 16 - lOff * 0.5], [cx - 11, by - 16 - lOff * 0.5]], '#e2e8f0');
    bodyL.fillPoly([[cx + 8, by - 26 - rOff * 0.5], [cx + 11, by - 26 - rOff * 0.5], [cx + 11, by - 16 - rOff * 0.5], [cx + 8, by - 16 - rOff * 0.5]], '#f8fafc');
    // Spiky Black Hair Back View
    bodyL.fillDisc(cx, by - 36, 8.5, '#181c26');
    const spikes = [
      [[cx - 8, by - 38], [cx - 13, by - 35], [cx - 7, by - 33]],
      [[cx + 8, by - 38], [cx + 13, by - 35], [cx + 7, by - 33]],
      [[cx - 6, by - 42], [cx - 9, by - 47], [cx - 2, by - 43]],
      [[cx + 2, by - 43], [cx + 7, by - 48], [cx + 8, by - 41]],
      [[cx - 2, by - 44], [cx + 1, by - 49], [cx + 4, by - 44]]
    ];
    spikes.forEach(pts => bodyL.fillPoly(pts, '#181c26'));
    bodyL.strokeLine(cx - 4, by - 40, cx - 1, by - 40, 1.0, '#333c4d');
    bodyL.strokeLine(cx + 2, by - 39, cx + 5, by - 39, 1.0, '#333c4d');
    bodyL.applyOutline('#0b0f17');
    bodyL.compositeTo(ctx);
    return can;
  }

  // --------------------------------------------------------------------------
  // LAYER 1: BACK ARM, LEGS, CHARCOAL TROUSERS & CUFFED ADVENTURE BOOTS
  // --------------------------------------------------------------------------
  const legsL = createPixelLayer(fw, fh);
  const bLegX = cx + (pose.bLegX ?? -4);
  const bLegY = by + (pose.bLegY ?? 0);
  const fLegX = cx + (pose.fLegX ?? 3);
  const fLegY = by + (pose.fLegY ?? 0);

  const drawLegAndBoot = (lx, ly, isFront) => {
    const hipX = cx + (isFront ? 2 : -2);
    const hipY = by - 14;
    const kneeX = (hipX + lx) * 0.5 + (pose.kneeForward ? 2 : 0);
    const kneeY = (hipY + ly - 5) * 0.5;

    // Charcoal grey trousers with knee highlight & crease
    legsL.strokeLine(hipX, hipY, kneeX, kneeY, 2.5, isFront ? '#2e3545' : '#1f2430');
    legsL.strokeLine(kneeX, kneeY, lx, ly - 5, 2.3, isFront ? '#3b4459' : '#262c3a');
    if (isFront) legsL.strokeLine(kneeX + 1, kneeY - 1, lx + 1, ly - 7, 0.9, '#525e78');

    // Tan / Gold rolled boot cuff
    legsL.fillPoly([
      [lx - 3, ly - 6], [lx + 4, ly - 6], [lx + 4, ly - 4], [lx - 3, ly - 4]
    ], isFront ? '#d4a86a' : '#ad854c');

    // Dark brown/black adventure boot with sturdy sole & toe cap
    legsL.fillPoly([
      [lx - 3, ly - 4], [lx + 4, ly - 4], [lx + 6, ly - 1], [lx + 6, ly], [lx - 3, ly]
    ], (x, y) => {
      if (y === ly) return '#b89158'; // Tan boot welt/sole line
      if (x >= lx + 3 && y <= ly - 2) return '#423833'; // Toe highlight
      return isFront ? '#2b2420' : '#1c1715';
    });
  };

  // Render Back Leg first, then Front Leg
  drawLegAndBoot(bLegX, bLegY, false);
  drawLegAndBoot(fLegX, fLegY, true);
  legsL.applyOutline('#0b0f17');
  legsL.compositeTo(ctx);

  // --------------------------------------------------------------------------
  // LAYER 2: TORSO, DARK NAVY SHIRT, WHITE TRAVELER JACKET & CROSSBODY SATCHEL
  // --------------------------------------------------------------------------
  const torsoL = createPixelLayer(fw, fh);
  const tx = cx + (pose.leanX || 0);
  const ty = by - 15 + (pose.torsoY || 0);

  // Back/Right Arm (when behind torso or extended forward during punch/cast)
  if (pose.rArm === 'punch' || pose.rArm === 'cast' || pose.rArm === 'point') {
    const extX = pose.rArm === 'punch' ? tx + 16 : (pose.rArm === 'point' ? tx + 15 : tx + 14);
    const extY = ty - 9;
    // White sleeve extending forward
    torsoL.strokeLine(tx + 3, ty - 10, extX - 3, extY, 2.3, '#f8fafc');
    torsoL.strokeLine(tx + 3, ty - 8, extX - 3, extY + 2, 1.2, '#cbd5e1');
    // Gold sleeve cuff
    torsoL.fillPoly([[extX - 4, extY - 2], [extX - 2, extY - 2], [extX - 2, extY + 3], [extX - 4, extY + 3]], '#f59e0b');
    // Fist / Open Casting Hand
    torsoL.fillDisc(extX, extY, 2.2, '#f7d4b2');
  } else if (pose.rArm === 'think') {
    // Row 1 Idle Frame 3 & 4: Right hand raised to chin/brow!
    torsoL.strokeLine(tx + 4, ty - 10, tx + 9, ty - 14, 2.2, '#f8fafc');
    torsoL.strokeLine(tx + 9, ty - 14, tx + 6, ty - 19, 2.0, '#e2e8f0');
    torsoL.fillDisc(tx + 6, ty - 17, 1.3, '#f59e0b'); // Gold cuff
    torsoL.fillDisc(tx + 5, ty - 20, 2.0, '#f7d4b2'); // Hand touching chin/visage
  } else {
    // Standard / Running swinging front-right arm
    const rSwingX = pose.rArmX || 0;
    const rSwingY = pose.rArmY || 0;
    torsoL.strokeLine(tx + 4, ty - 10, tx + 6 + rSwingX, ty - 3 + rSwingY, 2.2, '#e2e8f0');
    torsoL.fillDisc(tx + 6 + rSwingX, ty - 3 + rSwingY, 1.4, '#f59e0b'); // Gold cuff
    torsoL.fillDisc(tx + 7 + rSwingX, ty - 1 + rSwingY, 1.8, '#f7d4b2'); // Hand
  }

  // Dark Navy Inner Tunic/Shirt & Leather Belt with Gold Buckle
  torsoL.fillPoly([
    [tx - 6, ty - 13], [tx + 6, ty - 13], [tx + 5, ty + 1], [tx - 5, ty + 1]
  ], (x, y) => {
    if (y >= ty - 1) return Math.abs(x - tx) <= 1 ? '#fbbf24' : '#3b2416'; // Belt & Gold buckle
    return x > tx ? '#263147' : '#171e2e';
  });

  // Crisp White Open Traveler Jacket (Left & Right Front Panels, Navy Shoulder Yoke & Gold Hem Trim)
  const flareL = pose.coatFlare || 0;
  // Left jacket panel
  torsoL.fillPoly([
    [tx - 7, ty - 13], [tx - 1, ty - 13], [tx - 2, ty + 1], [tx - 8 - flareL, ty + 1]
  ], (x, y) => {
    if (y < ty - 10) return '#1e293b'; // Dark navy collar/shoulder lapel
    if (y === ty - 10 || y >= ty) return '#f59e0b'; // Gold shoulder & bottom hem trim
    return x < tx - 5 ? '#cbd5e1' : '#f8fafc';
  });
  // Right jacket panel
  torsoL.fillPoly([
    [tx + 2, ty - 13], [tx + 7, ty - 13], [tx + 7 + flareL, ty + 1], [tx + 3, ty + 1]
  ], (x, y) => {
    if (y < ty - 10) return '#1e293b';
    if (y === ty - 10 || y >= ty) return '#f59e0b';
    return '#e2e8f0';
  });

  // Diagonal Brown Leather Crossbody Satchel Strap across chest + Hip Satchel Bag
  torsoL.strokeLine(tx + 3, ty - 12, tx - 6, ty - 2, 1.3, '#854d27');
  torsoL.strokeLine(tx + 3, ty - 11, tx - 6, ty - 1, 0.8, '#a86434');
  // Brown Messenger Satchel resting on left hip (Exact match to Arya sheet!)
  const bagX = tx - 8 - flareL * 0.5;
  const bagY = ty - 2;
  torsoL.fillPoly([
    [bagX - 4, bagY - 4], [bagX + 3, bagY - 4], [bagX + 3, bagY + 4], [bagX - 4, bagY + 4]
  ], (x, y) => {
    if (x === bagX && y === bagY) return '#fbbf24'; // Brass buckle clasp
    if (y < bagY - 1) return '#9c5a2e'; // Top leather flap
    return '#6e3d1e';
  });

  // Left (Near) Arm & White Jacket Sleeve with Navy Shoulder Pad & Gold Cuff
  const lSwingX = pose.lArmX || 0;
  const lSwingY = pose.lArmY || 0;
  if (pose.lArm === 'orbChest') {
    // Row 4 Skill Frame 1: Left & right hands holding glowing blue orb at chest
    torsoL.strokeLine(tx - 6, ty - 10, tx - 1, ty - 6, 2.4, '#f8fafc');
    torsoL.fillDisc(tx - 6, ty - 11, 2.0, '#1e293b');
    torsoL.fillDisc(tx, ty - 6, 1.8, '#f7d4b2');
  } else {
    torsoL.strokeLine(tx - 6, ty - 10, tx - 7 + lSwingX, ty - 3 + lSwingY, 2.4, '#f8fafc');
    torsoL.strokeLine(tx - 7, ty - 9, tx - 8 + lSwingX, ty - 3 + lSwingY, 1.0, '#cbd5e1');
    torsoL.fillDisc(tx - 6, ty - 11, 2.1, '#1e293b'); // Navy shoulder cap
    torsoL.fillDisc(tx - 7 + lSwingX, ty - 3 + lSwingY, 1.5, '#f59e0b'); // Gold cuff
    torsoL.fillDisc(tx - 7 + lSwingX, ty - 1 + lSwingY, 1.9, '#f7d4b2'); // Hand
  }

  torsoL.applyOutline('#0b0f17');
  torsoL.compositeTo(ctx);

  // --------------------------------------------------------------------------
  // LAYER 3: HEAD, ANIME FACE & SPIKY JET-BLACK MESSY HAIR (Exact Sheet Match)
  // --------------------------------------------------------------------------
  const headL = createPixelLayer(fw, fh);
  const hx = tx + (pose.headX || 0);
  const hy = ty - 21 + (pose.headY || 0);

  // Warm Peach-Tan Anime Face & Chin
  headL.fillPoly([
    [hx - 5, hy - 4], [hx + 6, hy - 4], [hx + 6, hy + 5], [hx + 2, hy + 7], [hx - 3, hy + 7], [hx - 5, hy + 4]
  ], (x, y) => {
    if (y >= hy + 6 || x <= hx - 4) return '#dfb088'; // Warm jawline/cheek shadow
    return '#f7d4b2';
  });

  // Spiky Jet-Black Hair Crown, Forehead Bangs & Outward Tufts
  headL.fillPoly([
    [hx - 8, hy - 3], [hx - 7, hy - 9], [hx, hy - 11], [hx + 7, hy - 9], [hx + 8, hy - 3], [hx + 5, hy - 1], [hx - 6, hy - 1]
  ], (x, y) => {
    if (y <= hy - 6 && Math.abs(x - hx) >= 2 && Math.abs(x - hx) <= 5) return '#333c4f'; // Slate hair sheen
    return '#181c26';
  });

  // Signature jagged spikes around crown, back of head, and temples
  const hairSpikes = [
    // Back-left spikes
    [[hx - 7, hy - 6], [hx - 12, hy - 7], [hx - 8, hy - 2]],
    [[hx - 7, hy - 3], [hx - 11, hy - 2], [hx - 6, hy + 2]],
    // Top crown spikes
    [[hx - 6, hy - 8], [hx - 8, hy - 13], [hx - 2, hy - 10]],
    [[hx - 3, hy - 10], [hx, hy - 14], [hx + 3, hy - 10]],
    [[hx + 2, hy - 10], [hx + 7, hy - 13], [hx + 6, hy - 8]],
    // Front-rightswept bangs
    [[hx + 5, hy - 7], [hx + 10, hy - 6], [hx + 6, hy - 3]],
    // Forehead V-bangs hanging over brow
    [[hx - 4, hy - 2], [hx - 2, hy + 2], [hx, hy - 2]],
    [[hx + 1, hy - 2], [hx + 3, hy + 2], [hx + 5, hy - 2]],
    // Left sideburn lock
    [[hx - 6, hy - 2], [hx - 4, hy - 2], [hx - 5, hy + 4]]
  ];
  hairSpikes.forEach(pts => headL.fillPoly(pts, '#181c26'));

  headL.applyOutline('#0b0f17');

  // Determined Anime Eyes (or Blink in Idle Frame 2)
  if (pose.blink) {
    headL.strokeLine(hx - 2, hy + 2, hx, hy + 2, 0.6, '#2b1d16');
    headL.strokeLine(hx + 3, hy + 2, hx + 5, hy + 2, 0.6, '#2b1d16');
  } else {
    // Left eye
    headL.set(hx - 2, hy + 1, '#ffffff');
    headL.set(hx - 1, hy + 1, '#11131c');
    headL.set(hx - 1, hy + 2, '#11131c');
    headL.set(hx - 2, hy + 2, '#3b2820');
    // Right eye
    headL.set(hx + 3, hy + 1, '#ffffff');
    headL.set(hx + 4, hy + 1, '#11131c');
    headL.set(hx + 4, hy + 2, '#11131c');
    headL.set(hx + 3, hy + 2, '#3b2820');
    // Determined dark eyebrows
    headL.strokeLine(hx - 3, hy, hx, hy, 0.5, '#181c26');
    headL.strokeLine(hx + 3, hy, hx + 5, hy, 0.5, '#181c26');
  }

  // Subtle breath puff in Idle Frame 4 (matching sprite sheet Row 1 Frame 4!)
  if (pose.breathPuff) {
    headL.set(hx - 11, hy + 1, '#cbd5e1');
    headL.set(hx - 13, hy, '#94a3b8');
    headL.set(hx - 14, hy + 1, '#e2e8f0');
  }

  headL.compositeTo(ctx);

  // --------------------------------------------------------------------------
  // LAYER 4: FOREGROUND ENERGY ORB, PROJECTILE BLAST & SWIRLING SKILL RIBBONS
  // --------------------------------------------------------------------------
  if (pose.fx) {
    const fxL = createPixelLayer(fw, fh);
    if (pose.fx === 'wristCharge') {
      // Row 3 Frame 3: Blue-gold energy ring charging on extended fist
      fxL.fillDisc(tx + 16, ty - 9, 3.2, '#38bdf8');
      fxL.fillDisc(tx + 16, ty - 9, 1.8, '#ffffff');
      fxL.set(tx + 13, ty - 12, '#fde047');
      fxL.set(tx + 18, ty - 6, '#fde047');
    } else if (pose.fx === 'orbBlast') {
      // Row 3 Frame 4: Radiant Blue-Gold Energy Sphere with golden comet tail!
      const ox = tx + 22, oy = ty - 9;
      fxL.strokeLine(ox - 10, oy - 3, ox, oy - 4, 1.2, '#f59e0b');
      fxL.strokeLine(ox - 11, oy + 3, ox, oy + 4, 1.2, '#f59e0b');
      fxL.strokeLine(ox - 8, oy, ox, oy, 1.5, '#fde047');
      fxL.fillDisc(ox, oy, 6.2, '#f59e0b');
      fxL.fillDisc(ox, oy, 4.8, '#38bdf8');
      fxL.fillDisc(ox, oy, 2.8, '#ffffff');
      // 4-point pixel sparkles
      [[ox - 9, oy - 6], [ox - 8, oy + 6], [ox + 6, oy - 5]].forEach(([sx, sy]) => {
        fxL.set(sx, sy, '#fde047');
        fxL.set(sx - 1, sy, '#ffffff'); fxL.set(sx + 1, sy, '#ffffff');
        fxL.set(sx, sy - 1, '#ffffff'); fxL.set(sx, sy + 1, '#ffffff');
      });
    } else if (pose.fx === 'slashFollow') {
      // Row 3 Frame 5: Sweeping blue-gold arc & starburst at hand
      const ox = tx + 19, oy = ty - 9;
      for (let a = -1.2; a <= 1.4; a += 0.08) {
        const rx = ox - 6 + Math.cos(a) * 11;
        const ry = oy + Math.sin(a) * 10;
        fxL.fillDisc(rx, ry, 1.4, a < 0 ? '#fde047' : '#38bdf8');
        fxL.set(rx + 1, ry, '#ffffff');
      }
      fxL.fillDisc(ox, oy, 4.2, '#bae6fd');
      fxL.fillDisc(ox, oy, 2.4, '#ffffff');
    } else if (pose.fx === 'chestOrb') {
      // Row 4 Frame 1: Glowing blue-gold orb held at chest
      const ox = tx + 2, oy = ty - 6;
      fxL.fillDisc(ox, oy, 5.0, '#38bdf8');
      fxL.fillDisc(ox, oy, 3.2, '#bae6fd');
      fxL.fillDisc(ox, oy, 1.8, '#ffffff');
      fxL.set(ox - 5, oy - 4, '#fde047');
      fxL.set(ox + 5, oy + 4, '#fde047');
    } else if (pose.fx === 'swirlVortex') {
      // Row 4 Frame 5: Swirling cyan & gold ribbons spiraling around Arya into forward orb!
      const ox = tx + 16, oy = ty - 9;
      for (let t = 0; t <= 1.0; t += 0.025) {
        const ang = t * Math.PI * 3.2;
        const sx = tx - 6 + t * 22 + Math.cos(ang) * (8 * (1 - t * 0.5));
        const sy = ty - 9 + Math.sin(ang) * (7 * (1 - t * 0.4));
        fxL.fillDisc(sx, sy, 1.3, (Math.floor(t * 10) % 2 === 0) ? '#38bdf8' : '#fde047');
        fxL.set(sx, sy, '#ffffff');
      }
      fxL.fillDisc(ox, oy, 4.8, '#fde047');
      fxL.fillDisc(ox, oy, 3.4, '#38bdf8');
      fxL.fillDisc(ox, oy, 2.0, '#ffffff');
    } else if (pose.fx === 'starSparkles' || pose.fx === 'radiantFinale') {
      // Row 4 Frames 6 & 7: Golden & cyan star sparkles bursting around Arya
      const stars = [
        [tx - 14, ty - 18, 2, '#fde047'], [tx + 15, ty - 20, 3, '#38bdf8'],
        [tx + 19, ty - 8,  2, '#fde047'], [tx - 12, ty - 4,  2, '#bae6fd'],
        [tx + 12, ty + 2,  2, '#fde047'], [tx - 6,  ty - 25, 3, '#38bdf8']
      ];
      stars.forEach(([sx, sy, sz, col]) => {
        for (let d = -sz; d <= sz; d++) {
          fxL.set(sx + d, sy, col);
          fxL.set(sx, sy + d, col);
        }
        fxL.set(sx, sy, '#ffffff');
      });
      if (pose.fx === 'radiantFinale') {
        fxL.fillDisc(tx + 15, ty - 9, 3.5, '#bae6fd');
        fxL.fillDisc(tx + 15, ty - 9, 2.0, '#ffffff');
        fxL.fillDisc(tx - 10, ty - 7, 3.0, '#bae6fd');
        fxL.fillDisc(tx - 10, ty - 7, 1.6, '#ffffff');
      }
    }
    fxL.compositeTo(ctx);
  }

  return can;
}

function ensureAryaSpriteSheetBaked() {
  if (ARYA_SHEET_CACHE.ready) return;

  // Row 1: IDLE (4 frames from Sprite Sheet)
  ARYA_SHEET_CACHE.idle = [
    bakeAryaFrame({ dy: 0, bLegX: -4, fLegX: 3, lArmX: 0, rArmX: 0 }),
    bakeAryaFrame({ dy: 0, bLegX: -4, fLegX: 3, blink: true }),
    bakeAryaFrame({ dy: 0, bLegX: -4, fLegX: 3, rArm: 'think' }),
    bakeAryaFrame({ dy: 0, bLegX: -4, fLegX: 3, rArm: 'think', breathPuff: true })
  ];

  // Row 2: BERJALAN / BERGERAK (6 frames full stride & run cycle from Sprite Sheet)
  ARYA_SHEET_CACHE.walk = [
    bakeAryaFrame({ dy: 0,  bLegX: -3, bLegY: 0,  fLegX: 3,  fLegY: 0,  lArmX: -1, rArmX: 1 }),
    bakeAryaFrame({ dy: -1, bLegX: -5, bLegY: -1, fLegX: 5,  fLegY: 0,  lArmX: -3, lArmY: -1, rArmX: 3, rArmY: -1, coatFlare: 1 }),
    bakeAryaFrame({ dy: -1, bLegX: -7, bLegY: -2, fLegX: 6,  fLegY: -1, lArmX: -4, lArmY: -2, rArmX: 4, rArmY: -2, coatFlare: 2, leanX: 1 }),
    bakeAryaFrame({ dy: -2, bLegX: -8, bLegY: -3, fLegX: 7,  fLegY: -1, lArmX: -5, lArmY: -3, rArmX: 5, rArmY: -2, coatFlare: 3, leanX: 2, kneeForward: true }),
    bakeAryaFrame({ dy: -1, bLegX: -5, bLegY: -4, fLegX: 4,  fLegY: 0,  lArmX: -3, lArmY: -2, rArmX: 3, rArmY: -1, coatFlare: 2, leanX: 1 }),
    bakeAryaFrame({ dy: -2, bLegX: -8, bLegY: -3, fLegX: 7,  fLegY: -1, lArmX: -4, lArmY: -3, rArmX: 5, rArmY: -3, coatFlare: 3, leanX: 2, kneeForward: true })
  ];

  // Row 3: MENYERANG (6 frames from Sprite Sheet)
  ARYA_SHEET_CACHE.attack = [
    bakeAryaFrame({ dy: 0,  bLegX: -6, fLegX: 5,  lArmX: -2, lArmY: -2, rArmX: 3, rArmY: -3, leanX: 1 }),
    bakeAryaFrame({ dy: 1,  bLegX: -8, fLegX: 6,  lArmX: -4, lArmY: -2, rArm: 'punch', leanX: 2, coatFlare: 2 }),
    bakeAryaFrame({ dy: 1,  bLegX: -8, fLegX: 6,  lArmX: -4, lArmY: -2, rArm: 'punch', leanX: 3, coatFlare: 2, fx: 'wristCharge' }),
    bakeAryaFrame({ dy: 1,  bLegX: -9, fLegX: 6,  lArmX: -5, lArmY: -2, rArm: 'cast',  leanX: 3, coatFlare: 3, fx: 'orbBlast' }),
    bakeAryaFrame({ dy: -1, bLegX: -6, bLegY: -3, fLegX: 5,  lArmX: -4, rArm: 'cast',  leanX: 4, coatFlare: 3, fx: 'slashFollow' }),
    bakeAryaFrame({ dy: 0,  bLegX: -6, fLegX: 5,  lArmX: -2, lArmY: -1, rArmX: 2, rArmY: -2, leanX: 1 })
  ];

  // Row 4: MENGELUARKAN SKILL (7 frames from Sprite Sheet)
  ARYA_SHEET_CACHE.skill = [
    bakeAryaFrame({ dy: 0, bLegX: -5, fLegX: 4, lArm: 'orbChest', fx: 'chestOrb' }),
    bakeAryaFrame({ dy: 1, bLegX: -7, fLegX: 6, lArmX: -3, rArmX: 3, magicCircle: 'init' }),
    bakeAryaFrame({ dy: 1, bLegX: -7, fLegX: 6, lArmX: -4, rArmX: 4, magicCircle: 'full' }),
    bakeAryaFrame({ dy: 0, bLegX: -7, fLegX: 6, lArmX: -3, rArm: 'point', leanX: 2 }),
    bakeAryaFrame({ dy: 0, bLegX: -7, fLegX: 6, lArmX: -4, rArm: 'cast',  leanX: 2, coatFlare: 2, fx: 'swirlVortex' }),
    bakeAryaFrame({ dy: 0, bLegX: -7, fLegX: 6, lArmX: -4, rArm: 'cast',  leanX: 2, coatFlare: 2, fx: 'starSparkles' }),
    bakeAryaFrame({ dy: 0, bLegX: -7, fLegX: 6, lArmX: -5, lArmY: -3, rArm: 'cast', magicCircle: 'full', fx: 'radiantFinale' })
  ];

  // Back View Frames (When walking UP / North)
  ARYA_SHEET_CACHE.back = [
    bakeAryaFrame({ isBack: true, lLegY: 0,  rLegY: 0 }),
    bakeAryaFrame({ isBack: true, lLegY: -2, rLegY: 1, dy: -1 }),
    bakeAryaFrame({ isBack: true, lLegY: 0,  rLegY: 0 }),
    bakeAryaFrame({ isBack: true, lLegY: 1,  rLegY: -2, dy: -1 })
  ];

  ARYA_SHEET_CACHE.ready = true;
}

function drawPlayerSprite(c, px, py, dir, frame, time = 0, isInWater = false) {
  ensureAryaSpriteSheetBaked();

  const x = Math.round(px * 2) / 2;
  const y = Math.round(py * 2) / 2;

  // --------------------------------------------------------------------------
  // POKÉMON GO-STYLE HABITAT LURE RADAR UNDER ARYA'S FEET (LASTS 20 SECONDS)
  // --------------------------------------------------------------------------
  if (gameState.lureActiveTimer > 0) {
    c.save();
    // 2 Expanding Sonar Radar Waves
    for (let r = 0; r < 2; r++) {
      const waveProg = ((time * 0.85) + r * 0.5) % 1;
      const radX = 8 + waveProg * 42;
      const radY = radX * 0.46;
      const alpha = (1 - waveProg) * 0.75;
      c.strokeStyle = r === 0
        ? `rgba(52, 211, 153, ${alpha.toFixed(2)})`
        : `rgba(251, 191, 36, ${alpha.toFixed(2)})`;
      c.lineWidth = 1.6;
      c.beginPath();
      c.ellipse(x, y + 1, radX, radY, 0, 0, Math.PI * 2);
      c.stroke();
    }

    // Inner Radar Grid Ring + Rotating Radar Sweep Line beneath feet
    c.fillStyle = 'rgba(16, 185, 129, 0.14)';
    c.strokeStyle = 'rgba(110, 231, 183, 0.80)';
    c.lineWidth = 1.1;
    c.beginPath();
    c.ellipse(x, y + 1, 22, 10, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    const sweepAngle = time * 4.2;
    const sx = x + Math.cos(sweepAngle) * 22;
    const sy = (y + 1) + Math.sin(sweepAngle) * 10;
    c.strokeStyle = 'rgba(254, 240, 138, 0.95)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(x, y + 1);
    c.lineTo(sx, sy);
    c.stroke();
    c.restore();
  }

  const act = player.actionState;
  const isWalking = act === 'none' && player.walkTimer > 0;

  let frameCanvas = ARYA_SHEET_CACHE.idle[0];
  if (act === 'attack') {
    const prog = Math.max(0, Math.min(0.999, 1 - (player.actionTimer / 0.75)));
    const idx = Math.floor(prog * ARYA_SHEET_CACHE.attack.length);
    frameCanvas = ARYA_SHEET_CACHE.attack[idx];
  } else if (act === 'skill') {
    const prog = Math.max(0, Math.min(0.999, 1 - (player.actionTimer / 1.35)));
    const idx = Math.floor(prog * ARYA_SHEET_CACHE.skill.length);
    frameCanvas = ARYA_SHEET_CACHE.skill[idx];
  } else if (dir === 'up' && isWalking) {
    const idx = Math.floor(player.walkTimer * 1.4) % ARYA_SHEET_CACHE.back.length;
    frameCanvas = ARYA_SHEET_CACHE.back[idx];
  } else if (dir === 'up') {
    frameCanvas = ARYA_SHEET_CACHE.back[0];
  } else if (isWalking) {
    const idx = Math.floor(player.walkTimer * 1.45) % ARYA_SHEET_CACHE.walk.length;
    frameCanvas = ARYA_SHEET_CACHE.walk[idx];
  } else {
    const idleCycle = time % 6.2;
    let idleIdx = 0;
    if (idleCycle > 2.0 && idleCycle < 2.28) idleIdx = 1; // Blink
    else if (idleCycle > 3.5 && idleCycle < 4.5) idleIdx = 2; // Hand to brow/chin
    else if (idleCycle >= 4.5 && idleCycle < 5.4) idleIdx = 3; // Hand to brow + breath puff
    frameCanvas = ARYA_SHEET_CACHE.idle[idleIdx];
  }

  // 2.5D HD-2D Angled Ground Cast Shadow + Deep Contact Ambient Occlusion
  if (gameState.hd2d.shadows3d) {
    c.save();
    c.translate(x + 4, y + 1);
    c.transform(1, 0, -0.55, 0.36, 0, 0);
    c.fillStyle = 'rgba(8, 11, 18, 0.36)';
    c.beginPath();
    c.ellipse(0, -14, 9, 16, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  c.fillStyle = 'rgba(6, 9, 16, 0.62)';
  c.beginPath();
  c.ellipse(x, y + 1, 8.5, 3.4, 0, 0, Math.PI * 2);
  c.fill();

  // Draw Baked 64x64 High-Density Pixel-Art Frame of Arya
  const scale = 0.72; // Crisp HD-2D world proportion (~46x46 px sprite canvas)
  const drawW = frameCanvas.width * scale;
  const drawH = frameCanvas.height * scale;

  c.save();
  c.translate(x, y);
  // Baked frames face RIGHT natively (matching the Arya Sprite Sheet); flip horizontally when facing LEFT!
  if (dir === 'left') c.scale(-1, 1);
  c.imageSmoothingEnabled = false;
  c.drawImage(frameCanvas, -30 * scale, -56 * scale, drawW, drawH);
  c.restore();

  // Crisp animated water ripple rings around Arya's feet when stepping in water
  if (isInWater) {
    const r1 = 6.5 + ((time * 5) % 5);
    const r2 = 6.5 + (((time * 5) + 2.5) % 5);
    const a1 = Math.max(0.15, 0.85 - (r1 - 6.5) / 5);
    const a2 = Math.max(0.15, 0.85 - (r2 - 6.5) / 5);

    c.strokeStyle = `rgba(244, 249, 252, ${a1.toFixed(2)})`;
    c.lineWidth = 1.2;
    c.beginPath();
    c.ellipse(x, y, r1, r1 * 0.44, 0, 0, Math.PI * 2);
    c.stroke();

    c.strokeStyle = `rgba(125, 166, 194, ${a2.toFixed(2)})`;
    c.beginPath();
    c.ellipse(x, y, r2, r2 * 0.44, 0, 0, Math.PI * 2);
    c.stroke();
  }
}

function triggerAryaAction(type) {
  if (gameState.transitioning || battleState.active) return;
  player.actionState = type;
  player.actionTimer = type === 'skill' ? 1.35 : 0.75;
  player.targetX = null;
  player.targetY = null;
  playSound(type === 'skill' ? 'quest' : 'catch');

  // If Arya uses Skill Tame [Q] in the overworld near a spawned monster, immediately initiate the Battle Tame!
  if (type === 'skill') {
    for (const sp of activeWildSpawns) {
      if (Math.hypot(player.x - sp.x, player.y - sp.y) <= 75) {
        openWildSpawnEncounter(sp);
        return;
      }
    }
  }
}

// High-Density HD-2D Explorer Arka / Ranger Raka / Blacksmith Bram Sprite
function drawExplorerNPC(c, nx, ny, time, variant = 'explorer') {
  const x = Math.round(nx * 2) / 2;
  const y = Math.round(ny * 2) / 2;
  const bob = Math.sin(time * 2.6) > 0.55 ? -0.5 : 0;

  c.fillStyle = 'rgba(10, 14, 22, 0.45)';
  c.beginPath();
  c.ellipse(x, y + 1, 8, 3.3, 0, 0, Math.PI * 2);
  c.fill();

  c.save();
  c.translate(x, y + bob);
  const p = (hx, hy, hw, hh, col) => {
    c.fillStyle = col;
    c.fillRect(hx * 0.5, hy * 0.5, hw * 0.5, hh * 0.5);
  };

  const coatMain = variant === 'merchant' ? '#8c3b2b' : '#4e6e3e';
  const coatShade = variant === 'merchant' ? '#63261b' : '#364f2b';

  // Boots & Trousers
  p(-8, -14, 7, 14, '#120e1a');
  p(1,  -14, 7, 14, '#120e1a');
  p(-7, -13, 5, 8,  '#4a3525');
  p(2,  -13, 5, 8,  '#3b2a1d');
  p(-7, -5,  5, 4,  '#26170e');
  p(2,  -5,  5, 4,  '#26170e');

  // Coat, Explorer Vest & Belt
  p(-12, -31, 24, 18, '#120e1a');
  p(-11, -30, 22, 16, coatShade);
  p(-9,  -29, 18, 14, coatMain);
  p(-4,  -29, 8,  12, '#dfd0b2'); // Cream shirt
  p(-9,  -18, 18, 3,  '#3d2516'); // Belt
  p(-2,  -18, 4,  3,  '#eab308'); // Gold buckle

  // Arms
  p(-14, -28, 4, 11, '#120e1a');
  p(-13, -27, 3, 7,  coatMain);
  p(-13, -20, 3, 3,  '#f2c8a0');
  p(10,  -28, 4, 11, '#120e1a');
  p(10,  -27, 3, 7,  coatShade);
  p(10,  -20, 3, 3,  '#f2c8a0');

  // Head, Beard & Eyes
  p(-11, -47, 22, 17, '#120e1a');
  p(-9,  -45, 18, 13, '#f2c8a0');
  p(-7,  -41, 4,  4,  '#181520'); // Left eye
  p(3,   -41, 4,  4,  '#181520'); // Right eye
  p(-7,  -41, 2,  2,  '#ffffff');
  p(3,   -41, 2,  2,  '#ffffff');
  // Beard & mustache
  p(-8,  -35, 16, 4,  '#5e3d26');
  p(-5,  -36, 10, 2,  '#754d32');

  // Wide Sunlit Straw Hat (Matches reference photo!)
  p(-17, -47, 34, 5, '#120e1a');
  p(-16, -46, 32, 3, '#c79346'); // Hat brim
  p(-14, -47, 28, 2, '#ecc57a'); // Sunlit brim top
  p(-11, -55, 22, 9, '#120e1a');
  p(-10, -54, 20, 7, '#ecc57a'); // Hat crown
  p(-7,  -54, 14, 3, '#fae09e'); // Crown highlight
  p(-10, -49, 20, 3, variant === 'merchant' ? '#2563eb' : '#a84230'); // Hat ribbon

  c.restore();
}

// High-Density HD-2D Village Girl Liora & Flower Girl Mina Sprite
function drawVillageGirlNPC(c, nx, ny, time, variant = 'liora') {
  const x = Math.round(nx * 2) / 2;
  const y = Math.round(ny * 2) / 2;
  const bob = Math.cos(time * 2.8) > 0.55 ? -0.5 : 0;

  c.fillStyle = 'rgba(10, 14, 22, 0.44)';
  c.beginPath();
  c.ellipse(x, y + 1, 7.5, 3.1, 0, 0, Math.PI * 2);
  c.fill();

  c.save();
  c.translate(x, y + bob);
  const p = (hx, hy, hw, hh, col) => {
    c.fillStyle = col;
    c.fillRect(hx * 0.5, hy * 0.5, hw * 0.5, hh * 0.5);
  };

  const dressMain = variant === 'mina' ? '#3b7a57' : '#b04b3c';
  const dressShade = variant === 'mina' ? '#27543b' : '#873529';
  const hairMain = variant === 'mina' ? '#7c4728' : '#4a2c20';
  const hairLit = variant === 'mina' ? '#a6653f' : '#6e4534';

  // Boots
  p(-6, -8, 5, 8, '#120e1a');
  p(1,  -8, 5, 8, '#120e1a');
  p(-5, -7, 4, 6, '#4a2e21');
  p(1,  -7, 4, 6, '#382218');

  // Flowing Village Dress & White Apron
  p(-12, -30, 24, 23, '#120e1a');
  p(-11, -29, 22, 21, dressShade);
  p(-9,  -28, 18, 19, dressMain);
  // White pinafore apron & fold shading
  p(-6,  -26, 12, 17, '#f8fafc');
  p(-5,  -14, 10, 5,  '#cbd5e1');
  p(-7,  -30, 14, 3,  '#f8fafc'); // White puff collar

  // Arms
  p(-13, -27, 4, 11, '#120e1a');
  p(-12, -26, 3, 5,  '#f8fafc');
  p(-12, -21, 3, 4,  '#f7d4b2');
  p(9,   -27, 4, 11, '#120e1a');
  p(9,   -26, 3, 5,  '#f8fafc');
  p(9,   -21, 3, 4,  '#f7d4b2');

  // Head, Long Chestnut Hair & Ribbon
  p(-12, -50, 24, 21, '#120e1a');
  p(-11, -48, 22, 18, hairMain);
  // Side hair locks resting on shoulders
  p(-11, -34, 4, 9, hairMain);
  p(7,   -34, 4, 9, hairMain);
  // Face
  p(-8,  -44, 16, 12, '#f7d4b2');
  p(-7,  -41, 4,  5,  '#181520'); // Left eye
  p(3,   -41, 4,  5,  '#181520'); // Right eye
  p(-7,  -41, 2,  2,  '#ffffff');
  p(3,   -41, 2,  2,  '#ffffff');
  p(-8,  -36, 3,  2,  '#f29b88'); // Blush
  p(5,   -36, 3,  2,  '#f29b88');
  // Hair bangs & sunlit crown highlight
  p(-9,  -47, 18, 4,  hairMain);
  p(-7,  -48, 6,  3,  hairLit);
  p(2,   -48, 6,  3,  hairLit);
  // Hair Ribbon
  p(-6,  -51, 12, 3,  variant === 'mina' ? '#fde047' : '#f8fafc');

  c.restore();
}

// High-Density HD-2D Vulpy Fox Monstra Sprite
function drawVillageChicken(c, cx, cy, time, seed = 0) {
  const x = Math.round((cx + Math.sin(time * 1.4 + seed) * 7) * 2) / 2;
  const y = Math.round((cy + Math.cos(time * 1.1 + seed) * 3) * 2) / 2;
  const peck = Math.sin(time * 7 + seed * 3) > 0.65 ? 1 : 0;
  const flip = Math.cos(time * 1.4 + seed) < 0 ? -1 : 1;

  c.fillStyle = 'rgba(10, 14, 22, 0.35)';
  c.beginPath();
  c.ellipse(x, y + 1, 4, 1.8, 0, 0, Math.PI * 2);
  c.fill();

  c.save();
  c.translate(x, y);
  c.scale(flip, 1);
  c.fillStyle = '#18141e';
  c.fillRect(-5, -9, 10, 8);
  c.fillStyle = '#f8fafc';
  c.fillRect(-4, -8, 8, 6);
  c.fillStyle = '#e2e8f0';
  c.fillRect(-3, -5, 5, 3);
  c.fillStyle = '#ef4444';
  c.fillRect(1, -11 + peck, 3, 2); // Red comb
  c.fillStyle = '#f59e0b';
  c.fillRect(4, -7 + peck, 2, 2);  // Beak
  c.fillRect(-1, -1, 1, 2);
  c.fillRect(1, -1, 1, 2);
  c.restore();
}

function drawSpeechBubble(c, bx, by, time) {
  const floatY = Math.round(by - 32 + Math.sin(time * 3.5) * 1.6);
  const x = Math.floor(bx - 10);

  c.fillStyle = '#181824';
  c.fillRect(x - 1, floatY - 1, 20, 12);
  c.fillStyle = '#ffffff';
  c.fillRect(x, floatY, 18, 10);
  c.fillRect(x + 7, floatY + 10, 4, 2);
  c.fillRect(x + 8, floatY + 12, 2, 1);

  const activeDot = Math.floor(time * 3) % 3;
  for (let i = 0; i < 3; i++) {
    c.fillStyle = i === activeDot ? '#d97706' : '#334155';
    c.fillRect(x + 3 + i * 5, floatY + 4, 2, 2);
  }
}

