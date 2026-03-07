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
  if (isVaultFloor || level >= 50) return null;

  // Challenges appear only on some floors.
  if (Math.random() > 0.35) return null;

  const speedTarget =
    level <= 10 ? 20 : level <= 25 ? 17 : level <= 40 ? 15 : 13;
  const terrainKillTarget = level <= 20 ? 2 : 3;

  const objectives = [
    { type: "NO_DAMAGE", label: "UNTOUCHABLE (0 DMG)", badge: "UNTOUCHABLE" },
    {
      type: "GENOCIDE",
      label: "EXTERMINATOR (KILL ALL)",
      badge: "EXTERMINATOR",
      targetKills: totalMonsters,
    },
    {
      type: "PACIFIST",
      label: "PACIFIST (0 DIRECT KILLS)",
      mobileLabel: "PACIFIST (0 KILLS)",
      badge: "PACIFIST",
    },
    {
      type: "NO_TRAPS",
      label: "HAZARD DANCER (NO HAZARD STEP)",
      mobileLabel: "HAZARD DANCER",
      badge: "HAZARD DANCER",
    },
    { type: "POVERTY", label: "ASCETIC (NO GOLD)", badge: "ASCETIC" },
    { type: "NO_SWITCH", label: "PURIST (NO CLASS SWAP)", badge: "PURIST" },
    { type: "NO_PRAY", label: "ATHEIST (NO PRAY)", badge: "ATHEIST" },
    { type: "NO_DASH", label: "GROUNDED (NO DASH)", badge: "GROUNDED" },
    { type: "NO_TELEPORT", label: "NO WARP (NO TELEPORT)", badge: "NO WARP" },
    {
      type: "ENVIRONMENTALIST",
      label: `ENVIRONMENTALIST (${terrainKillTarget}+ TERRAIN KILLS)`,
      mobileLabel: `ENVIRO. (${terrainKillTarget}+ TERR.)`,
      badge: "ENVIRONMENTALIST",
      targetTerrainKills: terrainKillTarget,
    },
    {
      type: "SPEED",
      label: `SPEEDRUN (<= ${speedTarget} TURNS)`,
      badge: "SPEEDRUN",
      targetTurns: speedTarget,
    },
    {
      type: "MASTER_SCOUT",
      label: `MASTER SCOUT (ALL ${totalZones} ZONES)`,
      mobileLabel: `SCOUT (${totalZones} ZONES)`,
      badge: "MASTER SCOUT",
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
    return `PRAY ${stats.prayed ? "FAILED" : "CLEAR"}`;
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
