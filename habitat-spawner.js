const activeWildMonsters = [];

function getActiveHabitatAt(x, y) {
  if (gameState.currentArea !== 'overworld') return null;
  for (const h of HABITAT_ZONES) {
    const dx = (x - h.x) / h.rx;
    const dy = (y - h.y) / h.ry;
    if (dx * dx + dy * dy <= 1.05) return h;
  }
  return null;
}

function createWildMonsterInstance(habitat, rarity, idxOffset = 0) {
  const now = performance.now();
  const angle = Math.random() * Math.PI * 2;
  const distRadius = 0.25 + Math.random() * 0.42;
  const spawnX = Math.round(habitat.x + Math.cos(angle) * (habitat.rx * distRadius));
  const spawnY = Math.round(habitat.y + Math.sin(angle) * (habitat.ry * distRadius));

  if (habitat.id === 'flora_sanctuary') {
    const roll = Math.random();
    const species = roll < 0.36 ? 'vulpy' : roll < 0.68 ? 'sikaru' : 'huggy';
    const speciesRarity = getSpeciesRarity(species);
    const baseName = species === 'vulpy' ? 'Vulpy' : species === 'sikaru' ? 'Sikaru' : 'Huggy';
    const baseLv = species === 'vulpy' ? 5 : species === 'sikaru' ? 7 : 10;
    return {
      uid: 'wild_' + now + '_' + Math.random().toString(36).slice(2, 6),
      species,
      name: baseName,
      habitatId: habitat.id,
      rarity: speciesRarity,
      level: baseLv + Math.floor(Math.random() * 3),
      scale: speciesRarity.scale,
      x: spawnX,
      y: spawnY,
      vx: 0,
      vy: 0,
      homeX: habitat.x,
      homeY: habitat.y,
      leashRx: habitat.rx - 22,
      leashRy: habitat.ry - 22,
      facing: Math.random() < 0.5 ? -1 : 1,
      state: 'idle',
      frame: 0,
      animTimer: Math.random() * 5,
      aiTimer: 0.6 + Math.random() * 1.4,
      targetX: spawnX,
      targetY: spawnY,
      phase: idxOffset * 1.7,
      inWater: false,
      fed: false,
      spawnTime: now,
      despawnTime: now + gameState.wildMonsterLifetime * 1000,
      maxDuration: gameState.wildMonsterLifetime
    };
  } else {
    const species = Math.random() < 0.58 ? 'tirta' : 'aquafly';
    const speciesRarity = getSpeciesRarity(species);
    const baseName = species === 'tirta' ? 'Tirta' : 'Aquafly';
    const baseLv = species === 'tirta' ? 6 : 12;
    return {
      uid: 'wild_' + now + '_' + Math.random().toString(36).slice(2, 6),
      species,
      name: baseName,
      habitatId: habitat.id,
      rarity: speciesRarity,
      level: baseLv + Math.floor(Math.random() * 3),
      scale: speciesRarity.scale,
      x: spawnX,
      y: spawnY,
      vx: (Math.random() < 0.5 ? 1 : -1) * 20,
      vy: (Math.random() - 0.5) * 10,
      homeX: habitat.x,
      homeY: habitat.y,
      leashRx: habitat.rx - 26,
      leashRy: habitat.ry - 20,
      facing: 1,
      state: 'walk',
      frame: 0,
      animTimer: Math.random() * 5,
      aiTimer: 0.9 + Math.random() * 1.5,
      targetX: spawnX,
      targetY: spawnY,
      phase: idxOffset * 2.1,
      inWater: true,
      fed: false,
      spawnTime: now,
      despawnTime: now + gameState.wildMonsterLifetime * 1000,
      maxDuration: gameState.wildMonsterLifetime
    };
  }
}

function spawnFromActiveRadar(habitat) {
  if (!habitat) return null;
  if (activeWildMonsters.length >= gameState.maxActiveWildMonsters) return null;
  const mon = createWildMonsterInstance(habitat, null, activeWildMonsters.length);
  activeWildMonsters.push(mon);
  for (let i = 0; i < 16; i++) {
    sparkles.push({
      x: mon.x + (Math.random() - 0.5) * 32,
      y: mon.y - 8 + (Math.random() - 0.5) * 24,
      r: 1.6 + Math.random() * 2.0,
      phase: Math.random() * Math.PI * 2,
      speed: 3 + Math.random() * 2
    });
  }
  SFX.quest();
  showToast('✨ [' + mon.rarity.name + '] ' + mon.name + ' Lv.' + mon.level + ' terdeteksi Radar! (Bertahan 20 dtk)');
  return mon;
}

