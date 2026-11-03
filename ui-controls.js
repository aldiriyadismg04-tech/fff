let activeDialog = null;
let activeContextTarget = null;
let selectedMonstradexHabitatId = null;
let activeModalType = null;

function showToast(msg) {
  const banner = document.getElementById('toast-banner');
  if (!banner) return;
  banner.textContent = msg;
  banner.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => banner.classList.add('hidden'), 2800);
}

function showAreaBanner(title) {
  const el = document.getElementById('area-banner');
  if (!el) return;
  el.textContent = title;
  el.classList.remove('hidden');
  clearTimeout(showAreaBanner._t);
  showAreaBanner._t = setTimeout(() => el.classList.add('hidden'), 2600);
}

function updateQuestUI() {
  const totalUnlocked = Object.values(gameState.monstradex).filter(d => d.unlocked).length;
  const monBadge = document.getElementById('monstra-badge');
  if (monBadge) monBadge.textContent = String(totalUnlocked);

  const notifDot = document.getElementById('quest-notif-dot');
  const allDone = gameState.talkedToArka && gameState.talkedToLiora && totalUnlocked > 0 && gameState.visitedRuins;
  if (notifDot) {
    notifDot.classList.toggle('hidden', allDone);
  }
}

function openDialog(speaker, text, actions) {
  SFX.dialog();
  activeDialog = { speaker, text, actions };
  document.getElementById('dialog-speaker').textContent = speaker;
  document.getElementById('dialog-text').textContent = text;
  const actContainer = document.getElementById('dialog-actions');
  actContainer.innerHTML = '';

  (actions || [{ label: 'Tutup', action: closeDialog }]).forEach(btn => {
    const b = document.createElement('button');
    b.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition ' +
      (btn.primary
        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow'
        : 'bg-white/10 hover:bg-white/20 text-slate-200');
    b.textContent = btn.label;
    b.onclick = () => {
      SFX.step();
      btn.action();
    };
    actContainer.appendChild(b);
  });

  document.getElementById('dialog-box').classList.remove('hidden');
}

function closeDialog() {
  activeDialog = null;
  const box = document.getElementById('dialog-box');
  if (box) box.classList.add('hidden');
}

