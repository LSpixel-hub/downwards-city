// ============================================
// OVERWORLD GENERATOR — NEO-TOKYO BAY
// Module de génération de carte ville nocturne
// Pour Downwards Overdrive Rogue
// ============================================

// ============================================
// CONSTANTES DE GRILLE
// ============================================
export const GRID_WIDTH = 50;
export const GRID_HEIGHT = 27; // +2 lignes pour le ciel, mer étendue

// ============================================
// TYPES DE TUILES
// ============================================
export const TILE = {
  VOID: 0,
  STREET: 1,       // Rue marchable
  BUILDING: 2,     // Façade d'immeuble (mur)
  LIT_WINDOW: 3,   // Fenêtre allumée (mur déco)
  NEON_SIGN: 4,    // Enseigne néon (mur déco)
  STREETLIGHT: 5,  // Lampadaire (marchable)
  STAIRS: 6,       // Entrée du donjon / métro
  WATER: 7,        // Océan (bloquant)
  PROMENADE: 8,    // Bord de mer (marchable)
  SKY: 9,          // Ciel nocturne (non-marchable, déco)
  STAR: 10,        // Étoile scintillante (non-marchable, déco)
};

// Set des tuiles marchables pour collision check rapide
export const WALKABLE = new Set([
  TILE.STREET,
  TILE.STREETLIGHT,
  TILE.STAIRS,
  TILE.PROMENADE,
]);

// ============================================
// PALETTE SYNTHWAVE
// ============================================
export const PALETTE = {
  // Bâtiments & rues
  buildingDark: "#0c0a14",
  buildingMid: "#12101c",
  streetDark: "#1a1825",
  streetMid: "#252333",
  streetBright: "#3d3a52",   // Nouveau: rue plus visible
  promenade: "#3a3550",

  // Fenêtres
  windowWarm: "#fff7cc",
  windowCool: "#aae0ff",

  // Néons
  neonCyan: "#00fff9",
  neonMagenta: "#ff2a6d",
  neonPurple: "#b026ff",
  neonYellow: "#fff01f",
  neonGreen: "#39ff14",
  neonHotPink: "#ff0055",

  // Eau
  waterDeep: "#002244",
  waterMid: "#005588",
  waterLight: "#0077bb",
  waterHighlight: "#22bbff",

  // Lampadaires
  streetlightGlow: "#fffbe6",

  // Ciel
  skyDeep: "#05050f",
  skyMid: "#0a0a1a",
  starDim: "#555577",
  starBright: "#eeeeff",
  starWarm: "#ffddaa",
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

// ============================================
// CONSTANTES DU CIEL
// ============================================
export const SKY_ROWS = 2;          // Nombre de lignes de ciel en haut
export const STAR_DENSITY = 0.08;   // ~8% de chance par tuile ciel

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
  floor: ["·", ":", "·", "·", ":"],       // Rues: plus contrastées avec ":" ajoutés
  water: ["~", "≈", "∼", "~", "—"],
  promenade: ["·", ".", " "],
  star: "·",                                  // Étoile: point unique, scintillement par opacité
};

