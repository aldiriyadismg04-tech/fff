const battleState = {
  active: false,
  wildMonster: null,
  habitat: null,
  playerHp: 100,
  playerMaxHp: 100,
  enemyHp: 100,
  enemyMaxHp: 100,
  turn: 'player',
  busy: false,
  aryaAnim: 'idle',
  aryaFrame: 0,
  enemyAnim: 'idle',
  enemyFrame: 0,
  tameEffectProgress: 0,
  tameSuccess: false,
  slashEffectTimer: 0,
  enemyAttackTimer: 0,
  particles: []
};

function startWildMonsterBattle(m) {
  if (!m || battleState.active) return;
  if (gameState.isHealing) {
    showToast('💚 Arya sedang dalam Healing Mode (9 detik)! Tidak bisa bertarung.');
    return;
  }
  closeDialog();
  player.vx = 0;
  player.vy = 0;
  player.targetX = null;
  player.targetY = null;

  const hab = HABITAT_ZONES.find(h => h.id === m.habitatId) || HABITAT_ZONES[0];
  const maxHp = 60 + m.level * 10;

  battleState.active = true;
  battleState.wildMonster = m;
  battleState.habitat = hab;
  battleState.playerHp = Math.max(1, gameState.playerHp);
  battleState.playerMaxHp = gameState.playerMaxHp;
  battleState.enemyHp = m.fed ? Math.round(maxHp * 0.75) : maxHp;
  battleState.enemyMaxHp = maxHp;
  battleState.turn = 'player';
  battleState.busy = false;
  battleState.aryaAnim = 'idle';
  battleState.aryaFrame = 0;
  battleState.enemyAnim = 'idle';
  battleState.enemyFrame = 0;
  battleState.tameEffectProgress = 0;
  battleState.tameSuccess = false;
  battleState.slashEffectTimer = 0;
  battleState.enemyAttackTimer = 0;
  battleState.particles = [];

  const overlay = document.getElementById('battle-overlay');
  overlay.classList.remove('hidden');

  const rarBadge = document.getElementById('battle-rarity-badge');
  rarBadge.textContent = m.rarity.name;
  rarBadge.style.color = m.rarity.color;
  rarBadge.style.borderColor = m.rarity.border;
  rarBadge.style.background = m.rarity.bg;

  document.getElementById('battle-habitat-label').textContent = hab.icon + ' ' + hab.name;
  updateBattleButtonsUI();
  setBattleLog('⚔️ ' + m.name + ' liar (Lv.' + m.level + ' • ' + m.rarity.name + ') muncul! Lemahkan HP-nya atau gunakan Skill: Tame!');
  SFX.quest();
}

function getBattleTameChance() {
  const m = battleState.wildMonster;
  if (!m) return 0;
  const hpRatio = battleState.enemyHp / Math.max(1, battleState.enemyMaxHp);
  const baseMod = m.rarity ? m.rarity.catchMod : 0.5;
  const weakenBonus = (1 - hpRatio) * 0.52;
  const berryBonus = m.fed ? 0.25 : 0;
  return Math.min(0.96, Math.max(0.15, baseMod + weakenBonus + berryBonus));
}

function updateBattleButtonsUI() {
  const berryItem = gameState.inventory.find(i => i.id === 'berry');
  const berryCount = berryItem ? berryItem.count : 0;
  const berryLbl = document.getElementById('btn-berry-label');
  if (berryLbl) berryLbl.textContent = 'Berry (' + berryCount + ')';

  const tamePct = Math.round(getBattleTameChance() * 100);
  const tameLbl = document.getElementById('btn-tame-label');
  if (tameLbl) tameLbl.textContent = 'Skill: Tame (' + tamePct + '%)';
}

function setBattleLog(msg) {
  const el = document.getElementById('battle-log-text');
  if (el) el.textContent = msg;
}

