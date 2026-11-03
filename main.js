const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimapCanvas');
const mmCtx = minimapCanvas.getContext('2d');

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.15 : -0.15;
  adjustZoom(delta);
}, { passive: false });

canvas.addEventListener('pointerdown', e => {
  if (activeDialog || battleState.active || gameState.isHealing) return;
  const worldPos = WorldCoordinateSystem.screenToWorld(e.clientX, e.clientY);

  if (gameState.currentArea === 'overworld') {
    for (const m of activeWildMonsters) {
      if (Math.hypot(worldPos.x - m.x, worldPos.y - m.y) < 34) {
        if (Math.hypot(player.x - m.x, player.y - m.y) < 68) {
          activeContextTarget = { kind: 'wild_monster', data: m };
          triggerContextAction();
          return;
        }
      }
    }
    for (const npc of npcs) {
      if (Math.hypot(worldPos.x - npc.x, worldPos.y - npc.y) < 28) {
        if (Math.hypot(player.x - npc.x, player.y - npc.y) < 58) {
          activeContextTarget = { kind: 'npc', data: npc };
          triggerContextAction();
          return;
        }
      }
    }
  }

  player.targetX = worldPos.x;
  player.targetY = worldPos.y;
  clickRipples.push({ x: worldPos.x, y: worldPos.y, r: 2, alpha: 0.95 });
});

function drawPlayerSonarAndHealFX(ctx, px, py, time) {
  if (time < gameState.lureActiveUntil) {
    const remainRadar = Math.max(0, (gameState.lureActiveUntil - time) / 1000);
    const radarPulse1 = (time * 0.045) % 42;
    const radarPulse2 = ((time * 0.045) + 21) % 42;
    const sweepAngle = (time * 0.0045) % (Math.PI * 2);

    ctx.save();
    ctx.translate(px, py - 2);
    ctx.scale(1, 0.52);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.10)';
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(110, 231, 183, ' + (1 - radarPulse1 / 42).toFixed(2) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radarPulse1, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(251, 191, 36, ' + (1 - radarPulse2 / 42).toFixed(2) + ')';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, radarPulse2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(52, 211, 153, 0.28)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 42, sweepAngle, sweepAngle + 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = 'bold 7.5px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6ee7b7';
    ctx.fillText('📡 RADAR ' + Math.ceil(remainRadar) + 's', px, py + 15);
    ctx.restore();
  }

  if (gameState.isHealing) {
    const remHeal = Math.max(0, (gameState.healingEndTime - time) / 1000);
    const healProg = 1 - remHeal / 9;

    ctx.save();
    ctx.translate(px, py - 2);
    ctx.scale(1, 0.5);
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, 22 + Math.sin(time * 0.01) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(74, 222, 128, 0.22)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#86efac';
    ctx.font = 'bold 10px monospace';
    for (let i = 0; i < 3; i++) {
      const oy = ((time * 0.03 + i * 12) % 28);
      const ox = Math.sin(time * 0.005 + i * 2) * 12;
      ctx.fillText('+', px + ox - 3, py - 10 - oy);
    }

    const bw = 66, bh = 14;
    const bx = px - bw / 2, by = py - 56;
    ctx.fillStyle = 'rgba(6, 24, 14, 0.92)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(bx + 2, by + 10, (bw - 4) * Math.max(0, Math.min(1, healProg)), 2.5);
    ctx.fillStyle = '#bbf7d0';
    ctx.font = 'bold 7.5px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💚 HEAL ' + remHeal.toFixed(1) + 's', px, by + 8.5);
    ctx.restore();
  }
}

