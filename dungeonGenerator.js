// ============================================
// DOWNWARDS - OVERDRIVE ROGUE
// Dungeon Level Generator
// Extracted from down_over.jsx Phase 0
// ============================================

import { getRand } from "./prng";
import { VENDOR_SCROLLS, GEMS } from "./data";
import { TILE, GRID_WIDTH, GRID_HEIGHT, getZone, getRandomTerrainTile } from "./down_over_helpers";
import { getVaultStairsChance } from "./vaultgenerator";
import {
  getWeaponForLevel,
  getArmorForLevel,
  getBowForLevel,
  getVendorTier,
  getMonsterForLevel,
} from "./itemgeneration";

export const generateLevel = (
  lvl,
  currentUnlockedGems,
  badgeCount = 0,
  overloadKeyBoost = false,
  shouldSpawnBlueAccess = false
) => {
  const newMap = Array(GRID_HEIGHT + 1)
    .fill(null)
    .map(() => Array(GRID_WIDTH + 1).fill(TILE.VOID));
  const rooms = [];
  const numRooms = 8 + Math.floor(getRand() * 5);

  for (let r = 0; r < numRooms; r++) {
    const roomW = 3 + Math.floor(getRand() * 4);
    const roomH = 3 + Math.floor(getRand() * 3);
    const roomX = 2 + Math.floor(getRand() * (GRID_WIDTH - roomW - 3));
    const roomY = 2 + Math.floor(getRand() * (GRID_HEIGHT - roomH - 3));

    for (let y = roomY; y < roomY + roomH; y++) {
      for (let x = roomX; x < roomX + roomW; x++) {
        if (y > 0 && y <= GRID_HEIGHT && x > 0 && x <= GRID_WIDTH) {
          newMap[y][x] = TILE.FLOOR;
        }
      }
    }
    rooms.push({
      x: roomX,
      y: roomY,
      w: roomW,
      h: roomH,
      cx: Math.floor(roomX + roomW / 2),
      cy: Math.floor(roomY + roomH / 2),
    });
  }

  for (let i = 1; i < rooms.length; i++) {
    const prev = rooms[i - 1];
    const curr = rooms[i];
    let cx = curr.cx,
      cy = curr.cy;
    while (cx !== prev.cx) {
      cx += cx < prev.cx ? 1 : -1;
      if (
        cy > 0 &&
        cy <= GRID_HEIGHT &&
        cx > 0 &&
        cx <= GRID_WIDTH &&
        newMap[cy][cx] === TILE.VOID
      )
        newMap[cy][cx] = TILE.CORRIDOR;
    }
    while (cy !== prev.cy) {
      cy += cy < prev.cy ? 1 : -1;
      if (
        cy > 0 &&
        cy <= GRID_HEIGHT &&
        cx > 0 &&
        cx <= GRID_WIDTH &&
        newMap[cy][cx] === TILE.VOID
      )
        newMap[cy][cx] = TILE.CORRIDOR;
    }
  }

  // Pre-collect free tiles
  const freeTiles = [];
  for (let fy = 1; fy <= GRID_HEIGHT; fy++) {
    for (let fx = 1; fx <= GRID_WIDTH; fx++) {
      if (
        newMap[fy][fx] === TILE.FLOOR ||
        newMap[fy][fx] === TILE.CORRIDOR
      ) {
        freeTiles.push({ x: fx, y: fy });
      }
    }
  }

  const getValidTile = (excludePos = []) => {
    const excludeSet = new Set(excludePos.map((p) => `${p.x},${p.y}`));
    const available = freeTiles.filter(
      (t) => !excludeSet.has(`${t.x},${t.y}`)
    );
    if (available.length === 0) return { x: rooms[0].cx, y: rooms[0].cy };
    return available[Math.floor(getRand() * available.length)];
  };

  const playerPos = {
    x: rooms[0].x + Math.floor(getRand() * rooms[0].w),
    y: rooms[0].y + Math.floor(getRand() * rooms[0].h),
  };
  const allPlaced = [playerPos];

  const stairsPosition = getValidTile(allPlaced);
  allPlaced.push(stairsPosition);
  const baseVaultChance = getVaultStairsChance(lvl);
  const overloadBonus = overloadKeyBoost ? 0.4 : 0;
  const boostedVaultChance = Math.min(
    0.95,
    baseVaultChance + badgeCount * 0.04 + overloadBonus
  );
  const isVaultStairs = lvl < 50 && getRand() < boostedVaultChance;
  newMap[stairsPosition.y][stairsPosition.x] =
    lvl === 50
      ? TILE.PRINCESS
      : isVaultStairs
      ? TILE.VAULT_STAIRS
      : TILE.STAIRS;

  let blueStairsPos = null;
  if (shouldSpawnBlueAccess && lvl < 50) {
    blueStairsPos = getValidTile(allPlaced);
    allPlaced.push(blueStairsPos);
    newMap[blueStairsPos.y][blueStairsPos.x] = TILE.BLUE_STAIRS;
  }

  const tp1 = getValidTile(allPlaced);
  allPlaced.push(tp1);
  newMap[tp1.y][tp1.x] = TILE.TELEPORTER;
  let tp2,
    attempts = 0;
  do {
    tp2 = getValidTile(allPlaced);
    attempts++;
  } while (
    getZone(tp2.x, tp2.y) === getZone(tp1.x, tp1.y) &&
    attempts < 50
  );
  allPlaced.push(tp2);
  newMap[tp2.y][tp2.x] = TILE.TELEPORTER;

  const needKey = getRand() < 0.25;
  if (needKey) {
    const keyPos = getValidTile(allPlaced);
    allPlaced.push(keyPos);
    newMap[keyPos.y][keyPos.x] = TILE.KEY;
  }

  if (getRand() < 0.3) {
    const potionPos = getValidTile(allPlaced);
    allPlaced.push(potionPos);
    newMap[potionPos.y][potionPos.x] = TILE.POTION;
  }
  if (getRand() < 0.15) {
    const scrollPos = getValidTile(allPlaced);
    allPlaced.push(scrollPos);
    newMap[scrollPos.y][scrollPos.x] = TILE.SCROLL;
  }

  let vendorData = null;
  if (getRand() < 0.25) {
    const vendorPos = getValidTile(allPlaced);
    allPlaced.push(vendorPos);
    newMap[vendorPos.y][vendorPos.x] = TILE.VENDOR;
    const tier = VENDOR_SCROLLS[getVendorTier(lvl)];
    vendorData = { ...tier[Math.floor(getRand() * tier.length)] };
  }

  let weaponData = null;
  if (lvl === 1 || (lvl >= 2 && getRand() < 0.2)) {
    const weaponPos = getValidTile(allPlaced);
    allPlaced.push(weaponPos);
    newMap[weaponPos.y][weaponPos.x] = TILE.WEAPON;
    weaponData = getWeaponForLevel(lvl);
  }

  let armorData = null;
  if (getRand() < 0.2) {
    const armorPos = getValidTile(allPlaced);
    allPlaced.push(armorPos);
    newMap[armorPos.y][armorPos.x] = TILE.ARMOR;
    armorData = getArmorForLevel(lvl);
  }

  const goldCount =
    getRand() < 0.5 ? 1 + Math.floor(getRand() * 4) : 0;
  for (let g = 0; g < goldCount; g++) {
    const goldPos = getValidTile(allPlaced);
    allPlaced.push(goldPos);
    newMap[goldPos.y][goldPos.x] = TILE.GOLD;
  }

  let bowData = null;
  if (getRand() < 0.15) {
    const bowPos = getValidTile(allPlaced);
    allPlaced.push(bowPos);
    newMap[bowPos.y][bowPos.x] = TILE.BOW;
    bowData = getBowForLevel(lvl);
  }

  let gemData = null;
  if (lvl >= 3 && lvl % 3 === 0) {
    const available = currentUnlockedGems
      .map((level, idx) => (level < 3 ? idx : -1))
      .filter((idx) => idx >= 0);
    if (available.length > 0) {
      const gemIdx =
        available[Math.floor(getRand() * available.length)];
      const gemPos = getValidTile(allPlaced);
      allPlaced.push(gemPos);
      newMap[gemPos.y][gemPos.x] = TILE.GEM;
      gemData = { ...GEMS[gemIdx], idx: gemIdx };
    }
  }

  let monsterCount =
    lvl === 1
      ? 1 + Math.floor(getRand() * 2)
      : lvl <= 15
      ? 1 + Math.floor(getRand() * 4)
      : lvl <= 30
      ? 2 + Math.floor(getRand() * 5)
      : 3 + Math.floor(getRand() * 6);

  const newMonsters = [];
  for (let m = 0; m < monsterCount; m++) {
    const monsterStats = getMonsterForLevel(lvl);
    const pos = getValidTile(allPlaced);
    allPlaced.push(pos);
    newMonsters.push({
      ...monsterStats,
      x: pos.x,
      y: pos.y,
      currentHp: monsterStats.hp,
      zone: getZone(pos.x, pos.y),
    });
  }

  if (lvl > 1) {
    const terrainCount = lvl <= 10 ? 2 : lvl <= 25 ? 3 : 4;
    for (let t = 0; t < terrainCount; t++) {
      const terrainPos = getValidTile(allPlaced);
      allPlaced.push(terrainPos);
      newMap[terrainPos.y][terrainPos.x] = getRandomTerrainTile(lvl);
    }
  }

  // Barrels: appear from level 5+, 1-2 per floor
  if (lvl >= 5) {
    const barrelCount = 1 + (getRand() < 0.4 ? 1 : 0);
    for (let b = 0; b < barrelCount; b++) {
      const barrelPos = getValidTile(allPlaced);
      allPlaced.push(barrelPos);
      newMap[barrelPos.y][barrelPos.x] = TILE.BARREL;
    }
  }

  // Blood Altar: rare, from level 10+, 15% chance
  if (lvl >= 10 && getRand() < 0.15) {
    const altarPos = getValidTile(allPlaced);
    allPlaced.push(altarPos);
    newMap[altarPos.y][altarPos.x] = TILE.BLOOD_ALTAR;
  }

  // Overload Key: rare, from level 15+, 10% chance
  if (lvl >= 15 && getRand() < 0.1) {
    const okPos = getValidTile(allPlaced);
    allPlaced.push(okPos);
    newMap[okPos.y][okPos.x] = TILE.OVERLOAD_KEY;
  }

  // Count total reachable zones on this floor
  const reachableZones = new Set();
  for (let zy = 1; zy <= GRID_HEIGHT; zy++) {
    for (let zx = 1; zx <= GRID_WIDTH; zx++) {
      if (newMap[zy]?.[zx] && newMap[zy][zx] !== TILE.VOID) {
        reachableZones.add(getZone(zx, zy));
      }
    }
  }

  return {
    map: newMap,
    playerPos,
    stairsPos: stairsPosition,
    tp1: { ...tp1, active: false },
    tp2: { ...tp2, active: false },
    monsters: newMonsters,
    needKey,
    vendorData,
    weaponData,
    armorData,
    bowData,
    gemData,
    totalZones: reachableZones.size,
    blueStairsPos,
  };
};