// ============================================
// MOTEUR DE GÉNÉRATION
// ============================================
export const generateOverworld = (options = {}) => {
  const {
    width = GRID_WIDTH,
    height = GRID_HEIGHT,
    coastEnabled = true,
    baseCoastY = 18,          // Côte remontée pour plus de mer
    minBlockSize = 4,         // Réduit: immeubles plus petits
    windowDensity = 0.40,
    neonDensity = 0.15,
    streetlightDensity = 0.08,
    minSpawnDistance = 20,
    skyRows = SKY_ROWS,
  } = options;

  // 1. Initialiser la grille
  const totalHeight = height + 1;
  const map = Array(totalHeight)
    .fill(null)
    .map(() => Array(width + 1).fill(TILE.BUILDING));

  // 2. Générer le ciel étoilé (lignes 0 à skyRows-1)
  const starMap = []; // Pour tracker quelles étoiles scintillent
  for (let y = 0; y <= skyRows; y++) {
    for (let x = 0; x <= width; x++) {
      map[y][x] = TILE.SKY;

      // Placer des étoiles aléatoires
      if (Math.random() < STAR_DENSITY) {
        map[y][x] = TILE.STAR;
        starMap.push({ x, y, phase: Math.random() * Math.PI * 2 });
      }
    }
  }

  // 3. Ligne côtière sinusoïdale
  const coastLine = [];
  if (coastEnabled) {
    for (let x = 1; x <= width; x++) {
      coastLine[x] = baseCoastY + Math.round(Math.sin(x / 5) * 1.5);
    }
  }

  // 4. Zone ville — commence après le ciel
  const cityTopY = skyRows + 1;
  const cityBottomY = coastEnabled ? baseCoastY : height;

  // Skyline irrégulière — certains bâtiments du haut deviennent du ciel
  const skylineOffset = [];
  for (let x = 0; x <= width; x++) {
    skylineOffset[x] = Math.round(
      Math.sin(x * 0.3) * 1.2 +
      Math.sin(x * 0.7 + 2) * 0.8 +
      ((x * 37 + 13) % 3) - 1
    );
  }

  // Bordures ville + skyline
  for (let y = cityTopY; y <= cityBottomY; y++) {
    for (let x = 1; x <= width; x++) {
      if (x === 1 || x === width) {
        map[y][x] = TILE.BUILDING;
        continue;
      }
      const skyLimit = cityTopY + Math.max(0, skylineOffset[x] + 1);
      if (y < skyLimit) {
        map[y][x] = Math.random() < STAR_DENSITY * 0.5 ? TILE.STAR : TILE.SKY;
      }
    }
  }

  // 5. BSP — Subdivision récursive pour créer la grille de rues
  const blocks = [];

  const subdivide = (x, y, w, h) => {
    if (w < minBlockSize || h < minBlockSize) {
      blocks.push({ x, y, w, h });
      return;
    }

    const splitH =
      w / h > 1.25 ? false : h / w > 1.25 ? true : Math.random() < 0.5;

    if (splitH) {
      if (h < minBlockSize * 2) {
        blocks.push({ x, y, w, h });
        return;
      }
      const splitY = Math.floor(
        y + minBlockSize + Math.random() * (h - minBlockSize * 2)
      );
      for (let sx = x; sx < x + w; sx++) map[splitY][sx] = TILE.STREET;
      subdivide(x, y, w, splitY - y);
      subdivide(x, splitY + 1, w, h - (splitY - y + 1));
    } else {
      if (w < minBlockSize * 2) {
        blocks.push({ x, y, w, h });
        return;
      }
      const splitX = Math.floor(
        x + minBlockSize + Math.random() * (w - minBlockSize * 2)
      );
      for (let sy = y; sy < y + h; sy++) map[sy][splitX] = TILE.STREET;
      subdivide(x, y, splitX - x, h);
      subdivide(splitX + 1, y, w - (splitX - x + 1), h);
    }
  };

  subdivide(2, cityTopY + 1, width - 2, cityBottomY - cityTopY - 2);

  // 6. Décoration des blocs — fenêtres & néons
  for (const block of blocks) {
    for (let by = block.y; by < block.y + block.h; by++) {
      for (let bx = block.x; bx < block.x + block.w; bx++) {
        if (by >= map.length || bx >= map[0].length) continue;
        if (map[by][bx] !== TILE.BUILDING) continue;

        if (Math.random() < windowDensity) {
          map[by][bx] = TILE.LIT_WINDOW;
        }

        const touchesStreet =
          (bx > 1 && map[by][bx - 1] === TILE.STREET) ||
          (bx < width && map[by][bx + 1] === TILE.STREET) ||
          (by > 1 && map[by - 1]?.[bx] === TILE.STREET) ||
          (by < height && map[by + 1]?.[bx] === TILE.STREET);

        if (touchesStreet && Math.random() < neonDensity) {
          map[by][bx] = TILE.NEON_SIGN;
        }
      }
    }
  }

  // 7. Lampadaires sur les rues
  for (let y = cityTopY; y < cityBottomY; y++) {
    for (let x = 2; x < width; x++) {
      if (map[y][x] !== TILE.STREET) continue;

      const touchesBuilding =
        (map[y + 1]?.[x] != null && map[y + 1][x] !== TILE.STREET && map[y + 1][x] !== TILE.VOID) ||
        (map[y - 1]?.[x] != null && map[y - 1][x] !== TILE.STREET && map[y - 1][x] !== TILE.VOID) ||
        (map[y][x + 1] != null && map[y][x + 1] !== TILE.STREET && map[y][x + 1] !== TILE.VOID) ||
        (map[y][x - 1] != null && map[y][x - 1] !== TILE.STREET && map[y][x - 1] !== TILE.VOID);

      if (touchesBuilding && Math.random() < streetlightDensity) {
        map[y][x] = TILE.STREETLIGHT;
      }
    }
  }

  // 8. Zone côtière — promenade + océan
  if (coastEnabled) {
    for (let y = baseCoastY - 1; y <= height; y++) {
      for (let x = 1; x <= width; x++) {
        map[y][x] = y >= coastLine[x] ? TILE.WATER : TILE.PROMENADE;
      }
    }
  }

  // 9. Placement du joueur et de la sortie
  const getRandomTile = (tileTypes, regionMinY, regionMaxY) => {
    for (let i = 0; i < 2000; i++) {
      const rx = Math.floor(Math.random() * (width - 2)) + 2;
      const ry = Math.floor(Math.random() * (regionMaxY - regionMinY)) + regionMinY;
      if (ry < map.length && tileTypes.includes(map[ry]?.[rx])) return { x: rx, y: ry };
    }
    return { x: Math.floor(width / 2), y: Math.floor(regionMaxY / 2) };
  };

  const getValidPromenade = () => {
    if (!coastEnabled) return getRandomTile([TILE.STREET], cityTopY, cityBottomY - 1);
    for (let x = Math.floor(width / 2); x < width; x++) {
      const y = coastLine[x] - 1;
      if (map[y]?.[x] === TILE.PROMENADE) return { x, y };
    }
    return { x: Math.floor(width / 2), y: baseCoastY - 1 };
  };

  const playerPos = getValidPromenade();
  let stairsPos = getRandomTile([TILE.STREET, TILE.STREETLIGHT], cityTopY, cityBottomY - 1);

  while (
    Math.abs(playerPos.x - stairsPos.x) + Math.abs(playerPos.y - stairsPos.y) <
    minSpawnDistance
  ) {
    stairsPos = getRandomTile([TILE.STREET, TILE.STREETLIGHT], cityTopY, cityBottomY - 1);
  }
  map[stairsPos.y][stairsPos.x] = TILE.STAIRS;

  return {
    map,
    playerPos,
    stairsPos,
    coastLine,
    blocks,
    starMap,
    width,
    height,
    skyRows,
  };
};

