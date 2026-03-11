import React, { useRef, useEffect } from "react";
import { NEON, BIOMES } from "./data";
import { PALETTE as OW_PALETTE } from "./overworldgenerator";

// ============================================
// DOWNWARDS - OVERDRIVE ROGUE
// Synthwave 80s Aesthetic
// ============================================

export const GRID_WIDTH = 50;
export const GRID_HEIGHT = 21;

export const PROLOGUE_LINES = [
  "PROLOGUE",
  "",
  "Bettie was no ordinary girl. In that summer of the 80s, while the youth of the Riviera consumed themselves under the strobe lights of nightclubs, she preferred the hypnotic glow of her bedroom. She was a beautiful anomaly, a pioneer of the shadows: a gamer.",
  "",
  "Around her, the CRT screens of her ZX Spectrum and her trusty Amstrad CPC crackled softly in the dim light. She loved spending her nights like this, the window wide open to the seaside. Lulled by the surf of the waves and the mechanical clatter of her keyboard, she would let demos from the pirate scene run or delve deep into the corridors of her favorite exploration games.",
  "",
  "That night, the air was electric. Bettie was plunged into the procedurally generated depths of Rogue, typing her command lines with deadly precision. It was then that the full moon began to radiate an abnormal glow, casting a magenta, almost sickly glare over the sea foam.",
  "",
  "The ocean wind abruptly died down. In its place, an icy draft, laden with the smell of ancient dust and ozone, swept into the room. Beneath the asphalt and neon lights of the city, something very old had awakened. Malevolent forces, lurking in catacombs forgotten for millennia, had just found a rift to the surface. The Amstrad's screen fractured with a terrifying sizzle, and the shadows in the room materialized.",
  "",
  "Bettie had no time to flee. The darkness swallowed her whole. She only had time to let out a scream. A shrill, visceral howl of pure terror.",
  "",
  "Further down, on the coastal road, the roar of a V6 engine tore through the night. You were behind the wheel of your Alpine A310, the yellow headlights frantically sweeping across the palm trees. The engine was howling, the car radio was blasting bass, but that scream... It pierced through the bodywork, the sound of the wind, and your soul.",
  "",
  "You slammed on the brake pedal. The tires squealed in turn, leaving long trails of burnt rubber on the asphalt before the Alpine came to a dead stop right on the shore, just meters from the edge.",
  "",
  "Silence fell again, heavy and threatening. High above, the window of Bettie's room was now blinking only to the frantic rhythm of a system error. The bowels of the city had just swallowed her up. You clenched your fists on the leather steering wheel. The gates of hell had just opened beneath the Riviera.",
  "",
  "There is no choice left. You have to save Bettie.",
];

// Tile types
export const TILE = {
  VOID: 0,
  FLOOR: 1,
  WALL: 2,
  CORRIDOR: 3,
  STAIRS: 4,
  TELEPORTER: 5,
  WEAPON: 6,
  KEY: 7,
  POTION: 8,
  SCROLL: 9,
  VENDOR: 10,
  GOLD: 11,
  BOW: 12,
  PRINCESS: 13,
  GEM: 14,
  ARMOR: 15,
  VAULT_STAIRS: 16,
  FIRE: 17,
  POISON: 18,
  ICE: 19,
  VOID_FLUX: 20,
  BARREL: 21,
  BLOOD_ALTAR: 22,
  OVERLOAD_KEY: 23,
  BLUE_STAIRS: 24,
};

// Direction constants
export const CARDINAL_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
export const ALL_DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]];

// Corridor dash tile sets (constant, no need to recreate per call)
export const DASH_AUTO_PICKUP = new Set([TILE.GOLD, TILE.KEY]);
export const DASH_STOP_BEFORE = new Set([TILE.WEAPON, TILE.ARMOR, TILE.VENDOR, TILE.BOW]);
export const DASH_STOP_AFTER = new Set([TILE.POTION, TILE.SCROLL, TILE.GEM, TILE.TELEPORTER, TILE.PRINCESS, TILE.STAIRS, TILE.VAULT_STAIRS, TILE.BLUE_STAIRS]);

// Helper functions
export const getZone = (x, y) => {
  if (x < 1 || y < 1) return 0;
  return 1 + Math.floor((x - 1) / 10) + Math.floor((y - 1) / 7) * 5;
};