function triggerContextAction() {
  if (gameState.isHealing) {
    showToast('💚 Arya sedang dalam Healing Mode (9 detik)!');
    return;
  }
  if (!activeContextTarget) return;
  const t = activeContextTarget;

  if (t.kind === 'portal') {
    AreaTransitionSystem.transitionTo(t.data.targetArea, t.data.spawnX, t.data.spawnY, t.data.banner);
    return;
  }

  if (t.kind === 'npc') {
    const npc = t.data;
    if (npc.id === 'arka') {
      gameState.talkedToArka = true;
      updateQuestUI();
      openDialog(npc.name, 'Lembah Verdant Wilds kini membentang luas! Masuklah ke Lembah Flora atau Laguna Aqua lalu tekan tombol Umpan [R] untuk mengaktifkan Radar Sonar 20 detik.', [
        {
          label: 'Masuk ke Sanctum Reruntuhan',
          primary: true,
          action: () => {
            closeDialog();
            AreaTransitionSystem.transitionTo('ruins_interior', 400, 420, '🏛️ SANCTUM RERUNTUHAN KUNO');
          }
        },
        { label: 'Mengerti', action: closeDialog }
      ]);
    } else if (npc.id === 'liora') {
      gameState.talkedToLiora = true;
      updateQuestUI();
      openDialog(npc.name, 'Selamat datang! Sekarang semua Monstra yang sudah kamu Tame di Monstradex bisa diajak jalan mengikuti langkahmu (maksimal 1 Partner).', [
        {
          label: 'Masuk ke Pondok Liora',
          primary: true,
          action: () => {
            closeDialog();
            AreaTransitionSystem.transitionTo('cottage_interior', 320, 355, '🏡 PONDOK DESA LIORA');
          }
        },
        {
          label: 'Ambil Sweet Berry',
          action: () => {
            const berry = gameState.inventory.find(i => i.id === 'berry');
            if (berry) berry.count++;
            SFX.heal();
            showToast('🍓 Mendapatkan +1 Sweet Berry dari Liora!');
            closeDialog();
          }
        },
        { label: 'Sampai Jumpa', action: closeDialog }
      ]);
    } else if (npc.id === 'raka') {
      openDialog(npc.name, 'Jembatan Batu Alpine di Utara dan Jembatan Gantung di Ngarai Selatan sudah diperkuat. Hati-hati saat bertarung, jika darahmu 0 kamu akan masuk Healing Mode selama 9 detik!', [
        { label: 'Terima Kasih', primary: true, action: closeDialog }
      ]);
    } else if (npc.id === 'bram') {
      openDialog(npc.name, 'Halo petualang! Di gerobak dagangku tersedia Umpan Habitat gratis agar kamu bisa menyalakan Radar Sonar 20 detik di Lembah Flora maupun Laguna Aqua!', [
        {
          label: 'Ambil +5 Umpan Habitat',
          primary: true,
          action: () => {
            const lure = gameState.inventory.find(i => i.id === 'lure');
            if (lure) lure.count += 5;
            SFX.heal();
            showToast('🍖 Mendapatkan +5 Umpan Habitat dari Pedagang Bram!');
            closeDialog();
          }
        },
        { label: 'Nanti Saja', action: closeDialog }
      ]);
    } else if (npc.id === 'mina') {
      openDialog(npc.name, 'Bunga-bunga di alun-alun desa tumbuh subur karena aliran air terjun yang mengalir melalui gorong-gorong batu di bawah jalan ini.', [
        { label: 'Indah Sekali', primary: true, action: closeDialog }
      ]);
    }
  } else if (t.kind === 'wild_monster') {
    startWildMonsterBattle(t.data);
  } else if (t.kind === 'prop') {
    openDialog(t.data.title, t.data.text, [{ label: 'Tutup', primary: true, action: closeDialog }]);
  }
}

function openMonstradexHabitat(habitatId) {
  selectedMonstradexHabitatId = habitatId;
  openModal('monstra');
}

function renderMonstradexSprites() {
  const canvases = document.querySelectorAll('.monstradex-canvas');
  const now = performance.now();
  canvases.forEach(c => {
    const species = c.getAttribute('data-species');
    const unlocked = c.getAttribute('data-unlocked') === '1';
    const pCtx = c.getContext('2d');
    pCtx.clearRect(0, 0, c.width, c.height);

    let frameCanvas = null;
    if (species === 'aquafly') {
      if (!AQUAFLY_SPRITE_CACHE) AQUAFLY_SPRITE_CACHE = bakeAquaflySpriteSheet();
      frameCanvas = AQUAFLY_SPRITE_CACHE.idle[0];
    } else if (species === 'tirta') {
      if (!TIRTA_SPRITE_CACHE) TIRTA_SPRITE_CACHE = bakeTirtaSpriteSheet();
      frameCanvas = TIRTA_SPRITE_CACHE.idle[0];
    } else if (species === 'huggy') {
      if (!HUGGY_SPRITE_CACHE) HUGGY_SPRITE_CACHE = bakeHuggySpriteSheet();
      frameCanvas = HUGGY_SPRITE_CACHE.idle[0];
    } else if (species === 'sikaru') {
      if (!SIKARU_SPRITE_CACHE) SIKARU_SPRITE_CACHE = bakeSikaruSpriteSheet();
      frameCanvas = SIKARU_SPRITE_CACHE.idle[0];
    }

    pCtx.save();
    if (species === 'vulpy') {
      const off = document.createElement('canvas');
      off.width = c.width;
      off.height = c.height;
      const oCtx = off.getContext('2d');
      oCtx.translate(44, 52);
      drawWildFox(oCtx, { x: 0, y: 0, vx: 0, vy: 0, facing: 1, animTimer: now * 0.002, fed: true, isCompanion: true }, now);
      if (!unlocked) {
        oCtx.globalCompositeOperation = 'source-in';
        oCtx.fillStyle = '#020617';
        oCtx.fillRect(-44, -52, off.width, off.height);
      }
      pCtx.drawImage(off, 0, 0);
    } else if (frameCanvas) {
      const off = document.createElement('canvas');
      off.width = c.width;
      off.height = c.height;
      const oCtx = off.getContext('2d');
      oCtx.drawImage(frameCanvas, (c.width - frameCanvas.width) / 2, (c.height - frameCanvas.height) / 2);
      if (!unlocked) {
        oCtx.globalCompositeOperation = 'source-in';
        oCtx.fillStyle = '#020617';
        oCtx.fillRect(0, 0, off.width, off.height);
      }
      pCtx.drawImage(off, 0, 0);
    }
    pCtx.restore();
  });
}

