// js/areas.js — MONSTRA: WILDBOUND Modular Script

// ============================================================================
// 8. AREA TRANSITION & MULTI-AREA SETUP SYSTEM
// ============================================================================
const AreaTransitionSystem = {
  transitionTo(targetArea, spawnX, spawnY, dir = 'down', bannerTitle = '') {
    if (gameState.transitioning) return;
    gameState.transitioning = true;
    playSound('quest');
    closeDialogue();

    const curtain = document.getElementById('area-transition-curtain');
    if (curtain) curtain.style.opacity = '1';

    setTimeout(() => {
      setupArea(targetArea);
      player.x = spawnX;
      player.y = spawnY;
      player.dir = dir;
      player.targetX = null;
      player.targetY = null;

      camera.x = player.x;
      camera.y = player.y;
      recalculateCameraZoom();

      if (foxEntity && gameState.foxCaught && gameState.foxFollowing) {
        foxEntity.x = player.x - 18;
        foxEntity.y = player.y + 8;
      }

      const secName = bannerTitle || WorldCoordinateSystem.getSectorName(targetArea, player.x, player.y);
      gameState.currentSectorName = secName;
      showAreaBanner(secName);

      setTimeout(() => {
        if (curtain) curtain.style.opacity = '0';
        gameState.transitioning = false;
      }, 180);
    }, 260);
  }
};

function showAreaBanner(titleText) {
  const banner = document.getElementById('area-banner');
  const label = document.getElementById('area-banner-text');
  if (!banner || !label) return;
  label.textContent = titleText;
  banner.classList.remove('opacity-0', '-translate-y-2');
  banner.classList.add('opacity-100', 'translate-y-0');
  clearTimeout(showAreaBanner._timer);
  showAreaBanner._timer = setTimeout(() => {
    banner.classList.remove('opacity-100', 'translate-y-0');
    banner.classList.add('opacity-0', '-translate-y-2');
  }, 2600);
}