export const TERRAIN_TILES = new Set([
  TILE.FIRE,
  TILE.POISON,
  TILE.ICE,
  TILE.VOID_FLUX,
]);

export const isTerrainTile = (tile) => TERRAIN_TILES.has(tile);

export const getTerrainDamage = (tile) => {
  if (tile === TILE.FIRE) return 2;
  if (tile === TILE.POISON) return 1;
  if (tile === TILE.VOID_FLUX) return 1;
  return 0;
};

export const getRandomTerrainTile = (level) => {
  const roll = Math.random();
  if (level >= 30) {
    if (roll < 0.3) return TILE.FIRE;
    if (roll < 0.55) return TILE.POISON;
    if (roll < 0.75) return TILE.ICE;
    return TILE.VOID_FLUX;
  }
  if (roll < 0.3) return TILE.POISON;
  if (roll < 0.6) return TILE.ICE;
  if (roll < 0.85) return TILE.FIRE;
  return TILE.VOID_FLUX;
};

// ======== QUICK WIN #3 : Set lookup O(1) au lieu de 12 comparaisons ========
export const WALKABLE_TILES = new Set([
  TILE.FLOOR,
  TILE.CORRIDOR,
  TILE.STAIRS,
  TILE.TELEPORTER,
  TILE.WEAPON,
  TILE.KEY,
  TILE.POTION,
  TILE.SCROLL,
  TILE.VENDOR,
  TILE.GOLD,
  TILE.BOW,
  TILE.PRINCESS,
  TILE.GEM,
  TILE.ARMOR,
  TILE.VAULT_STAIRS,
  TILE.FIRE,
  TILE.POISON,
  TILE.ICE,
  TILE.VOID_FLUX,
  TILE.BLOOD_ALTAR,
  TILE.OVERLOAD_KEY,
  TILE.BLUE_STAIRS,
]);

export const isWalkable = (tile) => WALKABLE_TILES.has(tile);

// ======== BFS PATHFINDING for destination mode ========
export const findPath = (
  startX,
  startY,
  goalX,
  goalY,
  map,
  monsters,
  revealedZones
) => {
  if (startX === goalX && startY === goalY) return [];
  const k = (x, y) => (x << 8) | y; // fast key for 50x21 grid
  const monsterSet = new Set(
    monsters.filter((m) => m.currentHp > 0 && m.x > 0).map((m) => k(m.x, m.y))
  );
  const goalTile = map[goalY]?.[goalX];
  if (!isWalkable(goalTile)) return null;
  if (!revealedZones.has(getZone(goalX, goalY))) return null;

  const queue = [startX, startY];
  const cameFrom = new Map();
  cameFrom.set(k(startX, startY), -1);
  let head = 0;

  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];
    for (const [dx, dy] of ALL_DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 1 || nx > GRID_WIDTH || ny < 1 || ny > GRID_HEIGHT) continue;
      const nk = k(nx, ny);
      if (cameFrom.has(nk)) continue;
      const tile = map[ny]?.[nx];
      if (!isWalkable(tile)) continue;
      if (!revealedZones.has(getZone(nx, ny))) continue;

      if (dx !== 0 && dy !== 0) {
        const t1 = map[cy]?.[cx + dx];
        const t2 = map[cy + dy]?.[cx];
        if (!isWalkable(t1) || !isWalkable(t2)) continue;
      }

      if (monsterSet.has(nk) && !(nx === goalX && ny === goalY)) continue;

      cameFrom.set(nk, k(cx, cy));
      if (nx === goalX && ny === goalY) {
        const path = [];
        let cur = nk;
        while (cur !== k(startX, startY)) {
          path.push({ x: cur >> 8, y: cur & 0xff });
          cur = cameFrom.get(cur);
        }
        path.reverse();
        return path;
      }
      queue.push(nx, ny);
    }
  }
  return null;
};

