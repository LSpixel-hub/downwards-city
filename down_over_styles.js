// ============================================
// DOWNWARDS - OVERDRIVE ROGUE
// Extracted CSS Keyframes & Static Styles
// ============================================

export function getGameStyles(windowBorderColor, NEON) {
  return `
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
          @keyframes flash { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
          @keyframes glow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.3); } }

          @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }

          @keyframes gridMove { 0% { background-position: 0px 0px, 0px 0px; } 100% { background-position: 0px 30px, 0px 0px; } }
          @keyframes gridGlow { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.9; } }
          @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
          @keyframes neonFlicker { 0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; } 20%, 24%, 55% { opacity: 0.6; } }
          @keyframes crtFlicker {
            0% { opacity: 0.96; }
            5% { opacity: 0.93; }
            10% { opacity: 0.99; }
            15% { opacity: 0.95; }
            35% { opacity: 0.985; }
            55% { opacity: 0.94; }
            75% { opacity: 0.99; }
            100% { opacity: 0.965; }

	  }
	@keyframes loreScroll {
            0% { transform: translateY(5vh); }
            100% { transform: translateY(-100%); }
          }

          @keyframes borderGlow { 0%, 100% { box-shadow: 0 0 5px ${NEON.pink}, 0 0 10px ${NEON.pink}, 0 0 20px ${NEON.pink}; } 50% { box-shadow: 0 0 10px ${NEON.cyan}, 0 0 20px ${NEON.cyan}, 0 0 40px ${NEON.cyan}; } }
          @keyframes voidDanger { 0%, 100% { color: ${NEON.yellow}; text-shadow: 0 0 5px ${NEON.yellow}; } 50% { color: ${NEON.red}; text-shadow: 0 0 10px ${NEON.red}, 0 0 20px ${NEON.red}; } }
          @keyframes effectPop { 0% { opacity: 0; transform: scale(0.5); } 30% { opacity: 1; transform: scale(1.4); } 100% { opacity: 1; transform: scale(1); } }

          @keyframes crtPowerOff {
            0%, 75% {
              transform: scale(1, 1);
              opacity: 1;
              filter: contrast(1) brightness(1);
            }
            85% {
              transform: scale(1, 0.02);
              opacity: 1;
              filter: contrast(2) brightness(3);
            }
            95% {
              transform: scale(0, 0.02);
              opacity: 0.8;
            }
            100% {
              transform: scale(0, 0);
              opacity: 0;
            }
          }

          @keyframes pixelGlitchExit {
            0%, 75% {
              opacity: 1;
              clip-path: inset(0 0 0 0);
              transform: translate(0);
            }
            78% {
              clip-path: inset(20% 0 60% 0);
              transform: translate(-10px, 5px);
              filter: hue-rotate(90deg);
            }
            81% {
              clip-path: inset(60% 0 10% 0);
              transform: translate(10px, -5px);
              filter: hue-rotate(-90deg);
            }
            84% {
              clip-path: inset(10% 0 80% 0);
              transform: translate(-5px, 10px);
            }
            87% {
              opacity: 0;
              transform: scale(1.1);
            }
            100% {
              opacity: 0;
            }
          }

          * { box-sizing: border-box; }

          .scanlines::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px);
            pointer-events: none;
            z-index: 10;
          }

          .grid-bg {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image:
              linear-gradient(rgba(var(--grid-color, 255,42,109),0.07) 1px, transparent 1px),
              linear-gradient(90deg, rgba(var(--grid-color, 255,42,109),0.07) 1px, transparent 1px);
            background-size: 30px 30px;
            animation: gridMove 4s linear infinite, gridGlow 6s ease-in-out infinite;
            pointer-events: none;
            transition: --grid-color 2s ease;
          }

        .horizon-line {
            position: absolute;
            bottom: 30%;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, ${windowBorderColor}, ${NEON.cyan}, ${windowBorderColor}, transparent);
            box-shadow: 0 0 20px ${windowBorderColor};
            opacity: 0.3;
            transition: box-shadow 1.5s ease, background 1.5s ease;
          }

          .lore-screen {
            position: relative;
            z-index: 6;
            width: min(980px, 100%);
            height: calc(100vh - 20px);
            height: calc(100dvh - 20px);
            overflow: hidden;
            border: 2px solid rgba(5, 217, 232, 0.45);
            box-shadow: 0 0 25px rgba(5, 217, 232, 0.35), inset 0 0 50px rgba(0, 0, 0, 0.5);
            background: radial-gradient(circle at center, rgba(20, 0, 40, 0.75) 0%, rgba(5, 0, 12, 0.92) 70%);
          }


         .lore-content {
            position: absolute;
            inset: 0;
            overflow: hidden;
            padding: 5vh 6% 15vh; /* Paddings réduits et adaptés pour les écrans mobiles */
          }

          .lore-scroll {
            color: ${NEON.cyan};
            text-shadow: 0 0 7px rgba(5, 217, 232, 0.75);
            line-height: 1.6;
            font-size: clamp(0.95rem, 4vw, 1.2rem); /* Taille dynamique mobile/PC */
            letter-spacing: 0.03em;
            font-family: system-ui, -apple-system, sans-serif; /* Police claire et très lisible */
            text-align: justify; /* Justification du texte */
            animation: loreScroll 115s linear forwards; /* Défilement classique sans effet 3D */
          }

          .lore-scroll p {
            margin: 0 0 1.2rem;
          }

	.lore-title {
            text-align: center;
            margin-bottom: 2rem !important;
            color: #d4d4d8; /* Couleur argentée */
            letter-spacing: 0.35em;
            font-family: "Orbitron", sans-serif;
            text-shadow: 0 0 12px rgba(212, 212, 216, 0.8); /* Halo argenté */
          }

          .lore-actions {
            position: absolute;
            bottom: 20px;
            left: 0;
            right: 0;
            z-index: 4;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            color: ${NEON.purple};
            font-size: 0.78rem;
            text-shadow: 0 0 6px rgba(191, 90, 242, 0.7);
          }

          .lore-skip-btn {
            font-family: "Orbitron", sans-serif;
            background: rgba(5, 0, 20, 0.8);
            border: 1px solid #d4d4d8; /* Bordure argentée */
            color: #d4d4d8; /* Texte argenté */
            padding: 10px 28px;
            letter-spacing: 0.22em;
            cursor: pointer;
            text-shadow: 0 0 8px rgba(212, 212, 216, 0.8);
            box-shadow: 0 0 10px rgba(212, 212, 216, 0.45); /* Reflet argenté */
            transition: all 0.3s ease;
          }

          /* Petit bonus : le bouton brillera un peu plus au survol sur PC */
          .lore-skip-btn:hover {
            background: rgba(212, 212, 216, 0.1);
            box-shadow: 0 0 15px rgba(212, 212, 216, 0.6);
          }

          .mobile-only-btn {
            display: none !important;
          }

         .controls-col {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            margin-top: 24px; /* <-- C'est ici ! On passe de 4px à 24px pour bien séparer la carte des boutons */
            padding-bottom: 6px;
            flex-shrink: 0;
            flex-wrap: nowrap;
          }

          .actions-bar {
            margin-top: 0;
            flex: 0 1 auto;
            justify-content: center;
          }

          .class-bar {
            margin-top: 0 !important;
            flex: 0 1 auto;
            justify-content: center;
          }

          .game-screen {
            height: calc(100vh - 20px);
            height: calc(100dvh - 20px);
          }


          .city-transition-enter {
            opacity: 1;
            filter: brightness(1);
            transition: opacity 120ms linear, filter 120ms linear;
          }

          .city-transition-exit {
            opacity: 0.7;
            filter: brightness(1.35);
            transition: opacity 120ms linear, filter 120ms linear;
          }

          .map-area {
            position: relative;
            flex: 1;
            min-height: 0;
          }

          .map-wrapper {
            height: 100%;
          }

        /* ===== NOUVEAU STYLE DU HUD ===== */
          .hud-grid {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 8px;
            margin-bottom: 12px;
            padding: 10px 0 15px 0;
            flex-shrink: 0;
            background: linear-gradient(180deg, rgba(15,0,25,0.9) 0%, rgba(15,0,25,0.5) 70%, transparent 100%);
          }

	@media (max-width: 800px) {
            /* Désactive les scanlines sur mobile portrait */
            .scanlines::before { display: none; }
            .root-container {
              height: 100vh;
              height: 100dvh;
              min-height: 0 !important;
              padding: 5px !important;
            }
            .mobile-only-btn {
              display: inline-block !important;
            }
            .game-screen {
              height: calc(100vh - 10px);
              height: calc(100dvh - 10px);
            }
            .map-wrapper {
              aspect-ratio: unset !important;
              border: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              -webkit-overflow-scrolling: touch;
              touch-action: pan-x pan-y;
              overscroll-behavior: contain;
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            .map-wrapper::-webkit-scrollbar {
              display: none;
            }

/* ===== NOUVEAU STYLE DU HUD POUR MOBILE ===== */
            .hud-grid {
              grid-template-columns: repeat(4, 1fr);
              padding: 2px 6px 2px 6px;
              margin-bottom: 0; /* Plus de marge sous le HUD */
              gap: 4px;
            }

            .hud-grid > div {
              padding: 2px 1px !important; /* On réduit le padding pour faire de la place */
            }
            .hud-grid > div > div:first-child {
              font-size: 0.70rem !important; /* Textes des labels agrandis (LVL, HP...) */
              margin-bottom: 0px !important; /* On colle le label à la valeur */
            }
            .hud-grid > div > div:last-child {
              font-size: 1.0rem !important; /* Chiffres beaucoup plus grands et lisibles */
              line-height: 1 !important; /* Empêche la hauteur de la case de s'agrandir */
            }

.controls-col {
              display: flex !important;
              flex-direction: column;
              align-items: stretch;
              gap: 4px;
              width: 100%;
              margin-top: 0; /* Plus d'espace entre la map et les boutons */
              padding-bottom: 0;
            }

            .actions-bar {
              margin-top: 4px;
              display: grid !important;
              grid-template-columns: repeat(3, 1fr);
              gap: 4px;
              width: 100%;
            }
            .actions-bar .action-btn {
              padding: 8px 0 !important;
              width: 100%;
              text-align: center;
              white-space: nowrap;
              font-size: 0.7rem !important;
              letter-spacing: 0.05em !important;
            }
            .class-bar {
              display: grid !important;
              grid-template-columns: repeat(6, 1fr);
              gap: 4px;
              width: 100%;
              margin-top: 4px !important;
              padding-bottom: 4px !important;
            }
            .class-bar button {
              padding: 7px 0 !important;
              width: 100%;
              text-align: center;
              font-size: 0.75rem !important;
            }
          }

          /* ===== MOBILE LANDSCAPE ===== */
          @media (max-height: 600px) and (orientation: landscape) {
            .mobile-only-btn {
              display: inline-block !important;
            }
            .root-container {
              height: 100vh;
              height: 100dvh;
              min-height: 0 !important;
              padding: 4px !important;
            }
            /* Keep flex-column like portrait; map fills the middle */
            .game-screen {
              height: calc(100dvh - 8px);
            }
            /* HUD : single compact row with all 8 stats */
            .hud-grid {
              grid-template-columns: repeat(8, 1fr);
              padding: 3px 4px;
              margin-bottom: 2px;
              gap: 3px;
            }
            .hud-grid > div {
              padding: 2px !important;
            }
            .hud-grid > div > div:first-child {
              font-size: 0.42rem !important;
              margin-bottom: 0 !important;
            }
            .hud-grid > div > div:last-child {
              font-size: 0.72rem !important;
            }
            .map-wrapper {
              aspect-ratio: unset !important;
              border: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              -webkit-overflow-scrolling: touch;
              touch-action: pan-x pan-y;
              overscroll-behavior: contain;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
            .map-wrapper::-webkit-scrollbar { display: none; }
            /* controls-col : single horizontal row — actions | classes */
            .controls-col {
              display: flex !important;
              flex-direction: row;
              gap: 4px;
              width: 100%;
              flex-shrink: 0;
            }
            /* 6 action buttons side by side, half the bar */
            .actions-bar {
              display: grid !important;
              grid-template-columns: repeat(6, 1fr);
              gap: 3px;
              margin-top: 0;
              flex: 1;
            }
            .actions-bar .action-btn {
              padding: 6px 2px !important;
              font-size: 0.6rem !important;
              letter-spacing: 0.03em !important;
              white-space: nowrap;
              text-align: center;
              width: 100%;
            }
            /* 6 class buttons side by side, other half */
            .class-bar {
              display: grid !important;
              grid-template-columns: repeat(6, 1fr);
              gap: 3px;
              flex: 1;
              margin-top: 0 !important;
              padding-bottom: 4px !important;
            }
            .class-bar button {
              padding: 6px 0 !important;
              font-size: 0.62rem !important;
              text-align: center;
              width: 100%;
            }
          }
        `;
}