function executeBattleAttack() {
  if (!battleState.active || battleState.busy) return;
  battleState.busy = true;
  battleState.aryaAnim = 'attack';
  battleState.aryaFrame = 0;
  battleState.slashEffectTimer = 0.55;
  SFX.step();

  const dmg = Math.round(22 + Math.random() * 14);
  setBattleLog('⚔️ Arya melancarkan Serangan Energi ke arah ' + battleState.wildMonster.name + '!');

  setTimeout(() => {
    battleState.enemyHp = Math.max(5, battleState.enemyHp - dmg);
    SFX.bump();
    for (let i = 0; i < 14; i++) {
      battleState.particles.push({
        x: 410 + (Math.random() - 0.5) * 40,
        y: 145 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 120,
        vy: -40 - Math.random() * 80,
        color: '#38bdf8',
        life: 0.55
      });
    }
    updateBattleButtonsUI();
    setBattleLog('💥 ' + battleState.wildMonster.name + ' terkena ' + dmg + ' DMG! Peluang Skill: Tame meningkat menjadi ' + Math.round(getBattleTameChance() * 100) + '%!');
  }, 360);

  setTimeout(() => {
    battleState.aryaAnim = 'idle';
    triggerEnemyCounterAttack();
  }, 850);
}

function executeBattleBerry() {
  if (!battleState.active || battleState.busy) return;
  const m = battleState.wildMonster;
  const berryItem = gameState.inventory.find(i => i.id === 'berry');
  if (!berryItem || berryItem.count <= 0) {
    SFX.bump();
    setBattleLog('⚠️ Sweet Berry di dalam Bag sudah habis!');
    return;
  }
  if (m.fed) {
    setBattleLog('🍓 ' + m.name + ' sudah memakan Sweet Berry dan tampak lebih jinak!');
    return;
  }
  battleState.busy = true;
  berryItem.count--;
  m.fed = true;
  m.despawnTime += 8000;
  SFX.heal();
  updateBattleButtonsUI();
  setBattleLog('🍓 Arya memberikan Sweet Berry! ' + m.name + ' menjadi tenang (+25% peluang Tame)!');

  for (let i = 0; i < 14; i++) {
    battleState.particles.push({
      x: 410 + (Math.random() - 0.5) * 46,
      y: 150 + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 40,
      vy: -35 - Math.random() * 45,
      color: '#f472b6',
      life: 0.75
    });
  }

  setTimeout(() => {
    battleState.busy = false;
  }, 700);
}

function executeBattleTame() {
  if (!battleState.active || battleState.busy) return;
  const m = battleState.wildMonster;
  battleState.busy = true;
  battleState.aryaAnim = 'skill';
  battleState.aryaFrame = 0;
  battleState.tameEffectProgress = 0.01;
  SFX.capture();

  const chance = getBattleTameChance();
  setBattleLog('✨ Arya mengaktifkan Skill: Tame! Lingkaran Sihir Penjinak mengikat ' + m.name + '...');

  setTimeout(() => {
    const roll = Math.random();
    if (roll <= chance) {
      battleState.tameSuccess = true;
      SFX.quest();

      const dex = gameState.monstradex[m.species];
      if (dex) {
        dex.unlocked = true;
        dex.count++;
        dex.level = Math.max(dex.level, m.level);
        dex.bestRarity = m.rarity;
      }

      if (m.species === 'vulpy') {
        gameState.foxCaptured = true;
        gameState.foxFed = true;
      }
      if (!gameState.activeCompanion) {
        setCompanionMonster(m.species);
      }

      const idx = activeWildMonsters.indexOf(m);
      if (idx !== -1) activeWildMonsters.splice(idx, 1);

      updateQuestUI();
      setBattleLog('🎉 BERHASIL TAME! ' + m.name + ' (' + m.rarity.name + ') telah dijinakkan & terdaftar di Monstradex!');

      setTimeout(() => {
        closeBattleOverlay();
        showToast('✨ ' + m.name + ' (' + m.rarity.name + ') berhasil di-Tame & masuk ke Monstradex!');
      }, 1350);
    } else {
      battleState.tameEffectProgress = 0;
      battleState.aryaAnim = 'idle';
      SFX.bump();
      setBattleLog('💨 ' + m.name + ' berhasil melepaskan diri dari lingkaran Tame! Lemahkan HP-nya lagi!');
      setTimeout(() => {
        triggerEnemyCounterAttack();
      }, 700);
    }
  }, 1250);
}