export const findUnexploredPassages = (revealedZones, map) => {
  const passages = [];
  const checked = new Set();
  const directions = [
    { dx: 0, dy: -1, arrow: "↑" }, // ou '^'
    { dx: 0, dy: 1, arrow: "↓" }, // ou 'v'
    { dx: -1, dy: 0, arrow: "←" }, // ou '<'
    { dx: 1, dy: 0, arrow: "→" }, // ou '>'
  ];

  for (let y = 1; y <= GRID_HEIGHT; y++) {
    for (let x = 1; x <= GRID_WIDTH; x++) {
      const currentZone = getZone(x, y);
      if (!revealedZones.has(currentZone)) continue;

      const tile = map[y]?.[x];
      if (!isWalkable(tile)) continue;

      for (const { dx, dy, arrow } of directions) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx < 1 || nx > GRID_WIDTH || ny < 1 || ny > GRID_HEIGHT) continue;

        const neighborZone = getZone(nx, ny);
        const neighborTile = map[ny]?.[nx];

        if (!revealedZones.has(neighborZone) && isWalkable(neighborTile)) {
          const key = `${x},${y},${arrow}`;
          if (!checked.has(key)) {
            checked.add(key);
            passages.push({ x, y, arrow });
          }
        }
      }
    }
  }

  return passages;
};

// ======== OVERWORLD BIOME (level 0) ========
export const OVERWORLD_BIOME = {
  name: "NEON BAY",
  floorColor: OW_PALETTE.promenade,
  corridorColor: OW_PALETTE.streetMid,
  floorChars: ["·", ".", " ", " ", "˙"],
  levels: [0, 0],
  plasmaColor1: "#001a33",
  plasmaColor2: "#0c0a14",
  gridColor: "0,255,249",
  bgFrom: "#0c0a14",
  bgTo: "#12101c",
};

export const getBiome = (level) => {
  if (level === 0) return OVERWORLD_BIOME;
  for (const biome of BIOMES) {
    if (level >= biome.levels[0] && level <= biome.levels[1]) return biome;
  }
  return BIOMES[BIOMES.length - 1];
};

// ============================================
// OPTIMISATION : Fonction de rendu tile PURE (hors composant)
// ============================================
export const glowStyle = (color, intensity = 1) => {
  const a = Math.round(4 * intensity);
  const b = Math.round(10 * intensity);
  const c = Math.round(22 * intensity);
  return `0 0 ${a}px ${color}, 0 0 ${b}px ${color}, 0 0 ${c}px ${color}40`;
};

export const renderTileData = (tile, biome, gemColor) => {
  switch (tile) {
    case TILE.VOID:
      return { char: " ", color: "#000", glow: "none", flash: false };
    case TILE.FLOOR:
      return {
        char: "·",
        color: biome.floorColor,
        glow: glowStyle(biome.floorColor),
        flash: false,
      };
    case TILE.CORRIDOR:
      return {
        char: "·",
        color: biome.corridorColor,
        glow: glowStyle(biome.corridorColor, 1.6),
        flash: false,
      };
    case TILE.STAIRS:
      return {
        char: "▼",
        color: NEON.magenta,
        glow: glowStyle(NEON.magenta),
        flash: false,
      };
    case TILE.BLUE_STAIRS:
      return {
        char: "▼",
        color: NEON.cyan,
        glow: glowStyle(NEON.cyan, 1.8),
        flash: true,
      };
    case TILE.TELEPORTER:
      return {
        char: "◈",
        color: NEON.cyan,
        glow: glowStyle(NEON.cyan),
        flash: false,
      };
    case TILE.WEAPON:
      return {
        char: "/",
        color: NEON.yellow,
        glow: glowStyle(NEON.yellow),
        flash: false,
      };
    case TILE.KEY:
      return {
        char: "♦",
        color: NEON.yellow,
        glow: glowStyle(NEON.yellow),
        flash: false,
      };
    case TILE.POTION:
      return {
        char: "!",
        color: NEON.cyan,
        glow: glowStyle(NEON.cyan),
        flash: false,
      };
    case TILE.SCROLL:
      return {
        char: "?",
        color: NEON.magenta,
        glow: glowStyle(NEON.magenta),
        flash: false,
      };
    case TILE.VENDOR:
      return {
        char: "&",
        color: NEON.purple,
        glow: glowStyle(NEON.purple),
        flash: false,
      };
    case TILE.GOLD:
      return {
        char: "$",
        color: NEON.yellow,
        glow: glowStyle(NEON.yellow),
        flash: false,
      };
    case TILE.BOW:
      return {
        char: ")",
        color: NEON.orange,
        glow: glowStyle(NEON.orange),
        flash: false,
      };
    case TILE.PRINCESS:
      return {
        char: "♀",
        color: NEON.hotPink,
        glow: glowStyle(NEON.hotPink),
        flash: true,
      };
    case TILE.GEM:
      return {
        char: "◆",
        color: gemColor,
        glow: glowStyle(gemColor),
        flash: true,
      };
    case TILE.ARMOR:
      return {
        char: "⛨",
        color: "#9fb7c9",
        glow: glowStyle("#9fb7c9"),
        flash: false,
      };
    case TILE.VAULT_STAIRS:
      return {
        char: "▼",
        color: "#FFD700",
        glow: glowStyle("#FFD700", 1.8),
        flash: true,
      };
    case TILE.FIRE:
      return {
        char: "^",
        color: NEON.orange,
        glow: glowStyle(NEON.orange, 1.5),
        flash: true,
      };
    case TILE.POISON:
      return {
        char: "~",
        color: NEON.green,
        glow: glowStyle(NEON.green, 1.3),
        flash: false,
      };
    case TILE.ICE:
      return {
        char: "*",
        color: NEON.blue,
        glow: glowStyle(NEON.blue, 1.3),
        flash: false,
      };
    case TILE.VOID_FLUX:
      return {
        char: "%",
        color: NEON.magenta,
        glow: glowStyle(NEON.magenta, 1.5),
        flash: true,
      };
    case TILE.BARREL:
      return {
        char: "Ø",
        color: NEON.orange,
        glow: glowStyle(NEON.orange, 1.6),
        flash: true,
      };
    case TILE.BLOOD_ALTAR:
      return {
        char: "Ω",
        color: NEON.red,
        glow: glowStyle(NEON.red, 1.8),
        flash: true,
      };
    case TILE.OVERLOAD_KEY:
      return {
        char: "⚡",
        color: NEON.yellow,
        glow: glowStyle(NEON.yellow, 1.8),
        flash: true,
      };
    default:
      return { char: " ", color: "#000", glow: "none", flash: false };
  }
};

