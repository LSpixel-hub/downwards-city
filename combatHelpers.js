// ============================================
// DOWNWARDS - OVERDRIVE ROGUE
// Combat Helper Functions (Pure Logic)
// Extracted from down_over.jsx Phase 0
// ============================================

import { getRand } from "./prng";
import { TILE, GRID_WIDTH, GRID_HEIGHT, isWalkable, isTerrainTile, getTerrainDamage, getZone } from "./down_over_helpers";

// Calculates dodge/parry effects on monsters
export const applyDefensiveEffects = (monster, rawDmg) => {
  if (
    monster.effect?.type === "DODGE" &&
    getRand() < monster.effect.chance
  ) {
    return {
      finalDmg: 0,
      dodged: true,
      effectMsg: `◇ ${monster.effect.msg} ◇`,
    };
  }
  if (
    monster.effect?.type === "PARRY" &&
    getRand() < monster.effect.chance
  ) {
    return {
      finalDmg: Math.max(1, Math.floor(rawDmg / 2)),
      dodged: false,
      effectMsg: `▣ ${monster.effect.msg} ▣`,
    };
  }
  return { finalDmg: rawDmg, dodged: false, effectMsg: null };
};

// Applies terrain damage/death to monsters
export const applyTerrainToMonster = (monster, currentMap) => {
  if (!monster || monster.currentHp <= 0 || monster.x < 1 || monster.y < 1) {
    return { monster, damage: 0, killed: false, tile: null };
  }
  const tile = currentMap[monster.y]?.[monster.x];
  if (!isTerrainTile(tile)) {
    return { monster, damage: 0, killed: false, tile: null };
  }

  const dmg = getTerrainDamage(tile);
  if (dmg <= 0) {
    return { monster, damage: 0, killed: false, tile };
  }

  const nextHp = monster.currentHp - dmg;
  if (nextHp <= 0) {
    return {
      monster: { ...monster, currentHp: 0, x: -1, y: -1 },
      damage: dmg,
      killed: true,
      tile,
    };
  }

  return {
    monster: { ...monster, currentHp: nextHp },
    damage: dmg,
    killed: false,
    tile,
  };
};

// Spawns minions when parent monster is hit
export const handleSpawnEffect = (monster, allMonsters, currentMap) => {
  if (!monster.effect || monster.effect.type !== "SPAWN") return allMonsters;
  if (getRand() >= monster.effect.chance) return allMonsters;
  const dirs = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ].sort(() => getRand() - 0.5);
  for (const [sdx, sdy] of dirs) {
    const sx = monster.x + sdx,
      sy = monster.y + sdy;
    if (sx < 1 || sx > GRID_WIDTH || sy < 1 || sy > GRID_HEIGHT) continue;
    if (!isWalkable(currentMap[sy]?.[sx])) continue;
    if (allMonsters.some((m) => m.currentHp > 0 && m.x === sx && m.y === sy))
      continue;
    return [
      ...allMonsters,
      {
        ...monster,
        x: sx,
        y: sy,
        hp: Math.max(1, Math.floor(monster.hp * 0.5)),
        currentHp: Math.max(1, Math.floor(monster.hp * 0.5)),
        dmg: Math.max(1, Math.floor(monster.dmg * 0.5)),
        zone: getZone(sx, sy),
        effect: null,
      },
    ];
  }
  return allMonsters;
};
