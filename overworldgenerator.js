// ============================================
// OVERWORLD GENERATOR — NEON BAY
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
  TILE.DOOR,
  TILE.PUDDLE,
  TILE.SAND,
]);

// ============================================
// PALETTE SYNTHWAVE
// ============================================
export const PALETTE = {
  // Bâtiments & Rues (Harmonisé en gris)
  buildingDark: "#777777", // Gris moyen unifié pour murs
  buildingMid: "#12101c",
  buildingBg: "#0a0a0f", // Fond sombre pour faire pop les néons
  plazaDark: "#101016", // Place grise foncée (démarque les immeubles)
  streetDark: "#1a1825", // Rue standard
  streetMid: "#252333",
  streetBright: "#3d3a52",
  wallDetail: "#777777", // Gris moyen unifié pour détails
  roofEdge: "#777777", // Gris moyen unifié pour toiture
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
  awning: "#777777", // Gris moyen unifié pour auvent
  awningStripe: "#882244", // Couleur secondaire pour auvent
  railing: "#333344",

  // Sable
  sandBright: "#6b624a", // Sable clair pour la lisière de l'eau
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

 // === CIEL — Dégradé Progressif (Teintes Bleu Nuit) ===
sky0: "#0a2e5c", // Zone 0 : Bleu nuit profond (très visible)
sky1: "#061d3e", // Zone 1
sky2: "#031024", // Zone 2
sky3: "#01060d", // Zone 3
sky4: "#000306", // Zone 4 : Presque noir
sky5: "#000000", // Zone 5 : Noir pur (au niveau des toits)

  skyFinal: "#000000", // Noir par défaut pour le reste de la scène

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

export const SKY_ROWS = 6; // Zone d'apparition des étoiles et du dégradé
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
  star: "·",
};

// ============================================
// HAND-CRAFTED MAP TEMPLATE — STRICTEMENT 50x21
// Rambardes nettoyées sur les côtés (ligne 15 remplacée par des ':')
// ============================================
const MAP_TEMPLATE = [
  //01234567890123456789012345678901234567890123456789
  "..................................................", // 0  Ciel noir pur (caché par le HUD)
  "..........*.........*....................*........", // 1  Ciel très sombre
  "......*..┬───────────┬........┬───────────┬...*...", // 2  Toits hauts
  ".*.......│▒░▒▒░▒▒░▒▒░│...*....│▒▒░▒▒▒░▒▒░▒│.......", // 3
  ".........│░▒▒░▒░▒░░▒░│........│░▒▒░▒░▒▒▒░▒│..*....", // 4
  "....*....│▒▒░▒▒▒▒▒░▒▒│.....*..│▒░▒▒░▒░▒░▒░│.......", // 5  Horizon lumineux
  "┬───────┬│░▒▒░▒▒░▒▒░▒│┬──────┬│▒▒▒░▒▒▒▒▒░▒│┬─────┬", // 6  Toits bas
  "│▌▌▌▌▌▌▌││▌▌▌▌▌▌▌▌▌▌▌││▌▌▌▌▌▌││▌▌▌▌▌▌▌▌▌▌▌││▌▌▌▌▌│", // 7  Bandeau de Néons
  "│░▒▒░▒▒░││■■■■■■■■■■■││▒░▒░▒░││■■■■■■■■■■■││░▒░▒▒│", // 8  Mur
  "│▒▒░▒▒▒░││▒▒░▒▒░▒▒░▒▒││▒░▒▒░▒││▒▒░▒▒░▒▒░▒▒││▒░▒▒░│", // 9  Mur (suite)
  "│▄■░▄▒■▄│└AADAADAADAA┘│▄░▒▄■░│└AADAADAADAA┘│▄░■▄▒│", // 10 Auvents/Portes (Grands immeubles)
  "└AADAAAD┘::::V:::::V::└AADAAA┘::::V:::::V::└AADAA┘", // 11 Auvents/Portes (Petits immeubles) & Trottoir
 "::✦::::::::::::::~:::✦::::::::::::✦:::~::::::::::✦", // 12 Rue Principale
  ":::::~::::::::::::::::::::::~~::::::::::::::::::::", // 13 Rue
  "::::::::::::::::::::::::::::::::::::::::::::::::::", // 14 Rue dégagée (Spawn Joueur)
  "::::::::✦________________________________✦::::::::", // 15 Rambarde bloquante + rue dégagée sur les bords
  ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,", // 16 Sable sec
  ",,;;;;;,,,,,,,,;;;;;,,,,,,,,;;;;;,,,,,,,,;;;;;,,,,", // 17 Sable dynamique
  ";;;≈≈≈;;;;;;;;;;≈≈≈;;;;;;;;;;≈≈≈;;;;;;;;;;≈≈≈;;;;;", // 18 Océan (rivage)
  "≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈", // 19 Océan profond
  "≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈", // 20 Océan très profond
];

