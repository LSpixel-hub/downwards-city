import React from "react";
import { NEON } from "./data";
import {
  getWeaponColor,
  getArmorColor,
  getBowColor,
} from "./itemgeneration";

// ============================================
// DOWNWARDS - OVERDRIVE ROGUE
// Extracted Static Sub-Components
// ============================================

// --- Badge list (shared by GameOver & Victory) ---
function BadgeList({ earnedBadges }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "8px",
        marginTop: "10px",
        maxWidth: "80%",
        margin: "10px auto 30px auto",
      }}
    >
      {earnedBadges.length === 0 ? (
        <span style={{ color: "gray", fontSize: "0.8rem" }}>
          NO BADGES YET
        </span>
      ) : (
        earnedBadges.map((badge, i) => (
          <span
            key={i}
            style={{
              padding: "4px 8px",
              background: "rgba(57,255,20,0.1)",
              border: `1px solid ${NEON.lime}`,
              color: NEON.lime,
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontFamily: "Orbitron",
            }}
          >
            {badge}
          </span>
        ))
      )}
    </div>
  );
}

// --- GAME OVER Screen ---
export const GameOverScreen = React.memo(function GameOverScreen({
  level,
  gold,
  maxHp,
  armor,
  earnedBadges,
  setGameState,
}) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", zIndex: 5 }}>
      <div
        style={{
          fontFamily: "Orbitron",
          fontSize: "3rem",
          color: NEON.red,
          textShadow: `0 0 20px ${NEON.red}, 0 0 40px ${NEON.red}`,
          marginBottom: "40px",
          animation: "neonFlicker 0.5s ease-in-out infinite",
        }}
      >
        GAME OVER
      </div>
      {[
        { l: "LEVEL", v: level },
        { l: "GOLD", v: gold },
        { l: "MAX HP", v: maxHp },
        { l: "ARMOR", v: armor },
      ].map((s, i) => (
        <div key={i} style={{ color: NEON.purple, marginBottom: "10px" }}>
          {s.l}:{" "}
          <span
            style={{
              color: NEON.yellow,
              textShadow: `0 0 5px ${NEON.yellow}`,
            }}
          >
            {s.v}
          </span>
        </div>
      ))}
      <div
        style={{
          marginTop: "20px",
          color: NEON.cyan,
          fontFamily: "Orbitron",
        }}
      >
        BADGES EARNED: {earnedBadges.length}
      </div>
      <BadgeList earnedBadges={earnedBadges} />
      <button
        onPointerDown={(e) => {
          e.preventDefault();
          setGameState("title");
        }}
        style={{
          marginTop: "40px",
          fontFamily: "Orbitron",
          background: "transparent",
          border: `2px solid ${NEON.cyan}`,
          color: NEON.cyan,
          padding: "15px 40px",
          fontSize: "1rem",
          cursor: "pointer",
          textShadow: `0 0 10px ${NEON.cyan}`,
          boxShadow: `0 0 10px ${NEON.cyan}`,
        }}
      >
        CONTINUE?
      </button>
    </div>
  );
});

