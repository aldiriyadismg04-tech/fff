// js/monsters.js — MONSTRA: WILDBOUND Modular Script

// ============================================================================
// TAHAP 1 - AQUAFLY (IKAN KEPALA ELANG) HD-2D SPRITE SHEET RENDERER
// Supports: IDLE, BERJALAN/BERENANG, MENYERANG (Crescent Slash), & SKILL (Whirlpool Vortex)
// ============================================================================
const AQUAFLY_SHEET_CACHE = {
  ready: false,
  idle: [],   // 4 frames (Row 1 of Sprite Sheet)
  swim: [],   // 5 frames (Row 2 of Sprite Sheet)
  attack: [], // 6 frames (Row 3 of Sprite Sheet)
  skill: []   // 6 frames (Row 4 of Sprite Sheet)
};

// High-density 88x64 pixel-art layer helper with automatic 1px dark outline & polygon/curve rasterization
function bakeAquaflyFrame(pose) {
  const fw = 88, fh = 64;
  const can = document.createElement('canvas');
  can.width = fw;
  can.height = fh;
  const ctx = can.getContext('2d');

  // If this is Skill Frame 4 (the full-sprite spiral whirlpool vortex), render the iconic pixel-art vortex!
  if (pose.fullWhirlpool) {
    const L = createPixelLayer(fw, fh);
    const cx = 44, cy = 33;
    for (let y = 2; y < fh - 2; y++) {
      for (let x = 6; x < fw - 6; x++) {
        const dx = x - cx, dy = y - cy;
        const r = Math.hypot(dx, dy);
        if (r > 28) continue;
        const ang = Math.atan2(dy, dx);
        const spiral = (ang * 2.0 + r * 0.36) % (Math.PI * 2);
        const normS = (spiral + Math.PI * 2) % (Math.PI * 2);
        if (r < 6) {
          L.set(x, y, r < 3 ? '#09152b' : '#172554');
        } else if (normS < 0.95) {
          L.set(x, y, r > 22 ? '#e0f2fe' : '#ffffff');
        } else if (normS < 2.2) {
          L.set(x, y, ((x + y) % 2 === 0) ? '#7dd3fc' : '#38bdf8');
        } else if (normS < 3.8) {
          L.set(x, y, ((x + y) % 2 === 0) ? '#2563eb' : '#1d4ed8');
        } else if (r < 21) {
          L.set(x, y, '#0f2952');
        }
      }
    }
    // Outer pixel foam splashes around the whirlpool
    const splashPts = [
      [18, 12], [28, 6], [58, 7], [70, 15], [74, 30], [68, 48],
      [54, 57], [30, 56], [16, 46], [12, 28], [22, 19], [64, 22]
    ];
    splashPts.forEach(([sx, sy], i) => {
      L.fillDisc(sx, sy, i % 2 === 0 ? 1.8 : 1.2, i % 3 === 0 ? '#ffffff' : '#bae6fd');
    });
    L.compositeTo(ctx);
    return can;
  }

  const ox = pose.dx || 0;
  const oy = pose.dy || 0;
  const tailY = pose.tailY || 0;
  const finY = pose.finY || 0;
  const archY = pose.archY || 0;
  const coil = pose.coil || 0; // U-coil for Skill Frame 0..2

  // --------------------------------------------------------------------------
  // LAYER 0: SKILL WATER AURA / SWIRLING RING BEHIND BODY (Skill frames 0..2)
  // --------------------------------------------------------------------------
  if (pose.waterAura) {
    const auraL = createPixelLayer(fw, fh);
    const cx = 42 + ox, cy = 33 + oy;
    if (pose.waterAura === 'wisps') {
      // Frame 1 of Skill row: rising cyan/blue water flame wisps around coiled Aquafly
      const wisps = [
        [20, 46, 18, 22], [27, 52, 24, 32], [58, 48, 62, 20],
        [65, 42, 67, 25], [38, 54, 35, 38], [49, 53, 53, 36]
      ];
      wisps.forEach(([x0, y0, x1, y1], i) => {
        auraL.strokeLine(x0, y0, x1, y1, 1.5, i % 2 === 0 ? '#38bdf8' : '#1d4ed8');
        auraL.strokeLine(x0, y0 - 2, (x0 + x1) / 2, (y0 + y1) / 2, 0.9, '#bae6fd');
      });
    } else if (pose.waterAura === 'ring1' || pose.waterAura === 'ring2') {
      // Frames 2 & 3 of Skill row: circular swirling water stream & foam droplets
      const rot = pose.waterAura === 'ring2' ? 1.2 : 0.3;
      for (let a = 0; a < 160; a++) {
        const ang = (a / 160) * Math.PI * 2;
        const rad = 23 + Math.sin(ang * 3 + rot) * 2.5;
        const px = cx + Math.cos(ang) * rad * 1.12;
        const py = cy + Math.sin(ang) * rad * 0.92;
        const wave = Math.sin(ang * 4 - rot * 2);
        if (wave > -0.55) {
          auraL.fillDisc(px, py, wave > 0.35 ? 2.2 : 1.5, wave > 0.5 ? '#ffffff' : (wave > 0.0 ? '#7dd3fc' : '#2563eb'));
        }
      }
      if (pose.waterAura === 'ring2') {
        for (let i = 0; i < 12; i++) {
          const ang = (i / 12) * Math.PI * 2 + rot;
          auraL.fillDisc(cx + Math.cos(ang) * 28, cy + Math.sin(ang) * 24, 1.4, i % 2 === 0 ? '#ffffff' : '#bae6fd');
        }
      }
    }
    auraL.compositeTo(ctx);
  }

  // --------------------------------------------------------------------------
  // LAYER 1: BACK PECTORAL FIN & DORSAL FIN (With 1px dark outline)
  // --------------------------------------------------------------------------
  const backFinL = createPixelLayer(fw, fh);
  // Swept dorsal fin on mid-back
  backFinL.fillPoly([
    [40 + ox, 27 + oy + archY],
    [55 + ox - coil * 6, 18 + oy + archY - coil * 5],
    [52 + ox - coil * 4, 26 + oy + archY],
    [57 + ox - coil * 5, 22 + oy + archY - coil * 3],
    [53 + ox - coil * 3, 30 + oy + archY]
  ], (x, y) => (y < 23 + oy + archY) ? '#60a5fa' : '#1d4ed8');

  // Rear/far pectoral fin visible beneath the white chest
  backFinL.fillPoly([
    [22 + ox, 39 + oy],
    [35 + ox, 51 + oy + finY * 0.7],
    [38 + ox, 48 + oy + finY * 0.7],
    [31 + ox, 39 + oy]
  ], (x, y) => ((x + y) % 2 === 0) ? '#1e40af' : '#2563eb');
  backFinL.strokeLine(23 + ox, 40 + oy, 35 + ox, 50 + oy + finY * 0.7, 0.8, '#93c5fd');

  // Small pelvic fin near tail base
  backFinL.fillPoly([
    [50 + ox - coil * 5, 39 + oy - coil * 3],
    [59 + ox - coil * 6, 46 + oy + tailY * 0.4 - coil * 5],
    [56 + ox - coil * 5, 37 + oy - coil * 3]
  ], '#2563eb');
  backFinL.applyOutline('#0b1120');
  backFinL.compositeTo(ctx);

  // --------------------------------------------------------------------------
  // LAYER 2: SLEEK BLUE FISH TORSO & LARGE FORKED CRESCENT TAIL FIN
  // --------------------------------------------------------------------------
  const bodyL = createPixelLayer(fw, fh);
  const tx = 65 + ox - coil * 14;
  const ty = 32 + oy + tailY - coil * 12;

  // Forked Crescent Caudal (Tail) Fin (Upper lobe & Lower lobe with fin rays)
  const upperTailPts = [
    [tx - 3, ty - 2],
    [tx + 6, ty - 13 - coil * 4],
    [tx + 17, ty - 19 - coil * 5],
    [tx + 14, ty - 9 - coil * 3],
    [tx + 7, ty - 1]
  ];
  const lowerTailPts = [
    [tx - 3, ty + 1],
    [tx + 7, ty - 1],
    [tx + 13, ty + 7 - coil * 2],
    [tx + 15, ty + 16 - coil * 4],
    [tx + 4, ty + 11 - coil * 2]
  ];
  const tailShader = (x, y) => {
    const dy = y - ty;
    const ray = Math.abs((x - tx - Math.abs(dy) * 0.45) % 3);
    if (x - tx < 4 && Math.abs(dy) < 5) return '#93c5fd';
    if (ray < 1.1) return '#60a5fa';
    return dy < 0 ? '#2563eb' : '#1d4ed8';
  };
  bodyL.fillPoly(upperTailPts, tailShader);
  bodyL.fillPoly(lowerTailPts, tailShader);

  // Curved Hydrodynamic Fish Torso (From behind chest ruff x=30 to tail peduncle tx)
  const spineSteps = 32;
  for (let i = 0; i <= spineSteps; i++) {
    const t = i / spineSteps;
    const sx = (30 + ox) * (1 - t) + tx * t;
    const curveArch = Math.sin(t * Math.PI) * (archY - 2.5 - coil * 4);
    const sy = (34 + oy) * (1 - t) + ty * t + curveArch;
    const radius = (1 - t) * 7.8 + t * 2.8;

    for (let dy = -Math.ceil(radius) - 1; dy <= Math.ceil(radius) + 1; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const px = Math.round(sx + dx);
        const py = Math.round(sy + dy);
        const normY = dy / Math.max(1, radius); // -1 at dorsal top, +1 at belly bottom
        if (Math.abs(normY) <= 1.0) {
          let col;
          // Dappled sky-blue scale spots along upper-mid flank (matches sprite sheet!)
          const isScaleSpot = normY > -0.55 && normY < 0.15 && ((px + py * 2) % 7 === 0 || (px * 3 + py) % 11 === 0);
          if (normY < -0.62) col = '#172554';
          else if (normY < -0.22) col = isScaleSpot ? '#60a5fa' : '#1d4ed8';
          else if (normY < 0.28) col = isScaleSpot ? '#93c5fd' : '#2563eb';
          else if (normY < 0.65) col = '#60a5fa';
          else col = '#dbeafe';
          bodyL.set(px, py, col);
        }
      }
    }
  }
  bodyL.applyOutline('#0b1120');
  bodyL.compositeTo(ctx);

  // --------------------------------------------------------------------------
  // LAYER 3: FRONT SCYTHE / WING-LIKE PECTORAL FIN (With fin rays & bright leading edge)
  // --------------------------------------------------------------------------
  const frontFinL = createPixelLayer(fw, fh);
  const fx0 = 30 + ox, fy0 = 36 + oy;
  const fxTip = 49 + ox, fyTip = 53 + oy + finY;
  frontFinL.fillPoly([
    [fx0 - 2, fy0],
    [fx0 + 5, fy0 + 9 + finY * 0.5],
    [fxTip - 3, fyTip],
    [fxTip + 2, fyTip - 3],
    [fx0 + 14, fy0 + 5 + finY * 0.4],
    [fx0 + 5, fy0 - 1]
  ], (x, y) => {
    const dLead = (x - fx0) * 0.65 - (y - fy0);
    if (dLead < -2.5) return '#e0f2fe'; // Bright ice-white leading fin edge
    if (dLead < 0.5) return '#7dd3fc';
    const ray = (x + y) % 3;
    return ray === 0 ? '#60a5fa' : (ray === 1 ? '#2563eb' : '#1e40af');
  });
  frontFinL.applyOutline('#0b1120');
  frontFinL.compositeTo(ctx);

  // --------------------------------------------------------------------------
  // LAYER 4: SNOW-WHITE EAGLE HEAD, FLUFFY CHEST RUFF & JAGGED MANE TUFTS
  // --------------------------------------------------------------------------
  const headL = createPixelLayer(fw, fh);
  // Main white feathered head & proud eagle chest with 5 spiky rear feather tufts overlapping the blue torso
  const manePoly = [
    [16 + ox, 25 + oy],
    [21 + ox, 19 + oy],
    [32 + ox, 20 + oy],
    [41 + ox, 25 + oy], // Rear feather spike 1
    [35 + ox, 28 + oy],
    [44 + ox, 30 + oy], // Rear feather spike 2
    [36 + ox, 33 + oy],
    [42 + ox, 36 + oy], // Rear feather spike 3
    [34 + ox, 37 + oy],
    [39 + ox, 41 + oy], // Rear feather spike 4
    [29 + ox, 40 + oy],
    [32 + ox, 44 + oy], // Lower chest feather spike 5
    [22 + ox, 42 + oy],
    [17 + ox, 37 + oy],
    [16 + ox, 31 + oy]
  ];
  headL.fillPoly(manePoly, (x, y) => {
    const rx = x - ox, ry = y - oy;
    // Cel-shaded feather shadows under the neck ruff and lower chest
    if (ry > 38 || (rx > 34 && (ry === 28 || ry === 33 || ry === 37))) return '#94a3b8';
    if (ry > 34 && (rx + ry) % 2 === 0) return '#cbd5e1';
    if (rx > 31 && ry > 26 && (rx + ry) % 3 === 0) return '#e2e8f0';
    return '#ffffff';
  });
  headL.applyOutline('#0b1120');
  headL.compositeTo(ctx);

  // --------------------------------------------------------------------------
  // LAYER 5: 3 ICONIC ICE-BLUE & WHITE CROWN CREST SPIKES (Sweeping Up-Right)
  // --------------------------------------------------------------------------
  const crestL = createPixelLayer(fw, fh);
  const spikes = [
    // Spike 1: Front/Top Crest Feather
    [
      [19 + ox, 22 + oy],
      [23 + ox, 14 + oy],
      [32 + ox, 9 + oy],
      [29 + ox, 18 + oy],
      [23 + ox, 23 + oy]
    ],
    // Spike 2: Center Longest Crest Feather
    [
      [24 + ox, 22 + oy],
      [31 + ox, 13 + oy],
      [43 + ox, 10 + oy],
      [37 + ox, 20 + oy],
      [28 + ox, 24 + oy]
    ],
    // Spike 3: Rear/Side Swept Crest Feather
    [
      [28 + ox, 24 + oy],
      [37 + ox, 18 + oy],
      [47 + ox, 16 + oy],
      [41 + ox, 23 + oy],
      [31 + ox, 26 + oy]
    ]
  ];
  spikes.forEach((pts, sIdx) => {
    crestL.fillPoly(pts, (x, y) => {
      const rx = x - ox, ry = y - oy;
      // Gradient along each feather: white inner base -> sky blue -> cobalt tip
      const distBase = (rx - (21 + sIdx * 4)) * 0.7 - (ry - 23) * 0.8;
      if (distBase < 5) return '#ffffff';
      if (distBase < 8) return '#bae6fd';
      if (distBase < 12) return '#60a5fa';
      if (distBase < 16) return '#3b82f6';
      return '#1d4ed8';
    });
  });
  crestL.applyOutline('#0b1120');
  crestL.compositeTo(ctx);

  // --------------------------------------------------------------------------
  // LAYER 6: FIERCE GOLDEN EAGLE EYE, ANGRY BROW & HOOKED GOLDEN BEAK
  // --------------------------------------------------------------------------
  const faceL = createPixelLayer(fw, fh);
  const openJaw = pose.openBeak ? 3 : 0;

  // Upper Hooked Golden Eagle Beak (curves down to a sharp raptor hook at x=9, y=34)
  faceL.fillPoly([
    [18 + ox, 25 + oy],
    [12 + ox, 27 + oy],
    [9 + ox,  31 + oy],
    [9 + ox,  35 + oy], // Sharp downward hook tip!
    [12 + ox, 33 + oy],
    [18 + ox, 31 + oy]
  ], (x, y) => {
    const ry = y - oy;
    if (ry <= 27) return '#fef08a'; // Bright sunlit top beak ridge
    if (ry <= 30) return '#fbbf24'; // Rich golden yellow
    return '#d97706';               // Amber hook & lower edge shadow
  });

  // Lower Beak Mandible (drops down when screeching/attacking in Row 3 Frame 4!)
  faceL.fillPoly([
    [13 + ox, 31 + oy],
    [19 + ox, 31 + oy],
    [18 + ox, 34 + oy + openJaw],
    [12 + ox, 33 + oy + openJaw]
  ], (x, y) => (y - oy > 32 + openJaw * 0.5) ? '#b45309' : '#f59e0b');

  faceL.applyOutline('#0b1120');

  // Dark nostril & mouth line detail
  faceL.set(13 + ox, 29 + oy, '#78350f');
  if (openJaw > 0) {
    faceL.strokeLine(13 + ox, 32 + oy, 17 + ox, 32 + oy + 1, 0.8, '#451a03');
  }

  // Fierce Golden-Amber Eagle Eye & Slanted Dark Brow
  const ex = 21 + ox, ey = 27 + oy;
  faceL.fillPoly([
    [ex - 2, ey - 1], [ex + 3, ey - 2], [ex + 3, ey + 2], [ex - 2, ey + 2]
  ], '#fbbf24');
  faceL.fillDisc(ex, ey, 1.1, '#0f172a'); // Dark pupil
  faceL.set(ex - 1, ey - 1, '#ffffff');   // Crisp eye catchlight
  // Angry slanted eagle brow ridge above eye
  faceL.strokeLine(ex - 3, ey - 1, ex + 4, ey - 3, 0.9, '#0b1120');
  faceL.strokeLine(ex - 2, ey - 2, ex + 4, ey - 4, 0.7, '#e2e8f0');

  faceL.compositeTo(ctx);

  // --------------------------------------------------------------------------
  // LAYER 7: FOREGROUND ACTION FX (Crescent Slash Wave & Star Sparkles)
  // --------------------------------------------------------------------------
  if (pose.slashArc) {
    // Row 3 Attack Frames 4 & 5: Sweeping white & sky-blue crescent slash wave under the head/wing!
    const fxL = createPixelLayer(fw, fh);
    const isBig = pose.slashArc === 'large';
    const arcCx = 28 + ox, arcCy = 32 + oy;
    const rOuter = isBig ? 24 : 18;
    const thickness = isBig ? 6.5 : 4.2;

    for (let y = 10; y < fh - 2; y++) {
      for (let x = 2; x < 58; x++) {
        const dx = (x - arcCx) * 0.92;
        const dy = (y - arcCy) * 1.15;
        const r = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx);
        // Crescent sweep from front-left beak (ang ≈ 2.6) down underneath belly (ang ≈ 0.5)
        if (ang > 0.35 && ang < 2.85) {
          const taper = Math.sin(((ang - 0.35) / 2.5) * Math.PI);
          const localThick = thickness * taper;
          if (r >= rOuter - localThick && r <= rOuter) {
            const edgeDist = rOuter - r;
            if (edgeDist < 1.8) fxL.set(x, y, '#ffffff');
            else if (edgeDist < localThick * 0.65) fxL.set(x, y, '#e0f2fe');
            else fxL.set(x, y, '#38bdf8');
          }
        }
      }
    }
    fxL.compositeTo(ctx);
  }

  if (pose.sparkles) {
    // Row 4 Skill Frames 4 & 6: Twinkling 4-point pixel stars & cyan water glints!
    const spL = createPixelLayer(fw, fh);
    const starList = pose.sparkles === 'neck'
      ? [[22, 16, 3], [35, 22, 4], [18, 38, 3], [44, 34, 2]]
      : [
          [12, 14, 3], [26, 8, 2], [48, 9, 3], [68, 14, 3],
          [10, 38, 2], [22, 52, 3], [44, 54, 2], [64, 49, 3], [77, 32, 2]
        ];
    starList.forEach(([sx, sy, sz], idx) => {
      const col = idx % 2 === 0 ? '#ffffff' : '#7dd3fc';
      for (let d = -sz; d <= sz; d++) {
        spL.set(sx + d, sy, col);
        spL.set(sx, sy + d, col);
      }
      spL.set(sx, sy, '#ffffff');
    });
    spL.compositeTo(ctx);
  }

  return can;
}

