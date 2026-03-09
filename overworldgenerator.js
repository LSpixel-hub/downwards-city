// ============================================
// OVERWORLD GENERATOR — NEO-TOKYO BAY
// Vue rapprochée du front de mer
// Pour Downwards Overdrive Rogue
// ============================================

// ============================================
// CONSTANTES DE GRILLE (STRICT 50x21)
// ============================================
export const GRID_WIDTH = 49; // 0 à 49 = 50 colonnes
export const GRID_HEIGHT = 20; // 0 à 20 = 21 lignes

// ============================================
// TYPES DE TUILES
// ============================================
export const TILE = {
  VOID: 0,
  STREET: 1, // Rue marchable
  BUILDING: 2, // Façade d'immeuble (mur)
  LIT_WINDOW: 3, // Fenêtre allumée (mur déco)
  NEON_SIGN: 4, // Enseigne néon (mur déco)
  STREETLIGHT: 5, // Lampadaire (marchable)
  STAIRS: 6, // Entrée du donjon / métro
  WATER: 7, // Océan (bloquant)
  PROMENADE: 8, // Bord de mer (marchable)
  SKY: 9, // Ciel nocturne (non-marchable, déco)
  STAR: 10, // Étoile scintillante (non-marchable, déco)
  WALL_DETAIL: 11, // Détail architectural
  DOOR: 12, // Porte d'immeuble (marchable)
  RAILING: 13, // Rambarde (bloquant déco)
  ROOF_EDGE: 14, // Bord de toit
  PUDDLE: 15, // Flaque (marchable, reflets)
  AWNING: 16, // Auvent (bloquant déco)
  VENDING: 17, // Distributeur (bloquant déco)
  AC_UNIT: 18, // Climatisation (déco mur)
  SAND: 19, // Sable (marchable)
};

// Set des tuiles marchables pour collision check rapide
export const WALKABLE = new Set([
  TILE.STREET,
  TILE.STREETLIGHT,
  TILE.STAIRS,
  TILE.PROMENADE,
  TILE.DOOR,
  TILE.PUDDLE,
  TILE.SAND,
]);

// ============================================
// PALETTE SYNTHWAVE
// ============================================
export const PALETTE = {
  // Bâtiments & Rues
  buildingDark: "#08070d",
  buildingMid: "#12101c",
  buildingBg: "#0a0a0f", // Fond encore plus sombre pour faire pop les néons
  plazaDark: "#101016", // Place grise foncée (démarque les immeubles)
  streetDark: "#1a1825", // Rue standard
  streetMid: "#252333",
  streetBright: "#3d3a52",
  promenade: "#3a3550",
  wallDetail: "#1a1828",
  roofEdge: "#2a2840",
  puddle: "#2a2845",

  // Fenêtres
  windowWarm: "#fff7cc",
  windowCool: "#aae0ff",
  windowOff: "#0e0c18",

  // Néons
  neonCyan: "#00fff9",
  neonMagenta: "#ff2a6d",
  neonPurple: "#b026ff",
  neonYellow: "#fff01f",
  neonGreen: "#39ff14",
  neonHotPink: "#ff0055",
  neonOrange: "#ff6a00",

  // Commerce
  doorWood: "#3a2a1a",
  doorFrame: "#555555",
  vendingGlow: "#00ccaa",
  vendingBody: "#1a3a3a",
  awning: "#882244",
  awningStripe: "#aa3366",
  railing: "#333344",

  // Sable
  sandLight: "#4a4535",
  sandMid: "#3d3828",
  sandDark: "#302c20",
  sandWet: "#28261e",

  // Eau
  waterDeep: "#002244",
  waterMid: "#005588",
  waterLight: "#0077bb",
  waterHighlight: "#22bbff",
  waterFoam: "#88ccee",

  // Lampadaires
  streetlightGlow: "#fffbe6",

  // Ciel — dégradé de noir pur à bleu nuit
  skyTop: "#000000", // Noir pur
  skyMid: "#040614", // Transition
  skyLow: "#0b122e", // Bleu nuit vers la ville

  starDim: "#444466",
  starBright: "#ccccee",
  starWarm: "#ffddaa",

  // Détails
  acUnit: "#2a2a3a",
};

export const NEON_COLORS = [
  PALETTE.neonHotPink,
  PALETTE.neonCyan,
  PALETTE.neonPurple,
  PALETTE.neonYellow,
  PALETTE.neonGreen,
];