// ============================================
// PLASMA BACKGROUND — bruit animé biome-aware
// Canvas basse résolution (80×34) étiré via CSS, ~30 fps.
// Couleurs issues de floorColor / corridorColor du biome actuel,
// assombries à ~12 % de luminosité pour ne jamais masquer les tiles.
// Cross-fade doux (~4 s) lors des transitions de biome.
// ============================================
export const PlasmaBackground = React.memo(({ biome }) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  // État partagé avec la boucle RAF (pas besoin de setState)
  const stateRef = useRef({
    t: 0,
    from: null,
    to: null,
    fadeProgress: 1,
  });

  const prevBiomeNameRef = useRef(null);

  // Convertit un hex "#rrggbb" en [r, g, b]
  const parseHex = (hex) => {
    const h = hex.replace("#", "");
    return [
      parseInt(h.substr(0, 2), 16),
      parseInt(h.substr(2, 2), 16),
      parseInt(h.substr(4, 2), 16),
    ];
  };

  // Assombrit à ~12 % de luminosité
  const getDark = (hex) => {
    const [r, g, b] = parseHex(hex);
    return [Math.round(r * 0.12), Math.round(g * 0.12), Math.round(b * 0.12)];
  };

  // Mise à jour des couleurs cibles sans relancer la boucle RAF
  useEffect(() => {
    const state = stateRef.current;
    const c1 = getDark(biome.plasmaColor1 || biome.floorColor);
    const c2 = getDark(biome.plasmaColor2 || biome.corridorColor);
    const next = { c1, c2 };

    if (
      prevBiomeNameRef.current === null ||
      prevBiomeNameRef.current === biome.name
    ) {
      // Premier rendu ou même biome : pas de transition
      state.from = next;
      state.to = next;
      state.fadeProgress = 1;
    } else {
      // Nouveau biome : cross-fade depuis l'état courant
      const fp = state.fadeProgress;
      const lerp = (a, b, t) => a + (b - a) * t;
      const cur1 =
        state.from && state.to
          ? state.from.c1.map((v, i) => lerp(v, state.to.c1[i], fp))
          : c1;
      const cur2 =
        state.from && state.to
          ? state.from.c2.map((v, i) => lerp(v, state.to.c2[i], fp))
          : c2;
      state.from = { c1: cur1, c2: cur2 };
      state.to = next;
      state.fadeProgress = 0;
    }
    prevBiomeNameRef.current = biome.name;
  }, [biome]); // eslint-disable-line react-hooks/exhaustive-deps

  // Boucle d'animation — montée/démontage seulement
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const W = 80,
      H = 34; // résolution interne basse (étiré via CSS)
    canvas.width = W;
    canvas.height = H;

    let lastTime = 0;

    const draw = (timestamp) => {
      animRef.current = requestAnimationFrame(draw);

      // Throttle ~30 fps (33 ms)
      if (timestamp - lastTime < 33) return;
      lastTime = timestamp;

      const state = stateRef.current;
      state.t += 0.015;

      // Avance du cross-fade (~125 frames ≈ 4 s à 30 fps)
      if (state.fadeProgress < 1) {
        state.fadeProgress = Math.min(1, state.fadeProgress + 0.008);
      }

      if (!state.to) return;

      const from = state.from || state.to;
      const to = state.to;
      const fp = state.fadeProgress;
      const lerp = (a, b, t) => a + (b - a) * t;

      const c1 = from.c1.map((v, i) => lerp(v, to.c1[i], fp));
      const c2 = from.c2.map((v, i) => lerp(v, to.c2[i], fp));

      const imageData = ctx.createImageData(W, H);
      const data = imageData.data;
      const t = state.t;

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const nx = x / W;
          const ny = y / H;

          // Plasma : 4 sinus avec fréquences et vitesses distinctes
          const v =
            (Math.sin(nx * 6.2 + t * 0.7) +
              Math.sin(ny * 4.1 + t * 0.53) +
              Math.sin((nx + ny) * 5.3 + t * 0.91) +
              Math.sin(
                Math.sqrt((nx - 0.5) * (nx - 0.5) + (ny - 0.5) * (ny - 0.5)) *
                  8.7 +
                  t * 0.62
              )) /
            4; // normalise dans [-1, 1]

          const blend = (v + 1) / 2; // [0, 1]

          const idx = (y * W + x) * 4;
          data[idx] = Math.round(c1[0] * (1 - blend) + c2[0] * blend);
          data[idx + 1] = Math.round(c1[1] * (1 - blend) + c2[1] * blend);
          data[idx + 2] = Math.round(c1[2] * (1 - blend) + c2[2] * blend);
          data[idx + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        imageRendering: "pixelated",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
});

// ============================================
// OPTIMISATION : Composant cellule mémoïsé
// Chaque cellule ne se re-rend que si ses props changent réellement
// ============================================
export const GridCell = React.memo(
  ({ cellData }) => {
    const { char, color, bg, glow, animation } = cellData;
    return (
      <span
        style={{
          color,
          backgroundColor: bg || undefined,
          textShadow: glow,
          textAlign: "center",
          display: animation ? "inline-block" : undefined,
          animation: animation || "none",
        }}
      >
        {char}
      </span>
    );
  },
  (prev, next) => {
    const a = prev.cellData,
      b = next.cellData;
    return (
      a.char === b.char &&
      a.color === b.color &&
      a.bg === b.bg &&
      a.glow === b.glow &&
      a.animation === b.animation
    );
  }
);

// OPTIMISATION : Ligne de grille mémoïsée
// Chaque ligne ne se re-rend que si au moins une cellule change
export const GridRow = React.memo(
  ({ rowData }) => (
    <div style={gridRowStyle}>
      {rowData.map((cellData, x) => (
        <GridCell key={x} cellData={cellData} />
      ))}
    </div>
  ),
  (prev, next) => {
    const a = prev.rowData,
      b = next.rowData;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (
        a[i].char !== b[i].char ||
        a[i].color !== b[i].color ||
        a[i].glow !== b[i].glow ||
        a[i].animation !== b[i].animation
      )
        return false;
    }
    return true;
  }
);

// Styles de ligne de grille (constante, jamais recréé)
export const gridRowStyle = {
  display: "grid",
  gridTemplateColumns: `repeat(${GRID_WIDTH}, 1fr)`,
};

// ======== QUICK WIN #10 : useLatest helper (élimine ~15 useEffect de sync ref) ========
export function useLatest(value) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
