// js/map-terrain.js — MONSTRA: WILDBOUND Modular Script

function drawMarketBazaarStall(c, bx, by, bw, bh, tentCol1, tentCol2, type) {
  c.fillStyle = 'rgba(8, 12, 20, 0.42)';
  c.fillRect(bx, by + bh - 4, bw, 6);
  c.fillStyle = '#24140b';
  c.fillRect(bx + 4, by + 12, bw - 8, bh - 14);
  c.fillStyle = '#5c3a23';
  c.fillRect(bx + 6, by + 14, bw - 12, bh - 18);
  c.fillStyle = '#3b2416';
  c.fillRect(bx + 2, by + 4, 3, bh - 4);
  c.fillRect(bx + bw - 5, by + 4, 3, bh - 4);

  for (let i = 0; i < 5; i++) {
    c.fillStyle = (i % 2 === 0) ? tentCol1 : tentCol2;
    c.fillRect(bx + i * (bw / 5), by, bw / 5, 14);
  }

  if (type === 'fruit') {
    c.fillStyle = '#ef4444';
    c.fillRect(bx + 9, by + 15, 7, 5);
    c.fillStyle = '#f59e0b';
    c.fillRect(bx + 19, by + 15, 8, 5);
    c.fillStyle = '#4ade80';
    c.fillRect(bx + 30, by + 15, 8, 5);
  } else if (type === 'cloth') {
    c.fillStyle = '#38bdf8';
    c.fillRect(bx + 9, by + 15, 9, 6);
    c.fillStyle = '#f472b6';
    c.fillRect(bx + 20, by + 15, 9, 6);
    c.fillStyle = '#fde047';
    c.fillRect(bx + 31, by + 15, 8, 6);
  } else {
    c.fillStyle = '#d97706';
    c.fillRect(bx + 10, by + 15, 6, 6);
    c.fillStyle = '#92400e';
    c.fillRect(bx + 20, by + 14, 7, 7);
    c.fillStyle = '#fbbf24';
    c.fillRect(bx + 31, by + 15, 6, 6);
  }
}

// Clean, purposeful Catmull-Rom spline roads with full connections to all 4 staircases & SE Town District!
function buildSmoothRoadSegments() {
  const curves = [
    // 1. Main Valley Road (Ancient Ruins -> Arka -> Central Village Crossroads -> Liora's Cottage -> East Village Well)
    {
      pts: [
        [OX + 190, OY + 136],
        [OX + 166, OY + 168],
        [OX + 265, OY + 206],
        [OX + 398, OY + 224],
        [OX + 495, OY + 216],
        [OX + 608, OY + 216],
        [OX + 712, OY + 222],
        [1385, OY + 220]
      ],
      radius: 22
    },
    // 2. Upper-Left Stairs Connecting Road (From Arka/Ruins road -> Bottom of Upper-Left Stairs -> Top of Stairs -> Lagoon Shore & North Bridge)
    {
      pts: [
        [OX + 166, OY + 168],
        [OX + 96,  OY + 154],
        [434,      OY + 122],
        [440,      OY + 2],
        [465,      198],
        [645,      192],
        [752,      122],
        [885,      122]
      ],
      radius: 17
    },
    // 3. Upper-Right Stairs Connecting Road (From Cottage/Crossroads road -> Bottom of Upper-Right Stairs -> Top of Stairs -> North Bridge & Highland)
    {
      pts: [
        [OX + 556, OY + 214],
        [OX + 586, OY + 164],
        [OX + 594, OY + 122],
        [OX + 586, OY + 2],
        [955,      165],
        [882,      122]
      ],
      radius: 17
    },
    // 4. Southeast Stone Stairs Spur (From Cottage/Notice Board road cleanly to the top of SE Stairs -> Upper Town Dirt Avenue)
    {
      pts: [
        [OX + 520, OY + 218],
        [OX + 595, OY + 252],
        [OX + 706, OY + 302],
        [1116,     648]
      ],
      radius: 19
    },
    // 5. Western Vulpy & Expanded Flora Sanctuary Road
    {
      pts: [
        [OX + 255, OY + 204],
        [OX + 160, OY + 266],
        [OX + 92,  OY + 266],
        [345,      488],
        [225,      540],
        [135,      615]
      ],
      radius: 21
    },
    // 6. Lower-Left Stairs Connecting Road (From Vulpy/West Road -> Top of Lower-Left Stairs -> Bottom of Lower-Left Stairs -> South Ravine Trail)
    {
      pts: [
        [OX + 126, OY + 266],
        [OX + 118, OY + 306],
        [OX + 118, OY + 338],
        [OX + 108, OY + 438],
        [522,      745]
      ],
      radius: 17
    },
    // 7. Lower Ravine Trail & Lower Town Dirt Avenue (South Bridge -> Lower Town Main Dirt Street)
    {
      pts: [
        [OX + 108, OY + 438],
        [522,      745],
        [658,      772],
        [890,      772],
        [1020,     768],
        [1135,     768],
        [1285,     768],
        [1415,     768],
        [1535,     768]
      ],
      radius: 20
    },
    // 8. Upper Town Dirt Avenue (From bottom of SE Stairs across North Town Block)
    {
      pts: [
        [945,  648],
        [1116, 648],
        [1274, 648],
        [1392, 648],
        [1535, 648]
      ],
      radius: 19
    },
    // 9. Town North-South Dirt Cross-Streets (Connecting East Village & All 3 Town Blocks)
    {
      pts: [
        [1392, OY + 220],
        [1392, 535],
        [1392, 648],
        [1392, 768],
        [1392, 865]
      ],
      radius: 18
    },
    {
      pts: [
        [1274, 540],
        [1274, 648],
        [1274, 768],
        [1274, 865]
      ],
      radius: 18
    },
    {
      pts: [
        [1132, 648],
        [1132, 768],
        [1132, 865]
      ],
      radius: 17
    }
  ];

  const segs = [];
  for (const c of curves) {
    const pts = c.pts;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const steps = 8;
      let prevX = p1[0], prevY = p1[1];
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const t2 = t * t;
        const t3 = t2 * t;
        const x = 0.5 * (
          (2 * p1[0]) +
          (-p0[0] + p2[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
        );
        const y = 0.5 * (
          (2 * p1[1]) +
          (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
        );
        segs.push([prevX, prevY, x, y, c.radius]);
        prevX = x;
        prevY = y;
      }
    }
  }
  return segs;
}

const SMOOTH_ROAD_SEGMENTS = buildSmoothRoadSegments();

function getPathWeight(x, y) {
  let maxW = 0;
  for (let i = 0; i < SMOOTH_ROAD_SEGMENTS.length; i++) {
    const s = SMOOTH_ROAD_SEGMENTS[i];
    const r = s[4];
    if (
      x < Math.min(s[0], s[2]) - r - 14 ||
      x > Math.max(s[0], s[2]) + r + 14 ||
      y < Math.min(s[1], s[3]) - r - 14 ||
      y > Math.max(s[1], s[3]) + r + 14
    ) continue;
    const d = distToSegment(x, y, s[0], s[1], s[2], s[3]);
    if (d < r + 12) {
      const w = Math.max(0, 1 - d / r);
      if (w > maxW) maxW = w;
    }
  }
  return maxW;
}


function buildOverworldEnvironment(bgCtx) {
  const grassRampRgb = [
    PAL.grassDeep, PAL.grassShade2, PAL.grassShade1,
    PAL.grassMid2, PAL.grassMid1, PAL.grassSun1, PAL.grassSun2
  ].map(hexToRgb);

  const dirtRampRgb = [
    PAL.dirtDeep, PAL.dirtShade, PAL.dirtEdge, PAL.dirtMid, PAL.dirtCenter, PAL.dirtHighlight
  ].map(hexToRgb);

  const rgbGrassSun2 = hexToRgb(PAL.grassSun2);
  const rgbGrassShade2 = hexToRgb(PAL.grassShade2);
  const rgbRockMid1 = hexToRgb(PAL.rockMid1);
  const rgbDirtShade = hexToRgb(PAL.dirtShade);

  // Precompute path weights on a fine 2px grid with bilinear interpolation
  const step = 2;
  const gw = Math.ceil(W / step) + 1;
  const gh = Math.ceil(H / step) + 1;
  const pathGrid = new Float32Array(gw * gh);
  for (let gy = 0; gy < gh; gy++) {
    const wy = gy * step;
    for (let gx = 0; gx < gw; gx++) {
      pathGrid[gy * gw + gx] = getPathWeight(gx * step, wy);
    }
  }

  // 1. Direct ImageData Pixel Buffer for the 1600x900 HD-2D Meadow & Organic Road Network
  const imgData = bgCtx.createImageData(W, H);
  const data = imgData.data;

  for (let y = 0; y < H; y++) {
    const gy = y >> 1;
    const fy = (y & 1) * 0.5;
    const rowOffset = gy * gw;
    const bayerRow = BAYER4[y & 3];

    for (let x = 0; x < W; x++) {
      const gx = x >> 1;
      const fx = (x & 1) * 0.5;
      const p00 = pathGrid[rowOffset + gx];
      const p10 = pathGrid[rowOffset + gx + 1];
      const p01 = pathGrid[rowOffset + gw + gx];
      const p11 = pathGrid[rowOffset + gw + gx + 1];
      const pwBase = p00 + (p10 - p00) * fx + (p01 - p00) * fy + (p00 - p10 - p01 + p11) * fx * fy;

      const n1 = valueNoise(x * 0.032, y * 0.032);
      const n2 = hash2D(x >> 1, y >> 1);
      const pw = pwBase + (n1 - 0.5) * 0.18;
      const threshold = bayerRow[x & 3];

      let r, g, b;
      if (pw > 0.24) {
        const dVal = Math.max(0, Math.min(1, (pw - 0.24) / 0.68 + (n2 - 0.5) * 0.14));
        const idx = dVal * (dirtRampRgb.length - 1);
        const low = idx | 0;
        const high = Math.min(dirtRampRgb.length - 1, low + 1);
        const c = (idx - low) > threshold ? dirtRampRgb[high] : dirtRampRgb[low];
        r = c[0]; g = c[1]; b = c[2];
        // Subtle cart wheel / footpath pebble detail along path edges
        if (pw > 0.26 && pw < 0.36 && n2 > 0.72) {
          r = rgbDirtShade[0]; g = rgbDirtShade[1]; b = rgbDirtShade[2];
        } else if (n2 > 0.92 && pw > 0.45) {
          const p = ((x + y) & 1) ? rgbRockMid1 : rgbDirtShade;
          r = p[0]; g = p[1]; b = p[2];
        }
      } else {
        // Lush sunlit clearing in the Flora Sanctuary & Central Valley
        const dFlora = Math.hypot((x - 235) / 185, (y - 535) / 155);
        const floraGlow = dFlora < 1.0 ? (1.0 - dFlora) * 0.18 : 0;
        const sunBias = ((x - y * 0.42) / W) * 0.15 + floraGlow;
        const gVal = Math.max(0.08, Math.min(0.96, n1 * 0.65 + n2 * 0.20 + sunBias + 0.10));
        const idx = gVal * (grassRampRgb.length - 1);
        const low = idx | 0;
        const high = Math.min(grassRampRgb.length - 1, low + 1);
        const c = (idx - low) > threshold ? grassRampRgb[high] : grassRampRgb[low];
        r = c[0]; g = c[1]; b = c[2];
        // Crisp pixel grass blade tufts
        if (((x + y * 3) % 7 === 0) && n2 > 0.74) {
          const blade = gVal > 0.50 ? rgbGrassSun2 : rgbGrassShade2;
          r = blade[0]; g = blade[1]; b = blade[2];
        }
      }

      const pIdx = (y * W + x) << 2;
      data[pIdx] = r;
      data[pIdx + 1] = g;
      data[pIdx + 2] = b;
      data[pIdx + 3] = 255;
    }
  }
  bgCtx.putImageData(imgData, 0, 0);

  // 2. Sculpted Organic Limestone Cliffs across the expanded Overworld
  drawAllCliffFormations(bgCtx);

  // 3. Expanded Monster Habitats Static Terrain (Large Flora & Aqua Sanctuaries)
  drawMonsterHabitatsStatic(bgCtx);

  // 4. Cobblestone Patio & East Village Stone Path
  drawCobblestonePath(bgCtx);

  // 5. Upper-Left Ancient Mossy Stone Ruins Temple (at OX, OY)
  drawAncientRuins(bgCtx);

  // 6. Carved Sloped Cliffside Staircases (Aligned 1:1 with the cliff faces!)
  // (A) Left Lagoon Cliffside Stairs — carved into the Upper-West Cliff slope leading up to Aqua Sanctuary!
  drawCliffsideStairs(bgCtx, 416, OY + 2, 52, 114, -8);
  // (B) Right Alpine Cliffside Stairs — carved into the Upper-Right Cliff slope behind the waterfall/cottage!
  drawCliffsideStairs(bgCtx, OX + 560, OY + 2, 52, 114, 10);
  // (C) Southeast Ravine Stairs — matching the bottom-right stairs in the reference photo!
  drawCliffsideStairs(bgCtx, OX + 680, OY + 306, 56, 98, 12);
  // (D) Southwest Ravine Stairs — carved into the lower-left ravine cliff slope leading to the bottom bridge!
  drawCliffsideStairs(bgCtx, OX + 94, OY + 338, 52, 96, -10);

  // 7A. Right-Side Blue-Roofed Village Cottage, Lantern & Side Stall
  drawVillageCottage(bgCtx);

  // 7B. Central Village Plaza, Merchant Cart, Campfire, Pergola & Underground Culvert Conduit
  drawCentralVillageHub(bgCtx);

  // 7C. Dense Southeast Town Center & Bustling Market District (X: 930..1555, Y: 540..875 — Architecture & Market Props Only, No New NPCs!)
  drawSoutheastTownDistrict(bgCtx);

  // 8. Expanded Sector Landmarks
  drawExpandedSectorLandmarks(bgCtx);

  // 9. Wooden Fences, Crossroads Signpost & Village Notice Board
  drawWoodenFence(bgCtx, OX + 104, OY + 224, 90);
  drawWoodenFence(bgCtx, OX + 416, OY + 306, 38);
  drawWoodenFence(bgCtx, OX + 650, OY + 230, 52);
  drawWoodenFence(bgCtx, OX + 744, OY + 298, 42);
  drawWoodenFence(bgCtx, 1265, OY + 198, 74);
  drawWoodenFence(bgCtx, 1265, OY + 268, 74);
  drawCrossroadsSign(bgCtx, OX + 296, OY + 232);
  drawCrossroadsSign(bgCtx, 345, 480);
  drawCrossroadsSign(bgCtx, 1245, OY + 218);
  drawNoticeBoard(bgCtx, OX + 526, OY + 262);

  // 10. Clustered Wildflower Beds, Ferns & Mossy Pebbles along paths & cliffs
  drawMeadowFlowersAndRocks(bgCtx);
}

// ============================================================================
// SCULPTED LIMESTONE CLIFF & BOULDER ENGINE
// ============================================================================
function drawSculptedBoulder(c, cx, cy, rx, ry, seed = 1, isWet = false, hasMossCap = true) {
  const minX = Math.floor(cx - rx - 3);
  const maxX = Math.ceil(cx + rx + 3);
  const minY = Math.floor(cy - ry - 3);
  const maxY = Math.ceil(cy + ry + 3);

  const rockRamp = [
    PAL.rockDeep, PAL.rockShade2, PAL.rockShade1,
    PAL.rockMid2, PAL.rockMid1, PAL.rockLit1, PAL.rockLit2
  ];

  c.fillStyle = 'rgba(14, 18, 26, 0.36)';
  c.beginPath();
  c.ellipse(cx + 1, cy + ry * 0.72, rx * 0.96, ry * 0.45, 0, 0, Math.PI * 2);
  c.fill();

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      const n = fbm(x * 0.11 + seed, y * 0.11 + seed);
      const dist = Math.hypot(nx, ny) + (n - 0.5) * 0.28;

      if (dist <= 1.0) {
        if (dist > 0.87) {
          c.fillStyle = PAL.rockDeep;
          c.fillRect(x, y, 1, 1);
          continue;
        }
        if (isWet && ny > 0.35) {
          c.fillStyle = ny > 0.62 ? PAL.rockDeep : PAL.rockWet;
          c.fillRect(x, y, 1, 1);
          continue;
        }
        if (hasMossCap && ny < -0.28 + (n - 0.5) * 0.35) {
          c.fillStyle = ny < -0.55 ? PAL.grassSun1 : PAL.grassMid1;
          c.fillRect(x, y, 1, 1);
          continue;
        }

        const light = Math.max(0.05, Math.min(0.95, 0.52 - nx * 0.32 - ny * 0.38 + (n - 0.5) * 0.28));
        const crack = Math.abs(((x * 0.17 + y * 0.08 + n * 1.9) % 1) - 0.5);
        if (crack < 0.045) {
          c.fillStyle = PAL.rockShade2;
        } else {
          c.fillStyle = bayerDither(x, y, light, rockRamp);
        }
        c.fillRect(x, y, 1, 1);
      }
    }
  }
}