export const VIVID_NEON_COLORS = new Set([
  PALETTE.neonHotPink,
  PALETTE.neonCyan,
  PALETTE.neonPurple,
  PALETTE.neonYellow,
  PALETTE.neonGreen,
]);

export const SKY_ROWS = 2;
export const STAR_DENSITY = 0.08;

// ============================================
// CARACTÈRES DE RENDU
// ============================================
export const RENDER_CHARS = {
  player: "@",
  stairs: "▼",
  building: "█",
  window: "▒",
  neon: "█",
  streetlight: "✦",
  floor: [".", "·", ":"],
  water: ["~", "≈", "∼", "≈", "~"],
  promenade: ["·", ".", " "],
  star: "·",
};

// ============================================
// HAND-CRAFTED MAP TEMPLATE — STRICTEMENT 50x21
// ============================================
const MAP_TEMPLATE = [
  //01234567890123456789012345678901234567890123456789
  "..................................................", // 0  Ciel noir
  "...*......*.........*...........*........*........", // 1  Ciel + étoiles
  ".........┬───────────┬........┬───────────┬.......", // 2  Grands Toits (┬ alignés sur │)
  ".........│▒░▒▒░▒▒░▒▒░│........│▒▒░▒▒▒░▒▒░▒│.......", // 3  Etage
  ".........│░▒▒░▒░▒░░▒░│........│░▒▒░▒░▒▒▒░▒│.......", // 4  Etage
  ".........│▒▒░▒▒▒▒▒░▒▒│........│▒░▒▒░▒░▒░▒░│.......", // 5  Etage
  "┬───────┬│░▒▒░▒▒░▒▒░▒│┬──────┬│▒▒▒░▒▒▒▒▒░▒│┬─────┬", // 6  Petits Toits
  "│▌▌▌▌▌▌▌││▌▌▌▌▌▌▌▌▌▌▌││▌▌▌▌▌▌││▌▌▌▌▌▌▌▌▌▌▌││▌▌▌▌▌│", // 7  Bandeau de Néons
  "│░▒▒░▒▒░││■■■■■■■■■■■││▒░▒░▒░││■■■■■■■■■■■││░▒░▒▒│", // 8  Mur RDC haut
  "│▒▒░▒▒▒░│└AADAAAA┘AAAD│▒░▒▒░▒│└AADAAAA┘AAAD│▒░▒▒░│", // 9  Auvents & Portes
  "│▄■░▄▒■▄│::V::::::V:::│▄░▒▄■░│::V::::::V:::│▄░■▄▒│", // 10 Vending sur place
  "└AADAAAA┘:::▼:::::::::└AADAAA┘:::::::::::::└AADAA┘", // 11 Place grise foncée & Entrée
  "::✦::::::::::::::~:::✦::::::::::::✦:::~::::::::::✦", // 12 Rue Principale
  ":::::~::::::::::::::::::::::~~::::::::::::::::::::", // 13 Rue
  "::::::::::::::::::::::::::::::::::::::::::::::::::", // 14 Rue dégagée (Spawn Joueur)
  "========__________________________________========", // 15 Rambarde bloquante
  "==================================================", // 16 Promenade
  ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,", // 17 Sable sec
  ";;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;", // 18 Sable humide
  "≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈", // 19 Océan (Rivage)
  "≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈", // 20 Océan profond
];

// Enseignes néon mises à jour pour les nouvelles coordonnées
const NEON_SIGNS = [
  { y: 7, x: 10, len: 11, color: PALETTE.neonHotPink }, // Grand gauche
  { y: 7, x: 31, len: 11, color: PALETTE.neonCyan }, // Grand droit
  { y: 7, x: 1, len: 7, color: PALETTE.neonYellow }, // Petit gauche
  { y: 7, x: 23, len: 6, color: PALETTE.neonPurple }, // Petit milieu
  { y: 7, x: 44, len: 5, color: PALETTE.neonGreen }, // Petit droite
];