// --- VICTORY Screen ---
export const VictoryScreen = React.memo(function VictoryScreen({
  gold,
  maxHp,
  armor,
  earnedBadges,
  setGameState,
}) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", zIndex: 5 }}>
      <div
        style={{
          fontFamily: "Orbitron",
          fontSize: "2.5rem",
          background: `linear-gradient(90deg, ${NEON.pink}, ${NEON.cyan}, ${NEON.yellow}, ${NEON.pink})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "20px",
          animation: "glow 1s ease-in-out infinite",
        }}
      >
        ♀ PRINCESS SAVED ♀
      </div>
      <div
        style={{
          color: NEON.white,
          marginBottom: "40px",
          textShadow: `0 0 10px ${NEON.white}`,
        }}
      >
        YOU CONQUERED 50 LEVELS OF DARKNESS
      </div>
      {[
        { l: "GOLD", v: gold },
        { l: "MAX HP", v: maxHp },
        { l: "ARMOR", v: armor },
      ].map((s, i) => (
        <div key={i} style={{ color: NEON.purple, marginBottom: "10px" }}>
          {s.l}:{" "}
          <span
            style={{ color: NEON.cyan, textShadow: `0 0 5px ${NEON.cyan}` }}
          >
            {s.v}
          </span>
        </div>
      ))}
      <div
        style={{
          marginTop: "20px",
          color: NEON.cyan,
          fontFamily: "Orbitron",
        }}
      >
        BADGES EARNED: {earnedBadges.length}
      </div>
      <BadgeList earnedBadges={earnedBadges} />
      <button
        onPointerDown={(e) => {
          e.preventDefault();
          setGameState("title");
        }}
        style={{
          marginTop: "40px",
          fontFamily: "Orbitron",
          background: `linear-gradient(90deg, ${NEON.pink}, ${NEON.magenta})`,
          border: "none",
          color: NEON.white,
          padding: "15px 40px",
          fontSize: "1rem",
          cursor: "pointer",
          boxShadow: `0 0 20px ${NEON.pink}`,
        }}
      >
        PLAY AGAIN
      </button>
    </div>
  );
});

// --- Challenge Announcement Overlay ---
export const ChallengeAnnouncement = React.memo(function ChallengeAnnouncement({
  challengeOverlayTitle,
  challengeOverlayDetail,
  isMobile,
  onDismiss,
}) {
  return (
    <div
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDismiss();
      }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 25,
        background: "rgba(0, 0, 0, 0.85)",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "24px 32px",
          border: `2px solid ${NEON.lime}`,
          borderRadius: "8px",
          background: "rgba(0, 0, 0, 0.9)",
          boxShadow: `0 0 30px ${NEON.lime}40, inset 0 0 15px ${NEON.lime}20`,
          maxWidth: "90%",
        }}
      >
        <div
          style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize: "clamp(0.7rem, 3vw, 1rem)",
            color: NEON.lime,
            textShadow: `0 0 12px ${NEON.lime}`,
            letterSpacing: "0.15em",
            marginBottom: "12px",
          }}
        >
          CHALLENGE
        </div>
        <div
          style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize: "clamp(0.9rem, 4vw, 1.4rem)",
            color: NEON.lime,
            textShadow: `0 0 16px ${NEON.lime}, 0 0 32px ${NEON.lime}`,
            letterSpacing: "0.1em",
            marginBottom: "16px",
          }}
        >
          {challengeOverlayTitle}
        </div>
        {challengeOverlayDetail && (
          <div
            style={{
              fontFamily: '"Share Tech Mono", monospace',
              fontSize: "clamp(0.62rem, 2.2vw, 0.82rem)",
              color: "rgba(255, 255, 255, 0.85)",
              letterSpacing: "0.04em",
              marginBottom: "14px",
              lineHeight: 1.35,
            }}
          >
            {challengeOverlayDetail}
          </div>
        )}
        <div
          style={{
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: "clamp(0.55rem, 2vw, 0.75rem)",
            color: "rgba(255, 255, 255, 0.5)",
            letterSpacing: "0.08em",
          }}
        >
          {isMobile ? "TAP TO CONTINUE" : "PRESS ANY KEY"}
        </div>
      </div>
    </div>
  );
});

// --- Confirm Prompt Dialog ---
export const ConfirmPromptDialog = React.memo(function ConfirmPromptDialog({
  showConfirm,
  armorPermanent,
  bow,
  handleWeaponConfirm,
  handleArmorConfirm,
  handleBowConfirm,
  handleVendorConfirm,
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="inline-prompt"
        style={{
          pointerEvents: "auto",
          background: "rgba(10, 0, 25, 0.90)",
          border: `1px solid ${NEON.cyan}`,
          borderRadius: "6px",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontFamily: "Orbitron, sans-serif",
          fontSize: "clamp(0.6rem, 2vw, 0.8rem)",
          boxShadow: `0 0 12px ${NEON.cyan}40, inset 0 0 8px ${NEON.cyan}10`,
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: "95%",
        }}
      >
        {/* Info - grouped so flex-wrap creates clean lines */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "6px 12px",
            flex: "1 1 auto",
            minWidth: 0,
          }}
        >
          <span
            style={{
              color:
                showConfirm.type === "weapon"
                  ? getWeaponColor(showConfirm.data.dmg)
                  : showConfirm.type === "armor"
                  ? getArmorColor(showConfirm.data.ar)
                  : showConfirm.type === "bow"
                  ? getBowColor(showConfirm.data.bonus)
                  : NEON.purple,
              textShadow: `0 0 6px ${
                showConfirm.type === "weapon"
                  ? getWeaponColor(showConfirm.data.dmg)
                  : showConfirm.type === "armor"
                  ? getArmorColor(showConfirm.data.ar)
                  : showConfirm.type === "bow"
                  ? getBowColor(showConfirm.data.bonus)
                  : NEON.purple
              }`,
              whiteSpace: "nowrap",
            }}
          >
            {showConfirm.type === "weapon"
              ? "†"
              : showConfirm.type === "armor"
              ? "⛨"
              : showConfirm.type === "bow"
              ? ")"
              : showConfirm.data?.effect === "sacrifice"
              ? "☠"
              : showConfirm.data?.effect === "lore"
              ? "◈"
              : "◆"}{" "}
            {showConfirm.data.name}
          </span>
          <span
            style={{
              color: NEON.white,
              opacity: 0.7,
              whiteSpace: "nowrap",
            }}
          >
            {showConfirm.type === "weapon"
              ? `DMG:${showConfirm.data.baseDmg}${
                  showConfirm.data.perfectBonus > 0
                    ? `+${showConfirm.data.perfectBonus}`
                    : ""
                } = ${showConfirm.data.dmg}`
              : showConfirm.type === "armor"
              ? `AR:${showConfirm.data.ar} → total:${
                  armorPermanent + showConfirm.data.ar
                }`
              : showConfirm.type === "bow"
              ? `+${showConfirm.data.bonus} (current: +${bow.bonus})`
              : `${showConfirm.data.price}G`}
          </span>
          {showConfirm.type === "vendor" && showConfirm.data.desc && (
            <span
              style={{
                color:
                  showConfirm.data.effect === "sacrifice"
                    ? NEON.red
                    : NEON.cyan,
                opacity: 0.9,
                whiteSpace: "nowrap",
              }}
            >
              {showConfirm.data.desc}
            </span>
          )}
          {showConfirm.type === "weapon" &&
            showConfirm.data.perfectBonus > 0 && (
              <span
                style={{
                  color: NEON.yellow,
                  textShadow: `0 0 6px ${NEON.yellow}`,
                  fontSize: "clamp(0.5rem, 1.5vw, 0.7rem)",
                  whiteSpace: "nowrap",
                }}
              >
                ★ PERFECT +{showConfirm.data.perfectBonus}
              </span>
            )}
          {showConfirm.type === "weapon" &&
            showConfirm.data.family &&
            showConfirm.data.family !== "NONE" && (
              <span
                style={{
                  color:
                    {
                      CRIT: NEON.yellow,
                      REACH: NEON.cyan,
                      KNOCKBACK: NEON.orange,
                      CLEAVE: NEON.red,
                      ARCANE: NEON.magenta,
                    }[showConfirm.data.family] || NEON.white,
                  textShadow: `0 0 6px ${
                    {
                      CRIT: NEON.yellow,
                      REACH: NEON.cyan,
                      KNOCKBACK: NEON.orange,
                      CLEAVE: NEON.red,
                      ARCANE: NEON.magenta,
                    }[showConfirm.data.family] || NEON.white
                  }`,
                  fontSize: "clamp(0.5rem, 1.5vw, 0.7rem)",
                  whiteSpace: "nowrap",
                }}
              >
                {
                  {
                    CRIT: "◇ CRITICAL 25%",
                    REACH: "◇ REACH +1",
                    KNOCKBACK: "◇ KNOCKBACK",
                    CLEAVE: "◇ CLEAVE AOE",
                    ARCANE: "◇ LIFESTEAL",
                  }[showConfirm.data.family]
                }
              </span>
            )}
          {showConfirm.type === "armor" &&
            showConfirm.data.isPerfect && (
              <span
                style={{
                  color: NEON.yellow,
                  textShadow: `0 0 6px ${NEON.yellow}`,
                  fontSize: "clamp(0.5rem, 1.5vw, 0.7rem)",
                  whiteSpace: "nowrap",
                }}
              >
                ★ PERFECT
              </span>
            )}
        </div>
        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (showConfirm.type === "weapon")
                handleWeaponConfirm(true);
              else if (showConfirm.type === "armor")
                handleArmorConfirm(true);
              else if (showConfirm.type === "bow")
                handleBowConfirm(true);
              else handleVendorConfirm(true);
            }}
            style={{
              background: `rgba(0,255,249,0.12)`,
              border: `1px solid ${NEON.cyan}`,
              color: NEON.cyan,
              padding: "4px 14px",
              fontSize: "inherit",
              borderRadius: "3px",
              cursor: "pointer",
              fontFamily: "inherit",
              textShadow: `0 0 4px ${NEON.cyan}`,
              letterSpacing: "0.05em",
            }}
          >
            Y
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (showConfirm.type === "weapon")
                handleWeaponConfirm(false);
              else if (showConfirm.type === "armor")
                handleArmorConfirm(false);
              else if (showConfirm.type === "bow")
                handleBowConfirm(false);
              else handleVendorConfirm(false);
            }}
            style={{
              background: `rgba(255,42,109,0.12)`,
              border: `1px solid ${NEON.pink}`,
              color: NEON.pink,
              padding: "4px 14px",
              fontSize: "inherit",
              borderRadius: "3px",
              cursor: "pointer",
              fontFamily: "inherit",
              textShadow: `0 0 4px ${NEON.pink}`,
              letterSpacing: "0.05em",
            }}
          >
            N
          </button>
        </div>
      </div>
    </div>
  );
});
