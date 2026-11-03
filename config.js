const VIEW_W = 800;
const VIEW_H = 450;
const WORLD_W = 1600;
const WORLD_H = 900;
const OX = 400;
const OY = 225;
const CHUNK_W = 400;
const CHUNK_H = 225;
const CHUNK_COLS = WORLD_W / CHUNK_W;
const CHUNK_ROWS = WORLD_H / CHUNK_H;

const BAYER4 = [
  [ 0,  8,  2, 10],
  [12,  4, 14,  6],
  [ 3, 11,  1,  9],
  [15,  7, 13,  5]
];

const PAL = {
  grassSun: '#8fa848',
  grassHigh: '#708e3a',
  grassMid: '#527032',
  grassShade: '#385228',
  grassDeep: '#22361c',
  grassMoss: '#426030',
  dirtLight: '#d2ae7e',
  dirtMid: '#b88e5e',
  dirtDark: '#946e44',
  dirtEdge: '#6e5032',
  rockSun: '#c4b6a4',
  rockLight: '#aea090',
  rockMid: '#8a7e72',
  rockDark: '#645c58',
  rockShadow: '#423e44',
  rockDeep: '#28262e',
  waterDeep: '#1d4460',
  waterMid: '#2f6382',
  waterShallow: '#4884a2',
  waterGlow: '#6ca8c4',
  waterFoam: '#eef7fc',
  roofLight: '#6882a8',
  roofMid: '#4c6286',
  roofDark: '#32425e',
  roofShadow: '#1e283c',
  woodLight: '#b68656',
  woodMid: '#8e623a',
  woodDark: '#624024',
  outline: '#16151c'
};

const RARITY_TIERS = {
  common: {
    id: 'common',
    name: 'COMMON',
    labelId: 'Umum',
    chance: 0.50,
    color: '#4ade80',
    glow: 'rgba(74, 222, 128, 0.55)',
    bg: 'rgba(20, 83, 45, 0.88)',
    border: '#86efac',
    levelBonus: 0,
    scale: 1.0,
    catchMod: 0.70
  },
  uncommon: {
    id: 'uncommon',
    name: 'UNCOMMON',
    labelId: 'Tidak Umum',
    chance: 0.30,
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.65)',
    bg: 'rgba(12, 74, 110, 0.90)',
    border: '#7dd3fc',
    levelBonus: 2,
    scale: 1.04,
    catchMod: 0.52
  },
  rare: {
    id: 'uncommon',
    name: 'UNCOMMON',
    labelId: 'Tidak Umum',
    chance: 0.30,
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.65)',
    bg: 'rgba(12, 74, 110, 0.90)',
    border: '#7dd3fc',
    levelBonus: 2,
    scale: 1.04,
    catchMod: 0.52
  },
  epic: {
    id: 'epic',
    name: 'EPIC',
    labelId: 'Epik',
    chance: 0.15,
    color: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.75)',
    bg: 'rgba(88, 28, 135, 0.92)',
    border: '#d8b4fe',
    levelBonus: 5,
    scale: 1.10,
    catchMod: 0.35
  },
  legendary: {
    id: 'legendary',
    name: 'LEGENDARY',
    labelId: 'Legendaris',
    chance: 0.05,
    color: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.90)',
    bg: 'rgba(120, 53, 15, 0.95)',
    border: '#fde68a',
    levelBonus: 10,
    scale: 1.18,
    catchMod: 0.22
  }
};

const SPECIES_RARITY_MAP = {
  huggy: 'common',
  vulpy: 'uncommon',
  sikaru: 'epic',
  tirta: 'common',
  aquafly: 'legendary'
};

function getSpeciesRarity(speciesId) {
  const tierKey = SPECIES_RARITY_MAP[speciesId] || 'common';
  return RARITY_TIERS[tierKey] || RARITY_TIERS.common;
}

function rollMonsterRarity(speciesId) {
  return getSpeciesRarity(speciesId);
}

const MONSTRADEX_CATALOG = {
  flora_sanctuary: [
    {
      id: 'vulpy',
      name: 'Vulpy',
      title: 'Rubah Padang Rumput',
      element: 'Flora / Pyro',
      stage: 'Tahap 1',
      baseLevel: 5,
      rarityId: 'uncommon',
      desc: 'Rubah lincah berbulu hangat yang gemar bersembunyi di sekitar batang pohon berongga dan semak Sweet Berry.'
    },
    {
      id: 'sikaru',
      name: 'Sikaru',
      title: 'Roh Kecil Hutan',
      element: 'Flora',
      stage: 'Tahap 1',
      baseLevel: 7,
      rarityId: 'epic',
      desc: 'Rusa roh hutan bertanduk ranting daun zamrud yang mampu memanggil hembusan Leaf Blade dan berkat fotosintesis.'
    },
    {
      id: 'huggy',
      name: 'Huggy',
      title: 'Beruang Remaja Penyayang',
      element: 'Flora / Normal',
      stage: 'Tahap 2',
      baseLevel: 10,
      rarityId: 'common',
      desc: 'Beruang berjaket hoodie putih dan tas selempang yang ramah, mengantuk, namun memiliki pukulan Cuddle Punch yang kuat.'
    }
  ],
  aqua_lagoon: [
    {
      id: 'tirta',
      name: 'Tirta',
      title: 'Roh Air Kecil',
      element: 'Aqua',
      stage: 'Tahap 1',
      baseLevel: 6,
      rarityId: 'common',
      desc: 'Roh air berkaki empat dengan ekor paus bercabang yang memancarkan semburan Hantaman Pasang serta Perisai Samudra.'
    },
    {
      id: 'aquafly',
      name: 'Aquafly',
      title: 'Ikan Kepala Elang',
      element: 'Aqua / Aero',
      stage: 'Tahap 1',
      baseLevel: 12,
      rarityId: 'legendary',
      desc: 'Monstra hibrida elang-ikan bermahkota es biru yang membelah permukaan laguna dan menciptakan pusaran Whirlpool.'
    }
  ]
};