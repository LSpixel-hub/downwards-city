// ============================================
// DOWNWARDS - OVERDRIVE ROGUE
// Challenge & Badge System
// ============================================

export const getDirectKills = (stats) =>
  Math.max(0, (stats.kills || 0) - (stats.terrainKills || 0));

export const makeFloorObjective = (
  level,
  isVaultFloor,
  totalMonsters = 0,
  totalZones = 0
) => {
  if (isVaultFloor || level <= 1 || level >= 50) return null;

  // Challenges appear only on some floors.
  if (Math.random() > 0.35) return null;

  const speedTarget =
    level <= 10 ? 20 : level <= 25 ? 17 : level <= 40 ? 15 : 13;
  const terrainKillTarget = level <= 20 ? 2 : 3;

 const objectives = [
    { type: "NO_DAMAGE", label: "GHOST IN THE MACHINE (0 DMG)", badge: "GHOST" },
    {
      type: "GENOCIDE",
      label: "FORMAT C: (KILL ALL)",
      badge: "FORMAT C:",
      targetKills: totalMonsters,
    },
    {
      type: "PACIFIST",
      label: "STEALTH BYPASS (0 DIRECT KILLS)",
      mobileLabel: "STEALTH (0 KILLS)",
      badge: "STEALTH",
    },
    {
      type: "NO_TRAPS",
      label: "CLEAN ROUTING (NO HAZARD STEP)",
      mobileLabel: "CLEAN ROUTING",
      badge: "CLEAN ROUTING",
    },
    { type: "POVERTY", label: "FREEWARE (NO GOLD)", badge: "FREEWARE" },
    { type: "NO_SWITCH", label: "HARDCODED (NO CLASS SWAP)", badge: "HARDCODED" },
    { type: "NO_PRAY", label: "NO BACKUPS (NO RESTORE)", badge: "NO BACKUPS" },
    { type: "NO_DASH", label: "SAFE MODE (NO DASH)", badge: "SAFE MODE" },
    { type: "NO_TELEPORT", label: "LOCAL BUS (NO WARP)", badge: "LOCAL BUS" },
    {
      type: "ENVIRONMENTALIST",
      label: `SYSTEM CRASHER (${terrainKillTarget}+ TERRAIN KILLS)`,
      mobileLabel: `CRASHER (${terrainKillTarget}+ TERR.)`,
      badge: "SYSTEM CRASHER",
      targetTerrainKills: terrainKillTarget,
    },
    {
      type: "SPEED",
      label: `OVERCLOCKED (<= ${speedTarget} TURNS)`,
      badge: "OVERCLOCKED",
      targetTurns: speedTarget,
    },
    {
      type: "MASTER_SCOUT",
      label: `PORT SCANNER (ALL ${totalZones} ZONES)`,
      mobileLabel: `SCANNER (${totalZones} ZONES)`,
      badge: "PORT SCANNER",
      targetZones: totalZones,
    },
  ].filter((obj) => {
    if (obj.type === "GENOCIDE") return totalMonsters > 0;
    if (obj.type === "MASTER_SCOUT") return totalZones > 0;
    return true;
  });

  return objectives[Math.floor(Math.random() * objectives.length)];
};

export const isObjectiveFailedNow = (objective, stats) => {
  if (!objective) return false;

  const directKills = getDirectKills(stats);

  if (objective.type === "NO_DAMAGE") return stats.damageTaken > 0;
  if (objective.type === "PACIFIST") return directKills > 0;
  if (objective.type === "NO_TRAPS") return stats.trapsStepped;
  if (objective.type === "POVERTY") return stats.goldCollected > 0;
  if (objective.type === "NO_DASH") return stats.dashed;
  if (objective.type === "NO_SWITCH") return stats.classSwitched;
  if (objective.type === "NO_PRAY") return stats.prayed;
  if (objective.type === "NO_TELEPORT") return stats.teleported;
  if (objective.type === "SPEED")
    return stats.turns > (objective.targetTurns || 0);

  return false;
};

export const isObjectiveSuccessNow = (objective, stats) => {
  if (!objective) return false;

  const directKills = getDirectKills(stats);

  if (objective.type === "NO_DAMAGE") return stats.damageTaken === 0;
  if (objective.type === "GENOCIDE")
    return stats.kills >= (objective.targetKills || 0);
  if (objective.type === "PACIFIST") return directKills === 0;
  if (objective.type === "NO_TRAPS") return !stats.trapsStepped;
  if (objective.type === "POVERTY") return stats.goldCollected === 0;
  if (objective.type === "NO_DASH") return !stats.dashed;
  if (objective.type === "NO_SWITCH") return !stats.classSwitched;
  if (objective.type === "NO_PRAY") return !stats.prayed;
  if (objective.type === "NO_TELEPORT") return !stats.teleported;
  if (objective.type === "ENVIRONMENTALIST") {
    return stats.terrainKills >= (objective.targetTerrainKills || 0);
  }
  if (objective.type === "SPEED")
    return stats.turns <= (objective.targetTurns || 0);
  if (objective.type === "MASTER_SCOUT") {
    // zonesDiscovered tracks only newly discovered zones; include starting zone.
    return (stats.zonesDiscovered || 0) + 1 >= (objective.targetZones || 0);
  }

  return false;
};

export const getObjectiveProgressText = (objective, stats) => {
  if (!objective) return "";

  const directKills = getDirectKills(stats);

  if (objective.type === "NO_DAMAGE") {
    return `DMG ${stats.damageTaken > 0 ? "FAILED" : "CLEAR"}`;
  }
  if (objective.type === "GENOCIDE") {
    return `KILLS ${stats.kills}/${objective.targetKills}`;
  }
  if (objective.type === "PACIFIST") {
    return `DIRECT KILLS ${directKills}/0`;
  }
  if (objective.type === "NO_TRAPS") {
    return `TRAPS ${stats.trapsStepped ? "FAILED" : "CLEAR"}`;
  }
  if (objective.type === "POVERTY") {
    return `GOLD ${stats.goldCollected > 0 ? "FAILED" : "0"}`;
  }
  if (objective.type === "NO_DASH")
    return `DASH ${stats.dashed ? "FAILED" : "CLEAR"}`;
  if (objective.type === "NO_SWITCH") {
    return `SWAP ${stats.classSwitched ? "FAILED" : "CLEAR"}`;
  }
  if (objective.type === "NO_PRAY")
    return `RESTORE ${stats.prayed ? "FAILED" : "CLEAR"}`;
  if (objective.type === "NO_TELEPORT") {
    return `WARP ${stats.teleported ? "FAILED" : "CLEAR"}`;
  }
  if (objective.type === "ENVIRONMENTALIST") {
    return `TERRAIN ${stats.terrainKills}/${objective.targetTerrainKills}`;
  }
  if (objective.type === "SPEED")
    return `TURNS ${stats.turns}/${objective.targetTurns}`;
  if (objective.type === "MASTER_SCOUT") {
    return `ZONES ${(stats.zonesDiscovered || 0) + 1}/${objective.targetZones}`;
  }

  return "";
};