function triggerEnemyCounterAttack() {
  if (!battleState.active) return;
  const m = battleState.wildMonster;
  battleState.enemyAnim = Math.random() < 0.4 ? 'skill' : 'attack';
  battleState.enemyFrame = 0;
  battleState.enemyAttackTimer = 0.65;

  const enemyDmg = Math.max(8, Math.round(10 + m.level * 1.4));
  setBattleLog('⚡ ' + m.name + ' membalas dengan serangan ' + (battleState.enemyAnim === 'skill' ? 'Skill Spesial' : 'Elemen') + ' (-' + enemyDmg + ' HP)!');

  setTimeout(() => {
    battleState.playerHp = Math.max(0, battleState.playerHp - enemyDmg);
    gameState.playerHp = battleState.playerHp;
    updatePlayerHpHud();
    SFX.bump();

    for (let i = 0; i < 12; i++) {
      battleState.particles.push({
        x: 145 + (Math.random() - 0.5) * 35,
        y: 165 + (Math.random() - 0.5) * 35,
        vx: (Math.random() - 0.5) * 90,
        vy: -30 - Math.random() * 60,
        color: '#f87171',
        life: 0.5
      });
    }

    if (battleState.playerHp <= 0) {
      setBattleLog('💔 Darah Arya habis (0)! Pertarungan dihentikan — Masuk Healing Mode (9 detik)...');
      setTimeout(() => {
        closeBattleOverlay();
        triggerPlayerHealingMode();
      }, 950);
      return;
    }
  }, 350);

  setTimeout(() => {
    if (!battleState.active) return;
    battleState.enemyAnim = 'idle';
    battleState.busy = false;
  }, 780);
}

function executeBattleRun() {
  if (!battleState.active || battleState.busy) return;
  SFX.step();
  setBattleLog('🏃 Arya mundur dari pertarungan.');
  setTimeout(() => {
    closeBattleOverlay();
  }, 250);
}

function closeBattleOverlay() {
  battleState.active = false;
  battleState.wildMonster = null;
  battleState.busy = false;
  document.getElementById('battle-overlay').classList.add('hidden');
}