function ensureAquaflySpriteSheetBaked() {
  if (AQUAFLY_SHEET_CACHE.ready) return;

  // Row 1: IDLE (4 frames)
  const idlePoses = [
    { dx: 0, dy: 0,  tailY: 0,  finY: 0,  archY: 0 },
    { dx: 0, dy: -1, tailY: -2, finY: 2,  archY: -1 },
    { dx: 0, dy: 0,  tailY: 1,  finY: 3,  archY: 0 },
    { dx: 0, dy: 1,  tailY: 2,  finY: -1, archY: 1 }
  ];
  AQUAFLY_SHEET_CACHE.idle = idlePoses.map(bakeAquaflyFrame);

  // Row 2: BERJALAN / BERGERAK (5 frames sinusoidal swimming wave)
  const swimPoses = [
    { dx: 0,  dy: 0,  tailY: -3, finY: -2, archY: -2 },
    { dx: -1, dy: -1, tailY: 0,  finY: 1,  archY: -1 },
    { dx: -1, dy: 0,  tailY: 3,  finY: 4,  archY: 1 },
    { dx: 0,  dy: 1,  tailY: 2,  finY: 1,  archY: 2 },
    { dx: 0,  dy: 0,  tailY: -2, finY: -2, archY: 0 }
  ];
  AQUAFLY_SHEET_CACHE.swim = swimPoses.map(bakeAquaflyFrame);

  // Row 3: MENYERANG (6 frames from Sprite Sheet)
  const attackPoses = [
    { dx: 0,  dy: 0,  tailY: 0,  finY: 0,  archY: 0 },
    { dx: 3,  dy: 1,  tailY: -3, finY: -2, archY: 2 },
    { dx: 1,  dy: 0,  tailY: 2,  finY: 2,  archY: -1 },
    { dx: -4, dy: -2, tailY: 4,  finY: -3, archY: -4, openBeak: true, slashArc: 'small' },
    { dx: -5, dy: -1, tailY: 2,  finY: -2, archY: -3, openBeak: false, slashArc: 'large' },
    { dx: 0,  dy: 0,  tailY: 0,  finY: 0,  archY: 0 }
  ];
  AQUAFLY_SHEET_CACHE.attack = attackPoses.map(bakeAquaflyFrame);

  // Row 4: MENGELUARKAN SKILL (6 frames from Sprite Sheet)
  const skillPoses = [
    { dx: 3,  dy: 2,  tailY: -8, finY: 2,  archY: 5,  coil: 0.85, waterAura: 'wisps' },
    { dx: 2,  dy: 2,  tailY: -6, finY: 3,  archY: 4,  coil: 0.70, waterAura: 'ring1' },
    { dx: 1,  dy: 1,  tailY: -5, finY: 2,  archY: 3,  coil: 0.55, waterAura: 'ring2' },
    { dx: -2, dy: -1, tailY: 1,  finY: -1, archY: -1, sparkles: 'neck' },
    { fullWhirlpool: true },
    { dx: 0,  dy: 0,  tailY: 0,  finY: 0,  archY: 0,  sparkles: 'full' }
  ];
  AQUAFLY_SHEET_CACHE.skill = skillPoses.map(bakeAquaflyFrame);

  AQUAFLY_SHEET_CACHE.ready = true;
}