function drawOrganicCliffBand(c, xStart, xEnd, topFn, heightFn, lightBias = 0.0, drawWaterline = false) {
  const rockRamp = [
    PAL.rockDeep, PAL.rockShade2, PAL.rockShade1,
    PAL.rockMid2, PAL.rockMid1, PAL.rockLit1, PAL.rockLit2
  ];

  // Octopath-style 2.5D Stepped Voxel/Terrace Block Quantization (14px faceted columns)
  const stepBlockW = 14;

  for (let x = xStart; x <= xEnd; x++) {
    const blockIdx = Math.floor(x / stepBlockW);
    const localBlockX = ((x % stepBlockW) + stepBlockW) % stepBlockW;
    const blockCenterX = blockIdx * stepBlockW + stepBlockW * 0.5;

    // Combine smooth curve with stepped 2.5D terrace blocks for authentic HD-2D diorama geometry
    const smoothTop = topFn(x);
    const steppedTop = topFn(blockCenterX);
    const topY = Math.floor(smoothTop * 0.45 + steppedTop * 0.55);
    const h = Math.max(14, Math.floor(heightFn(x)));
    const botY = topY + h;

    // 3D Facet Normal: Left face of each 14px block catches warm sunlight, right face falls into deep shadow
    const facetNormal = localBlockX < 4 ? 0.16 : (localBlockX > 10 ? -0.18 : 0.02);
    const isBlockSeam = localBlockX === 0 || localBlockX === stepBlockW - 1;
    const slope = topFn(x + 2) - topFn(x - 2);
    const slopeLight = Math.max(-0.22, Math.min(0.22, -slope * 0.06)) + lightBias + facetNormal;

    // Deep 2.5D Diorama Cast Shadow & Ambient Occlusion at the cliff base
    c.fillStyle = 'rgba(8, 11, 18, 0.58)';
    c.fillRect(x, botY, 1, 4);
    c.fillStyle = 'rgba(12, 16, 26, 0.34)';
    c.fillRect(x, botY + 4, 1, 6);

    // Lush 3D Thick Grass & Golden-Olive Turf Lip overhanging the stepped cliff edge
    const overhang = 6 + Math.floor(fbm(blockIdx * 0.45, topY * 0.12) * 7);
    for (let my = topY - 4; my < topY + overhang; my++) {
      if (my < 0 || my >= H) continue;
      const mossDepth = (my - (topY - 4)) / (overhang + 4);
      if (mossDepth < 0.24) c.fillStyle = localBlockX < 9 ? PAL.grassSun2 : PAL.grassSun1;
      else if (mossDepth < 0.52) c.fillStyle = localBlockX < 10 ? PAL.grassSun1 : PAL.grassMid1;
      else if (mossDepth < 0.78) c.fillStyle = PAL.grassMid2;
      else if (mossDepth < 0.90) c.fillStyle = PAL.grassShade2;
      else c.fillStyle = '#141820'; // Deep AO under-lip shadow
      c.fillRect(x, my, 1, 1);
    }

    // 3D Striated Earth & Limestone Faceted Wall with Stepped Horizontal Ledges
    for (let y = topY + overhang; y < botY; y++) {
      if (y < 0 || y >= H) continue;
      const vRatio = (y - topY) / h;
      const n = fbm(x * 0.09, y * 0.06);
      const midStepY = Math.floor(topY + h * 0.54 + Math.sin(blockIdx * 1.3) * 4);
      const isMidGrassShelf = Math.abs(y - midStepY) <= 2 && (blockIdx % 2 === 0);
      const ledgeWave = Math.sin(y * 0.32 + fbm(x * 0.06, 0) * 5.0);
      const fissure = Math.abs(((x * 0.11 + n * 2.1) % 1) - 0.5);

      if (drawWaterline && y > botY - 5) {
        c.fillStyle = y > botY - 3 ? PAL.rockDeep : PAL.rockWet;
        c.fillRect(x, y, 1, 1);
        continue;
      }

      if (isMidGrassShelf) {
        c.fillStyle = (y === midStepY - 2) ? PAL.grassSun1 : (y === midStepY - 1 ? PAL.grassMid1 : PAL.grassShade2);
        c.fillRect(x, y, 1, 1);
        continue;
      }

      if (isBlockSeam || fissure < 0.042 || ledgeWave > 0.86) {
        c.fillStyle = (isBlockSeam && localBlockX === stepBlockW - 1) || fissure < 0.024 ? PAL.rockDeep : PAL.rockShade2;
      } else {
        // Dark AO band immediately under the grass overhang and near the cliff foot
        const topAO = vRatio < 0.16 ? -0.22 : 0;
        const botAO = vRatio > 0.82 ? -0.18 : 0;
        let lum = 0.50 + slopeLight + topAO + botAO + (n - 0.5) * 0.24 - vRatio * 0.22;
        if (ledgeWave < -0.58) lum += 0.16;
        lum = Math.max(0.05, Math.min(0.96, lum));
        c.fillStyle = bayerDither(x, y, lum, rockRamp);
      }
      c.fillRect(x, y, 1, 1);
    }

    if (x % 7 === 0 && hash2D(x, topY) > 0.38) {
      const vineLen = 8 + Math.floor(hash2D(x, topY + 9) * 16);
      for (let vy = 0; vy < vineLen; vy++) {
        const vx = x + Math.round(Math.sin(vy * 0.45 + x) * 1);
        const py = topY + overhang + vy;
        if (py >= 0 && py < H) {
          c.fillStyle = vy % 3 === 0 ? PAL.grassSun1 : (vy % 2 === 0 ? PAL.grassMid1 : PAL.grassShade1);
          c.fillRect(vx, py, 1, 1);
        }
      }
    }
  }
}

function drawAllCliffFormations(c) {
  // 0. Far Northern World Boundary Ridge across 0..1600
  drawOrganicCliffBand(
    c, 0, W - 1,
    (x) => 12 + Math.sin(x * 0.015) * 8 + fbm(x * 0.04, 0.5) * 12,
    (x) => 48 + Math.cos(x * 0.02) * 10,
    0.04, false
  );

  // 1. Continuous Upper-West & Ruins Cliff Terrace (X: 20 .. OX+358)
  drawOrganicCliffBand(
    c, 20, OX + 358,
    (x) => OY + 14 + Math.sin((x - OX) * 0.02) * 12 + (x > OX + 280 ? (x - (OX + 280)) * 0.48 : 0) + fbm(x * 0.05, 1.1) * 10,
    (x) => 78 + Math.sin((x - OX) * 0.045) * 16 + (x < OX + 95 ? 20 : 0),
    -0.04, false
  );
  drawOrganicCliffBand(
    c, OX + 275, OX + 365,
    (x) => OY + 56 + (x - (OX + 275)) * 0.32 + fbm(x * 0.08, 2.3) * 8,
    (x) => 56 + Math.sin((x - OX) * 0.08) * 10,
    0.04, true
  );

  // 2. Continuous Upper-Right Waterfall & East Highland Cliff Terrace (OX+432 .. 1560)
  drawOrganicCliffBand(
    c, OX + 432, 1560,
    (x) => OY + 10 + Math.cos((x - (OX + 430)) * 0.022) * 14 + fbm(x * 0.06, 3.7) * 9,
    (x) => 64 + Math.sin((x - OX) * 0.04) * 12,
    0.07, false
  );
  drawOrganicCliffBand(
    c, OX + 438, OX + 575,
    (x) => OY + 54 + Math.sin((x - (OX + 440)) * 0.04) * 10 + (x > OX + 520 ? (x - (OX + 520)) * 0.25 : 0) + fbm(x * 0.07, 4.2) * 8,
    (x) => 54 + Math.cos((x - OX) * 0.06) * 12,
    0.06, true
  );

  // 3. Lower-Center Ravine Rim & Gorge Walls (Ends cleanly at OX+675 right beside the Southeast Stairs!)
  drawOrganicCliffBand(
    c, OX + 95, OX + 675,
    (x) => {
      const lx = x - OX;
      const arch = lx < 430
        ? OY + 350 - Math.sin((Math.max(0, lx - 188) / 242) * Math.PI) * 24
        : OY + 332 + ((lx - 430) / 245) * 28;
      return arch + fbm(x * 0.07, 6.4) * 8;
    },
    (x) => {
      const lx = x - OX;
      const inGap = lx > 330 && lx < 465;
      return (inGap ? 48 : 62) + fbm(x * 0.09, 7.1) * 12;
    },
    -0.02, true
  );

  // Lower-Left & Lower-Right Stepped Ledges flanking the bottom stream
  drawOrganicCliffBand(
    c, OX + 225, OX + 365,
    (x) => OY + 382 + ((x - (OX + 225)) / 140) * 26 + fbm(x * 0.09, 8.5) * 7,
    (x) => 68,
    -0.06, true
  );
  drawOrganicCliffBand(
    c, OX + 435, OX + 595,
    (x) => OY + 398 - ((x - (OX + 435)) / 160) * 22 + fbm(x * 0.09, 9.2) * 7,
    (x) => 68,
    0.05, true
  );

  // Sculpted Limestone Talus Boulders along cliff bases
  const cliffBoulders = [
    [OX + 352, OY + 124, 16, 11, 1.2, true, true],
    [OX + 368, OY + 148, 13, 9,  2.4, true, false],
    [OX + 444, OY + 118, 17, 12, 3.1, true, true],
    [OX + 458, OY + 146, 14, 10, 4.5, true, true],
    [OX + 286, OY + 196, 15, 11, 5.7, false, true],
    [OX + 340, OY + 394, 18, 12, 6.3, true, true],
    [OX + 452, OY + 402, 19, 13, 7.8, true, true],
    [OX + 478, OY + 420, 15, 11, 8.4, true, false],
    [195, OY + 110, 22, 15, 10.2, false, true],
    [1380, OY + 95, 24, 16, 11.4, false, true]
  ];
  for (const [bx, by, rx, ry, seed, wet, moss] of cliffBoulders) {
    drawSculptedBoulder(c, bx, by, rx, ry, seed, wet, moss);
  }
}

// ============================================================================
// EXPANDED 2 MONSTER HABITAT BIOMES (FLORA & AQUA SANCTUARIES)
// ============================================================================
function drawHabitatSurveyPost(c, hx, hy, accentColor) {
  c.fillStyle = 'rgba(12, 16, 24, 0.42)';
  c.fillRect(hx - 6, hy + 2, 14, 4);
  c.fillStyle = '#24150c';
  c.fillRect(hx - 3, hy - 20, 7, 23);
  c.fillStyle = '#8c6041';
  c.fillRect(hx - 2, hy - 19, 5, 21);
  c.fillStyle = '#181824';
  c.fillRect(hx - 8, hy - 27, 17, 11);
  c.fillStyle = '#5c3c24';
  c.fillRect(hx - 7, hy - 26, 15, 9);
  c.fillStyle = accentColor;
  c.fillRect(hx - 5, hy - 24, 11, 5);
  c.fillStyle = '#ffffff';
  c.fillRect(hx - 3, hy - 23, 4, 2);
}

function drawMonsterHabitatsStatic(c) {
  // ==========================================================================
  // 1. EXPANDED FLORA SANCTUARY: LEMBAH RUBAH BERBUNGA (Center: 225, 540; rx: 215, ry: 195)
  // ==========================================================================
  {
    const hx = 225, hy = 540, rx = 215, ry = 195;
    const flowerPalette = ['#f472b6', '#fde047', '#f9a8d4', '#fff1f2', '#c4b5fd'];

    // Lush terraced flower meadow carpet across the expanded 430x390 sanctuary valley
    for (let y = hy - ry; y <= hy + ry; y++) {
      for (let x = hx - rx; x <= hx + rx; x++) {
        if (x < 8 || x >= W - 8 || y < 8 || y >= H - 8) continue;
        if (getPathWeight(x, y) > 0.34) continue;
        const n = fbm(x * 0.042, y * 0.042);
        const d = Math.hypot((x - hx) / rx, (y - hy) / ry) + (n - 0.5) * 0.25;
        if (d < 1.0) {
          if (d < 0.45) c.fillStyle = PAL.grassSun2;
          else if (d < 0.76) c.fillStyle = PAL.grassSun1;
          else c.fillStyle = PAL.grassMid1;
          c.fillRect(x, y, 1, 1);

          // Clustered wildflower patches
          const patchNoise = valueNoise(x * 0.12, y * 0.12);
          if (patchNoise > 0.64 && ((x + y) % 3 === 0)) {
            const fCol = flowerPalette[(Math.floor(x / 6) + Math.floor(y / 6)) % flowerPalette.length];
            c.fillStyle = PAL.grassShade1;
            c.fillRect(x, y + 1, 2, 2);
            c.fillStyle = fCol;
            c.fillRect(x, y, 2, 2);
          }
        }
      }
    }

    // Ancient Floral Mossy Stone Sanctuary Ring in the heart of the Expanded Valley (at 215, 545)
    for (let a = 0; a < 12; a++) {
      const ang = (a / 12) * Math.PI * 2;
      const sx = Math.round(215 + Math.cos(ang) * 44);
      const sy = Math.round(545 + Math.sin(ang) * 28);
      c.fillStyle = PAL.rockDeep;
      c.fillRect(sx - 5, sy, 10, 6);
      c.fillStyle = (a % 2 === 0) ? PAL.rockLit1 : PAL.rockMid1;
      c.fillRect(sx - 4, sy - 2, 8, 6);
      c.fillStyle = PAL.grassSun1;
      c.fillRect(sx - 3, sy - 3, 5, 2);
      c.fillStyle = '#f472b6';
      c.fillRect(sx, sy - 3, 2, 2);
    }

    // Sculpted Mossy Limestone Sanctuary Ledges & 5 Fox Burrows around the expanded perimeter
    const burrows = [
      { bx: hx - 115, by: hy - 88,  rx: 36, ry: 20, seed: 51.2 },
      { bx: hx + 82,  by: hy - 94,  rx: 34, ry: 19, seed: 53.7 },
      { bx: hx - 98,  by: hy + 96,  rx: 34, ry: 19, seed: 57.1 },
      { bx: hx + 95,  by: hy + 102, rx: 35, ry: 19, seed: 59.4 },
      { bx: hx - 145, by: hy + 12,  rx: 32, ry: 18, seed: 61.8 }
    ];
    burrows.forEach(b => {
      drawSculptedBoulder(c, b.bx, b.by, b.rx, b.ry, b.seed, false, true);
      c.fillStyle = '#140d08';
      c.beginPath();
      c.ellipse(b.bx, b.by + 6, 13, 9, 0, Math.PI, 0, false);
      c.fill();
      c.fillStyle = '#472f1e';
      c.fillRect(b.bx - 14, b.by + 5, 28, 3);
      c.fillStyle = '#fde047';
      c.fillRect(b.bx - 5, b.by + 1, 2, 2);
      c.fillRect(b.bx + 3, b.by + 1, 2, 2);
    });

    // 2 Giant Fallen Hollow Sanctuary Log Bridges inside the expanded valley
    const drawHollowLog = (lx, ly) => {
      c.fillStyle = 'rgba(14, 18, 26, 0.42)';
      c.fillRect(lx - 4, ly + 10, 72, 9);
      c.fillStyle = '#2b190f';
      c.fillRect(lx - 6, ly - 12, 74, 24);
      c.fillStyle = '#6e472b';
      c.fillRect(lx - 4, ly - 10, 70, 20);
      c.fillStyle = '#8c5d3b';
      c.fillRect(lx - 4, ly - 8, 70, 6);
      c.fillStyle = '#52341e';
      c.fillRect(lx - 4, ly + 2, 70, 5);
      c.fillStyle = PAL.grassMid1;
      c.fillRect(lx + 4, ly - 12, 54, 6);
      c.fillStyle = PAL.grassSun1;
      c.fillRect(lx + 8, ly - 13, 44, 4);
      c.fillStyle = '#f472b6';
      c.fillRect(lx + 16, ly - 14, 3, 3);
      c.fillRect(lx + 36, ly - 13, 3, 3);
      c.fillStyle = '#170f09';
      c.fillRect(lx - 6, ly - 8, 8, 16);
      c.fillRect(lx + 60, ly - 8, 6, 16);
    };
    drawHollowLog(hx + 34, hy - 14);
    drawHollowLog(hx - 82, hy + 48);

    // Rich Sweet-Berry Groves scattered across the Expanded Flora Sanctuary
    const berryGroves = [
      [-145, -45], [-125, 42], [-45, -118], [32, -122],
      [135, -35],  [125, 58],  [38, 118],   [-135, 112],
      [-25, 95],   [148, 12],  [-165, -8],  [65, -48]
    ];
    berryGroves.forEach(([dx, dy]) => {
      const gx = hx + dx, gy = hy + dy;
      c.fillStyle = 'rgba(12,16,24,0.35)';
      c.fillRect(gx - 8, gy + 4, 16, 4);
      c.fillStyle = PAL.grassDeep;
      c.fillRect(gx - 8, gy - 6, 16, 11);
      c.fillStyle = PAL.grassShade1;
      c.fillRect(gx - 7, gy - 7, 14, 9);
      c.fillStyle = PAL.grassMid1;
      c.fillRect(gx - 5, gy - 8, 10, 6);
      c.fillStyle = PAL.grassSun1;
      c.fillRect(gx - 3, gy - 9, 6, 3);
      c.fillStyle = '#ef4444';
      c.fillRect(gx - 4, gy - 4, 2, 2);
      c.fillRect(gx + 2, gy - 3, 2, 2);
      c.fillRect(gx - 1, gy - 1, 2, 2);
      c.fillStyle = '#fde047';
      c.fillRect(gx, gy - 7, 2, 2);
    });

    // Sanctuary Wooden Archway & Survey Post at the eastern entrance
    drawHabitatSurveyPost(c, hx + 96, hy + 28, '#4ade80');
  }

  // ==========================================================================
  // 2. EXPANDED AQUA SANCTUARY: DANAU & LAGUNA TERATAI KRISTAL (Center: 545, 132; rx: 235, ry: 105)
  // ==========================================================================
  {
    const hx = 545, hy = 132;
    // Carve a vast multi-basin alpine crystal lake across the northern highland (X: 300..780)
    for (let y = hy - 96; y <= hy + 92; y++) {
      for (let x = hx - 245; x <= hx + 235; x++) {
        if (x < 8 || x >= W - 8 || y < 8 || y >= H - 8) continue;
        const n = fbm(x * 0.075, y * 0.075);
        const dMain = Math.hypot((x - 555) / 172, (y - 132) / 68) + (n - 0.5) * 0.14;
        const dWest = Math.hypot((x - 395) / 96,  (y - 140) / 52) + (n - 0.5) * 0.14;
        const dEast = Math.hypot((x - 695) / 86,  (y - 126) / 44) + (n - 0.5) * 0.14;
        const d = Math.min(dMain, dWest, dEast);

        if (d <= 1.12 && d > 0.96) {
          c.fillStyle = d > 1.05 ? PAL.grassSun1 : (d > 1.0 ? PAL.rockLit1 : PAL.rockMid1);
          c.fillRect(x, y, 1, 1);
        } else if (d <= 0.96) {
          if (d > 0.84) c.fillStyle = PAL.waterLight;
          else if (d > 0.50) c.fillStyle = PAL.waterMid;
          else c.fillStyle = PAL.waterDeep;
          c.fillRect(x, y, 1, 1);
        }
      }
    }

    // 2 Mossy Limestone Sanctuary Islands inside the Expanded Lagoon (555, 135 and 415, 128)
    drawSculptedBoulder(c, 555, 135, 29, 18, 60.5, true, true);
    drawSculptedBoulder(c, 415, 128, 21, 14, 63.2, true, true);

    // Glowing Aqua Crystal Obelisks on both islands
    const drawCrystalSpire = (cx, cy, h) => {
      c.fillStyle = '#0c4a6e';
      c.fillRect(cx - 5, cy - h, 10, h + 2);
      c.fillStyle = '#38bdf8';
      c.fillRect(cx - 4, cy - h - 2, 8, h + 2);
      c.fillStyle = '#bae6fd';
      c.fillRect(cx - 2, cy - h, 4, h - 2);
      c.fillStyle = '#ffffff';
      c.fillRect(cx - 1, cy - h + 1, 2, Math.max(4, h - 6));
    };
    drawCrystalSpire(555, 128, 15);
    drawCrystalSpire(415, 122, 11);

    // Decorative wet limestone boulders around the expanded lagoon perimeter
    const lagoonRocks = [
      [318, 124, 16, 11, 61.4], [472, 74,  18, 12, 62.8],
      [628, 76,  16, 11, 64.1], [728, 156, 17, 11, 65.9],
      [352, 178, 15, 10, 67.3], [512, 192, 15, 9,  68.7]
    ];
    lagoonRocks.forEach(([bx, by, rx, ry, s]) => {
      drawSculptedBoulder(c, bx, by, rx, ry, s, true, true);
    });

    drawHabitatSurveyPost(c, 645, 184, '#38bdf8');
  }
}

