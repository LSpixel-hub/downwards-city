import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { flushSync } from "react-dom";
import { generateThemedVault, getVaultStairsChance } from "./vaultgenerator";
import {
  generateOverworld,
  TILE as OW_TILE,
  PALETTE as OW_PALETTE,
  getTileRender as getOverworldTileRender,
} from "./overworldgenerator";
import { NEON, CLASSES, POTIONS, VENDOR_SCROLLS, GEMS } from "./data";
import {
  getDirectKills,
  makeFloorObjective,
  isObjectiveFailedNow,
  isObjectiveSuccessNow,
  getObjectiveProgressText,
} from "./challenges";
import {
  getWeaponColor,
  getArmorColor,
  getBowColor,
  PERFECT_WEAPON_CHANCE,
  PERFECT_WEAPON_MULTIPLIER,
  getBowForLevel,
  getArmorForLevel,
  getVendorTier,
  getMonsterMissChance,
  getMonsterForLevel,
  getWeaponForLevel,
} from "./itemgeneration";
import {
  GRID_WIDTH,
  GRID_HEIGHT,
  PROLOGUE_LINES,
  TILE,
  getZone,
  TERRAIN_TILES,
  isTerrainTile,
  getTerrainDamage,
  getRandomTerrainTile,
  WALKABLE_TILES,
  isWalkable,
  findPath,
  findUnexploredPassages,
  OVERWORLD_BIOME,
  getBiome,
  glowStyle,
  renderTileData,
  PlasmaBackground,
  GridCell,
  GridRow,
  gridRowStyle,
  useLatest,
  CARDINAL_DIRS,
  ALL_DIRS,
  DASH_AUTO_PICKUP,
  DASH_STOP_BEFORE,
  DASH_STOP_AFTER,
} from "./down_over_helpers";
import { getGameStyles } from "./down_over_styles";
import {
  GameOverScreen,
  VictoryScreen,
  ChallengeAnnouncement,
  ConfirmPromptDialog,
} from "./down_over_components";