function drawAquaflyMonstra(c, aq, time, customScale = 0.54) {
  ensureAquaflySpriteSheetBaked();

  const x = Math.round(aq.x * 2) / 2;
  const y = Math.round(aq.y * 2) / 2;
  const t = time + (aq.phase || 0);
  const state = aq.state || 'idle';
  const bob = Math.sin(t * 3.8) * 1.4;

  // Select the exact baked frame from the 4 rows of the Sprite Sheet
  let frames = AQUAFLY_SHEET_CACHE.idle;
  let frameIdx = Math.floor(t * 5) % frames.length;

  if (state === 'swim') {
    frames = AQUAFLY_SHEET_CACHE.swim;
    frameIdx = Math.floor(t * 7.5) % frames.length;
  } else if (state === 'attack') {
    frames = AQUAFLY_SHEET_CACHE.attack;
    frameIdx = Math.floor(t * 8.0) % frames.length;
  } else if (state === 'skill') {
    frames = AQUAFLY_SHEET_CACHE.skill;
    frameIdx = Math.floor(t * 6.0) % frames.length;
  }
  const frameCanvas = frames[frameIdx] || frames[0];

  // Water surface shadow & lagoon ripple ring beneath Aquafly
  if (!aq.noShadow) {
    c.fillStyle = 'rgba(12, 28, 48, 0.42)';
    c.beginPath();
    c.ellipse(x, y + 3, 12 * (customScale / 0.54), 4.2 * (customScale / 0.54), 0, 0, Math.PI * 2);
    c.fill();

    const ripR = (10 + ((t * 4.5) % 5)) * (customScale / 0.54);
    c.strokeStyle = `rgba(224, 242, 254, ${(0.72 - ((t * 4.5) % 5) / 7).toFixed(2)})`;
    c.lineWidth = 1.1;
    c.beginPath();
    c.ellipse(x, y + 2, ripR, ripR * 0.42, 0, 0, Math.PI * 2);
    c.stroke();
  }

  const drawW = frameCanvas.width * customScale;
  const drawH = frameCanvas.height * customScale;

  c.save();
  c.translate(x, y - 4 + bob);
  // Baked frames face LEFT natively (like Row 1 of the sheet); flip horizontally when facing RIGHT!
  if (aq.dir === 'right') c.scale(-1, 1);
  c.imageSmoothingEnabled = false;
  c.drawImage(frameCanvas, -drawW * 0.5, -drawH * 0.58, drawW, drawH);
  c.restore();
}

// ============================================================================
// TAHAP 1 - TIRTA (ROH AIR KECIL) HD-2D SPRITE SHEET RENDERER (76x60 px)
// Supports: IDLE (5), BERJALAN (6), MENYERANG - Hantaman Pasang (5), SKILL - Perisai Samudra (5)
// ============================================================================
const TIRTA_SHEET_CACHE = {
  ready: false,
  idle: [],   // 5 frames (Row 1 of Tirta Sprite Sheet)
  walk: [],   // 6 frames (Row 2 of Tirta Sprite Sheet)
  attack: [], // 5 frames (Row 3 of Tirta Sprite Sheet)
  skill: []   // 5 frames (Row 4 of Tirta Sprite Sheet)
};