function openModal(type) {
  SFX.dialog();
  activeModalType = type;
  const overlay = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  overlay.classList.remove('hidden');

  if (type === 'quest') {
    title.textContent = '📜 Daftar Misi Utama (Main Quest)';
    const totalUnlocked = Object.values(gameState.monstradex).filter(d => d.unlocked).length;
    const steps = [
      { done: gameState.talkedToArka, label: 'Bicara dengan Pak Arka di Reruntuhan Kuno' },
      { done: gameState.talkedToLiora, label: 'Kunjungi Liora di Pondok Desa Timur' },
      { done: totalUnlocked > 0, label: 'Gunakan Umpan [R] di Habitat & Tame Monstra (' + totalUnlocked + '/5)' },
      { done: gameState.visitedRuins, label: 'Masuki Sanctum Reruntuhan Kuno' }
    ];
    body.innerHTML = `
      <div class="space-y-2">
        ${steps.map(s => `
          <div class="p-3 rounded-xl border ${s.done ? 'bg-emerald-950/40 border-emerald-400/40 text-emerald-200' : 'bg-slate-900/80 border-white/10 text-slate-200'} flex items-center gap-3">
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${s.done ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-amber-300'}">${s.done ? '✓' : '•'}</span>
            <span class="font-semibold text-xs sm:text-sm ${s.done ? 'line-through opacity-80' : ''}">${s.label}</span>
          </div>
        `).join('')}
      </div>
    `;
  } else if (type === 'bag') {
    title.textContent = '🎒 Tas Petualang (Inventory)';
    body.innerHTML = gameState.inventory.map(item => `
      <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl">${item.icon}</div>
          <div>
            <div class="font-bold text-white">${item.name}</div>
            <div class="text-xs text-slate-400">${item.desc}</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 font-extrabold text-xs">x${item.count}</span>
          ${item.id === 'lure' ? `<button onclick="closeModal(); useHabitatLure();" class="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs">Pakai</button>` : ''}
          ${item.id === 'potion' && item.count > 0 ? `<button onclick="useHerbPotion();" class="px-2.5 py-1 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 font-extrabold text-xs">Heal</button>` : ''}
        </div>
      </div>
    `).join('');
  } else if (type === 'monstra') {
    if (!selectedMonstradexHabitatId) {
      title.textContent = '📖 Monstradex — Pilih Wilayah Habitat';
      const habitatCards = HABITAT_ZONES.map(h => {
        const list = MONSTRADEX_CATALOG[h.id] || [];
        const unlockedCount = list.filter(m => gameState.monstradex[m.id]?.unlocked).length;
        return `
          <div onclick="openMonstradexHabitat('${h.id}')" class="p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/15 hover:border-amber-400/60 cursor-pointer transition flex items-center justify-between gap-3 shadow-lg">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border border-white/15" style="background:${h.color}22">
                ${h.icon}
              </div>
              <div>
                <div class="font-extrabold text-white text-sm sm:text-base">${h.name}</div>
                <div class="text-xs text-slate-400 mt-0.5">Ekologi Elemen: <span class="text-amber-300 font-semibold">${h.element}</span></div>
                <div class="text-[11px] text-emerald-300 font-bold mt-1">Tercatat di Monstradex: ${unlockedCount} / ${list.length} Spesies</div>
              </div>
            </div>
            <div class="px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-200 font-extrabold text-xs shrink-0">
              Buka Monstradex →
            </div>
          </div>
        `;
      }).join('');

      body.innerHTML = `
        <div class="p-3 rounded-xl bg-slate-900/80 border border-amber-400/30 text-xs text-slate-300 leading-relaxed">
          Pilih wilayah habitat di bawah untuk melihat ensiklopedia <strong class="text-amber-300">Monstradex</strong>. Monstra yang sudah di-Tame dapat kamu <strong class="text-emerald-300">Ajak Jalan (Maksimal 1 Partner)</strong>!
        </div>
        <div class="space-y-2.5 mt-2">
          ${habitatCards}
        </div>
      `;
    } else {
      const hab = HABITAT_ZONES.find(h => h.id === selectedMonstradexHabitatId) || HABITAT_ZONES[0];
      const list = MONSTRADEX_CATALOG[hab.id] || [];
      const unlockedCount = list.filter(m => gameState.monstradex[m.id]?.unlocked).length;
      title.textContent = hab.icon + ' Monstradex: ' + hab.name;

      const entriesHtml = list.map((m, idx) => {
        const dex = gameState.monstradex[m.id] || { unlocked: false, count: 0, bestRarity: null, level: m.baseLevel };
        const unlocked = dex.unlocked;
        const speciesRar = getSpeciesRarity(m.id);
        const isPartner = gameState.activeCompanion === m.id;
        return `
          <div class="p-3.5 rounded-2xl ${unlocked ? 'bg-slate-900/95 border-emerald-400/40' : 'bg-slate-950/90 border-white/10'} border flex items-center gap-3.5">
            <div class="w-20 h-16 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center shrink-0 relative overflow-hidden">
              <canvas class="monstradex-canvas" data-species="${m.id}" data-unlocked="${unlocked ? '1' : '0'}" width="88" height="68"></canvas>
              <span class="absolute top-1 left-1.5 text-[9px] font-mono text-slate-500">#0${idx + 1}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="font-extrabold text-sm ${unlocked ? 'text-white' : 'text-slate-500'}">
                  ${unlocked ? m.name : '??? (Belum Terbuka)'}
                </div>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-extrabold" style="background:${speciesRar.bg}; color:${speciesRar.color}; border:1px solid ${speciesRar.border}">
                  ${speciesRar.name}
                </span>
              </div>
              <div class="text-[11px] ${unlocked ? 'text-amber-300' : 'text-slate-600'} font-semibold mt-0.5">
                ${unlocked ? m.title + ' • Elemen ' + m.element + ' • Lv.' + dex.level : 'Habitat: ' + hab.name}
              </div>
              <p class="text-[11px] ${unlocked ? 'text-slate-300' : 'text-slate-600 italic'} mt-1 leading-relaxed">
                ${unlocked ? m.desc : 'Gunakan Umpan [R] di ' + hab.name + ' lalu menangkan Battle dengan Skill: Tame untuk membuka data Monstra ini.'}
              </p>
              ${unlocked ? `
                <div class="mt-2 flex items-center justify-between gap-2 flex-wrap">
                  <span class="text-[10px] text-emerald-300 font-bold">Total Di-Tame: ${dex.count}x</span>
                  <button onclick="setCompanionMonster('${m.id}')" class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition ${isPartner ? 'bg-emerald-500 text-slate-950 shadow' : 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200'}">
                    ${isPartner ? '🐾 Sedang Jalan (Istirahatkan)' : '🐾 Ajak Jalan (Maks 1)'}
                  </button>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');

      body.innerHTML = `
        <div class="flex items-center justify-between gap-2 pb-2">
          <button onclick="selectedMonstradexHabitatId = null; openModal('monstra');" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs flex items-center gap-1.5">
            ← Kembali ke Daftar Habitat
          </button>
          <div class="flex items-center gap-2">
            <span class="text-xs font-extrabold text-emerald-300">Monstradex Wilayah: ${unlockedCount} / ${list.length} Terbuka</span>
            <button onclick="closeModal(); fastTravelTo(${hab.x}, ${hab.y + 20}, '${hab.icon} ${hab.name}');" class="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-[11px]">
              Ke Lokasi
            </button>
          </div>
        </div>
        <div class="space-y-2.5">
          ${entriesHtml}
        </div>
      `;
      setTimeout(renderMonstradexSprites, 25);
    }
  } else if (type === 'map') {
    title.textContent = '🗺️ Peta Dunia & Habitat Monstra (Fast Travel)';
    body.innerHTML = `
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-2 text-xs">
          <button onclick="fastTravelTo(790, 460, '🌿 Persimpangan Lembah Utama')" class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left">
            <div class="font-bold text-amber-300">📍 Persimpangan Tengah</div>
            <div class="text-slate-400 text-[11px]">Titik awal (X:790, Y:460)</div>
          </button>
          <button onclick="fastTravelTo(618, 358, '🏛️ Gerbang Reruntuhan Kuno')" class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left">
            <div class="font-bold text-amber-300">🏛️ Reruntuhan Kuno</div>
            <div class="text-slate-400 text-[11px]">Pak Arka &amp; Pintu Sanctum</div>
          </button>
          <button onclick="fastTravelTo(1018, 434, '🏡 Halaman Pondok Liora')" class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left">
            <div class="font-bold text-amber-300">🏡 Pondok Desa Liora</div>
            <div class="text-slate-400 text-[11px]">Liora &amp; Pintu Pondok</div>
          </button>
          <button onclick="fastTravelTo(815, 112, '🌉 Jembatan Batu Alpine Utara')" class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left">
            <div class="font-bold text-sky-300">🌉 Jembatan Atas (Utara)</div>
            <div class="text-slate-400 text-[11px]">Menyeberangi Hulu Air Terjun</div>
          </button>
          <button onclick="fastTravelTo(775, 773, '🌉 Jembatan Gantung Ngarai Selatan')" class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left">
            <div class="font-bold text-sky-300">🌉 Jembatan Bawah (Selatan)</div>
            <div class="text-slate-400 text-[11px]">Menyeberangi Sungai Ngarai</div>
          </button>
          <button onclick="fastTravelTo(1235, 710, '🏛️ Pusat Kota &amp; Pasar Raya')" class="p-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-left">
            <div class="font-bold text-amber-300">🏛️ Pusat Kota Tenggara</div>
            <div class="text-slate-300 text-[11px]">Pasar Raya &amp; Alun-Alun Air Mancur</div>
          </button>
        </div>

        <div class="pt-1 border-t border-white/10">
          <div class="text-xs font-extrabold uppercase tracking-wider text-emerald-300 mb-2">🐾 Kawasan Habitat Monstra (Gunakan Umpan [R])</div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            ${HABITAT_ZONES.map(h => `
              <button onclick="fastTravelTo(${h.x}, ${h.y + 15}, '${h.icon} ${h.name}')" class="p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-left flex items-start gap-2">
                <span class="text-base">${h.icon}</span>
                <div>
                  <div class="font-bold text-emerald-200 text-[11px]">${h.name}</div>
                  <div class="text-[10px] text-emerald-400/90">Elemen: ${h.element}</div>
                </div>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } else if (type === 'menu') {
    title.textContent = '⚙️ Pengaturan Engine 2.5D HD-2D';
    body.innerHTML = `
      <div class="space-y-2.5">
        <label class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
          <div>
            <div class="font-bold text-white">Lensa Tilt-Shift Diorama 2.5D</div>
            <div class="text-xs text-slate-400">Vignette sinematik &amp; kedalaman ala Octopath Traveler</div>
          </div>
          <input type="checkbox" ${gameState.tiltShiftEnabled ? 'checked' : ''} onchange="toggleTiltShift(this.checked)" class="w-5 h-5 accent-amber-400" />
        </label>
        <label class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
          <div>
            <div class="font-bold text-white">Volumetric God Rays &amp; Bokeh</div>
            <div class="text-xs text-slate-400">Bias sinar matahari keemasan diagonal &amp; partikel cahaya</div>
          </div>
          <input type="checkbox" ${gameState.godRays ? 'checked' : ''} onchange="gameState.godRays = this.checked" class="w-5 h-5 accent-amber-400" />
        </label>
        <label class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
          <div>
            <div class="font-bold text-white">Kabut Lembah &amp; Uap Air Terjun</div>
            <div class="text-xs text-slate-400">Lapisan kabut atmosferik lembut</div>
          </div>
          <input type="checkbox" ${gameState.fogEnabled ? 'checked' : ''} onchange="gameState.fogEnabled = this.checked" class="w-5 h-5 accent-amber-400" />
        </label>
        <label class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
          <div>
            <div class="font-bold text-white">Debug World Grid &amp; Colliders [F2]</div>
            <div class="text-xs text-slate-400">Tampilkan batas Chunk 400×225, pagar tipis 4px, dan collider</div>
          </div>
          <input type="checkbox" ${gameState.debugOverlay ? 'checked' : ''} onchange="gameState.debugOverlay = this.checked; updateDebugButtonUI();" class="w-5 h-5 accent-amber-400" />
        </label>
      </div>
    `;
  }
}

function useHerbPotion() {
  if (gameState.isHealing) {
    showToast('💚 Arya sedang dalam Healing Mode otomatis!');
    return;
  }
  const pot = gameState.inventory.find(i => i.id === 'potion');
  if (!pot || pot.count <= 0) return;
  if (gameState.playerHp >= gameState.playerMaxHp) {
    showToast('❤️ HP Arya sudah penuh!');
    return;
  }
  pot.count--;
  gameState.playerHp = Math.min(gameState.playerMaxHp, gameState.playerHp + 50);
  updatePlayerHpHud();
  SFX.heal();
  showToast('🧪 Menggunakan Herb Potion! HP Arya pulih menjadi ' + gameState.playerHp + '/' + gameState.playerMaxHp + '.');
  openModal('bag');
}

function toggleTiltShift(enabled) {
  gameState.tiltShiftEnabled = enabled;
  const lens = document.getElementById('diorama-lens');
  if (lens) lens.style.display = enabled ? 'block' : 'none';
}

function closeModal() {
  activeModalType = null;
  document.getElementById('modal-overlay').classList.add('hidden');
}

function fastTravelTo(x, y, label) {
  closeModal();
  if (gameState.isHealing) {
    showToast('💚 Tunggu Healing Mode selesai sebelum berpindah lokasi!');
    return;
  }
  if (gameState.currentArea !== 'overworld') {
    AreaTransitionSystem.transitionTo('overworld', x, y, label);
  } else {
    player.x = x;
    player.y = y;
    player.targetX = null;
    player.targetY = null;
    if (gameState.activeCompanion && typeof foxEntity !== 'undefined') {
      foxEntity.x = x - 26;
      foxEntity.y = y + 10;
    }
    CameraSystem.snapToPlayer();
    SFX.portal();
    showAreaBanner(label);
  }
}

function updateDebugButtonUI() {
  const btn = document.getElementById('area-badge-btn');
  if (!btn) return;
  if (gameState.debugOverlay) {
    btn.className = 'hide-on-landscape px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-extrabold transition';
  } else {
    btn.className = 'hide-on-landscape px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-bold transition';
  }
}

function toggleDebugOverlay() {
  gameState.debugOverlay = !gameState.debugOverlay;
  updateDebugButtonUI();
  showToast(gameState.debugOverlay ? '🧭 Debug World Grid & Collider: AKTIF' : '🧭 Debug World Grid & Collider: NONAKTIF');
}

function cycleCameraMode() {
  const modes = ['auto', 'follow', 'overview'];
  const idx = (modes.indexOf(gameState.cameraMode) + 1) % modes.length;
  gameState.cameraMode = modes[idx];
  CameraSystem.recalculateZoom();
  const labels = { auto: 'Otomatis', follow: 'Ikuti', overview: 'Panorama' };
  document.getElementById('cam-mode-btn').textContent = labels[gameState.cameraMode];
}

function adjustZoom(delta) {
  gameState.cameraMode = 'follow';
  document.getElementById('cam-mode-btn').textContent = 'Ikuti';
  gameState.targetZoom = Math.max(0.65, Math.min(2.4, +(gameState.targetZoom + delta).toFixed(2)));
}

const keys = {};
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k === 'f2') {
    e.preventDefault();
    toggleDebugOverlay();
  }
  if ((k === ' ' || k === 'enter' || k === 'e') && !battleState.active) {
    if (activeDialog) closeDialog();
    else if (activeContextTarget) triggerContextAction();
  }
  if (k === 'f' && !activeDialog && !battleState.active) triggerAryaAttack();
  if (k === 'q' && !activeDialog && !battleState.active) triggerAryaSkill();
  if (k === 'r' && !activeDialog && !battleState.active) useHabitatLure();
  if (k === 'escape') closeModal();
});
window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

function triggerAryaAttack() {
  if (gameState.isHealing) {
    showToast('💚 Arya sedang dalam Healing Mode (9 detik)!');
    return;
  }
  if (player.actionState === 'attack' || player.actionState === 'skill') return;
  player.actionState = 'attack';
  player.actionTimer = 0.54;
  SFX.step();
  const dir = player.facing < 0 ? -1 : 1;
  aryaProjectiles.push({
    x: player.x + dir * 14,
    y: player.y - 18,
    vx: dir * 240,
    vy: 0,
    life: 0.45,
    maxLife: 0.45
  });
}

function triggerAryaSkill() {
  if (gameState.isHealing) {
    showToast('💚 Arya sedang dalam Healing Mode (9 detik)!');
    return;
  }
  if (player.actionState === 'skill') return;
  player.actionState = 'skill';
  player.actionTimer = 0.78;
  SFX.quest();
  for (let i = 0; i < 12; i++) {
    sparkles.push({
      x: player.x + (Math.random() - 0.5) * 32,
      y: player.y - 12 + (Math.random() - 0.5) * 24,
      r: 1.5 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
      speed: 2.5 + Math.random() * 2
    });
  }
}

const dpadContainer = document.getElementById('dpad-container');
const dpadKnob = document.getElementById('dpad-knob');
let joyActive = false;
let joyVec = { x: 0, y: 0 };

function handleJoystick(clientX, clientY) {
  const rect = dpadContainer.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const maxR = rect.width * 0.34;
  let dx = clientX - cx;
  let dy = clientY - cy;
  const dist = Math.hypot(dx, dy);
  if (dist > maxR) {
    dx = (dx / dist) * maxR;
    dy = (dy / dist) * maxR;
  }
  dpadKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  joyVec.x = dx / maxR;
  joyVec.y = dy / maxR;
  player.targetX = null;
  player.targetY = null;
}

function resetJoystick() {
  joyActive = false;
  joyVec.x = 0;
  joyVec.y = 0;
  dpadKnob.style.transform = 'translate(0px, 0px)';
}

dpadContainer.addEventListener('pointerdown', e => {
  e.stopPropagation();
  joyActive = true;
  dpadContainer.setPointerCapture(e.pointerId);
  handleJoystick(e.clientX, e.clientY);
});
dpadContainer.addEventListener('pointermove', e => {
  if (!joyActive) return;
  handleJoystick(e.clientX, e.clientY);
});
dpadContainer.addEventListener('pointerup', resetJoystick);
dpadContainer.addEventListener('pointercancel', resetJoystick);