// Enseignes néon
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
  "≈": TILE.WATER,
  "▼": TILE.STAIRS,
  ",": TILE.SAND,
  ";": TILE.SAND,
};

let _charMap = null;
let _charMapOffsetX = 0;
let _charMapOffsetY = 0;

// Called after generating the overworld to align _charMap with the 1-indexed
// shifted map used by the game engine rendering loop.
export const setCharMapOffset = (dx, dy) => {
  _charMapOffsetX = dx;
  _charMapOffsetY = dy;
};

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

  // Calcul dynamique de la ligne de côte
  const coastLine = [];
  for (let x = 0; x <= width; x++) {
    let shoreY = height;
    for (let y = 0; y <= height; y++) {
      if (map[y][x] === TILE.WATER) {
        shoreY = y;
        break;
      }
    }
    coastLine[x] = shoreY;
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
  const ox = x - _charMapOffsetX;
  const oy = y - _charMapOffsetY;
  for (const s of NEON_SIGNS) {
    if (oy === s.y && ox >= s.x && ox < s.x + s.len) return s.color;
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

// --- Logique du Dégradé du Ciel ---
const skyBgForRow = (y) => {
  if (y === 5) return PALETTE.sky0; // Horizon lumineux (juste au-dessus des toits)
  if (y === 4) return PALETTE.sky1;
  if (y === 3) return PALETTE.sky2;
  if (y === 2) return PALETTE.sky3;
  if (y === 1) return PALETTE.sky4; // Sombre (visible sous le HUD)
  return PALETTE.sky5;              // Noir pur pour y=0 (HUD) et y>=6 (bâtiments)
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
  starMap = [],
  options = {}
) => {
  const corruptionStage = options.corruptionStage || 0;
  const tile = map[y]?.[x];
  // Original 0-indexed coordinates for position-dependent logic
  // (map access uses x,y which may be 1-indexed after shifting)
  const origX = x - _charMapOffsetX;
  const origY = y - _charMapOffsetY;
  const ch = _charMap?.[origY]?.[origX] || " ";
  if (tile == null) return { char: " ", color: "#000" };

  // Calcul du fond du ciel pour la transparence
  const currentSkyBg = skyBgForRow(origY);

  switch (tile) {
    // ── CIEL & ÉTOILES ──────────
    case TILE.SKY: {
      const skyColor =
        corruptionStage >= 2
          ? PALETTE.sky2
          : corruptionStage >= 1
          ? PALETTE.sky1
          : currentSkyBg;
      return { char: " ", color: skyColor, bg: skyColor };
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
      return {
        char: "·",
        color: c,
        bg: currentSkyBg,
        opacity: op,
        glow: wave > 0.85 ? `0 0 3px ${PALETTE.starWarm}60` : null,
      };
    }

    // ── STRUCTURE (Gris Unifié) ───────────
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
      // Pour les toits hauts (origY < 6), le fond doit être le ciel dégradé
      // Pour les toits bas intégrés, utiliser le fond du bâtiment
      const bg = origY < 6 ? currentSkyBg : PALETTE.buildingBg;
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
      let c = cool ? PALETTE.windowCool : PALETTE.windowWarm;
      const hash = (x * 131 + y * 97) % 100;
      if (corruptionStage >= 1 && hash < 18) {
        c = PALETTE.neonHotPink;
      }

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
      return { 
        char: "█", 
        color: PALETTE.windowWarm, 
        bg: PALETTE.doorFrame,
        glow: `0 0 8px ${PALETTE.windowWarm}90`,
        bold: true
      };
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
      const isPlaza = origY <= 11;
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
      if (corruptionStage >= 2) {
        return {
          char: "%",
          color: PALETTE.neonMagenta,
          bg: PALETTE.streetDark,
          opacity: 0.55,
          glow: `0 0 7px ${PALETTE.neonMagenta}66`,
        };
      }
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

    // ── RAILING ──────────────────────────────
    case TILE.RAILING:
      return { char: "═", color: PALETTE.railing, bg: PALETTE.streetDark };

    // ── PLAGE (Sable + Eau Dynamique) ───────────
    case TILE.SAND:
    case TILE.WATER: {
      const baseShoreY = coastLine[x] || 18;

      const tide =
        Math.sin(tick * 0.05) * 1.0 + Math.cos(tick * 0.03 + x * 0.1) * 0.5;
      const dynamicShoreY = baseShoreY + tide;

      const isWater = y >= dynamicShoreY;

      if (isWater) {
        if (corruptionStage >= 3) {
          const glitchChars = ["0", "1", "A", "F", "X"];
          const gi = Math.abs((x * 11 + y * 5 + tick) % glitchChars.length);
          return {
            char: glitchChars[gi],
            color:
              (x + y + tick) % 2 === 0
                ? PALETTE.neonGreen
                : PALETTE.neonHotPink,
            opacity: 0.8,
            glow: `0 0 6px ${PALETTE.neonHotPink}55`,
            animClass: `wave-${(x + y) % 3}`,
          };
        }
        // === RENDU EAU ===
        const wavePhase = Math.sin(tick * 0.08 + x * 0.15 + y * 0.3);
        const waveOffset = Math.floor((wavePhase + 1) * 2);
        const charIdx = Math.max(0, Math.min(4, waveOffset));

        const distFromShore = y - dynamicShoreY;

        let c =
          distFromShore <= 0.5
            ? PALETTE.waterHighlight
            : distFromShore <= 1.5
            ? PALETTE.waterLight
            : distFromShore <= 3.0
            ? PALETTE.waterMid
            : PALETTE.waterDeep;

        let opacity =
          distFromShore <= 0.5 ? 0.85 : distFromShore <= 2.5 ? 0.75 : 0.6;
        let glow = null;

        for (let scan = 1; scan <= 12; scan++) {
          const sy = Math.floor(baseShoreY) - scan;
          if (sy < 0) break;
          const t = map[sy]?.[x];
          if (t === TILE.NEON_SIGN) {
            const nc = findSignColor(x, sy);
            if (VIVID_NEON_COLORS.has(nc)) {
              c = nc;
              opacity = Math.max(
                0.12,
                0.5 - distFromShore * 0.05 - scan * 0.02
              );
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

        if (
          Math.abs(distFromShore) <= 0.8 &&
          Math.sin(tick * 0.15 + x * 0.4) > 0.1
        ) {
          c = PALETTE.waterFoam;
          opacity = 0.8;
        }

        return {
          char: RENDER_CHARS.water[charIdx],
          color: c,
          opacity,
          glow,
          animClass: `wave-${(x + y) % 3}`,
        };
      } else {
        // === RENDU SABLE ===
        const distToWater = dynamicShoreY - y;
        const isWet = distToWater < 1.5;

        const si = (x * 17 + y * 11) % 5;
        const sandChar = isWet
          ? ["·", "·", ".", ".", "·"][si]
          : ["·", ".", ":", ".", "·"][si];

        const c = isWet
          ? PALETTE.sandWet
          : distToWater < 2.5
          ? PALETTE.sandBright
          : (x + y) % 3 === 0
          ? PALETTE.sandLight
          : PALETTE.sandMid;

        return {
          char: sandChar,
          color: c,
          bg: isWet ? PALETTE.sandDark : PALETTE.sandMid,
          opacity: isWet ? 0.5 : 0.6,
        };
      }
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
  }
};