function renderBattleArena(time, dt) {
  if (!battleState.active || !battleState.wildMonster) return;
  const bCanvas = document.getElementById('battle-arena-canvas');
  if (!bCanvas) return;
  const bCtx = bCanvas.getContext('2d');
  const W = bCanvas.width;
  const H = bCanvas.height;
  const m = battleState.wildMonster;
  const isAqua = m.habitatId === 'aqua_lagoon';

  const skyGrad = bCtx.createLinearGradient(0, 0, 0, H);
  if (isAqua) {
    skyGrad.addColorStop(0, '#0c2d48');
    skyGrad.addColorStop(0.55, '#1d5b79');
    skyGrad.addColorStop(1, '#143642');
  } else {
    skyGrad.addColorStop(0, '#1a2e22');
    skyGrad.addColorStop(0.55, '#2e4f34');
    skyGrad.addColorStop(1, '#1e3522');
  }
  bCtx.fillStyle = skyGrad;
  bCtx.fillRect(0, 0, W, H);

  bCtx.save();
  bCtx.fillStyle = isAqua ? 'rgba(125, 211, 252, 0.08)' : 'rgba(253, 224, 71, 0.08)';
  for (let i = 0; i < 4; i++) {
    bCtx.beginPath();
    bCtx.moveTo(80 + i * 130, 0);
    bCtx.lineTo(140 + i * 130, 0);
    bCtx.lineTo(220 + i * 130, H);
    bCtx.lineTo(130 + i * 130, H);
    bCtx.closePath();
    bCtx.fill();
  }
  bCtx.restore();

  bCtx.save();
  bCtx.fillStyle = isAqua ? '#236482' : '#3d6338';
  bCtx.beginPath();
  bCtx.ellipse(145, 204, 78, 24, 0, 0, Math.PI * 2);
  bCtx.fill();
  bCtx.strokeStyle = isAqua ? '#7dd3fc' : '#86efac';
  bCtx.lineWidth = 2;
  bCtx.stroke();

  bCtx.fillStyle = isAqua ? '#29789a' : '#4a7542';
  bCtx.beginPath();
  bCtx.ellipse(415, 176, 84, 26, 0, 0, Math.PI * 2);
  bCtx.fill();
  bCtx.strokeStyle = m.rarity.color;
  bCtx.lineWidth = 2.2;
  bCtx.stroke();
  bCtx.restore();

  if (!ARYA_SPRITE_CACHE) ARYA_SPRITE_CACHE = bakeAryaSpriteSheet();
  const aryaPool = ARYA_SPRITE_CACHE[battleState.aryaAnim] || ARYA_SPRITE_CACHE.idle;
  const aryaIdx = Math.floor(time * 0.008) % aryaPool.length;
  const aryaCanvas = aryaPool[aryaIdx];

  bCtx.save();
  bCtx.translate(145, 198);
  bCtx.scale(1.65, 1.65);
  bCtx.drawImage(aryaCanvas, -32, -56);
  bCtx.restore();

  if (battleState.slashEffectTimer > 0) {
    battleState.slashEffectTimer = Math.max(0, battleState.slashEffectTimer - dt);
    const prog = 1 - battleState.slashEffectTimer / 0.55;
    const bx = 175 + prog * 235;
    const by = 165 - Math.sin(prog * Math.PI) * 28;
    bCtx.save();
    bCtx.fillStyle = '#fef08a';
    bCtx.beginPath();
    bCtx.arc(bx, by, 10, 0, Math.PI * 2);
    bCtx.fill();
    bCtx.strokeStyle = '#38bdf8';
    bCtx.lineWidth = 3;
    bCtx.stroke();
    bCtx.restore();
  }

  let monCanvas = null;
  const animClock = time * 0.007;
  if (m.species === 'aquafly') {
    if (!AQUAFLY_SPRITE_CACHE) AQUAFLY_SPRITE_CACHE = bakeAquaflySpriteSheet();
    const pool = AQUAFLY_SPRITE_CACHE[battleState.enemyAnim] || AQUAFLY_SPRITE_CACHE.idle;
    monCanvas = pool[Math.floor(animClock) % pool.length];
  } else if (m.species === 'tirta') {
    if (!TIRTA_SPRITE_CACHE) TIRTA_SPRITE_CACHE = bakeTirtaSpriteSheet();
    const pool = TIRTA_SPRITE_CACHE[battleState.enemyAnim] || TIRTA_SPRITE_CACHE.idle;
    monCanvas = pool[Math.floor(animClock) % pool.length];
  } else if (m.species === 'huggy') {
    if (!HUGGY_SPRITE_CACHE) HUGGY_SPRITE_CACHE = bakeHuggySpriteSheet();
    const pool = HUGGY_SPRITE_CACHE[battleState.enemyAnim] || HUGGY_SPRITE_CACHE.idle;
    monCanvas = pool[Math.floor(animClock) % pool.length];
  } else if (m.species === 'sikaru') {
    if (!SIKARU_SPRITE_CACHE) SIKARU_SPRITE_CACHE = bakeSikaruSpriteSheet();
    const pool = SIKARU_SPRITE_CACHE[battleState.enemyAnim] || SIKARU_SPRITE_CACHE.idle;
    monCanvas = pool[Math.floor(animClock) % pool.length];
  }

  bCtx.save();
  const bob = Math.sin(time * 0.005) * 3;
  bCtx.translate(415, 168 + bob);
  if (m.species === 'vulpy') {
    bCtx.scale(-1.5, 1.5);
    drawWildFox(bCtx, { x: 0, y: 0, vx: 0, vy: 0, facing: 1, animTimer: time * 0.004, fed: m.fed, isCompanion: true }, time);
  } else if (monCanvas) {
    bCtx.scale(-1.55, 1.55);
    bCtx.drawImage(monCanvas, -38, -50);
  }
  bCtx.restore();

  if (battleState.tameEffectProgress > 0) {
    battleState.tameEffectProgress = Math.min(1, battleState.tameEffectProgress + dt * 0.95);
    const p = battleState.tameEffectProgress;

    bCtx.save();
    bCtx.translate(145, 200);
    bCtx.scale(1, 0.42);
    bCtx.strokeStyle = '#38bdf8';
    bCtx.lineWidth = 3;
    bCtx.beginPath();
    bCtx.arc(0, 0, 36 + Math.sin(time * 0.02) * 4, 0, Math.PI * 2);
    bCtx.stroke();
    bCtx.restore();

    const beamX = 145 + (415 - 145) * Math.min(1, p * 1.4);
    const beamY = 165 - Math.sin(Math.min(1, p * 1.4) * Math.PI) * 45;
    bCtx.save();
    bCtx.strokeStyle = '#fbbf24';
    bCtx.lineWidth = 3;
    bCtx.beginPath();
    bCtx.moveTo(145, 165);
    bCtx.quadraticCurveTo(280, 105, beamX, beamY);
    bCtx.stroke();
    bCtx.restore();

    if (p > 0.35) {
      const ringRadius = 46 * (1 - (p - 0.35) * 0.45);
      bCtx.save();
      bCtx.translate(415, 172);
      bCtx.scale(1, 0.48);
      bCtx.strokeStyle = battleState.tameSuccess ? '#4ade80' : '#fbbf24';
      bCtx.lineWidth = 3.5;
      bCtx.beginPath();
      bCtx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      bCtx.stroke();
      bCtx.restore();
    }
  }

  for (let i = battleState.particles.length - 1; i >= 0; i--) {
    const pt = battleState.particles[i];
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.life -= dt;
    if (pt.life <= 0) {
      battleState.particles.splice(i, 1);
      continue;
    }
    bCtx.fillStyle = pt.color;
    bCtx.globalAlpha = Math.max(0, pt.life);
    bCtx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
    bCtx.globalAlpha = 1;
  }

  drawBattleHpPlate(bCtx, 22, 18, 'Arya (Pengembara)', 'Lv.10', battleState.playerHp, battleState.playerMaxHp, '#38bdf8');
  drawBattleHpPlate(bCtx, W - 228, 18, m.name, 'Lv.' + m.level + ' • ' + m.rarity.name, battleState.enemyHp, battleState.enemyMaxHp, m.rarity.color);
}

function drawBattleHpPlate(ctx, x, y, name, sub, hp, maxHp, accentColor) {
  const ratio = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  ctx.save();
  ctx.fillStyle = 'rgba(10, 15, 25, 0.86)';
  ctx.fillRect(x, y, 206, 48);
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.6;
  ctx.strokeRect(x, y, 206, 48);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(name, x + 10, y + 17);

  ctx.fillStyle = accentColor;
  ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(sub, x + 196, y + 17);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + 10, y + 26, 186, 9);
  ctx.fillStyle = ratio > 0.5 ? '#4ade80' : ratio > 0.25 ? '#fbbf24' : '#f87171';
  ctx.fillRect(x + 10, y + 26, 186 * ratio, 9);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('HP ' + Math.round(hp) + '/' + maxHp, x + 10, y + 44);
  ctx.restore();
}