// Render semua spesies monster (baik saat liar maupun saat diajak jalan sebagai Partner) dengan arah hadap Kanan/Kiri & Idle/Walk yang presisi
function renderMonsterWithProperFacing(ctx, m, time) {
  const sp = m.species || 'vulpy';
  if (sp === 'vulpy') {
    drawWildFox(ctx, m, time);
    return;
  }

  if (!m.isCompanion && m.rarity) {
    drawWildEncounterRing(ctx, m.x, m.y, m.rarity, time, 18);
  }

  let cache = null;
  if (sp === 'aquafly') {
    if (!AQUAFLY_SPRITE_CACHE) AQUAFLY_SPRITE_CACHE = bakeAquaflySpriteSheet();
    cache = AQUAFLY_SPRITE_CACHE;
  } else if (sp === 'tirta') {
    if (!TIRTA_SPRITE_CACHE) TIRTA_SPRITE_CACHE = bakeTirtaSpriteSheet();
    cache = TIRTA_SPRITE_CACHE;
  } else if (sp === 'huggy') {
    if (!HUGGY_SPRITE_CACHE) HUGGY_SPRITE_CACHE = bakeHuggySpriteSheet();
    cache = HUGGY_SPRITE_CACHE;
  } else if (sp === 'sikaru') {
    if (!SIKARU_SPRITE_CACHE) SIKARU_SPRITE_CACHE = bakeSikaruSpriteSheet();
    cache = SIKARU_SPRITE_CACHE;
  }
  if (!cache) return;

  const isMoving = m.state === 'walk' || Math.hypot(m.vx || 0, m.vy || 0) > 4;
  const pool = isMoving ? cache.walk : cache.idle;
  const frameIdx = Math.floor(m.animTimer || 0) % pool.length;
  const spriteCanvas = pool[frameIdx] || cache.idle[0];

  ctx.save();
  ctx.translate(Math.round(m.x), Math.round(m.y));

  ctx.fillStyle = 'rgba(10, 18, 28, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (m.inWater && gameState.waterRipples) {
    const rip = (time * 0.015 + (m.phase || 0) * 8) % 16;
    ctx.strokeStyle = 'rgba(224, 247, 250, ' + (0.6 - rip / 28).toFixed(2) + ')';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(0, 1, 9 + rip * 0.7, 3.5 + rip * 0.25, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  const sc = m.scale || 1;
  // Semua sprite sheet (Aquafly, Tirta, Huggy, Sikaru) menghadap KANAN secara default.
  // Jika facing < 0 (bergerak ke kiri), balik horizontal dengan scale(-sc, sc).
  if (m.facing < 0) {
    ctx.scale(-sc, sc);
  } else {
    ctx.scale(sc, sc);
  }

  const bob = isMoving ? Math.abs(Math.sin((m.animTimer || 0) * 1.4)) * -2.5 : Math.sin(time * 0.004 + (m.phase || 0)) * 1.5;
  ctx.drawImage(spriteCanvas, -Math.round(spriteCanvas.width / 2), -spriteCanvas.height + 8 + bob);
  ctx.restore();

  if (!m.isCompanion && m.despawnTime) {
    drawWildMonsterCountdownTag(ctx, m, m.x, m.y - 40, m.name + ' Lv.' + m.level);
  }
}

function updateGame(dt, time) {
  CameraSystem.update();
  if (battleState.active) {
    renderBattleArena(time, dt);
    return;
  }

  const lureBtn = document.getElementById('lure-action-btn');
  const lureBtnLabel = document.getElementById('lure-btn-label');

  if (time < gameState.lureActiveUntil) {
    const remActive = Math.ceil((gameState.lureActiveUntil - time) / 1000);
    if (lureBtnLabel) lureBtnLabel.textContent = 'Radar (' + remActive + 's)';
    if (lureBtn) lureBtn.className = 'px-2.5 py-1 rounded-full bg-amber-500 border border-amber-200 text-slate-950 font-extrabold text-[10px] sm:text-xs shadow-lg flex items-center gap-1 animate-pulse';

    const curHab = getActiveHabitatAt(player.x, player.y);
    if (curHab && time >= gameState.nextRadarSpawnAt) {
      if (activeWildMonsters.length < gameState.maxActiveWildMonsters) {
        spawnFromActiveRadar(curHab);
      }
      gameState.nextRadarSpawnAt = time + 4500;
    }
  } else if (time < gameState.lureCooldownUntil) {
    const remCd = Math.ceil((gameState.lureCooldownUntil - time) / 1000);
    if (lureBtnLabel) lureBtnLabel.textContent = 'CD ' + remCd + 's';
    if (lureBtn) lureBtn.className = 'px-2.5 py-1 rounded-full bg-slate-800 border border-slate-500/50 text-slate-400 font-extrabold text-[10px] sm:text-xs shadow-lg flex items-center gap-1 opacity-80';
  } else {
    const lureItem = gameState.inventory.find(i => i.id === 'lure');
    const lureCount = lureItem ? lureItem.count : 0;
    if (lureBtnLabel) lureBtnLabel.textContent = 'Umpan (' + lureCount + ') [R]';
    if (lureBtn) lureBtn.className = 'px-2.5 py-1 rounded-full bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-200/70 text-white font-extrabold text-[10px] sm:text-xs shadow-lg flex items-center gap-1 active:scale-90 transition';
  }

  // HEALING MODE 9 DETIK SAAT DARAH = 0 (KARAKTER TIDAK BISA BERGERAK)
  if (gameState.isHealing) {
    const remHeal = gameState.healingEndTime - time;
    player.vx = 0;
    player.vy = 0;
    player.targetX = null;
    player.targetY = null;
    if (remHeal <= 0) {
      gameState.isHealing = false;
      gameState.playerHp = gameState.playerMaxHp;
      updatePlayerHpHud();
      SFX.heal();
      showToast('💚 Healing Mode selesai! Darah Arya pulih penuh (100/100).');
    } else {
      const healProgress = 1 - remHeal / 9000;
      gameState.playerHp = Math.min(gameState.playerMaxHp, Math.round(healProgress * gameState.playerMaxHp));
      updatePlayerHpHud();
    }
  }

  let dx = 0, dy = 0;
  if (!activeDialog && !AreaTransitionSystem.isTransitioning && !gameState.isHealing) {
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (joyActive) {
      dx = joyVec.x;
      dy = joyVec.y;
    } else if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      player.targetX = null;
      player.targetY = null;
    } else if (player.targetX !== null && player.targetY !== null) {
      const tdx = player.targetX - player.x;
      const tdy = player.targetY - player.y;
      const dist = Math.hypot(tdx, tdy);
      if (dist > 5) {
        dx = tdx / dist;
        dy = tdy / dist;
      } else {
        player.targetX = null;
        player.targetY = null;
      }
    }
  }

  const speedMod = player.inWater ? 0.78 : 1.0;
  player.vx = dx * player.speed * speedMod;
  player.vy = dy * player.speed * speedMod;

  if (Math.hypot(player.vx, player.vy) > 5) {
    const nextX = player.x + player.vx * dt;
    const nextY = player.y + player.vy * dt;

    if (!CollisionSystem.check(nextX, player.y, player.radius)) {
      player.x = nextX;
    } else {
      player.targetX = null;
    }
    if (!CollisionSystem.check(player.x, nextY, player.radius)) {
      player.y = nextY;
    } else {
      player.targetY = null;
    }

    if (Math.abs(player.vx) > 3) {
      player.facing = player.vx < 0 ? -1 : 1;
    }
    player.animTimer += dt * (player.inWater ? 7 : 10);
    player.stepSoundTimer -= dt;
    if (player.stepSoundTimer <= 0) {
      if (player.inWater) {
        SFX.splash();
        if (gameState.waterRipples) {
          waterRipples.push({ x: player.x, y: player.y, r: 4, maxR: 20, alpha: 0.75 });
        }
      } else {
        SFX.step();
      }
      player.stepSoundTimer = player.inWater ? 0.36 : 0.28;
    }
  } else {
    player.vx = 0;
    player.vy = 0;
    player.idleCycleTimer += dt;
  }

  if (player.actionTimer > 0) {
    player.actionTimer -= dt;
    if (player.actionTimer <= 0) {
      player.actionState = 'idle';
    }
  }

  for (let i = aryaProjectiles.length - 1; i >= 0; i--) {
    const proj = aryaProjectiles[i];
    proj.x += proj.vx * dt;
    proj.y += proj.vy * dt;
    proj.life -= dt;
    if (proj.life <= 0) aryaProjectiles.splice(i, 1);
  }

  player.inWater = (gameState.currentArea === 'overworld') && WaterSystem.isWaterAt(player.x, player.y);

  const coordEl = document.getElementById('coord-label');
  if (coordEl) {
    const ch = WorldCoordinateSystem.worldToChunk(player.x, player.y);
    coordEl.textContent = `X:${Math.round(player.x)} Y:${Math.round(player.y)} C(${ch.cx},${ch.cy})`;
  }

  if (gameState.currentArea === 'overworld') {
    for (const h of HABITAT_ZONES) {
      const dxH = (player.x - h.x) / h.rx;
      const dyH = (player.y - h.y) / h.ry;
      if (dxH * dxH + dyH * dyH <= 0.85 && !gameState.discoveredHabitats[h.id]) {
        gameState.discoveredHabitats[h.id] = true;
        SFX.quest();
        showAreaBanner(`${h.icon} HABITAT DITEMUKAN: ${h.name.toUpperCase()} — Tekan Umpan [R]`);
      }
    }
  }

  if (gameState.currentArea === 'overworld') {
    npcs.forEach(npc => {
      npc.patrolTimer -= dt;
      if (npc.patrolTimer <= 0) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 20;
        npc.targetX = npc.homeX + Math.cos(angle) * r;
        npc.targetY = npc.homeY + Math.sin(angle) * r;
        npc.patrolTimer = 2.5 + Math.random() * 3.5;
      }
      const ndx = npc.targetX - npc.x;
      const ndy = npc.targetY - npc.y;
      const ndist = Math.hypot(ndx, ndy);
      if (ndist > 2) {
        npc.vx = (ndx / ndist) * 24;
        npc.vy = (ndy / ndist) * 24;
        npc.x += npc.vx * dt;
        npc.y += npc.vy * dt;
        npc.facing = npc.vx < 0 ? -1 : 1;
        npc.animTimer += dt * 6;
      } else {
        npc.vx = 0;
        npc.vy = 0;
      }
    });

    const nowMs = performance.now();
    for (let i = activeWildMonsters.length - 1; i >= 0; i--) {
      const m = activeWildMonsters[i];
      if (nowMs >= m.despawnTime) {
        activeWildMonsters.splice(i, 1);
        showToast(`💨 ${m.name} (${m.rarity.name}) menghilang kembali ke alam liar.`);
        continue;
      }

      m.aiTimer -= dt;
      if (m.aiTimer <= 0) {
        const angle = Math.random() * Math.PI * 2;
        const rad = 0.2 + Math.random() * 0.65;
        m.targetX = m.homeX + Math.cos(angle) * (m.leashRx * rad);
        m.targetY = m.homeY + Math.sin(angle) * (m.leashRy * rad);
        m.state = Math.random() < 0.72 ? 'walk' : 'idle';
        m.aiTimer = 1.2 + Math.random() * 2.0;
      }

      if (m.state === 'walk') {
        const mdx = m.targetX - m.x;
        const mdy = m.targetY - m.y;
        const mdist = Math.hypot(mdx, mdy);
        if (mdist > 4) {
          const spd = m.species === 'aquafly' ? 32 : 24;
          m.vx = (mdx / mdist) * spd;
          m.vy = (mdy / mdist) * spd;
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          if (Math.abs(m.vx) > 1.5) m.facing = m.vx < 0 ? -1 : 1;
        } else {
          m.vx = 0;
          m.vy = 0;
          m.state = 'idle';
        }
      } else {
        m.vx = 0;
        m.vy = 0;
      }

      const relX = (m.x - m.homeX) / m.leashRx;
      const relY = (m.y - m.homeY) / m.leashRy;
      const relDist = Math.hypot(relX, relY);
      if (relDist > 0.96) {
        m.x = m.homeX + (relX / relDist) * m.leashRx * 0.92;
        m.y = m.homeY + (relY / relDist) * m.leashRy * 0.92;
      }

      m.inWater = WaterSystem.isWaterAt(m.x, m.y);
      m.animTimer += dt * (m.state === 'walk' ? 8 : 4);
    }
  }

  // UPDATE PARTNER MONSTER YANG DIAJAK JALAN (MAKS 1, HADAP KANAN/KIRI & IDLE/WALK)
  if (gameState.activeCompanion) {
    foxEntity.captured = true;
    foxEntity.isCompanion = true;
    foxEntity.species = gameState.activeCompanion;
    const followDist = Math.hypot(player.x - foxEntity.x, player.y - foxEntity.y);
    if (followDist > 34) {
      const fdx = (player.x - foxEntity.x) / followDist;
      const fdy = (player.y - foxEntity.y) / followDist;
      foxEntity.vx = fdx * (player.speed * 0.95);
      foxEntity.vy = fdy * (player.speed * 0.95);
      foxEntity.x += foxEntity.vx * dt;
      foxEntity.y += foxEntity.vy * dt;
      foxEntity.state = 'walk';
      if (Math.abs(foxEntity.vx) > 2) {
        foxEntity.facing = foxEntity.vx < 0 ? -1 : 1;
      }
      foxEntity.animTimer += dt * 9;
    } else {
      foxEntity.vx = 0;
      foxEntity.vy = 0;
      foxEntity.state = 'idle';
      foxEntity.animTimer += dt * 3.5;
    }
    foxEntity.inWater = (gameState.currentArea === 'overworld') && WaterSystem.isWaterAt(foxEntity.x, foxEntity.y);
  } else {
    foxEntity.captured = false;
    foxEntity.isCompanion = false;
  }

  for (let i = waterRipples.length - 1; i >= 0; i--) {
    const wr = waterRipples[i];
    wr.r += dt * 22;
    wr.alpha -= dt * 0.65;
    if (wr.alpha <= 0) waterRipples.splice(i, 1);
  }

  activeContextTarget = null;
  const promptEl = document.getElementById('interact-prompt');
  const labelEl = document.getElementById('interact-label');

  if (!activeDialog && !AreaTransitionSystem.isTransitioning && !battleState.active && !gameState.isHealing) {
    const portals = AreaTransitionSystem.portals[gameState.currentArea] || [];
    for (const p of portals) {
      const d = Math.hypot(player.x - p.x, player.y - p.y);
      if (d < p.r) {
        AreaTransitionSystem.transitionTo(p.targetArea, p.spawnX, p.spawnY, p.banner);
        return;
      } else if (d < p.r + 24) {
        activeContextTarget = { kind: 'portal', data: p };
        labelEl.textContent = `${p.prompt} [E / Tap]`;
        promptEl.classList.remove('hidden');
        break;
      }
    }

    if (!activeContextTarget && gameState.currentArea === 'overworld') {
      let bestDist = 48;
      for (const m of activeWildMonsters) {
        const d = Math.hypot(player.x - m.x, player.y - m.y);
        if (d < bestDist) {
          bestDist = d;
          activeContextTarget = { kind: 'wild_monster', data: m };
          labelEl.textContent = `⚔️ Battle ${m.name} (${m.rarity.name}) [E / Tap]`;
        }
      }
      for (const npc of npcs) {
        const d = Math.hypot(player.x - npc.x, player.y - npc.y);
        if (d < bestDist) {
          bestDist = d;
          activeContextTarget = { kind: 'npc', data: npc };
          labelEl.textContent = `Sapa ${npc.name.split(' ')[0]} [E / Tap]`;
        }
      }
      for (const prop of interactables) {
        const d = Math.hypot(player.x - prop.x, player.y - prop.y);
        if (d < prop.r) {
          activeContextTarget = { kind: 'prop', data: prop };
          labelEl.textContent = `${prop.prompt} [E / Tap]`;
        }
      }
    }
  }

  if (activeContextTarget) {
    promptEl.classList.remove('hidden');
  } else {
    promptEl.classList.add('hidden');
  }

  waterPlumes.forEach(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life += dt * 1.3;
    if (p.life >= 1) {
      p.x = OX + 362 + Math.random() * 52;
      p.y = OY + 102 + Math.random() * 14;
      p.life = 0;
    }
  });

  if (gameState.fogEnabled) {
    fogClouds.forEach(f => {
      f.x += f.speed * dt;
      if (f.x - f.w > WORLD_W) f.x = -f.w;
    });
  }

  for (let i = clickRipples.length - 1; i >= 0; i--) {
    clickRipples[i].r += dt * 36;
    clickRipples[i].alpha -= dt * 1.5;
    if (clickRipples[i].alpha <= 0) clickRipples.splice(i, 1);
  }
}