function useHabitatLure() {
  if (gameState.isHealing) {
    showToast('💚 Arya sedang dalam Healing Mode! Tunggu hingga pulih.');
    return;
  }
  const now = performance.now();
  const habitat = getActiveHabitatAt(player.x, player.y);
  if (!habitat) {
    SFX.bump();
    showToast('⚠️ Masuklah ke kawasan Habitat (Lembah Flora / Laguna Aqua) untuk menyalakan Umpan Radar!');
    return;
  }

  if (now < gameState.lureActiveUntil) {
    const remActive = Math.ceil((gameState.lureActiveUntil - now) / 1000);
    showToast('📡 Radar Umpan masih aktif di bawah kakimu (' + remActive + 's tersisa)!');
    return;
  }

  if (now < gameState.lureCooldownUntil) {
    const remCd = Math.ceil((gameState.lureCooldownUntil - now) / 1000);
    SFX.bump();
    showToast('⏳ Umpan sedang Cooldown! Tunggu ' + remCd + ' detik lagi.');
    return;
  }

  const lureItem = gameState.inventory.find(i => i.id === 'lure');
  if (!lureItem || lureItem.count <= 0) {
    SFX.bump();
    showToast('⚠️ Umpan Habitat habis! Kunjungi Pedagang Bram di Desa Tengah.');
    return;
  }

  lureItem.count--;
  gameState.lureActiveUntil = now + gameState.lureDuration * 1000;
  gameState.lureCooldownUntil = now + gameState.lureCooldown * 1000;
  gameState.nextRadarSpawnAt = now + 500;

  SFX.capture();
  showToast('📡 Radar Umpan aktif selama 20 detik! Memindai Monstra di ' + habitat.name + '...');
  spawnFromActiveRadar(habitat);
}

function drawWildEncounterRing(ctx, x, y, rarity, time, radiusBase = 16) {
  if (!rarity) return;
  const pulse = (Math.sin(time * 0.006) + 1) * 0.5;
  const r1 = radiusBase + pulse * 5;
  const r2 = radiusBase * 0.72;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 0.52);

  ctx.strokeStyle = rarity.color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.75 - pulse * 0.35;
  ctx.beginPath();
  ctx.arc(0, 0, r1, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = rarity.glow;
  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.arc(0, 0, r2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = rarity.border;
  ctx.lineWidth = 1.4;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(0, 0, r2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawWildMonsterCountdownTag(ctx, m, x, y, labelText) {
  if (!m || m.isCompanion || !m.despawnTime) return;
  const now = performance.now();
  const remSec = Math.max(0, (m.despawnTime - now) / 1000);
  const ratio = Math.max(0, Math.min(1, remSec / (m.maxDuration || 20)));
  const rar = m.rarity || RARITY_TIERS.common;

  ctx.save();
  ctx.font = 'bold 8px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';

  const fullText = labelText + ' • ' + Math.ceil(remSec) + 's';
  const tw = ctx.measureText(fullText).width + 14;
  const bx = x - tw / 2;
  const by = y;

  if (remSec < 4 && Math.floor(now / 160) % 2 === 0) {
    ctx.globalAlpha = 0.55;
  }

  ctx.fillStyle = rar.bg;
  ctx.fillRect(bx, by, tw, 15);
  ctx.strokeStyle = rar.border;
  ctx.lineWidth = 1.1;
  ctx.strokeRect(bx, by, tw, 15);

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(bx + 2, by + 11.5, tw - 4, 2.2);
  ctx.fillStyle = remSec < 5 ? '#f87171' : rar.color;
  ctx.fillRect(bx + 2, by + 11.5, (tw - 4) * ratio, 2.2);

  ctx.fillStyle = '#ffffff';
  ctx.fillText(fullText, x, by + 9.5);
  ctx.restore();
}