// Carved Sloped Cliffside Staircase with Stone Retaining Balustrades & Moss
function drawCliffsideStairs(c, sx, sy, sw, sh, totalSlopeX = 10) {
  const steps = 10;
  const stepH = sh / steps;

  // 1. Recessed dark cliff cut & ambient shadow beneath the staircase
  c.fillStyle = 'rgba(12, 16, 24, 0.45)';
  c.beginPath();
  c.moveTo(sx - 8, sy + 2);
  c.lineTo(sx + sw + 8, sy + 2);
  c.lineTo(sx + sw + totalSlopeX + 10, sy + sh + 4);
  c.lineTo(sx + totalSlopeX - 10, sy + sh + 4);
  c.closePath();
  c.fill();

  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const y = Math.floor(sy + i * stepH);
    const h = Math.ceil(stepH);
    const xOff = Math.round(t * totalSlopeX);
    const curX = sx + xOff;

    // 2. Stepped stone retaining side-walls (parapets/balustrades) carved into the cliff slope
    c.fillStyle = PAL.rockDeep;
    c.fillRect(curX - 7, y - 3, 7, h + 5);
    c.fillRect(curX + sw, y - 3, 7, h + 5);

    c.fillStyle = PAL.rockShade1;
    c.fillRect(curX - 6, y - 2, 6, h + 3);
    c.fillRect(curX + sw, y - 2, 6, h + 3);

    c.fillStyle = PAL.rockLit1;
    c.fillRect(curX - 6, y - 2, 5, 3);
    c.fillRect(curX + sw + 1, y - 2, 5, 3);

    // Moss cap on the side parapet stones
    if (i % 2 === 0) {
      c.fillStyle = PAL.grassMid1;
      c.fillRect(curX - 6, y - 3, 4, 2);
      c.fillRect(curX + sw + 2, y - 3, 4, 2);
    }

    // 3. Stone step tread, sunlit front edge & deep riser shadow
    c.fillStyle = PAL.rockDeep;
    c.fillRect(curX, y, sw, h + 1);

    c.fillStyle = (i % 2 === 0) ? PAL.rockLit1 : PAL.rockMid1;
    c.fillRect(curX + 1, y + 1, sw - 2, Math.max(2, h - 3));

    // Sunlit front nosing highlight
    c.fillStyle = PAL.rockLit2;
    c.fillRect(curX + 2, y + 1, sw - 4, 2);

    // Riser shadow at the bottom of each step
    c.fillStyle = PAL.rockShade2;
    c.fillRect(curX + 1, y + h - 2, sw - 2, 2);

    // Vertical stone block joints & creeping moss on step corners
    const jointX = curX + 12 + ((i * 17) % Math.max(8, sw - 24));
    c.fillStyle = PAL.rockShade2;
    c.fillRect(jointX, y + 1, 1, h - 2);

    c.fillStyle = (i % 3 === 0) ? PAL.grassSun1 : PAL.grassMid1;
    c.fillRect(curX + 1, y + 2, 4, 3);
    c.fillRect(curX + sw - 5, y + 2, 4, 3);
  }
}

function drawCobblestonePath(c) {
  for (let i = 0; i < 195; i++) {
    const cx = OX + 695 + (i % 13) * 7 + (hash2D(i, 1) * 3 - 1.5);
    const cy = OY + 206 + Math.floor(i / 13) * 5.2 + (hash2D(i, 2) * 2 - 1);
    c.fillStyle = PAL.rockDeep;
    c.fillRect(cx, cy + 1, 6, 4);
    c.fillStyle = (i % 3 === 0) ? PAL.rockLit2 : ((i % 2 === 0) ? PAL.rockLit1 : PAL.rockMid1);
    c.fillRect(cx, cy, 5, 3);
  }
  for (let i = 0; i < 65; i++) {
    const angle = (i / 65) * Math.PI * 2;
    const rad = 18 + (i % 3) * 6;
    const cx = 1392 + Math.cos(angle) * rad;
    const cy = OY + 220 + Math.sin(angle) * (rad * 0.7);
    c.fillStyle = PAL.rockDeep;
    c.fillRect(cx, cy + 1, 5, 4);
    c.fillStyle = (i % 2 === 0) ? PAL.rockLit1 : PAL.rockMid1;
    c.fillRect(cx, cy, 4, 3);
  }
}

function drawAncientRuins(c) {
  const rx = OX + 96, ry = OY + 8, rw = 192, rh = 132;
  c.fillStyle = 'rgba(14, 18, 28, 0.42)';
  c.fillRect(rx - 4, ry + rh - 4, rw + 10, 10);

  for (let y = ry; y < ry + rh; y++) {
    for (let x = rx; x < rx + rw; x++) {
      const brickH = 9;
      const brickW = 18;
      const row = Math.floor((y - ry) / brickH);
      const offset = (row % 2) * 9;
      const isMortar = ((y - ry) % brickH === 0) || (((x - rx + offset) % brickW) === 0);
      const n = hash2D(Math.floor((x + offset) / brickW), row);

      if (isMortar) {
        c.fillStyle = PAL.rockDeep;
      } else if (n > 0.72) {
        c.fillStyle = PAL.rockLit1;
      } else if (n > 0.36) {
        c.fillStyle = PAL.rockMid1;
      } else {
        c.fillStyle = PAL.rockMid2;
      }
      c.fillRect(x, y, 1, 1);
    }
  }

  c.fillStyle = PAL.rockLit2;
  c.fillRect(rx - 4, ry + 26, rw + 8, 5);
  c.fillStyle = PAL.rockShade2;
  c.fillRect(rx - 4, ry + 31, rw + 8, 3);

  const drawSideNiche = (nx, ny) => {
    c.fillStyle = PAL.rockDeep;
    c.fillRect(nx, ny, 24, 44);
    c.fillStyle = '#181824';
    c.fillRect(nx + 3, ny + 4, 18, 38);
    c.fillStyle = '#6e473b';
    c.fillRect(nx + 7, ny + 14, 10, 18);
    c.fillStyle = '#d4a359';
    c.fillRect(nx + 9, ny + 17, 6, 10);
  };
  drawSideNiche(rx + 18, ry + 68);
  drawSideNiche(rx + rw - 42, ry + 68);

  const ax = rx + 64, ay = ry + 36, aw = 64, ah = 96;
  c.fillStyle = PAL.rockLit1;
  c.fillRect(ax - 7, ay - 6, aw + 14, ah + 6);
  c.fillStyle = PAL.rockShade1;
  c.fillRect(ax - 3, ay - 2, aw + 6, ah + 2);

  for (let py = 0; py < ah; py++) {
    for (let px = 0; px < aw; px++) {
      const dx = (px - aw / 2) / (aw / 2);
      const dy = (py - 28) / 28;
      if (py < 28 && (dx * dx + dy * dy) > 1.0) continue;
      const distCenter = Math.hypot(px - aw / 2, py - ah * 0.55);
      if (distCenter < 18) c.fillStyle = '#3b2d23';
      else if (distCenter < 30) c.fillStyle = '#251e1c';
      else c.fillStyle = '#141218';
      c.fillRect(ax + px, ay + py, 1, 1);
    }
  }

  for (let py = 12; py < ah - 8; py += 9) {
    c.fillStyle = '#38bdf8';
    c.fillRect(ax - 5, ay + py, 2, 5);
    c.fillRect(ax + aw + 3, ay + py, 2, 5);
  }

  for (let s = 0; s < 5; s++) {
    c.fillStyle = s % 2 === 0 ? PAL.rockLit1 : PAL.rockMid1;
    c.fillRect(ax - s * 3, ry + rh + s * 4, aw + s * 6, 4);
    c.fillStyle = PAL.rockDeep;
    c.fillRect(ax - s * 3, ry + rh + s * 4 + 3, aw + s * 6, 1);
  }

  for (let x = rx - 4; x < rx + rw + 4; x += 2) {
    const vineH = 10 + Math.floor(fbm(x * 0.09, 2.5) * 28);
    for (let vy = 0; vy < vineH; vy++) {
      c.fillStyle = vy < vineH * 0.4 ? PAL.grassSun1 : (vy < vineH * 0.75 ? PAL.grassMid1 : PAL.grassShade1);
      c.fillRect(x, ry + vy, 2, 2);
    }
  }
}