// Main Component
function DownwardsNeon() {
  const [gameState, setGameState] = useState("title");
  const [level, setLevel] = useState(1);
  const [player, setPlayer] = useState({ x: 1, y: 1 });
  const [hp, setHp] = useState(10);
  const [maxHp, setMaxHp] = useState(10);
  const [gold, setGold] = useState(0);
  const [armorPermanent, setArmorPermanent] = useState(0);
  const [equippedArmorValue, setEquippedArmorValue] = useState(0);
  const [equippedArmorName, setEquippedArmorName] = useState(null);
  const armor = armorPermanent + equippedArmorValue;
  const [dmgBonus, setDmgBonus] = useState(0);
  const [currentClass, setCurrentClass] = useState(1);
  const [unlockedGems, setUnlockedGems] = useState([0, 0, 0, 0, 0]);
  const [hasWeapon, setHasWeapon] = useState(false);
  const [weapon, setWeapon] = useState({
    name: "Fists",
    dmg: 1,
    short: "NONE",
  });
  const [hasBow, setHasBow] = useState(false);
  const [bow, setBow] = useState({ name: "None", bonus: 0 });
  const [hasKey, setHasKey] = useState(false);
  const [keyNeeded, setKeyNeeded] = useState(false);
  const [prayerUsed, setPrayerUsed] = useState(false);
  const [isSecretVault, setIsSecretVault] = useState(false);
  const [activeBiome, setActiveBiome] = useState(null);

  const [map, setMap] = useState([]);
  const [revealedZones, setRevealedZones] = useState(new Set());

  // ======== DEPLACEMENT DES HOOKS POUR ACCES AUX FLECHES EN TEMPS REEL ========
  const unexploredPassages = useMemo(
    () => findUnexploredPassages(revealedZones, map),
    [revealedZones, map]
  );
  const passageArrows = useMemo(() => {
    const arrowMap = new Map();
    unexploredPassages.forEach((p) => {
      const key = `${p.x},${p.y}`;
      if (!arrowMap.has(key)) {
        arrowMap.set(key, p.arrow);
      }
    });
    return arrowMap;
  }, [unexploredPassages]);
  const passageArrowsRef = useLatest(passageArrows);

  const [monsters, setMonsters] = useState([]);
  const [teleporter1, setTeleporter1] = useState({ x: 0, y: 0, active: false });
  const [teleporter2, setTeleporter2] = useState({ x: 0, y: 0, active: false });
  const [stairsPos, setStairsPos] = useState({ x: 0, y: 0 });
  const [vendorScroll, setVendorScroll] = useState(null);
  const [gemOnMap, setGemOnMap] = useState(null);
  const [pendingWeapon, setPendingWeapon] = useState(null);
  const [pendingArmor, setPendingArmor] = useState(null);
  const [pendingBow, setPendingBow] = useState(null);

  const [floorObjective, setFloorObjective] = useState(null);
  const [floorTurns, setFloorTurns] = useState(0);
  const [prayedThisFloor, setPrayedThisFloor] = useState(false);
  const [killsThisFloor, setKillsThisFloor] = useState(0);
  const [terrainKillsThisFloor, setTerrainKillsThisFloor] = useState(0);
  const [dashedThisFloor, setDashedThisFloor] = useState(false);
  const [damageTakenThisFloor, setDamageTakenThisFloor] = useState(0);
  const [teleportedThisFloor, setTeleportedThisFloor] = useState(false);
  const [classSwitchedThisFloor, setClassSwitchedThisFloor] = useState(false);
  const [goldCollectedThisFloor, setGoldCollectedThisFloor] = useState(0);
  const [zonesDiscoveredThisFloor, setZonesDiscoveredThisFloor] = useState(0);
  const [trapsSteppedThisFloor, setTrapsSteppedThisFloor] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState([]);

  // ======== COMBO / OVERDRIVE SYSTEM ========
  const [comboCount, setComboCount] = useState(0);
  const [overdriveTurns, setOverdriveTurns] = useState(0);

  // ======== OVERLOAD KEY SYSTEM ========
  const [hasOverloadKey, setHasOverloadKey] = useState(false);

  // ======== BARREL FIRE TIMERS ========
  // Map of "x,y" → turns remaining for fire tiles left by barrel explosions
  const [fireTimers, setFireTimers] = useState(new Map());

  // ======== OVERWORLD STATE ========
  const [overworldRawMap, setOverworldRawMap] = useState(null); // raw overworld tile IDs for rendering
  const [overworldCoastLine, setOverworldCoastLine] = useState([]);
  const [overworldTick, setOverworldTick] = useState(0);
  const [surfaceDefenseActive, setSurfaceDefenseActive] = useState(false);
  const [surfaceDefenseReadyToReturn, setSurfaceDefenseReadyToReturn] =
    useState(false);
  const [surfaceDefenseSourceLevel, setSurfaceDefenseSourceLevel] =
    useState(null);
  const [surfaceCorruptionStage, setSurfaceCorruptionStage] = useState(0);
  const [floorsWithoutSurfaceDefense, setFloorsWithoutSurfaceDefense] =
    useState(0);

  // ======== A3 : message + color fusionnés en un seul state (1 render au lieu de 2) ========
  const [msg, setMsg] = useState({ text: "", color: NEON.white });
  const [showLevelTransition, setShowLevelTransition] = useState(false);
  const [showDirectionPicker, setShowDirectionPicker] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);
  const [showChallengeOverlay, setShowChallengeOverlay] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

  // Map zoom state (controlled by buttons)
  const [mapZoom, setMapZoom] = useState(1);
  const [isMobilePortrait, setIsMobilePortrait] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(max-width: 800px) and (orientation: portrait)")
      .matches;
  });
  const [isMobileLandscape, setIsMobileLandscape] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(max-height: 600px) and (orientation: landscape)")
      .matches;
  });
  const [mapViewportSize, setMapViewportSize] = useState({
    width: 0,
    height: 0,
  });

  // Fast travel armed mode (mobile FAST button)
  const [fastTravelArmed, setFastTravelArmed] = useState(false);
  const fastTravelArmedRef = useLatest(fastTravelArmed);

  // ======== DESTINATION MODE (auto-pathfinding) ========
  const [destinationMode, setDestinationMode] = useState(false);
  const destinationModeRef = useLatest(destinationMode);
  const autoPathRef = useRef(null); // { path: [...], step: 0, timerId }
  const [destinationTarget, setDestinationTarget] = useState(null); // {x,y}
  const [destinationPath, setDestinationPath] = useState(null); // [{x,y},...]

  // ======== A2 : tileEffects - BATCHED via rAF (1 render/frame max) ========
  const [tileEffects, setTileEffects] = useState(new Map());
  const effectTimersRef = useRef(new Set());
  const pendingEffectsRef = useRef(new Map()); // key → {char,color} | null (delete)
  const rafIdRef = useRef(null);

  const flushEffects = useCallback(() => {
    rafIdRef.current = null;
    const pending = pendingEffectsRef.current;
    if (pending.size === 0) return;
    const batch = new Map(pending);
    pending.clear();
    setTileEffects((prev) => {
      const next = new Map(prev);
      batch.forEach((value, key) => {
        if (value === null) next.delete(key);
        else next.set(key, value);
      });
      return next;
    });
  }, []);

  // ==============================================================================
  const gameRef = useRef(null);
  const deathInProgressRef = useRef(false);
  const mapContainerRef = useRef(null);
  const [pendingScroll, setPendingScroll] = useState(false);
  const tapStartRef = useRef(null);
  const pinchRef = useRef(null);
  const isPinchingRef = useRef(false);
  const messageTimerRef = useRef(null);
  const holdMessageDuringChallengeOverlayRef = useRef(false);
  const messageWaitedForChallengeOverlayRef = useRef(false);
  const delayedMessageTimerRef = useRef(null);
  const screenShakeTimerRef = useRef(null);
  const levelTransitionTimerRef = useRef(null);
  const titleLoreTimerRef = useRef(null);

  // ======== A1 : Toutes les refs useLatest pour lecture dans les callbacks ========
  const playerRef = useLatest(player);
  const mapRef = useLatest(map);
  const gameStateRef = useLatest(gameState);
  const showConfirmRef = useLatest(showConfirm);
  const showChallengeOverlayRef = useLatest(showChallengeOverlay);
  const showDirectionPickerRef = useLatest(showDirectionPicker);
  const monstersRef = useLatest(monsters);
  const currentClassRef = useLatest(currentClass);
  const hasBowRef = useLatest(hasBow);
  const bowRef = useLatest(bow);
  const levelRef = useLatest(level);
  const armorRef = useLatest(armor);
  const goldRef = useLatest(gold);
  const hpRef = useLatest(hp);
  const maxHpRef = useLatest(maxHp);
  const dmgBonusRef = useLatest(dmgBonus);
  const weaponRef = useLatest(weapon);
  const revealedZonesRef = useLatest(revealedZones);
  const pendingWeaponRef = useLatest(pendingWeapon);
  const pendingArmorRef = useLatest(pendingArmor);
  const pendingBowRef = useLatest(pendingBow);
  const vendorScrollRef = useLatest(vendorScroll);
  const surfaceDefenseActiveRef = useLatest(surfaceDefenseActive);
  const surfaceDefenseReadyToReturnRef = useLatest(surfaceDefenseReadyToReturn);
  const surfaceDefenseSourceLevelRef = useLatest(surfaceDefenseSourceLevel);
  const surfaceCorruptionStageRef = useLatest(surfaceCorruptionStage);
  const floorsWithoutSurfaceDefenseRef = useLatest(floorsWithoutSurfaceDefense);
  const teleporter1Ref = useLatest(teleporter1);
  const teleporter2Ref = useLatest(teleporter2);
  const stairsPosRef = useLatest(stairsPos);
  const gemOnMapRef = useLatest(gemOnMap);
  const unlockedGemsRef = useLatest(unlockedGems);
  const keyNeededRef = useLatest(keyNeeded);
  const hasKeyRef = useLatest(hasKey);
  const prayerUsedRef = useLatest(prayerUsed);
  const floorObjectiveRef = useLatest(floorObjective);
  const floorTurnsRef = useLatest(floorTurns);
  const prayedThisFloorRef = useLatest(prayedThisFloor);
  const killsThisFloorRef = useLatest(killsThisFloor);
  const terrainKillsThisFloorRef = useLatest(terrainKillsThisFloor);
  const dashedThisFloorRef = useLatest(dashedThisFloor);
  const damageTakenThisFloorRef = useLatest(damageTakenThisFloor);
  const teleportedThisFloorRef = useLatest(teleportedThisFloor);
  const classSwitchedThisFloorRef = useLatest(classSwitchedThisFloor);
  const goldCollectedThisFloorRef = useLatest(goldCollectedThisFloor);
  const zonesDiscoveredThisFloorRef = useLatest(zonesDiscoveredThisFloor);
  const trapsSteppedThisFloorRef = useLatest(trapsSteppedThisFloor);
  const earnedBadgesRef = useLatest(earnedBadges);
  const isSecretVaultRef = useLatest(isSecretVault);
  const activeBiomeRef = useLatest(activeBiome);
  const mapZoomRef = useLatest(mapZoom);
  const comboCountRef = useLatest(comboCount);
  const overdriveTurnsRef = useLatest(overdriveTurns);
  const hasOverloadKeyRef = useLatest(hasOverloadKey);
  const fireTimersRef = useLatest(fireTimers);

  // ======== COMBO/OVERDRIVE tracking ref ========
  const killedThisTurnRef = useRef(false);

  // ==============================================================================

  const movePlayerRef = useRef(null);
  const useStairsRef = useRef(null);
  const teleportRef = useRef(null);
  const prayRef = useRef(null);
  const switchClassRef = useRef(null);
  const fireBowRef = useRef(null);
  const polymorphRef = useRef(null);
  const handleWeaponConfirmRef = useRef(null);
  const handleArmorConfirmRef = useRef(null);
  const handleBowConfirmRef = useRef(null);
  const handleVendorConfirmRef = useRef(null);
  const startGameRef = useRef(null);
  const enterOverworldRef = useRef(null);
  const maybeSpawnSurfaceDefenseAccessRef = useRef(() => false);
  const enterSurfaceDefenseRef = useRef(null);
  const returnToDungeonAfterSurfaceDefenseRef = useRef(null);
  const processMonsterTurnRef = useRef(null);
  const corridorDashRef = useRef(null);

  const resetKillTrackingRef = useRef(true);
  const resetDamageTrackingRef = useRef(true);
  const prevAliveMonstersRef = useRef(0);
  const prevHpForDamageRef = useRef(hp);
  const resetGoldTrackingRef = useRef(true);
  const resetZoneTrackingRef = useRef(true);
  const prevGoldForTrackingRef = useRef(gold);
  const prevRevealedZonesCountRef = useRef(revealedZones.size);

  useEffect(() => {
    const fontId = "downwards-google-fonts";
    if (!document.getElementById(fontId)) {
      const link = document.createElement("link");
      link.id = fontId;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  const showMessage = useCallback(
    (text, color = NEON.white, duration = 2500, options = {}) => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }

      const holdDuringChallengeOverlay = Boolean(
        options.holdDuringChallengeOverlay
      );
      const postOverlayDuration =
        typeof options.postOverlayDuration === "number"
          ? Math.max(0, options.postOverlayDuration)
          : 2200;

      holdMessageDuringChallengeOverlayRef.current = holdDuringChallengeOverlay;
      messageWaitedForChallengeOverlayRef.current = false;
      setMsg({ text, color });

      const clearNow = () => {
        setMsg((m) => ({ ...m, text: "" }));
        messageTimerRef.current = null;
      };

      const clearWhenReady = () => {
        if (
          holdMessageDuringChallengeOverlayRef.current &&
          showChallengeOverlayRef.current
        ) {
          messageWaitedForChallengeOverlayRef.current = true;
          messageTimerRef.current = setTimeout(clearWhenReady, 160);
          return;
        }

        if (
          holdMessageDuringChallengeOverlayRef.current &&
          messageWaitedForChallengeOverlayRef.current &&
          postOverlayDuration > 0
        ) {
          holdMessageDuringChallengeOverlayRef.current = false;
          messageWaitedForChallengeOverlayRef.current = false;
          messageTimerRef.current = setTimeout(clearNow, postOverlayDuration);
          return;
        }

        holdMessageDuringChallengeOverlayRef.current = false;
        messageWaitedForChallengeOverlayRef.current = false;
        clearNow();
      };

      messageTimerRef.current = setTimeout(
        clearWhenReady,
        Math.max(0, duration)
      );
    },
    []
  );

  const triggerShake = useCallback(() => {
    setScreenShake(true);
    if (screenShakeTimerRef.current) {
      clearTimeout(screenShakeTimerRef.current);
    }
    screenShakeTimerRef.current = setTimeout(() => {
      setScreenShake(false);
      screenShakeTimerRef.current = null;
    }, 150);
  }, []);

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
      if (delayedMessageTimerRef.current)
        clearTimeout(delayedMessageTimerRef.current);
      if (screenShakeTimerRef.current)
        clearTimeout(screenShakeTimerRef.current);
      if (levelTransitionTimerRef.current)
        clearTimeout(levelTransitionTimerRef.current);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      effectTimersRef.current.forEach((t) => clearTimeout(t));
      effectTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const alive = monsters.filter(
      (m) => m.currentHp > 0 && m.x > 0 && m.y > 0
    ).length;
    if (resetKillTrackingRef.current) {
      prevAliveMonstersRef.current = alive;
      resetKillTrackingRef.current = false;
      return;
    }
    const diff = prevAliveMonstersRef.current - alive;
    if (diff > 0) {
      setKillsThisFloor((k) => k + diff);
    }
    prevAliveMonstersRef.current = alive;
  }, [monsters]);

  useEffect(() => {
    if (resetDamageTrackingRef.current) {
      prevHpForDamageRef.current = hp;
      resetDamageTrackingRef.current = false;
      return;
    }
    if (hp < prevHpForDamageRef.current) {
      setDamageTakenThisFloor((d) => d + (prevHpForDamageRef.current - hp));
    }
    prevHpForDamageRef.current = hp;
  }, [hp]);
  useEffect(() => {
    if (resetGoldTrackingRef.current) {
      if (showLevelTransition) {
        prevGoldForTrackingRef.current = gold;
        return;
      }
      const firstDelta = gold - prevGoldForTrackingRef.current;
      if (firstDelta > 0) {
        setGoldCollectedThisFloor((g) => g + firstDelta);
      }
      prevGoldForTrackingRef.current = gold;
      resetGoldTrackingRef.current = false;
      return;
    }
    if (gold > prevGoldForTrackingRef.current) {
      setGoldCollectedThisFloor(
        (g) => g + (gold - prevGoldForTrackingRef.current)
      );
    }
    prevGoldForTrackingRef.current = gold;
  }, [gold, showLevelTransition]);

  useEffect(() => {
    const revealedCount = revealedZones.size;
    if (resetZoneTrackingRef.current) {
      prevRevealedZonesCountRef.current = revealedCount;
      resetZoneTrackingRef.current = false;
      return;
    }
    const diff = revealedCount - prevRevealedZonesCountRef.current;
    if (diff > 0) {
      setZonesDiscoveredThisFloor((z) => z + diff);
    }
    prevRevealedZonesCountRef.current = revealedCount;
  }, [revealedZones]);

  const spawnEffect = useCallback(
    (x, y, char, color, duration = 300) => {
      const key = `${x},${y}`;
      pendingEffectsRef.current.set(key, { char, color });
      if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(flushEffects);
      }
      const timer = setTimeout(() => {
        pendingEffectsRef.current.set(key, null);
        if (!rafIdRef.current) {
          rafIdRef.current = requestAnimationFrame(flushEffects);
        }
        effectTimersRef.current.delete(timer);
      }, duration);
      effectTimersRef.current.add(timer);
    },
    [flushEffects]
  );

  const spawnProjectileTrail = useCallback(
    (path, char, color) => {
      if (path.length === 0) return;
      // Phase 1: Instant full trail (dim, all at once)
      path.forEach((pos) => {
        spawnEffect(pos.x, pos.y, "·", color, 350);
      });
      // Phase 2: Bright projectile head moving through the path
      path.forEach((pos, i) => {
        const delay = i * 35; // fast 35ms between positions
        const timer = setTimeout(() => {
          spawnEffect(pos.x, pos.y, char, color, 120);
          effectTimersRef.current.delete(timer);
        }, delay);
        effectTimersRef.current.add(timer);
      });
    },
    [spawnEffect]
  );

  const spawnDeathEffect = useCallback(
    (x, y, color) => {
      spawnEffect(x, y, "✸", color, 200);
      setTimeout(() => {
        spawnEffect(x, y, "◇", NEON.yellow, 250);
        const burst = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ];
        burst.forEach(([dx, dy]) => {
          const bx = x + dx,
            by = y + dy;
          if (bx >= 1 && bx <= GRID_WIDTH && by >= 1 && by <= GRID_HEIGHT) {
            spawnEffect(bx, by, "·", color, 200);
          }
        });
      }, 100);
    },
    [spawnEffect]
  );

  const spawnHealEffect = useCallback(
    (x, y) => {
      spawnEffect(x, y, "✚", NEON.white, 400);
      setTimeout(() => spawnEffect(x, y, "✦", NEON.cyan, 300), 200);
    },
    [spawnEffect]
  );

  const getInitialMapZoom = useCallback(() => 1, []);

  const generateLevel = useCallback(
    (
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
      const numRooms = 8 + Math.floor(Math.random() * 5);

      for (let r = 0; r < numRooms; r++) {
        const roomW = 3 + Math.floor(Math.random() * 4);
        const roomH = 3 + Math.floor(Math.random() * 3);
        const roomX = 2 + Math.floor(Math.random() * (GRID_WIDTH - roomW - 3));
        const roomY = 2 + Math.floor(Math.random() * (GRID_HEIGHT - roomH - 3));

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

      // ======== QUICK WIN #4 : Pré-collecte des tuiles libres ========
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
        return available[Math.floor(Math.random() * available.length)];
      };
      // ==============================================================

      const playerPos = {
        x: rooms[0].x + Math.floor(Math.random() * rooms[0].w),
        y: rooms[0].y + Math.floor(Math.random() * rooms[0].h),
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
      const isVaultStairs = lvl < 50 && Math.random() < boostedVaultChance;
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

      const needKey = Math.random() < 0.25;
      if (needKey) {
        const keyPos = getValidTile(allPlaced);
        allPlaced.push(keyPos);
        newMap[keyPos.y][keyPos.x] = TILE.KEY;
      }

      if (Math.random() < 0.3) {
        const potionPos = getValidTile(allPlaced);
        allPlaced.push(potionPos);
        newMap[potionPos.y][potionPos.x] = TILE.POTION;
      }
      if (Math.random() < 0.15) {
        const scrollPos = getValidTile(allPlaced);
        allPlaced.push(scrollPos);
        newMap[scrollPos.y][scrollPos.x] = TILE.SCROLL;
      }

      let vendorData = null;
      if (Math.random() < 0.25) {
        const vendorPos = getValidTile(allPlaced);
        allPlaced.push(vendorPos);
        newMap[vendorPos.y][vendorPos.x] = TILE.VENDOR;
        const tier = VENDOR_SCROLLS[getVendorTier(lvl)];
        vendorData = { ...tier[Math.floor(Math.random() * tier.length)] };
      }

      let weaponData = null;
      if (lvl === 1 || (lvl >= 2 && Math.random() < 0.2)) {
        const weaponPos = getValidTile(allPlaced);
        allPlaced.push(weaponPos);
        newMap[weaponPos.y][weaponPos.x] = TILE.WEAPON;
        weaponData = getWeaponForLevel(lvl);
      }

      let armorData = null;
      if (Math.random() < 0.2) {
        const armorPos = getValidTile(allPlaced);
        allPlaced.push(armorPos);
        newMap[armorPos.y][armorPos.x] = TILE.ARMOR;
        armorData = getArmorForLevel(lvl);
      }

      const goldCount =
        Math.random() < 0.5 ? 1 + Math.floor(Math.random() * 4) : 0;
      for (let g = 0; g < goldCount; g++) {
        const goldPos = getValidTile(allPlaced);
        allPlaced.push(goldPos);
        newMap[goldPos.y][goldPos.x] = TILE.GOLD;
      }

      let bowData = null;
      if (Math.random() < 0.15) {
        const bowPos = getValidTile(allPlaced);
        allPlaced.push(bowPos);
        newMap[bowPos.y][bowPos.x] = TILE.BOW;
        bowData = getBowForLevel(lvl);
      }

      let gemData = null;
      // Gem spawns every 3 levels starting at level 3, for classes not yet at max (level 3)
      if (lvl >= 3 && lvl % 3 === 0) {
        const available = currentUnlockedGems
          .map((level, idx) => (level < 3 ? idx : -1))
          .filter((idx) => idx >= 0);
        if (available.length > 0) {
          const gemIdx =
            available[Math.floor(Math.random() * available.length)];
          const gemPos = getValidTile(allPlaced);
          allPlaced.push(gemPos);
          newMap[gemPos.y][gemPos.x] = TILE.GEM;
          gemData = { ...GEMS[gemIdx], idx: gemIdx };
        }
      }

      let monsterCount =
        lvl === 1
          ? 1 + Math.floor(Math.random() * 2)
          : lvl <= 15
          ? 1 + Math.floor(Math.random() * 4)
          : lvl <= 30
          ? 2 + Math.floor(Math.random() * 5)
          : 3 + Math.floor(Math.random() * 6);

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

      // ======== COMBO/OVERDRIVE OBJECTS ========
      // Barrels: appear from level 5+, 1-2 per floor
      if (lvl >= 5) {
        const barrelCount = 1 + (Math.random() < 0.4 ? 1 : 0);
        for (let b = 0; b < barrelCount; b++) {
          const barrelPos = getValidTile(allPlaced);
          allPlaced.push(barrelPos);
          newMap[barrelPos.y][barrelPos.x] = TILE.BARREL;
        }
      }

      // Blood Altar: rare, from level 10+, 15% chance
      if (lvl >= 10 && Math.random() < 0.15) {
        const altarPos = getValidTile(allPlaced);
        allPlaced.push(altarPos);
        newMap[altarPos.y][altarPos.x] = TILE.BLOOD_ALTAR;
      }

      // Overload Key: rare, from level 15+, 10% chance
      if (lvl >= 15 && Math.random() < 0.1) {
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
    },
    []
  );

  // ======== OVERWORLD : Convertir tile IDs overworld → dungeon ========
  const OW_TO_DUNGEON = useMemo(
    () => ({
      [OW_TILE.VOID]: TILE.VOID,
      [OW_TILE.STREET]: TILE.CORRIDOR,
      [OW_TILE.BUILDING]: TILE.WALL,
      [OW_TILE.LIT_WINDOW]: TILE.WALL,
      [OW_TILE.NEON_SIGN]: TILE.WALL,
      [OW_TILE.STREETLIGHT]: TILE.CORRIDOR,
      [OW_TILE.STAIRS]: TILE.STAIRS,
      [OW_TILE.WATER]: TILE.VOID,
    }),
    []
  );

  // ======== OVERWORLD : Entrer dans la vue ville (level 0) ========
  const enterOverworld = useCallback(() => {
    const ow = generateOverworld();

    // Overworld generator is 0-based; the dungeon engine expects a 1-based grid.
    // Re-map all overworld arrays so indices [1..GRID_WIDTH][1..GRID_HEIGHT] are valid.
    const shiftedRawMap = Array(GRID_HEIGHT + 1)
      .fill(null)
      .map(() => Array(GRID_WIDTH + 1).fill(OW_TILE.VOID));
    for (let y = 0; y < ow.map.length; y++) {
      const row = ow.map[y] || [];
      for (let x = 0; x < row.length; x++) {
        shiftedRawMap[y + 1][x + 1] = row[x];
      }
    }

    const shiftedCoastLine = Array(GRID_WIDTH + 1).fill(GRID_HEIGHT);
    for (let x = 0; x < ow.coastLine.length; x++) {
      shiftedCoastLine[x + 1] = ow.coastLine[x] + 1;
    }

    // Convertir la map overworld en tile IDs dungeon pour le moteur de jeu
    const dungeonMap = shiftedRawMap.map((row) =>
      row.map((t) => OW_TO_DUNGEON[t] ?? TILE.VOID)
    );

    // Garder la map brute pour le rendu overworld
    setOverworldRawMap(shiftedRawMap);
    setOverworldCoastLine(shiftedCoastLine);
    setOverworldTick(0);
    setSurfaceDefenseActive(false);
    setSurfaceDefenseReadyToReturn(false);
    setSurfaceDefenseSourceLevel(null);
    setSurfaceCorruptionStage(0);
    setFloorsWithoutSurfaceDefense(0);

    // Tout réinitialiser comme startGame, mais level=0
    effectTimersRef.current.forEach((t) => clearTimeout(t));
    effectTimersRef.current.clear();
    pendingEffectsRef.current.clear();
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setTileEffects(new Map());
    setMapZoom(getInitialMapZoom());
    setFastTravelArmed(false);
    cancelAutoPathRef.current();

    setLevel(0);
    setHp(10);
    setMaxHp(10);
    setGold(0);
    setArmorPermanent(0);
    setEquippedArmorValue(0);
    setEquippedArmorName(null);
    setDmgBonus(0);
    deathInProgressRef.current = false;
    setCurrentClass(1);
    setUnlockedGems([0, 0, 0, 0, 0]);
    setHasWeapon(false);
    setWeapon({ name: "Fists", dmg: 1, short: "NONE" });
    setHasBow(false);
    setBow({ name: "None", bonus: 0 });
    setHasKey(false);
    setPrayerUsed(false);
    setIsSecretVault(false);
    setActiveBiome(null);
    setFloorTurns(0);
    setPrayedThisFloor(false);
    setKillsThisFloor(0);
    setTerrainKillsThisFloor(0);
    setDashedThisFloor(false);
    setDamageTakenThisFloor(0);
    setTeleportedThisFloor(false);
    setClassSwitchedThisFloor(false);
    setGoldCollectedThisFloor(0);
    setZonesDiscoveredThisFloor(0);
    setTrapsSteppedThisFloor(false);
    setEarnedBadges([]);
    setComboCount(0);
    setOverdriveTurns(0);
    setHasOverloadKey(false);
    setFireTimers(new Map());
    resetKillTrackingRef.current = true;
    resetDamageTrackingRef.current = true;
    resetGoldTrackingRef.current = true;
    resetZoneTrackingRef.current = true;

    // Injecter la map convertie dans le moteur de jeu
    setMap(dungeonMap);
    setPlayer({ x: ow.playerPos.x + 1, y: ow.playerPos.y + 1 });
    setStairsPos({ x: ow.stairsPos.x + 1, y: ow.stairsPos.y + 1 });
    setTeleporter1({ x: 0, y: 0, active: false });
    setTeleporter2({ x: 0, y: 0, active: false });
    setMonsters([]);
    setFloorObjective(null);
    setKeyNeeded(false);
    setVendorScroll(null);
    setPendingWeapon(null);
    setPendingArmor(null);
    setPendingBow(null);
    setGemOnMap(null);
    // Révéler toute la carte overworld (pas de fog of war)
    const allZones = new Set();
    for (let y = 1; y <= GRID_HEIGHT; y++) {
      for (let x = 1; x <= GRID_WIDTH; x++) {
        allZones.add(getZone(x, y));
      }
    }

    setRevealedZones(allZones);

    setShowLevelTransition(false);
    setGameState("playing");
    setPendingScroll(true); // <-- Ajout de cette ligne pour forcer le centrage
    showMessage(
      "◆ NEON BAY — FIND THE DUNGEON ENTRANCE ◆",
      OW_PALETTE.neonCyan,
      4000
    );
  }, [OW_TO_DUNGEON, showMessage]);

  // ======== OVERWORLD : Animation lente de l'eau ========
  useEffect(() => {
    if (levelRef.current !== 0 || gameStateRef.current !== "playing") return;
    const id = setInterval(() => setOverworldTick((t) => t + 1), 800);
    return () => clearInterval(id);
  }, [gameState, level]);

  const startGame = useCallback(() => {
    const freshUnlockedGems = [0, 0, 0, 0, 0];

    // Clear overworld state
    setOverworldRawMap(null);
    setSurfaceDefenseActive(false);
    setSurfaceDefenseReadyToReturn(false);
    setSurfaceDefenseSourceLevel(null);
    setSurfaceCorruptionStage(0);
    setFloorsWithoutSurfaceDefense(0);

    effectTimersRef.current.forEach((t) => clearTimeout(t));
    effectTimersRef.current.clear();
    pendingEffectsRef.current.clear();
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setTileEffects(new Map());
    setMapZoom(getInitialMapZoom());
    setFastTravelArmed(false);
    cancelAutoPathRef.current();

    setLevel(1);
    setHp(10);
    setMaxHp(10);
    setGold(0);
    setArmorPermanent(0);
    setEquippedArmorValue(0);
    setEquippedArmorName(null);
    setDmgBonus(0);
    deathInProgressRef.current = false;
    setCurrentClass(1);
    setUnlockedGems(freshUnlockedGems);
    setHasWeapon(false);
    setWeapon({ name: "Fists", dmg: 1, short: "NONE" });

    setHasBow(false);
    setBow({ name: "None", bonus: 0 });
    setHasKey(false);
    setPrayerUsed(false);
    setIsSecretVault(false);
    setActiveBiome(null);
    setFloorTurns(0);
    setPrayedThisFloor(false);
    setKillsThisFloor(0);
    setTerrainKillsThisFloor(0);
    setDashedThisFloor(false);
    setDamageTakenThisFloor(0);
    setTeleportedThisFloor(false);
    setClassSwitchedThisFloor(false);
    setGoldCollectedThisFloor(0);
    setZonesDiscoveredThisFloor(0);
    setTrapsSteppedThisFloor(false);
    setEarnedBadges([]);
    setComboCount(0);
    setOverdriveTurns(0);
    setHasOverloadKey(false);
    setFireTimers(new Map());
    resetKillTrackingRef.current = true;
    resetDamageTrackingRef.current = true;
    resetGoldTrackingRef.current = true;
    resetZoneTrackingRef.current = true;

    const levelData = generateLevel(1, freshUnlockedGems, 0, false, false);

    setMap(levelData.map);
    setPlayer(levelData.playerPos);
    setStairsPos(levelData.stairsPos);
    setTeleporter1(levelData.tp1);
    setTeleporter2(levelData.tp2);
    setMonsters(levelData.monsters);
    setFloorObjective(
      makeFloorObjective(
        1,
        false,
        levelData.monsters.length,
        levelData.totalZones
      )
    );
    setKeyNeeded(levelData.needKey);
    setVendorScroll(levelData.vendorData);
    setPendingWeapon(levelData.weaponData);
    setPendingArmor(levelData.armorData);
    setPendingBow(levelData.bowData);
    setGemOnMap(levelData.gemData);
    setRevealedZones(
      new Set([getZone(levelData.playerPos.x, levelData.playerPos.y)])
    );

    setShowLevelTransition(true);
    if (levelTransitionTimerRef.current) {
      clearTimeout(levelTransitionTimerRef.current);
    }
    levelTransitionTimerRef.current = setTimeout(() => {
      setShowLevelTransition(false);
      setGameState("playing");
      levelTransitionTimerRef.current = null;
      setPendingScroll(true); // <-- Remplacement
      if (floorObjectiveRef.current) {
        setShowChallengeOverlay(true);
      }
    }, 1500);
  }, [generateLevel, getInitialMapZoom]);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia(
      "(max-width: 800px) and (orientation: portrait)"
    );
    const applyMediaState = (matches) => setIsMobilePortrait(matches);
    applyMediaState(media.matches);
    const onChange = (e) => applyMediaState(e.matches);

    if (media.addEventListener) {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia(
      "(max-height: 600px) and (orientation: landscape)"
    );
    const applyMediaState = (matches) => setIsMobileLandscape(matches);
    applyMediaState(media.matches);
    const onChange = (e) => applyMediaState(e.matches);

    if (media.addEventListener) {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  useEffect(() => {
    const node = mapContainerRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setMapViewportSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [gameState, showLevelTransition]);

  // Pinch-to-zoom on the map container (mobile)
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;

    const endPinch = () => {
      if (!pinchRef.current) return;
      isPinchingRef.current = false;
      pinchRef.current = null;
      // Restore native scrolling & touch handling
      el.style.overflowX = "auto";
      el.style.overflowY = "auto";
      el.style.touchAction = "";
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();

        isPinchingRef.current = true;
        el.style.overflowX = "hidden";
        el.style.overflowY = "hidden";
        el.style.touchAction = "none";

        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;

        // NOUVEAU : On calcule le centre exact entre les deux doigts
        const rect = el.getBoundingClientRect();
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const pinchX = cx - rect.left;
        const pinchY = cy - rect.top;

        pinchRef.current = {
          dist: Math.hypot(dx, dy),
          startZoom: mapZoomRef.current,
          startScrollLeft: el.scrollLeft,
          startScrollTop: el.scrollTop,
          pinchX: pinchX, // On sauvegarde la coordonnée X du pinch
          pinchY: pinchY, // On sauvegarde la coordonnée Y du pinch
        };
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const ratio = dist / pinchRef.current.dist;

        // NOUVEAU : Calcul du zoom minimum dynamique
        // On récupère la taille de base (zoom 1) de la carte depuis le DOM
        const baseWidth =
          el.firstElementChild.getBoundingClientRect().width /
          mapZoomRef.current;
        const baseHeight =
          el.firstElementChild.getBoundingClientRect().height /
          mapZoomRef.current;

        // La carte ne pourra pas être plus petite que l'écran
        const dynamicMinZoom = Math.max(
          el.clientWidth / baseWidth,
          el.clientHeight / baseHeight
        );

        const newZoom = Math.min(
          3, // Ton zoom max
          Math.max(
            dynamicMinZoom,
            +(pinchRef.current.startZoom * ratio).toFixed(2)
          )
        );

        flushSync(() => setMapZoom(newZoom));
      }
    };

    const onTouchEnd = () => {
      endPinch();
    };

    // Safari uses proprietary gesture events for pinch — block them so the
    // native viewport zoom doesn't fire on iOS when the user pinches the map.
    const blockGesture = (e) => e.preventDefault();

    // touchstart must be non-passive so e.preventDefault() is honoured
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    el.addEventListener("gesturestart", blockGesture);
    el.addEventListener("gesturechange", blockGesture);

    return () => {
      endPinch();
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("gesturestart", blockGesture);
      el.removeEventListener("gesturechange", blockGesture);
    };
    // gameState is the dep: the map-wrapper is only in the DOM when
    // gameState === "playing", so we must re-run when it transitions there.
  }, [gameState]);

  const isMobile = isMobilePortrait || isMobileLandscape;

  const mobileCellSize = useMemo(() => {
    if (!isMobile || mapViewportSize.height <= 0) return null;
    return Math.max(8, mapViewportSize.height / GRID_HEIGHT);
  }, [isMobile, mapViewportSize.height]);

  const mobileMapWidth = mobileCellSize ? GRID_WIDTH * mobileCellSize : null;
  const mobileMapHeight = mobileCellSize ? GRID_HEIGHT * mobileCellSize : null;

  // Scroll the map container to center on the player when requested.
  // useLayoutEffect (not useEffect) fires synchronously after DOM mutations
  // but before the browser paints, so the scroll correction and the zoom
  // resize land in the same frame — no visible intermediate shifted frame.
  useLayoutEffect(() => {
    if (!pendingScroll) return;
    if (
      !isMobile ||
      !mobileMapWidth ||
      !mobileMapHeight ||
      !mapContainerRef.current
    )
      return;

    const el = mapContainerRef.current;
    const containerWidth = el.clientWidth;
    const containerHeight = el.clientHeight;
    const totalMapWidth = mobileMapWidth * mapZoom;
    const totalMapHeight = mobileMapHeight * mapZoom;

    const playerPixelX = ((player.x - 0.5) / GRID_WIDTH) * totalMapWidth;
    const playerPixelY = ((player.y - 0.5) / GRID_HEIGHT) * totalMapHeight;

    el.scrollLeft = Math.max(0, playerPixelX - containerWidth / 2);
    el.scrollTop = Math.max(0, playerPixelY - containerHeight / 2);

    setPendingScroll(false);
  }, [
    pendingScroll,
    player,
    mobileMapWidth,
    mobileMapHeight,
    mapZoom,
    isMobile,
  ]);

  // Pinch-zoom scroll correction — runs synchronously before every paint
  // triggered by a mapZoom change.  Keeps the view centre fixed instead of
  // snapping to the player (which would fight the browser compositor).
  //
  // Formula: zoom around the scroll position captured at pinch-start.
  //   newScroll = startScroll * zoomRatio + containerHalf * (zoomRatio - 1)
  // When zoomRatio = 1 this is a no-op; the derivation ensures the pixel
  // that was at the viewport centre before the pinch stays at centre after.

  useLayoutEffect(() => {
    if (!isMobile) return;
    const p = pinchRef.current;

    // Ajout de la vérification de p.pinchX pour éviter les erreurs
    if (!p || p.startScrollLeft === undefined || p.pinchX === undefined) return;
    const el = mapContainerRef.current;
    if (!el) return;

    const zoomRatio = mapZoom / p.startZoom;

    // On remplace hw et hh par p.pinchX et p.pinchY
    el.scrollLeft = Math.max(
      0,
      p.startScrollLeft * zoomRatio + p.pinchX * (zoomRatio - 1)
    );
    el.scrollTop = Math.max(
      0,
      p.startScrollTop * zoomRatio + p.pinchY * (zoomRatio - 1)
    );
  }, [mapZoom, isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextLevel = useCallback(
    (goingToVault = false) => {
      // Si on sort d'une vault, on ne monte pas de niveau
      const newLevel = isSecretVaultRef.current
        ? levelRef.current
        : levelRef.current + 1;

      effectTimersRef.current.forEach((t) => clearTimeout(t));
      effectTimersRef.current.clear();
      pendingEffectsRef.current.clear();
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      setTileEffects(new Map());
      setMapZoom(1);
      setFastTravelArmed(false);
      cancelAutoPathRef.current();

      setLevel(newLevel);
      setHasKey(false);
      setPrayerUsed(false);
      setFloorTurns(0);
      setPrayedThisFloor(false);
      setKillsThisFloor(0);
      setTerrainKillsThisFloor(0);
      setDashedThisFloor(false);
      setDamageTakenThisFloor(0);
      setTeleportedThisFloor(false);
      setClassSwitchedThisFloor(false);
      setGoldCollectedThisFloor(0);
      setZonesDiscoveredThisFloor(0);
      setTrapsSteppedThisFloor(false);
      setComboCount(0);
      setOverdriveTurns(0);
      // Handle Overload Key: boost vault chance for this level transition
      const overloadKeyActive = hasOverloadKeyRef.current;
      setHasOverloadKey(false);
      setFireTimers(new Map());
      resetKillTrackingRef.current = true;
      resetDamageTrackingRef.current = true;
      resetGoldTrackingRef.current = true;
      resetZoneTrackingRef.current = true;
      deathInProgressRef.current = false;

      let levelData;
      const spawnBlueAccess = !goingToVault
        ? maybeSpawnSurfaceDefenseAccessRef.current(newLevel)
        : false;

      if (goingToVault) {
        // Entrer dans la vault
        setIsSecretVault(true);
        levelData = generateThemedVault(
          newLevel,
          unlockedGemsRef.current,
          getWeaponForLevel,
          getArmorForLevel,
          GEMS
        );
        setActiveBiome(levelData.customBiome);
      } else {
        // Niveau normal (ou sortie de vault)
        setIsSecretVault(false);
        setActiveBiome(null);
        levelData = generateLevel(
          newLevel,
          unlockedGemsRef.current,
          earnedBadgesRef.current.length,
          overloadKeyActive,
          spawnBlueAccess
        );
      }

      if (!goingToVault) {
        setFloorsWithoutSurfaceDefense((count) =>
          spawnBlueAccess ? 0 : count + 1
        );
      }

      setMap(levelData.map);
      setPlayer(levelData.playerPos);
      setStairsPos(levelData.stairsPos);
      setTeleporter1(levelData.tp1);
      setTeleporter2(levelData.tp2);
      setMonsters(levelData.monsters);
      setFloorObjective(
        makeFloorObjective(
          newLevel,
          goingToVault,
          levelData.monsters.length,
          levelData.totalZones
        )
      );
      setKeyNeeded(levelData.needKey);
      setVendorScroll(levelData.vendorData);
      setPendingWeapon(levelData.weaponData);
      setPendingArmor(levelData.armorData);
      setPendingBow(levelData.bowData);
      setGemOnMap(levelData.gemData);

      if (goingToVault) {
        // Vault : r v ler toutes les zones (salle petite, pas de brouillard)
        const allZones = new Set();
        for (let zy = 1; zy <= GRID_HEIGHT; zy++) {
          for (let zx = 1; zx <= GRID_WIDTH; zx++) {
            if (levelData.map[zy]?.[zx] && levelData.map[zy][zx] !== 0) {
              allZones.add(getZone(zx, zy));
            }
          }
        }
        setRevealedZones(allZones);
      } else {
        setRevealedZones(
          new Set([getZone(levelData.playerPos.x, levelData.playerPos.y)])
        );
      }

      setShowLevelTransition(true);
      if (levelTransitionTimerRef.current) {
        clearTimeout(levelTransitionTimerRef.current);
      }
      levelTransitionTimerRef.current = setTimeout(() => {
        setShowLevelTransition(false);
        levelTransitionTimerRef.current = null;
        setPendingScroll(true);
        // Message d'entr e dans la vault (affich  apr s la transition)
        if (goingToVault && levelData.customBiome) {
          showMessage(
            `* ${levelData.customBiome.name} DISCOVERED *`,
            levelData.customBiome.floorColor,
            4000
          );
        }
        if (floorObjectiveRef.current) {
          setShowChallengeOverlay(true);
        }
      }, 1500);
    },
    [generateLevel, showMessage]
  );

  // ======== A1 : Callbacks stables — lecture via refs, deps minimales ========

  const getDamage = useCallback(() => {
    let dmg = weaponRef.current.dmg + dmgBonusRef.current;
    if (currentClassRef.current === 4) dmg *= 2;
    if (overdriveTurnsRef.current > 0) dmg *= 2;
    return dmg;
  }, []);

  const registerDashHitForCombo = useCallback(() => {
    killedThisTurnRef.current = true;
    const currentCombo = comboCountRef.current;
    const newCombo = currentCombo + 1;
    setComboCount(newCombo);
    if (newCombo >= 3 && overdriveTurnsRef.current <= 0) {
      setOverdriveTurns(3);
      setComboCount(0);
      showMessage("⚡ OVERDRIVE ACTIVATED ⚡", NEON.red, 2500);
    }
  }, [showMessage]);

  // ======== BARREL EXPLOSION ========
  const explodeBarrel = useCallback(
    (bx, by, currentMap, currentMonsters) => {
      const newMap = [...currentMap];
      let newMonsters = [...currentMonsters];
      let totalGold = 0;
      let terrainKillCount = 0;
      const newFireTiles = [];

      // Destroy the barrel — place fire at barrel position too
      newMap[by] = [...newMap[by]];
      newMap[by][bx] = TILE.FIRE;
      spawnEffect(bx, by, "^", NEON.orange, 500);
      newFireTiles.push({ x: bx, y: by });

      // AoE: 2 tiles in every direction (radius 2)
      const aoeTiles = [];
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          if (dx === 0 && dy === 0) continue;
          aoeTiles.push([dx, dy]);
        }
      }

      for (const [dx, dy] of aoeTiles) {
        const tx = bx + dx;
        const ty = by + dy;
        if (tx < 1 || tx > GRID_WIDTH || ty < 1 || ty > GRID_HEIGHT) continue;

        // Destroy adjacent walls (only radius 1)
        if (
          Math.abs(dx) <= 1 &&
          Math.abs(dy) <= 1 &&
          newMap[ty][tx] === TILE.WALL
        ) {
          newMap[ty] = [...newMap[ty]];
          newMap[ty][tx] = TILE.FIRE;
          spawnEffect(tx, ty, "^", NEON.orange, 400);
          newFireTiles.push({ x: tx, y: ty });
          continue;
        }

        // Chain reaction: explode adjacent barrels (radius 1)
        if (
          Math.abs(dx) <= 1 &&
          Math.abs(dy) <= 1 &&
          newMap[ty][tx] === TILE.BARREL
        ) {
          const chainResult = explodeBarrel(tx, ty, newMap, newMonsters);
          for (let r = 0; r < chainResult.map.length; r++) {
            newMap[r] = chainResult.map[r];
          }
          newMonsters = chainResult.monsters;
          totalGold += chainResult.gold;
          terrainKillCount += chainResult.terrainKills;
          newFireTiles.push(...chainResult.fireTiles);
          continue;
        }

        // Place fire on floor tiles within AoE
        const currentTile = newMap[ty][tx];
        if (currentTile === TILE.FLOOR || currentTile === TILE.CORRIDOR) {
          newMap[ty] = [...newMap[ty]];
          newMap[ty][tx] = TILE.FIRE;
          spawnEffect(tx, ty, "^", NEON.orange, 300);
          newFireTiles.push({ x: tx, y: ty });
        }

        // Damage monsters in AoE
        const explosionDmg = 20;
        newMonsters = newMonsters.map((m) => {
          if (m.currentHp > 0 && m.x === tx && m.y === ty) {
            const newHp = m.currentHp - explosionDmg;
            spawnEffect(tx, ty, "^", NEON.red, 300);

            if (newHp <= 0) {
              spawnDeathEffect(tx, ty, m.color);
              const loot =
                1 +
                Math.floor(Math.random() * 3) +
                Math.floor(levelRef.current / 5);
              totalGold += loot;
              terrainKillCount += 1;
              return { ...m, currentHp: 0, x: -1, y: -1 };
            }
            return { ...m, currentHp: newHp };
          }
          return m;
        });
      }

      return {
        map: newMap,
        monsters: newMonsters,
        gold: totalGold,
        terrainKills: terrainKillCount,
        fireTiles: newFireTiles,
      };
    },
    [spawnEffect, spawnDeathEffect]
  );

  const applyTerrainToMonster = useCallback((monster, currentMap) => {
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
  }, []);

  const resolveFloorObjective = useCallback(() => {
    const objective = floorObjectiveRef.current;
    if (!objective) return;

    const stats = {
      turns: floorTurnsRef.current,
      prayed: prayedThisFloorRef.current,
      kills: killsThisFloorRef.current,
      terrainKills: terrainKillsThisFloorRef.current,
      trapsStepped: trapsSteppedThisFloorRef.current,
      dashed: dashedThisFloorRef.current,
      damageTaken: damageTakenThisFloorRef.current,
      teleported: teleportedThisFloorRef.current,
      classSwitched: classSwitchedThisFloorRef.current,
      goldCollected: goldCollectedThisFloorRef.current,
      zonesDiscovered: zonesDiscoveredThisFloorRef.current,
    };

    const success = isObjectiveSuccessNow(objective, stats);
    if (!success) {
      showMessage(
        `FAILED: ${objective.badge} (${getObjectiveProgressText(
          objective,
          stats
        )})`,
        NEON.orange,
        2800
      );
      return;
    }

    setEarnedBadges((prev) => [...prev, objective.badge]);
    showMessage(
      `BADGE EARNED: ${objective.badge} | VAULT CHANCE +4%`,
      NEON.lime,
      4000,
      { holdDuringChallengeOverlay: true, postOverlayDuration: 2600 }
    );
  }, [showMessage]);

  const processMonsterTurn = useCallback(
    (
      currentMonsters,
      justRevealedZone = null,
      playerPos = null,
      attackedMonsterPos = null
    ) => {
      const pPos = playerPos || playerRef.current;
      const _level = levelRef.current;

      // Overworld (level 0) : pas de monstres
      if (_level === 0) return;

      const _armor = armorRef.current;
      const _map = mapRef.current;

      let hpDelta = 0;
      let goldDelta = 0;
      let armorDelta = 0;
      let dmgBonusDelta = 0;
      let maxHpDelta = 0;
      let lastDamageMsg = null;
      let effectMsg = null;
      let missOccurred = false;
      let terrainLootDelta = 0;
      let terrainKillCountDelta = 0;

      const nextTurns = floorTurnsRef.current + 1;
      setFloorTurns(nextTurns);

      // ======== COMBO / OVERDRIVE turn processing ========
      if (overdriveTurnsRef.current > 0) {
        const remaining = overdriveTurnsRef.current - 1;
        setOverdriveTurns(remaining);
        if (remaining === 0) {
          showMessage("◇ OVERDRIVE ENDED ◇", NEON.purple);
        }
      }
      if (!killedThisTurnRef.current) {
        // No kill this turn: decay combo
        if (comboCountRef.current > 0) {
          setComboCount((c) => Math.max(0, c - 1));
        }
      }
      killedThisTurnRef.current = false;

      // ======== BARREL FIRE TIMER DECAY ========
      const currentFireTimers = fireTimersRef.current;
      if (currentFireTimers.size > 0) {
        const updatedTimers = new Map();
        const currentMapForFire = mapRef.current;
        let mapChanged = false;
        for (const [key, turnsLeft] of currentFireTimers) {
          const remaining = turnsLeft - 1;
          if (remaining <= 0) {
            // Fire expires — revert to floor
            const [fx, fy] = key.split(",").map(Number);
            if (fx >= 1 && fx <= GRID_WIDTH && fy >= 1 && fy <= GRID_HEIGHT) {
              if (currentMapForFire[fy]?.[fx] === TILE.FIRE) {
                currentMapForFire[fy] = [...currentMapForFire[fy]];
                currentMapForFire[fy][fx] = TILE.FLOOR;
                mapChanged = true;
              }
            }
          } else {
            updatedTimers.set(key, remaining);
          }
        }
        setFireTimers(updatedTimers);
        if (mapChanged) {
          setMap([...currentMapForFire]);
        }
      }

      const activeObjective = floorObjectiveRef.current;
      if (activeObjective) {
        const prevStats = {
          turns: floorTurnsRef.current,
          prayed: prayedThisFloorRef.current,
          kills: killsThisFloorRef.current,
          terrainKills: terrainKillsThisFloorRef.current,
          trapsStepped: trapsSteppedThisFloorRef.current,
          dashed: dashedThisFloorRef.current,
          damageTaken: damageTakenThisFloorRef.current,
          teleported: teleportedThisFloorRef.current,
          classSwitched: classSwitchedThisFloorRef.current,
          goldCollected: goldCollectedThisFloorRef.current,
          zonesDiscovered: zonesDiscoveredThisFloorRef.current,
        };
        const nextStats = { ...prevStats, turns: nextTurns };
        if (
          isObjectiveFailedNow(activeObjective, nextStats) &&
          !isObjectiveFailedNow(activeObjective, prevStats)
        ) {
          showMessage(`◇ ${activeObjective.label} FAILED ◇`, NEON.orange, 2200);
        }
      }

      const playerTile = _map[pPos.y]?.[pPos.x];
      if (isTerrainTile(playerTile) && !trapsSteppedThisFloorRef.current) {
        setTrapsSteppedThisFloor(true);
      }
      if (playerTile === TILE.FIRE) {
        if (currentClassRef.current === 6) {
          hpDelta += 1;
          effectMsg = "✦ FIRE SIPHON +1 HP ✦";
        } else {
          hpDelta -= 2;
          effectMsg = "☠ BURNING GROUND -2 HP ☠";
        }
      } else if (playerTile === TILE.POISON) {
        if (currentClassRef.current === 3) {
          hpDelta += 1;
          effectMsg = "✚ PURIFIED MIST +1 HP ✚";
        } else {
          hpDelta -= 1;
          effectMsg = "☠ POISON MIST -1 HP ☠";
        }
      } else if (playerTile === TILE.VOID_FLUX) {
        if (currentClassRef.current === 5) {
          goldDelta += 1;
          effectMsg = "◆ VOID FLUX +1G ◆";
        } else {
          hpDelta -= 1;
          effectMsg = "☠ VOID FLUX -1 HP ☠";
        }
      }

      const occupiedPositions = new Set(
        currentMonsters
          .filter((m) => m.currentHp > 0 && m.x > 0 && m.y > 0)
          .map((m) => `${m.x},${m.y}`)
      );

      const newMonsters = currentMonsters
        .filter((m) => m.currentHp > 0 && m.x > 0 && m.y > 0)
        .map((monster) => {
          const monsterZone = getZone(monster.x, monster.y);
          if (justRevealedZone !== null && monsterZone === justRevealedZone) {
            return monster;
          }

          let updatedMonster = monster;
          if (
            monster.effect?.type === "REGEN" &&
            monster.currentHp < monster.hp
          ) {
            const regenAmt = monster.effect.value || 2;
            updatedMonster = {
              ...monster,
              currentHp: Math.min(monster.hp, monster.currentHp + regenAmt),
            };
          }

          // Stun mechanic: stunned monsters skip their turn
          if (updatedMonster.stunTurns > 0) {
            return {
              ...updatedMonster,
              stunTurns: updatedMonster.stunTurns - 1,
            };
          }

          const distX = Math.abs(pPos.x - updatedMonster.x);
          const distY = Math.abs(pPos.y - updatedMonster.y);

          if (
            updatedMonster.effect?.type === "AURA" &&
            distX <= 1 &&
            distY <= 1
          ) {
            const auraDmg = updatedMonster.effect.value || 1;
            hpDelta -= auraDmg;
            effectMsg = `☠ ${updatedMonster.name} AURA -${auraDmg} HP ☠`;
          }

          if (distX <= 1 && distY <= 1) {
            const monsterTile = _map[updatedMonster.y]?.[updatedMonster.x];
            const icePenalty = monsterTile === TILE.ICE ? 0.15 : 0;
            const missChance = Math.min(
              0.9,
              getMonsterMissChance(_level) + icePenalty
            );
            if (Math.random() < missChance) {
              missOccurred = true;
              return updatedMonster;
            }

            let dmg = updatedMonster.dmg;
            let dmgEffectTriggered = false;

            if (
              (updatedMonster.effect?.type === "PIERCE" ||
                updatedMonster.effect?.type === "INFERNO") &&
              Math.random() < updatedMonster.effect.chance
            ) {
              effectMsg = `‡ ${updatedMonster.effect.msg} ‡`;
              dmgEffectTriggered = true;
            } else if (
              updatedMonster.effect?.type === "HEAVY_BLOW" &&
              Math.random() < updatedMonster.effect.chance
            ) {
              dmg = Math.max(1, Math.floor(dmg * 1.5) - _armor);
              effectMsg = `!! ${updatedMonster.effect.msg} !!`;
              dmgEffectTriggered = true;
            } else {
              dmg = Math.max(1, dmg - _armor);
            }

            hpDelta -= dmg;
            lastDamageMsg = `▼ ${updatedMonster.name} -${dmg} HP ▼`;
            triggerShake();

            if (!dmgEffectTriggered) {
              if (
                updatedMonster.effect?.type === "STEAL_GOLD" &&
                Math.random() < updatedMonster.effect.chance
              ) {
                const stolen = 1 + Math.floor(Math.random() * 2);
                goldDelta -= stolen;
                effectMsg = `✋ ${updatedMonster.effect.msg} -${stolen}G ✋`;
              } else if (
                updatedMonster.effect?.type === "WITHER" &&
                Math.random() < updatedMonster.effect.chance
              ) {
                maxHpDelta -= 1;
                effectMsg = `☠ ${updatedMonster.effect.msg} -1 MAX HP ☠`;
              } else if (
                updatedMonster.effect?.type === "DRAIN" &&
                Math.random() < updatedMonster.effect.chance
              ) {
                dmgBonusDelta -= 1;
                effectMsg = `☠ ${updatedMonster.effect.msg} -1 DMG ☠`;
              } else if (
                updatedMonster.effect?.type === "CORRODE" &&
                Math.random() < updatedMonster.effect.chance
              ) {
                armorDelta -= 1;
                effectMsg = `☠ ${updatedMonster.effect.msg} -1 ARM ☠`;
              }
            }

            if (
              updatedMonster.effect?.type === "VAMPIRISM" &&
              Math.random() < updatedMonster.effect.chance
            ) {
              const healAmt = Math.max(1, Math.floor(dmg * 0.3));
              updatedMonster = {
                ...updatedMonster,
                currentHp: Math.min(
                  updatedMonster.hp,
                  updatedMonster.currentHp + healAmt
                ),
              };
              effectMsg = `♥ ${updatedMonster.effect.msg} +${healAmt} HP ♥`;
            }

            return updatedMonster;
          }

          // ==========================================
          // GESTION DE L'IA ET DES DÉPLACEMENTS
          // ==========================================

          let finalMonsterState = updatedMonster;
          let rangedAttackTriggered = false;

          // --- 1. IA RANGED (Attaque à distance) ---
          if (
            updatedMonster.ai === "RANGED" &&
            updatedMonster.zone === getZone(pPos.x, pPos.y)
          ) {
            const dx = pPos.x - updatedMonster.x;
            const dy = pPos.y - updatedMonster.y;

            if (
              (dx === 0 || dy === 0) &&
              Math.abs(dx) <= 4 &&
              Math.abs(dy) <= 4 &&
              (Math.abs(dx) > 1 || Math.abs(dy) > 1)
            ) {
              let hasLOS = true;
              let cx = updatedMonster.x + Math.sign(dx);
              let cy = updatedMonster.y + Math.sign(dy);
              const path = [];
              while (cx !== pPos.x || cy !== pPos.y) {
                const tile = _map[cy]?.[cx];
                if (tile === TILE.WALL || tile === TILE.VOID) {
                  hasLOS = false;
                  break;
                }
                path.push({ x: cx, y: cy });
                cx += Math.sign(dx);
                cy += Math.sign(dy);
              }

              if (hasLOS) {
                rangedAttackTriggered = true;
                spawnProjectileTrail(path, "●", NEON.red);
                const rangedDmg = Math.max(
                  1,
                  Math.floor(updatedMonster.dmg / 2) - _armor
                );
                hpDelta -= rangedDmg;
                lastDamageMsg = `▼ ${updatedMonster.name} SPELL -${rangedDmg} HP ▼`;
                triggerShake();
              }
            }
          }

          if (rangedAttackTriggered) {
            return finalMonsterState;
          }

          // --- 2. LOGIQUE DE DÉPLACEMENT ---
          const detectionRange = _level >= 40 ? 16 : _level >= 26 ? 11 : 8;

          // Le STALKER ignore la distance de détection, il traque toujours
          if (
            distX + distY <= detectionRange ||
            updatedMonster.ai === "STALKER"
          ) {
            if (updatedMonster.ai === "JUGGERNAUT") {
              const skip = !updatedMonster.skipMove;
              finalMonsterState = { ...finalMonsterState, skipMove: skip };
              if (skip) return finalMonsterState;
            }

            let nx = updatedMonster.x,
              ny = updatedMonster.y;

            if (updatedMonster.ai === "RANGED") {
              const dist = distX + distY;
              if (dist < 4) {
                if (Math.random() < 0.5 && pPos.x !== updatedMonster.x)
                  nx += pPos.x > updatedMonster.x ? -1 : 1;
                else if (pPos.y !== updatedMonster.y)
                  ny += pPos.y > updatedMonster.y ? -1 : 1;
              } else if (dist > 4) {
                if (Math.random() < 0.5 && pPos.x !== updatedMonster.x)
                  nx += pPos.x > updatedMonster.x ? 1 : -1;
                else if (pPos.y !== updatedMonster.y)
                  ny += pPos.y > updatedMonster.y ? 1 : -1;
              } else {
                if (distX > 0 && distY > 0) {
                  if (Math.random() < 0.5)
                    nx += pPos.x > updatedMonster.x ? 1 : -1;
                  else ny += pPos.y > updatedMonster.y ? 1 : -1;
                }
              }
            } else if (updatedMonster.ai === "ERRATIC" && Math.random() < 0.5) {
              let dirX = pPos.x > updatedMonster.x ? 1 : -1;
              let dirY = pPos.y > updatedMonster.y ? 1 : -1;
              if (pPos.x === updatedMonster.x)
                dirX = Math.random() < 0.5 ? 1 : -1;
              if (pPos.y === updatedMonster.y)
                dirY = Math.random() < 0.5 ? 1 : -1;

              nx += dirX;
              ny += dirY;
            } else if (
              updatedMonster.ai === "COWARD" &&
              updatedMonster.currentHp < updatedMonster.hp * 0.3
            ) {
              if (Math.random() < 0.5 && pPos.x !== updatedMonster.x)
                nx += pPos.x > updatedMonster.x ? -1 : 1;
              else if (pPos.y !== updatedMonster.y)
                ny += pPos.y > updatedMonster.y ? -1 : 1;
            } else if (
              updatedMonster.ai === "AMBUSH" &&
              distX + distY > 3 &&
              updatedMonster.currentHp === updatedMonster.hp
            ) {
              return finalMonsterState;
            } else {
              if (Math.random() < 0.5 && pPos.x !== updatedMonster.x)
                nx += pPos.x > updatedMonster.x ? 1 : -1;
              else if (pPos.y !== updatedMonster.y)
                ny += pPos.y > updatedMonster.y ? 1 : -1;
            }

            // Validation du mouvement et collision
            if (nx >= 1 && nx <= GRID_WIDTH && ny >= 1 && ny <= GRID_HEIGHT) {
              const tile = _map[ny]?.[nx];
              const canPass =
                updatedMonster.effect?.type === "WALL_PHASE"
                  ? tile !== undefined
                  : tile !== undefined &&
                    tile !== TILE.VOID &&
                    tile !== TILE.WALL;
              if (canPass) {
                const blocked = occupiedPositions.has(`${nx},${ny}`);
                if (!blocked && !(nx === pPos.x && ny === pPos.y)) {
                  occupiedPositions.delete(
                    `${updatedMonster.x},${updatedMonster.y}`
                  );
                  occupiedPositions.add(`${nx},${ny}`);
                  return {
                    ...finalMonsterState,
                    x: nx,
                    y: ny,
                    zone: getZone(nx, ny),
                  };
                }
              }
            }
          } else {
            // === NOUVELLE LOGIQUE : ERRANCE (WANDERING) ===
            if (Math.random() < 0.5) {
              const dirs = [
                { dx: 0, dy: -1 }, // Haut
                { dx: 0, dy: 1 }, // Bas
                { dx: -1, dy: 0 }, // Gauche
                { dx: 1, dy: 0 }, // Droite
              ];
              const randomDir = dirs[Math.floor(Math.random() * dirs.length)];
              let nx = updatedMonster.x + randomDir.dx;
              let ny = updatedMonster.y + randomDir.dy;

              if (nx >= 1 && nx <= GRID_WIDTH && ny >= 1 && ny <= GRID_HEIGHT) {
                const tile = _map[ny]?.[nx];
                const canPass =
                  updatedMonster.effect?.type === "WALL_PHASE"
                    ? tile !== undefined
                    : tile !== undefined &&
                      tile !== TILE.VOID &&
                      tile !== TILE.WALL;

                if (canPass) {
                  const blocked = occupiedPositions.has(`${nx},${ny}`);
                  if (!blocked && !(nx === pPos.x && ny === pPos.y)) {
                    occupiedPositions.delete(
                      `${updatedMonster.x},${updatedMonster.y}`
                    );
                    occupiedPositions.add(`${nx},${ny}`);
                    return {
                      ...finalMonsterState,
                      x: nx,
                      y: ny,
                      zone: getZone(nx, ny),
                    };
                  }
                }
              }
            }
          }

          const terrainResult = applyTerrainToMonster(finalMonsterState, _map);
          if (terrainResult.damage > 0) {
            if (terrainResult.killed) {
              const loot =
                1 + Math.floor(Math.random() * 2) + Math.floor(_level / 6);
              terrainLootDelta += loot;
              terrainKillCountDelta += 1;
              if (finalMonsterState.x > 0 && finalMonsterState.y > 0) {
                spawnDeathEffect(
                  finalMonsterState.x,
                  finalMonsterState.y,
                  finalMonsterState.color
                );
              }
              effectMsg = `✦ ${finalMonsterState.name.toUpperCase()} LOST TO TERRAIN +${loot}G ✦`;
            } else {
              effectMsg = `◇ ${finalMonsterState.name} TERRAIN -${terrainResult.damage} HP ◇`;
            }
          }

          // Barrel damage: monster steps on barrel, takes 3 HP
          let afterBarrel = terrainResult.monster;
          if (
            afterBarrel.currentHp > 0 &&
            afterBarrel.x > 0 &&
            afterBarrel.y > 0
          ) {
            const monsterTile = _map[afterBarrel.y]?.[afterBarrel.x];
            if (monsterTile === TILE.BARREL) {
              const barrelHp = afterBarrel.currentHp - 3;
              spawnEffect(afterBarrel.x, afterBarrel.y, "Ø", NEON.orange, 300);
              if (barrelHp <= 0) {
                spawnDeathEffect(
                  afterBarrel.x,
                  afterBarrel.y,
                  afterBarrel.color
                );
                const loot =
                  1 + Math.floor(Math.random() * 2) + Math.floor(_level / 6);
                terrainLootDelta += loot;
                terrainKillCountDelta += 1;
                effectMsg = `✦ ${afterBarrel.name.toUpperCase()} BARREL -3 HP ✦`;
                afterBarrel = { ...afterBarrel, currentHp: 0, x: -1, y: -1 };
              } else {
                afterBarrel = { ...afterBarrel, currentHp: barrelHp };
                effectMsg = `◇ ${afterBarrel.name} BARREL -3 HP ◇`;
              }
            }
          }

          return afterBarrel;
        });

      setMonsters(newMonsters);

      const messageDelay = attackedMonsterPos ? 1000 : 0;
      if (delayedMessageTimerRef.current) {
        clearTimeout(delayedMessageTimerRef.current);
      }

      if (effectMsg || lastDamageMsg || missOccurred) {
        delayedMessageTimerRef.current = setTimeout(() => {
          if (effectMsg) {
            showMessage(effectMsg, NEON.magenta);
          } else if (lastDamageMsg) {
            showMessage(lastDamageMsg, NEON.red);
          } else if (missOccurred) {
            showMessage("◇ MISS ◇", NEON.cyan);
          }

          delayedMessageTimerRef.current = null;
        }, messageDelay);
      }

      const totalGoldDelta = goldDelta + terrainLootDelta;
      if (totalGoldDelta !== 0) setGold((g) => Math.max(0, g + totalGoldDelta));
      if (terrainKillCountDelta > 0)
        setTerrainKillsThisFloor((t) => t + terrainKillCountDelta);
      if (armorDelta !== 0)
        setArmorPermanent((a) => Math.max(0, a + armorDelta));
      if (dmgBonusDelta !== 0)
        setDmgBonus((d) => Math.max(0, d + dmgBonusDelta));
      if (maxHpDelta !== 0) {
        setMaxHp((m) => Math.max(1, m + maxHpDelta));
        setHp((h) => Math.min(h, Math.max(1, h + maxHpDelta)));
      }

      if (hpDelta !== 0) {
        setHp((currentHp) => {
          const newHp = currentHp + hpDelta;

          if (newHp <= 0) {
            deathInProgressRef.current = true;
            setGameState("gameover");
          }
          return newHp;
        });
      }
    },
    [applyTerrainToMonster, showMessage, spawnDeathEffect, triggerShake]
  );

  const applyDefensiveEffects = (monster, rawDmg) => {
    if (
      monster.effect?.type === "DODGE" &&
      Math.random() < monster.effect.chance
    ) {
      return {
        finalDmg: 0,
        dodged: true,
        effectMsg: `◇ ${monster.effect.msg} ◇`,
      };
    }
    if (
      monster.effect?.type === "PARRY" &&
      Math.random() < monster.effect.chance
    ) {
      return {
        finalDmg: Math.max(1, Math.floor(rawDmg / 2)),
        dodged: false,
        effectMsg: `▣ ${monster.effect.msg} ▣`,
      };
    }
    return { finalDmg: rawDmg, dodged: false, effectMsg: null };
  };

  const handleSpawnEffect = (monster, allMonsters, currentMap) => {
    if (!monster.effect || monster.effect.type !== "SPAWN") return allMonsters;
    if (Math.random() >= monster.effect.chance) return allMonsters;
    const dirs = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ].sort(() => Math.random() - 0.5);
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

  const movePlayer = useCallback(
    (dx, dy) => {
      const _gameState = gameStateRef.current;
      if (_gameState !== "playing" || showDirectionPickerRef.current) return;
      if (showConfirmRef.current) {
        setShowConfirm(null);
      }

      const _player = playerRef.current;
      const _map = mapRef.current;
      let _monsters = monstersRef.current;
      const _currentClass = currentClassRef.current;
      const _revealedZones = revealedZonesRef.current;

      const nx = _player.x + dx;
      const ny = _player.y + dy;

      if (nx < 1 || nx > GRID_WIDTH || ny < 1 || ny > GRID_HEIGHT) return;

      const tile = _map[ny][nx];
      if (tile === TILE.VOID && _currentClass !== 5) return;
      if (tile === TILE.WALL) return;

      const transmuterLevel = unlockedGemsRef.current[3];
      const voidCost = _currentClass === 5 && transmuterLevel >= 2 ? 1 : 2;
      const isExitingVoid =
        _currentClass === 5 &&
        _map[_player.y][_player.x] === TILE.VOID &&
        tile !== TILE.VOID;

      if (tile === TILE.VOID && _currentClass === 5) {
        if (goldRef.current < voidCost) {
          if (_map[_player.y][_player.x] === TILE.VOID) {
            showMessage("◆ LOST IN VOID ◆", NEON.red);
            deathInProgressRef.current = true;
            setHp(0);
            setGameState("gameover");
            return;
          }

          showMessage("◇ NO GOLD TO PHASE ◇", NEON.red);
          return;
        }
        setGold((g) => g - voidCost);
        spawnEffect(nx, ny, "◇", NEON.cyan, 250);
      }

      let targetX = nx;
      let targetY = ny;
      let isReachAttack = false;
      let monsterAtTarget = _monsters.find(
        (m) => m.currentHp > 0 && m.x > 0 && m.y > 0 && m.x === nx && m.y === ny
      );

      // 1. GESTION DE L'ALLONGE (REACH) : Si la case devant est vide, on check la case d'après !
      const weaponFamily = weaponRef.current.family;
      if (!monsterAtTarget && weaponFamily === "REACH") {
        const reachX = nx + dx;
        const reachY = ny + dy;
        const reachMonster = _monsters.find(
          (m) => m.currentHp > 0 && m.x === reachX && m.y === reachY
        );
        // On ne tape à distance QUE si la case intermédiaire n'est pas un mur (isWalkable)
        if (reachMonster && isWalkable(_map[ny][nx])) {
          monsterAtTarget = reachMonster;
          targetX = reachX;
          targetY = reachY;
          isReachAttack = true;
        }
      }

      if (monsterAtTarget) {
        if ([2, 3, 5, 6].includes(_currentClass)) {
          showMessage("◇ CAN'T MELEE ◇", NEON.red);
          return;
        }

        let rawDmg = getDamage();
        let combatMsg = null;
        let combatColor = NEON.cyan;

        const targetTile = _map[targetY]?.[targetX];
        let terrainBonus = 0;
        if (isTerrainTile(targetTile)) {
          if (
            weaponFamily === "ARCANE" &&
            [TILE.FIRE, TILE.VOID_FLUX].includes(targetTile)
          ) {
            terrainBonus = 2;
          } else if (weaponFamily === "REACH" && targetTile === TILE.ICE) {
            terrainBonus = 2;
          } else if (
            weaponFamily === "KNOCKBACK" &&
            [TILE.FIRE, TILE.POISON].includes(targetTile)
          ) {
            terrainBonus = 2;
          }
        }
        if (terrainBonus > 0) {
          rawDmg += terrainBonus;
          combatMsg = "!! TERRAIN COMBO !!";
          combatColor = NEON.lime;
        }

        // 2. GESTION DE LA PERCÉE (CRIT) : 25% de chance de doubler les dégâts purs
        if (weaponFamily === "CRIT" && Math.random() < 0.25) {
          rawDmg *= 2;
          combatMsg = "!! CRITICAL HIT !!";
          combatColor = NEON.yellow;
        }

        // 3. GESTION DU RECUL (KNOCKBACK) - Pré-calcul de la case cible
        let pushedX = targetX;
        let pushedY = targetY;
        let knockbackTile = null;
        let knockbackBlockedByWall = false;
        if (weaponFamily === "KNOCKBACK") {
          const pushTileX = targetX + dx;
          const pushTileY = targetY + dy;
          const pushTile = _map[pushTileY]?.[pushTileX];
          const isOccupied = _monsters.some(
            (m) => m.currentHp > 0 && m.x === pushTileX && m.y === pushTileY
          );

          if (pushTile === TILE.WALL) knockbackBlockedByWall = true;
          if (isWalkable(pushTile) && !isOccupied)
            knockbackTile = { x: pushTileX, y: pushTileY };
        }

        const {
          finalDmg,
          dodged,
          effectMsg: defMsg,
        } = applyDefensiveEffects(monsterAtTarget, rawDmg);
        if (dodged) {
          showMessage(defMsg, NEON.purple);
          spawnEffect(targetX, targetY, "◇", NEON.purple, 300);
          // Si on a attaqué de loin, on ne force pas le focus du monstre sur nous pour esquiver
          if (!isReachAttack)
            processMonsterTurn(_monsters, null, _player, {
              x: targetX,
              y: targetY,
            });
          return;
        }

        if (weaponFamily === "KNOCKBACK") {
          // N'applique le knockback que sur un coup vraiment puissant
          const canKnockback = finalDmg >= Math.ceil(monsterAtTarget.hp * 0.3);
          if (canKnockback && knockbackBlockedByWall) {
            combatMsg = "!! WALL SLAM !!";
            combatColor = NEON.orange;
          } else if (canKnockback && knockbackTile) {
            pushedX = knockbackTile.x;
            pushedY = knockbackTile.y;
            spawnEffect(targetX, targetY, "»", NEON.orange, 200);
          }
        }

        if (combatMsg) showMessage(combatMsg, combatColor);
        else if (defMsg) showMessage(defMsg, NEON.cyan);

        const monsterIdx = _monsters.findIndex((m) => m === monsterAtTarget);
        let newMonsters = [..._monsters];

        let terrainKillLoot = 0;

        // On applique les dégâts et le potentiel recul (pushedX, pushedY)
        newMonsters[monsterIdx] = {
          ...newMonsters[monsterIdx],
          currentHp: newMonsters[monsterIdx].currentHp - finalDmg,
          x: pushedX,
          y: pushedY,
        };

        if (newMonsters[monsterIdx].currentHp > 0) {
          const terrainResult = applyTerrainToMonster(
            newMonsters[monsterIdx],
            _map
          );
          newMonsters[monsterIdx] = terrainResult.monster;
          if (terrainResult.damage > 0) {
            spawnEffect(pushedX, pushedY, "*", NEON.orange, 220);
          }
          if (terrainResult.killed) {
            terrainKillLoot =
              1 +
              Math.floor(Math.random() * 2) +
              Math.floor(levelRef.current / 6);
            setTerrainKillsThisFloor((t) => t + 1);
          }
        }

        // 4. GESTION DU FENDOIR (CLEAVE) : Éclaboussures de dégâts
        if (weaponFamily === "CLEAVE") {
          const cleaveDmg = Math.max(1, Math.floor(finalDmg * 0.5));
          let extraGold = 0;

          newMonsters = newMonsters.map((m, i) => {
            if (i !== monsterIdx && m.currentHp > 0) {
              // Distance maximale de 1 (donc 8 cases autour de la cible)
              const distToTarget = Math.max(
                Math.abs(m.x - targetX),
                Math.abs(m.y - targetY)
              );
              if (distToTarget <= 1) {
                spawnEffect(m.x, m.y, "✂", NEON.red, 200);
                const newHp = m.currentHp - cleaveDmg;
                if (newHp <= 0) {
                  spawnDeathEffect(m.x, m.y, m.color);
                  extraGold +=
                    1 +
                    Math.floor(Math.random() * 2) +
                    Math.floor(levelRef.current / 6);

                  return { ...m, currentHp: 0, x: -1, y: -1 };
                }
                return { ...m, currentHp: newHp };
              }
            }
            return m;
          });
          if (extraGold > 0) setGold((g) => g + extraGold); // Or bonus si le cleave tue
        }

        // Résolution si le monstre ciblé meurt
        if (newMonsters[monsterIdx].currentHp <= 0) {
          const baseLoot = monsterAtTarget.isBoss
            ? 100
            : 1 + Math.floor(Math.random() * 3);
          const loot = monsterAtTarget.isBoss
            ? baseLoot
            : baseLoot + Math.floor(levelRef.current / 5) + terrainKillLoot;
          setGold((g) => g + loot);

          // Affiche maintenant le nom de l'ennemi en majuscules
          if (!defMsg && !combatMsg)
            showMessage(
              `★ ${monsterAtTarget.name.toUpperCase()} KILLED +${loot}G ★`,
              NEON.yellow
            );

          spawnDeathEffect(pushedX, pushedY, monsterAtTarget.color);
          newMonsters[monsterIdx] = {
            ...newMonsters[monsterIdx],
            x: -1,
            y: -1,
            currentHp: 0,
          };

          // 5. GESTION MAGIE (ARCANE) : Soin sur kill
          if (weaponFamily === "ARCANE") {
            const healAmt = 5 + Math.floor(Math.random() * 6);
            // Entre 5 et 10 HP
            setHp((h) => Math.min(maxHpRef.current, h + healAmt));
            spawnHealEffect(_player.x, _player.y);
            showMessage(`✨ ARCANE SIPHON +${healAmt} HP ✨`, NEON.magenta);
          }

          // 6. BERSERKER Lvl 3 : Lifesteal on melee kill
          if (_currentClass === 4 && unlockedGemsRef.current[2] >= 3) {
            const lifestealAmt = 3;
            setHp((h) => Math.min(maxHpRef.current, h + lifestealAmt));
            spawnHealEffect(_player.x, _player.y);
            showMessage(`♥ BLOODTHIRST +${lifestealAmt} HP ♥`, NEON.red);
          }
        } else {
          spawnEffect(pushedX, pushedY, "✦", NEON.yellow, 250);
          if (!defMsg && !combatMsg)
            showMessage(
              `► ${monsterAtTarget.name} ${newMonsters[monsterIdx].currentHp}/${monsterAtTarget.hp} HP ◄`,
              NEON.green
            );
          newMonsters = handleSpawnEffect(
            newMonsters[monsterIdx],
            newMonsters,
            _map
          );
        }

        setMonsters(newMonsters);

        // Si l'attaque est une ALLONGE, le monstre ne riposte pas automatiquement (hors de portée).
        // Il jouera simplement son tour normal grâce au système ci-dessous !
        if (!isReachAttack) {
          processMonsterTurn(newMonsters, null, _player, {
            x: targetX,
            y: targetY,
          });
        } else {
          processMonsterTurn(newMonsters, null, _player);
        }
        return;
      }

      const newPlayerPos = { x: nx, y: ny };
      setPlayer(newPlayerPos);
      const newZone = getZone(nx, ny);
      let justRevealedZone = null;
      if (!_revealedZones.has(newZone)) {
        justRevealedZone = newZone;
        setRevealedZones((prev) => {
          const next = new Set(prev);
          next.add(newZone);
          return next;
        });
      }

      // Overworld (level 0) : hint quand on marche sur l'escalier
      if (levelRef.current === 0 && tile === TILE.STAIRS) {
        showMessage(
          surfaceDefenseActiveRef.current
            ? "◆ EXTRACTION POINT — PRESS S TO RETURN ◆"
            : "◆ DUNGEON ENTRANCE — PRESS S TO ENTER ◆",
          OW_PALETTE.neonMagenta
        );
      }
      if (tile === TILE.BLUE_STAIRS) {
        showMessage("◆ SURFACE BREACH — PRESS S TO DEFEND ◆", NEON.cyan, 2600);
      }

      const newMap = [..._map];
      newMap[ny] = [...newMap[ny]];
      if (tile === TILE.GOLD) {
        const baseAmt = 1 + Math.floor(Math.random() * 6);
        const vaultMult = activeBiomeRef.current?.vaultGoldMultiplier || 1;
        const amt = baseAmt * vaultMult;
        setGold((g) => g + amt);
        spawnEffect(nx, ny, "$", NEON.yellow, 250);
        showMessage(`◆ +${amt} GOLD ◆`, NEON.yellow);
        newMap[ny][nx] = TILE.FLOOR;
      }
      if (tile === TILE.KEY) {
        setHasKey(true);
        spawnEffect(nx, ny, "♦", NEON.yellow, 300);
        showMessage("◆ KEY FOUND ◆", NEON.yellow);
        newMap[ny][nx] = TILE.FLOOR;
      }
      if (tile === TILE.BOW) {
        if (pendingBowRef.current) {
          setShowConfirm({ type: "bow", data: pendingBowRef.current });
        } else {
          newMap[ny][nx] = TILE.FLOOR;
        }
      }
      if (tile === TILE.POTION) {
        const p = POTIONS[Math.floor(Math.random() * 4)];
        spawnEffect(nx, ny, "!", NEON.cyan, 300);
        if (p.effect === "hp") {
          setHp((currentHp) => Math.min(currentHp + p.value, maxHpRef.current));
          spawnHealEffect(nx, ny);
          showMessage(`◆ ${p.name} +${p.value} HP ◆`, NEON.cyan);
        } else if (p.effect === "maxHp") {
          setMaxHp((m) => m + p.value);
          setHp(maxHpRef.current + p.value);
          spawnHealEffect(nx, ny);
          showMessage(
            `◆ ${p.name} +${p.value} MAX HP & FULL HEAL ◆`,
            NEON.cyan
          );
        } else if (p.effect === "armor") {
          setArmorPermanent((a) => a + p.value);
          showMessage(`◆ ${p.name} +${p.value} ARMOR (PERMANENT) ◆`, NEON.cyan);
        } else if (p.effect === "dmgBonus") {
          setDmgBonus((d) => d + p.value);
          showMessage(`◆ ${p.name} +${p.value} DMG (PERMANENT) ◆`, NEON.cyan);
        }
        newMap[ny][nx] = TILE.FLOOR;
      }
      if (tile === TILE.SCROLL) {
        setRevealedZones(new Set(Array.from({ length: 15 }, (_, i) => i + 1)));
        spawnEffect(nx, ny, "?", NEON.magenta, 400);
        showMessage("◆ MAP REVEALED ◆", NEON.magenta);
        newMap[ny][nx] = TILE.FLOOR;
      }
      if (tile === TILE.BARREL) {
        // Walking on barrel: 3 HP damage, no explosion
        setHp((h) => {
          const newHp = h - 3;

          if (newHp <= 0) {
            deathInProgressRef.current = true;
            setGameState("gameover");
          }
          return newHp;
        });
        spawnEffect(nx, ny, "Ø", NEON.orange, 300);
        showMessage("◆ BARREL -3 HP ◆", NEON.orange);
        newMap[ny][nx] = TILE.FLOOR;
      }
      if (tile === TILE.BLOOD_ALTAR) {
        // Sacrifice 20% max HP for 20 turns of overdrive
        const sacrifice = Math.max(1, Math.floor(maxHpRef.current * 0.2));
        if (hpRef.current > sacrifice) {
          setHp((h) => h - sacrifice);
          setOverdriveTurns(20);
          setComboCount(0);
          spawnEffect(nx, ny, "Ω", NEON.red, 500);
          triggerShake();
          showMessage(`⚡ BLOOD OVERDRIVE -${sacrifice} HP ⚡`, NEON.red);
          newMap[ny][nx] = TILE.FLOOR;
        } else {
          showMessage("◇ TOO WEAK TO SACRIFICE ◇", NEON.red);
        }
      }
      if (tile === TILE.OVERLOAD_KEY) {
        setHasOverloadKey(true);
        spawnEffect(nx, ny, "⚡", NEON.yellow, 400);
        showMessage("◆ OVERLOAD KEY FOUND ◆", NEON.yellow);
        newMap[ny][nx] = TILE.FLOOR;
      }
      if (tile === TILE.WEAPON) {
        if (pendingWeaponRef.current) {
          setShowConfirm({ type: "weapon", data: pendingWeaponRef.current });
        } else {
          newMap[ny][nx] = TILE.FLOOR;
        }
      }
      if (tile === TILE.ARMOR) {
        if (pendingArmorRef.current) {
          setShowConfirm({ type: "armor", data: pendingArmorRef.current });
        } else {
          newMap[ny][nx] = TILE.FLOOR;
        }
      }
      if (tile === TILE.VENDOR) {
        if (vendorScrollRef.current) {
          setShowConfirm({ type: "vendor", data: vendorScrollRef.current });
        } else {
          newMap[ny][nx] = TILE.FLOOR;
        }
      }
      if (tile === TILE.TELEPORTER) {
        const _tp1 = teleporter1Ref.current;
        const _tp2 = teleporter2Ref.current;
        const tpBurst = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ];
        if (nx === _tp1.x && ny === _tp1.y && !_tp1.active) {
          setTeleporter1((t) => ({ ...t, active: true }));
          tpBurst.forEach(([bx, by], i) => {
            const ex = nx + bx,
              ey = ny + by;
            if (ex >= 1 && ex <= GRID_WIDTH && ey >= 1 && ey <= GRID_HEIGHT) {
              setTimeout(
                () => spawnEffect(ex, ey, "◈", NEON.cyan, 300),
                i * 40
              );
            }
          });
          showMessage("◆ TELEPORTER 1 ON ◆", NEON.cyan);
        }
        if (nx === _tp2.x && ny === _tp2.y && !_tp2.active) {
          setTeleporter2((t) => ({ ...t, active: true }));
          tpBurst.forEach(([bx, by], i) => {
            const ex = nx + bx,
              ey = ny + by;
            if (ex >= 1 && ex <= GRID_WIDTH && ey >= 1 && ey <= GRID_HEIGHT) {
              setTimeout(
                () => spawnEffect(ex, ey, "◈", NEON.cyan, 300),
                i * 40
              );
            }
          });
          showMessage("◆ TELEPORTER 2 ON ◆", NEON.cyan);
        }
      }
      if (tile === TILE.GEM && gemOnMapRef.current) {
        const _gem = gemOnMapRef.current;
        const newGems = [...unlockedGemsRef.current];
        const prevLevel = newGems[_gem.idx];
        newGems[_gem.idx] = Math.min(3, newGems[_gem.idx] + 1);
        setUnlockedGems(newGems);
        // Gem pickup burst effect
        spawnEffect(nx, ny, "◆", _gem.color, 500);
        const burst = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ];
        burst.forEach(([bx, by], i) => {
          const ex = nx + bx,
            ey = ny + by;
          if (ex >= 1 && ex <= GRID_WIDTH && ey >= 1 && ey <= GRID_HEIGHT) {
            setTimeout(() => spawnEffect(ex, ey, "✦", _gem.color, 300), i * 40);
          }
        });
        const gemMsg =
          prevLevel === 0
            ? `★ ${_gem.name} - ${_gem.unlock} UNLOCKED ★`
            : `★ ${_gem.name} - ${_gem.unlock} LEVEL UP! (Lvl ${
                newGems[_gem.idx]
              }) ★`;
        showMessage(gemMsg, _gem.color, 4000);
        newMap[ny][nx] = TILE.FLOOR;
        setGemOnMap(null);
      }
      if (tile === TILE.PRINCESS) {
        setGameState("victory");
        return;
      }

      setMap(newMap);

      // Transmuter Lvl 3: stun adjacent monsters when exiting void
      if (isExitingVoid && transmuterLevel >= 3) {
        let stunnedMonsters = [..._monsters];
        const stunBurst = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ];
        stunBurst.forEach(([bx, by], i) => {
          const sx = nx + bx,
            sy = ny + by;
          if (sx >= 1 && sx <= GRID_WIDTH && sy >= 1 && sy <= GRID_HEIGHT) {
            setTimeout(() => spawnEffect(sx, sy, "◆", NEON.cyan, 300), i * 30);
            const mIdx = stunnedMonsters.findIndex(
              (m) => m.currentHp > 0 && m.x === sx && m.y === sy
            );
            if (mIdx >= 0) {
              stunnedMonsters[mIdx] = {
                ...stunnedMonsters[mIdx],
                stunTurns: (stunnedMonsters[mIdx].stunTurns || 0) + 1,
              };
            }
          }
        });
        _monsters = stunnedMonsters;
        showMessage("◆ VOID STUN ◆", NEON.cyan);
      }

      // Transmuter Lvl 2+: free action when exiting void (skip monster turn)
      if (isExitingVoid && transmuterLevel >= 2) {
        setMonsters(_monsters);
        return;
      }

      processMonsterTurn(_monsters, justRevealedZone, newPlayerPos);
    },
    [
      applyTerrainToMonster,
      getDamage,
      processMonsterTurn,
      showMessage,
      spawnDeathEffect,
      spawnEffect,
      spawnHealEffect,
    ]
  );

  const fireBow = useCallback(
    (dx, dy) => {
      const _currentClass = currentClassRef.current;
      if (!hasBowRef.current || [3, 4, 5, 6].includes(_currentClass)) return;
      const arrowCost = _currentClass === 2 ? 6 : 2;
      if (goldRef.current < arrowCost) {
        showMessage("◇ NO GOLD FOR ARROWS ◇", NEON.red);
        return;
      }
      setGold((g) => g - arrowCost);
      const _player = playerRef.current;
      const _map = mapRef.current;
      const _revealedZones = revealedZonesRef.current;
      let newMonsters = [...monstersRef.current];
      let totalHitCount = 0;

      // Determine directions based on Archer gem level
      const archerLevel = unlockedGemsRef.current[0];
      let directions;
      if (_currentClass === 2 && archerLevel >= 3) {
        // Lvl 3: fire in all 4 cardinal directions
        directions = CARDINAL_DIRS;
      } else if (_currentClass === 2 && archerLevel >= 2) {
        // Lvl 2: fire forward and backward
        directions = [
          [dx, dy],
          [-dx, -dy],
        ];
      } else {
        // Lvl 1 or non-archer: single direction
        directions = [[dx, dy]];
      }

      for (const [adx, ady] of directions) {
        let fx = _player.x,
          fy = _player.y,
          hitCount = 0;
        const arrowPath = [];
        const arrowChar = adx !== 0 ? "—" : "|";
        while (true) {
          fx += adx;
          fy += ady;
          if (fx < 1 || fx > GRID_WIDTH || fy < 1 || fy > GRID_HEIGHT) break;
          if (_map[fy][fx] === TILE.VOID || _map[fy][fx] === TILE.WALL) break;
          if (!_revealedZones.has(getZone(fx, fy))) break;

          // Barrel hit: arrow triggers AoE explosion
          if (_map[fy][fx] === TILE.BARREL) {
            spawnProjectileTrail(arrowPath, arrowChar, NEON.green);
            const barrelResult = explodeBarrel(fx, fy, _map, newMonsters);
            for (let r = 0; r < barrelResult.map.length; r++) {
              _map[r] = barrelResult.map[r];
            }
            newMonsters = barrelResult.monsters;
            if (barrelResult.gold > 0) setGold((g) => g + barrelResult.gold);
            if (barrelResult.terrainKills > 0) {
              setTerrainKillsThisFloor((t) => t + barrelResult.terrainKills);
            }
            // Register fire timers (3 turns)
            if (barrelResult.fireTiles.length > 0) {
              setFireTimers((prev) => {
                const next = new Map(prev);
                for (const ft of barrelResult.fireTiles) {
                  next.set(`${ft.x},${ft.y}`, 3);
                }
                return next;
              });
            }
            setMap([..._map]);
            triggerShake();
            showMessage("◆ BARREL EXPLOSION ◆", NEON.orange);
            totalHitCount++;
            break;
          }

          const hitIdx = newMonsters.findIndex(
            (m) =>
              m.currentHp > 0 && m.x > 0 && m.y > 0 && m.x === fx && m.y === fy
          );
          if (hitIdx >= 0) {
            const targetMonster = newMonsters[hitIdx];
            const _bowBonus = bowRef.current.bonus;
            let rawArrowDmg =
              _currentClass === 2
                ? getDamage() + _bowBonus
                : Math.max(1, Math.floor(getDamage() / 2)) + _bowBonus;
            // Archer Lvl 1-2: halve damage after first pierced enemy
            if (_currentClass === 2 && archerLevel < 3 && hitCount > 0) {
              rawArrowDmg = Math.max(1, Math.floor(rawArrowDmg / 2));
            }
            const {
              finalDmg,
              dodged,
              effectMsg: defMsg,
            } = applyDefensiveEffects(targetMonster, rawArrowDmg);

            if (dodged) {
              spawnEffect(fx, fy, "◇", NEON.purple, 300);
              if (defMsg) showMessage(defMsg, NEON.purple);
              hitCount++;
              totalHitCount++;
              if (_currentClass !== 2) break;
              continue;
            }

            const newHp = targetMonster.currentHp - finalDmg;
            newMonsters[hitIdx] = { ...targetMonster, currentHp: newHp };
            hitCount++;
            totalHitCount++;
            if (newMonsters[hitIdx].currentHp <= 0) {
              const baseLoot = targetMonster.isBoss
                ? 100
                : 1 + Math.floor(Math.random() * 3);
              const levelBonus = Math.floor(levelRef.current / 5);
              const loot = targetMonster.isBoss
                ? baseLoot
                : baseLoot + levelBonus;
              setGold((g) => g + loot);
              showMessage(
                defMsg ||
                  `→ ${targetMonster.name.toUpperCase()} KILLED +${loot}G ←`,
                defMsg ? NEON.cyan : NEON.green
              );
              const deathX = fx,
                deathY = fy;
              setTimeout(
                () => spawnDeathEffect(deathX, deathY, targetMonster.color),
                arrowPath.length * 50 + 50
              );
              newMonsters[hitIdx] = {
                ...newMonsters[hitIdx],
                x: -1,
                y: -1,
                currentHp: 0,
              };
            } else {
              spawnEffect(fx, fy, "✦", NEON.yellow, 300);
              showMessage(
                defMsg ||
                  `→ ${targetMonster.name} ${newHp}/${targetMonster.hp} HP ←`,
                defMsg ? NEON.cyan : NEON.green
              );
              newMonsters = handleSpawnEffect(
                newMonsters[hitIdx],
                newMonsters,
                _map
              );
            }
            if (_currentClass !== 2) break;
          } else {
            arrowPath.push({ x: fx, y: fy });
          }
        }
        if (arrowPath.length > 0 || hitCount > 0) {
          spawnProjectileTrail(arrowPath, arrowChar, NEON.green);
        }
      }
      if (totalHitCount === 0) showMessage("◇ NO TARGET ◇", NEON.purple);
      setMonsters(newMonsters);
      processMonsterTurn(newMonsters, null);
    },
    [
      explodeBarrel,
      getDamage,
      processMonsterTurn,
      showMessage,
      spawnProjectileTrail,
      spawnDeathEffect,
      spawnEffect,
      triggerShake,
    ]
  );

  const polymorph = useCallback(
    (dx, dy) => {
      if (currentClassRef.current !== 6 || goldRef.current < 20) {
        showMessage("◇ NEED 20 GOLD ◇", NEON.red);
        return;
      }
      setGold((g) => g - 20);
      const _player = playerRef.current;
      const _map = mapRef.current;
      const _revealedZones = revealedZonesRef.current;
      const mageLevel = unlockedGemsRef.current[4];
      let fx = _player.x,
        fy = _player.y;
      let newMonsters = [...monstersRef.current];
      const boltPath = [];
      while (true) {
        fx += dx;
        fy += dy;
        if (fx < 1 || fx > GRID_WIDTH || fy < 1 || fy > GRID_HEIGHT) break;
        if (_map[fy][fx] === TILE.VOID || _map[fy][fx] === TILE.WALL) break;
        if (!_revealedZones.has(getZone(fx, fy))) break;

        // Barrel hit: spell triggers AoE explosion
        if (_map[fy][fx] === TILE.BARREL) {
          spawnProjectileTrail(boltPath, "✦", NEON.magenta);
          const barrelResult = explodeBarrel(fx, fy, _map, newMonsters);
          for (let r = 0; r < barrelResult.map.length; r++) {
            _map[r] = barrelResult.map[r];
          }
          newMonsters = barrelResult.monsters;
          if (barrelResult.gold > 0) setGold((g) => g + barrelResult.gold);
          if (barrelResult.terrainKills > 0) {
            setTerrainKillsThisFloor((t) => t + barrelResult.terrainKills);
          }
          // Register fire timers (3 turns)
          if (barrelResult.fireTiles.length > 0) {
            setFireTimers((prev) => {
              const next = new Map(prev);
              for (const ft of barrelResult.fireTiles) {
                next.set(`${ft.x},${ft.y}`, 3);
              }
              return next;
            });
          }
          setMap([..._map]);
          setMonsters(newMonsters);
          triggerShake();
          showMessage("◆ BARREL EXPLOSION ◆", NEON.orange);
          processMonsterTurn(newMonsters, null);
          return;
        }

        const hitIdx = newMonsters.findIndex(
          (m) =>
            m.currentHp > 0 && m.x > 0 && m.y > 0 && m.x === fx && m.y === fy
        );
        if (hitIdx >= 0) {
          spawnProjectileTrail(boltPath, "✦", NEON.magenta);

          const hitX = fx,
            hitY = fy;

          if (mageLevel >= 2) {
            // Lvl 2+: Fireball AoE - damage target + 8 adjacent tiles
            const fireballDmg = weaponRef.current.dmg + dmgBonusRef.current;
            const aoeTiles = [
              [0, 0],
              [-1, 0],
              [1, 0],
              [0, -1],
              [0, 1],
              [-1, -1],
              [1, -1],
              [-1, 1],
              [1, 1],
            ];
            let fireballGold = 0;
            const killedPositions = []; // For chain reaction (Lvl 3)

            setTimeout(() => {
              spawnEffect(hitX, hitY, "◆", NEON.orange, 500);
              aoeTiles.forEach(([bx, by], i) => {
                if (bx === 0 && by === 0) return;
                const ex = hitX + bx,
                  ey = hitY + by;
                if (
                  ex >= 1 &&
                  ex <= GRID_WIDTH &&
                  ey >= 1 &&
                  ey <= GRID_HEIGHT
                ) {
                  spawnEffect(ex, ey, "✦", NEON.orange, 400);
                }
              });
            }, boltPath.length * 50 + 50);

            aoeTiles.forEach(([bx, by]) => {
              const tx = hitX + bx,
                ty = hitY + by;
              if (tx < 1 || tx > GRID_WIDTH || ty < 1 || ty > GRID_HEIGHT)
                return;
              const mIdx = newMonsters.findIndex(
                (m) => m.currentHp > 0 && m.x === tx && m.y === ty
              );
              if (mIdx >= 0) {
                const mHp = newMonsters[mIdx].currentHp - fireballDmg;
                if (mHp <= 0) {
                  spawnDeathEffect(tx, ty, newMonsters[mIdx].color);
                  fireballGold +=
                    1 +
                    Math.floor(Math.random() * 2) +
                    Math.floor(levelRef.current / 6);
                  killedPositions.push({ x: tx, y: ty });
                  newMonsters[mIdx] = {
                    ...newMonsters[mIdx],
                    currentHp: 0,
                    x: -1,
                    y: -1,
                  };
                } else {
                  newMonsters[mIdx] = { ...newMonsters[mIdx], currentHp: mHp };
                }
              }
            });

            // Lvl 3: Chain Reaction - dead monsters explode
            if (mageLevel >= 3 && killedPositions.length > 0) {
              let chainQueue = [...killedPositions];
              const exploded = new Set(chainQueue.map((p) => `${p.x},${p.y}`));
              while (chainQueue.length > 0) {
                const nextQueue = [];
                for (const pos of chainQueue) {
                  const chainTiles = [
                    [-1, 0],
                    [1, 0],
                    [0, -1],
                    [0, 1],
                    [-1, -1],
                    [1, -1],
                    [-1, 1],
                    [1, 1],
                  ];
                  for (const [cx, cy] of chainTiles) {
                    const ex = pos.x + cx,
                      ey = pos.y + cy;
                    if (ex < 1 || ex > GRID_WIDTH || ey < 1 || ey > GRID_HEIGHT)
                      continue;
                    const cmIdx = newMonsters.findIndex(
                      (m) => m.currentHp > 0 && m.x === ex && m.y === ey
                    );
                    if (cmIdx >= 0) {
                      const cmHp = newMonsters[cmIdx].currentHp - fireballDmg;
                      spawnEffect(ex, ey, "✦", NEON.red, 300);
                      if (cmHp <= 0) {
                        spawnDeathEffect(ex, ey, newMonsters[cmIdx].color);
                        fireballGold +=
                          1 +
                          Math.floor(Math.random() * 2) +
                          Math.floor(levelRef.current / 6);
                        newMonsters[cmIdx] = {
                          ...newMonsters[cmIdx],
                          currentHp: 0,
                          x: -1,
                          y: -1,
                        };
                        const key = `${ex},${ey}`;
                        if (!exploded.has(key)) {
                          exploded.add(key);
                          nextQueue.push({ x: ex, y: ey });
                        }
                      } else {
                        newMonsters[cmIdx] = {
                          ...newMonsters[cmIdx],
                          currentHp: cmHp,
                        };
                      }
                    }
                  }
                }
                chainQueue = nextQueue;
              }
              if (killedPositions.length > 1) {
                showMessage("✦ CHAIN REACTION! ✦", NEON.red);
              }
            }

            if (fireballGold > 0) setGold((g) => g + fireballGold);
            showMessage("✦ FIREBALL! ✦", NEON.orange);
          } else {
            // Lvl 1: Classic Polymorph
            setTimeout(() => {
              spawnEffect(hitX, hitY, "◆", NEON.magenta, 400);
              const burst = [
                [-1, 0],
                [1, 0],
                [0, -1],
                [0, 1],
              ];
              burst.forEach(([bx, by]) => {
                const ex = hitX + bx,
                  ey = hitY + by;
                if (
                  ex >= 1 &&
                  ex <= GRID_WIDTH &&
                  ey >= 1 &&
                  ey <= GRID_HEIGHT
                ) {
                  spawnEffect(ex, ey, "✦", NEON.purple, 300);
                }
              });
            }, boltPath.length * 50 + 50);
            const weakerStats = getMonsterForLevel(
              Math.max(1, levelRef.current - 5)
            );
            newMonsters[hitIdx] = {
              ...weakerStats,
              x: newMonsters[hitIdx].x,
              y: newMonsters[hitIdx].y,
              currentHp: weakerStats.hp,
              zone: newMonsters[hitIdx].zone,
            };
            showMessage(`✦ POLYMORPH! HP:${weakerStats.hp} ✦`, NEON.magenta);
          }

          setMonsters(newMonsters);
          processMonsterTurn(newMonsters, null);
          return;
        } else {
          boltPath.push({ x: fx, y: fy });
        }
      }
      if (boltPath.length > 0)
        spawnProjectileTrail(boltPath, "✦", NEON.magenta);
      showMessage("◇ NO TARGET ◇", NEON.purple);
      processMonsterTurn(monstersRef.current, null);
    },
    [
      explodeBarrel,
      processMonsterTurn,
      showMessage,
      spawnProjectileTrail,
      spawnEffect,
      spawnDeathEffect,
      triggerShake,
    ]
  );

  const pray = useCallback(() => {
    const _currentClass = currentClassRef.current;
    const _player = playerRef.current;
    if (_currentClass === 3) {
      const _hp = hpRef.current;
      const _maxHp = maxHpRef.current;
      if (_hp >= _maxHp) {
        showMessage("◇ FULL HP ◇", NEON.white);
        return;
      }
      if (goldRef.current < 2) {
        showMessage("◇ NEED 2 GOLD ◇", NEON.red);
        return;
      }
      const priestLevel = unlockedGemsRef.current[1];
      const healAmt = priestLevel >= 2 ? 3 : 1;
      const newHp = Math.min(_maxHp, _hp + healAmt);

      const newGold = goldRef.current - 2;
      setHp(newHp);
      setGold(newGold);
      spawnHealEffect(_player.x, _player.y);
      showMessage(`✚ HEAL +${healAmt} (${newHp}/${_maxHp}) ✚`, NEON.white);

      // Priest Lvl 3: Sacred Nova - damage and knockback on 8 adjacent tiles
      if (priestLevel >= 3) {
        const novaDmg = weaponRef.current.dmg + dmgBonusRef.current;
        const _map = mapRef.current;
        let newMonsters = [...monstersRef.current];
        const novaBurst = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ];
        let novaGold = 0;
        novaBurst.forEach(([bx, by], i) => {
          const ex = _player.x + bx,
            ey = _player.y + by;
          if (ex >= 1 && ex <= GRID_WIDTH && ey >= 1 && ey <= GRID_HEIGHT) {
            setTimeout(() => spawnEffect(ex, ey, "✦", NEON.white, 300), i * 30);
            const mIdx = newMonsters.findIndex(
              (m) => m.currentHp > 0 && m.x === ex && m.y === ey
            );
            if (mIdx >= 0) {
              const m = newMonsters[mIdx];
              const mNewHp = m.currentHp - novaDmg;
              // Knockback: push 1 tile away from player
              let pushX = ex + bx,
                pushY = ey + by;
              const pushTile = _map[pushY]?.[pushX];
              const canPush =
                pushX >= 1 &&
                pushX <= GRID_WIDTH &&
                pushY >= 1 &&
                pushY <= GRID_HEIGHT &&
                pushTile !== TILE.WALL &&
                pushTile !== TILE.VOID &&
                !newMonsters.some(
                  (om) => om.currentHp > 0 && om.x === pushX && om.y === pushY
                );
              if (mNewHp <= 0) {
                spawnDeathEffect(ex, ey, m.color);
                novaGold +=
                  1 +
                  Math.floor(Math.random() * 2) +
                  Math.floor(levelRef.current / 6);
                newMonsters[mIdx] = { ...m, currentHp: 0, x: -1, y: -1 };
              } else {
                newMonsters[mIdx] = {
                  ...m,
                  currentHp: mNewHp,
                  x: canPush ? pushX : ex,
                  y: canPush ? pushY : ey,
                };
                if (canPush) spawnEffect(ex, ey, "»", NEON.white, 200);
              }
            }
          }
        });
        if (novaGold > 0) setGold((g) => g + novaGold);
        setMonsters(newMonsters);
        showMessage("✦ SACRED NOVA ✦", NEON.white);
      }
    } else {
      const _maxHp = maxHpRef.current;
      const _hp = hpRef.current;
      const dangerThreshold = Math.max(5, Math.floor(_maxHp * 0.3));
      if (prayerUsedRef.current || _hp < 1 || _hp > dangerThreshold) {
        showMessage("◇ NOTHING HAPPENS ◇", NEON.purple);
        return;
      }

      setPrayerUsed(true);
      setHp(_maxHp);
      spawnHealEffect(_player.x, _player.y);
      const burst = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ];
      burst.forEach(([dx, dy], i) => {
        const ex = _player.x + dx,
          ey = _player.y + dy;
        if (ex >= 1 && ex <= GRID_WIDTH && ey >= 1 && ey <= GRID_HEIGHT) {
          setTimeout(() => spawnEffect(ex, ey, "✦", NEON.cyan, 300), i * 30);
        }
      });
      showMessage("✦ DIVINE INTERVENTION ✦", NEON.cyan);
    }
    if (
      floorObjectiveRef.current?.type === "NO_PRAY" &&
      !prayedThisFloorRef.current
    ) {
      showMessage("◇ NO PRAY OBJECTIVE FAILED ◇", NEON.orange, 2200);
    }
    setPrayedThisFloor(true);
    processMonsterTurn(monstersRef.current, null);
  }, [
    processMonsterTurn,
    showMessage,
    spawnHealEffect,
    spawnEffect,
    spawnDeathEffect,
  ]);

  const teleport = useCallback(() => {
    const _stairsPos = stairsPosRef.current;
    const _tp1 = teleporter1Ref.current;
    const _tp2 = teleporter2Ref.current;
    const _player = playerRef.current;
    const _revealedZones = revealedZonesRef.current;
    const targets = [
      { pos: _stairsPos, active: true },
      { pos: _tp1, active: _tp1.active },
      { pos: _tp2, active: _tp2.active },
    ].filter((t) => t.active && _revealedZones.has(getZone(t.pos.x, t.pos.y)));
    if (targets.length === 0) {
      showMessage("◇ NO TARGETS ◇", NEON.purple);
      return;
    }
    const currentIdx = targets.findIndex(
      (t) => t.pos.x === _player.x && t.pos.y === _player.y
    );
    const target = targets[(currentIdx + 1) % targets.length];
    if (
      !monstersRef.current.some(
        (m) => m.currentHp > 0 && m.x === target.pos.x && m.y === target.pos.y
      )
    ) {
      const didTeleport =
        target.pos.x !== _player.x || target.pos.y !== _player.y;
      if (!didTeleport) return;

      if (
        floorObjectiveRef.current?.type === "NO_TELEPORT" &&
        !teleportedThisFloorRef.current
      ) {
        showMessage("NO TELEPORT OBJECTIVE FAILED", NEON.orange, 2200);
      }
      setTeleportedThisFloor(true);
      setPlayer({ x: target.pos.x, y: target.pos.y });
      const newZone = getZone(target.pos.x, target.pos.y);
      if (!_revealedZones.has(newZone)) {
        setRevealedZones((prev) => {
          const next = new Set(prev);
          next.add(newZone);
          return next;
        });
      }
    }
  }, [showMessage]);

  const useStairs = useCallback(() => {
    const _player = playerRef.current;
    const _stairsPos = stairsPosRef.current;
    const currentTile = mapRef.current[_player.y]?.[_player.x];
    const isOnStairs =
      currentTile === TILE.STAIRS ||
      currentTile === TILE.VAULT_STAIRS ||
      currentTile === TILE.BLUE_STAIRS;
    const isMainStairs = _player.x === _stairsPos.x && _player.y === _stairsPos.y;
    if (!isOnStairs) return;
    if (currentTile !== TILE.BLUE_STAIRS && !isMainStairs)
      return;

    // Overworld (level 0) → lancer le vrai jeu au niveau 1
    if (levelRef.current === 0) {
      if (surfaceDefenseActiveRef.current) {
        if (!surfaceDefenseReadyToReturnRef.current) {
          showMessage("◇ CLEAR THE CITY FIRST ◇", NEON.orange, 2200);
          return;
        }
        returnToDungeonAfterSurfaceDefenseRef.current();
        return;
      }
      showMessage("◆ ENTERING THE DUNGEON... ◆", OW_PALETTE.neonMagenta);
      setTimeout(() => startGameRef.current(), 600);
      return;
    }

    if (currentTile === TILE.BLUE_STAIRS) {
      enterSurfaceDefenseRef.current(levelRef.current);
      return;
    }

    if (keyNeededRef.current && !hasKeyRef.current) {
      showMessage("◆ LOCKED ◆", NEON.red);
      return;
    }
    // Si escalier doré → entrer dans la vault
    resolveFloorObjective();
    if (currentTile === TILE.VAULT_STAIRS) {
      nextLevel(true);
    } else {
      nextLevel();
    }
  }, [nextLevel, resolveFloorObjective, showMessage]);

  const switchClass = useCallback(
    (newClass) => {
      if (newClass === currentClassRef.current) return;
      const _gems = unlockedGemsRef.current;
      if (newClass === 2 && _gems[0] === 0) {
        showMessage("◇ NO GREEN GEM ◇", NEON.green);
        return;
      }
      if (newClass === 3 && _gems[1] === 0) {
        showMessage("◇ NO WHITE GEM ◇", NEON.white);
        return;
      }
      if (newClass === 4 && _gems[2] === 0) {
        showMessage("◇ NO RED GEM ◇", NEON.red);
        return;
      }
      if (newClass === 5 && _gems[3] === 0) {
        showMessage("◇ NO CYAN GEM ◇", NEON.cyan);
        return;
      }
      if (newClass === 6 && _gems[4] === 0) {
        showMessage("◇ NO BLUE GEM ◇", NEON.blue);
        return;
      }
      const _player = playerRef.current;
      if (
        mapRef.current[_player.y][_player.x] === TILE.VOID &&
        newClass !== 5
      ) {
        showMessage("◇ CAN'T SWITCH HERE ◇", NEON.red);
        return;
      }
      if (newClass === 4) {
        const berserkCost = _gems[2] >= 2 ? 10 : 20;
        if (hpRef.current <= berserkCost) {
          showMessage("◇ TOO WEAK ◇", NEON.red);
          return;
        }
        setHp((h) => h - berserkCost);
        triggerShake();
        const _p = playerRef.current;
        spawnEffect(_p.x, _p.y, "✸", NEON.red, 400);
        const burst = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ];
        burst.forEach(([bx, by], i) => {
          const ex = _p.x + bx,
            ey = _p.y + by;
          if (ex >= 1 && ex <= GRID_WIDTH && ey >= 1 && ey <= GRID_HEIGHT) {
            setTimeout(() => spawnEffect(ex, ey, "·", NEON.red, 200), i * 30);
          }
        });
        showMessage("◆ BERSERK MODE ◆", NEON.red);
      } else
        showMessage(`◆ ${CLASSES[newClass].name} ◆`, CLASSES[newClass].color);
      if (
        floorObjectiveRef.current?.type === "NO_SWITCH" &&
        !classSwitchedThisFloorRef.current
      ) {
        showMessage("NO CLASS SWAP OBJECTIVE FAILED", NEON.orange, 2200);
      }
      setClassSwitchedThisFloor(true);
      setCurrentClass(newClass);
    },
    [showMessage, triggerShake, spawnEffect]
  );

  const handleWeaponConfirm = useCallback(
    (accept) => {
      const _pending = pendingWeaponRef.current;
      if (accept && _pending) {
        setHasWeapon(true);
        setWeapon(_pending);
        const _player = playerRef.current;
        const newMap = [...mapRef.current];
        newMap[_player.y] = [...newMap[_player.y]];
        newMap[_player.y][_player.x] = TILE.FLOOR;
        setMap(newMap);

        // On utilise la même couleur dynamique pour le message d'équipement
        showMessage(
          `◆ ${_pending.name} EQUIPPED ◆`,
          getWeaponColor(_pending.dmg)
        );
        setPendingWeapon(null);
      }
      setShowConfirm(null);
    },
    [showMessage]
  );

  const handleArmorConfirm = useCallback(
    (accept) => {
      const _pending = pendingArmorRef.current;
      if (accept && _pending) {
        setEquippedArmorValue(_pending.ar);
        setEquippedArmorName(_pending.name);
        const _player = playerRef.current;
        const newMap = [...mapRef.current];
        newMap[_player.y] = [...newMap[_player.y]];
        newMap[_player.y][_player.x] = TILE.FLOOR;
        setMap(newMap);

        showMessage(
          `◆ ${_pending.name} EQUIPPED (AR:${_pending.ar}) ◆`,
          getArmorColor(_pending.ar)
        );
        setPendingArmor(null);
      }
      setShowConfirm(null);
    },
    [showMessage]
  );

  const handleBowConfirm = useCallback(
    (accept) => {
      const _pending = pendingBowRef.current;
      if (accept && _pending) {
        setHasBow(true);
        setBow(_pending);
        const _player = playerRef.current;
        const newMap = [...mapRef.current];
        newMap[_player.y] = [...newMap[_player.y]];
        newMap[_player.y][_player.x] = TILE.FLOOR;
        setMap(newMap);

        showMessage(
          `◆ ${_pending.name.toUpperCase()} (+${_pending.bonus}) EQUIPPED ◆`,
          getBowColor(_pending.bonus)
        );
        setPendingBow(null);
      }
      setShowConfirm(null);
    },
    [showMessage]
  );

  const handleVendorConfirm = useCallback(
    (accept) => {
      const _vendor = vendorScrollRef.current;
      if (accept && _vendor) {
        if (goldRef.current < _vendor.price) {
          showMessage("◇ NOT ENOUGH GOLD ◇", NEON.red);
          setShowConfirm(null);
          return;
        }
        setGold((g) => g - _vendor.price);

        const _maxHp = maxHpRef.current;
        const vendorEffectHandlers = {
          fullHp: () => {
            setHp(_maxHp);
            return "FULL HEAL";
          },
          maxHp5: () => {
            setMaxHp((m) => m + 5);
            setHp(_maxHp + 5);
            return "+5 MAX HP & FULL HEAL";
          },
          maxHp10: () => {
            setMaxHp((m) => m + 10);
            setHp(_maxHp + 10);
            return "+10 MAX HP & FULL HEAL";
          },
          maxHp15: () => {
            setMaxHp((m) => m + 15);
            setHp(_maxHp + 15);
            return "+15 MAX HP & FULL HEAL";
          },
          maxHp20: () => {
            setMaxHp((m) => m + 20);
            setHp(_maxHp + 20);
            return "+20 MAX HP & FULL HEAL";
          },
          maxHp30: () => {
            setMaxHp((m) => m + 30);
            setHp(_maxHp + 30);
            return "+30 MAX HP & FULL HEAL";
          },
          dmg10pct: () => {
            const bonus = Math.max(1, Math.round(weaponRef.current.dmg * 0.1));
            setDmgBonus((d) => d + bonus);
            return `+${bonus} DMG (PERMANENT)`;
          },
          armor10: () => {
            setArmorPermanent((a) => a + 10);
            return "+10 ARMOR (PERMANENT)";
          },
          armor1: () => {
            setArmorPermanent((a) => a + 1);
            return "+1 ARMOR (PERMANENT)";
          },
          armor2: () => {
            setArmorPermanent((a) => a + 2);
            return "+2 ARMOR (PERMANENT)";
          },
          armor3: () => {
            setArmorPermanent((a) => a + 3);
            return "+3 ARMOR (PERMANENT)";
          },
          armor4: () => {
            setArmorPermanent((a) => a + 4);
            return "+4 ARMOR (PERMANENT)";
          },
          armor5: () => {
            setArmorPermanent((a) => a + 5);
            return "+5 ARMOR (PERMANENT)";
          },
          dmg1: () => {
            setDmgBonus((d) => d + 1);
            return "+1 DMG (PERMANENT)";
          },
          dmg2: () => {
            setDmgBonus((d) => d + 2);
            return "+2 DMG (PERMANENT)";
          },
          dmg3: () => {
            setDmgBonus((d) => d + 3);
            return "+3 DMG (PERMANENT)";
          },
          dmg4: () => {
            setDmgBonus((d) => d + 4);
            return "+4 DMG (PERMANENT)";
          },
          dmg5: () => {
            setDmgBonus((d) => d + 5);
            return "+5 DMG (PERMANENT)";
          },
          gold2x: () => {
            setGold((g) => g * 2);
            return "GOLD DOUBLED";
          },
          masterTp: () => {
            setTeleporter1((t) => ({ ...t, active: true }));
            setTeleporter2((t) => ({ ...t, active: true }));
            return "TELEPORTERS ACTIVATED";
          },
          pact: () => {
            setDmgBonus((d) => d + 10);
            setMaxHp((m) => Math.max(1, m - 10));
            setHp((h) => Math.min(h, Math.max(1, _maxHp - 10)));
            return "+10 DMG / -10 MAX HP";
          },
          // === SACRIFICE ALTAR ===
          sacrifice: () => {
            const sType = _vendor.sacrificeType;
            const sAmt = _vendor.sacrificeAmt;
            const rType = _vendor.rewardType;
            const rAmt = _vendor.rewardAmt;
            // Appliquer le sacrifice
            if (sType === "maxHp") {
              setMaxHp((m) => Math.max(1, m - sAmt));
              setHp((h) => Math.min(h, Math.max(1, _maxHp - sAmt)));
            } else if (sType === "armor") {
              setArmorPermanent((a) => Math.max(0, a - sAmt));
            } else if (sType === "dmgBonus") {
              setDmgBonus((d) => Math.max(0, d - sAmt));
            }
            // Appliquer la récompense
            if (rType === "maxHp") {
              setMaxHp((m) => m + rAmt);
              setHp(_maxHp + rAmt);
            } else if (rType === "armor") {
              setArmorPermanent((a) => a + rAmt);
            } else if (rType === "dmgBonus") {
              setDmgBonus((d) => d + rAmt);
            }
            return _vendor.desc;
          },
          // === ECHO SHRINE (Lore) ===
          lore: () => {
            // Afficher le texte de lore comme message long
            if (_vendor.loreText) {
              showMessage(_vendor.loreText, "#00cccc", 6000);
            }
            // Appliquer le bonus
            const loreBonus = _vendor.loreBonus;
            if (loreBonus === "fullHeal") {
              setHp(_maxHp);
              return "FULL HEAL";
            } else if (loreBonus === "maxHp3") {
              setMaxHp((m) => m + 3);
              setHp(_maxHp + 3);
              return "+3 MAX HP & FULL HEAL";
            } else if (loreBonus === "maxHp5") {
              setMaxHp((m) => m + 5);
              setHp(_maxHp + 5);
              return "+5 MAX HP & FULL HEAL";
            } else if (loreBonus === "maxHp8") {
              setMaxHp((m) => m + 8);
              setHp(_maxHp + 8);
              return "+8 MAX HP & FULL HEAL";
            } else if (loreBonus === "dmg2") {
              setDmgBonus((d) => d + 2);
              return "+2 DMG (PERMANENT)";
            } else if (loreBonus === "dmg3") {
              setDmgBonus((d) => d + 3);
              return "+3 DMG (PERMANENT)";
            } else if (loreBonus === "dmg5") {
              setDmgBonus((d) => d + 5);
              return "+5 DMG (PERMANENT)";
            } else if (loreBonus === "armor2") {
              setArmorPermanent((a) => a + 2);
              return "+2 ARMOR (PERMANENT)";
            } else if (loreBonus === "armor3") {
              setArmorPermanent((a) => a + 3);
              return "+3 ARMOR (PERMANENT)";
            }
            return "KNOWLEDGE";
          },
        };

        const handler = vendorEffectHandlers[_vendor.effect];
        const effectMsg = handler ? handler() : _vendor.name.toUpperCase();
        const _player = playerRef.current;

        // Vendor purchase visual effect
        spawnEffect(_player.x, _player.y, "◆", NEON.purple, 400);
        const burst = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ];
        burst.forEach(([bx, by], i) => {
          const ex = _player.x + bx,
            ey = _player.y + by;
          if (ex >= 1 && ex <= GRID_WIDTH && ey >= 1 && ey <= GRID_HEIGHT) {
            setTimeout(
              () => spawnEffect(ex, ey, "✦", NEON.magenta, 200),
              i * 30
            );
          }
        });

        const newMap = [...mapRef.current];
        newMap[_player.y] = [...newMap[_player.y]];
        newMap[_player.y][_player.x] = TILE.FLOOR;
        setMap(newMap);

        showMessage(`◆ ${effectMsg} ◆`, NEON.magenta);
        setVendorScroll(null);
      }
      setShowConfirm(null);
    },
    [showMessage, spawnEffect]
  );

  const maybeSpawnSurfaceDefenseAccess = useCallback((lvl) => {
    if (lvl < 10) return false;
    if (floorsWithoutSurfaceDefenseRef.current >= 8) return true;
    return Math.random() < 0.05;
  }, [floorsWithoutSurfaceDefenseRef]);

  const getSurfaceCorruptionStage = useCallback((sourceLevel) => {
    if (sourceLevel >= 36) return 3;
    if (sourceLevel >= 21) return 2;
    if (sourceLevel >= 10) return 1;
    return 0;
  }, []);

  const convertOverworldTileToDungeon = useCallback((owTile, corruptionStage) => {
    switch (owTile) {
      case OW_TILE.VOID:
      case OW_TILE.SKY:
      case OW_TILE.STAR:
      case OW_TILE.BUILDING:
      case OW_TILE.LIT_WINDOW:
      case OW_TILE.NEON_SIGN:
      case OW_TILE.WATER:
      case OW_TILE.WALL_DETAIL:
      case OW_TILE.RAILING:
      case OW_TILE.AWNING:
      case OW_TILE.VENDING:
      case OW_TILE.AC_UNIT:
        return TILE.VOID;
      case OW_TILE.STREET:
      case OW_TILE.STREETLIGHT:
      case OW_TILE.DOOR:
      case OW_TILE.SAND:
        return TILE.CORRIDOR;
      case OW_TILE.PUDDLE:
        return corruptionStage >= 2 ? TILE.VOID_FLUX : TILE.CORRIDOR;
      case OW_TILE.STAIRS:
        return TILE.STAIRS;
      default:
        return TILE.VOID;
    }
  }, []);

  const enterSurfaceDefense = useCallback(
    (sourceLevel) => {
      const ow = generateOverworld();
      const corruptionStage = getSurfaceCorruptionStage(sourceLevel);
      const shiftedRawMap = Array(GRID_HEIGHT + 1)
        .fill(null)
        .map(() => Array(GRID_WIDTH + 1).fill(OW_TILE.VOID));
      for (let y = 0; y < ow.map.length; y++) {
        const row = ow.map[y] || [];
        for (let x = 0; x < row.length; x++) shiftedRawMap[y + 1][x + 1] = row[x];
      }

      const shiftedCoastLine = Array(GRID_WIDTH + 1).fill(GRID_HEIGHT);
      for (let x = 0; x < ow.coastLine.length; x++) {
        shiftedCoastLine[x + 1] = ow.coastLine[x] + 1;
      }

      const dungeonMap = shiftedRawMap.map((row) =>
        row.map((t) => convertOverworldTileToDungeon(t, corruptionStage))
      );
      const playerPos = { x: ow.playerPos.x + 1, y: ow.playerPos.y + 1 };

      const candidateTiles = [];
      for (let y = 1; y <= GRID_HEIGHT; y++) {
        for (let x = 1; x <= GRID_WIDTH; x++) {
          if (dungeonMap[y]?.[x] !== TILE.CORRIDOR) continue;
          const dist = Math.abs(x - playerPos.x) + Math.abs(y - playerPos.y);
          if (dist >= 8) candidateTiles.push({ x, y });
        }
      }

      const waveCount = Math.min(12, 3 + Math.floor(sourceLevel / 4));
      const waveMonsters = [];
      for (let i = 0; i < waveCount && candidateTiles.length > 0; i++) {
        const idx = Math.floor(Math.random() * candidateTiles.length);
        const pos = candidateTiles.splice(idx, 1)[0];
        const monsterStats = getMonsterForLevel(sourceLevel);
        waveMonsters.push({
          ...monsterStats,
          x: pos.x,
          y: pos.y,
          currentHp: monsterStats.hp,
          zone: getZone(pos.x, pos.y),
        });
      }

      setSurfaceDefenseActive(true);
      setSurfaceDefenseReadyToReturn(false);
      setSurfaceDefenseSourceLevel(sourceLevel);
      setSurfaceCorruptionStage(corruptionStage);
      setLevel(0);
      setMap(dungeonMap);
      setOverworldRawMap(shiftedRawMap);
      setOverworldCoastLine(shiftedCoastLine);
      setOverworldTick(0);
      setPlayer(playerPos);
      setStairsPos({ x: ow.stairsPos.x + 1, y: ow.stairsPos.y + 1 });
      setTeleporter1({ x: 0, y: 0, active: false });
      setTeleporter2({ x: 0, y: 0, active: false });
      setMonsters(waveMonsters);
      setPendingScroll(true);

      const allZones = new Set();
      for (let y = 1; y <= GRID_HEIGHT; y++) {
        for (let x = 1; x <= GRID_WIDTH; x++) allZones.add(getZone(x, y));
      }
      setRevealedZones(allZones);
      showMessage("⚠ SURGE DETECTED — DEFEND BETTIE'S APARTMENT ⚠", NEON.cyan, 4200);
      if (corruptionStage >= 3) {
        setTimeout(
          () =>
            showMessage(
              "⚠ KERNAL OVERRIDE — REALITY COLLAPSE ⚠",
              NEON.red,
              2600
            ),
          700
        );
      } else if (corruptionStage >= 2) {
        setTimeout(
          () => showMessage("⚠ MEMORY LEAK ON SURFACE ⚠", NEON.magenta, 2200),
          700
        );
      } else if (corruptionStage >= 1) {
        setTimeout(
          () => showMessage("⚠ SYSTEM INFECTION DETECTED ⚠", NEON.orange, 2200),
          700
        );
      }
    },
    [convertOverworldTileToDungeon, getSurfaceCorruptionStage, showMessage]
  );

  const returnToDungeonAfterSurfaceDefense = useCallback(() => {
    const sourceLevel = surfaceDefenseSourceLevelRef.current;
    if (!sourceLevel) return;
    const targetLevel = Math.min(50, sourceLevel + 1);
    const levelData = generateLevel(
      targetLevel,
      unlockedGemsRef.current,
      earnedBadgesRef.current.length,
      false,
      false
    );

    setLevel(targetLevel);
    setHasKey(false);
    setPrayerUsed(false);
    setFloorTurns(0);
    setPrayedThisFloor(false);
    setKillsThisFloor(0);
    setTerrainKillsThisFloor(0);
    setDashedThisFloor(false);
    setDamageTakenThisFloor(0);
    setTeleportedThisFloor(false);
    setClassSwitchedThisFloor(false);
    setGoldCollectedThisFloor(0);
    setZonesDiscoveredThisFloor(0);
    setTrapsSteppedThisFloor(false);
    setComboCount(0);
    setOverdriveTurns(0);
    setHasOverloadKey(false);
    setFireTimers(new Map());
    resetKillTrackingRef.current = true;
    resetDamageTrackingRef.current = true;
    resetGoldTrackingRef.current = true;
    resetZoneTrackingRef.current = true;
    deathInProgressRef.current = false;
    setMap(levelData.map);
    setPlayer(levelData.playerPos);
    setStairsPos(levelData.stairsPos);
    setTeleporter1(levelData.tp1);
    setTeleporter2(levelData.tp2);
    setMonsters(levelData.monsters);
    setFloorObjective(
      makeFloorObjective(
        targetLevel,
        false,
        levelData.monsters.length,
        levelData.totalZones
      )
    );
    setKeyNeeded(levelData.needKey);
    setVendorScroll(levelData.vendorData);
    setPendingWeapon(levelData.weaponData);
    setPendingArmor(levelData.armorData);
    setPendingBow(levelData.bowData);
    setGemOnMap(levelData.gemData);
    setRevealedZones(
      new Set([getZone(levelData.playerPos.x, levelData.playerPos.y)])
    );
    setOverworldRawMap(null);
    setSurfaceDefenseActive(false);
    setSurfaceDefenseReadyToReturn(false);
    setSurfaceDefenseSourceLevel(null);
    setSurfaceCorruptionStage(0);
    setFloorsWithoutSurfaceDefense(0);
    setPendingScroll(true);
    showMessage("◆ SURFACE SECURED — DESCENDING DEEPER ◆", NEON.cyan, 3200);
  }, [generateLevel, makeFloorObjective, showMessage, surfaceDefenseSourceLevelRef]);

  useEffect(() => {
    if (
      !surfaceDefenseActive ||
      level !== 0 ||
      surfaceDefenseReadyToReturn ||
      monsters.some((m) => m.currentHp > 0)
    ) {
      return;
    }

    const rewardWeapon = getWeaponForLevel(
      Math.max(1, surfaceDefenseSourceLevelRef.current || 1)
    );
    setHasWeapon(true);
    setWeapon(rewardWeapon);
    const healAmount = 6;
    setHp((currentHp) => Math.min(maxHpRef.current, currentHp + healAmount));
    setSurfaceDefenseReadyToReturn(true);
    showMessage(
      `◆ APARTMENT SECURED ◆ +${healAmount} HP + ${rewardWeapon.short}`,
      NEON.green,
      4200
    );
  }, [
    level,
    monsters,
    surfaceDefenseActive,
    surfaceDefenseReadyToReturn,
    surfaceDefenseSourceLevelRef,
    showMessage,
  ]);

  // ======== A1 : Les function refs restent pour le keydown handler (stable, []) ========
  movePlayerRef.current = movePlayer;
  useStairsRef.current = useStairs;
  teleportRef.current = teleport;
  prayRef.current = pray;
  switchClassRef.current = switchClass;
  fireBowRef.current = fireBow;
  polymorphRef.current = polymorph;
  handleWeaponConfirmRef.current = handleWeaponConfirm;
  handleArmorConfirmRef.current = handleArmorConfirm;
  handleBowConfirmRef.current = handleBowConfirm;
  handleVendorConfirmRef.current = handleVendorConfirm;
  startGameRef.current = startGame;
  enterOverworldRef.current = enterOverworld;
  maybeSpawnSurfaceDefenseAccessRef.current = maybeSpawnSurfaceDefenseAccess;
  enterSurfaceDefenseRef.current = enterSurfaceDefense;
  returnToDungeonAfterSurfaceDefenseRef.current =
    returnToDungeonAfterSurfaceDefense;
  processMonsterTurnRef.current = processMonsterTurn;

  // ======== BOSS VAULT : Auto-déblocage escalier quand tous les monstres sont morts ========
  useEffect(() => {
    if (!isSecretVault) return;
    const biome = activeBiome;
    if (!biome?.isBoss) return;
    const alive = monsters.filter((m) => m.currentHp > 0 && m.x > 0);
    if (alive.length === 0 && monsters.length > 0) {
      // Boss vaincu → débloquer l'escalier
      setHasKey(true);
      showMessage("◆ BOSS DEFEATED — EXIT UNLOCKED ◆", NEON.yellow, 4000);
    }
  }, [monsters, isSecretVault, activeBiome, showMessage]);

  // ============================================
  // CORRIDOR DASH — Déplacement rapide instantané + CHARGE ATTACK
  // Calcule le chemin en une passe synchrone. Si un monstre
  // bloque le chemin, le joueur s'arrête 1 case avant et inflige
  // [distance parcourue] dégâts de charge + repousse de 3 cases.
  // Chaque monstre ne peut être chargé qu'une seule fois.
  // ============================================
  const corridorDash = useCallback(
    (dx, dy) => {
      if (gameStateRef.current !== "playing") return;
      if (
        showConfirmRef.current ||
        showDirectionPickerRef.current ||
        showChallengeOverlayRef.current
      )
        return;
      if (deathInProgressRef.current || hpRef.current <= 0) return;

      const _map = mapRef.current;
      const _monsters = monstersRef.current;
      const _revealedZones = revealedZonesRef.current;
      const _currentClass = currentClassRef.current;
      let px = playerRef.current.x;
      let py = playerRef.current.y;

      const AUTO_PICKUP = DASH_AUTO_PICKUP;
      const STOP_BEFORE = DASH_STOP_BEFORE;
      const STOP_AFTER = DASH_STOP_AFTER;

      const path = []; // cases traversées (sans la position de départ)
      let stopTile = null;
      let chargeTarget = null; // monstre percuté par la charge

      // === Phase 1 : Calcul du chemin ===
      for (let step = 0; step < 50; step++) {
        const nx = px + dx;
        const ny = py + dy;

        // Hors limites
        if (nx < 1 || nx > GRID_WIDTH || ny < 1 || ny > GRID_HEIGHT) break;

        const tile = _map[ny]?.[nx];

        // Mur ou vide
        if (tile === TILE.WALL) break;
        if (tile === TILE.VOID && _currentClass !== 5) break;
        if (tile === TILE.VOID && _currentClass === 5) break;

        // Monstre en travers : CHARGE ATTACK si éligible
        const hitMonster = _monsters.find(
          (m) =>
            m.currentHp > 0 && m.x > 0 && m.y > 0 && m.x === nx && m.y === ny
        );
        if (hitMonster) {
          chargeTarget = { monster: hitMonster, x: nx, y: ny };
          break; // s'arrête avant le monstre
        }

        // Weapon/Armor/Vendor : arrêt AVANT (besoin de confirmation)
        if (STOP_BEFORE.has(tile)) break;

        // On avance sur cette case
        path.push({ x: nx, y: ny, tile });
        px = nx;
        py = ny;

        // Auto-pickup items : on continue à avancer
        if (AUTO_PICKUP.has(tile)) continue;

        // Stop-after items
        if (STOP_AFTER.has(tile)) {
          stopTile = tile;
          break;
        }

        // Flèche de passage
        if (passageArrowsRef.current.has(`${nx},${ny}`)) break;
      }

      // Rien à faire (même pas une charge)
      if (path.length === 0 && !chargeTarget) {
        showMessage("◇ BLOCKED ◇", NEON.purple);
        return;
      }

      if (
        floorObjectiveRef.current?.type === "NO_DASH" &&
        !dashedThisFloorRef.current
      ) {
        showMessage("◇ NO DASH OBJECTIVE FAILED ◇", NEON.orange, 2200);
      }
      setDashedThisFloor(true);

      // === Phase 2 : Appliquer les effets du chemin ===
      const stepsCount = path.length;
      const finalPos =
        path.length > 0 ? path[path.length - 1] : { x: px, y: py };
      let goldTotal = 0;
      const newMap = _map.map((row) => [...row]);
      const newRevealedZones = new Set(_revealedZones);
      let lastRevealedZone = null;

      for (const { x, y, tile } of path) {
        const zone = getZone(x, y);
        if (!newRevealedZones.has(zone)) {
          newRevealedZones.add(zone);
          lastRevealedZone = zone;
        }
        if (tile === TILE.GOLD) {
          const baseAmt = 1 + Math.floor(Math.random() * 6);
          const vaultMult = activeBiomeRef.current?.vaultGoldMultiplier || 1;
          goldTotal += baseAmt * vaultMult;
          newMap[y][x] = TILE.FLOOR;
        }
        if (tile === TILE.KEY) {
          setHasKey(true);
          newMap[y][x] = TILE.FLOOR;
        }
      }

      if (goldTotal > 0) setGold((g) => g + goldTotal);
      if (newRevealedZones.size !== _revealedZones.size) {
        setRevealedZones(newRevealedZones);
      }

      // Téléporter le joueur
      const el = mapContainerRef.current;
      if (el) {
        // On récupère les dimensions totales de la carte (qui incluent le zoom actuel)
        const totalWidth = el.scrollWidth;
        const totalHeight = el.scrollHeight;

        // On calcule la position en pixels de la case d'arrivée
        const pxX = ((finalPos.x - 0.5) / GRID_WIDTH) * totalWidth;
        const pxY = ((finalPos.y - 0.5) / GRID_HEIGHT) * totalHeight;

        // Marge de sécurité (en pixels) pour recentrer un peu avant que le joueur ne touche le bord absolu
        const margin = 40;

        // On vérifie si le joueur atterrit dans la fenêtre de vue actuelle
        const isVisible =
          pxX >= el.scrollLeft + margin &&
          pxX <= el.scrollLeft + el.clientWidth - margin &&
          pxY >= el.scrollTop + margin &&
          pxY <= el.scrollTop + el.clientHeight - margin;

        // On ne force le scroll auto QUE s'il sort de l'écran
        if (!isVisible) {
          setPendingScroll(true);
        }
      } else {
        setPendingScroll(true); // Sécurité au cas où la réf ne serait pas prête
      }

      setPlayer({ x: finalPos.x, y: finalPos.y });

      // Effet visuel : trail cyan sur le chemin
      path.forEach((pos, i) => {
        if (i < path.length - 1) {
          spawnEffect(pos.x, pos.y, "·", NEON.cyan, 200);
        }
      });

      // === Phase 3 : CHARGE ATTACK ===
      let newMonsters = [..._monsters];
      if (chargeTarget) {
        const { monster, x: mx, y: my } = chargeTarget;
        const monsterIdx = newMonsters.findIndex(
          (m) => m.currentHp > 0 && m.x === mx && m.y === my
        );

        if (monsterIdx < 0) {
          showMessage("◇ CHARGE MISSED ◇", NEON.purple);
        } else if (newMonsters[monsterIdx].dashCharged) {
          // Déjà chargé : on s'arrête juste devant, pas de dégâts
          showMessage(`◇ ${monster.name} BRACED ◇`, NEON.purple);
        } else {
          // Dégâts de charge = distance parcourue + 1 (la case d'élan minimum)
          const chargeDmg = stepsCount + 1;
          const newHp = newMonsters[monsterIdx].currentHp - chargeDmg;

          // Calcul du recul (3 cases dans la direction du dash)
          let pushX = mx,
            pushY = my;
          for (let p = 0; p < 3; p++) {
            const testX = pushX + dx;
            const testY = pushY + dy;
            if (
              testX < 1 ||
              testX > GRID_WIDTH ||
              testY < 1 ||
              testY > GRID_HEIGHT
            )
              break;
            const pushTile = newMap[testY]?.[testX];
            if (pushTile === TILE.WALL || pushTile === TILE.VOID) break;
            const occupied = newMonsters.some(
              (m, i2) =>
                i2 !== monsterIdx &&
                m.currentHp > 0 &&
                m.x === testX &&
                m.y === testY
            );
            if (occupied) break;
            pushX = testX;
            pushY = testY;
          }

          // Effet visuel de charge
          spawnEffect(mx, my, "✸", NEON.yellow, 300);
          if (pushX !== mx || pushY !== my) {
            // Trail de recul
            let trailX = mx,
              trailY = my;
            while (trailX !== pushX || trailY !== pushY) {
              trailX += dx;
              trailY += dy;
              if (trailX !== pushX || trailY !== pushY) {
                spawnEffect(trailX, trailY, "»", NEON.orange, 200);
              }
            }
            spawnEffect(pushX, pushY, "✦", NEON.orange, 350);
          }

          registerDashHitForCombo();

          if (newHp <= 0) {
            // Monstre tué par la charge
            const baseLoot = monster.isBoss
              ? 100
              : 1 + Math.floor(Math.random() * 3);
            const loot = monster.isBoss
              ? baseLoot
              : baseLoot + Math.floor(levelRef.current / 5);
            setGold((g) => g + loot);
            spawnDeathEffect(pushX, pushY, monster.color);
            newMonsters[monsterIdx] = {
              ...newMonsters[monsterIdx],
              currentHp: 0,
              x: -1,
              y: -1,
              dashCharged: true,
            };
            showMessage(
              `» CHARGE ${
                stepsCount + 1
              } ★ ${monster.name.toUpperCase()} KILLED +${loot}G ★`,
              NEON.yellow
            );
          } else {
            // Monstre repoussé et endommagé
            newMonsters[monsterIdx] = {
              ...newMonsters[monsterIdx],
              currentHp: newHp,
              x: pushX,
              y: pushY,
              zone: getZone(pushX, pushY),
              dashCharged: true,
            };
            showMessage(
              `» CHARGE ${stepsCount + 1} DMG! ${monster.name} ${newHp}/${
                monster.hp
              } HP ◄`,
              NEON.orange
            );
          }
        }
        setMonsters(newMonsters);
        triggerShake();
      } else {
        // Message récapitulatif (pas de charge)
        if (goldTotal > 0) {
          showMessage(`» DASH ${stepsCount} +${goldTotal}G »`, NEON.cyan);
        } else if (stepsCount > 0) {
          showMessage(`» DASH ${stepsCount} »`, NEON.cyan);
        }
      }
      // === Phase 5 : Interaction tile d'arrivée ===
      if (stopTile === TILE.POTION) {
        const p = POTIONS[Math.floor(Math.random() * 4)];
        spawnEffect(finalPos.x, finalPos.y, "!", NEON.cyan, 300);
        if (p.effect === "hp") {
          setHp((h) => Math.min(h + p.value, maxHpRef.current));
          spawnHealEffect(finalPos.x, finalPos.y);
          showMessage(`◆ ${p.name} +${p.value} HP ◆`, NEON.cyan);
        } else if (p.effect === "maxHp") {
          setMaxHp((m) => m + p.value);
          setHp(maxHpRef.current + p.value);
          spawnHealEffect(finalPos.x, finalPos.y);
          showMessage(
            `◆ ${p.name} +${p.value} MAX HP & FULL HEAL ◆`,
            NEON.cyan
          );
        } else if (p.effect === "armor") {
          setArmorPermanent((a) => a + p.value);
          showMessage(`◆ ${p.name} +${p.value} ARMOR (PERMANENT) ◆`, NEON.cyan);
        } else if (p.effect === "dmgBonus") {
          setDmgBonus((d) => d + p.value);
          showMessage(`◆ ${p.name} +${p.value} DMG (PERMANENT) ◆`, NEON.cyan);
        }
        newMap[finalPos.y][finalPos.x] = TILE.FLOOR;
      }
      if (stopTile === TILE.SCROLL) {
        setRevealedZones(new Set(Array.from({ length: 15 }, (_, i) => i + 1)));
        spawnEffect(finalPos.x, finalPos.y, "?", NEON.magenta, 400);
        showMessage("◆ MAP REVEALED ◆", NEON.magenta);
        newMap[finalPos.y][finalPos.x] = TILE.FLOOR;
      }
      if (stopTile === TILE.TELEPORTER) {
        const _tp1 = teleporter1Ref.current;
        const _tp2 = teleporter2Ref.current;
        // Effet burst autour du joueur (visible même si le joueur est sur la case)
        const tpBurst = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ];
        if (finalPos.x === _tp1.x && finalPos.y === _tp1.y && !_tp1.active) {
          setTeleporter1((t) => ({ ...t, active: true }));
          tpBurst.forEach(([bx, by], i) => {
            const ex = finalPos.x + bx,
              ey = finalPos.y + by;
            if (ex >= 1 && ex <= GRID_WIDTH && ey >= 1 && ey <= GRID_HEIGHT) {
              setTimeout(
                () => spawnEffect(ex, ey, "◈", NEON.cyan, 300),
                i * 40
              );
            }
          });
          showMessage("◆ TELEPORTER 1 ON ◆", NEON.cyan);
        }
        if (finalPos.x === _tp2.x && finalPos.y === _tp2.y && !_tp2.active) {
          setTeleporter2((t) => ({ ...t, active: true }));
          tpBurst.forEach(([bx, by], i) => {
            const ex = finalPos.x + bx,
              ey = finalPos.y + by;
            if (ex >= 1 && ex <= GRID_WIDTH && ey >= 1 && ey <= GRID_HEIGHT) {
              setTimeout(
                () => spawnEffect(ex, ey, "◈", NEON.cyan, 300),
                i * 40
              );
            }
          });
          showMessage("◆ TELEPORTER 2 ON ◆", NEON.cyan);
        }
      }
      if (stopTile === TILE.GEM && gemOnMapRef.current) {
        const _gem = gemOnMapRef.current;
        const newGems = [...unlockedGemsRef.current];
        const prevLevel = newGems[_gem.idx];
        newGems[_gem.idx] = Math.min(3, newGems[_gem.idx] + 1);
        setUnlockedGems(newGems);
        spawnEffect(finalPos.x, finalPos.y, "◆", _gem.color, 500);
        const burst = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ];
        burst.forEach(([bx, by], i) => {
          const ex = finalPos.x + bx,
            ey = finalPos.y + by;
          if (ex >= 1 && ex <= GRID_WIDTH && ey >= 1 && ey <= GRID_HEIGHT) {
            setTimeout(() => spawnEffect(ex, ey, "✦", _gem.color, 300), i * 40);
          }
        });
        const gemMsg =
          prevLevel === 0
            ? `★ ${_gem.name} - ${_gem.unlock} UNLOCKED ★`
            : `★ ${_gem.name} - ${_gem.unlock} LEVEL UP! (Lvl ${
                newGems[_gem.idx]
              }) ★`;
        showMessage(gemMsg, _gem.color, 4000);
        newMap[finalPos.y][finalPos.x] = TILE.FLOOR;
        setGemOnMap(null);
      }
      if (
        stopTile === TILE.STAIRS ||
        stopTile === TILE.VAULT_STAIRS ||
        stopTile === TILE.BLUE_STAIRS
      ) {
        // Le joueur est sur l'escalier, il pourra appuyer sur DOWN
      }
      if (stopTile === TILE.PRINCESS) {
        setMap(newMap);
        setGameState("victory");
        return;
      }

      setMap(newMap);

      // === Phase 4 : Tour monstres ===
      processMonsterTurn(
        chargeTarget ? newMonsters : _monsters,
        lastRevealedZone,
        { x: finalPos.x, y: finalPos.y }
      );
    },
    [
      processMonsterTurn,
      registerDashHitForCombo,
      showMessage,
      spawnEffect,
      spawnHealEffect,
      spawnDeathEffect,
      triggerShake,
    ]
  );

  corridorDashRef.current = corridorDash;

  // ======== DESTINATION AUTO-PATH EXECUTION ========
  const cancelAutoPath = useCallback(() => {
    if (autoPathRef.current) {
      clearTimeout(autoPathRef.current.timerId);
      autoPathRef.current = null;
    }
    setDestinationMode(false);
    setDestinationTarget(null);
    setDestinationPath(null);
  }, []);

  const cancelAutoPathRef = useRef(cancelAutoPath);
  cancelAutoPathRef.current = cancelAutoPath;

  const executeAutoPath = useCallback(
    (path) => {
      if (!path || path.length === 0) {
        cancelAutoPathRef.current();
        return;
      }
      const state = { path, step: 0, timerId: null, hpBefore: hpRef.current };
      autoPathRef.current = state;
      setDestinationTarget(path[path.length - 1]);
      setDestinationPath(null);

      const advance = () => {
        const ap = autoPathRef.current;
        if (!ap || ap !== state) return;
        if (ap.step >= ap.path.length) {
          cancelAutoPathRef.current();
          showMessage("◆ ARRIVED ◆", NEON.green);
          return;
        }
        const gs = gameStateRef.current;
        if (gs !== "playing") {
          cancelAutoPathRef.current();
          return;
        }
        if (deathInProgressRef.current) {
          cancelAutoPathRef.current();
          return;
        }
        if (showConfirmRef.current) {
          cancelAutoPathRef.current();
          return;
        }
        if (hpRef.current < ap.hpBefore) {
          cancelAutoPathRef.current();
          showMessage("◇ PATH INTERRUPTED ◇", NEON.orange);
          return;
        }
        ap.hpBefore = hpRef.current;

        const next = ap.path[ap.step];
        const prev = ap.step === 0 ? playerRef.current : ap.path[ap.step - 1];
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;

        const tileNext = mapRef.current[next.y]?.[next.x];
        if (!isWalkable(tileNext)) {
          cancelAutoPathRef.current();
          showMessage("◇ PATH BLOCKED ◇", NEON.orange);
          return;
        }
        const monsterBlock = monstersRef.current.find(
          (m) => m.currentHp > 0 && m.x === next.x && m.y === next.y
        );
        if (monsterBlock) {
          cancelAutoPathRef.current();
          showMessage("◇ ENEMY AHEAD ◇", NEON.red);
          return;
        }

        movePlayerRef.current(dx, dy);
        ap.step++;

        ap.timerId = setTimeout(() => {
          if (showConfirmRef.current || gameStateRef.current !== "playing") {
            cancelAutoPathRef.current();
            return;
          }
          advance();
        }, 120);
      };

      state.timerId = setTimeout(advance, 80);
    },
    [showMessage]
  );

  const executeAutoPathRef = useRef(executeAutoPath);
  executeAutoPathRef.current = executeAutoPath;

  const goToLore = useCallback(() => {
    setGameState((prev) => (prev === "title" ? "lore" : prev));
  }, []);

  const skipIntroToGame = useCallback(() => {
    enterOverworldRef.current();
  }, []);

  // ======================================================================================

  useEffect(() => {
    const handleKeyDown = (e) => {
      const gs = gameStateRef.current;
      if (gs === "title") {
        goToLore();
        return;
      }
      if (gs === "lore") {
        skipIntroToGame();
        return;
      }
      if (gs === "gameover" || gs === "victory") {
        setGameState("title");
        return;
      }

      const gameKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "];
      const gameNumpads = [
        "Numpad1",
        "Numpad2",
        "Numpad3",
        "Numpad4",
        "Numpad5",
        "Numpad6",
        "Numpad7",
        "Numpad8",
        "Numpad9",
      ];
      if (gameKeys.includes(e.key) || gameNumpads.includes(e.code)) {
        e.preventDefault();
      }

      if (showChallengeOverlayRef.current) {
        setShowChallengeOverlay(false);
        return;
      }

      const dirPicker = showDirectionPickerRef.current;
      if (dirPicker) {
        let dx = 0,
          dy = 0;
        if (e.key === "ArrowLeft" || e.code === "Numpad4") dx = -1;
        if (e.key === "ArrowRight" || e.code === "Numpad6") dx = 1;
        if (e.key === "ArrowUp" || e.code === "Numpad8") dy = -1;
        if (e.key === "ArrowDown" || e.code === "Numpad2") dy = 1;
        if (e.key === "Escape" || e.code === "Numpad5") {
          setShowDirectionPicker(null);
          return;
        }
        if (dx !== 0 || dy !== 0) {
          if (dirPicker === "bow") fireBowRef.current(dx, dy);
          if (dirPicker === "polymorph") polymorphRef.current(dx, dy);
          setShowDirectionPicker(null);
        }
        return;
      }

      const confirm = showConfirmRef.current;
      if (confirm) {
        if (e.key === "y" || e.key === "Y") {
          if (confirm.type === "weapon") handleWeaponConfirmRef.current(true);
          if (confirm.type === "armor") handleArmorConfirmRef.current(true);
          if (confirm.type === "bow") handleBowConfirmRef.current(true);
          if (confirm.type === "vendor") handleVendorConfirmRef.current(true);
        }
        if (e.key === "n" || e.key === "N" || e.key === "Escape") {
          if (confirm.type === "weapon") handleWeaponConfirmRef.current(false);
          if (confirm.type === "armor") handleArmorConfirmRef.current(false);
          if (confirm.type === "bow") handleBowConfirmRef.current(false);
          if (confirm.type === "vendor") handleVendorConfirmRef.current(false);
        }
        return;
      }

      let dx = 0,
        dy = 0;
      if (e.key === "ArrowLeft" || e.code === "Numpad4") {
        dx = -1;
        dy = 0;
      } else if (e.key === "ArrowRight" || e.code === "Numpad6") {
        dx = 1;
        dy = 0;
      } else if (e.key === "ArrowUp" || e.code === "Numpad8") {
        dx = 0;
        dy = -1;
      } else if (e.key === "ArrowDown" || e.code === "Numpad2") {
        dx = 0;
        dy = 1;
      } else if (e.code === "Numpad7") {
        dx = -1;
        dy = -1;
      } else if (e.code === "Numpad9") {
        dx = 1;
        dy = -1;
      } else if (e.code === "Numpad1") {
        dx = -1;
        dy = 1;
      } else if (e.code === "Numpad3") {
        dx = 1;
        dy = 1;
      }

      if (dx !== 0 || dy !== 0) {
        if (e.ctrlKey) {
          corridorDashRef.current(dx, dy);
        } else {
          movePlayerRef.current(dx, dy);
        }
        return;
      }

      if (e.code === "Numpad5" || e.key === " ")
        processMonsterTurnRef.current(monstersRef.current, null);
      const cls = currentClassRef.current;
      const bow = hasBowRef.current;
      if (e.key === "f" || e.key === "F") {
        if (cls === 6) {
          setShowDirectionPicker("polymorph");
          setMsg({ text: "◆ CHOOSE DIRECTION ◆", color: NEON.magenta });
        } else if (bow && ![3, 4, 5, 6].includes(cls)) {
          setShowDirectionPicker("bow");
          setMsg({ text: "◆ CHOOSE DIRECTION ◆", color: NEON.green });
        }
      }
      if (e.key === "s" || e.key === "S") useStairsRef.current();
      if (e.key === "t" || e.key === "T") teleportRef.current();
      if (e.key === "r" || e.key === "R") prayRef.current();
      if (e.code === "Digit1") switchClassRef.current(1);
      if (e.code === "Digit2") switchClassRef.current(2);
      if (e.code === "Digit3") switchClassRef.current(3);
      if (e.code === "Digit4") switchClassRef.current(4);
      if (e.code === "Digit5") switchClassRef.current(5);
      if (e.code === "Digit6") switchClassRef.current(6);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [skipIntroToGame, goToLore]);

  // ======== MONSTER INSPECT: Helper to get tile coords from pointer event ========
  const hoveredMonsterRef = useRef(null);

  const getTileFromPointer = useCallback((e) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const styles = window.getComputedStyle(target);
    const pL = parseFloat(styles.paddingLeft) || 0;
    const pR = parseFloat(styles.paddingRight) || 0;
    const pT = parseFloat(styles.paddingTop) || 0;
    const pB = parseFloat(styles.paddingBottom) || 0;
    const cW = Math.max(1, rect.width - pL - pR);
    const cH = Math.max(1, rect.height - pT - pB);
    const rX = Math.min(Math.max(0, e.clientX - rect.left - pL), cW - 1);
    const rY = Math.min(Math.max(0, e.clientY - rect.top - pT), cH - 1);
    return {
      tx: Math.floor((rX / cW) * GRID_WIDTH) + 1,
      ty: Math.floor((rY / cH) * GRID_HEIGHT) + 1,
    };
  }, []);

  const handleGridHover = useCallback(
    (e) => {
      const { tx, ty } = getTileFromPointer(e);
      const key = `${tx},${ty}`;
      const monster = monstersRef.current.find(
        (m) => m.x === tx && m.y === ty && m.currentHp > 0
      );
      const zone = getZone(tx, ty);
      if (monster && revealedZonesRef.current.has(zone)) {
        if (hoveredMonsterRef.current !== key) {
          hoveredMonsterRef.current = key;
          showMessage(
            `◆ ${monster.name.toUpperCase()} — HP ${monster.currentHp}/${
              monster.hp
            } ◆`,
            monster.color,
            60000
          );
        }
      } else if (hoveredMonsterRef.current) {
        hoveredMonsterRef.current = null;
      }
    },
    [getTileFromPointer, showMessage]
  );

  const handleGridClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const styles = window.getComputedStyle(e.currentTarget);
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const paddingTop = parseFloat(styles.paddingTop) || 0;
    const paddingBottom = parseFloat(styles.paddingBottom) || 0;

    const contentWidth = Math.max(1, rect.width - paddingLeft - paddingRight);
    const contentHeight = Math.max(1, rect.height - paddingTop - paddingBottom);
    const relativeX = Math.min(
      Math.max(0, e.clientX - rect.left - paddingLeft),
      contentWidth - 1
    );
    const relativeY = Math.min(
      Math.max(0, e.clientY - rect.top - paddingTop),
      contentHeight - 1
    );

    const tx = Math.floor((relativeX / contentWidth) * GRID_WIDTH) + 1;
    const ty = Math.floor((relativeY / contentHeight) * GRID_HEIGHT) + 1;

    // ======== MONSTER INSPECT: tap on a non-adjacent monster = show info ========
    const tappedMonster = monstersRef.current.find(
      (m) => m.x === tx && m.y === ty && m.currentHp > 0
    );
    if (tappedMonster) {
      const zone = getZone(tx, ty);
      if (revealedZonesRef.current.has(zone)) {
        const px = playerRef.current.x;
        const py = playerRef.current.y;
        const dist = Math.max(Math.abs(tx - px), Math.abs(ty - py));
        if (dist > 1) {
          showMessage(
            `◆ ${tappedMonster.name.toUpperCase()} — HP ${
              tappedMonster.currentHp
            }/${tappedMonster.hp} ◆`,
            tappedMonster.color
          );
          return;
        }
      }
    }

    // ======== DESTINATION MODE: tap = select target, compute path, execute ========
    if (destinationModeRef.current) {
      if (autoPathRef.current) {
        cancelAutoPathRef.current();
        showMessage("◇ PATH CANCELLED ◇", NEON.purple);
        return;
      }
      const px = playerRef.current.x;
      const py = playerRef.current.y;
      if (tx === px && ty === py) {
        cancelAutoPathRef.current();
        return;
      }
      const path = findPath(
        px,
        py,
        tx,
        ty,
        mapRef.current,
        monstersRef.current,
        revealedZonesRef.current
      );
      if (!path || path.length === 0) {
        showMessage("◇ NO PATH ◇", NEON.red);
        cancelAutoPathRef.current();
        return;
      }
      executeAutoPathRef.current(path);
      return;
    }

    if (autoPathRef.current) {
      cancelAutoPathRef.current();
      showMessage("◇ PATH CANCELLED ◇", NEON.purple);
      return;
    }

    const dx = tx - playerRef.current.x;
    const dy = ty - playerRef.current.y;

    if (dx === 0 && dy === 0) {
      if (showDirectionPickerRef.current) {
        setShowDirectionPicker(null);
        return;
      }
      processMonsterTurnRef.current(monstersRef.current, null);
      return;
    }

    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    if (showDirectionPickerRef.current) {
      let fireDx = 0,
        fireDy = 0;
      if (angle > -45 && angle <= 45) fireDx = 1;
      else if (angle > 45 && angle <= 135) fireDy = 1;
      else if (angle > 135 || angle <= -135) fireDx = -1;
      else if (angle > -135 && angle <= -45) fireDy = -1;

      if (showDirectionPickerRef.current === "bow")
        fireBowRef.current(fireDx, fireDy);
      if (showDirectionPickerRef.current === "polymorph")
        polymorphRef.current(fireDx, fireDy);

      setShowDirectionPicker(null);
      return;
    }

    let moveX = Math.sign(dx);
    let moveY = Math.sign(dy);

    // Reduce diagonal sensitivity: require one axis to be significantly larger
    if (moveX !== 0 && moveY !== 0) {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (absDx > 2.5 * absDy) moveY = 0;
      else if (absDy > 2.5 * absDx) moveX = 0;
    }

    if (fastTravelArmedRef.current) {
      setFastTravelArmed(false);
      corridorDashRef.current(moveX, moveY);
      return;
    }

    movePlayerRef.current(moveX, moveY);
  }, []);

  const biome = isSecretVault && activeBiome ? activeBiome : getBiome(level);
  const windowBorderColor =
    level === 0 ? "#0077bb" : level <= 5 ? "#0077bb" : biome.corridorColor;

  const activeMonstersMap = useMemo(() => {
    const lookup = new Map();
    monsters.forEach((monster) => {
      if (monster.currentHp > 0 && monster.x > 0 && monster.y > 0) {
        lookup.set(`${monster.x},${monster.y}`, monster);
      }
    });
    return lookup;
  }, [monsters]);

  const transmuterVoidCost = currentClass === 5 && unlockedGems[3] >= 2 ? 1 : 2;
  const isVoidDanger =
    currentClass === 5 &&
    map[player.y]?.[player.x] === TILE.VOID &&
    gold <= transmuterVoidCost * 3;

  const objectiveStats = {
    turns: floorTurns,
    prayed: prayedThisFloor,
    kills: killsThisFloor,
    terrainKills: terrainKillsThisFloor,
    trapsStepped: trapsSteppedThisFloor,
    dashed: dashedThisFloor,
    damageTaken: damageTakenThisFloor,
    teleported: teleportedThisFloor,
    classSwitched: classSwitchedThisFloor,
    goldCollected: goldCollectedThisFloor,
    zonesDiscovered: zonesDiscoveredThisFloor,
  };
  const objectiveProgress = floorObjective
    ? getObjectiveProgressText(floorObjective, objectiveStats)
    : "";
  const challengeOverlayTitle =
    isMobile && floorObjective?.mobileLabel
      ? floorObjective.mobileLabel
      : floorObjective?.label || "";
  const challengeOverlayDetail =
    isMobile &&
    floorObjective?.mobileLabel &&
    floorObjective?.label &&
    floorObjective.mobileLabel !== floorObjective.label
      ? floorObjective.label
      : null;

  // ======== QUICK WIN #9 : Cache renderTileData par biome ========
  const gemColor = gemOnMap?.color || NEON.white;
  const tileCache = useMemo(() => {
    const cache = {};
    for (const key of Object.keys(TILE)) {
      cache[TILE[key]] = renderTileData(TILE[key], biome, gemColor);
    }
    return cache;
  }, [biome, gemColor]);
  // ===============================================================

  // ============================================
  // OPTIMISATION 1 : Grille pré-calculée en 2 couches
  // baseGrid = tiles statiques (ne change que quand map/revealedZones changent)
  // gridData = baseGrid + overlay dynamique (player, monstres, effets, flèches)
  // ============================================
  const baseGrid = useMemo(() => {
    const hidden = { char: " ", color: "#000", glow: "none", animation: null };
    const isOverworld = level === 0 && overworldRawMap;
    const grid = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      const row = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        const realX = x + 1,
          realY = y + 1;
        const zone = getZone(realX, realY);
        if (!revealedZones.has(zone)) {
          row.push(hidden);
          continue;
        }

        // ======== OVERWORLD : rendu via getTileRender (position-dependent) ========
        if (isOverworld) {
          const rendered = getOverworldTileRender(
            overworldRawMap,
            realX,
            realY,
            overworldTick,
            overworldCoastLine,
            [],
            { corruptionStage: surfaceCorruptionStageRef.current }
          );
          // Escalier overworld : flash rapide pour être visible de loin
          const isStairs = overworldRawMap[realY]?.[realX] === OW_TILE.STAIRS;
          row.push({
            char: rendered.char,
            color: isStairs ? "#ffffff" : rendered.color,
            bg: rendered.bg || null,
            glow: isStairs ? glowStyle("#ffffff") : rendered.glow || "none",
            animation: isStairs
              ? "flash 0.7s ease-in-out infinite"
              : rendered.animClass
              ? "glow 2s ease-in-out infinite"
              : null,
          });
          continue;
        }

        const tile = map[realY]?.[realX] ?? TILE.VOID;
        const rendered = tileCache[tile] || tileCache[TILE.VOID];

        // Variance visuelle pour les tuiles de sol uniquement
        // (glyphe déterministe par coordonnée + micro-variance de luminosité)
        let char = rendered.char;
        let color = rendered.color;
        if (tile === TILE.FLOOR && biome.floorChars) {
          const chars = biome.floorChars;
          char = chars[(realX * 7 + realY * 13) % chars.length];
          // Variance de luminosité : ~15% des tiles plus sombres, ~10% légèrement plus claires
          const v = (realX * 3 + realY * 17) % 20;
          if (v < 3) {
            // Tile sombre : atténue à 55%
            const r = parseInt(biome.floorColor.slice(1, 3), 16);
            const g = parseInt(biome.floorColor.slice(3, 5), 16);
            const b = parseInt(biome.floorColor.slice(5, 7), 16);
            color = `rgb(${Math.round(r * 0.55)},${Math.round(
              g * 0.55
            )},${Math.round(b * 0.55)})`;
          } else if (v >= 18) {
            // Tile lumineuse : léger blend vers corridorColor
            const r1 = parseInt(biome.floorColor.slice(1, 3), 16),
              g1 = parseInt(biome.floorColor.slice(3, 5), 16),
              b1 = parseInt(biome.floorColor.slice(5, 7), 16);
            const r2 = parseInt(biome.corridorColor.slice(1, 3), 16),
              g2 = parseInt(biome.corridorColor.slice(3, 5), 16),
              b2 = parseInt(biome.corridorColor.slice(5, 7), 16);
            color = `rgb(${Math.round(r1 + (r2 - r1) * 0.22)},${Math.round(
              g1 + (g2 - g1) * 0.22
            )},${Math.round(b1 + (b2 - b1) * 0.22)})`;
          }
        }

        row.push({
          char,
          color,
          glow: rendered.glow,
          animation: rendered.flash ? "flash 0.5s ease-in-out infinite" : null,
        });
      }
      grid.push(row);
    }
    return grid;
  }, [
    map,
    revealedZones,
    tileCache,
    level,
    overworldRawMap,
    overworldTick,
    overworldCoastLine,
    surfaceCorruptionStage,
  ]);

  const gridData = useMemo(() => {
    const classColor = CLASSES[currentClass].color;
    const classGlow = CLASSES[currentClass].glow;

    const grid = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      const baseRow = baseGrid[y];
      const row = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        const realX = x + 1,
          realY = y + 1;
        const tileKey = `${realX},${realY}`;

        // Joueur
        if (player.x === realX && player.y === realY) {
          const underPlayer = baseRow?.[x];
          row.push({
            char: "@",
            color: classColor,
            bg: level === 0 && underPlayer?.bg ? underPlayer.bg : undefined,
            glow: classGlow,
            animation: "glow 1s ease-in-out infinite",
          });
          continue;
        }

        // Effet temporaire (combat, projectile...)
        const effect = tileEffects.get(tileKey);
        if (effect) {
          row.push({
            char: effect.char,
            color: effect.color,
            glow: `0 0 8px ${effect.color}, 0 0 16px ${effect.color}`,
            animation: "effectPop 0.3s ease-out",
          });
          continue;
        }

        // Monstre
        const zone = getZone(realX, realY);
        const isRevealed = revealedZones.has(zone);
        const monster = activeMonstersMap.get(tileKey);
        if (monster && isRevealed) {
          row.push({
            char: monster.char,
            color: monster.color,
            glow: `0 0 5px ${monster.color}, 0 0 10px ${monster.color}`,
            animation: null,
          });
          continue;
        }

        // Flèche de passage inexploré
        const arrow = passageArrows.get(tileKey);
        if (arrow && isRevealed) {
          row.push({
            char: arrow,
            color: NEON.lime,
            glow: `0 0 8px ${NEON.lime}, 0 0 16px ${NEON.lime}`,
            animation: "flash 0.6s ease-in-out infinite",
          });
          continue;
        }

        // Destination target marker (pulsing ◎)
        if (
          destinationTarget &&
          realX === destinationTarget.x &&
          realY === destinationTarget.y
        ) {
          row.push({
            char: "◎",
            color: NEON.green,
            glow: `0 0 10px ${NEON.green}, 0 0 20px ${NEON.green}`,
            animation: "glow 0.8s ease-in-out infinite",
          });
          continue;
        }

        // Destination path preview dots
        if (
          destinationPath &&
          destinationPath.some((pt) => pt.x === realX && pt.y === realY)
        ) {
          row.push({
            char: "·",
            color: NEON.green,
            glow: `0 0 4px ${NEON.green}`,
            animation: "flash 1s ease-in-out infinite",
          });
          continue;
        }

        // Base tile (pre-calculated)
        row.push(baseRow[x]);
      }
      grid.push(row);
    }
    return grid;
  }, [
    baseGrid,
    player,
    currentClass,
    tileEffects,
    activeMonstersMap,
    passageArrows,
    revealedZones,
    destinationTarget,
    destinationPath,
  ]);

  return (
    <div
      className="root-container"
      style={{
        minHeight: "100vh",
        background:
          gameState === "playing" && !showLevelTransition
            ? `linear-gradient(180deg, ${biome?.bgFrom || "#0a0010"} 0%, ${
                biome?.bgTo || "#1a0030"
              } 50%, ${biome?.bgFrom || "#0a0020"} 100%)`
            : "linear-gradient(180deg, #0a0010 0%, #1a0030 50%, #0a0020 100%)",
        fontFamily: '"Share Tech Mono", "Courier New", monospace',
        color: NEON.white,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "10px",
        touchAction: "manipulation",
        userSelect: "none",
        position: "relative",
        overflow: "hidden",
      }}
      ref={gameRef}
    >
      <style>{getGameStyles(windowBorderColor, NEON)}</style>

      <div
        className="grid-bg"
        style={{
          "--grid-color":
            gameState === "playing" && biome?.gridColor
              ? biome.gridColor
              : "255,42,109",
          transition: "all 2s ease",
        }}
      />
      <div className="horizon-line" />

      {/* TITLE SCREEN */}
      {gameState === "title" && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            zIndex: 5,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: "clamp(2.5rem, 10vw, 5rem)",
              fontWeight: 900,
              color: NEON.cyan,
              textShadow: `0 0 10px ${NEON.cyan}, 0 0 20px ${NEON.cyan}, 0 0 40px ${NEON.cyan}, 0 0 80px ${NEON.blue}`,
              letterSpacing: "0.2em",
              marginBottom: "10px",
              animation: "neonFlicker 3s ease-in-out infinite",
            }}
          >
            DOWNWARDS
          </div>

          <div
            style={{
              fontFamily: "Orbitron, sans-serif",
              fontSize: "clamp(0.8rem, 3vw, 1.2rem)",
              color: NEON.pink,
              textShadow: `0 0 10px ${NEON.pink}, 0 0 20px ${NEON.pink}`,
              letterSpacing: "0.5em",
              marginBottom: "60px",
            }}
          >
            OVERDRIVE ROGUE
          </div>

          <div
            style={{
              width: "200px",
              height: "3px",
              background: `linear-gradient(90deg, transparent, ${NEON.pink}, ${NEON.cyan}, ${NEON.pink}, transparent)`,
              margin: "0 auto 60px",
              boxShadow: `0 0 10px ${NEON.pink}`,
            }}
          />

          <button
            onClick={goToLore}
            style={{
              fontFamily: "Orbitron, sans-serif",
              background: "transparent",
              border: `2px solid ${NEON.cyan}`,
              color: NEON.cyan,
              padding: "20px 60px",
              fontSize: "1.2rem",
              letterSpacing: "0.3em",
              cursor: "pointer",
              position: "relative",
              textShadow: `0 0 10px ${NEON.cyan}`,
              boxShadow: `0 0 10px ${NEON.cyan}, inset 0 0 10px rgba(5,217,232,0.1)`,
              transition: "all 0.3s ease",
              animation: "borderGlow 2s ease-in-out infinite",
            }}
          >
            ▶ INSERT COIN
          </button>

          <div
            style={{
              marginTop: "60px",
              color: NEON.purple,
              fontSize: "0.8rem",
              textShadow: `0 0 5px ${NEON.purple}`,
            }}
          >
            <p>◆ TAP CARTE ou FLECHES (DIAGONALES) POUR BOUGER ◆</p>
            <p>◆ CTRL+DIR / BOUTON FAST = CORRIDOR DASH ◆</p>
            <p>◆ BOUTONS +/− = ZOOM CARTE (MOBILE) ◆</p>
            <p style={{ color: NEON.pink }}>
              ◆ F: FIRE | T: TELEPORT | R: PRAY | S: STAIRS ◆
            </p>
            <p style={{ color: NEON.cyan }}>◆ 1-6 (TOP ROW) = CHANGE CLASS ◆</p>
          </div>
        </div>
      )}

      {/* LORE SCREEN */}
      {gameState === "lore" && (
        <div className="lore-screen">
          <div className="lore-content">
            <div className="lore-scroll">
              {PROLOGUE_LINES.map((line, index) => (
                <p
                  key={`${index}-${line.slice(0, 8)}`}
                  className={index === 0 ? "lore-title" : ""}
                >
                  {line || "\u00a0"}
                </p>
              ))}
            </div>
          </div>

          <div className="lore-actions">
            <button className="lore-skip-btn" onClick={skipIntroToGame}>
              PASSER
            </button>
            <span>Appuyez sur une touche pour lancer la partie</span>
          </div>
        </div>
      )}

      {/* LEVEL TRANSITION */}
      {showLevelTransition && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(10,0,20,0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            animation:
              "crtPowerOff 1.5s cubic-bezier(0.25, 0.8, 0.25, 1) forwards",
          }}
        >
          <div
            style={{
              textAlign: "center",
              animation: "pixelGlitchExit 1.5s steps(2, end) forwards",
            }}
          >
            <div
              style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "4rem",
                color: NEON.cyan,
                textShadow: `0 0 20px ${NEON.cyan}, 0 0 40px ${NEON.cyan}`,
                marginBottom: "20px",
              }}
            >
              {isSecretVault
                ? activeBiome?.isBoss
                  ? "⚔ BOSS VAULT ⚔"
                  : "◆ SECRET VAULT ◆"
                : `LEVEL ${level}`}
            </div>
            <div
              style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "1.5rem",
                color: biome.floorColor,
                textShadow: `0 0 10px ${biome.floorColor}`,
                letterSpacing: "0.2em",
              }}
            >
              {biome.name}
            </div>
          </div>
        </div>
      )}

      {/* GAME SCREEN */}
      {gameState === "playing" && !showLevelTransition && (
        <div
          style={{
            width: "100%",
            maxWidth: "1000px",
            zIndex: 5,
            animation: screenShake ? "shake 0.15s ease" : "none",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
          className="game-screen"
        >
          {/* HUD */}
          <div className="hud-grid">
            {[
              {
                label: "LVL",
                value: level === 0 ? "CITY" : level,
                color: level === 0 ? OW_PALETTE.neonCyan : NEON.cyan,
              },
              {
                label: "HP",
                value: `${hp}/${maxHp}`,
                color: hp < maxHp * 0.3 ? NEON.red : NEON.green,
              },
              {
                label: "GOLD",
                value: gold,
                color: NEON.yellow,
                danger: isVoidDanger,
              },
              { label: "ARM", value: armor, color: "#4a90d9" },
              {
                label: "CLASS",
                value:
                  currentClass === 1
                    ? CLASSES[currentClass].name
                    : `${CLASSES[currentClass].name} ${
                        unlockedGems[currentClass - 2]
                      }`,
                color: CLASSES[currentClass].color,
              },
              { label: "WPN", value: weapon.short, color: NEON.orange },
              {
                label: "DMG",
                value: `${weapon.dmg}+${dmgBonus}${
                  currentClass === 4 ? " x2" : ""
                }`,
                color: NEON.red,
              },
              {
                label: "PULSE",
                value: hasBow ? `+${bow.bonus}` : "NO",
                color: hasBow ? getBowColor(bow.bonus) : NEON.purple,
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  background: "rgba(0, 0, 0, 0.4)",
                  padding: "6px 2px",
                  borderRadius: "6px",
                  boxShadow: "inset 0 0 5px rgba(255, 255, 255, 0.03)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    color: "rgba(255, 255, 255, 0.5)",
                    fontSize: "0.65rem",
                    letterSpacing: "0.15em",
                    marginRight:
                      "-0.15em" /* <-- Correction du centrage optique */,
                    fontFamily: "Orbitron, sans-serif",
                    marginBottom: "3px",
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    color: item.color,
                    fontWeight: "bold",
                    fontSize: "1rem",
                    textShadow: `0 0 8px ${item.color}`,
                    animation: item.danger
                      ? "voidDanger 0.5s ease-in-out infinite"
                      : "none",
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
          {floorObjective && !isMobile && (
            <div
              style={{
                marginBottom: "8px",
                color: NEON.lime,
                textShadow: `0 0 8px ${NEON.lime}`,
                fontSize: "0.72rem",
                letterSpacing: "0.08em",
                fontFamily: "Orbitron, sans-serif",
                textAlign: "left",
                width: "100%",
                paddingLeft: "2px",
              }}
            >
              * CHALLENGE: {floorObjective.label} | {objectiveProgress}
            </div>
          )}
          {/* MAP */}
          <div className="map-area">
            <div
              ref={mapContainerRef}
              className="map-wrapper"
              style={{
                overflowX: isMobile
                  ? isPinchingRef.current
                    ? "hidden"
                    : "auto"
                  : "hidden",
                overflowY: isMobile
                  ? isPinchingRef.current
                    ? "hidden"
                    : "auto"
                  : "hidden",
                borderRadius: "4px",
                position: "relative",
                // On utilise notre couleur dynamique pour la bordure
                border: `2px solid ${windowBorderColor}`,
                // On adapte le halo lumineux (4D = 30% d'opacité, 1A = 10% d'opacité en hexadécimal)
                boxShadow: `0 0 20px ${windowBorderColor}, 0 0 40px ${windowBorderColor}4D, inset 0 0 30px ${windowBorderColor}1A`,
                // On ajoute une transition pour que le changement soit fluide quand on change de niveau
                transition: "border-color 1.5s ease, box-shadow 1.5s ease",
              }}
            >
              <div
                className={isMobile ? "" : "scanlines"}
                onPointerDown={(e) => {
                  tapStartRef.current = {
                    x: e.clientX,
                    y: e.clientY,
                    scrollLeft: mapContainerRef.current?.scrollLeft ?? 0,
                    scrollTop: mapContainerRef.current?.scrollTop ?? 0,
                  };
                }}
                onPointerUp={(e) => {
                  const start = tapStartRef.current;
                  tapStartRef.current = null;
                  if (!start) return;

                  const moved =
                    Math.hypot(e.clientX - start.x, e.clientY - start.y) > 12;
                  const scrolled =
                    Math.abs(
                      (mapContainerRef.current?.scrollLeft ?? 0) -
                        start.scrollLeft
                    ) > 2 ||
                    Math.abs(
                      (mapContainerRef.current?.scrollTop ?? 0) -
                        start.scrollTop
                    ) > 2;
                  if (moved || scrolled) return;

                  handleGridClick(e);
                }}
                onPointerMove={!isMobile ? handleGridHover : undefined}
                onPointerLeave={
                  !isMobile
                    ? () => {
                        hoveredMonsterRef.current = null;
                      }
                    : undefined
                }
                onPointerCancel={() => {
                  tapStartRef.current = null;
                }}
                style={{
                  background: "#000",
                  padding: "8px",
                  position: "relative",
                  width:
                    isMobile && mobileMapWidth
                      ? `${mobileMapWidth * mapZoom}px`
                      : "100%",
                  height:
                    isMobile && mobileMapHeight
                      ? `${mobileMapHeight * mapZoom}px`
                      : "100%",
                  minWidth:
                    isMobile && mobileMapWidth
                      ? `${mobileMapWidth * mapZoom}px`
                      : undefined,
                  minHeight:
                    isMobile && mobileMapHeight
                      ? `${mobileMapHeight * mapZoom}px`
                      : undefined,
                  cursor: "pointer",
                  transform:
                    !isMobile && mapZoom !== 1 ? `scale(${mapZoom})` : "none",
                  transformOrigin: `${((player.x - 0.5) / GRID_WIDTH) * 100}% ${
                    ((player.y - 0.5) / GRID_HEIGHT) * 100
                  }%`,
                  transition:
                    "transform 0.15s ease-out, transform-origin 0.15s ease-out",
                }}
              >
                {/* Fond plasma animé biome-aware */}
                <PlasmaBackground biome={biome} />

                <div
                  style={{
                    display: "grid",
                    gridTemplateRows: `repeat(${GRID_HEIGHT}, 1fr)`,
                    height: "100%",
                    fontSize:
                      isMobile && mobileCellSize
                        ? `${Math.max(8, mobileCellSize * 0.84) * mapZoom}px`
                        : "clamp(9px, 1.2vw + 0.7vh, 24px)",
                    lineHeight: 1,
                    fontFamily: '"Share Tech Mono", monospace',
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {gridData.map((row, y) => (
                    <GridRow key={y} rowData={row} />
                  ))}
                </div>
              </div>
            </div>

            {/* MESSAGE - visible in current viewport */}
            {msg.text && (
              <div
                style={{
                  position: "absolute",
                  top: "6px",
                  left: "8px",
                  zIndex: 15,
                  pointerEvents: "none",
                  maxWidth: "80%",
                }}
              >
                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.75)",
                    padding: "4px 10px",
                    borderRadius: "3px",
                    borderLeft: `2px solid ${msg.color}`,
                    color: msg.color,
                    textShadow: `0 0 8px ${msg.color}`,
                    fontSize: "clamp(0.6rem, 2vw, 0.8rem)",
                    fontFamily: '"Share Tech Mono", monospace',
                    letterSpacing: "0.05em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            )}

            {/* COMBO / OVERDRIVE OVERLAY - top right of map */}
            {(comboCount > 0 || overdriveTurns > 0 || hasOverloadKey) && (
              <div
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "8px",
                  zIndex: 15,
                  pointerEvents: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "3px",
                }}
              >
                {comboCount > 0 && overdriveTurns <= 0 && (
                  <div
                    style={{
                      background: "rgba(0, 0, 0, 0.75)",
                      padding: "3px 8px",
                      borderRadius: "3px",
                      borderRight: `2px solid ${NEON.orange}`,
                      color: NEON.orange,
                      textShadow: `0 0 8px ${NEON.orange}`,
                      fontSize: "clamp(0.55rem, 1.8vw, 0.75rem)",
                      fontFamily: '"Share Tech Mono", monospace',
                      letterSpacing: "0.05em",
                    }}
                  >
                    COMBO {"★".repeat(comboCount)}
                    {"☆".repeat(Math.max(0, 3 - comboCount))}
                  </div>
                )}
                {overdriveTurns > 0 && (
                  <div
                    style={{
                      background: "rgba(0, 0, 0, 0.75)",
                      padding: "3px 8px",
                      borderRadius: "3px",
                      borderRight: `2px solid ${NEON.red}`,
                      color: NEON.red,
                      textShadow: `0 0 12px ${NEON.red}`,
                      fontSize: "clamp(0.55rem, 1.8vw, 0.75rem)",
                      fontFamily: '"Share Tech Mono", monospace',
                      letterSpacing: "0.05em",
                      animation: "flash 0.5s ease-in-out infinite",
                    }}
                  >
                    ⚡ OVERDRIVE [{overdriveTurns}] ⚡
                  </div>
                )}
                {hasOverloadKey && (
                  <div
                    style={{
                      background: "rgba(0, 0, 0, 0.75)",
                      padding: "3px 8px",
                      borderRadius: "3px",
                      borderRight: `2px solid ${NEON.yellow}`,
                      color: NEON.yellow,
                      textShadow: `0 0 8px ${NEON.yellow}`,
                      fontSize: "clamp(0.55rem, 1.8vw, 0.75rem)",
                      fontFamily: '"Share Tech Mono", monospace',
                      letterSpacing: "0.05em",
                    }}
                  >
                    ⚡ OVERLOAD KEY
                  </div>
                )}
              </div>
            )}

            {/* CHALLENGE ANNOUNCEMENT OVERLAY */}
            {showChallengeOverlay && floorObjective && (
              <ChallengeAnnouncement
                challengeOverlayTitle={challengeOverlayTitle}
                challengeOverlayDetail={challengeOverlayDetail}
                isMobile={isMobile}
                onDismiss={() => setShowChallengeOverlay(false)}
              />
            )}

            {/* INLINE CONFIRM PROMPT - strictly centered in map */}
            {showConfirm && (
              <ConfirmPromptDialog
                showConfirm={showConfirm}
                armorPermanent={armorPermanent}
                bow={bow}
                handleWeaponConfirm={handleWeaponConfirm}
                handleArmorConfirm={handleArmorConfirm}
                handleBowConfirm={handleBowConfirm}
                handleVendorConfirm={handleVendorConfirm}
              />
            )}
          </div>{" "}
          {/* end map-area */}
          <div className="controls-col">
            {/* ACTIONS */}
            <div
              className="actions-bar"
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "6px",
                flexWrap: isMobile ? "wrap" : "nowrap",
                flexShrink: 0,
              }}
            >
              {[
                {
                  icon: currentClass === 6 ? "✦" : "→",
                  label: currentClass === 6 ? "RECODE" : "FIRE",
                  action: () => {
                    if (currentClass === 6) {
                      setShowDirectionPicker("polymorph");
                      showMessage("◆ CHOOSE DIRECTION ◆", NEON.magenta);
                    } else if (hasBow && ![3, 4, 5, 6].includes(currentClass)) {
                      setShowDirectionPicker("bow");
                      showMessage("◆ CHOOSE DIRECTION ◆", NEON.green);
                    }
                  },
                  active:
                    currentClass === 6 ||
                    (hasBow && ![3, 4, 5, 6].includes(currentClass)),
                  mobileOnly: false,
                  armed: showDirectionPicker === "bow",
                  armedColor: NEON.green,
                  armedBg: "rgba(57,255,20,0.3)",
                },
                {
                  icon: "◈",
                  label: "WARP",
                  action: teleport,
                  active: true,
                  mobileOnly: false,
                  armed: false,
                },
                {
                  icon: "✚",
                  label: "RESTORE",
                  action: pray,
                  active: true,
                  mobileOnly: false,
                  armed: false,
                },
                {
                  icon: "▼",
                  label: "DOWN",
                  action: useStairs,
                  active:
                    map[player.y]?.[player.x] === TILE.STAIRS ||
                    map[player.y]?.[player.x] === TILE.VAULT_STAIRS ||
                    map[player.y]?.[player.x] === TILE.BLUE_STAIRS,
                  mobileOnly: false,
                  armed: false,
                },
                {
                  icon: "◌",
                  label: "WAIT",
                  action: () => processMonsterTurn(monsters, null),
                  active: true,
                  mobileOnly: true,
                  armed: false,
                },
                {
                  icon: destinationMode ? "◎" : "»",
                  label: destinationMode ? "DEST" : "DASH",
                  action: () => {
                    if (autoPathRef.current) {
                      cancelAutoPath();
                      showMessage("◇ PATH CANCELLED ◇", NEON.purple);
                      return;
                    }
                    if (destinationMode) {
                      cancelAutoPath();
                      return;
                    }
                    if (fastTravelArmed) {
                      setFastTravelArmed(false);
                      setDestinationMode(true);
                      showMessage("◆ TAP DESTINATION ◆", NEON.green);
                      return;
                    }
                    setFastTravelArmed(true);
                  },
                  active: true,
                  mobileOnly: true,
                  armed: fastTravelArmed || destinationMode,
                  armedColor: destinationMode ? NEON.green : NEON.yellow,
                  armedBg: destinationMode
                    ? "rgba(57,255,20,0.3)"
                    : "rgba(255,240,31,0.3)",
                },
              ].map((btn, i) => (
                <button
                  key={i}
                  className={`action-btn ${
                    btn.mobileOnly ? "mobile-only-btn" : ""
                  }`}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    btn.action();
                  }}
                  style={{
                    background: btn.armed
                      ? btn.armedBg || "rgba(255,42,109,0.3)"
                      : btn.active
                      ? "rgba(5,217,232,0.1)"
                      : "rgba(50,50,50,0.3)",
                    border: `1px solid ${
                      btn.armed
                        ? btn.armedColor || NEON.pink
                        : btn.active
                        ? NEON.cyan
                        : "#333"
                    }`,
                    color: btn.armed
                      ? btn.armedColor || NEON.pink
                      : btn.active
                      ? NEON.cyan
                      : "#555",
                    padding: "10px 15px",
                    fontSize: "0.75rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                    textShadow: btn.armed
                      ? `0 0 8px ${btn.armedColor || NEON.pink}`
                      : btn.active
                      ? `0 0 5px ${NEON.cyan}`
                      : "none",
                    boxShadow: btn.armed
                      ? `0 0 10px ${btn.armedColor || NEON.pink}`
                      : "none",
                    fontFamily: "Orbitron, sans-serif",
                    letterSpacing: "0.1em",
                  }}
                >
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
            {/* CLASS BAR */}
            <div
              className="class-bar"
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "5px",
                marginTop: isMobile ? "6px" : "0px",
                flexWrap: isMobile ? "wrap" : "nowrap",
                flexShrink: 0,
                paddingBottom: isMobile ? "6px" : "0px",
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((cls) => {
                const gemLevel = cls === 1 ? 0 : unlockedGems[cls - 2];
                const unlocked = cls === 1 || gemLevel > 0;
                const current = cls === currentClass;
                return (
                  <button
                    key={cls}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      switchClass(cls);
                    }}
                    style={{
                      background: current
                        ? "rgba(255,255,255,0.1)"
                        : "transparent",
                      border: `2px solid ${
                        unlocked ? CLASSES[cls].color : "#333"
                      }`,
                      color: unlocked ? CLASSES[cls].color : "#333",
                      padding: "8px 12px",
                      fontSize: "0.8rem",
                      borderRadius: "4px",
                      cursor: unlocked ? "pointer" : "default",
                      textShadow: unlocked
                        ? `0 0 5px ${CLASSES[cls].color}`
                        : "none",
                      boxShadow: current
                        ? `0 0 10px ${CLASSES[cls].color}`
                        : "none",
                      fontFamily: "Orbitron, sans-serif",
                      position: "relative",
                    }}
                  >
                    {cls}
                    {gemLevel > 0 && (
                      <span
                        style={{
                          fontSize: "0.5rem",
                          position: "absolute",
                          top: "1px",
                          right: "2px",
                          opacity: 0.8,
                        }}
                      >
                        {gemLevel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          {/* end controls-col */}
        </div>
      )}

      {/* GAME OVER */}
      {gameState === "gameover" && (
        <GameOverScreen
          level={level}
          gold={gold}
          maxHp={maxHp}
          armor={armor}
          earnedBadges={earnedBadges}
          setGameState={setGameState}
        />
      )}

      {/* VICTORY */}
      {gameState === "victory" && (
        <VictoryScreen
          gold={gold}
          maxHp={maxHp}
          armor={armor}
          earnedBadges={earnedBadges}
          setGameState={setGameState}
        />
      )}
    </div>
  );
}

export default DownwardsNeon;