function bakeTirtaFrame(pose) {
  const fw = 76, fh = 60;
  const can = document.createElement('canvas');
  can.width = fw;
  can.height = fh;
  const ctx = can.getContext('2d');

  const ox = pose.dx || 0;
  const oy = pose.dy || 0;
  const cx = 32 + ox;
  const by = 48 + oy;

  // LAYER 0: SKILL WATER AURA / GLOW BEHIND TIRTA (Row 4 Frames 1 & 2)
  if (pose.aura) {
    const isBright = pose.aura === 'bright';
    const grad = ctx.createRadialGradient(cx, by - 14, 3, cx, by - 14, isBright ? 24 : 18);
    grad.addColorStop(0, isBright ? 'rgba(165, 243, 252, 0.85)' : 'rgba(56, 189, 248, 0.50)');
    grad.addColorStop(0.55, isBright ? 'rgba(34, 211, 238, 0.45)' : 'rgba(14, 165, 233, 0.22)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, by - 14, isBright ? 24 : 18, 0, Math.PI * 2);
    ctx.fill();
  }

  // LAYER 1: TWIN-FLUKE CETACEAN / WHALE TAIL & FAR LEGS
  const backL = createPixelLayer(fw, fh);
  const tailSwing = pose.tailY || 0;
  const tx = cx - 13;
  const ty = by - 12 + tailSwing;

  // Raised curved tail stock
  backL.strokeLine(cx - 7, by - 7, tx + 2, ty + 3, 3.0, '#3b82f6');
  backL.strokeLine(cx - 7, by - 8, tx + 2, ty + 2, 1.8, '#60a5fa');
  // Twin whale flukes at top of tail
  backL.fillPoly([
    [tx + 2, ty + 2], [tx - 5, ty - 5], [tx - 2, ty - 9], [tx + 2, ty - 3]
  ], '#3b82f6');
  backL.fillPoly([
    [tx + 2, ty + 2], [tx + 8, ty - 6], [tx + 5, ty - 10], [tx + 2, ty - 3]
  ], '#60a5fa');
  backL.set(tx - 2, ty - 6, '#bae6fd');
  backL.set(tx + 5, ty - 7, '#bae6fd');

  // Far-side hind & front legs (darker sky-cobalt shade)
  const bHindX = cx - 4 + (pose.bHindX || 0);
  const bHindY = by + (pose.bHindY || 0);
  const bFrontX = cx + 7 + (pose.bFrontX || 0);
  const bFrontY = by + (pose.bFrontY || 0);
  backL.strokeLine(cx - 4, by - 7, bHindX, bHindY - 1, 2.2, '#2563eb');
  backL.strokeLine(cx + 6, by - 8, bFrontX, bFrontY - 1, 2.2, '#2563eb');
  backL.applyOutline('#0c1938');
  backL.compositeTo(ctx);

  // LAYER 2: SLEEK SKY-BLUE QUADRUPED BODY, CREAM-BLUE CHEST & NEAR LEGS
  const bodyL = createPixelLayer(fw, fh);
  const fHindX = cx - 6 + (pose.fHindX || 0);
  const fHindY = by + (pose.fHindY || 0);
  const fFrontX = cx + 4 + (pose.fFrontX || 0);
  const fFrontY = by + (pose.fFrontY || 0);

  // Plump rounded water-spirit torso
  for (let y = by - 14; y <= by - 3; y++) {
    for (let x = cx - 9; x <= cx + 8; x++) {
      const nx = (x - (cx - 0.5)) / 8.8;
      const ny = (y - (by - 8.5)) / 5.8;
      if (nx * nx + ny * ny <= 1.0) {
        // Pale ice-blue chest & belly on the front-right
        if (x >= cx + 2 && y >= by - 12) {
          bodyL.set(x, y, x >= cx + 5 ? '#f0f9ff' : '#bae6fd');
        } else if (ny > 0.45) {
          bodyL.set(x, y, '#3b82f6');
        } else {
          bodyL.set(x, y, '#60a5fa');
        }
      }
    }
  }
  // Signature dark-cobalt dappled spots on back & hip (matching Tirta Sprite Sheet!)
  bodyL.fillDisc(cx - 4, by - 10, 1.5, '#1d4ed8');
  bodyL.fillDisc(cx - 1, by - 11, 1.2, '#1d4ed8');
  bodyL.fillDisc(cx - 6, by - 8,  1.2, '#1e40af');

  // Near-side hind & front legs with cute rounded paws
  bodyL.strokeLine(cx - 6, by - 6, fHindX, fHindY - 1, 2.5, '#60a5fa');
  bodyL.fillDisc(fHindX + 1, fHindY - 1, 2.0, '#93c5fd');
  bodyL.strokeLine(cx + 4, by - 7, fFrontX, fFrontY - 1, 2.4, '#60a5fa');
  bodyL.fillDisc(fFrontX + 1, fFrontY - 1, 2.0, '#93c5fd');

  bodyL.applyOutline('#0c1938');
  bodyL.compositeTo(ctx);

  // LAYER 3: ROUND WATER-SPIRIT HEAD, EAR-FINS & BIG GLOSSY EYES
  const headL = createPixelLayer(fw, fh);
  const hx = cx + 5 + (pose.headX || 0);
  const hy = by - 17 + (pose.headY || 0);

  // Left & Right Fan-like Ear Fins
  headL.fillPoly([
    [hx - 5, hy - 1], [hx - 11, hy - 5], [hx - 10, hy - 1], [hx - 11, hy + 2], [hx - 5, hy + 2]
  ], (x, y) => y < hy - 1 ? '#60a5fa' : '#2563eb');
  headL.fillPoly([
    [hx + 6, hy - 2], [hx + 10, hy - 5], [hx + 9, hy], [hx + 6, hy + 1]
  ], '#3b82f6');

  // Smooth round baby dragon/otter head
  for (let y = hy - 7; y <= hy + 5; y++) {
    for (let x = hx - 6; x <= hx + 8; x++) {
      const nx = (x - (hx + 0.8)) / 7.2;
      const ny = (y - (hy - 1.0)) / 6.2;
      if (nx * nx + ny * ny <= 1.0) {
        if (ny < -0.45 && nx < 0.3) headL.set(x, y, '#93c5fd'); // Top head highlight
        else if (ny > 0.35 && nx > 0.1) headL.set(x, y, '#e0f2fe'); // Lower cheek/chin
        else headL.set(x, y, '#60a5fa');
      }
    }
  }
  headL.applyOutline('#0c1938');

  // Cute Eyes & Mouth Expressions (Blink, Happy Wink, Open-Mouth Hydro Blast, or Big Glossy Eyes)
  if (pose.eye === 'blink') {
    headL.strokeLine(hx - 1, hy - 1, hx + 2, hy - 1, 0.7, '#0f172a');
    headL.strokeLine(hx + 5, hy - 1, hx + 7, hy - 1, 0.7, '#0f172a');
  } else if (pose.eye === 'happy') {
    headL.set(hx - 1, hy - 1, '#0f172a'); headL.set(hx, hy - 2, '#0f172a'); headL.set(hx + 1, hy - 1, '#0f172a');
    headL.set(hx + 5, hy - 1, '#0f172a'); headL.set(hx + 6, hy - 2, '#0f172a'); headL.set(hx + 7, hy - 1, '#0f172a');
  } else {
    // Big dark-navy glossy eye (left/near) & far eye
    headL.fillDisc(hx, hy - 1, 2.2, '#0f172a');
    headL.set(hx - 1, hy - 2, '#ffffff');
    headL.set(hx + 1, hy, '#38bdf8');
    headL.fillDisc(hx + 6, hy - 1, 1.5, '#0f172a');
    headL.set(hx + 6, hy - 2, '#ffffff');
  }

  // Mouth (Open coral-pink mouth when yawning or blasting water in Row 3!)
  if (pose.mouth === 'open' || pose.mouth === 'yawn') {
    const mw = pose.mouth === 'open' ? 2.2 : 1.4;
    headL.fillDisc(hx + 5, hy + 2, mw, '#991b1b');
    headL.fillDisc(hx + 5, hy + 3, mw * 0.7, '#f43f5e');
  } else {
    headL.strokeLine(hx + 3, hy + 2, hx + 6, hy + 2, 0.5, '#0f172a');
  }

  headL.compositeTo(ctx);

  // LAYER 4: FOREGROUND WATER FX (Droplets, Foot Splashes, Hydro Jet, Water Orb, Ocean Vortex Shield)
  const fxL = createPixelLayer(fw, fh);
  if (pose.droplets) {
    const pts = [[hx - 8, hy - 9], [hx + 2, hy - 11], [hx + 11, hy + 1], [cx - 14, by - 18]];
    pts.forEach(([px, py], i) => {
      if ((i + (pose.dropSeed || 0)) % 2 === 0) {
        fxL.fillDisc(px, py, 1.3, '#bae6fd');
        fxL.set(px, py, '#ffffff');
      }
    });
  }
  if (pose.walkSplash) {
    fxL.fillDisc(fHindX - 3, by, 1.2, '#e0f2fe');
    fxL.fillDisc(fFrontX + 3, by, 1.2, '#bae6fd');
  }
  if (pose.attackFx === 'jet') {
    // Row 3 Frame 3: High-pressure roaring hydro jet stream + ground ripple!
    const jx = hx + 7, jy = hy + 2;
    for (let x = jx; x <= jx + 24; x++) {
      const prog = (x - jx) / 24;
      const spread = 1.5 + prog * 7.5;
      for (let y = Math.floor(jy - spread); y <= Math.ceil(jy + spread); y++) {
        const dy = Math.abs(y - jy) / spread;
        if (dy <= 1.0) {
          fxL.set(x, y, dy < 0.4 ? '#ffffff' : (dy < 0.75 ? '#bae6fd' : '#38bdf8'));
        }
      }
    }
    // Ground water rings beneath jet
    for (let rx = -9; rx <= 9; rx++) {
      fxL.set(jx + 16 + rx, by + 3, '#7dd3fc');
      if (Math.abs(rx) < 6) fxL.set(jx + 16 + rx, by + 5, '#ffffff');
    }
  } else if (pose.attackFx === 'orb1' || pose.attackFx === 'orb2') {
    // Row 3 Frames 4 & 5: Pressurized water stream into large spherical water bomb!
    const jx = hx + 7, jy = hy + 2;
    const isBig = pose.attackFx === 'orb2';
    const orbX = jx + (isBig ? 18 : 14);
    const orbR = isBig ? 7.5 : 5.2;
    fxL.strokeLine(jx, jy, orbX - orbR + 2, jy, 2.0, '#bae6fd');
    fxL.strokeLine(jx, jy, orbX - orbR + 2, jy, 1.0, '#ffffff');
    fxL.fillDisc(orbX, jy, orbR, '#38bdf8');
    fxL.fillDisc(orbX - 1, jy - 1, orbR * 0.72, '#bae6fd');
    fxL.fillDisc(orbX - 2, jy - 2, orbR * 0.42, '#ffffff');
    // Concentric ripple rings on floor
    for (let a = 0; a < 40; a++) {
      const ang = (a / 40) * Math.PI * 2;
      fxL.set(cx + 6 + Math.cos(ang) * 16, by + 2 + Math.sin(ang) * 3.5, '#7dd3fc');
      fxL.set(cx + 6 + Math.cos(ang) * 10, by + 2 + Math.sin(ang) * 2.2, '#ffffff');
    }
  } else if (pose.skillFx === 'bubbles') {
    // Row 4 Frame 3: Floating crystal water bubbles & sparkles around Tirta
    const bubs = [[cx - 14, by - 22, 3.2], [cx + 16, by - 25, 2.8], [cx + 20, by - 10, 3.4], [cx - 17, by - 8, 2.5], [cx, by - 29, 2.2]];
    bubs.forEach(([bx, by0, br]) => {
      fxL.fillDisc(bx, by0, br, '#38bdf8');
      fxL.fillDisc(bx, by0, br - 1, '#bae6fd');
      fxL.set(bx - 1, by0 - 1, '#ffffff');
    });
  } else if (pose.skillFx === 'swirl' || pose.skillFx === 'vortex') {
    // Row 4 Frames 4 & 5: Swirling Perisai Samudra (Ocean Vortex Shield) wrapping around Tirta!
    const fullVortex = pose.skillFx === 'vortex';
    const rings = fullVortex ? [-22, -15, -8, -2] : [-20, -10];
    rings.forEach((ryOff, rIdx) => {
      const rxSpan = 21 - rIdx * 2;
      for (let a = 0; a < 90; a++) {
        const ang = (a / 90) * Math.PI * 2;
        if (!fullVortex && Math.sin(ang * 2 + rIdx) < -0.2) continue;
        const px = cx + 1 + Math.cos(ang) * rxSpan;
        const py = by + ryOff + Math.sin(ang) * 4.8;
        fxL.fillDisc(px, py, Math.sin(ang) > 0 ? 1.8 : 1.1, Math.sin(ang) > 0.2 ? '#ffffff' : (rIdx % 2 === 0 ? '#7dd3fc' : '#2563eb'));
      }
    });
  }
  fxL.compositeTo(ctx);

  return can;
}

function ensureTirtaSpriteSheetBaked() {
  if (TIRTA_SHEET_CACHE.ready) return;

  // Row 1: IDLE (5 frames from Tirta Sprite Sheet)
  TIRTA_SHEET_CACHE.idle = [
    bakeTirtaFrame({ tailY: 0, droplets: true, dropSeed: 0 }),
    bakeTirtaFrame({ tailY: -1, mouth: 'yawn', droplets: true, dropSeed: 1 }),
    bakeTirtaFrame({ tailY: 0, eye: 'blink', droplets: true, dropSeed: 2 }),
    bakeTirtaFrame({ tailY: 1, eye: 'happy', droplets: true, dropSeed: 3 }),
    bakeTirtaFrame({ tailY: 0, droplets: true, dropSeed: 4 })
  ];

  // Row 2: BERJALAN / BERGERAK (6 frames quadruped trot with water splashes)
  TIRTA_SHEET_CACHE.walk = [
    bakeTirtaFrame({ dy: 0,  fFrontX: 2,  fHindX: -2, bFrontX: -2, bHindX: 2,  tailY: -1, walkSplash: true }),
    bakeTirtaFrame({ dy: -1, fFrontX: 4,  fFrontY: -2, fHindX: -3, bFrontX: -3, bHindX: 3, tailY: -2, walkSplash: true }),
    bakeTirtaFrame({ dy: -1, fFrontX: 2,  fHindX: 1,  fHindY: -2, bFrontX: 1,  bHindX: -2, tailY: 0,  walkSplash: true }),
    bakeTirtaFrame({ dy: 0,  fFrontX: -2, fHindX: 3,  bFrontX: 3,  bFrontY: -2, bHindX: -3, tailY: 1, walkSplash: true }),
    bakeTirtaFrame({ dy: -1, fFrontX: -1, fHindX: 0,  bFrontX: 2,  bHindX: -1, tailY: 0,  walkSplash: true }),
    bakeTirtaFrame({ dy: 0,  fFrontX: 1,  fHindX: -1, bFrontX: -1, bHindX: 1,  tailY: -1 })
  ];

  // Row 3: MENYERANG — Hantaman Pasang (5 frames)
  TIRTA_SHEET_CACHE.attack = [
    bakeTirtaFrame({ dx: -1, dy: 0,  tailY: 1 }),
    bakeTirtaFrame({ dx: -2, dy: 1,  headX: 1, mouth: 'open', tailY: -1 }),
    bakeTirtaFrame({ dx: 1,  dy: -1, headX: 2, fFrontY: -2, mouth: 'open', attackFx: 'jet', tailY: -2 }),
    bakeTirtaFrame({ dx: 2,  dy: -2, headX: 2, fFrontY: -3, bFrontY: -2, mouth: 'open', attackFx: 'orb1', tailY: -2 }),
    bakeTirtaFrame({ dx: 2,  dy: -1, headX: 2, fFrontY: -2, mouth: 'open', attackFx: 'orb2', tailY: -1 })
  ];

  // Row 4: MENGELUARKAN SKILL — Aliran Penyembuh / Perisai Samudra (5 frames)
  TIRTA_SHEET_CACHE.skill = [
    bakeTirtaFrame({ aura: 'soft', tailY: 0 }),
    bakeTirtaFrame({ aura: 'bright', eye: 'happy', tailY: -1 }),
    bakeTirtaFrame({ skillFx: 'bubbles', tailY: 0 }),
    bakeTirtaFrame({ skillFx: 'swirl', eye: 'happy', tailY: -1 }),
    bakeTirtaFrame({ skillFx: 'vortex', eye: 'happy', tailY: 0 })
  ];

  TIRTA_SHEET_CACHE.ready = true;
}

function drawTirtaMonstra(c, tr, time, customScale = 0.64) {
  ensureTirtaSpriteSheetBaked();

  const x = Math.round(tr.x * 2) / 2;
  const y = Math.round(tr.y * 2) / 2;
  const t = time + (tr.phase || 0);
  const state = tr.state || 'idle';

  let frames = TIRTA_SHEET_CACHE.idle;
  let frameIdx = Math.floor(t * 4.5) % frames.length;
  if (state === 'walk') {
    frames = TIRTA_SHEET_CACHE.walk;
    frameIdx = Math.floor(t * 7.5) % frames.length;
  } else if (state === 'attack') {
    frames = TIRTA_SHEET_CACHE.attack;
    frameIdx = Math.floor(t * 6.5) % frames.length;
  } else if (state === 'skill') {
    frames = TIRTA_SHEET_CACHE.skill;
    frameIdx = Math.floor(t * 5.5) % frames.length;
  }
  const frameCanvas = frames[frameIdx] || frames[0];

  if (!tr.noShadow) {
    c.fillStyle = 'rgba(10, 22, 38, 0.45)';
    c.beginPath();
    c.ellipse(x, y + 1, 10 * (customScale / 0.64), 3.6 * (customScale / 0.64), 0, 0, Math.PI * 2);
    c.fill();

    const ripR = (8.5 + ((t * 4.2) % 4.5)) * (customScale / 0.64);
    c.strokeStyle = `rgba(224, 242, 254, ${(0.72 - ((t * 4.2) % 4.5) / 6.5).toFixed(2)})`;
    c.lineWidth = 1.0;
    c.beginPath();
    c.ellipse(x, y, ripR, ripR * 0.42, 0, 0, Math.PI * 2);
    c.stroke();
  }

  const drawW = frameCanvas.width * customScale;
  const drawH = frameCanvas.height * customScale;

  c.save();
  c.translate(x, y);
  // Baked frames face RIGHT natively (matching the Tirta Sprite Sheet); flip horizontally when facing LEFT!
  if (tr.dir === 'left') c.scale(-1, 1);
  c.imageSmoothingEnabled = false;
  c.drawImage(frameCanvas, -32 * customScale, -48 * customScale, drawW, drawH);
  c.restore();
}

// ============================================================================
// TAHAP 2 - HUGGY (BERUANG REMAJA PENYAYANG) HD-2D SPRITE SHEET RENDERER (76x64 px)
// Supports: IDLE (5), BERJALAN (7), MENYERANG - Cuddle Punch (7), SKILL - Sleepy Roll / Dreamy Nap (7)
// ============================================================================
const HUGGY_SHEET_CACHE = {
  ready: false,
  idle: [],   // 5 frames (Row 1 of Huggy Sprite Sheet)
  walk: [],   // 7 frames (Row 2 of Huggy Sprite Sheet)
  attack: [], // 7 frames (Row 3 of Huggy Sprite Sheet)
  skill: []   // 7 frames (Row 4 of Huggy Sprite Sheet)
};

function bakeHuggyFrame(pose) {
  const fw = 76, fh = 64;
  const can = document.createElement('canvas');
  can.width = fw;
  can.height = fh;
  const ctx = can.getContext('2d');

  const ox = pose.dx || 0;
  const oy = pose.dy || 0;
  const cx = 32 + ox;
  const by = 54 + oy;

  // LAYER 0: SKILL BLUE CRESCENT ROLL WAVE (Row 4 Frames 2 & 3)
  if (pose.rollSlash) {
    const slashL = createPixelLayer(fw, fh);
    const rcx = cx + 2, rcy = by - 18;
    for (let y = rcy - 22; y <= rcy + 22; y++) {
      for (let x = rcx - 24; x <= rcx + 12; x++) {
        const dx = x - rcx, dy = y - rcy;
        const r = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx);
        if (ang > 1.1 || ang < -1.0) {
          if (r >= 14 && r <= 21) {
            slashL.set(x, y, r > 18.5 ? '#ffffff' : (r > 16 ? '#7dd3fc' : '#0284c7'));
          }
        }
      }
    }
    slashL.compositeTo(ctx);
  }

  // LAYER 1: PLUMP CREAM-TAN BEAR FEET, WHITE HOODIE JACKET & CROSSBODY SATCHEL
  const bodyL = createPixelLayer(fw, fh);
  const isNapping = !!pose.napFloat;
  const lFootX = cx - 4 + (pose.lFootX || 0);
  const lFootY = by + (pose.lFootY || 0);
  const rFootX = cx + 4 + (pose.rFootX || 0);
  const rFootY = by + (pose.rFootY || 0);

  if (!isNapping) {
    // Plump cream-tan bear legs/feet
    bodyL.fillPoly([
      [lFootX - 3, lFootY - 6], [lFootX + 3, lFootY - 6], [lFootX + 4, lFootY], [lFootX - 3, lFootY]
    ], (x, y) => y >= lFootY - 1 ? '#b08259' : '#e6c29f');
    bodyL.fillPoly([
      [rFootX - 3, rFootY - 6], [rFootX + 3, rFootY - 6], [rFootX + 4, rFootY], [rFootX - 3, rFootY]
    ], (x, y) => y >= rFootY - 1 ? '#9c6e46' : '#cfa379');
  } else {
    // Floating horizontal sleepy nap feet tucked behind (Row 4 Frames 4..7)
    bodyL.fillDisc(cx - 10, by - 9, 3.2, '#e6c29f');
    bodyL.fillDisc(cx - 5,  by - 6, 3.2, '#cfa379');
  }

  // Cozy Cream-White Bear Hoodie Torso
  const ty = isNapping ? by - 14 : by - 14;
  for (let y = ty - 9; y <= ty + 8; y++) {
    for (let x = cx - 9; x <= cx + 9; x++) {
      const nx = (x - cx) / 9.2;
      const ny = (y - ty) / 8.8;
      if (nx * nx + ny * ny <= 1.0) {
        if (y >= ty + 6) bodyL.set(x, y, '#cbd5e1'); // Ribbed bottom hoodie hem
        else if (x === cx + 2) bodyL.set(x, y, '#94a3b8'); // Front zipper/seam line
        else bodyL.set(x, y, x < cx - 3 ? '#e2e8f0' : '#f8fafc');
      }
    }
  }

  // Brown Leather Crossbody Satchel Strap & Bag (Matches Huggy Sprite Sheet!)
  bodyL.strokeLine(cx - 6, ty - 6, cx + 6, ty + 4, 1.4, '#6e4223');
  const bagX = pose.bagLeft ? (cx - 8) : (cx + 6);
  const bagY = ty + 4;
  bodyL.fillPoly([
    [bagX - 4, bagY - 3], [bagX + 4, bagY - 3], [bagX + 4, bagY + 4], [bagX - 4, bagY + 4]
  ], (x, y) => y < bagY ? '#8c5832' : '#59351c');
  bodyL.set(bagX, bagY, '#fbbf24');

  // Left & Right White Hoodie Sleeves + Cream Bear Paws
  if (pose.punchArm) {
    // Row 3 Cuddle Punch: Right/front arm extended forward!
    bodyL.strokeLine(cx - 7, ty - 3, cx - 10, ty + 2, 2.8, '#e2e8f0');
    bodyL.fillDisc(cx - 11, ty + 3, 2.2, '#e6c29f');
    bodyL.strokeLine(cx + 5, ty - 3, cx + 15, ty - 3, 3.0, '#f8fafc');
    bodyL.fillDisc(cx + 16, ty - 3, 2.5, '#e6c29f');
  } else if (pose.yawnPaw) {
    // Row 1 Idle Frame 3: Paw raised to mouth for cute yawn
    bodyL.strokeLine(cx - 7, ty - 3, cx - 9, ty + 3, 2.6, '#e2e8f0');
    bodyL.fillDisc(cx - 9, ty + 4, 2.0, '#e6c29f');
    bodyL.strokeLine(cx + 6, ty - 3, cx + 9, ty - 9, 2.5, '#f8fafc');
    bodyL.fillDisc(cx + 8, ty - 11, 2.2, '#e6c29f');
  } else {
    const lArmY = pose.lArmY || 0;
    const rArmY = pose.rArmY || 0;
    bodyL.strokeLine(cx - 7, ty - 3, cx - 9, ty + 3 + lArmY, 2.7, '#e2e8f0');
    bodyL.fillDisc(cx - 9, ty + 4 + lArmY, 2.1, '#e6c29f');
    bodyL.strokeLine(cx + 7, ty - 3, cx + 9, ty + 3 + rArmY, 2.6, '#f8fafc');
    bodyL.fillDisc(cx + 9, ty + 4 + rArmY, 2.0, '#cfa379');
  }

  bodyL.applyOutline('#1c130e');
  bodyL.compositeTo(ctx);

  // LAYER 2: BIG COZY WHITE HOODIE HEAD, ROUND BEAR EARS & TEDDY FACE
  const headL = createPixelLayer(fw, fh);
  const hx = cx + (pose.headX || 0);
  const hy = ty - 14 + (pose.headY || 0);

  // Round Cream-Tan Bear Ears poking through the White Hood
  headL.fillDisc(hx - 7, hy - 8, 3.8, '#e6c29f');
  headL.fillDisc(hx - 7, hy - 8, 2.0, '#8c5832');
  headL.fillDisc(hx + 6, hy - 8, 3.6, '#cfa379');
  headL.fillDisc(hx + 6, hy - 8, 1.8, '#8c5832');

  // Outer White Hoodie Cowling wrapping around the head
  for (let y = hy - 9; y <= hy + 8; y++) {
    for (let x = hx - 11; x <= hx + 10; x++) {
      const nx = (x - hx) / 10.6;
      const ny = (y - hy) / 8.8;
      if (nx * nx + ny * ny <= 1.0) {
        headL.set(x, y, (nx < -0.35 || ny > 0.55) ? '#e2e8f0' : '#f8fafc');
      }
    }
  }

  // Inner Warm Cream-Tan Bear Face inside the hood opening
  for (let y = hy - 6; y <= hy + 6; y++) {
    for (let x = hx - 6; x <= hx + 8; x++) {
      const nx = (x - (hx + 1.2)) / 7.2;
      const ny = (y - (hy + 0.5)) / 6.2;
      if (nx * nx + ny * ny <= 1.0) {
        headL.set(x, y, ny > 0.35 ? '#cfa379' : '#e6c29f');
      }
    }
  }
  // Lighter cream muzzle oval
  headL.fillDisc(hx + 3, hy + 2, 3.2, '#f5e1c8');

  headL.applyOutline('#1c130e');

  // Cute Bear Nose, Mouth & Eyes (Open or Sleepy Closed `- -`)
  headL.fillDisc(hx + 4, hy + 1, 1.2, '#3b2314'); // Button nose
  headL.set(hx + 4, hy + 3, '#3b2314');           // Mouth philtrum

  if (pose.sleepyEyes) {
    headL.strokeLine(hx - 2, hy - 1, hx, hy - 1, 0.6, '#291811');
    headL.strokeLine(hx + 5, hy - 1, hx + 7, hy - 1, 0.6, '#291811');
  } else {
    headL.fillDisc(hx - 1, hy - 1, 1.3, '#1c130e');
    headL.set(hx - 1, hy - 2, '#ffffff');
    headL.fillDisc(hx + 6, hy - 1, 1.3, '#1c130e');
    headL.set(hx + 6, hy - 2, '#ffffff');
  }
  // Soft rosy bear cheeks
  headL.set(hx - 3, hy + 2, '#f4a28c');
  headL.set(hx + 7, hy + 2, '#f4a28c');

  headL.compositeTo(ctx);

  // LAYER 3: FOREGROUND FX (Pink Paw-Print Cuddle Punch, Sleepy Zzz, Stars & Crescent Moons)
  const fxL = createPixelLayer(fw, fh);
  if (pose.punchFx) {
    // Row 3 Frames 3, 4, 5: Glowing Pink Cuddle Punch with Cute Bear Paw-Print!
    const px = cx + (pose.punchFx === 'wave2' ? 25 : 21);
    const py = ty - 3;
    // Pink energy beam connecting fist to paw wave
    fxL.strokeLine(cx + 15, py, px, py, 4.5, '#f9a8d4');
    fxL.strokeLine(cx + 15, py, px, py, 2.5, '#fce7f3');

    // Outer pink shockwave crescent on frames 4 & 5
    if (pose.punchFx === 'wave1' || pose.punchFx === 'wave2') {
      const rad = pose.punchFx === 'wave2' ? 12 : 9;
      for (let a = -1.3; a <= 1.3; a += 0.08) {
        const sx = px - 2 + Math.cos(a) * rad;
        const sy = py + Math.sin(a) * rad;
        fxL.fillDisc(sx, sy, 2.2, '#f472b6');
        fxL.fillDisc(sx - 1, sy, 1.2, '#fbcfe8');
      }
    }
    // Glowing Pink Paw-Print Medallion
    fxL.fillDisc(px, py, 6.2, '#f472b6');
    fxL.fillDisc(px, py, 4.8, '#fbcfe8');
    // Main central paw pad + 4 toe beans
    fxL.fillDisc(px - 1, py + 1, 2.0, '#db2777');
    fxL.fillDisc(px - 3, py - 2, 1.0, '#db2777');
    fxL.fillDisc(px - 1, py - 3, 1.0, '#db2777');
    fxL.fillDisc(px + 2, py - 2, 1.0, '#db2777');
    fxL.fillDisc(px + 3, py,     1.0, '#db2777');
  }

  if (pose.zzz) {
    // Floating purple/blue Zzz letters (Row 1 Frame 5 & Row 4 Frame 6)
    const drawZ = (zx, zy, col) => {
      for (let i = 0; i < 4; i++) {
        fxL.set(zx + i, zy, col);
        fxL.set(zx + 3 - i, zy + i, col);
        fxL.set(zx + i, zy + 3, col);
      }
    };
    drawZ(hx + 11, hy - 10, '#a855f7');
    drawZ(hx + 16, hy - 16, '#38bdf8');
  }

  if (pose.dreamFx) {
    // Row 4 Frames 4..7: Twinkling purple/pink 4-point dream stars & crescent moons!
    const stars = [[cx - 18, by - 24, 2], [cx + 18, by - 26, 3], [cx - 14, by - 8, 2], [cx + 21, by - 10, 2]];
    stars.forEach(([sx, sy, sz], i) => {
      const col = i % 2 === 0 ? '#e879f9' : '#c084fc';
      for (let d = -sz; d <= sz; d++) {
        fxL.set(sx + d, sy, col);
        fxL.set(sx, sy + d, col);
      }
      fxL.set(sx, sy, '#ffffff');
    });
    if (pose.dreamFx === 'moons') {
      // Glowing purple/white crescent moons in Frame 7
      const drawMoon = (mx, my) => {
        for (let y = -4; y <= 4; y++) {
          for (let x = -4; x <= 4; x++) {
            const d1 = Math.hypot(x, y);
            const d2 = Math.hypot(x - 1.8, y - 1.0);
            if (d1 <= 4.0 && d2 >= 2.8) {
              fxL.set(mx + x, my + y, d1 < 3.2 ? '#ffffff' : '#d8b4fe');
            }
          }
        }
      };
      drawMoon(cx + 2,  by - 38);
      drawMoon(cx + 22, by - 28);
    }
  }
  fxL.compositeTo(ctx);

  return can;
}