// ============================================
// CHAR → TILE MAPPING
// ============================================
const CHAR_TO_TILE = {
  ".": TILE.SKY,
  "*": TILE.STAR,
  "█": TILE.BUILDING,
  "▒": TILE.LIT_WINDOW,
  "░": TILE.LIT_WINDOW,
  "─": TILE.ROOF_EDGE,
  "┬": TILE.ROOF_EDGE,
  "│": TILE.BUILDING,
  "└": TILE.BUILDING,
  "┘": TILE.BUILDING,
  "▄": TILE.AC_UNIT,
  "■": TILE.WALL_DETAIL,
  "▌": TILE.NEON_SIGN,
  D: TILE.DOOR,
  A: TILE.AWNING,
  V: TILE.VENDING,
  "✦": TILE.STREETLIGHT,
  ":": TILE.STREET,
  "~": TILE.PUDDLE,
  _: TILE.RAILING,
  "=": TILE.PROMENADE,
  "≈": TILE.WATER,
  "▼": TILE.STAIRS,
  ",": TILE.SAND,
  ";": TILE.SAND,
};

let _charMap = null;

// ============================================
// MOTEUR DE GÉNÉRATION
// ============================================
export const generateOverworld = (options = {}) => {
  const width = GRID_WIDTH;
  const height = GRID_HEIGHT;

  const map = [];
  const charMap = [];
  const starMap = [];

  for (let y = 0; y <= height; y++) {
    map[y] = [];
    charMap[y] = [];
    const line = MAP_TEMPLATE[y] || "";
    for (let x = 0; x <= width; x++) {
      const ch = line[x] || (y >= 19 ? "≈" : ".");
      charMap[y][x] = ch;
      map[y][x] = CHAR_TO_TILE[ch] ?? TILE.SKY;

      if (map[y][x] === TILE.STAR) {
        starMap.push({ x, y, phase: Math.random() * Math.PI * 2 });
      }
    }
  }

  _charMap = charMap;

  const stairsPos = { x: 12, y: 11 };
  map[stairsPos.y][stairsPos.x] = TILE.STAIRS;

  const playerPos = { x: 25, y: 14 };

  const coastLine = [];
  for (let x = 0; x <= width; x++) {
    coastLine[x] = 19; // Le rivage est à la ligne 19
  }

  return {
    map,
    playerPos,
    stairsPos,
    coastLine,
    blocks: [],
    starMap,
    width,
    height,
    skyRows: SKY_ROWS,
  };
};

// ============================================
// UTILITAIRES
// ============================================
export const isWalkable = (map, x, y) => {
  if (y < 0 || y >= map.length || x < 0 || x >= (map[0]?.length || 0))
    return false;
  return WALKABLE.has(map[y][x]);
};

export const getNeonColor = (x, y) => {
  return NEON_COLORS[(x * 7 + y * 13) % NEON_COLORS.length];
};

const findSignColor = (x, y) => {
  for (const s of NEON_SIGNS) {
    if (y === s.y && x >= s.x && x < s.x + s.len) return s.color;
  }
  return getNeonColor(x, y);
};

export const getAdjacentNeonColor = (map, x, y) => {
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;
    if (map[ny]?.[nx] === TILE.NEON_SIGN) {
      return findSignColor(nx, ny);
    }
  }
  return null;
};

const skyBgForRow = (y) => {
  if (y === 0) return PALETTE.skyTop; // Noir pur
  if (y === 1) return PALETTE.skyMid; // Noir bleuté
  if (y <= 3) return PALETTE.skyLow; // Bleu nuit
  return PALETTE.skyLow;
};