// ============================================
// UTILITAIRES
// ============================================

/** Vérifie si une position est marchable */
export const isWalkable = (map, x, y) => {
  if (y < 1 || y >= map.length || x < 1 || x >= map[0].length) return false;
  return WALKABLE.has(map[y][x]);
};

/** Retourne la couleur néon d'une tuile NEON_SIGN selon sa position */
export const getNeonColor = (x, y) => {
  return NEON_COLORS[(x * y) % NEON_COLORS.length];
};

/** Vérifie si une tuile de rue est adjacente à un néon (pour reflets sol mouillé) */
export const getAdjacentNeonColor = (map, x, y) => {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;
    if (map[ny]?.[nx] === TILE.NEON_SIGN) {
      return getNeonColor(nx, ny);
    }
  }
  return null;
};

/** Retourne le caractère et la couleur de rendu pour une tuile donnée */
export const getTileRender = (map, x, y, tick = 0, coastLine = [], starMap = []) => {
  const tile = map[y]?.[x];
  if (tile == null) return { char: " ", color: "#000" };

  switch (tile) {
    // ── CIEL ──────────────────────────────────
    case TILE.SKY: {
      return {
        char: " ",
        color: PALETTE.skyDeep,
        bg: PALETTE.skyDeep,
      };
    }
    case TILE.STAR: {
      // Scintillement doux — onde sinusoïdale lente, variation de luminosité uniquement
      const wave = (Math.sin(tick * 0.08 + x * 2.7 + y * 4.1) + 1) / 2; // 0..1
      const op = 0.2 + wave * 0.8; // oscille entre 0.2 et 1.0
      const c = wave > 0.85 ? PALETTE.starWarm
              : wave > 0.4  ? PALETTE.starBright
              : PALETTE.starDim;

      return {
        char: "·",
        color: c,
        bg: PALETTE.skyDeep,
        opacity: op,
        glow: wave > 0.85 ? `0 0 3px ${PALETTE.starWarm}60` : null,
      };
    }

    // ── RUES (plus visibles) ──────────────────
    case TILE.STREET: {
      const ci = (x * 13 + y * 7) % RENDER_CHARS.floor.length;
      const reflectColor = getAdjacentNeonColor(map, x, y);
      return {
        char: reflectColor ? "·" : RENDER_CHARS.floor[ci],
        color: reflectColor || PALETTE.streetBright,    // Plus lumineux
        bg: PALETTE.streetDark,                          // Fond distinct
        opacity: reflectColor ? 0.35 : 0.7,             // Plus opaque
        glow: reflectColor ? `0 0 6px ${reflectColor}60` : null,
      };
    }
    case TILE.BUILDING: {
      const heightRatio = y / 20;
      // Les buildings proches du ciel sont plus sombres pour fondre avec la nuit
      const skyProximity = Math.max(0, 1 - (y - SKY_ROWS) / 3);
      const r = Math.floor((12 + heightRatio * 8) * (1 - skyProximity * 0.6));
      const g = Math.floor((10 + heightRatio * 6) * (1 - skyProximity * 0.6));
      const b = Math.floor((20 + heightRatio * 12) * (1 - skyProximity * 0.7));
      const c = `rgb(${r},${g},${b})`;
      return { char: "█", color: c, bg: c };
    }
    case TILE.LIT_WINDOW: {
      const warm = (x * 3 + y * 7) % 5 !== 0;
      const c = warm ? PALETTE.windowWarm : PALETTE.windowCool;
      const hash = (x * 131 + y * 97) % 100;

      // Groupe A (hash 0-14): cycle lent avec fondu doux
      if (hash < 15) {
        const cycle = Math.sin(tick * 0.02 + hash * 0.7);
        if (cycle < -0.3) {
          const heightRatio = y / 20;
          const r = Math.floor(12 + heightRatio * 8);
          const g = Math.floor(10 + heightRatio * 6);
          const b = Math.floor(20 + heightRatio * 12);
          const bc = `rgb(${r},${g},${b})`;
          return { char: "█", color: bc, bg: bc };
        }
        if (cycle < 0.2) {
          const fade = (cycle + 0.3) / 0.5;
          return {
            char: "▒",
            color: c,
            opacity: 0.3 + fade * 0.7,
            glow: `0 0 ${Math.floor(fade * 6)}px ${c}${Math.floor(fade * 9)}0`,
            animClass: `window-${(x + y) % 4}`,
          };
        }
      }

      // Groupe B (hash 15-21): on/off instantané — quelqu'un allume ou éteint
      // Cycle très lent avec seuil net (pas de fondu)
      if (hash >= 15 && hash < 22) {
        const snap = Math.sin(tick * 0.012 + hash * 1.1);
        if (snap < -0.2) {
          const heightRatio = y / 20;
          const r = Math.floor(12 + heightRatio * 8);
          const g = Math.floor(10 + heightRatio * 6);
          const b = Math.floor(20 + heightRatio * 12);
          const bc = `rgb(${r},${g},${b})`;
          return { char: "█", color: bc, bg: bc };
        }
      }

      return {
        char: "▒",
        color: c,
        glow: `0 0 6px ${c}90, 0 0 12px ${c}40`,
        animClass: `window-${(x + y) % 4}`,
      };
    }
    case TILE.NEON_SIGN: {
      const c = getNeonColor(x, y);
      // ~8% des néons ont un flicker subtil
      const nHash = (x * 73 + y * 53) % 100;
      if (nHash < 8) {
        const flick = Math.sin(tick * 0.04 + nHash * 1.3);
        if (flick < -0.5) {
          return {
            char: "█",
            color: c,
            opacity: 0.3,
            glow: `0 0 4px ${c}40`,
            bold: true,
            animClass: `neon-${(x + y) % 5}`,
          };
        }
      }
      return {
        char: "█",
        color: c,
        glow: `0 0 10px ${c}, 0 0 25px ${c}90, 0 0 45px ${c}40`,
        bold: true,
        animClass: `neon-${(x + y) % 5}`,
      };
    }
    case TILE.STREETLIGHT: {
      return {
        char: "✦",
        color: PALETTE.streetlightGlow,
        glow: `0 0 8px ${PALETTE.streetlightGlow}, 0 0 20px ${PALETTE.streetlightGlow}a0`,
        bold: true,
        animClass: "streetlight",
      };
    }
    case TILE.WATER: {
      const phase = (tick + x * 3 + y * 7) % RENDER_CHARS.water.length;
      const distFromShore = y - (coastLine[x] || 18);
      let c = distFromShore <= 0 ? PALETTE.waterHighlight
            : distFromShore === 1 ? PALETTE.waterLight
            : PALETTE.waterMid;
      let opacity = distFromShore <= 0 ? 0.85 : distFromShore === 1 ? 0.75 : 0.65;
      let glow = null;

      // Reflets sur l'eau — uniquement couleurs vives (néons)
      const shoreY = coastLine[x] || 20;
      for (let scan = 1; scan <= 5; scan++) {
        const sy = shoreY - scan;
        if (sy < 0) break;
        const t = map[sy]?.[x];
        if (t === TILE.NEON_SIGN) {
          const nc = getNeonColor(x, sy);
          if (VIVID_NEON_COLORS.has(nc)) {
            c = nc;
            opacity = Math.max(0.15, 0.55 - distFromShore * 0.06 - scan * 0.04);
            glow = `0 0 6px ${nc}50`;
          }
          break;
        }
        if (t === TILE.LIT_WINDOW || t === TILE.STREETLIGHT) break;
      }

      return {
        char: RENDER_CHARS.water[phase],
        color: c,
        opacity,
        glow,
        animClass: `wave-${(x + y) % 3}`,
      };
    }
    case TILE.PROMENADE: {
      const ci = (x + y) % RENDER_CHARS.promenade.length;
      return {
        char: RENDER_CHARS.promenade[ci],
        color: PALETTE.promenade,
        opacity: 0.6,
      };
    }
    case TILE.STAIRS: {
      return {
        char: "▼",
        color: PALETTE.neonMagenta,
        glow: `0 0 10px ${PALETTE.neonMagenta}, 0 0 25px ${PALETTE.neonMagenta}80`,
        bold: true,
        animClass: "stairs-pulse",
      };
    }
    default:
      return { char: " ", color: "#000" };
  }
};
