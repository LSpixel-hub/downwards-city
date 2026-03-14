// ============================================
// DOWNWARDS - OVERDRIVE ROGUE
// Item & Monster Generation
// ============================================

import { NEON, BOWS, ARMORS, WEAPONS, MONSTERS } from "./data";
import { getRand } from "./prng";

// ── Weapon / Armor / Bow color helpers ──────────────────────────

export const getWeaponColor = (dmg) => {
  if (dmg <= 16) return NEON.gray;
  if (dmg <= 29) return NEON.blue;
  if (dmg <= 40) return NEON.green;
  return NEON.yellow;
};

export const getArmorColor = (ar) => {
  if (ar <= 8) return NEON.gray;
  if (ar <= 22) return NEON.blue;
  if (ar <= 38) return NEON.green;
  return NEON.yellow;
};

export const getBowColor = (bonus) => {
  if (bonus <= 1) return NEON.gray;
  if (bonus <= 3) return NEON.green;
  if (bonus <= 6) return NEON.blue;
  if (bonus <= 8) return NEON.purple;
  return NEON.yellow;
};

// ── Generation constants ────────────────────────────────────────

export const PERFECT_WEAPON_CHANCE = 0.1;
export const PERFECT_WEAPON_MULTIPLIER = 1.25;

const PERFECT_ARMOR_CHANCE = 0.1;
const PERFECT_ARMOR_BONUS = 2;
const ARMOR_VALUE_MULTIPLIER = 0.72;

// ── Bow generation ──────────────────────────────────────────────

export const getBowForLevel = (level) => {
  const pool = BOWS.filter((b) => level >= b.minLevel && level <= b.maxLevel);
  if (pool.length === 0) return null;
  const tier = pool[Math.floor(getRand() * pool.length)];
  const name = tier.names[Math.floor(getRand() * tier.names.length)];
  const bonus = tier.minBonus + Math.floor(getRand() * (tier.maxBonus - tier.minBonus + 1));
  return { name, bonus };
};

// ── Armor generation ────────────────────────────────────────────

export const getArmorForLevel = (level) => {
  // Filter archetypes that match the current level range
  const pool = ARMORS.filter((a) => level >= a.minLevel && level <= a.maxLevel);
  if (pool.length === 0) return null;

  // Pick a random archetype from the pool
  const archetype = pool[Math.floor(getRand() * pool.length)];

  // Pick a random name from the 3 variants
  const baseName =
    archetype.names[Math.floor(getRand() * archetype.names.length)];

  // Apply +/- 20% variance to baseAR
  const variance = 0.8 + getRand() * 0.4; // 0.8 to 1.2
  let finalAR = Math.max(
    1,
    Math.round(archetype.baseAR * variance * ARMOR_VALUE_MULTIPLIER)
  );

  // 10% chance of Perfect
  const isPerfect = getRand() < PERFECT_ARMOR_CHANCE;
  if (isPerfect) {
    finalAR += PERFECT_ARMOR_BONUS;
  }
  const displayName = isPerfect ? `Perfect ${baseName}` : baseName;

  return {
    name: displayName,
    ar: finalAR,
    isPerfect,
  };
};

// ── Vendor tier ─────────────────────────────────────────────────

export const getVendorTier = (level) => {
  if (level <= 5) return "A";
  if (level <= 10) return "B";
  if (level <= 20) return "C";
  if (level <= 30) return "D";
  return "E";
};

// ── Monster generation ──────────────────────────────────────────

export const getMonsterMissChance = (level) => {
  if (level >= 40) return 0;
  const clamped = Math.max(1, level);
  // Progression linéaire : 50% au niveau 1 -> 0% au niveau 40
  return Math.max(0, 0.5 * ((40 - clamped) / 39));
};

export const getMonsterForLevel = (level) => {
  let tierStart = 0;
  if (level <= 5) tierStart = 0;
  else if (level <= 10) tierStart = 2;
  else if (level <= 15) tierStart = 3;
  else if (level <= 20) tierStart = 5;
  else if (level <= 25) tierStart = 6;
  else if (level <= 30) tierStart = 8;
  else if (level <= 35) tierStart = 10;
  else if (level <= 40) tierStart = 11;
  else if (level <= 45) tierStart = 13;
  else tierStart = 16;

  const remainingInTier = MONSTERS.length - tierStart;
  const poolSize = tierStart >= MONSTERS.length - 4 ? remainingInTier : 3;
  const idx =
    tierStart + Math.floor(getRand() * Math.max(1, poolSize));
  const m = MONSTERS[idx];
  const name = m.names[Math.floor(getRand() * m.names.length)];
  const finalHp = Math.max(1, Math.round(m.hp * (0.8 + getRand() * 0.4)));
  const finalDmg = Math.max(1, Math.round(m.dmg * (0.9 + getRand() * 0.2)));

  return {
    char: m.char,
    name,
    hp: finalHp,
    dmg: finalDmg,
    color: m.colors[Math.floor(getRand() * m.colors.length)],
    effect: m.effect || null,
  };
};

// ── Weapon generation ───────────────────────────────────────────

export const getWeaponForLevel = (level) => {
  let tier = 1;
  if (level <= 1) tier = 1;
  else if (level <= 5) tier = 2;
  else if (level <= 10) tier = 3;
  else if (level <= 15) tier = 4;
  else if (level <= 20) tier = 5;
  else if (level <= 30) tier = 6;
  else if (level <= 40) tier = 7;
  else tier = 8;

  const pool = WEAPONS[tier];

  const roll = getRand() * 100;
  let cumulativeChance = 0;
  let selectedWeaponType = pool[0];

  for (const weaponType of pool) {
    cumulativeChance += weaponType.chance;
    if (roll <= cumulativeChance) {
      selectedWeaponType = weaponType;
      break;
    }
  }

  // --- NOUVELLE LOGIQUE ICI ---
  const nameIndex = Math.floor(getRand() * selectedWeaponType.names.length);
  const finalName = selectedWeaponType.names[nameIndex];
  
  const minDmg = selectedWeaponType.dmg[0];
  const maxDmg = selectedWeaponType.dmg[1];
  const baseDmg = minDmg + Math.floor(getRand() * (maxDmg - minDmg + 1));

  const isPerfect = getRand() < PERFECT_WEAPON_CHANCE;
  const perfectBonus = isPerfect
    ? Math.max(1, Math.round(baseDmg * (PERFECT_WEAPON_MULTIPLIER - 1)))
    : 0;
  const finalDmg = baseDmg + perfectBonus;
  const displayName = isPerfect ? `Perfect ${finalName}` : finalName;

  return {
    name: displayName,
    // On associe le bon "short" selon l'index tiré, ou on garde le short simple s'il n'y en a qu'un
    short: Array.isArray(selectedWeaponType.short) ? selectedWeaponType.short[nameIndex] : selectedWeaponType.short,
    baseDmg,
    perfectBonus,
    dmg: finalDmg,
    family: selectedWeaponType.family,
    isPerfect,
  };
};