function drawVillageCottage(c) {
  const cx = OX + 602, cy = OY + 92;

  // 1. 3D Directional Cast Shadow on Ground (Skewed right-down like Octopath Traveler)
  c.fillStyle = 'rgba(8, 12, 20, 0.52)';
  c.beginPath();
  c.moveTo(cx - 6, cy + 92);
  c.lineTo(cx + 162, cy + 92);
  c.lineTo(cx + 194, cy + 112);
  c.lineTo(cx + 12, cy + 112);
  c.closePath();
  c.fill();

  // 2. Stepped Dressed-Stone Foundation Plinth with Deep Mortar Joints
  c.fillStyle = '#1e1d28';
  c.fillRect(cx + 2, cy + 82, 156, 22);
  for (let sy = cy + 84; sy < cy + 102; sy += 6) {
    for (let sx = cx + 4; sx < cx + 154; sx += 12) {
      const stShift = ((sy - cy) % 12 === 0) ? 0 : 6;
      c.fillStyle = ((sx + sy) % 3 === 0) ? PAL.rockLit1 : PAL.rockMid1;
      c.fillRect(sx + stShift, sy, 10, 4);
      c.fillStyle = PAL.rockShade2;
      c.fillRect(sx + stShift, sy + 4, 10, 1);
    }
  }

  // 3. Octopath-Style Half-Timbered Tudor Plaster Walls & Diagonal Wood Bracing
  c.fillStyle = '#24170f';
  c.fillRect(cx + 6, cy + 40, 148, 46);
  // Warm aged cream-ochre plaster panels with subtle vertical grain
  for (let py = cy + 42; py < cy + 84; py++) {
    for (let px = cx + 8; px < cx + 152; px++) {
      const gr = hash2D(px, py);
      c.fillStyle = py < cy + 50 ? '#b0916e' : (gr > 0.65 ? '#dfd0b4' : (gr > 0.25 ? '#cbb898' : '#b8a282'));
      c.fillRect(px, py, 1, 1);
    }
  }
  // Heavy Dark Oak Vertical & Horizontal Timber Beams
  c.fillStyle = '#3b2416';
  const vBeams = [cx + 6, cx + 26, cx + 74, cx + 96, cx + 148];
  vBeams.forEach(bx => {
    c.fillRect(bx, cy + 40, 5, 46);
    c.fillStyle = '#593822';
    c.fillRect(bx + 1, cy + 40, 2, 46);
    c.fillStyle = '#3b2416';
  });
  c.fillRect(cx + 6, cy + 40, 148, 5);
  c.fillRect(cx + 6, cy + 62, 92, 4);
  c.fillRect(cx + 6, cy + 82, 148, 4);

  // Diagonal Tudor Timber Bracing (`/` and `\`) on wall bays
  for (let i = 0; i < 16; i++) {
    c.fillStyle = '#472c1b';
    c.fillRect(cx + 11 + i, cy + 45 + i, 3, 2);
    c.fillRect(cx + 24 - i, cy + 66 + i, 3, 2);
    c.fillRect(cx + 79 + i * 0.8, cy + 45 + i, 3, 2);
    c.fillRect(cx + 93 - i * 0.8, cy + 66 + i, 3, 2);
  }

  // 4. Steeply Pitched 3D Layered Shingle/Thatch Roof with Moss Overgrowth & Dormer Window
  for (let row = 0; row < 14; row++) {
    const ry = cy - 4 + row * 3.5;
    const overhang = row * 1.65;
    const rx = cx - 6 - overhang;
    const rw = 114 + overhang * 1.25;
    // Deep shadow under roof eaves
    c.fillStyle = '#18202c';
    c.fillRect(rx, ry + 3, rw, 2);
    for (let tx = rx; tx < rx + rw; tx += 6) {
      const n = hash2D(tx, row);
      const isMossy = row < 5 && n > 0.52;
      if (isMossy) {
        c.fillStyle = row < 2 ? PAL.grassSun1 : PAL.grassMid1;
      } else {
        c.fillStyle = row % 2 === 0
          ? (n > 0.5 ? '#546e8f' : '#3e5370')
          : (n > 0.5 ? '#6480a3' : '#485f7d');
      }
      c.fillRect(tx, ry, 5, 3.5);
    }
  }
  // Roof Ridge Crest Beam & Golden Highlight
  c.fillStyle = '#23170f';
  c.fillRect(cx - 6, cy - 7, 114, 4);
  c.fillStyle = '#8fa6c4';
  c.fillRect(cx - 5, cy - 6, 112, 2);

  // 3D Dormer Window on Left Roof Slope (just like Octopath Traveler houses!)
  const dwx = cx + 34, dwy = cy + 6;
  c.fillStyle = '#24170f';
  c.fillRect(dwx - 2, dwy, 28, 22);
  c.fillStyle = '#cbb898';
  c.fillRect(dwx, dwy + 4, 24, 16);
  // Dormer pitched rooflet
  for (let i = 0; i < 8; i++) {
    const span = 30 - i * 3;
    c.fillStyle = i % 2 === 0 ? '#6480a3' : '#3e5370';
    c.fillRect(dwx + 12 - span / 2, dwy + 4 - i * 1.5, span, 2);
  }
  // Glowing dormer window & teal wooden shutters
  c.fillStyle = '#2b6e68'; // Teal shutters
  c.fillRect(dwx + 2, dwy + 7, 4, 10);
  c.fillRect(dwx + 18, dwy + 7, 4, 10);
  c.fillStyle = '#fde047';
  c.fillRect(dwx + 6, dwy + 7, 12, 10);
  c.fillStyle = '#3b2416';
  c.fillRect(dwx + 11, dwy + 7, 2, 10);
  c.fillRect(dwx + 6, dwy + 11, 12, 2);

  // Right Gable Wing with 3D Timber Framing
  const gx = cx + 92, gy = cy + 4, gw = 68;
  for (let i = 0; i < 22; i++) {
    const span = (i / 22) * gw;
    c.fillStyle = i < 4 ? '#3b2416' : (i % 4 === 0 ? '#8c6240' : '#cbb898');
    c.fillRect(gx + (gw - span) / 2, gy + i * 1.85, span, 2.2);
  }
  c.fillStyle = '#243247';
  for (let i = 0; i < 22; i++) {
    const span = (i / 22) * (gw + 12);
    c.fillRect(gx + (gw - span) / 2 - 3, gy + i * 1.85 - 2, 6, 3);
    c.fillRect(gx + (gw + span) / 2 - 3, gy + i * 1.85 - 2, 6, 3);
  }
  // Upper gable window with teal shutters
  c.fillStyle = '#2b6e68';
  c.fillRect(gx + 21, gy + 18, 5, 12);
  c.fillRect(gx + 42, gy + 18, 5, 12);
  c.fillStyle = '#fde047';
  c.fillRect(gx + 26, gy + 18, 16, 12);
  c.fillStyle = '#3b2416';
  c.fillRect(gx + 33, gy + 18, 2, 12);
  c.fillRect(gx + 26, gy + 23, 16, 2);

  // Tall Stone Chimney with 3D Left-Lit / Right-Shaded Brickwork
  c.fillStyle = '#1e1d28';
  c.fillRect(cx + 113, cy - 16, 18, 34);
  c.fillStyle = PAL.rockLit1;
  c.fillRect(cx + 114, cy - 14, 9, 30);
  c.fillStyle = PAL.rockShade1;
  c.fillRect(cx + 123, cy - 14, 7, 30);
  c.fillStyle = PAL.rockDeep;
  c.fillRect(cx + 111, cy - 18, 22, 4);

  // Main Ground-Floor Glowing Window with Teal Louvered Shutters & Flower Box
  const wx = cx + 32, wy = cy + 52, ww = 38, wh = 22;
  c.fillStyle = '#1f4f4b'; // Teal shutter outer
  c.fillRect(wx - 9, wy - 1, 7, wh + 2);
  c.fillRect(wx + ww + 2, wy - 1, 7, wh + 2);
  c.fillStyle = '#38857e'; // Teal shutter highlight slats
  for (let sy = wy + 1; sy < wy + wh - 1; sy += 3) {
    c.fillRect(wx - 8, sy, 5, 1.5);
    c.fillRect(wx + ww + 3, sy, 5, 1.5);
  }
  c.fillStyle = '#2b190f';
  c.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);
  c.fillStyle = '#f59e0b';
  c.fillRect(wx, wy, ww, wh);
  c.fillStyle = '#fef08a';
  c.fillRect(wx + 2, wy + 2, ww - 4, wh - 4);
  c.fillStyle = '#ffffff';
  c.fillRect(wx + 5, wy + 4, ww - 14, wh - 10);
  c.fillStyle = '#3b2416';
  c.fillRect(wx + 12, wy, 2, wh);
  c.fillRect(wx + 25, wy, 2, wh);
  c.fillRect(wx, wy + 10, ww, 2);

  // Window Flower Planter Box with Shadow
  c.fillStyle = 'rgba(10, 14, 22, 0.45)';
  c.fillRect(wx - 5, wy + wh + 7, ww + 10, 4);
  c.fillStyle = '#472c1b';
  c.fillRect(wx - 4, wy + wh + 1, ww + 8, 7);
  c.fillStyle = PAL.grassMid1;
  c.fillRect(wx - 3, wy + wh - 1, ww + 6, 4);
  c.fillStyle = '#f472b6';
  c.fillRect(wx + 2, wy + wh - 2, 3, 3);
  c.fillRect(wx + 18, wy + wh - 2, 3, 3);
  c.fillStyle = '#fde047';
  c.fillRect(wx + 10, wy + wh - 2, 3, 3);
  c.fillRect(wx + 28, wy + wh - 2, 3, 3);

  // Arched Heavy Oak Cottage Door with Recessed Porch Shadow & Wall Lantern
  const dx = cx + 112, dy = cy + 52;
  c.fillStyle = '#180f09';
  c.fillRect(dx - 3, dy - 3, 26, 38);
  c.fillStyle = '#5c3a23';
  c.fillRect(dx, dy, 20, 34);
  c.fillStyle = '#754b2e';
  c.fillRect(dx + 2, dy + 2, 7, 30);
  c.fillRect(dx + 11, dy + 2, 7, 30);
  c.fillStyle = '#fde047';
  c.fillRect(dx + 5, dy + 6, 10, 8);
  c.fillStyle = '#3b2416';
  c.fillRect(dx + 9, dy + 6, 2, 8);
  c.fillStyle = '#fbbf24';
  c.fillRect(dx + 15, dy + 18, 3, 3);
  // Wall Sconce Lantern next to door
  c.fillStyle = '#1f1610';
  c.fillRect(dx - 9, dy + 8, 5, 8);
  c.fillStyle = '#fef08a';
  c.fillRect(dx - 8, dy + 10, 3, 5);

  // Tall Hanging Courtyard Lantern Post (Left of Cottage)
  c.fillStyle = 'rgba(10, 14, 22, 0.45)';
  c.fillRect(cx - 42, cy + 74, 16, 4);
  c.fillStyle = '#2b1a10';
  c.fillRect(cx - 40, cy + 26, 5, 50);
  c.fillRect(cx - 40, cy + 28, 19, 4);
  c.fillStyle = '#fef08a';
  c.fillRect(cx - 28, cy + 34, 7, 9);
  c.fillStyle = '#f59e0b';
  c.fillRect(cx - 29, cy + 32, 9, 3);
  c.fillRect(cx - 29, cy + 43, 9, 2);

  // Side Market Stall Awning & Stacked Barrels
  const mx = cx + 158, my = cy + 68;
  c.fillStyle = '#472c1b';
  c.fillRect(mx, my + 18, 38, 16);
  c.fillRect(mx + 2, my, 3, 32);
  c.fillRect(mx + 33, my, 3, 32);
  for (let i = 0; i < 6; i++) {
    c.fillStyle = i % 2 === 0 ? '#e2d9c8' : '#b85d43';
    c.fillRect(mx - 2 + i * 7, my - 4, 7, 12);
  }
}