// ============================================
// RENDU
// ============================================
export const getTileRender = (
  map,
  x,
  y,
  tick = 0,
  coastLine = [],
  starMap = []
) => {
  const tile = map[y]?.[x];
  const ch = _charMap?.[y]?.[x] || " ";
  if (tile == null) return { char: " ", color: "#000" };

  switch (tile) {
    // ── CIEL ──────────────
    case TILE.SKY: {
      const bg = skyBgForRow(y);
      return { char: " ", color: bg, bg };
    }
    case TILE.STAR: {
      const wave = (Math.sin(tick * 0.08 + x * 2.7 + y * 4.1) + 1) / 2;
      const op = 0.2 + wave * 0.8;
      const c =
        wave > 0.85
          ? PALETTE.starWarm
          : wave > 0.4
          ? PALETTE.starBright
          : PALETTE.starDim;
      const bg = skyBgForRow(y);
      return {
        char: "·",
        color: c,
        bg,
        opacity: op,
        glow: wave > 0.85 ? `0 0 3px ${PALETTE.starWarm}60` : null,
      };
    }

    // ── STRUCTURE ───────────
    case TILE.BUILDING: {
      if ("│└┘".includes(ch)) {
        return { char: ch, color: PALETTE.wallDetail, bg: PALETTE.buildingBg };
      }
      return {
        char: "█",
        color: PALETTE.buildingDark,
        bg: PALETTE.buildingDark,
      };
    }
    case TILE.ROOF_EDGE: {
      const bg = y <= 6 ? skyBgForRow(y) : PALETTE.buildingBg;
      return { char: ch, color: PALETTE.roofEdge, bg };
    }
    case TILE.WALL_DETAIL: {
      return { char: "▪", color: PALETTE.wallDetail, bg: PALETTE.buildingBg };
    }
    case TILE.AC_UNIT: {
      return { char: "▄", color: PALETTE.acUnit, bg: PALETTE.buildingBg };
    }

    // ── FENÊTRES ──────────────────────────────
    case TILE.LIT_WINDOW: {
      const cool = ch === "░" || (x * 3 + y * 7) % 5 === 0;
      const c = cool ? PALETTE.windowCool : PALETTE.windowWarm;
      const hash = (x * 131 + y * 97) % 100;

      if (hash < 12) {
        const cycle = Math.sin(tick * 0.02 + hash * 0.7);
        if (cycle < -0.3)
          return {
            char: "▒",
            color: PALETTE.windowOff,
            bg: PALETTE.buildingBg,
            opacity: 0.3,
          };
        if (cycle < 0.2) {
          const fade = (cycle + 0.3) / 0.5;
          return {
            char: "▒",
            color: c,
            bg: PALETTE.buildingBg,
            opacity: 0.3 + fade * 0.7,
            glow: `0 0 ${Math.floor(fade * 4)}px ${c}${Math.floor(fade * 6)}0`,
            animClass: `window-${(x + y) % 4}`,
          };
        }
      }

      if (hash >= 12 && hash < 17) {
        const snap = Math.sin(tick * 0.012 + hash * 1.1);
        if (snap < -0.2)
          return {
            char: "▒",
            color: PALETTE.windowOff,
            bg: PALETTE.buildingBg,
            opacity: 0.3,
          };
      }

      return {
        char: "▒",
        color: c,
        bg: PALETTE.buildingBg,
        glow: `0 0 4px ${c}70, 0 0 10px ${c}25`,
        animClass: `window-${(x + y) % 4}`,
      };
    }

    // ── NÉONS ─────────────────────────────────
    case TILE.NEON_SIGN: {
      const c = findSignColor(x, y);
      const nHash = (x * 73 + y * 53) % 100;
      if (nHash < 6) {
        const flick = Math.sin(tick * 0.04 + nHash * 1.3);
        if (flick < -0.5)
          return {
            char: "█",
            color: c,
            bg: PALETTE.buildingBg,
            opacity: 0.25,
            glow: `0 0 3px ${c}30`,
            bold: true,
          };
      }
      return {
        char: "█",
        color: c,
        bg: PALETTE.buildingBg,
        glow: `0 0 8px ${c}, 0 0 20px ${c}80, 0 0 40px ${c}30`,
        bold: true,
      };
    }

    // ── COMMERCE ──────────────────────────────
    case TILE.DOOR:
      return { char: "▌", color: PALETTE.doorWood, bg: PALETTE.doorFrame };
    case TILE.AWNING:
      return {
        char: "▀",
        color: x % 2 === 0 ? PALETTE.awning : PALETTE.awningStripe,
        bg: PALETTE.buildingBg,
      };
    case TILE.VENDING: {
      const pulse = (Math.sin(tick * 0.05 + x) + 1) / 2;
      return {
        char: "▐",
        color: PALETTE.vendingGlow,
        bg: PALETTE.vendingBody,
        opacity: 0.7 + pulse * 0.3,
        glow: `0 0 6px ${PALETTE.vendingGlow}60`,
        bold: true,
      };
    }

    // ── RUES ET PLACES ──────────────────────────
    case TILE.STREET: {
      const ci = (x * 13 + y * 7) % RENDER_CHARS.floor.length;
      const reflectColor = getAdjacentNeonColor(map, x, y);
      const isPlaza = y <= 11; // La place grise foncée pour démarquer les bâtiments
      const bg = isPlaza ? PALETTE.plazaDark : PALETTE.streetDark;

      return {
        char: reflectColor ? "·" : RENDER_CHARS.floor[ci],
        color: reflectColor || PALETTE.streetBright,
        bg,
        opacity: reflectColor ? 0.4 : 0.6,
        glow: reflectColor ? `0 0 6px ${reflectColor}50` : null,
      };
    }
    case TILE.PUDDLE: {
      const reflectColor = getAdjacentNeonColor(map, x, y);
      const p = Math.sin(tick * 0.1 + x * 1.5);
      return {
        char: "~",
        color: reflectColor || PALETTE.puddle,
        bg: PALETTE.streetDark,
        opacity: reflectColor ? 0.3 + p * 0.15 : 0.4,
        glow: reflectColor ? `0 0 5px ${reflectColor}40` : null,
      };
    }
    case TILE.STREETLIGHT:
      return {
        char: "✦",
        color: PALETTE.streetlightGlow,
        bg: PALETTE.streetDark,
        glow: `0 0 8px ${PALETTE.streetlightGlow}, 0 0 20px ${PALETTE.streetlightGlow}80`,
        bold: true,
      };

    // ── PROMENADE & RAILING ──────────────────
    case TILE.RAILING:
      return { char: "═", color: PALETTE.railing, bg: PALETTE.streetDark };
    case TILE.PROMENADE:
      return {
        char: RENDER_CHARS.promenade[(x + y) % RENDER_CHARS.promenade.length],
        color: PALETTE.promenade,
        opacity: 0.6,
      };

    // ── SABLE ─────────────────────────────────
    case TILE.SAND: {
      const wet = ch === ";";
      const si = (x * 17 + y * 11) % 5;
      const sandChar = wet
        ? ["·", "·", ".", ".", "·"][si]
        : ["·", ".", ":", ".", "·"][si];
      const c = wet
        ? PALETTE.sandWet
        : (x + y) % 3 === 0
        ? PALETTE.sandLight
        : PALETTE.sandMid;
      return {
        char: sandChar,
        color: c,
        bg: wet ? PALETTE.sandDark : PALETTE.sandMid,
        opacity: wet ? 0.5 : 0.6,
      };
    }

    // ── EAU (Va-et-vient respirant) ───────────
    case TILE.WATER: {
      // Onde sinusoïdale locale pour créer la "respiration" de la houle
      const wavePhase = Math.sin(tick * 0.08 + x * 0.15 + y * 0.3);
      const waveOffset = Math.floor((wavePhase + 1) * 2); // 0 à 4
      const charIdx = Math.max(0, Math.min(4, waveOffset));

      const distFromShore = y - (coastLine[x] || 19);
      let c =
        distFromShore <= 0
          ? PALETTE.waterHighlight
          : distFromShore === 1
          ? PALETTE.waterLight
          : distFromShore <= 3
          ? PALETTE.waterMid
          : PALETTE.waterDeep;
      let opacity = distFromShore <= 0 ? 0.85 : distFromShore <= 2 ? 0.75 : 0.6;
      let glow = null;

      // Reflets néons étendus sur l'eau (scan plus long car néons plus hauts)
      const shoreY = coastLine[x] || 19;
      for (let scan = 1; scan <= 12; scan++) {
        const sy = shoreY - scan;
        if (sy < 0) break;
        const t = map[sy]?.[x];
        if (t === TILE.NEON_SIGN) {
          const nc = findSignColor(x, sy);
          if (VIVID_NEON_COLORS.has(nc)) {
            c = nc;
            opacity = Math.max(0.12, 0.5 - distFromShore * 0.05 - scan * 0.02);
            glow = `0 0 5px ${nc}40`;
          }
          break;
        }
        if (
          t === TILE.LIT_WINDOW ||
          t === TILE.STREETLIGHT ||
          t === TILE.VENDING
        )
          break;
      }

      if (distFromShore === 0 && Math.sin(tick * 0.15 + x * 0.4) > 0.3) {
        c = PALETTE.waterFoam;
        opacity = 0.6;
      }

      return {
        char: RENDER_CHARS.water[charIdx],
        color: c,
        opacity,
        glow,
        animClass: `wave-${(x + y) % 3}`,
      };
    }

    // ── ENTRÉE DONJON ─────────────────────────
    case TILE.STAIRS:
      return {
        char: "▼",
        color: PALETTE.neonMagenta,
        glow: `0 0 10px ${PALETTE.neonMagenta}, 0 0 25px ${PALETTE.neonMagenta}80`,
        bold: true,
        animClass: "stairs-pulse",
      };

    default:
      return { char: " ", color: "#000" };
      8;
  }
};
