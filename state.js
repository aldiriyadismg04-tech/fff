const gameState = {
  currentArea: 'overworld',
  godRays: true,
  fogEnabled: true,
  tiltShiftEnabled: true,
  bloomEnabled: true,
  waterRipples: true,
  timeOfDay: 'day',
  debugOverlay: false,
  cameraMode: 'follow',
  zoom: 1.0,
  targetZoom: 1.0,
  visitedRuins: false,
  talkedToArka: false,
  talkedToLiora: false,
  foxFed: false,
  foxCaptured: false,
  discoveredHabitats: {},
  maxActiveWildMonsters: 2,
  wildMonsterLifetime: 20,
  lureDuration: 20,
  lureCooldown: 20,
  lureActiveUntil: 0,
  lureCooldownUntil: 0,
  nextRadarSpawnAt: 0,
  playerHp: 100,
  playerMaxHp: 100,
  isHealing: false,
  healingEndTime: 0,
  activeCompanion: null,
  monstradex: {
    vulpy: { unlocked: false, count: 0, bestRarity: null, level: 5 },
    sikaru: { unlocked: false, count: 0, bestRarity: null, level: 7 },
    huggy: { unlocked: false, count: 0, bestRarity: null, level: 10 },
    tirta: { unlocked: false, count: 0, bestRarity: null, level: 6 },
    aquafly: { unlocked: false, count: 0, bestRarity: null, level: 12 }
  },
  inventory: [
    { id: 'lure', name: 'Umpan Habitat', icon: '🍖', count: 12, desc: 'Gunakan di dalam kawasan Habitat [R] untuk mengaktifkan Radar Sonar 20 detik (CD 20 detik).' },
    { id: 'berry', name: 'Sweet Berry', icon: '🍓', count: 6, desc: 'Buah manis hutan yang menenangkan Monstra liar saat Battle (+25% peluang Tame).' },
    { id: 'potion', name: 'Herb Potion', icon: '🧪', count: 3, desc: 'Ramuan daun herbal segar dari Liora untuk memulihkan stamina Arya (+50 HP).' },
    { id: 'relic', name: 'Verdant Relic', icon: '💠', count: 1, desc: 'Batu prasasti kuno untuk membuka segel Reruntuhan.' }
  ]
};

const HABITAT_ZONES = [
  {
    id: 'flora_sanctuary',
    name: 'Lembah Rubah Berbunga',
    element: 'Flora',
    icon: '🌺',
    x: 245,
    y: 540,
    rx: 215,
    ry: 195,
    color: '#f472b6',
    desc: 'Suaka lembah bunga merah muda luas, jembatan batang pohon tumbang berongga, 5 sarang rubah berlumut, dan lingkar batu kuno.'
  },
  {
    id: 'aqua_lagoon',
    name: 'Danau & Laguna Teratai Kristal',
    element: 'Aqua',
    icon: '🪷',
    x: 615,
    y: 135,
    rx: 235,
    ry: 105,
    color: '#38bdf8',
    desc: 'Danau mata air bertingkat yang luas dengan air pirus dangkal, pulau batu kristal, teratai bercahaya, dan uap air dingin.'
  }
];

function updatePlayerHpHud() {
  const lbl = document.getElementById('hud-hp-label');
  const bar = document.getElementById('hud-hp-bar');
  if (!lbl || !bar) return;

  if (gameState.isHealing) {
    const rem = Math.max(0, (gameState.healingEndTime - performance.now()) / 1000);
    lbl.textContent = '💚 HEAL ' + rem.toFixed(1) + 's';
    lbl.className = 'font-extrabold text-amber-300 whitespace-nowrap animate-pulse';
    bar.style.width = Math.min(100, Math.round((1 - rem / 9) * 100)) + '%';
    bar.className = 'h-full bg-amber-400 transition-all duration-150';
  } else {
    const pct = Math.max(0, Math.min(100, Math.round((gameState.playerHp / gameState.playerMaxHp) * 100)));
    lbl.textContent = '❤️ ' + Math.round(gameState.playerHp) + '/' + gameState.playerMaxHp;
    lbl.className = 'font-extrabold text-emerald-300 whitespace-nowrap';
    bar.style.width = pct + '%';
    bar.className = 'h-full ' + (pct > 50 ? 'bg-emerald-400' : pct > 25 ? 'bg-amber-400' : 'bg-rose-500') + ' transition-all duration-200';
  }
}

function triggerPlayerHealingMode() {
  gameState.playerHp = 0;
  gameState.isHealing = true;
  gameState.healingEndTime = performance.now() + 9000;
  if (typeof player !== 'undefined') {
    player.vx = 0;
    player.vy = 0;
    player.targetX = null;
    player.targetY = null;
  }
  updatePlayerHpHud();
  if (typeof SFX !== 'undefined' && SFX.heal) SFX.heal();
  if (typeof showToast === 'function') {
    showToast('💔 Darah Arya habis (0)! Masuk Healing Mode 9 detik — Karakter tidak bisa bergerak.');
  }
}

function updateCompanionHud() {
  const badge = document.getElementById('hud-companion-badge');
  if (!badge) return;
  if (!gameState.activeCompanion) {
    badge.classList.add('hidden');
    return;
  }
  const names = { vulpy: 'Vulpy', sikaru: 'Sikaru', huggy: 'Huggy', tirta: 'Tirta', aquafly: 'Aquafly' };
  badge.textContent = '🐾 ' + (names[gameState.activeCompanion] || gameState.activeCompanion);
  badge.classList.remove('hidden');
}

function setCompanionMonster(speciesId) {
  if (!speciesId || gameState.activeCompanion === speciesId) {
    gameState.activeCompanion = null;
    if (typeof foxEntity !== 'undefined') {
      foxEntity.captured = false;
      foxEntity.isCompanion = false;
    }
    updateCompanionHud();
    if (typeof showToast === 'function') showToast('🐾 Partner diistirahatkan.');
  } else {
    const dex = gameState.monstradex[speciesId];
    if (!dex || !dex.unlocked) {
      if (typeof showToast === 'function') showToast('⚠️ Monstra ini belum di-Tame!');
      return;
    }
    gameState.activeCompanion = speciesId;
    if (typeof foxEntity !== 'undefined' && typeof player !== 'undefined') {
      foxEntity.captured = true;
      foxEntity.isCompanion = true;
      foxEntity.species = speciesId;
      foxEntity.x = player.x - 28;
      foxEntity.y = player.y + 10;
      foxEntity.vx = 0;
      foxEntity.vy = 0;
      foxEntity.state = 'idle';
      foxEntity.facing = player.facing || 1;
    }
    updateCompanionHud();
    const names = { vulpy: 'Vulpy', sikaru: 'Sikaru', huggy: 'Huggy', tirta: 'Tirta', aquafly: 'Aquafly' };
    if (typeof showToast === 'function') {
      showToast('🐾 ' + (names[speciesId] || speciesId) + ' sekarang menemani perjalananmu! (Maks 1 Partner)');
    }
  }
  if (typeof activeModalType !== 'undefined' && activeModalType === 'monstra') {
    openModal('monstra');
  }
}