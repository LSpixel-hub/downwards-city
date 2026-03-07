// ============================================
// OVERWORLD GENERATOR — NEO-TOKYO BAY
// Module de génération de carte ville nocturne
// Pour Downwards Overdrive Rogue
// ============================================

// ============================================
// CONSTANTES DE GRILLE
// ============================================
export const GRID_WIDTH = 50;
export const GRID_HEIGHT = 21;

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
  waterDeep: "#001a33",
  waterMid: "#003366",
  waterLight: "#005599",
  waterHighlight: "#00aaff",

  // Lampadaires
  streetlightGlow: "#fffbe6",
};

export const NEON_COLORS = [
  PALETTE.neonHotPink,
  PALETTE.neonCyan,
  PALETTE.neonPurple,
  PALETTE.neonYellow,
  PALETTE.neonGreen,
];

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
  floor: ["·", ".", " ", " ", "˙"],
  water: ["~", "≈", "∼", "~", "—"],
  promenade: ["·", ".", " "],
};

// ============================================
// MOTEUR DE GÉNÉRATION
// ============================================
export const generateOverworld = (options = {}) => {
  const {
    width = GRID_WIDTH,
    height = GRID_HEIGHT,
    coastEnabled = true,
    baseCoastY = 16,
    minBlockSize = 5,
    windowDensity = 0.40,
    neonDensity = 0.15,
    streetlightDensity = 0.08,
    minSpawnDistance = 25,
  } = options;

  // 1. Initialiser la grille avec des bâtiments
  const map = Array(height + 1)
    .fill(null)
    .map(() => Array(width + 1).fill(TILE.BUILDING));

  // 2. Ligne côtière sinusoïdale
  const coastLine = [];
  if (coastEnabled) {
    for (let x = 1; x <= width; x++) {
      coastLine[x] = baseCoastY + Math.round(Math.sin(x / 5) * 1.5);
    }
  }

  // 3. Bordures nord/est/ouest
  const cityBottomY = coastEnabled ? baseCoastY : height;
  for (let y = 1; y <= cityBottomY; y++) {
    for (let x = 1; x <= width; x++) {
      if (x === 1 || x === width || y === 1) {
        map[y][x] = TILE.BUILDING;
      }
    }
  }

  // 4. BSP — Subdivision récursive pour créer la grille de rues
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

  subdivide(2, 2, width - 2, cityBottomY - 3);

  // 5. Décoration des blocs — fenêtres & néons
  for (const block of blocks) {
    for (let by = block.y; by < block.y + block.h; by++) {
      for (let bx = block.x; bx < block.x + block.w; bx++) {
        if (map[by][bx] !== TILE.BUILDING) continue;

        if (Math.random() < windowDensity) {
          map[by][bx] = TILE.LIT_WINDOW;
        }

        const touchesStreet =
          (bx > 1 && map[by][bx - 1] === TILE.STREET) ||
          (bx < width && map[by][bx + 1] === TILE.STREET) ||
          (by > 1 && map[by - 1][bx] === TILE.STREET) ||
          (by < height && map[by + 1][bx] === TILE.STREET);

        if (touchesStreet && Math.random() < neonDensity) {
          map[by][bx] = TILE.NEON_SIGN;
        }
      }
    }
  }

  // 6. Lampadaires sur les rues
  for (let y = 2; y < cityBottomY; y++) {
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

  // 7. Zone côtière — promenade + océan
  if (coastEnabled) {
    for (let y = baseCoastY - 1; y <= height; y++) {
      for (let x = 1; x <= width; x++) {
        map[y][x] = y >= coastLine[x] ? TILE.WATER : TILE.PROMENADE;
      }
    }
  }

  // 8. Placement du joueur et de la sortie
  const getRandomTile = (tileTypes, regionMinY, regionMaxY) => {
    for (let i = 0; i < 2000; i++) {
      const rx = Math.floor(Math.random() * (width - 2)) + 2;
      const ry = Math.floor(Math.random() * (regionMaxY - regionMinY)) + regionMinY;
      if (tileTypes.includes(map[ry]?.[rx])) return { x: rx, y: ry };
    }
    return { x: Math.floor(width / 2), y: Math.floor(regionMaxY / 2) };
  };

  const getValidPromenade = () => {
    if (!coastEnabled) return getRandomTile([TILE.STREET], 2, cityBottomY - 1);
    for (let x = Math.floor(width / 2); x < width; x++) {
      const y = coastLine[x] - 1;
      if (map[y]?.[x] === TILE.PROMENADE) return { x, y };
    }
    return { x: Math.floor(width / 2), y: baseCoastY - 1 };
  };

  const playerPos = getValidPromenade();
  let stairsPos = getRandomTile([TILE.STREET, TILE.STREETLIGHT], 2, cityBottomY - 1);

  while (
    Math.abs(playerPos.x - stairsPos.x) + Math.abs(playerPos.y - stairsPos.y) <
    minSpawnDistance
  ) {
    stairsPos = getRandomTile([TILE.STREET, TILE.STREETLIGHT], 2, cityBottomY - 1);
  }
  map[stairsPos.y][stairsPos.x] = TILE.STAIRS;

  return {
    map,
    playerPos,
    stairsPos,
    coastLine,
    blocks,
    width,
    height,
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
export const getTileRender = (map, x, y, tick = 0, coastLine = []) => {
  const tile = map[y]?.[x];
  if (tile == null) return { char: " ", color: "#000" };

  switch (tile) {
    case TILE.STREET: {
      const ci = (x * 13 + y * 7) % RENDER_CHARS.floor.length;
      const reflectColor = getAdjacentNeonColor(map, x, y);
      return {
        char: reflectColor ? "·" : RENDER_CHARS.floor[ci],
        color: reflectColor || PALETTE.streetMid,
        opacity: reflectColor ? 0.25 : 0.5,
        glow: reflectColor ? `0 0 6px ${reflectColor}60` : null,
      };
    }
    case TILE.BUILDING: {
      const heightRatio = y / 16;
      const r = Math.floor(12 + heightRatio * 8);
      const g = Math.floor(10 + heightRatio * 6);
      const b = Math.floor(20 + heightRatio * 12);
      const c = `rgb(${r},${g},${b})`;
      return { char: "█", color: c, bg: c };
    }
    case TILE.LIT_WINDOW: {
      const warm = (x * 3 + y * 7) % 5 !== 0;
      const c = warm ? PALETTE.windowWarm : PALETTE.windowCool;
      return {
        char: "▒",
        color: c,
        glow: `0 0 6px ${c}90, 0 0 12px ${c}40`,
        animClass: `window-${(x + y) % 4}`,
      };
    }
    case TILE.NEON_SIGN: {
      const c = getNeonColor(x, y);
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
      const distFromShore = y - (coastLine[x] || 16);
      let c = distFromShore <= 0 ? PALETTE.waterHighlight
            : distFromShore === 1 ? PALETTE.waterLight
            : PALETTE.waterMid;
      let opacity = distFromShore <= 0 ? 0.7 : distFromShore === 1 ? 0.6 : 0.5;

      // Reflets de néons sur l'eau
      const aboveY = (coastLine[x] || 16) - 1;
      if (map[aboveY]?.[x] === TILE.NEON_SIGN) {
        c = getNeonColor(x, aboveY);
        opacity = Math.max(0.1, 0.3 - distFromShore * 0.05);
      }

      return {
        char: RENDER_CHARS.water[phase],
        color: c,
        opacity,
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