// Central Village Hub Details (Neatly Spaced: Zero Overlapping Stalls, Trees, Lanterns, or NPCs!)
function drawCentralVillageHub(c) {
  // 1. Central Crossroads Cobblestone Plaza Ring & Underground Culvert Conduit Stones (around OX+398, OY+222)
  const px = OX + 398, py = OY + 222;
  for (let i = 0; i < 72; i++) {
    const ang = (i / 72) * Math.PI * 2;
    const ring = (i % 3 === 0) ? 24 : ((i % 2 === 0) ? 16 : 9);
    const sx = Math.floor(px + Math.cos(ang) * ring + (hash2D(i, 7) - 0.5) * 4);
    const sy = Math.floor(py + Math.sin(ang) * (ring * 0.62) + (hash2D(i, 13) - 0.5) * 3);
    c.fillStyle = PAL.rockDeep;
    c.fillRect(sx, sy + 1, 5, 4);
    c.fillStyle = (i % 2 === 0) ? PAL.rockLit1 : PAL.rockMid1;
    c.fillRect(sx, sy, 4, 3);
  }

  // Dressed Stone Underground Culvert Path & Iron Water Grates connecting the Upper Culvert (OY+148) to the Lower Culvert (OY+376)!
  for (let cy = OY + 158; cy <= OY + 340; cy += 10) {
    const t = (cy - (OY + 158)) / 182;
    const cx = Math.round(OX + 414 * (1 - t) + 392 * t);
    c.fillStyle = PAL.rockDeep;
    c.fillRect(cx - 14, cy, 28, 7);
    c.fillStyle = PAL.rockMid1;
    c.fillRect(cx - 13, cy + 1, 26, 5);
    c.fillStyle = PAL.rockLit1;
    c.fillRect(cx - 12, cy + 1, 10, 2);
    if (cy === OY + 188 || cy === OY + 248 || cy === OY + 298) {
      c.fillStyle = PAL.waterAbyss;
      c.fillRect(cx - 8, cy + 1, 16, 5);
      c.fillStyle = PAL.waterMid;
      c.fillRect(cx - 6, cy + 2, 12, 3);
      c.fillStyle = '#334155';
      for (let gx = cx - 6; gx <= cx + 6; gx += 3) {
        c.fillRect(gx, cy + 1, 1, 5);
      }
    }
  }

  // 2. Village Merchant Cart & Awning Stall neatly placed on the South-Central Roadside Terrace (OX+462, OY+258)
  const kx = OX + 462, ky = OY + 258;
  c.fillStyle = 'rgba(12, 16, 24, 0.42)';
  c.fillRect(kx - 4, ky + 16, 46, 8);
  c.fillStyle = '#2e1c11';
  c.fillRect(kx, ky + 2, 38, 16);
  c.fillStyle = '#7d5236';
  c.fillRect(kx + 2, ky + 4, 34, 12);
  c.fillStyle = '#a47551';
  c.fillRect(kx + 1, ky + 2, 36, 4);
  c.fillStyle = '#24140b';
  c.beginPath();
  c.arc(kx + 19, ky + 17, 7, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#8c5e3c';
  c.beginPath();
  c.arc(kx + 19, ky + 17, 5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#fde047';
  c.fillRect(kx + 18, ky + 16, 2, 2);
  c.fillStyle = '#3b2416';
  c.fillRect(kx + 2, ky - 16, 3, 20);
  c.fillRect(kx + 33, ky - 16, 3, 20);
  for (let i = 0; i < 6; i++) {
    c.fillStyle = (i % 2 === 0) ? '#c2593f' : '#f4ebd9';
    c.fillRect(kx - 2 + i * 7, ky - 22, 7, 9);
    c.fillStyle = (i % 2 === 0) ? '#963f2b' : '#d6c7b2';
    c.fillRect(kx - 2 + i * 7, ky - 13, 7, 3);
  }
  c.fillStyle = '#ef4444';
  c.fillRect(kx + 6, ky - 1, 5, 4);
  c.fillStyle = '#38bdf8';
  c.fillRect(kx + 16, ky - 2, 4, 5);
  c.fillStyle = '#f59e0b';
  c.fillRect(kx + 25, ky - 1, 6, 4);

  // 3. Village Traveler Rest Bench & Supply Barrels (Clean open lawn at OX+256, OY+156, zero tree overlap!)
  const rx = OX + 256, ry = OY + 156;
  c.fillStyle = 'rgba(12, 16, 24, 0.38)';
  c.fillRect(rx - 4, ry + 14, 42, 6);
  c.fillStyle = '#3b2416';
  c.fillRect(rx, ry + 6, 26, 9);
  c.fillStyle = '#9c6c49';
  c.fillRect(rx + 1, ry + 7, 24, 4);
  c.fillStyle = '#754d32';
  c.fillRect(rx + 1, ry + 3, 24, 3);

  const drawBarrel = (bx, by) => {
    c.fillStyle = 'rgba(12, 16, 24, 0.38)';
    c.fillRect(bx - 1, by + 10, 12, 3);
    c.fillStyle = '#2e1c11';
    c.fillRect(bx, by, 10, 12);
    c.fillStyle = '#85583a';
    c.fillRect(bx + 1, by + 1, 8, 10);
    c.fillStyle = '#475569';
    c.fillRect(bx, by + 3, 10, 2);
    c.fillRect(bx, by + 8, 10, 2);
    c.fillStyle = '#a67653';
    c.fillRect(bx + 2, by + 1, 6, 2);
  };
  drawBarrel(rx + 28, ry + 4);
  drawBarrel(OX + 594, OY + 178);

  // Woven Flower Planters placed neatly on open grass edges
  const drawFlowerBox = (fx, fy, col) => {
    c.fillStyle = '#3b2416';
    c.fillRect(fx, fy, 16, 7);
    c.fillStyle = '#7d5236';
    c.fillRect(fx + 1, fy + 1, 14, 5);
    c.fillStyle = PAL.grassMid1;
    c.fillRect(fx + 1, fy - 2, 14, 4);
    c.fillStyle = col;
    c.fillRect(fx + 3, fy - 3, 3, 3);
    c.fillRect(fx + 8, fy - 4, 3, 3);
    c.fillRect(fx + 12, fy - 3, 2, 2);
  };
  drawFlowerBox(OX + 538, OY + 182, '#f472b6');
  drawFlowerBox(OX + 642, OY + 190, '#fde047');

  // 4. Cozy Village Campfire & Log Seat (Moved to clean open meadow at OX+334, OY+170 — away from pine tree canopies!)
  const fx = OX + 334, fy = OY + 170;
  c.fillStyle = 'rgba(12, 16, 24, 0.42)';
  c.beginPath();
  c.ellipse(fx, fy + 3, 12, 7, 0, 0, Math.PI * 2);
  c.fill();
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    c.fillStyle = (a % 2 === 0) ? PAL.rockLit1 : PAL.rockShade1;
    c.fillRect(Math.round(fx + Math.cos(ang) * 8 - 2), Math.round(fy + Math.sin(ang) * 4.5 - 2), 4, 3);
  }
  c.fillStyle = '#3b2314';
  c.fillRect(fx - 6, fy - 1, 12, 3);
  c.fillStyle = '#ea580c';
  c.fillRect(fx - 4, fy - 3, 8, 4);
  c.fillStyle = '#fde047';
  c.fillRect(fx - 2, fy - 4, 4, 3);

  c.fillStyle = '#422817';
  c.fillRect(fx - 20, fy - 10, 14, 6);
  c.fillStyle = '#7d5236';
  c.fillRect(fx - 19, fy - 9, 12, 4);

  // 5. Warm Village Street Lantern Posts (Spaced cleanly along roadsides with zero overlap)
  const lanternPosts = [
    [OX + 445, OY + 188, -1], // North of Central Plaza
    [OX + 228, OY + 188, 1],  // Path toward Arka/Ruins
    [OX + 510, OY + 258, -1]  // Cleanly between Merchant Cart & Notice Board
  ];
  lanternPosts.forEach(([lx, ly, armDir]) => {
    c.fillStyle = 'rgba(12, 16, 24, 0.38)';
    c.fillRect(lx - 4, ly + 1, 10, 3);
    c.fillStyle = '#2e1c11';
    c.fillRect(lx - 1, ly - 28, 4, 30);
    c.fillStyle = '#5c3c24';
    c.fillRect(lx, ly - 27, 2, 28);
    const armX = armDir > 0 ? lx : lx - 9;
    c.fillStyle = '#3b2416';
    c.fillRect(armX, ly - 27, 11, 3);
    const lampX = armDir > 0 ? lx + 7 : lx - 9;
    c.fillStyle = '#f59e0b';
    c.fillRect(lampX - 1, ly - 24, 6, 2);
    c.fillStyle = '#fef08a';
    c.fillRect(lampX, ly - 22, 4, 6);
    c.fillStyle = '#ffffff';
    c.fillRect(lampX + 1, ly - 21, 2, 4);
    c.fillStyle = '#b45309';
    c.fillRect(lampX - 1, ly - 16, 6, 2);
  });
}

// ============================================================================
// SOUTHEAST DENSE TOWN CENTER & BUSTLING MARKET DISTRICT (X: 930..1575, Y: 530..875)
// Dirt Roads (Jalan Tanah) + 14 Non-Overlapping 2.5D HD-2D Town Buildings & Stalls!
// ============================================================================
function drawTownhouse25D(c, bx, by, bw, bh, roofColor = 'slate', hasTower = false, signIcon = '') {
  // 1. 3D Skewed Ground Cast Shadow (Compact so it never bleeds onto neighboring buildings)
  c.fillStyle = 'rgba(8, 12, 20, 0.48)';
  c.beginPath();
  c.moveTo(bx - 2, by + bh);
  c.lineTo(bx + bw + 2, by + bh);
  c.lineTo(bx + bw + 14, by + bh + 10);
  c.lineTo(bx + 6, by + bh + 10);
  c.closePath();
  c.fill();

  // 2. Dressed-Stone Plinth Foundation
  c.fillStyle = '#1b1a24';
  c.fillRect(bx, by + bh - 14, bw, 15);
  for (let sy = by + bh - 12; sy < by + bh; sy += 5) {
    for (let sx = bx + 2; sx < bx + bw - 4; sx += 10) {
      const off = ((sy % 10) === 0) ? 0 : 4;
      c.fillStyle = ((sx + sy) % 3 === 0) ? PAL.rockLit1 : PAL.rockMid1;
      c.fillRect(sx + off, sy, 8, 4);
    }
  }

  // 3. Half-Timbered Tudor Plaster Walls (2-Story Facade)
  c.fillStyle = '#24170f';
  c.fillRect(bx + 2, by + 22, bw - 4, bh - 34);
  for (let py = by + 24; py < by + bh - 14; py++) {
    for (let px = bx + 4; px < bx + bw - 4; px++) {
      const gr = hash2D(px, py);
      const isUpperOverhang = py < by + 30;
      c.fillStyle = isUpperOverhang ? '#9e7f5d' : (gr > 0.65 ? '#e4d5ba' : (gr > 0.25 ? '#cfbc9c' : '#baa482'));
      c.fillRect(px, py, 1, 1);
    }
  }

  // Heavy Oak Structural Pillars, Mid-Floor Jetty Beam & Diagonal Bracing
  const midY = by + Math.floor(bh * 0.54);
  c.fillStyle = '#3b2416';
  c.fillRect(bx + 2, by + 22, bw - 4, 4);
  c.fillRect(bx, midY, bw, 4);
  c.fillStyle = '#633e26';
  c.fillRect(bx + 1, midY + 1, bw - 2, 2);

  const bayStep = Math.max(18, Math.floor((bw - 6) / 3));
  for (let vx = bx + 2; vx <= bx + bw - 4; vx += bayStep) {
    c.fillStyle = '#3b2416';
    c.fillRect(vx, by + 22, 4, bh - 34);
    c.fillStyle = '#593822';
    c.fillRect(vx + 1, by + 22, 2, bh - 34);
  }
  c.fillStyle = '#3b2416';
  c.fillRect(bx + bw - 6, by + 22, 4, bh - 34);

  // Diagonal Tudor timber braces on upper story corners
  for (let i = 0; i < 10; i++) {
    c.fillStyle = '#472c1b';
    c.fillRect(bx + 6 + i, by + 26 + i, 3, 2);
    c.fillRect(bx + bw - 10 - i, by + 26 + i, 3, 2);
  }

  // 4. Steeply Pitched 3D Shingle Roof (Slate, Terracotta, Emerald, Amber, or Plum)
  const palettes = {
    slate:      ['#3b4f6b', '#4d6587', '#6380a6', '#8ba5c7'],
    terracotta: ['#6e2c22', '#8c3b2e', '#ab4b3c', '#cf6a59'],
    emerald:    ['#26473c', '#335e50', '#447867', '#629c89'],
    amber:      ['#5c3d1e', '#785027', '#966634', '#ba8349'],
    plum:       ['#4a2c40', '#633b56', '#7d4b6d', '#a36c91']
  };
  const rPal = palettes[roofColor] || palettes.slate;

  for (let row = 0; row < 10; row++) {
    const ry = by - 2 + row * 2.6;
    const overhang = row * 0.8;
    const rx = bx - 3 - overhang * 0.5;
    const rw = bw + 6 + overhang;
    c.fillStyle = '#151924';
    c.fillRect(rx, ry + 2.2, rw, 1.5);
    for (let tx = rx; tx < rx + rw; tx += 5) {
      const n = hash2D(tx, row);
      const isMoss = row < 3 && n > 0.65;
      c.fillStyle = isMoss ? PAL.grassMid1 : (row % 2 === 0 ? (n > 0.5 ? rPal[2] : rPal[1]) : (n > 0.5 ? rPal[1] : rPal[0]));
      c.fillRect(tx, ry, 4.5, 2.8);
    }
  }
  c.fillStyle = '#23170f';
  c.fillRect(bx - 3, by - 5, bw + 6, 4);
  c.fillStyle = rPal[3];
  c.fillRect(bx - 2, by - 4, bw + 4, 2);

  // Optional Center Gable / Clock-Bell Tower or Attic Dormer
  if (hasTower) {
    const gx = bx + Math.floor(bw / 2) - 20;
    const gy = by - 12;
    for (let i = 0; i < 18; i++) {
      const span = (i / 18) * 40;
      c.fillStyle = i < 4 ? '#3b2416' : '#cfbc9c';
      c.fillRect(gx + 20 - span / 2, gy + i * 1.8, span, 2.2);
    }
    c.fillStyle = '#1e293b';
    c.beginPath();
    c.arc(gx + 20, gy + 21, 7, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#fde047';
    c.beginPath();
    c.arc(gx + 20, gy + 21, 5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#1e293b';
    c.fillRect(gx + 19, gy + 17, 2, 5);
    c.fillRect(gx + 20, gy + 20, 4, 2);
  } else if (bw >= 80) {
    // Cozy Roof Dormer Window on mid-sized & large townhouses
    const dx0 = bx + Math.floor(bw * 0.32);
    const dy0 = by + 3;
    c.fillStyle = '#24170f';
    c.fillRect(dx0, dy0, 18, 14);
    c.fillStyle = '#cfbc9c';
    c.fillRect(dx0 + 2, dy0 + 3, 14, 10);
    c.fillStyle = '#fde047';
    c.fillRect(dx0 + 5, dy0 + 5, 8, 7);
    c.fillStyle = '#3b2416';
    c.fillRect(dx0 + 8, dy0 + 5, 2, 7);
  }

  // Stone Chimney
  c.fillStyle = PAL.rockShade1;
  c.fillRect(bx + bw - 18, by - 11, 11, 16);
  c.fillStyle = PAL.rockLit1;
  c.fillRect(bx + bw - 17, by - 10, 5, 14);
  c.fillStyle = PAL.rockDeep;
  c.fillRect(bx + bw - 19, by - 13, 13, 3);

  // Warm Glowing Windows with Teal Shutters & Flower Planters
  const winCount = Math.max(2, Math.floor((bw - 16) / 28));
  const winSpacing = Math.floor((bw - 18) / winCount);
  for (let w = 0; w < winCount; w++) {
    const wx = bx + 10 + w * winSpacing;
    // Upper Story Window
    c.fillStyle = '#2b6e68';
    c.fillRect(wx - 3, by + 28, 3, 9);
    c.fillRect(wx + 11, by + 28, 3, 9);
    c.fillStyle = '#fde047';
    c.fillRect(wx, by + 28, 11, 9);
    c.fillStyle = '#3b2416';
    c.fillRect(wx + 5, by + 28, 1.5, 9);
    c.fillRect(wx, by + 32, 11, 1.5);

    // Ground Floor Window (skip the rightmost bay where the door is placed)
    if (w < winCount - 1) {
      const gwy = by + bh - 31;
      c.fillStyle = '#2b6e68';
      c.fillRect(wx - 3, gwy, 3, 11);
      c.fillRect(wx + 13, gwy, 3, 11);
      c.fillStyle = '#f59e0b';
      c.fillRect(wx, gwy, 13, 11);
      c.fillStyle = '#fef08a';
      c.fillRect(wx + 2, gwy + 2, 9, 7);
      c.fillStyle = '#3b2416';
      c.fillRect(wx + 6, gwy, 1.5, 11);
      c.fillRect(wx, gwy + 5, 13, 1.5);
      // Window Planter Box
      c.fillStyle = '#472c1b';
      c.fillRect(wx - 1, gwy + 11, 15, 4);
      c.fillStyle = PAL.grassMid1;
      c.fillRect(wx, gwy + 9, 13, 3);
      c.fillStyle = (w % 2 === 0) ? '#f472b6' : '#fde047';
      c.fillRect(wx + 2, gwy + 8, 2, 2);
      c.fillRect(wx + 8, gwy + 8, 2, 2);
    }
  }

  // Heavy Oak Townhouse Door & Stone Doorstep
  const dx = bx + bw - 25;
  const dy = by + bh - 33;
  c.fillStyle = '#180f09';
  c.fillRect(dx - 2, dy - 2, 18, 25);
  c.fillStyle = '#5c3a23';
  c.fillRect(dx, dy, 14, 22);
  c.fillStyle = '#754b2e';
  c.fillRect(dx + 2, dy + 2, 4, 18);
  c.fillRect(dx + 8, dy + 2, 4, 18);
  c.fillStyle = '#fde047';
  c.fillRect(dx + 3, dy + 4, 8, 5);
  c.fillStyle = '#fbbf24';
  c.fillRect(dx + 10, dy + 12, 2, 2);
  // Stone Doorstep on the dirt street
  c.fillStyle = PAL.rockLit1;
  c.fillRect(dx - 3, by + bh - 2, 20, 4);

  // Hanging Wooden Guild/Shop Signboard
  if (signIcon) {
    c.fillStyle = '#24140b';
    c.fillRect(dx - 13, dy + 2, 11, 2);
    c.fillStyle = '#8c5e3c';
    c.fillRect(dx - 12, dy + 4, 9, 7);
    c.fillStyle = '#fde68a';
    c.fillRect(dx - 10, dy + 5, 5, 4);
  }
}

function drawSoutheastTownDistrict(c) {
  // 1. Subtle Dirt-Road Wheel Ruts, Stepping Stones & Scattered Market Pebbles along the Town Dirt Streets
  const townDirtStreets = [
    [945, 648, 1535, 648],
    [935, 768, 1535, 768],
    [1132, 648, 1132, 855],
    [1274, 550, 1274, 855],
    [1392, 540, 1392, 855]
  ];
  townDirtStreets.forEach(([x1, y1, x2, y2], idx) => {
    const steps = Math.floor(Math.hypot(x2 - x1, y2 - y1) / 14);
    for (let s = 0; s <= steps; s++) {
      const t = s / Math.max(1, steps);
      const px = Math.floor(x1 + (x2 - x1) * t + (hash2D(s, idx) - 0.5) * 8);
      const py = Math.floor(y1 + (y2 - y1) * t + (hash2D(idx, s) - 0.5) * 6);
      c.fillStyle = (s % 2 === 0) ? PAL.dirtShade : PAL.rockMid1;
      c.fillRect(px, py, 3, 2);
    }
  });

  // 2. Festive Overhead Town Bunting Pennants Strung Across the Dirt Streets
  const buntingLines = [
    [1128, 636, 1270, 640],
    [1280, 640, 1392, 636],
    [1035, 756, 1145, 760],
    [1275, 760, 1390, 756]
  ];
  const pennantCols = ['#ef4444', '#fde047', '#38bdf8', '#4ade80', '#f472b6'];
  buntingLines.forEach(([x1, y1, x2, y2]) => {
    c.strokeStyle = '#3b2416';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x1, y1);
    c.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + 9, x2, y2);
    c.stroke();
    for (let i = 1; i < 8; i++) {
      const t = i / 8;
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * 6;
      c.fillStyle = pennantCols[i % pennantCols.length];
      c.fillRect(px - 2, py, 4, 5);
    }
  });

  // 3. ROW 1: NORTH TOWN BLOCK (Y: 536..610 — Cleanly East of the Southeast Ravine Stairs X:1080..1148!)
  // (1) Grand Town Guild Hall & Clock Tower
  drawTownhouse25D(c, 1168, 536, 92, 74, 'slate', true, 'guild');
  // (2) Herbalist & Apothecary Shop
  drawTownhouse25D(c, 1292, 540, 82, 70, 'emerald', false, 'herb');
  // (3) Northeast Traveler Inn & Tavern
  drawTownhouse25D(c, 1410, 538, 88, 72, 'amber', false, 'inn');
  // (4) East Watchman Lodge
  drawTownhouse25D(c, 1510, 544, 62, 66, 'terracotta', false, 'watch');

  // 4. ROW 2: MIDDLE TOWN BLOCK (Y: 672..740 — Between Upper Dirt Avenue Y:648 & Lower Dirt Avenue Y:768)
  // (5) West Blacksmith & Forge House
  drawTownhouse25D(c, 940,  672, 86, 66, 'terracotta', false, 'smith');
  // (6) Merchant Guild Warehouse
  drawTownhouse25D(c, 1038, 674, 76, 64, 'amber', false, 'store');
  // [West Dirt Cross-Street at X: 1118..1148]
  // (7) Central Town Bakery & Mill House
  drawTownhouse25D(c, 1152, 672, 84, 66, 'plum', false, 'bread');

  // Central Town Dirt Square & Stone Water Fountain (Cleanly placed at X: 1274, Y: 708 between Row 2 houses!)
  const fx = 1274, fy = 708;
  c.fillStyle = 'rgba(10, 14, 22, 0.45)';
  c.beginPath();
  c.ellipse(fx + 2, fy + 3, 24, 15, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = PAL.rockDeep;
  c.beginPath();
  c.ellipse(fx, fy, 22, 14, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = PAL.rockLit1;
  c.beginPath();
  c.ellipse(fx, fy - 1, 20, 12, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = PAL.waterMid;
  c.beginPath();
  c.ellipse(fx, fy, 16, 9, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = PAL.rockShade1;
  c.fillRect(fx - 5, fy - 14, 10, 14);
  c.fillStyle = PAL.rockLit2;
  c.fillRect(fx - 8, fy - 9, 16, 4);
  c.fillStyle = PAL.waterFoamBright;
  c.fillRect(fx - 2, fy - 18, 4, 4);

  // (8) Tailor & Silk Weaver House
  drawTownhouse25D(c, 1312, 672, 66, 66, 'slate', false, 'cloth');
  // [East Dirt Main Street at X: 1380..1406]
  // (9) Cartographer & Bookbinder House
  drawTownhouse25D(c, 1410, 672, 82, 66, 'emerald', false, 'book');
  // (10) East Spice & Tea Merchant House
  drawTownhouse25D(c, 1504, 674, 68, 64, 'amber', false, 'tea');

  // 5. ROW 3: SOUTH TOWN BLOCK (Y: 794..864 — South of Lower Dirt Avenue Y:768)
  // (11) Southwest Pottery & Ceramic House
  drawTownhouse25D(c, 942,  796, 86, 66, 'emerald', false, 'pot');
  // (12) Southern Provision & Grain House
  drawTownhouse25D(c, 1040, 796, 76, 66, 'terracotta', false, 'grain');
  // [Bazaar Market Pocket at X: 1148..1254, Y: 798..855 — 2 Non-Overlapping Market Stalls]
  drawMarketBazaarStall(c, 1148, 804, 48, 28, '#dc2626', '#fef3c7', 'fruit');
  drawMarketBazaarStall(c, 1204, 804, 48, 28, '#2563eb', '#f8fafc', 'cloth');
  // (13) South Carpenter & Timber Lodge
  drawTownhouse25D(c, 1292, 796, 84, 66, 'amber', false, 'wood');
  // (14) Southeast Grand Trading Company Hall
  drawTownhouse25D(c, 1410, 794, 92, 68, 'slate', true, 'trade');
  // [East Market Pocket at X: 1512..1564, Y: 804]
  drawMarketBazaarStall(c, 1512, 804, 50, 28, '#059669', '#ecfdf5', 'pottery');

  // 2 Roadside Market Stalls on the West Upper Dirt Avenue (X: 952..1060, Y: 616 — cleanly below the ravine cliff!)
  drawMarketBazaarStall(c, 952,  618, 48, 26, '#d97706', '#fef3c7', 'pottery');
  drawMarketBazaarStall(c, 1008, 618, 48, 26, '#7c3aed', '#f5f3ff', 'fruit');

  // 6. Neat Non-Overlapping Urban Props Along Building Walls (Crates, Grain Sacks & Street Lanterns)
  const crateClusters = [
    [922, 688], [1124, 688], [1382, 688], [1124, 814], [1260, 814], [1382, 814]
  ];
  crateClusters.forEach(([cx, cy], idx) => {
    c.fillStyle = 'rgba(10, 14, 22, 0.42)';
    c.fillRect(cx - 2, cy + 9, 20, 4);
    c.fillStyle = '#3b2416';
    c.fillRect(cx, cy, 11, 10);
    c.fillStyle = '#8c5e3c';
    c.fillRect(cx + 1, cy + 1, 9, 8);
    c.fillStyle = '#5c4938';
    c.fillRect(cx + 10, cy + 3, 8, 8);
    c.fillStyle = '#cbb396';
    c.fillRect(cx + 11, cy + 4, 6, 6);
    c.fillStyle = (idx % 2 === 0) ? '#ef4444' : '#f59e0b';
    c.fillRect(cx + 12, cy + 3, 4, 2);
  });

  // Wrought-Iron Town Street Lanterns placed cleanly at Dirt Street Corners
  const townLanterns = [
    [1156, 636], [1282, 636], [1402, 636],
    [1032, 756], [1144, 756], [1244, 756], [1306, 756], [1402, 756]
  ];
  townLanterns.forEach(([lx, ly]) => {
    c.fillStyle = 'rgba(10, 14, 22, 0.42)';
    c.fillRect(lx - 4, ly + 1, 9, 3);
    c.fillStyle = '#1e293b';
    c.fillRect(lx - 1, ly - 24, 3, 26);
    c.fillRect(lx - 4, ly - 23, 9, 2);
    c.fillStyle = '#f59e0b';
    c.fillRect(lx - 3, ly - 21, 7, 2);
    c.fillStyle = '#fef08a';
    c.fillRect(lx - 2, ly - 19, 5, 5);
    c.fillStyle = '#ffffff';
    c.fillRect(lx - 1, ly - 18, 3, 3);
  });
}

function drawExpandedSectorLandmarks(c) {
  // 1. WEST SECTOR: Ancient Forest Shrine in Whispering Woods (at X: 145, Y: OY + 140)
  const sx = 135, sy = OY + 120;
  c.fillStyle = 'rgba(12, 16, 24, 0.45)';
  c.fillRect(sx - 6, sy + 28, 44, 10);
  c.fillStyle = PAL.rockShade1;
  c.fillRect(sx - 4, sy + 20, 40, 14);
  c.fillStyle = PAL.rockLit1;
  c.fillRect(sx, sy + 4, 32, 20);
  c.fillStyle = PAL.rockLit2;
  c.fillRect(sx - 4, sy, 40, 6);
  c.fillStyle = '#0ea5e9';
  c.fillRect(sx + 13, sy + 9, 6, 10);
  c.fillStyle = '#e0f2fe';
  c.fillRect(sx + 15, sy + 11, 2, 6);
  c.fillStyle = PAL.grassMid1;
  c.fillRect(sx - 2, sy, 12, 4);
  c.fillRect(sx + 22, sy + 2, 10, 4);

  // 2. EAST SECTOR: Village Stone Well & Flower Plaza (at X: 1392, Y: OY + 220)
  const wx = 1392, wy = OY + 220;
  c.fillStyle = 'rgba(12, 16, 24, 0.45)';
  c.beginPath();
  c.ellipse(wx, wy + 5, 18, 11, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = PAL.rockShade1;
  c.fillRect(wx - 14, wy - 6, 28, 14);
  c.fillStyle = PAL.rockLit1;
  c.fillRect(wx - 13, wy - 9, 26, 8);
  c.fillStyle = PAL.waterDeep;
  c.fillRect(wx - 9, wy - 7, 18, 5);
  c.fillStyle = '#472f1e';
  c.fillRect(wx - 12, wy - 26, 3, 20);
  c.fillRect(wx + 9, wy - 26, 3, 20);
  c.fillStyle = '#3e5370';
  c.fillRect(wx - 16, wy - 32, 32, 7);
  c.fillStyle = '#607b9e';
  c.fillRect(wx - 14, wy - 34, 28, 3);

  // Eastern Outskirts Archway Gate
  c.fillStyle = PAL.rockDeep;
  c.fillRect(1526, OY + 182, 14, 24);
  c.fillRect(1526, OY + 236, 14, 24);
  c.fillStyle = PAL.rockLit1;
  c.fillRect(1528, OY + 184, 10, 20);
  c.fillRect(1528, OY + 238, 10, 20);
  c.fillStyle = '#472f1e';
  c.fillRect(1529, OY + 176, 8, 66);
  c.fillStyle = '#fde68a';
  c.fillRect(1524, OY + 208, 5, 8);
}

function drawWoodenFence(c, fx, fy, fw) {
  c.fillStyle = 'rgba(12, 16, 24, 0.30)';
  c.fillRect(fx, fy + 10, fw, 2);
  c.fillStyle = '#422a19';
  c.fillRect(fx, fy + 4, fw, 2);
  c.fillRect(fx, fy + 8, fw, 2);
  c.fillStyle = '#855a3c';
  c.fillRect(fx, fy + 4, fw, 1);
  c.fillRect(fx, fy + 8, fw, 1);

  for (let x = fx; x <= fx + fw; x += 14) {
    c.fillStyle = '#2e1c11';
    c.fillRect(x, fy, 4, 12);
    c.fillStyle = '#9c6c49';
    c.fillRect(x + 1, fy + 1, 2, 10);
    c.fillStyle = '#b88762';
    c.fillRect(x + 1, fy, 2, 2);
  }
}

function drawCrossroadsSign(c, sx, sy) {
  c.fillStyle = 'rgba(12, 16, 24, 0.38)';
  c.fillRect(sx - 5, sy + 2, 12, 4);
  c.fillStyle = '#2e1c11';
  c.fillRect(sx - 2, sy - 19, 6, 23);
  c.fillStyle = '#7a5235';
  c.fillRect(sx - 1, sy - 18, 4, 21);
  c.fillStyle = '#2e1c11';
  c.fillRect(sx - 13, sy - 15, 26, 8);
  c.fillStyle = '#9c6c49';
  c.fillRect(sx - 12, sy - 14, 24, 6);
  c.fillStyle = '#634128';
  c.fillRect(sx - 9, sy - 12, 18, 1);
}

function drawNoticeBoard(c, bx, by) {
  c.fillStyle = 'rgba(12, 16, 24, 0.4)';
  c.fillRect(bx - 2, by + 18, 56, 5);
  c.fillStyle = '#2e1c11';
  c.fillRect(bx + 2, by - 2, 6, 23);
  c.fillRect(bx + 44, by - 2, 6, 23);
  c.fillRect(bx - 3, by - 16, 58, 24);
  c.fillStyle = '#7d5336';
  c.fillRect(bx - 1, by - 14, 54, 20);
  c.fillStyle = '#a3724f';
  c.fillRect(bx - 3, by - 17, 58, 3);
  c.fillStyle = '#ebe1cf';
  c.fillRect(bx + 4, by - 10, 14, 11);
  c.fillRect(bx + 21, by - 11, 12, 9);
  c.fillStyle = '#8c6d58';
  c.fillRect(bx + 6, by - 7, 10, 1);
  c.fillRect(bx + 6, by - 4, 8, 1);
  c.fillRect(bx + 23, by - 8, 8, 1);
}

function drawMeadowFlowersAndRocks(c) {
  // Natural clustered flowerbeds along roadsides & cliffs (instead of random noise dots!)
  const flowerBeds = [
    [OX + 135, OY + 148, 28, '#f8fafc'], [OX + 232, OY + 148, 26, '#fde68a'],
    [OX + 328, OY + 185, 32, '#f8fafc'], [OX + 478, OY + 235, 30, '#fde68a'],
    [OX + 585, OY + 195, 28, '#f472b6'], [OX + 642, OY + 225, 25, '#c4b5fd'],
    [OX + 455, OY + 308, 34, '#f8fafc'], [OX + 115, OY + 215, 28, '#f472b6'],
    [225, 480, 45, '#f472b6'],           [265, 565, 48, '#fde68a'],
    [175, 555, 42, '#c4b5fd'],           [515, 195, 36, '#f8fafc'],
    [625, 192, 36, '#fde68a'],           [1355, OY + 188, 32, '#f472b6']
  ];
  flowerBeds.forEach(([bx, by, rad, col], idx) => {
    for (let i = 0; i < 24; i++) {
      const ang = hash2D(idx, i) * Math.PI * 2;
      const r = hash2D(i, idx + 17) * rad;
      const fx = Math.floor(bx + Math.cos(ang) * r);
      const fy = Math.floor(by + Math.sin(ang) * r * 0.65);
      if (getPathWeight(fx, fy) > 0.25 || WaterSystem.isPointInWater(fx, fy)) continue;
      c.fillStyle = PAL.grassShade1;
      c.fillRect(fx - 1, fy + 1, 4, 2);
      c.fillStyle = PAL.grassSun1;
      c.fillRect(fx - 1, fy, 3, 2);
      c.fillStyle = (i % 3 === 0) ? '#f8fafc' : col;
      c.fillRect(fx, fy - 1, 2, 2);
    }
  });
}

// ============================================================================
// 6. ANIMATED WATERFALL, WATER TUNNELS, 3 BRIDGES & WATER RIPPLES
// ============================================================================
const submergedRavineRocks = [
  { x: 374, y: 416, rx: 11, ry: 7, seed: 14.8 },
  { x: 414, y: 432, rx: 12, ry: 7, seed: 19.4 },
  { x: 382, y: 498, rx: 13, ry: 8, seed: 29.4 },
  { x: 404, y: 585, rx: 14, ry: 8, seed: 34.1 }
];

// Draws an architectural Stone Water Tunnel Arch (Culvert) where the river enters/exits beneath the cliff/road
function drawStoneWaterTunnelArch(c, cx, cy, halfSpan, archH, isEntrance, time) {
  const x0 = Math.floor(cx - halfSpan - 10);
  const w = Math.floor((halfSpan + 10) * 2);

  // Outer stone masonry retaining wall & mossy cap
  c.fillStyle = PAL.rockDeep;
  c.fillRect(x0 - 2, cy - archH - 6, w + 4, archH + 10);
  c.fillStyle = PAL.rockShade1;
  c.fillRect(x0, cy - archH - 4, w, archH + 6);
  c.fillStyle = PAL.rockMid1;
  c.fillRect(x0 + 2, cy - archH - 2, w - 4, 6);
  c.fillStyle = PAL.rockLit1;
  c.fillRect(x0 + 4, cy - archH - 3, w - 8, 3);

  // Moss patches along top cornice of the water tunnel
  c.fillStyle = PAL.grassMid1;
  c.fillRect(x0 + 3, cy - archH - 5, 14, 3);
  c.fillRect(x0 + w - 18, cy - archH - 5, 14, 3);
  c.fillStyle = PAL.grassSun1;
  c.fillRect(x0 + 5, cy - archH - 6, 8, 2);

  // Recessed dark water tunnel vault opening
  for (let py = -archH + 4; py <= 4; py++) {
    const normY = Math.max(0, -py / (archH - 4));
    const spanAtY = Math.round(halfSpan * Math.sqrt(Math.max(0, 1 - normY * normY * 0.85)));
    // Keystone voussoir ring
    c.fillStyle = PAL.rockLit1;
    c.fillRect(cx - spanAtY - 4, cy + py, 4, 1);
    c.fillRect(cx + spanAtY, cy + py, 4, 1);
    // Dark tunnel interior & deep water shadow
    c.fillStyle = py < -4 ? '#121824' : PAL.waterAbyss;
    c.fillRect(cx - spanAtY, cy + py, spanAtY * 2, 1);
  }

  // Keystone emblem at top center of arch
  c.fillStyle = PAL.rockLit2;
  c.fillRect(cx - 4, cy - archH + 1, 8, 6);
  c.fillStyle = PAL.rockShade2;
  c.fillRect(cx - 3, cy - archH + 2, 6, 4);

  // Subtle wrought-iron water gate bars inside tunnel shadow
  c.fillStyle = 'rgba(30, 41, 59, 0.75)';
  for (let gx = cx - halfSpan + 6; gx <= cx + halfSpan - 6; gx += 7) {
    c.fillRect(gx, cy - archH + 7, 2, archH - 6);
  }

  // Animated water foam & directional ripples at the tunnel mouth
  const foamPulse = Math.sin(time * 5.2) * 2;
  c.fillStyle = PAL.waterFoamBright;
  c.fillRect(cx - halfSpan + 3, cy + (isEntrance ? -1 : 2), (halfSpan - 3) * 2, 2);
  c.fillStyle = PAL.waterFoamSoft;
  c.fillRect(cx - halfSpan + 6 + foamPulse, cy + (isEntrance ? -4 : 5), (halfSpan - 6) * 2, 2);
}

function drawWaterAndBridges(c, time) {
  if (gameState.currentArea !== 'verdant_wilds') return;

  // Render Animated Expanded Aqua Sanctuary (Danau & Laguna Teratai Kristal at X:310..775, Y:45..220)
  {
    const hx = 545, hy = 132;
    for (let a = 0; a < 28; a++) {
      const ang = (a / 28) * Math.PI * 2 + time * 0.25;
      const rx = hx + Math.cos(ang) * (54 + (a % 5) * 32);
      const ry = hy + Math.sin(ang) * (22 + (a % 3) * 16);
      if (
        Math.hypot((rx - 555) / 31, (ry - 135) / 20) > 1.05 &&
        Math.hypot((rx - 415) / 23, (ry - 128) / 16) > 1.05
      ) {
        c.fillStyle = (a % 2 === 0) ? PAL.waterFoamBright : PAL.waterFoamSoft;
        c.fillRect(Math.floor(rx), Math.floor(ry), 4, 1);
      }
    }

    const pads = [
      [345, 136, true],  [378, 158, false], [452, 148, true],
      [485, 112, true],  [512, 162, true],  [598, 112, true],
      [618, 154, false], [648, 126, true],  [688, 134, true],
      [722, 122, false], [540, 172, false], [462, 118, false],
      [588, 168, true],  [665, 108, false], [362, 118, true]
    ];
    pads.forEach(([px, py, hasLotus], i) => {
      const bobX = Math.round(px + Math.sin(time * 1.8 + i) * 1.2);
      const bobY = Math.round(py + Math.cos(time * 1.5 + i) * 0.8);
      c.fillStyle = '#182822';
      c.fillRect(bobX - 6, bobY - 2, 12, 7);
      c.fillStyle = PAL.grassMid1;
      c.fillRect(bobX - 5, bobY - 3, 10, 6);
      c.fillStyle = PAL.grassSun1;
      c.fillRect(bobX - 4, bobY - 3, 7, 4);
      if (hasLotus) {
        c.fillStyle = '#ec4899';
        c.fillRect(bobX - 3, bobY - 5, 6, 3);
        c.fillStyle = '#fdf2f8';
        c.fillRect(bobX - 2, bobY - 6, 4, 2);
        c.fillStyle = '#fde047';
        c.fillRect(bobX - 1, bobY - 5, 2, 1);
      }
    });
  }

  c.save();
  c.translate(OX, OY);

  // 0. NORTHERN SECTOR UPPER ALPINE STREAM & TOP STONE BRIDGE
  for (let y = -225; y <= 4; y++) {
    const center = 386 + Math.sin(y * 0.03) * 8;
    const halfW = 18 + Math.sin(y * 0.05) * 3;
    const leftX = Math.floor(center - halfW);
    const rightX = Math.floor(center + halfW);
    for (let x = leftX; x <= rightX; x++) {
      const edgeDist = Math.min(x - leftX, rightX - x);
      const ripple = Math.sin(x * 0.22 - time * 4.2 + y * 0.15);
      if (edgeDist < 2) c.fillStyle = PAL.rockWet;
      else if (ripple > 0.72) c.fillStyle = PAL.waterFoamSoft;
      else if (ripple > 0.2) c.fillStyle = PAL.waterLight;
      else c.fillStyle = PAL.waterMid;
      c.fillRect(x, y, 1, 1);
    }
  }

  // Top Stone Bridge (Jembatan Batu Alpine Utara at World X: 742..888, Y: 96..136)
  c.fillStyle = 'rgba(18, 28, 42, 0.45)';
  c.fillRect(344, -90, 142, 7);
  c.fillStyle = PAL.rockDeep;
  c.fillRect(342, -129, 146, 40);
  c.fillStyle = PAL.rockMid1;
  c.fillRect(344, -127, 142, 36);
  for (let bx = 348; bx < 482; bx += 10) {
    c.fillStyle = PAL.rockLit1;
    c.fillRect(bx, -124, 8, 30);
    c.fillStyle = PAL.rockLit2;
    c.fillRect(bx, -128, 8, 4);
    c.fillRect(bx, -95, 8, 4);
  }

  // 1. WATERFALL PLUNGE BASIN ENTERING THE UPPER STONE CULVERT (Gorong-Gorong Penghubung Hulu at ly: 90..150)
  // (Wooden bridge below waterfall removed and replaced with a stone culvert connecting underground to the lower culvert!)
  for (let y = 90; y <= 150; y++) {
    const progress = Math.max(0, Math.min(1, (y - 90) / 60));
    const ease = progress * progress * (3 - 2 * progress);
    const center = 388 + ease * 26; // Flows cleanly into the Upper Culvert Arch at lx = 414, ly = 150
    const halfW = progress < 0.55
      ? (40 + Math.sin((progress / 0.55) * Math.PI) * 10)
      : (38 - ((progress - 0.55) / 0.45) * 12);

    const leftX = Math.floor(center - halfW);
    const rightX = Math.floor(center + halfW);

    for (let x = leftX - 3; x <= rightX + 3; x++) {
      if (x < leftX || x > rightX) {
        c.fillStyle = (x === leftX - 3 || x === rightX + 3) ? PAL.rockShade2 : PAL.rockLit1;
        c.fillRect(x, y, 1, 1);
        continue;
      }
      const distEdge = Math.min(x - leftX, rightX - x);
      const normCross = (x - center) / Math.max(1, halfW);
      const flowWave = Math.sin(normCross * 6.0 + (y * 0.22 - time * 5.0));
      const distMainPlunge = Math.hypot((x - 388) / 34, (y - 100) / 16);

      if (distEdge < 2) {
        c.fillStyle = PAL.rockWet;
      } else if (distMainPlunge < 0.85 && Math.sin(distMainPlunge * 10 - time * 7) > 0.12) {
        c.fillStyle = distMainPlunge < 0.45 ? PAL.waterFoamBright : PAL.waterFoamSoft;
      } else if (distEdge < 5) {
        c.fillStyle = flowWave > 0.28 ? PAL.waterFoamSoft : PAL.waterLight;
      } else if (Math.abs(normCross) < 0.35 && flowWave > 0.50) {
        c.fillStyle = PAL.waterFoamSoft;
      } else {
        c.fillStyle = flowWave > 0.12 ? PAL.waterMid : PAL.waterDeep;
      }
      c.fillRect(x, y, 1, 1);
    }
  }

  // Smooth directional current lines flowing from the Waterfall Plunge Basin into the Upper Culvert Mouth
  for (let s = 0; s < 10; s++) {
    const tProg = ((time * 0.52 + s * 0.1) % 1);
    const ease = tProg * tProg * (3 - 2 * tProg);
    const laneOffset = ((s % 3) - 1) * 10 * (1 - tProg * 0.35);
    const sx = 388 + ease * 26 + laneOffset;
    const sy = 96 + tProg * 50;
    c.fillStyle = (s % 2 === 0) ? PAL.waterFoamBright : PAL.waterFoamSoft;
    c.fillRect(Math.floor(sx), Math.floor(sy), 2, 2);
  }

  // Concentric plunge rings radiating from the Main Waterfall impact basin (388, 98)
  for (let r = 0; r < 3; r++) {
    const rad = ((time * 15 + r * 10) % 30) + 6;
    const alpha = Math.max(0.14, 1 - rad / 36);
    c.strokeStyle = `rgba(244, 249, 252, ${alpha.toFixed(2)})`;
    c.lineWidth = 1.3;
    c.beginPath();
    c.ellipse(388 + rad * 0.12, 99 + rad * 0.10, rad, rad * 0.38, 0.08, 0, Math.PI * 2);
    c.stroke();
  }

  // Upper Stone Water Culvert Entrance (Gorong-Gorong Penghubung Hulu at lx=414, ly=150)
  drawStoneWaterTunnelArch(c, 414, 150, 26, 17, true, time);

  // 2. UPPER-CENTER MULTI-TIERED HD-2D WATERFALL
  const wfX = 358, wfW = 58, wfH = 98;

  c.fillStyle = PAL.rockDeep;
  c.fillRect(wfX - 6, -4, wfW + 12, wfH + 4);
  for (let y = -2; y < wfH; y += 2) {
    const ledgeShift = Math.round(Math.sin(y * 0.14) * 3);
    c.fillStyle = (y % 6 === 0) ? PAL.rockShade2 : PAL.rockWet;
    c.fillRect(wfX - 5 + ledgeShift, y, 6, 2);
    c.fillRect(wfX + wfW - 1 + ledgeShift, y, 6, 2);
  }

  for (let y = -2; y < wfH; y++) {
    const isMidShelf = y >= 40 && y <= 49;
    const spread = y > 44 ? (y - 44) * 0.24 : 0;
    const lx = Math.floor(wfX - spread * 0.35);
    const w = Math.floor(wfW + spread);

    c.fillStyle = y < 42 ? PAL.waterDeep : (y < 76 ? PAL.waterMid : PAL.waterLight);
    c.fillRect(lx, y, w, 1);

    for (let s = 3; s < w - 3; s += 7) {
      c.fillStyle = PAL.waterAbyss;
      c.fillRect(lx + s, y, 2, 1);
    }

    for (let s = 1; s < w - 1; s += 2) {
      const ribbonSpeed = (s % 4 === 0) ? 74 : 58;
      const flow = (y - time * ribbonSpeed + Math.sin(s * 0.55) * 9) % 16;
      if (flow < 5 && flow > -5) {
        c.fillStyle = (s % 6 === 0 || y < 5) ? PAL.waterFoamBright : ((s % 3 === 0) ? PAL.waterFoamSoft : PAL.waterLight);
        c.fillRect(lx + s, y, (s % 4 === 0) ? 2 : 1, 2);
      }
    }

    if (y >= -2 && y <= 3) {
      c.fillStyle = PAL.waterFoamBright;
      c.fillRect(lx + 2, y, w - 4, 1);
    } else if (isMidShelf) {
      const shelfFoam = Math.sin(time * 8 + y) * 2;
      c.fillStyle = y < 45 ? PAL.waterFoamBright : PAL.waterFoamSoft;
      c.fillRect(lx + 1 + shelfFoam, y, w - 2, 1);
    }
  }

  const wfRocks = [
    [wfX + 16, 42, 7, 5],
    [wfX + 42, 44, 8, 5],
    [wfX + 28, 2,  6, 4]
  ];
  wfRocks.forEach(([rx, ry, rw, rh], idx) => {
    c.fillStyle = PAL.rockDeep;
    c.fillRect(rx - 1, ry - 1, rw + 2, rh + 2);
    c.fillStyle = PAL.rockWet;
    c.fillRect(rx, ry, rw, rh);
    c.fillStyle = PAL.rockMid1;
    c.fillRect(rx + 1, ry, rw - 2, 2);
    const sp = Math.round(Math.sin(time * 9 + idx) * 1.5);
    c.fillStyle = PAL.waterFoamBright;
    c.fillRect(rx - 2 + sp, ry + rh, rw + 4, 2);
  });

  for (let i = 0; i < 9; i++) {
    const puffX = wfX - 4 + i * 8 + Math.sin(time * 5 + i) * 2;
    const puffY = wfH - 2 + Math.cos(time * 6 + i * 1.3) * 1.5;
    const puffR = 5.5 + (i % 3) * 1.5;
    c.fillStyle = (i % 2 === 0) ? PAL.waterFoamBright : PAL.waterFoamSoft;
    c.beginPath();
    c.ellipse(puffX, puffY, puffR, puffR * 0.55, 0, 0, Math.PI * 2);
    c.fill();
  }

  // 4. LOWER RAVINE STONE WATER CULVERT EXIT (Gorong-Gorong Aliran Bawah) & COHESIVE STREAM CANAL
  for (let y = 374; y < H - OY; y++) {
    const t = Math.max(0, Math.min(1, (y - 374) / 140));
    const center = 392 + Math.sin(t * Math.PI) * 6;
    const halfW = 28 + t * 8;
    const leftX = Math.floor(center - halfW);
    const rightX = Math.floor(center + halfW);

    for (let x = leftX - 5; x <= rightX + 5; x++) {
      // Dressed stone embankment walls flanking the lower water tunnel canal
      if (x < leftX || x > rightX) {
        if (x === leftX - 5 || x === rightX + 5) c.fillStyle = PAL.rockDeep;
        else if (x < leftX - 2 || x > rightX + 2) c.fillStyle = (y % 8 === 0) ? PAL.rockShade2 : PAL.rockMid1;
        else c.fillStyle = PAL.rockWet;
        c.fillRect(x, y, 1, 1);
        continue;
      }

      const edgeDist = Math.min(x - leftX, rightX - x);
      const normCross = (x - center) / Math.max(1, halfW);
      const streamWave = Math.sin(normCross * 5.5 + (y * 0.22 - time * 5.0));

      let nearRock = false;
      let rockFoam = false;
      for (const rk of submergedRavineRocks) {
        const d = Math.hypot((x - rk.x) / (rk.rx + 4), (y - rk.y) / (rk.ry + 3));
        if (d < 1.18 && d > 0.82) {
          nearRock = true;
          if (streamWave > -0.15) rockFoam = true;
        }
      }

      if (y < 384 && Math.sin((x - center) * 0.4 - time * 8) > 0.1) {
        c.fillStyle = PAL.waterFoamBright;
      } else if (rockFoam || (edgeDist < 3 && streamWave > 0.1)) {
        c.fillStyle = PAL.waterFoamBright;
      } else if (nearRock || (edgeDist < 6 && streamWave > -0.15)) {
        c.fillStyle = PAL.waterFoamSoft;
      } else if (streamWave > 0.45) {
        c.fillStyle = PAL.waterLight;
      } else if (edgeDist > 12 && streamWave < -0.25) {
        c.fillStyle = PAL.waterDeep;
      } else {
        c.fillStyle = PAL.waterMid;
      }
      c.fillRect(x, y, 1, 1);
    }
  }

  // Stone Water Tunnel Outlet Arch carved into the lower ravine cliff wall (at lx=392, ly=376)
  drawStoneWaterTunnelArch(c, 392, 376, 28, 22, false, time);

  // Short gushing water cascade pouring out of the Lower Stone Water Tunnel mouth
  for (let ty = 364; ty <= 378; ty++) {
    const wSpan = 42;
    const startX = 392 - wSpan / 2;
    c.fillStyle = ty < 370 ? PAL.waterDeep : PAL.waterMid;
    c.fillRect(startX, ty, wSpan, 1);
    for (let sx = 2; sx < wSpan - 2; sx += 3) {
      const f = (ty - time * 60 + sx) % 10;
      if (f < 4 && f > -4) {
        c.fillStyle = (sx % 2 === 0) ? PAL.waterFoamBright : PAL.waterFoamSoft;
        c.fillRect(startX + sx, ty, 2, 2);
      }
    }
  }

  for (const rk of submergedRavineRocks) {
    drawSculptedBoulder(c, rk.x, rk.y - 2, rk.rx, rk.ry, rk.seed, true, false);
    const foamShift = Math.sin(time * 4 + rk.seed) * 1.5;
    c.fillStyle = PAL.waterFoamBright;
    c.fillRect(Math.floor(rk.x - rk.rx * 0.7 + foamShift), Math.floor(rk.y + rk.ry * 0.55), Math.floor(rk.rx * 1.4), 2);
  }

  // 5. SOUTHERN SECTOR LOWER RAVINE SUSPENSION BRIDGE
  const sbx = 262, sby = 534, sbw = 224, sbh = 26;
  c.fillStyle = 'rgba(14, 22, 34, 0.52)';
  c.fillRect(sbx, sby + sbh, sbw, 6);
  c.fillStyle = '#382214';
  c.fillRect(sbx, sby + 3, sbw, sbh - 6);
  for (let px = sbx + 4; px < sbx + sbw - 4; px += 7) {
    c.fillStyle = '#26160c';
    c.fillRect(px - 1, sby + 2, 1, sbh - 4);
    c.fillStyle = ((px / 7) % 2 === 0) ? '#9c6c49' : '#80563a';
    c.fillRect(px, sby + 2, 5, sbh - 4);
  }
  c.strokeStyle = '#cbb08a';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(sbx, sby);
  c.lineTo(sbx + sbw, sby);
  c.moveTo(sbx, sby + sbh - 2);
  c.lineTo(sbx + sbw, sby + sbh - 2);
  c.stroke();

  c.restore();

  // Render Active Water Wake Ripples (spawned when characters wade in water)
  for (const rp of waterRipples) {
    const progress = 1 - rp.life / rp.maxLife;
    const rx = rp.maxR * (0.35 + progress * 0.65);
    const ry = rx * 0.48;
    const alpha = (1 - progress) * 0.78;
    c.strokeStyle = `rgba(244, 249, 252, ${alpha.toFixed(2)})`;
    c.lineWidth = 1.3;
    c.beginPath();
    c.ellipse(rp.x, rp.y, rx, ry, 0, 0, Math.PI * 2);
    c.stroke();
  }
}

// ============================================================================
// HD-2D PIXEL-ART TREE, BUSH & INTERIOR ENVIRONMENT BUILDERS
// ============================================================================
const TREE_SPRITE_CACHE = {};

function bakePineStamp() {
  const cw = 64, ch = 80;
  const can = document.createElement('canvas');
  can.width = cw;
  can.height = ch;
  const ctx = can.getContext('2d');
  const cx = 32, by = 72;

  ctx.fillStyle = 'rgba(10, 15, 24, 0.38)';
  for (let y = -5; y <= 5; y++) {
    for (let x = -17; x <= 17; x++) {
      if ((x * x) / (17 * 17) + (y * y) / (5 * 5) <= 1) {
        ctx.fillRect(cx + x, by + y, 1, 1);
      }
    }
  }

  for (let y = by - 14; y <= by + 1; y++) {
    const flare = y > by - 4 ? Math.floor((y - (by - 4)) * 0.6) : 0;
    for (let x = cx - 4 - flare; x <= cx + 4 + flare; x++) {
      if (x === cx - 4 - flare || x === cx + 4 + flare) ctx.fillStyle = '#1d120b';
      else if (x < cx - 1) ctx.fillStyle = '#3d2517';
      else if (x <= cx + 1) ctx.fillStyle = '#633d27';
      else ctx.fillStyle = '#805136';
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const tiers = [
    { topY: by - 64, h: 17, maxR: 12 },
    { topY: by - 53, h: 18, maxR: 16 },
    { topY: by - 41, h: 19, maxR: 20 },
    { topY: by - 28, h: 19, maxR: 24 }
  ];

  const ramp = [PAL.grassDeep, PAL.grassShade2, PAL.grassShade1, PAL.grassMid2, PAL.grassMid1, PAL.grassSun1, PAL.grassSun2];

  tiers.forEach((t, tIdx) => {
    for (let py = 0; py < t.h; py++) {
      const y = t.topY + py;
      const vProg = py / t.h;
      const baseSpan = 2 + vProg * (t.maxR - 2);
      for (let x = cx - 26; x <= cx + 26; x++) {
        const dx = x - cx;
        const branchJag = Math.sin(dx * 0.65 + tIdx * 1.9) * 2.2 + (hash2D(x, y) - 0.5) * 2.4;
        const limit = baseSpan + branchJag;
        const skirtDrop = Math.sin(dx * 0.7 + tIdx) * 1.8;

        if (Math.abs(dx) <= limit && py <= t.h - 2 + skirtDrop) {
          const isEdge = Math.abs(dx) > limit - 1.5 || py >= t.h - 3 + skirtDrop || (py <= 1 && Math.abs(dx) <= 3);
          if (isEdge && hash2D(x * 2, y * 2) > 0.2) {
            ctx.fillStyle = PAL.grassDeep;
          } else {
            const sunSide = (dx / Math.max(1, limit)) * 0.22;
            const topLight = (1 - vProg) * 0.36;
            const cluster = (valueNoise(x * 0.28, y * 0.28) - 0.5) * 0.36;
            const tierBright = (3 - tIdx) * 0.05;
            const val = Math.max(0.08, Math.min(0.95, 0.36 + sunSide + topLight + cluster + tierBright));
            ctx.fillStyle = bayerDither(x, y, val, ramp);
          }
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  });

  return can;
}

function bakeOakStamp(isBlossom = false) {
  const cw = 68, ch = 76;
  const can = document.createElement('canvas');
  can.width = cw;
  can.height = ch;
  const ctx = can.getContext('2d');
  const cx = 34, by = 68;

  ctx.fillStyle = 'rgba(10, 15, 24, 0.38)';
  for (let y = -5; y <= 5; y++) {
    for (let x = -19; x <= 19; x++) {
      if ((x * x) / (19 * 19) + (y * y) / (5 * 5) <= 1) {
        ctx.fillRect(cx + x, by + y, 1, 1);
      }
    }
  }

  for (let y = by - 19; y <= by + 1; y++) {
    const rootSpread = y > by - 5 ? (y - (by - 5)) * 0.9 : 0;
    const curve = Math.round(Math.sin((by - y) * 0.16) * 1.2);
    const halfW = 4.5 + rootSpread;
    for (let x = Math.floor(cx - halfW + curve); x <= Math.ceil(cx + halfW + curve); x++) {
      const dx = x - (cx + curve);
      if (Math.abs(dx) >= halfW - 1) ctx.fillStyle = '#1f130c';
      else if (dx < -1) ctx.fillStyle = '#42291a';
      else if (dx <= 1.5) ctx.fillStyle = '#69422b';
      else ctx.fillStyle = '#8c5a3c';
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const puffs = [
    { x: cx - 12, y: by - 28, rx: 13, ry: 11, light: -0.08 },
    { x: cx + 12, y: by - 27, rx: 13, ry: 11, light: +0.08 },
    { x: cx,      y: by - 25, rx: 15, ry: 11, light: -0.10 },
    { x: cx - 9,  y: by - 38, rx: 13, ry: 11, light: +0.04 },
    { x: cx + 10, y: by - 38, rx: 13, ry: 11, light: +0.16 },
    { x: cx,      y: by - 44, rx: 14, ry: 12, light: +0.22 }
  ];

  const ramp = isBlossom
    ? ['#2d1628', '#4c1d3d', '#702956', '#9d3b72', '#cf5c96', '#f48fb1', '#fce4ec']
    : [PAL.grassDeep, PAL.grassShade2, PAL.grassShade1, PAL.grassMid2, PAL.grassMid1, PAL.grassSun1, PAL.grassSun2];

  for (let y = by - 60; y <= by - 12; y++) {
    for (let x = cx - 28; x <= cx + 28; x++) {
      let bestDist = 999;
      let bestPuff = null;
      const n = valueNoise(x * 0.25, y * 0.25);

      for (let i = 0; i < puffs.length; i++) {
        const p = puffs[i];
        const d = Math.hypot((x - p.x) / p.rx, (y - p.y) / p.ry) + (n - 0.5) * 0.26;
        if (d < bestDist) {
          bestDist = d;
          bestPuff = p;
        }
      }

      if (bestDist <= 1.0) {
        if (bestDist > 0.87) {
          ctx.fillStyle = ramp[0];
        } else {
          const localNx = (x - bestPuff.x) / bestPuff.rx;
          const localNy = (y - bestPuff.y) / bestPuff.ry;
          const leafCluster = (hash2D(x >> 1, y >> 1) - 0.5) * 0.24;
          const lum = Math.max(0.08, Math.min(0.96,
            0.46 + bestPuff.light + localNx * 0.16 - localNy * 0.28 + leafCluster
          ));
          ctx.fillStyle = bayerDither(x, y, lum, ramp);
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  return can;
}

function bakeBushStamp(hasFlowers) {
  const cw = 32, ch = 24;
  const can = document.createElement('canvas');
  can.width = cw;
  can.height = ch;
  const ctx = can.getContext('2d');
  const cx = 16, by = 19;

  ctx.fillStyle = 'rgba(10, 15, 24, 0.34)';
  ctx.fillRect(cx - 10, by, 20, 3);

  const ramp = [PAL.grassDeep, PAL.grassShade2, PAL.grassShade1, PAL.grassMid2, PAL.grassMid1, PAL.grassSun1, PAL.grassSun2];
  for (let y = by - 12; y <= by + 1; y++) {
    for (let x = cx - 12; x <= cx + 12; x++) {
      const n = valueNoise(x * 0.35, y * 0.35);
      const d = Math.hypot((x - cx) / 11, (y - (by - 5)) / 7) + (n - 0.5) * 0.28;
      if (d <= 1.0) {
        if (d > 0.84) ctx.fillStyle = PAL.grassDeep;
        else {
          const lum = Math.max(0.1, Math.min(0.95, 0.50 - ((y - (by - 5)) / 7) * 0.32 + ((x - cx) / 11) * 0.16));
          ctx.fillStyle = bayerDither(x, y, lum, ramp);
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  if (hasFlowers) {
    const fl = [[-5, -7, '#f472b6'], [3, -8, '#fde047'], [-1, -4, '#f8fafc'], [6, -5, '#f472b6']];
    fl.forEach(([dx, dy, col]) => {
      ctx.fillStyle = col;
      ctx.fillRect(cx + dx, by + dy, 2, 2);
    });
  }

  return can;
}

function drawPineTree(c, tx, ty, scale = 1) {
  if (!TREE_SPRITE_CACHE.pine) TREE_SPRITE_CACHE.pine = bakePineStamp();
  const img = TREE_SPRITE_CACHE.pine;
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  // 2.5D Angled Ground Cast Shadow (Octopath-style elongated tree shadow)
  if (gameState.hd2d.shadows3d) {
    c.fillStyle = 'rgba(8, 12, 20, 0.34)';
    c.beginPath();
    c.ellipse(tx + 12 * scale, ty + 2 * scale, 22 * scale, 7.5 * scale, 0.18, 0, Math.PI * 2);
    c.fill();
  }
  c.drawImage(img, Math.round(tx - 32 * scale), Math.round(ty - 72 * scale), w, h);
}

function drawOakTree(c, tx, ty, scale = 1, isBlossom = false) {
  const key = isBlossom ? 'sakuraOak' : 'oak';
  if (!TREE_SPRITE_CACHE[key]) TREE_SPRITE_CACHE[key] = bakeOakStamp(isBlossom);
  const img = TREE_SPRITE_CACHE[key];
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  if (gameState.hd2d.shadows3d) {
    c.fillStyle = 'rgba(8, 12, 20, 0.36)';
    c.beginPath();
    c.ellipse(tx + 13 * scale, ty + 2 * scale, 24 * scale, 8.5 * scale, 0.16, 0, Math.PI * 2);
    c.fill();
  }
  c.drawImage(img, Math.round(tx - 34 * scale), Math.round(ty - 68 * scale), w, h);
}

function drawBushProp(c, bx, by, scale = 1, hasFlowers = true) {
  const key = hasFlowers ? 'bushFl' : 'bushPlain';
  if (!TREE_SPRITE_CACHE[key]) TREE_SPRITE_CACHE[key] = bakeBushStamp(hasFlowers);
  const img = TREE_SPRITE_CACHE[key];
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  c.drawImage(img, Math.round(bx - 16 * scale), Math.round(by - 19 * scale), w, h);
}

function buildAncientSanctumEnvironment(c) {
  c.fillStyle = '#121521';
  c.fillRect(0, 0, W, H);

  for (let y = 40; y < H - 30; y++) {
    for (let x = 50; x < W - 50; x++) {
      const tileW = 24, tileH = 24;
      const isGroove = (x % tileW === 0) || (y % tileH === 0);
      const n = hash2D(Math.floor(x / tileW), Math.floor(y / tileH));
      const distCenter = Math.hypot(x - W / 2, y - H / 2);
      if (isGroove) {
        c.fillStyle = '#181c2b';
      } else if (distCenter < 110 && ((x + y) % 19 === 0)) {
        c.fillStyle = '#38bdf8';
      } else if (n > 0.65) {
        c.fillStyle = '#47465c';
      } else if (n > 0.3) {
        c.fillStyle = '#36354a';
      } else {
        c.fillStyle = '#2a293b';
      }
      c.fillRect(x, y, 1, 1);
    }
  }

  c.fillStyle = PAL.rockShade1;
  c.fillRect(35, 18, W - 70, 32);
  c.fillRect(35, 18, 28, H - 40);
  c.fillRect(W - 63, 18, 28, H - 40);

  for (let x = 140; x <= 660; x += 160) {
    drawSculptedBoulder(c, x, 130, 18, 14, x * 0.1, false, true);
    drawSculptedBoulder(c, x, 310, 18, 14, x * 0.2, false, true);
  }

  const ax = W / 2 - 48, ay = 125;
  c.fillStyle = PAL.rockDeep;
  c.fillRect(ax - 6, ay + 6, 108, 64);
  c.fillStyle = PAL.rockMid1;
  c.fillRect(ax, ay, 96, 56);
  c.fillStyle = PAL.rockLit1;
  c.fillRect(ax + 8, ay + 6, 80, 42);
  c.fillStyle = '#38bdf8';
  c.fillRect(W / 2 - 12, ay + 16, 24, 22);
  c.fillStyle = '#e0f2fe';
  c.fillRect(W / 2 - 6, ay + 20, 12, 14);

  c.fillStyle = '#fde047';
  c.fillRect(W / 2 - 36, H - 28, 72, 10);
}

function buildCottageInteriorEnvironment(c) {
  c.fillStyle = '#1c1410';
  c.fillRect(0, 0, W, H);

  for (let y = 48; y < H - 28; y++) {
    for (let x = 48; x < W - 48; x++) {
      const plankRow = Math.floor(y / 12);
      const isSeam = (y % 12 === 0) || ((x + (plankRow % 2) * 32) % 64 === 0);
      if (isSeam) c.fillStyle = '#382315';
      else c.fillStyle = (plankRow % 2 === 0) ? '#784e32' : '#694229';
      c.fillRect(x, y, 1, 1);
    }
  }

  c.fillStyle = '#993b2b';
  c.fillRect(W / 2 - 80, H / 2 - 45, 160, 95);
  c.fillStyle = '#e2c591';
  c.strokeStyle = '#fbbf24';
  c.lineWidth = 2;
  c.strokeRect(W / 2 - 74, H / 2 - 39, 148, 83);

  c.fillStyle = '#472f1e';
  c.fillRect(42, 16, W - 84, 34);
  c.fillStyle = PAL.rockMid1;
  c.fillRect(W / 2 - 40, 12, 80, 40);
  c.fillStyle = '#ea580c';
  c.fillRect(W / 2 - 18, 28, 36, 22);
  c.fillStyle = '#fde047';
  c.fillRect(W / 2 - 10, 34, 20, 14);

  c.fillStyle = '#5c3c24';
  c.fillRect(80, 62, 110, 34);
  c.fillStyle = '#3b82f6';
  c.fillRect(455, 85, 95, 58);
  c.fillStyle = '#f8fafc';
  c.fillRect(462, 90, 80, 20);

  c.fillStyle = '#fde68a';
  c.fillRect(W / 2 - 28, H - 26, 56, 10);
}

// ============================================================================
// 9. HD-2D ATMOSPHERIC LIGHTING, GOD RAYS, FOG & PARTICLES
// ============================================================================
const portalSparkles = Array.from({ length: 18 }, (_, i) => ({
  x: OX + 170 + (i * 19) % 44,
  y: OY + 55 + (i * 13) % 70,
  speed: 6 + (i % 5) * 2,
  phase: i * 0.8
}));

const chimneySmoke = Array.from({ length: 10 }, (_, i) => ({
  x: OX + 722,
  y: OY + 74 - i * 8,
  age: i * 0.1
}));

const forestMotes = Array.from({ length: 65 }, (_, i) => ({
  x: (i * 73) % 1600,
  y: (i * 47) % 900,
  vx: 3 + (i % 4) * 1.5,
  vy: -2 - (i % 3) * 1.2,
  phase: i * 0.6
}));

function drawHabitatAmbientParticles(c, time) {
  // 1. Expanded Flora Sanctuary (235, 535): Drifting blossom petals & golden pollen across the whole 340x280 valley
  for (let i = 0; i < 28; i++) {
    const px = 75 + ((i * 37 + time * 12) % 320);
    const py = 400 + ((i * 29 + time * 15) % 270);
    c.fillStyle = (i % 3 === 0) ? '#f9a8d4' : ((i % 2 === 0) ? '#f472b6' : '#fde047');
    c.fillRect(Math.floor(px + Math.sin(time * 2.6 + i) * 5), Math.floor(py), 2, 2);
  }

  // 2. Expanded Aqua Sanctuary (560, 135): Shimmering aqua water glints & rising bubbles across the whole 350x160 lagoon
  for (let i = 0; i < 24; i++) {
    const bx = 395 + ((i * 31) % 320);
    const by = 185 - ((time * 13 + i * 11) % 105);
    c.fillStyle = (i % 2 === 0) ? 'rgba(224, 242, 254, 0.82)' : 'rgba(125, 211, 252, 0.75)';
    c.fillRect(Math.floor(bx + Math.sin(time * 3.5 + i) * 2), Math.floor(by), 2, 2);
  }
}

function drawAtmosphericEffects(c, time) {
  if (gameState.currentArea !== 'verdant_wilds') {
    if (gameState.hd2d.bloom) {
      c.save();
      c.globalCompositeOperation = 'screen';
      const glowX = W / 2;
      const glowY = gameState.currentArea === 'ancient_sanctum' ? 155 : 45;
      const glowCol = gameState.currentArea === 'ancient_sanctum' ? 'rgba(56, 189, 248, 0.28)' : 'rgba(251, 146, 60, 0.32)';
      const grad = c.createRadialGradient(glowX, glowY, 4, glowX, glowY, 120);
      grad.addColorStop(0, glowCol);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = grad;
      c.beginPath();
      c.arc(glowX, glowY, 120, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    return;
  }

  drawHabitatAmbientParticles(c, time);

  portalSparkles.forEach(sp => {
    const py = OY + 55 + ((sp.y - (OY + 55) - time * sp.speed + 70) % 70);
    const px = sp.x + Math.sin(time * 2.4 + sp.phase) * 2.5;
    const alpha = 0.4 + 0.55 * Math.abs(Math.sin(time * 3 + sp.phase));
    c.fillStyle = `rgba(253, 224, 71, ${alpha.toFixed(2)})`;
    c.fillRect(Math.floor(px), Math.floor(py), 2, 2);
  });

  chimneySmoke.forEach((sm, idx) => {
    const prog = (time * 0.24 + sm.age) % 1;
    const sx = OX + 722 + Math.sin(prog * 6 + idx) * 6 + prog * 14;
    const sy = OY + 76 - prog * 54;
    const rad = 3 + prog * 7;
    const alpha = (1 - prog) * 0.25;
    c.fillStyle = `rgba(226, 232, 240, ${alpha.toFixed(2)})`;
    c.beginPath();
    c.arc(sx, sy, rad, 0, Math.PI * 2);
    c.fill();
  });

  forestMotes.forEach(m => {
    const mx = (m.x + time * m.vx + W) % W;
    const my = (m.y + time * m.vy + H) % H;
    const alpha = 0.28 + 0.45 * Math.abs(Math.sin(time * 2.1 + m.phase));
    c.fillStyle = `rgba(254, 243, 199, ${alpha.toFixed(2)})`;
    c.fillRect(Math.floor(mx), Math.floor(my), 2, 2);
  });

  if (gameState.hd2d.bloom) {
    c.save();
    c.globalCompositeOperation = 'screen';
    const lights = [
      { x: OX + 192, y: OY + 96,  r: 50, col: 'rgba(251, 191, 36, 0.24)' },
      { x: OX + 564, y: OY + 139, r: 44, col: 'rgba(251, 191, 36, 0.34)' },
      { x: OX + 660, y: OY + 167, r: 58, col: 'rgba(245, 158, 11, 0.28)' },
      { x: OX + 723, y: OY + 166, r: 28, col: 'rgba(251, 191, 36, 0.24)' },
      { x: OX + 425, y: OY + 158, r: 38, col: 'rgba(251, 191, 36, 0.28)' },
      { x: OX + 243, y: OY + 172, r: 36, col: 'rgba(251, 191, 36, 0.25)' },
      { x: OX + 428, y: OY + 234, r: 38, col: 'rgba(251, 191, 36, 0.28)' },
      { x: OX + 356, y: OY + 256, r: 42, col: 'rgba(249, 115, 22, 0.32)' },
      { x: 150,      y: OY + 132, r: 45, col: 'rgba(56, 189, 248, 0.28)' },
      { x: 1526,     y: OY + 212, r: 36, col: 'rgba(251, 191, 36, 0.26)' },
      { x: 245,      y: 540,      r: 60, col: 'rgba(74, 222, 128, 0.18)' },
      { x: 585,      y: 135,      r: 58, col: 'rgba(56, 189, 248, 0.22)' }
    ];
    lights.forEach(L => {
      const pulsate = L.r + Math.sin(time * 3) * 3;
      const g = c.createRadialGradient(L.x, L.y, 2, L.x, L.y, pulsate);
      g.addColorStop(0, L.col);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(L.x, L.y, pulsate, 0, Math.PI * 2);
      c.fill();
    });
    c.restore();
  }

  if (gameState.hd2d.godRays) {
    c.save();
    c.globalCompositeOperation = 'screen';
    const rays = [
      { x: OX + 90,  w: 85,  a: 0.055 },
      { x: OX + 270, w: 110, a: 0.065 },
      { x: OX + 470, w: 95,  a: 0.06  },
      { x: OX + 650, w: 120, a: 0.075 },
      { x: 1280,     w: 110, a: 0.06  }
    ];
    rays.forEach((r, idx) => {
      const sway = Math.sin(time * 0.45 + idx) * 14;
      const grad = c.createLinearGradient(r.x + sway, 0, r.x - 160 + sway, H);
      grad.addColorStop(0, `rgba(254, 243, 199, ${r.a})`);
      grad.addColorStop(0.65, `rgba(253, 224, 71, ${(r.a * 0.35).toFixed(3)})`);
      grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      c.fillStyle = grad;
      c.beginPath();
      c.moveTo(r.x + sway, 0);
      c.lineTo(r.x + r.w + sway, 0);
      c.lineTo(r.x + r.w - 200 + sway, H);
      c.lineTo(r.x - 200 + sway, H);
      c.closePath();
      c.fill();
    });
    c.restore();
  }

  if (gameState.hd2d.fog) {
    const fogBanks = [
      { x: OX + 65,  y: OY + 422, rx: 145, ry: 44, spd: 8,  a: 0.36 },
      { x: OX + 150, y: OY + 442, rx: 130, ry: 36, spd: -6, a: 0.28 },
      { x: OX + 42,  y: OY + 96,  rx: 95,  ry: 32, spd: 5,  a: 0.26 },
      { x: OX + 394, y: OY + 98,  rx: 56,  ry: 20, spd: 11, a: 0.22 },
      { x: OX + 388, y: OY + 432, rx: 72,  ry: 24, spd: -9, a: 0.20 },
      { x: 200,      y: 780,      rx: 180, ry: 55, spd: 7,  a: 0.28 },
      { x: 750,      y: 830,      rx: 210, ry: 50, spd: -8, a: 0.25 }
    ];
    fogBanks.forEach((f, idx) => {
      const fx = f.x + Math.sin(time * 0.35 + idx) * f.spd;
      const fy = f.y + Math.cos(time * 0.25 + idx) * 3;
      const g = c.createRadialGradient(fx, fy, 4, fx, fy, f.rx);
      g.addColorStop(0, `rgba(232, 240, 248, ${f.a})`);
      g.addColorStop(0.6, `rgba(212, 226, 240, ${(f.a * 0.45).toFixed(2)})`);
      g.addColorStop(1, 'rgba(212, 226, 240, 0)');
      c.save();
      c.translate(fx, fy);
      c.scale(1, f.ry / f.rx);
      c.fillStyle = g;
      c.beginPath();
      c.arc(0, 0, f.rx, 0, Math.PI * 2);
      c.fill();
      c.restore();
    });
  }
}

function drawScreenVignette(ctx, sw, sh) {
  if (!gameState.hd2d.vignette) return;

  // 1. Warm Golden-Amber Sunlight Top-Right Wash & Deep Slate-Forest Bottom-Left Grading (Octopath HD-2D Look)
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  const warmWash = ctx.createLinearGradient(sw * 0.75, 0, sw * 0.15, sh);
  warmWash.addColorStop(0, 'rgba(253, 224, 135, 0.28)');
  warmWash.addColorStop(0.5, 'rgba(217, 179, 110, 0.08)');
  warmWash.addColorStop(1, 'rgba(15, 23, 42, 0.36)');
  ctx.fillStyle = warmWash;
  ctx.fillRect(0, 0, sw, sh);
  ctx.restore();

  // 2. Deep Cinematic HD-2D Corner & Foreground Diorama Vignette
  const v = ctx.createRadialGradient(sw * 0.50, sh * 0.45, Math.min(sw, sh) * 0.28, sw * 0.5, sh * 0.5, Math.max(sw, sh) * 0.72);
  v.addColorStop(0, 'rgba(0, 0, 0, 0)');
  v.addColorStop(0.68, 'rgba(8, 12, 20, 0.22)');
  v.addColorStop(1, 'rgba(5, 8, 14, 0.68)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, sw, sh);
}