function ensureHuggySpriteSheetBaked() {
  if (HUGGY_SHEET_CACHE.ready) return;

  // Row 1: IDLE (5 frames from Huggy Sprite Sheet)
  HUGGY_SHEET_CACHE.idle = [
    bakeHuggyFrame({}),
    bakeHuggyFrame({ dy: 1 }),
    bakeHuggyFrame({ yawnPaw: true }),
    bakeHuggyFrame({ sleepyEyes: true }),
    bakeHuggyFrame({ sleepyEyes: true, zzz: true })
  ];

  // Row 2: BERJALAN / BERGERAK (7 frames waddle walk cycle)
  HUGGY_SHEET_CACHE.walk = [
    bakeHuggyFrame({ lFootX: -1, rFootX: 1,  lArmY: 0,  rArmY: 0 }),
    bakeHuggyFrame({ dy: -1, lFootX: -3, lFootY: -1, rFootX: 3,  lArmY: -2, rArmY: 2 }),
    bakeHuggyFrame({ dy: -1, lFootX: -4, lFootY: -2, rFootX: 4,  lArmY: -3, rArmY: 3 }),
    bakeHuggyFrame({ dy: 0,  lFootX: -1, rFootX: 2,  lArmY: -1, rArmY: 1 }),
    bakeHuggyFrame({ dy: -1, lFootX: 3,  rFootX: -3, rFootY: -2, lArmY: 2,  rArmY: -2, bagLeft: true }),
    bakeHuggyFrame({ dy: -1, lFootX: 4,  rFootX: -4, rFootY: -2, lArmY: 3,  rArmY: -3, bagLeft: true }),
    bakeHuggyFrame({ dy: 0,  lFootX: 1,  rFootX: -1, lArmY: 0,  rArmY: 0,  bagLeft: true })
  ];

  // Row 3: MENYERANG — Cuddle Punch (7 frames)
  HUGGY_SHEET_CACHE.attack = [
    bakeHuggyFrame({ dx: -1 }),
    bakeHuggyFrame({ dx: 1,  dy: -1, lFootX: -3, rFootX: 3, bagLeft: true }),
    bakeHuggyFrame({ dx: 2,  punchArm: true, punchFx: 'paw', bagLeft: true }),
    bakeHuggyFrame({ dx: 3,  punchArm: true, punchFx: 'wave1', bagLeft: true }),
    bakeHuggyFrame({ dx: 3,  punchArm: true, punchFx: 'wave2', bagLeft: true }),
    bakeHuggyFrame({ dx: 1,  dy: -1, lFootX: -2, rFootX: 3, bagLeft: true }),
    bakeHuggyFrame({ dx: 0,  bagLeft: true })
  ];

  // Row 4: MENGELUARKAN SKILL — Sleepy Roll / Dreamy Nap (7 frames)
  HUGGY_SHEET_CACHE.skill = [
    bakeHuggyFrame({ dy: 3,  headX: 3, headY: 3, sleepyEyes: true }),
    bakeHuggyFrame({ dy: 2,  headX: 3, headY: 3, rollSlash: true }),
    bakeHuggyFrame({ dy: 1,  headX: 2, headY: 2, rollSlash: true }),
    bakeHuggyFrame({ dy: -3, napFloat: true, sleepyEyes: true, dreamFx: 'stars', bagLeft: true }),
    bakeHuggyFrame({ dy: -4, napFloat: true, sleepyEyes: true, dreamFx: 'stars', bagLeft: true }),
    bakeHuggyFrame({ dy: -3, napFloat: true, sleepyEyes: true, dreamFx: 'stars', zzz: true, bagLeft: true }),
    bakeHuggyFrame({ dy: -4, napFloat: true, sleepyEyes: true, dreamFx: 'moons', bagLeft: true })
  ];

  HUGGY_SHEET_CACHE.ready = true;
}