function setupArea(areaId) {
  gameState.currentArea = areaId;
  worldProps.length = 0;
  interactables = [];
  CollisionSystem.clear();

  if (areaId === 'verdant_wilds') {
    ChunkManager.initForArea(1600, 900, buildOverworldEnvironment);

    // ========================================================================
    // 1. WALKABLE STAIR, BRIDGE & WADING OVERRIDES (STRICTLY ALIGNED 1:1)
    // ========================================================================
    // Bridges (North Stone Bridge & South Suspension Bridge)
    CollisionSystem.addWalkableOverride(736, 88, 158, 54, 'north_alpine_bridge');
    CollisionSystem.addWalkableOverride(OX + 250, OY + 528, 250, 42, 'south_ravine_bridge');

    // Sloped Cliffside Staircases (Only through these 4 carved staircases can cliffs be crossed!)
    CollisionSystem.addWalkableOverride(408,      OY - 6,   58, 128, 'left_lagoon_cliff_stairs');
    CollisionSystem.addWalkableOverride(OX + 558, OY - 6,   64, 128, 'right_alpine_cliff_stairs');
    CollisionSystem.addWalkableOverride(OX + 678, OY + 298, 70, 114, 'southeast_ravine_stairs');
    CollisionSystem.addWalkableOverride(OX + 84,  OY + 330, 62, 112, 'southwest_ravine_stairs');

    // Wading entries into the Expanded Lagoon, Waterfall Plunge Basin, and Southern Stream
    CollisionSystem.addWalkableOverride(315,      58,       465, 165, 'aqua_sanctuary_wading');
    CollisionSystem.addWalkableOverride(OX + 358, OY + 96,  112, 62,  'lagoon_wading_entry');
    CollisionSystem.addWalkableOverride(OX + 320, OY + 515, 165, 95,  'ravine_wading_entry');

    // ========================================================================
    // 2. COMPLETE SOLID MOUNTAIN, CLIFF, RUINS, TOWN & THIN FENCE COLLIDERS
    // ========================================================================
    // (A) Far Northern World Boundary Ridge (0..1600)
    CollisionSystem.addBox(0, 0, 1600, 66, 'cliff');

    // (B) Upper-West & Ancient Ruins Cliff Face (Solid except at Left Lagoon Stairs X:408..466)
    CollisionSystem.addBox(0,        OY + 8,  408, 92,  'cliff');
    CollisionSystem.addBox(466,      OY + 8,  30,  96,  'cliff');
    CollisionSystem.addBox(OX + 96,  OY + 4,  72,  126, 'ruins');
    CollisionSystem.addBox(OX + 216, OY + 4,  74,  126, 'ruins');
    CollisionSystem.addBox(OX + 286, OY + 16, 74,  104, 'cliff');

    // (C) Waterfall Cliff Face & Upper-Right Cliff Terrace (Solid except at Right Alpine Stairs X:958..1022)
    CollisionSystem.addBox(OX + 354, OY - 6,  82,  102, 'cliff'); // Waterfall drop-off
    CollisionSystem.addBox(OX + 434, OY + 8,  124, 98,  'cliff'); // Cliff between waterfall & right stairs
    CollisionSystem.addBox(OX + 622, OY + 8,  578, 74,  'cliff'); // Cliff behind cottage & east highland

    // (D) Lower Ravine Rim & Gorge Cliff Wall (Solid except at SW Stairs X:484..546 and SE Stairs X:1078..1148)
    CollisionSystem.addBox(375,      OY + 345, 108, 66, 'cliff'); // West of SW stairs
    CollisionSystem.addBox(OX + 146, OY + 332, 218, 78, 'cliff'); // Between SW stairs & central river gorge
    CollisionSystem.addBox(OX + 436, OY + 325, 240, 74, 'cliff'); // Between central river gorge & SE stairs

    // (E) Village Cottage, Market Stall, Central Hub Props, Shrine & Well
    CollisionSystem.addBox(OX + 608, OY + 100, 146, 94, 'cottage');
    CollisionSystem.addBox(OX + 758, OY + 165, 50,  44, 'stall');
    CollisionSystem.addBox(OX + 462, OY + 256, 38,  20, 'merchant_cart');
    CollisionSystem.addBox(OX + 256, OY + 156, 40,  16, 'pergola_bench');
    CollisionSystem.addCircle(OX + 334, OY + 170, 10,   'campfire');
    CollisionSystem.addBox(OX + 524, OY + 258, 58,  20, 'noticeboard');
    CollisionSystem.addBox(132,      OY + 118, 36,  32, 'shrine');
    CollisionSystem.addCircle(1392,  OY + 220, 18,  'well');

    // (F) Ultra-Thin Wooden Fence Colliders (4px thin rail strips on the World Grid!)
    CollisionSystem.addBox(OX + 104, OY + 228, 90, 4, 'fence');
    CollisionSystem.addBox(OX + 416, OY + 310, 38, 4, 'fence');
    CollisionSystem.addBox(OX + 650, OY + 234, 52, 4, 'fence');
    CollisionSystem.addBox(OX + 744, OY + 302, 42, 4, 'fence');
    CollisionSystem.addBox(1265,     OY + 202, 74, 4, 'fence');
    CollisionSystem.addBox(1265,     OY + 272, 74, 4, 'fence');

    // (G) Southeast Dense Town District Colliders (14 Non-Overlapping Buildings, Fountain & Stalls)
    // Row 1 (North Town Block)
    CollisionSystem.addBox(1170, 548, 88, 60, 'town_guild');
    CollisionSystem.addBox(1294, 550, 78, 58, 'town_herb');
    CollisionSystem.addBox(1412, 548, 84, 60, 'town_inn');
    CollisionSystem.addBox(1512, 552, 58, 56, 'town_watch');
    // Row 2 (Middle Town Block)
    CollisionSystem.addBox(942,  682, 82, 54, 'town_smith');
    CollisionSystem.addBox(1040, 684, 72, 52, 'town_store');
    CollisionSystem.addBox(1154, 682, 80, 54, 'town_bakery');
    CollisionSystem.addCircle(1274, 708, 20,  'town_fountain');
    CollisionSystem.addBox(1314, 682, 62, 54, 'town_tailor');
    CollisionSystem.addBox(1412, 682, 78, 54, 'town_book');
    CollisionSystem.addBox(1506, 684, 64, 52, 'town_tea');
    // Row 3 (South Town Block)
    CollisionSystem.addBox(944,  806, 82, 54, 'town_pottery');
    CollisionSystem.addBox(1042, 806, 72, 54, 'town_grain');
    CollisionSystem.addBox(1294, 806, 80, 54, 'town_carpenter');
    CollisionSystem.addBox(1412, 804, 88, 56, 'town_trading');

    // Market Stalls Colliders
    CollisionSystem.addBox(954,  620, 44, 20, 'bazaar_stall');
    CollisionSystem.addBox(1010, 620, 44, 20, 'bazaar_stall');
    CollisionSystem.addBox(1150, 806, 44, 22, 'bazaar_stall');
    CollisionSystem.addBox(1206, 806, 44, 22, 'bazaar_stall');
    CollisionSystem.addBox(1514, 806, 46, 22, 'bazaar_stall');

    // 3. Depth-Sorted HD-2D Pixel-Art Trees & Bushes (Zero Overlap with Campfire, Bench, Stairs, or Town Buildings!)
    const pines = [
      // Core Verdant Wilds (matches reference photo layout without blocking stairs, campfire, or cottage roof!)
      [OX + 336, OY + 308, 1.14], [OX + 298, OY + 322, 0.94], [OX + 372, OY + 314, 0.88],
      [OX + 178, OY + 356, 1.05], [OX + 148, OY + 392, 0.95], [OX + 218, OY + 398, 0.92],
      [OX + 348, OY + 94,  0.86], [OX + 306, OY + 114, 0.78], [OX + 480, OY + 64,  0.86],
      // Trees placed cleanly behind the upper-right cliff (away from the cottage roof & stairs)
      [OX + 655, OY + 42,  0.96], [OX + 772, OY + 56,  1.02],
      // Framing around Expanded Aqua Sanctuary & North Ridge
      [295, 96, 0.96], [765, 84, 0.95], [OX + 640, 112, 1.02],
      // Framing around Expanded Flora Sanctuary & West Woods
      [75,  OY + 125, 1.12], [65,  OY + 220, 1.15],
      [42,  435,      1.10], [48,  625,      1.12],
      [115, 765,      1.08], [320, 760,      1.04],
      [82,  835,      1.14], [285, 855,      1.05],
      // East Village Outskirts (Kept strictly north of Y:510 so zero trees overlap the Southeast Town!)
      [1220, 125, 1.06], [1460, 130, 1.08],
      [1235, OY + 135, 1.04], [1485, OY + 145, 1.10], [1515, OY + 280, 1.04]
    ];
    pines.forEach(([x, y, s]) => {
      worldProps.push({ type: 'pine', x, y, scale: s });
      CollisionSystem.addCircle(x, y - 4, 9 * s, 'tree');
    });

    const oaks = [
      [OX + 52,  OY + 178, 1.06, false], [OX + 28,  OY + 258, 1.12, false],
      [OX + 58,  OY + 332, 1.05, false], [OX + 28,  OY + 384, 1.15, false],
      [OX + 266, OY + 382, 1.02, false],
      [OX + 536, OY + 82,  1.02, false], // Cleanly left of Upper-Right Stairs & Cottage
      [OX + 792, OY + 262, 0.94, false], // Cleanly right of Fence & Southeast Stairs
      // Giant Flowering Sanctuary Trees inside the Expanded Flora Sanctuary
      [185, 515, 1.35, true],  [75,  535, 1.16, true],  [355, 645, 1.18, true],
      [255, 425, 1.15, true],  [145, 685, 1.18, true],
      [125, OY + 235, 1.08, false], [315, OY + 165, 1.02, false],
      [1215, OY + 285, 1.02, false], [1445, OY + 148, 1.08, false]
    ];
    oaks.forEach(([x, y, s, blossom]) => {
      worldProps.push({ type: 'oak', x, y, scale: s, isBlossom: blossom });
      CollisionSystem.addCircle(x, y - 4, 10 * s, 'tree');
    });

    const bushes = [
      [OX + 224, OY + 145, 1.1, true],  [OX + 118, OY + 182, 1.0, true],
      [OX + 72,  OY + 225, 1.10, true], [OX + 208, OY + 232, 0.95, false],
      [OX + 402, OY + 314, 1.10, true], [OX + 584, OY + 196, 1.05, true],
      [OX + 662, OY + 294, 1.1, true],
      // Extra flowering shrubs inside Expanded Flora & Aqua Sanctuaries
      [148, 465, 1.15, true], [295, 455, 1.15, true], [160, 620, 1.2, true],
      [285, 635, 1.15, true], [475, 198, 1.1, true],  [625, 195, 1.1, true],
      [1345, OY + 195, 1.1, true],      [1345, OY + 258, 1.1, true]
    ];
    bushes.forEach(([x, y, s, fl]) => worldProps.push({ type: 'bush', x, y, scale: s, hasFlowers: fl }));

    // 4. Interactive NPCs, Signs, Portals & Landmarks
    interactables = [
      {
        id: 'explorer',
        type: 'npc',
        name: 'Penjelajah Arka',
        prompt: 'Bicara dengan Arka',
        x: OX + 160,
        y: OY + 162,
        radius: 36,
        onInteract: () => {
          playSound('talk');
          gameState.quests.talkExplorer = true;
          checkQuestProgression();
          openDialogue(
            'Penjelajah Arka',
            'explorer',
            'Lihatlah betapa selarasnya Lembah Verdant sekarang! Kawasan Habitat Flora di Barat Daya dan Danau Teratai Kristal di Hulu Utara kini sangat luas untuk dijelajahi.',
            [
              {
                label: 'Masuk ke Sanctum Reruntuhan',
                action: () => AreaTransitionSystem.transitionTo('ancient_sanctum', 400, 425, 'up', 'Sanctum Reruntuhan Kuno')
              },
              { label: 'Mengerti!', action: closeDialogue }
            ]
          );
        }
      },
      {
        id: 'cottage_girl',
        type: 'npc',
        name: 'Liora (Penjaga Pondok)',
        prompt: 'Bicara dengan Liora',
        x: OX + 612,
        y: OY + 212,
        radius: 36,
        onInteract: () => {
          playSound('talk');
          gameState.quests.talkCottageGirl = true;
          checkQuestProgression();
          openDialogue(
            'Liora — Penjaga Pondok',
            'girl',
            'Selamat datang di lembah kami! Jalan setapak dari depan pondokku terhubung langsung ke Jembatan Tengah, Tangga Batu Ngarai, maupun ke Sumur Desa di Timur.',
            [
              {
                label: 'Masuk ke Pondok Liora',
                action: () => AreaTransitionSystem.transitionTo('cottage_interior', 320, 355, 'up', 'Interior Pondok Liora')
              },
              {
                label: 'Ambil Sweet Berry (+2)',
                action: () => {
                  addInventoryItem('berry', 2);
                  showToast('Liora memberikan +2 Sweet Berry!');
                  closeDialogue();
                }
              },
              { label: 'Sampai jumpa', action: closeDialogue }
            ]
          );
        }
      },
      {
        id: 'east_ranger',
        type: 'npc',
        name: 'Penjaga Raka',
        prompt: 'Bicara dengan Raka',
        x: 1355,
        y: OY + 225,
        radius: 36,
        onInteract: () => {
          playSound('talk');
          openDialogue(
            'Penjaga Raka — Pos Timur',
            'explorer',
            'Ini adalah batas Pinggiran Desa Timur. Dari tangga batu di sebelah selatan, kamu bisa turun menuju Jembatan Gantung Ngarai untuk menyeberang langsung ke Kawasan Habitat Flora!',
            [{ label: 'Terima kasih infonya', action: closeDialogue }]
          );
        }
      },
      {
        id: 'village_merchant',
        type: 'npc',
        name: 'Pedagang Bram',
        prompt: 'Bicara dengan Bram',
        x: OX + 444,
        y: OY + 272,
        radius: 36,
        onInteract: () => {
          playSound('talk');
          openDialogue(
            'Pedagang Bram — Kios Persimpangan',
            'explorer',
            'Halo Arya! Sekarang para Monstra bersembunyi di habitat alaminya. Masuklah ke Kawasan Habitat Flora atau Aqua, lalu lempar Umpan Habitat [R] untuk memancing mereka keluar selama 20 detik!',
            [
              {
                label: '🍖 Ambil Umpan Habitat (+5)',
                action: () => {
                  addInventoryItem('umpan', 5);
                  updateBaitHudCount();
                  showToast('Pedagang Bram memberikan +5 Umpan Habitat!');
                  closeDialogue();
                }
              },
              {
                label: '🔴 Ambil Monstra Ball (+3)',
                action: () => {
                  addInventoryItem('monstraball', 3);
                  showToast('Pedagang Bram memberikan +3 Monstra Ball!');
                  closeDialogue();
                }
              },
              { label: 'Terima kasih!', action: closeDialogue }
            ]
          );
        }
      },
      {
        id: 'village_florist',
        type: 'npc',
        name: 'Mina (Perawat Taman Desa)',
        prompt: 'Sapa Mina',
        x: OX + 362,
        y: OY + 184,
        radius: 36,
        onInteract: () => {
          playSound('talk');
          openDialogue(
            'Mina — Perawat Taman Desa',
            'girl',
            'Sekarang aliran sungai dari air terjun utama mengalir lurus ke Gorong-Gorong Air di bawah jalan tengah kita! Kalau kamu ke Habitat Flora atau Laguna, jangan lupa gunakan Umpan [R] ya!',
            [{ label: 'Sangat rapi!', action: closeDialogue }]
          );
        }
      },
      {
        id: 'ruins_gate',
        type: 'portal',
        name: 'Gerbang Reruntuhan Kuno',
        prompt: 'Masuk Reruntuhan Kuno',
        x: OX + 192,
        y: OY + 128,
        radius: 38,
        autoTriggerRadius: 16,
        onInteract: () => {
          gameState.quests.inspectRuins = true;
          checkQuestProgression();
          AreaTransitionSystem.transitionTo('ancient_sanctum', 400, 425, 'up', 'Sanctum Reruntuhan Kuno');
        }
      },
      {
        id: 'cottage_door',
        type: 'portal',
        name: 'Pintu Pondok Liora',
        prompt: 'Masuk Pondok Liora',
        x: OX + 724,
        y: OY + 186,
        radius: 30,
        autoTriggerRadius: 13,
        onInteract: () => {
          AreaTransitionSystem.transitionTo('cottage_interior', 320, 355, 'up', 'Interior Pondok Liora');
        }
      },
      {
        id: 'notice_board',
        type: 'sign',
        name: 'Papan Pengumuman Desa',
        prompt: 'Baca Papan Desa',
        x: OX + 550,
        y: OY + 266,
        radius: 34,
        onInteract: () => {
          playSound('talk');
          openDialogue(
            'Papan Pengumuman Verdant Wilds',
            'sign',
            '📜 PETA EKOSISTEM: [Utara] Kawasan Danau & Laguna Teratai Kristal (Aqua Sanctuary) • [Barat Daya] Kawasan Lembah Rubah Berbunga (Flora Sanctuary) • [Tengah] Reruntuhan Kuno & Pondok Liora.',
            [{ label: 'Tutup', action: closeDialogue }]
          );
        }
      },
      {
        id: 'west_shrine',
        type: 'relic',
        name: 'Altar Hutan Bisikan',
        prompt: 'Periksa Altar Hutan',
        x: 150,
        y: OY + 148,
        radius: 38,
        onInteract: () => {
          playSound('quest');
          openDialogue(
            'Altar Hutan Bisikan Barat',
            'relic',
            'Kristal biru di atas altar berdenyut lembut, menjaga keseimbangan alam antara Hutan Bisikan dan Lembah Rubah Berbunga di selatan.',
            [{ label: 'Kembali Menjelajah', action: closeDialogue }]
          );
        }
      },
      {
        id: 'village_well',
        type: 'sign',
        name: 'Sumur Mata Air Timur',
        prompt: 'Periksa Sumur Desa',
        x: 1392,
        y: OY + 225,
        radius: 34,
        onInteract: () => {
          playSound('talk');
          openDialogue(
            'Sumur Mata Air Pegunungan',
            'sign',
            'Air di dalam sumur batu ini mengalir langsung dari Air Terjun Verdant Wilds. Sangat jernih dan menyegarkan!',
            [{ label: 'Tutup', action: closeDialogue }]
          );
        }
      }
    ];

    // 5. Add Interactive Habitat Survey Markers for the 2 Expanded Monster Habitats
    const floraHab = MONSTER_HABITATS[0];
    interactables.push({
      id: `habitat_${floraHab.id}`,
      type: 'habitat',
      name: floraHab.name,
      prompt: `Survei ${floraHab.name}`,
      x: floraHab.x + 96,
      y: floraHab.y + 28,
      radius: 56,
      onInteract: () => {
        playSound('quest');
        gameState.surveyedHabitats[floraHab.id] = true;
        const totalSurveyed = Object.keys(gameState.surveyedHabitats).length;
        showToast(`Kawasan Habitat Dicatat (${totalSurveyed}/2): ${floraHab.name}`);
        openDialogue(
          `${floraHab.icon} ${floraHab.name}`,
          'sign',
          `${floraHab.desc}`,
          [
            { label: 'Buka Peta Habitat', action: () => { closeDialogue(); openModal('map'); } },
            { label: 'Selesai Survei', action: closeDialogue }
          ]
        );
      }
    });

    const aquaHab = MONSTER_HABITATS[1];
    interactables.push({
      id: `habitat_${aquaHab.id}`,
      type: 'habitat',
      name: aquaHab.name,
      prompt: `Survei ${aquaHab.name}`,
      x: 645,
      y: 184,
      radius: 56,
      onInteract: () => {
        playSound('quest');
        gameState.surveyedHabitats[aquaHab.id] = true;
        const totalSurveyed = Object.keys(gameState.surveyedHabitats).length;
        showToast(`Kawasan Habitat Dicatat (${totalSurveyed}/2): ${aquaHab.name}`);
        openDialogue(
          `${aquaHab.icon} ${aquaHab.name}`,
          'sign',
          `${aquaHab.desc}`,
          [
            { label: 'Buka Peta Habitat', action: () => { closeDialogue(); openModal('map'); } },
            { label: 'Selesai Survei', action: closeDialogue }
          ]
        );
      }
    });
  } else if (areaId === 'ancient_sanctum') {
    ChunkManager.initForArea(800, 500, buildAncientSanctumEnvironment);
    CollisionSystem.addBox(0, 0, 800, 58, 'wall');
    CollisionSystem.addBox(0, 0, 58, 500, 'wall');
    CollisionSystem.addBox(742, 0, 58, 500, 'wall');
    CollisionSystem.addBox(0, 460, 345, 40, 'wall');
    CollisionSystem.addBox(455, 460, 345, 40, 'wall');
    CollisionSystem.addBox(352, 125, 96, 64, 'altar');

    for (let x = 140; x <= 660; x += 160) {
      CollisionSystem.addCircle(x, 130, 15, 'pillar');
      CollisionSystem.addCircle(x, 310, 15, 'pillar');
    }

    interactables = [
      {
        id: 'sanctum_altar',
        type: 'relic',
        name: 'Altar Prasasti Kuno',
        prompt: 'Periksa Altar Kuno',
        x: 400,
        y: 205,
        radius: 46,
        onInteract: () => {
          playSound('quest');
          gameState.quests.inspectRuins = true;
          checkQuestProgression();
          openDialogue(
            'Altar Sanctum Verdant',
            'relic',
            'Prasasti bercahaya di depanmu berbunyi: "Ketika Penjelajah dan Monstra berikatan di Lembah Verdant, gerbang menuju dunia purba akan bangkit kembali."',
            [
              {
                label: 'Ambil Verdant Potion (+1)',
                action: () => {
                  addInventoryItem('potion', 1);
                  showToast('Ditemukan +1 Verdant Potion di dekat altar!');
                  closeDialogue();
                }
              },
              { label: 'Selesai', action: closeDialogue }
            ]
          );
        }
      },
      {
        id: 'sanctum_exit',
        type: 'portal',
        name: 'Pintu Keluar Lembah',
        prompt: 'Keluar ke Verdant Wilds',
        x: 400,
        y: 468,
        radius: 38,
        autoTriggerRadius: 18,
        onInteract: () => {
          AreaTransitionSystem.transitionTo('verdant_wilds', OX + 192, OY + 150, 'down', 'Lembah Utama Verdant Wilds');
        }
      }
    ];
  } else if (areaId === 'cottage_interior') {
    ChunkManager.initForArea(640, 420, buildCottageInteriorEnvironment);
    CollisionSystem.addBox(0, 0, 640, 56, 'wall');
    CollisionSystem.addBox(0, 0, 50, 420, 'wall');
    CollisionSystem.addBox(590, 0, 50, 420, 'wall');
    CollisionSystem.addBox(0, 386, 275, 34, 'wall');
    CollisionSystem.addBox(365, 386, 275, 34, 'wall');
    CollisionSystem.addBox(80, 62, 110, 36, 'shelf');
    CollisionSystem.addBox(455, 85, 95, 58, 'bed');

    interactables = [
      {
        id: 'cottage_hearth',
        type: 'sign',
        name: 'Perapian & Jurnal Liora',
        prompt: 'Baca Jurnal Liora',
        x: 320,
        y: 82,
        radius: 44,
        onInteract: () => {
          playSound('talk');
          openDialogue(
            'Jurnal Ekologi Liora',
            'sign',
            'Catatan Liora: "Para Monstra di Verdant Wilds sangat menyukai Sweet Berry. Semakin jauh ke barat dan utara, semakin beragam habitat Monstra yang bisa ditemukan."',
            [{ label: 'Tutup Jurnal', action: closeDialogue }]
          );
        }
      },
      {
        id: 'cottage_exit',
        type: 'portal',
        name: 'Pintu Keluar Pondok',
        prompt: 'Keluar ke Halaman Desa',
        x: 320,
        y: 392,
        radius: 36,
        autoTriggerRadius: 16,
        onInteract: () => {
          AreaTransitionSystem.transitionTo('verdant_wilds', OX + 724, OY + 206, 'down', 'Lembah Utama Verdant Wilds');
        }
      }
    ];
  }
}