function drawGodRays(ctx, time) {
  if (!gameState.godRays || gameState.currentArea !== 'overworld') return;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  const rays = [
    { x: OX + 180, w: 95, a: 0.065 },
    { x: OX + 380, w: 135, a: 0.085 },
    { x: OX + 620, w: 110, a: 0.06 },
    { x: 220, w: 110, a: 0.055 },
    { x: 1320, w: 120, a: 0.06 }
  ];

  rays.forEach((ray, i) => {
    const pulse = Math.sin(time * 0.001 + i * 1.4) * 0.02;
    const grad = ctx.createLinearGradient(ray.x + 180, 0, ray.x - 160, WORLD_H);
    grad.addColorStop(0, `rgba(255, 244, 195, ${ray.a + pulse})`);
    grad.addColorStop(0.55, `rgba(253, 224, 130, ${(ray.a + pulse) * 0.45})`);
    grad.addColorStop(1, 'rgba(253, 224, 130, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ray.x + 120, 0);
    ctx.lineTo(ray.x + 120 + ray.w, 0);
    ctx.lineTo(ray.x - 180 + ray.w, WORLD_H);
    ctx.lineTo(ray.x - 180, WORLD_H);
    ctx.closePath();
    ctx.fill();
  });

  ctx.restore();
}

function drawFog(ctx, time) {
  if (!gameState.fogEnabled || gameState.currentArea !== 'overworld') return;
  ctx.save();
  fogClouds.forEach(f => {
    const grad = ctx.createRadialGradient(f.x, f.y, 8, f.x, f.y, f.w * 0.6);
    grad.addColorStop(0, `rgba(232, 242, 252, ${f.alpha})`);
    grad.addColorStop(0.6, `rgba(210, 226, 244, ${f.alpha * 0.45})`);
    grad.addColorStop(1, 'rgba(210, 226, 244, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(f.x, f.y, f.w * 0.65, f.h * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawDebugOverlay(ctx) {
  if (!gameState.debugOverlay) return;
  ctx.save();

  const tileSize = 32;
  const startX = Math.floor(CameraSystem.x / tileSize) * tileSize;
  const startY = Math.floor(CameraSystem.y / tileSize) * tileSize;
  const endX = CameraSystem.x + CameraSystem.viewW;
  const endY = CameraSystem.y + CameraSystem.viewH;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 0.5;
  for (let gx = startX; gx <= endX; gx += tileSize) {
    ctx.beginPath();
    ctx.moveTo(gx, startY);
    ctx.lineTo(gx, endY);
    ctx.stroke();
  }
  for (let gy = startY; gy <= endY; gy += tileSize) {
    ctx.beginPath();
    ctx.moveTo(startX, gy);
    ctx.lineTo(endX, gy);
    ctx.stroke();
  }

  if (gameState.currentArea === 'overworld') {
    for (let cy = 0; cy < CHUNK_ROWS; cy++) {
      for (let cx = 0; cx < CHUNK_COLS; cx++) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(cx * CHUNK_W, cy * CHUNK_H, CHUNK_W, CHUNK_H);
      }
    }
  }

  const list = CollisionSystem.colliders[gameState.currentArea] || [];
  list.forEach(c => {
    if (c.kind === 'fence') {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
      ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
    } else {
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.75)';
      ctx.fillStyle = 'rgba(248, 113, 113, 0.22)';
    }
    ctx.lineWidth = 1;
    if (c.type === 'rect') {
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeRect(c.x, c.y, c.w, c.h);
    } else if (c.type === 'circle') {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  });

  ctx.restore();
}

function renderGame(time) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);

  ctx.save();
  ctx.scale(gameState.zoom, gameState.zoom);
  ctx.translate(-Math.round(CameraSystem.x), -Math.round(CameraSystem.y));

  if (gameState.currentArea === 'overworld') {
    ChunkManager.renderVisibleChunks(ctx);
    drawAnimatedWater(ctx, time);

    waterRipples.forEach(wr => {
      ctx.strokeStyle = `rgba(240, 249, 255, ${wr.alpha})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.ellipse(wr.x, wr.y, wr.r, wr.r * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
    });

    clickRipples.forEach(rp => {
      ctx.strokeStyle = `rgba(251, 191, 36, ${rp.alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
    });

    const renderList = [];
    const margin = 120;

    worldProps.forEach(p => {
      if (
        p.x + p.w < CameraSystem.x - margin ||
        p.x - p.w > CameraSystem.x + CameraSystem.viewW + margin ||
        p.y + p.h < CameraSystem.y - margin ||
        p.y - p.h > CameraSystem.y + CameraSystem.viewH + margin
      ) return;

      renderList.push({
        y: p.y,
        draw: () => {
          if (p.type === 'pine') drawPineTree(ctx, p.x, p.y, p.scale, p.variant);
          else if (p.type === 'oak' || p.type === 'sakuraOak') drawRoundTree(ctx, p.x, p.y, p.scale, p.type);
          else if (p.type === 'bush') drawBush(ctx, p.x, p.y, p.scale, p.flowers);
        }
      });
    });

    renderList.push({
      y: OY + 272,
      draw: () => {
        const lanX = OX + 566, lanY = OY + 190;
        const glow = ctx.createRadialGradient(lanX, lanY, 2, lanX, lanY, 44);
        glow.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
        glow.addColorStop(0.5, 'rgba(251, 191, 36, 0.22)');
        glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(lanX, lanY, 44, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    activeWildMonsters.forEach(m => {
      renderList.push({
        y: m.y,
        draw: () => renderMonsterWithProperFacing(ctx, m, time)
      });
    });

    if (gameState.activeCompanion && foxEntity.captured) {
      renderList.push({
        y: foxEntity.y,
        draw: () => renderMonsterWithProperFacing(ctx, foxEntity, time)
      });
    }

    npcs.forEach(npc => {
      renderList.push({
        y: npc.y,
        draw: () => {
          drawChibiCharacter(ctx, {
            x: npc.x,
            y: npc.y,
            facing: npc.facing,
            frame: npc.animTimer,
            isMoving: Math.hypot(npc.vx, npc.vy) > 2,
            hatColor: npc.hatColor,
            shirtColor: npc.shirtColor,
            dressColor: npc.dressColor,
            showBubble: true,
            inWater: npc.inWater,
            time
          });
        }
      });
    });

    renderList.push({
      y: player.y,
      draw: () => {
        drawPlayerSonarAndHealFX(ctx, player.x, player.y, time);
        drawPlayerSprite(ctx, player, time);
      }
    });

    renderList.sort((a, b) => a.y - b.y);
    renderList.forEach(item => item.draw());

    aryaProjectiles.forEach(proj => {
      ctx.save();
      const grad = ctx.createRadialGradient(proj.x, proj.y, 1, proj.x, proj.y, 10);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.45, '#38bdf8');
      grad.addColorStop(0.8, '#fbbf24');
      grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    sparkles.forEach(sp => {
      const a = (Math.sin(time * 0.003 * sp.speed + sp.phase) + 1) * 0.5;
      ctx.fillStyle = `rgba(254, 240, 138, ${a * 0.85})`;
      ctx.fillRect(
        Math.round(sp.x),
        Math.round(sp.y + Math.sin(time * 0.002 + sp.phase) * 4),
        Math.ceil(sp.r),
        Math.ceil(sp.r)
      );
    });

    drawGodRays(ctx, time);
    drawFog(ctx, time);
  } else if (gameState.currentArea === 'ruins_interior') {
    drawRuinsInterior(ctx, time);
    if (gameState.activeCompanion && foxEntity.captured) {
      renderMonsterWithProperFacing(ctx, foxEntity, time);
    }
    drawPlayerSonarAndHealFX(ctx, player.x, player.y, time);
    drawPlayerSprite(ctx, player, time);
  } else if (gameState.currentArea === 'cottage_interior') {
    drawCottageInterior(ctx, time);
    if (gameState.activeCompanion && foxEntity.captured) {
      renderMonsterWithProperFacing(ctx, foxEntity, time);
    }
    drawPlayerSonarAndHealFX(ctx, player.x, player.y, time);
    drawPlayerSprite(ctx, player, time);
  }

  drawDebugOverlay(ctx);
  ctx.restore();

  if (gameState.bloomEnabled && gameState.currentArea === 'overworld') {
    const grade = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    grade.addColorStop(0, 'rgba(251, 191, 36, 0.05)');
    grade.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    grade.addColorStop(1, 'rgba(10, 15, 28, 0.16)');
    ctx.fillStyle = grade;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  if (AreaTransitionSystem.fadeAlpha > 0) {
    ctx.fillStyle = `rgba(6, 9, 14, ${AreaTransitionSystem.fadeAlpha})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  drawMinimap(time);
}

function drawMinimap(time) {
  mmCtx.clearRect(0, 0, 128, 128);
  const b = AreaTransitionSystem.getAreaBounds();

  if (gameState.currentArea === 'overworld' && ChunkManager.fullCanvas) {
    mmCtx.drawImage(ChunkManager.fullCanvas, 0, 0, WORLD_W, WORLD_H, 0, 0, 128, 128);
  } else {
    mmCtx.fillStyle = '#1e293b';
    mmCtx.fillRect(0, 0, 128, 128);
  }

  const sx = 128 / b.w;
  const sy = 128 / b.h;

  if (gameState.currentArea === 'overworld') {
    HABITAT_ZONES.forEach(h => {
      mmCtx.strokeStyle = h.color;
      mmCtx.lineWidth = 1.2;
      mmCtx.beginPath();
      mmCtx.arc(h.x * sx, h.y * sy, 4.5, 0, Math.PI * 2);
      mmCtx.stroke();
    });

    mmCtx.fillStyle = '#fbbf24';
    npcs.forEach(n => {
      mmCtx.beginPath();
      mmCtx.arc(n.x * sx, n.y * sy, 2.5, 0, Math.PI * 2);
      mmCtx.fill();
    });

    activeWildMonsters.forEach(m => {
      mmCtx.fillStyle = m.rarity ? m.rarity.color : '#fb923c';
      mmCtx.beginPath();
      mmCtx.arc(m.x * sx, m.y * sy, 3.0, 0, Math.PI * 2);
      mmCtx.fill();
    });
  }

  mmCtx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  mmCtx.lineWidth = 1;
  mmCtx.strokeRect(
    CameraSystem.x * sx,
    CameraSystem.y * sy,
    CameraSystem.viewW * sx,
    CameraSystem.viewH * sy
  );

  const px = player.x * sx;
  const py = player.y * sy;

  mmCtx.save();
  mmCtx.translate(px, py);
  const angle = (Math.hypot(player.vx, player.vy) > 2)
    ? Math.atan2(player.vy, player.vx) + Math.PI / 2
    : (player.facing < 0 ? -Math.PI / 2 : Math.PI / 2);
  mmCtx.rotate(angle);

  mmCtx.fillStyle = '#38bdf8';
  mmCtx.strokeStyle = '#ffffff';
  mmCtx.lineWidth = 1.5;
  mmCtx.beginPath();
  mmCtx.moveTo(0, -6);
  mmCtx.lineTo(5, 5);
  mmCtx.lineTo(0, 2.5);
  mmCtx.lineTo(-5, 5);
  mmCtx.closePath();
  mmCtx.fill();
  mmCtx.stroke();
  mmCtx.restore();
}

let lastFrameTime = performance.now();
function gameLoop(now) {
  const dt = Math.min((now - lastFrameTime) / 1000, 0.1);
  lastFrameTime = now;
  try {
    updateGame(dt, now);
    renderGame(now);
  } catch (err) {
    console.error('GameLoop Error:', err);
  }
  requestAnimationFrame(gameLoop);
}

function initGame() {
  buildWorldData();
  ChunkManager.bakeOverworld();
  bakeAryaSpriteSheet();
  bakeAquaflySpriteSheet();
  bakeTirtaSpriteSheet();
  bakeHuggySpriteSheet();
  bakeSikaruSpriteSheet();
  CameraSystem.recalculateZoom();
  CameraSystem.snapToPlayer();
  updateQuestUI();
  updatePlayerHpHud();
  updateCompanionHud();
  window.addEventListener('resize', () => CameraSystem.recalculateZoom());
  showAreaBanner('🌿 VERDANT WILDS — Gunakan Umpan [R] di Habitat untuk Memanggil Monstra');
  requestAnimationFrame(gameLoop);
}

initGame();