function drawHuggyMonstra(c, hg, time, customScale = 0.66) {
  ensureHuggySpriteSheetBaked();

  const x = Math.round(hg.x * 2) / 2;
  const y = Math.round(hg.y * 2) / 2;
  const t = time + (hg.phase || 0);
  const state = hg.state || 'idle';

  let frames = HUGGY_SHEET_CACHE.idle;
  let frameIdx = Math.floor(t * 4.0) % frames.length;
  if (state === 'walk') {
    frames = HUGGY_SHEET_CACHE.walk;
    frameIdx = Math.floor(t * 7.0) % frames.length;
  } else if (state === 'attack') {
    frames = HUGGY_SHEET_CACHE.attack;
    frameIdx = Math.floor(t * 7.5) % frames.length;
  } else if (state === 'skill') {
    frames = HUGGY_SHEET_CACHE.skill;
    frameIdx = Math.floor(t * 5.5) % frames.length;
  }
  const frameCanvas = frames[frameIdx] || frames[0];

  if (!hg.noShadow) {
    if (gameState.hd2d.shadows3d) {
      c.fillStyle = 'rgba(8, 12, 20, 0.32)';
      c.beginPath();
      c.ellipse(x + 4, y + 1, 11 * (customScale / 0.66), 4.2 * (customScale / 0.66), 0.15, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = 'rgba(8, 12, 20, 0.55)';
    c.beginPath();
    c.ellipse(x, y + 1, 9.5 * (customScale / 0.66), 3.5 * (customScale / 0.66), 0, 0, Math.PI * 2);
    c.fill();
  }

  const drawW = frameCanvas.width * customScale;
  const drawH = frameCanvas.height * customScale;

  c.save();
  c.translate(x, y);
  // Baked frames face RIGHT natively; flip horizontally when facing LEFT!
  if (hg.dir === 'left') c.scale(-1, 1);
  c.imageSmoothingEnabled = false;
  c.drawImage(frameCanvas, -32 * customScale, -54 * customScale, drawW, drawH);
  c.restore();
}

// ============================================================================
// TAHAP 1 - SIKARU (ROH KECIL HUTAN) HD-2D SPRITE SHEET RENDERER (76x64 px)
// Supports: IDLE (5), BERJALAN (6), MENYERANG - Leaf Blade (6), SKILL - Photosynthesis (5)
// ============================================================================
const SIKARU_SHEET_CACHE = {
  ready: false,
  idle: [],   // 5 frames (Row 1 of Sikaru Sprite Sheet)
  walk: [],   // 6 frames (Row 2 of Sikaru Sprite Sheet)
  attack: [], // 6 frames (Row 3 of Sikaru Sprite Sheet)
  skill: []   // 5 frames (Row 4 of Sikaru Sprite Sheet)
};

function bakeSikaruFrame(pose) {
  const fw = 76, fh = 64;
  const can = document.createElement('canvas');
  can.width = fw;
  can.height = fh;
  const ctx = can.getContext('2d');

  const ox = pose.dx || 0;
  const oy = pose.dy || 0;
  const cx = 32 + ox;
  const by = 54 + oy;
  const rearUp = pose.rearUp || 0; // Lifts front torso & head when rearing up in Skill Row 4!

  // LAYER 0: SKILL GOLDEN-EMERALD PHOTOSYNTHESIS GLOW AURA (Row 4 Frames 2..5)
  if (pose.natureAura) {
    const grad = ctx.createRadialGradient(cx + 1, by - 18 - rearUp * 0.5, 4, cx + 1, by - 18 - rearUp * 0.5, 25);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
    grad.addColorStop(0.5, 'rgba(74, 222, 128, 0.48)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx + 1, by - 18 - rearUp * 0.5, 25, 0, Math.PI * 2);
    ctx.fill();
  }

  // LAYER 1: SLENDER DEER LEGS, HOOVES, FAWN TORSO & WHITE DAPPLED SPOTS
  const bodyL = createPixelLayer(fw, fh);
  const fHindX = cx - 7 + (pose.fHindX || 0);
  const fHindY = by + (pose.fHindY || 0);
  const bHindX = cx - 4 + (pose.bHindX || 0);
  const bHindY = by + (pose.bHindY || 0);
  const fFrontX = cx + 5 + (pose.fFrontX || 0);
  const fFrontY = by - rearUp + (pose.fFrontY || 0);
  const bFrontX = cx + 8 + (pose.bFrontX || 0);
  const bFrontY = by - rearUp + (pose.bFrontY || 0);

  const hipX = cx - 6, hipY = by - 13;
  const shX = cx + 4,  shY = by - 14 - rearUp;

  // Far-side slender legs & hooves
  bodyL.strokeLine(hipX + 2, hipY, bHindX, bHindY - 1, 1.5, '#9c6234');
  bodyL.set(bHindX, bHindY, '#3b2314');
  bodyL.strokeLine(shX + 2, shY, bFrontX, bFrontY - 1, 1.5, '#9c6234');
  bodyL.set(bFrontX, bFrontY, '#3b2314');

  // Perky Fawn Tail with Cream Underside
  bodyL.fillPoly([
    [hipX - 2, hipY - 2], [hipX - 6, hipY - 7], [hipX - 3, hipY - 8], [hipX, hipY - 3]
  ], (x, y) => x < hipX - 3 ? '#fef3c7' : '#d99b66');

  // Graceful Fawn Torso with Warm Golden-Tan Back & Cream Belly
  const spineSteps = 18;
  for (let i = 0; i <= spineSteps; i++) {
    const t = i / spineSteps;
    const sx = hipX * (1 - t) + shX * t;
    const sy = hipY * (1 - t) + shY * t;
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const px = Math.round(sx + dx);
        const py = Math.round(sy + dy);
        if (dy >= 2) bodyL.set(px, py, '#fef3c7'); // Cream belly line
        else if (dy <= -2) bodyL.set(px, py, '#b87b48');
        else bodyL.set(px, py, '#d99b66');
      }
    }
  }
  // Signature White-Cream Fawn Spots on Back
  bodyL.set(hipX + 1, hipY - 2, '#fffbeb');
  bodyL.set(hipX + 4, hipY - 3, '#fffbeb');
  bodyL.set(hipX + 6, hipY - 1, '#fffbeb');

  // Near-side slender legs & dark hooves
  bodyL.strokeLine(hipX, hipY + 1, fHindX, fHindY - 1, 1.7, '#d99b66');
  bodyL.fillRect ? null : null;
  bodyL.set(fHindX, fHindY, '#3b2314');
  bodyL.set(fHindX + 1, fHindY, '#3b2314');
  bodyL.strokeLine(shX, shY + 1, fFrontX, fFrontY - 1, 1.7, '#d99b66');
  bodyL.set(fFrontX, fFrontY, '#3b2314');
  bodyL.set(fFrontX + 1, fFrontY, '#3b2314');

  // LUSH GREEN LEAFY NECK WREATH / GARLAND (Iconic Sikaru Collar!)
  const wx = shX + 2, wy = shY - 2;
  const wreathPts = [[-3, 1], [-1, 2], [1, 3], [3, 2], [5, 1], [3, -1], [0, 0], [-2, -1]];
  wreathPts.forEach(([dx, dy], idx) => {
    bodyL.fillDisc(wx + dx, wy + dy, 2.1, idx % 2 === 0 ? '#22c55e' : '#15803d');
    bodyL.set(wx + dx, wy + dy - 1, '#86efac');
  });

  bodyL.applyOutline('#1e130c');
  bodyL.compositeTo(ctx);

  // LAYER 2: FAWN HEAD, EARS & WOODEN TWIG ANTLERS WITH SPROUTING LEAVES
  const headL = createPixelLayer(fw, fh);
  const hx = shX + 3 + (pose.headX || 0);
  const hy = shY - 9 + (pose.headY || 0);

  // Branching Wooden Twig Antlers & Fresh Green Leaves on Top
  headL.strokeLine(hx - 1, hy - 5, hx - 4, hy - 12, 1.0, '#784421');
  headL.strokeLine(hx - 3, hy - 9, hx - 6, hy - 10, 0.8, '#784421');
  headL.strokeLine(hx + 3, hy - 5, hx + 5, hy - 12, 1.0, '#784421');
  headL.strokeLine(hx + 4, hy - 9, hx + 7, hy - 10, 0.8, '#784421');
  // Green leaves sprouting on the antlers
  const antlerLeaves = [[hx - 5, hy - 12], [hx - 2, hy - 11], [hx + 5, hy - 12], [hx + 7, hy - 10]];
  antlerLeaves.forEach(([lx, ly]) => {
    headL.fillDisc(lx, ly, 1.4, '#4ade80');
    headL.set(lx, ly - 1, '#bbf7d0');
  });

  // Perky Left & Right Fawn Ears
  headL.fillPoly([[hx - 3, hy - 3], [hx - 9, hy - 6], [hx - 7, hy - 2], [hx - 3, hy - 1]], '#d99b66');
  headL.set(hx - 6, hy - 4, '#fbcfe8');
  headL.fillPoly([[hx + 4, hy - 4], [hx + 8, hy - 7], [hx + 6, hy - 3]], '#b87b48');

  // Fawn Head & Cream Muzzle
  for (let y = hy - 5; y <= hy + 3; y++) {
    for (let x = hx - 4; x <= hx + 7; x++) {
      const nx = (x - (hx + 1)) / 5.8;
      const ny = (y - (hy - 1)) / 4.5;
      if (nx * nx + ny * ny <= 1.0) {
        headL.set(x, y, (x >= hx + 3 && y >= hy - 1) ? '#fef3c7' : (y < hy - 3 ? '#b87b48' : '#d99b66'));
      }
    }
  }
  headL.applyOutline('#1e130c');

  // Dark Nose & Expressive Fawn Eye
  headL.set(hx + 6, hy, '#291811');
  if (pose.blink) {
    headL.strokeLine(hx + 1, hy - 1, hx + 3, hy - 1, 0.6, '#1e130c');
  } else {
    headL.fillDisc(hx + 2, hy - 1, 1.4, '#1e130c');
    headL.set(hx + 1, hy - 2, '#ffffff');
  }
  headL.compositeTo(ctx);

  // LAYER 3: FOREGROUND FX (Floating Leaves, Leaf Blade Slashes, Sprouting Ground Plants)
  const fxL = createPixelLayer(fw, fh);
  if (pose.leaves) {
    const lPts = [[cx - 14, by - 22], [hx + 10, hy - 6], [cx + 12, by - 8], [hx - 10, hy - 11]];
    lPts.forEach(([lx, ly], i) => {
      if ((i + (pose.leafSeed || 0)) % 2 === 0) {
        fxL.fillPoly([[lx - 2, ly], [lx, ly - 2], [lx + 2, ly], [lx, ly + 1]], '#4ade80');
        fxL.set(lx, ly - 1, '#bbf7d0');
      }
    });
  }
  if (pose.leafBlade) {
    // Row 3 Frames 3..6: Glowing Antler Leaves & Sweeping Emerald Crescent Wind Slashes!
    const stage = pose.leafBlade;
    const crownLeaves = [[hx - 7, hy - 14], [hx, hy - 16], [hx + 8, hy - 14], [hx + 11, hy - 8]];
    crownLeaves.forEach(([lx, ly]) => {
      fxL.fillPoly([[lx - 2, ly], [lx, ly - 3], [lx + 3, ly], [lx, ly + 2]], '#22c55e');
      fxL.set(lx, ly, '#dcfce7');
    });
    if (stage >= 2) {
      const rSpan = stage === 4 ? 22 : (stage === 3 ? 18 : 14);
      for (let a = -1.1; a <= 1.25; a += 0.06) {
        const sx = cx + 4 + Math.cos(a) * rSpan;
        const sy = by - 14 + Math.sin(a) * (rSpan * 0.65);
        fxL.fillDisc(sx, sy, stage === 4 ? 2.4 : 1.7, a > 0 ? '#bbf7d0' : '#4ade80');
        if (stage === 4) fxL.fillDisc(sx - 4, sy + 2, 1.5, '#16a34a');
      }
    }
  }
  if (pose.sprouts) {
    // Row 4 Frames 4 & 5: Glowing green & golden plants sprouting from the ground around Sikaru!
    for (let gx = cx - 14; gx <= cx + 14; gx++) {
      fxL.set(gx, by + 1, '#15803d');
      if (Math.abs(gx - cx) < 11) fxL.set(gx, by + 2, '#4ade80');
    }
    const shoots = [[cx - 11, by, '#4ade80'], [cx - 3, by + 1, '#fde047'], [cx + 8, by, '#4ade80'], [cx + 13, by + 1, '#86efac']];
    shoots.forEach(([sx, sy, col]) => {
      fxL.strokeLine(sx, sy, sx, sy - 5, 0.8, col);
      fxL.fillDisc(sx - 2, sy - 5, 1.2, col);
      fxL.fillDisc(sx + 2, sy - 5, 1.2, col);
    });
  }
  if (pose.natureAura) {
    // Golden & emerald 4-point sparkles around Sikaru
    const sp = [[cx - 15, by - 25], [cx + 16, by - 28], [cx + 18, by - 12], [cx - 14, by - 10]];
    sp.forEach(([sx, sy], idx) => {
      const col = idx % 2 === 0 ? '#fde047' : '#86efac';
      fxL.set(sx - 1, sy, col); fxL.set(sx + 1, sy, col);
      fxL.set(sx, sy - 1, col); fxL.set(sx, sy + 1, col);
      fxL.set(sx, sy, '#ffffff');
    });
  }
  fxL.compositeTo(ctx);

  return can;
}

function ensureSikaruSpriteSheetBaked() {
  if (SIKARU_SHEET_CACHE.ready) return;

  // Row 1: IDLE (5 frames from Sikaru Sprite Sheet)
  SIKARU_SHEET_CACHE.idle = [
    bakeSikaruFrame({ leaves: true, leafSeed: 0 }),
    bakeSikaruFrame({ blink: true, leaves: true, leafSeed: 1 }),
    bakeSikaruFrame({ headY: -1, leaves: true, leafSeed: 2 }),
    bakeSikaruFrame({ blink: true, leaves: true, leafSeed: 3 }),
    bakeSikaruFrame({ leaves: true, leafSeed: 4 })
  ];

  // Row 2: BERJALAN / BERGERAK (6 frames graceful trot & leap cycle)
  SIKARU_SHEET_CACHE.walk = [
    bakeSikaruFrame({ fFrontX: 2,  fHindX: -2, bFrontX: -2, bHindX: 2 }),
    bakeSikaruFrame({ dy: -1, fFrontX: 4, fFrontY: -3, fHindX: -2, bFrontX: -2, bHindX: 2, leaves: true, leafSeed: 1 }),
    bakeSikaruFrame({ dy: -2, fFrontX: 3, fFrontY: -2, fHindX: 2, fHindY: -2, bFrontX: -3, bHindX: -2, leaves: true, leafSeed: 2 }),
    bakeSikaruFrame({ dy: -3, fFrontX: 5, fFrontY: -4, bFrontX: 3, bFrontY: -2, fHindX: -4, bHindX: -3, leaves: true, leafSeed: 3 }),
    bakeSikaruFrame({ dy: -4, rearUp: 3, fFrontX: 6, fFrontY: -3, bFrontX: 4, bFrontY: -2, fHindX: -5, bHindX: -4, leaves: true, leafSeed: 4 }),
    bakeSikaruFrame({ dy: -2, rearUp: 2, fFrontX: 4, fFrontY: -4, bFrontX: 2, bFrontY: -3, fHindX: -2, bHindX: -1, leaves: true, leafSeed: 5 })
  ];

  // Row 3: MENYERANG — Leaf Blade (6 frames)
  SIKARU_SHEET_CACHE.attack = [
    bakeSikaruFrame({ fFrontX: -2, bFrontX: 2 }),
    bakeSikaruFrame({ dx: 1, headX: 2, headY: 2, fFrontX: -3, bFrontX: 3 }),
    bakeSikaruFrame({ dx: 1, headX: 2, headY: 3, leafBlade: 1 }),
    bakeSikaruFrame({ dx: 2, headX: 3, headY: 2, leafBlade: 2 }),
    bakeSikaruFrame({ dx: 2, headX: 3, headY: 2, leafBlade: 3 }),
    bakeSikaruFrame({ dx: 3, headX: 3, headY: 1, leafBlade: 4 })
  ];

  // Row 4: MENGELUARKAN SKILL — Photosynthesis / Nature's Blessing (5 frames)
  SIKARU_SHEET_CACHE.skill = [
    bakeSikaruFrame({ dy: -3, rearUp: 8, fFrontX: 2, fFrontY: -3, bFrontX: 4, bFrontY: -4 }),
    bakeSikaruFrame({ dy: -3, rearUp: 8, fFrontX: 2, fFrontY: -3, bFrontX: 4, bFrontY: -4, natureAura: true }),
    bakeSikaruFrame({ dy: -1, rearUp: 4, fFrontX: 2, fFrontY: -2, natureAura: true }),
    bakeSikaruFrame({ dy: 0,  natureAura: true, sprouts: true }),
    bakeSikaruFrame({ dy: 0,  natureAura: true, sprouts: true, blink: true })
  ];

  SIKARU_SHEET_CACHE.ready = true;
}

function drawSikaruMonstra(c, sk, time, customScale = 0.66) {
  ensureSikaruSpriteSheetBaked();

  const x = Math.round(sk.x * 2) / 2;
  const y = Math.round(sk.y * 2) / 2;
  const t = time + (sk.phase || 0);
  const state = sk.state || 'idle';

  let frames = SIKARU_SHEET_CACHE.idle;
  let frameIdx = Math.floor(t * 4.5) % frames.length;
  if (state === 'walk') {
    frames = SIKARU_SHEET_CACHE.walk;
    frameIdx = Math.floor(t * 7.5) % frames.length;
  } else if (state === 'attack') {
    frames = SIKARU_SHEET_CACHE.attack;
    frameIdx = Math.floor(t * 7.5) % frames.length;
  } else if (state === 'skill') {
    frames = SIKARU_SHEET_CACHE.skill;
    frameIdx = Math.floor(t * 5.5) % frames.length;
  }
  const frameCanvas = frames[frameIdx] || frames[0];

  if (!sk.noShadow) {
    if (gameState.hd2d.shadows3d) {
      c.fillStyle = 'rgba(8, 12, 20, 0.30)';
      c.beginPath();
      c.ellipse(x + 4, y + 1, 11 * (customScale / 0.66), 4.0 * (customScale / 0.66), 0.15, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = 'rgba(8, 12, 20, 0.52)';
    c.beginPath();
    c.ellipse(x, y + 1, 9.2 * (customScale / 0.66), 3.3 * (customScale / 0.66), 0, 0, Math.PI * 2);
    c.fill();
  }

  const drawW = frameCanvas.width * customScale;
  const drawH = frameCanvas.height * customScale;

  c.save();
  c.translate(x, y);
  // Baked frames face RIGHT natively; flip horizontally when facing LEFT!
  if (sk.dir === 'left') c.scale(-1, 1);
  c.imageSmoothingEnabled = false;
  c.drawImage(frameCanvas, -32 * customScale, -54 * customScale, drawW, drawH);
  c.restore();
}

function drawFoxMonstra(c, fx, fy, time, isInWater = false) {
  const x = Math.round(fx * 2) / 2;
  const y = Math.round(fy * 2) / 2;
  const hop = Math.abs(Math.sin(time * 4.2)) > 0.72 ? -1 : 0;

  c.fillStyle = 'rgba(10, 14, 22, 0.42)';
  c.beginPath();
  c.ellipse(x, y + 1, 7.5, 3, 0, 0, Math.PI * 2);
  c.fill();

  c.save();
  c.translate(x, y + hop);
  const p = (hx, hy, hw, hh, col) => {
    c.fillStyle = col;
    c.fillRect(hx * 0.5, hy * 0.5, hw * 0.5, hh * 0.5);
  };

  // Fluffy Cream-Tipped Tail wagging on the right
  const tailWag = Math.round(Math.sin(time * 6) * 1.5);
  p(6,  -20 + tailWag, 12, 13, '#120e1a');
  p(7,  -19 + tailWag, 10, 11, '#e0722b');
  p(10, -21 + tailWag, 8,  6,  '#fff7eb');

  // Body & Dark Paws
  p(-9, -15, 18, 15, '#120e1a');
  p(-8, -14, 16, 11, '#f08a43');
  p(-6, -12, 12, 8,  '#fff7eb'); // Fluffy cream chest ruff
  p(-7, -4,  4,  4,  '#291811'); // Left paw
  p(3,  -4,  4,  4,  '#291811'); // Right paw

  // Head & Large Upright Fox Ears
  p(-12, -29, 22, 16, '#120e1a');
  p(-11, -27, 20, 13, '#f08a43');
  p(-8,  -26, 14, 4,  '#f7a668'); // Forehead highlight
  p(-9,  -19, 16, 5,  '#fff7eb'); // Cream cheeks
  // Left & Right Ears with dark tips
  p(-13, -36, 7, 9, '#120e1a');
  p(4,   -36, 7, 9, '#120e1a');
  p(-12, -35, 5, 3, '#291811');
  p(5,   -35, 5, 3, '#291811');
  p(-12, -32, 5, 5, '#f08a43');
  p(5,   -32, 5, 5, '#f08a43');
  p(-10, -31, 3, 4, '#fbcfe8');
  p(6,   -31, 3, 4, '#fbcfe8');
  // Big Shiny Eyes & Nose
  p(-7,  -23, 4, 4, '#18141e');
  p(2,   -23, 4, 4, '#18141e');
  p(-7,  -23, 2, 2, '#ffffff');
  p(2,   -23, 2, 2, '#ffffff');
  p(-2,  -19, 3, 2, '#291811');

  c.restore();

  if (isInWater) {
    const r1 = 6 + ((time * 4.5) % 4);
    c.strokeStyle = 'rgba(244, 249, 252, 0.75)';
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(x, y, r1, r1 * 0.45, 0, 0, Math.PI * 2);
    c.stroke();
  }
}

// Animated Village Chickens / Critters pecking around the village plaza
// ============================================================================
// POKÉMON GO-STYLE WILD MONSTRA RENDERER (RARITY RING + 20s COUNTDOWN BAR)
// ============================================================================
function drawWildSpawnWithRarityAndTimer(c, sp, time) {
  const x = Math.round(sp.x * 2) / 2;
  const y = Math.round(sp.y * 2) / 2;

  // Flicker warning when less than 3.5 seconds remain before despawning
  if (sp.timeLeft < 3.5 && Math.sin(time * 24) > 0.25) {
    c.save();
    c.globalAlpha = 0.45;
  } else {
    c.save();
  }

  // 1. Pokémon GO-Style Pulsing Rarity Ground Ring beneath the Monster
  const pulse = (time * 1.6 + sp.phase) % 1;
  const ringRx = 11 + pulse * 10;
  const ringRy = ringRx * 0.45;

  c.strokeStyle = sp.rarity.ringColor;
  c.lineWidth = 1.6;
  c.beginPath();
  c.ellipse(x, y + 1, ringRx, ringRy, 0, 0, Math.PI * 2);
  c.stroke();

  c.strokeStyle = sp.rarity.color;
  c.lineWidth = 1.1;
  c.beginPath();
  c.ellipse(x, y + 1, 11, 5, 0, 0, Math.PI * 2);
  c.stroke();

  // Epic / Legendary rising star particles around the monster
  if (sp.rarity.id === 'epic' || sp.rarity.id === 'legendary') {
    for (let i = 0; i < 4; i++) {
      const ang = time * 2.5 + i * (Math.PI / 2);
      const sx = x + Math.cos(ang) * 14;
      const sy = y - 12 - ((time * 16 + i * 7) % 18);
      c.fillStyle = sp.rarity.color;
      c.fillRect(Math.floor(sx), Math.floor(sy), 2, 2);
    }
  }

  // 2. Render the High-Density HD-2D Monster Sprite scaled by its Rarity
  const mult = sp.rarity.scaleMult || 1.0;
  if (sp.species === 'aquafly') {
    drawAquaflyMonstra(c, sp, time, 0.54 * mult);
  } else if (sp.species === 'tirta') {
    drawTirtaMonstra(c, sp, time, 0.64 * mult);
  } else if (sp.species === 'huggy') {
    drawHuggyMonstra(c, sp, time, 0.66 * mult);
  } else if (sp.species === 'sikaru') {
    drawSikaruMonstra(c, sp, time, 0.66 * mult);
  } else {
    drawFoxMonstra(c, sp.x, sp.y, time, WaterSystem.isPointInWater(sp.x, sp.y));
  }

  c.restore();

  // 3. Floating Rarity Badge + 20-Second Despawn Countdown Bar above Monster
  const tagY = y - 41 - Math.sin(time * 4 + sp.phase) * 1.2;
  const barW = 46;
  const ratio = Math.max(0, Math.min(1, sp.timeLeft / sp.maxTime));

  // Background pill
  c.fillStyle = sp.rarity.bgColor;
  c.fillRect(x - barW / 2 - 2, tagY - 10, barW + 4, 15);
  c.strokeStyle = sp.rarity.color;
  c.lineWidth = 0.9;
  c.strokeRect(x - barW / 2 - 2, tagY - 10, barW + 4, 15);

  // Rarity & Timer Label
  c.font = 'bold 6.5px "Plus Jakarta Sans", sans-serif';
  c.textAlign = 'center';
  c.fillStyle = '#ffffff';
  c.fillText(`${sp.rarity.label} • ${Math.ceil(sp.timeLeft)}s`, x, tagY - 2.5);

  // 20-Second Countdown Progress Bar
  c.fillStyle = 'rgba(15, 23, 42, 0.9)';
  c.fillRect(x - barW / 2, tagY, barW, 3);
  c.fillStyle = ratio > 0.45 ? sp.rarity.color : (ratio > 0.22 ? '#f59e0b' : '#ef4444');
  c.fillRect(x - barW / 2, tagY, barW * ratio, 3);
}

function drawSpawnPoofEffects(c) {
  for (const ef of spawnPoofEffects) {
    const prog = 1 - ef.life / ef.maxLife;
    const rad = 6 + prog * 22;
    const alpha = Math.max(0, (1 - prog) * 0.85);
    c.save();
    c.strokeStyle = ef.color;
    c.globalAlpha = alpha;
    c.lineWidth = 2.0;
    c.beginPath();
    c.ellipse(ef.x, ef.y - 6, rad, rad * 0.55, 0, 0, Math.PI * 2);
    c.stroke();

    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + prog * 2;
      const px = ef.x + Math.cos(ang) * rad * 0.85;
      const py = (ef.y - 6) + Math.sin(ang) * rad * 0.5;
      c.fillStyle = '#ffffff';
      c.fillRect(px - 1.5, py - 1.5, 3, 3);
    }
    c.restore();
  }
}

