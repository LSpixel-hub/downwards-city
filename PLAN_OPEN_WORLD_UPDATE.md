# PLAN DE MISE A JOUR — OVERWORLD OUVERT "LA RIVIERA" (Grille 5x5)

## ANALYSE DE FAISABILITÉ & PLAN D'IMPLÉMENTATION

---

## 1. ÉTAT DES LIEUX DE L'ARCHITECTURE ACTUELLE

### Structure du codebase
```
down_over.jsx          (~6000+ lignes) — Composant principal monolithique
down_over_helpers.jsx  — Constantes, tiles donjon, pathfinding, rendu grille
down_over_styles.js    — Styles CSS-in-JS
down_over_components.jsx — GameOver, Victory, overlays
overworldgenerator.js  — Générateur Neon Bay (1 écran, 50x21, hand-crafted)
data.js                — BIOMES, CLASSES, MONSTERS, WEAPONS, etc.
itemgeneration.js      — Génération armes/armures/monstres
vaultgenerator.js      — Génération des salles secrètes
challenges.js          — Objectifs de floor
```

### Points clés architecturaux
- **Rendu** : Grille ASCII 50x21 en DOM (pas de Canvas), chaque cellule est un `<span>`.
- **State** : ~60+ `useState` individuels dans un composant React unique. Pas de Redux/Context.
- **Overworld actuel** : 1 seul écran (`level === 0`), map hand-crafted dans `MAP_TEMPLATE`, convertie en tiles donjon via `OW_TO_DUNGEON`.
- **Pas de localStorage** actuellement — aucune persistance.
- **Transition overworld→donjon** : `enterOverworld()` génère la map, pose le joueur, met `level=0`. Quand le joueur atteint les escaliers, `startGame()` lance le donjon au niveau 1.
- **Pas de système de marchand en overworld** — les vendors existent uniquement dans le donjon.
- **Pas d'ennemis en overworld** actuellement.

---

## 2. ANALYSE DES CONTRAINTES & DIFFICULTÉS

### 🔴 CONTRAINTES CRITIQUES

| Contrainte | Impact | Mitigation |
|---|---|---|
| **Composant monolithique de 6000+ lignes** | Ajouter 25 écrans + systèmes dans ce fichier le rendrait inmaintenable | **Extraire** les systèmes dans des modules séparés |
| **60+ useState individuels** | Chaque ajout de state (coordonnées écran, inventaire persistant, daily seed...) ajoute des re-renders | **Regrouper** en objets state ou migrer vers `useReducer` |
| **Grille fixe 50x21** | Changer la taille casserait tout le rendu, le pathfinding, la collision | **Garder** 50x21 par écran — chaque écran de la ville est un "viewport" 50x21 |
| **Map hand-crafted** | Créer 25 maps hand-crafted est un travail d'artiste colossal | **Approche hybride** : templates hand-crafted pour les hubs + génération procédurale pour les rues |
| **Rendu DOM (pas Canvas)** | 1050 spans par écran, animations CSS — performant pour 1 écran, mais les transitions doivent être instantanées | **Pas de scroll** entre écrans — transition "flip" comme TMNT NES |
| **Pas de système de sauvegarde** | localStorage à implémenter from scratch | Module dédié, API simple `save(key, val)` / `load(key)` |

### 🟡 DIFFICULTÉS TECHNIQUES MAJEURES

1. **Navigation multi-écrans** : Le moteur actuel ne connaît qu'une seule map. Il faut un système de coordonnées `[screenX, screenY]` + chargement dynamique de l'écran courant.

2. **Persistance d'état entre écrans** : Quand le joueur quitte un écran et y revient, l'état (ennemis tués, portes ouvertes, items ramassés) doit persister dans la session.

3. **Cohabitation overworld/donjon** : Le joueur doit pouvoir revenir en ville depuis le donjon (ou au moins certains points). Il faut séparer clairement l'état "ville" de l'état "donjon run".

4. **Performance des 25 écrans en mémoire** : Garder 25 maps de 50x21 = 26,250 tiles. C'est négligeable en mémoire, mais le système de rendu ne doit traiter que l'écran actif.

5. **Daily Challenge PRNG** : Remplacer `Math.random()` dans `generateLevel`, `itemgeneration.js`, et `data.js` par un PRNG seedé nécessite de passer un `rng` à toutes les fonctions de génération.

6. **Konami Code** : Intercepter des séquences de touches pendant le gameplay sans interférer avec les contrôles existants.

### 🟢 CE QUI EST FACILEMENT FAISABLE

- Les System Daemons (mini-boss) : extension naturelle du système de monstres existant
- The BBS Board : CRUD localStorage, pas de logique complexe
- Les buffs temporaires du Snack Bar : juste des modifiers sur les stats de départ
- Le Café (rumeurs/lore) : simple affichage de texte conditionnel
- Les effets visuels Demoscene : CSS animations, déjà le tooling en place

---

## 3. PLAN D'IMPLÉMENTATION EN PHASES

### PHASE 0 — REFACTORING PRÉPARATOIRE (Pré-requis)
> **Objectif** : Préparer l'architecture pour absorber la complexité sans casser l'existant.

**0.1 — Extraction du state overworld dans un module dédié**
- Créer `citystate.js` : coordonnées écran `[cx, cy]`, état de chaque écran (ennemis, items, flags), inventaire persistant
- Utiliser `useReducer` avec un seul dispatch pour tout l'état ville

**0.2 — Extraction du système de persistance**
- Créer `persistence.js` : wrapper localStorage avec versioning (`{ version: 1, data: {...} }`)
- API : `saveRun(stats)`, `loadBBS()`, `saveBBS(entry)`, `loadPermanentUpgrades()`, `savePermanentUpgrades()`
- Validation des données au chargement (schema check)

**0.3 — Extraction du PRNG seedable**
- Créer `prng.js` : implémentation Mulberry32 ou xoshiro128** (rapide, bonne distribution)
- API : `createRNG(seed)` retourne une fonction `rng()` qui remplace `Math.random()`
- Le seed quotidien = `YYYYMMDD` converti en entier

**0.4 — Abstraction du système de navigation overworld**
- Créer `citygrid.js` : définition de la grille 5x5, connexions entre écrans, metadata par écran
- Chaque écran = `{ id, coords: [x,y], template, exits: { north, south, east, west }, pois: [], enemies: [] }`

---

### PHASE 1 — CARTOGRAPHIE DE LA VILLE (Le coeur du système)
> **Objectif** : 25 écrans navigables avec transitions "flip".

**1.1 — Système de grille 5x5 et transitions**
- State : `cityScreen: { x: 2, y: 0 }` (Neon Bay = centre bas)
- Quand le joueur atteint un bord de l'écran (x=0, x=49, y=0, y=20), vérifier si une sortie existe
- Si oui : charger l'écran adjacent, placer le joueur du côté opposé
- Transition visuelle : flash rapide ou fondu noir (0.15s max pour rester fluide)
- **Pas de scroll continu** — écran par écran

**1.2 — Templates des 25 écrans**
- Réutiliser le format `MAP_TEMPLATE` existant (50 chars × 21 lignes)
- **Stratégie de création** :
  - 8-10 écrans hand-crafted pour les hubs majeurs (Neon Bay, Garage, Arcade, Café, etc.)
  - 15 écrans "rues" générés procéduralement avec variation (bâtiments aléatoires, enseignes, etc.)
  - Chaque template définit ses `NEON_SIGNS` et points d'intérêt
- **Cohérence visuelle** : palette partagée, mais chaque quartier a ses couleurs dominantes

**1.3 — Points d'Intérêt (POI) interactifs**
- Nouveau type de tile : `TILE.POI` (marchable, déclenche interaction)
- Quand le joueur marche sur un POI : afficher un `showConfirm` avec les options
- POIs par écran définis dans la config de la grille

**1.4 — Ennemis dans la ville**
- Réutiliser le système de monstres existant avec des AI adaptées
- Les monstres de la ville sont équivalents au niveau en cours du donjon.

**Estimation** : C'est la phase la plus lourde. ~60% du travail total.

---

### PHASE 2 — SYSTÈMES PERSISTANTS
> **Objectif** : BBS Board + Daily Challenge.

**2.1 — The BBS Board**
- Interface : écran terminal rétro (style C64) affiché en overlay
- Données sauvegardées :
  ```
  { highScore, totalPlayTime, bestLevel, totalDeaths,
    unlockedClasses: [], permanentUpgrades: {},
    dailyScores: [{ date, score, details }],
    badges: [] }
  ```
- Accessible depuis le POI "BBS Terminal" dans le Garage [1,2]

**2.2 — The Pirate Radio (Daily Challenge)**
- Génère un seed = `parseInt(dateString)` (ex: `20260314`)
- `createRNG(seed)` injecté dans `generateLevel`, `getMonsterForLevel`, `getWeaponForLevel`, etc.
- **Difficulté** : il faut passer le `rng` en paramètre à TOUTES les fonctions qui utilisent `Math.random()`. C'est un refactoring transversal.
- Flag `isDailyRun` pour empêcher la sauvegarde de progression permanente pendant un daily
- Score calculé : `(étage × 100) + or + (tours_restants × 10)` — enregistré dans le BBS avec tag `[DAILY]`
- **Limite 1 run/jour** : vérifier `localStorage` pour la date du dernier daily

**2.3 — Marché Noir "Silicon Dreams" [1,3]**
- Upgrades persistants achetés avec l'or accumulé sur les runs précédentes
- Sauvegardé dans le BBS : `{ startArmor: 0-5, startDmg: 0-3, startMaxHp: 0-5 }`
- Appliqués au `startGame()` : modifier les valeurs initiales de HP, armor, dmg

**2.4 — Le Snack Bar [4,1]**
- Buff temporaire pour la prochaine run uniquement (pas persistant)
- State : `tempBuff: { type: 'maxHp', value: 10 }` — appliqué au `startGame()`, consommé ensuite

---

### PHASE 3 — LE DONJON ENRICHI
> **Objectif** : System Daemons + accès biomes depuis la ville.

**3.1 — System Daemons (Mini-Boss tous les 5 niveaux)**
- Dans `generateLevel`, si `level % 5 === 0` ET pas de Vault stairs :
  - Remplacer un monstre par un "System Daemon"
  - Stats : `hp × 3`, AI `JUGGERNAUT` ou `STALKER`, couleur clignotante (CSS animation)
  - Drop garanti : arme/armure "Perfect" via `getWeaponForLevel(level)` avec `isPerfect = true`
- **Impact** : modification localisée dans `generateLevel` et le système de combat — facile.

**3.2 — Accès aux biomes depuis la ville**
- Chaque entrée de donjon dans la ville a un `startLevel` associé
  - Neon Bay [2,0] → Niveau 1
  - Arcade Polybius [3,1] → Niveau 11 (après boss)
  - Appartement Bettie [2,4] → Niveau 26 (après conditions)
- `startGame(startLevel)` au lieu de `startGame()` toujours à 1
- Les biomes s'appliquent automatiquement via `getBiome(level)` existant

**3.3 — Conditions de déblocage**
- State persistant dans le BBS : `{ arcadeUnlocked: false, bettieUnlocked: false }`
- Conditions vérifiées à chaque Game Over / Victoire et sauvegardées

---

### PHASE 4 — THE DEMOSCENE (Biome Secret)
> **Objectif** : Easter egg cosmétique.

**4.1 — Détection du Konami Code**
- Buffer circulaire des 10 dernières touches
- Si la séquence matche : `gameState = "demoscene"`
- Écran spécifique : `[2,0]` (Neon Bay, là où le joueur démarre)

**4.2 — Rendu Demoscene**
- CSS-only effects : raster bars (`background: repeating-linear-gradient`), sinus scroll (CSS `transform` animé via keyframes)
- Pas de monstre, puzzle de navigation (murs invisibles = tiles WALL rendues comme FLOOR)
- Récompense : flag `demosceneCompleted` dans le BBS → effet visuel cosmétique permanent

---

## 4. ORDONNANCEMENT & DÉPENDANCES

```
Phase 0 (Pré-requis) ─────────────────────────┐
  0.1 citystate.js                              │
  0.2 persistence.js                            │
  0.3 prng.js                                   │
  0.4 citygrid.js                               │
                                                ▼
Phase 1 (Cartographie) ───────────────────────┐
  1.1 Transitions écran                        │ ← Dépend de 0.1, 0.4
  1.2 Templates 25 écrans                      │ ← Peut commencer en parallèle
  1.3 POIs interactifs                         │ ← Dépend de 1.1
  1.4 Ennemis ville                            │ ← Dépend de 1.1
                                               ▼
Phase 2 (Persistance) ───────────────────────┐
  2.1 BBS Board                               │ ← Dépend de 0.2, 1.3
  2.2 Daily Challenge                          │ ← Dépend de 0.3
  2.3 Marché Noir                              │ ← Dépend de 2.1
  2.4 Snack Bar                                │ ← Dépend de 1.3
                                               ▼
Phase 3 (Donjon) ────────────────────────────┐
  3.1 System Daemons                          │ ← Indépendant (peut être fait en Phase 1)
  3.2 Accès biomes ville                      │ ← Dépend de 1.3
  3.3 Conditions déblocage                    │ ← Dépend de 2.1, 3.2
                                               ▼
Phase 4 (Demoscene) ─────────────────────────
  4.1 Konami Code                              ← Indépendant
  4.2 Rendu + Puzzle                           ← Dépend de 4.1
```

---

## 5. RECOMMANDATIONS TECHNIQUES POUR LA FLUIDITÉ REACT

### Re-renders
- **Problème** : 60+ `useState` = chaque `setX()` déclenche un re-render du composant entier (6000+ lignes de JSX).
- **Solution immédiate** : Utiliser `React.memo` sur les sous-composants de rendu (grille, HUD, menus).
- **Solution long terme** : Migrer l'état overworld vers `useReducer` (1 dispatch = 1 render batché).

### Transitions d'écran
- Ne PAS animer la grille entière pendant la transition.
- Technique : `opacity: 0` → swap map → `opacity: 1` avec `transition: opacity 0.15s`.
- L'utilisateur perçoit un "blink" rapide, fidèle au style NES.

### Mémoire
- 25 maps × 50×21 × 1 byte = ~26 KB. Négligeable.
- Les 25 maps doivent être pré-générées au `enterOverworld()` et stockées dans un `useRef` (pas dans le state, car elles ne changent pas entre les renders).

### Tick overworld
- Le tick actuel (800ms) anime l'eau et les étoiles. Sur le nouvel écran, seul l'écran visible tourne.
- Les écrans non-visibles ne doivent PAS être tickés.

---

## 6. ADAPTATIONS DU PLAN ORIGINAL

| Élément du plan | Adaptation proposée | Raison |
|---|---|---|
| 25 écrans hand-crafted | Hybride : 8-10 hand-crafted + 15 procéduraux | Réalisme : 25 maps artisanales = des semaines de travail |
| Ennemis dans la ville | Ennemis faibles, pas de combat complexe | L'overworld doit rester une zone d'exploration, pas un second donjon |
| Surface Defense existante | À intégrer dans le nouveau système multi-écrans | La mécanique de "remontée en surface" doit s'adapter à la ville multi-écrans |
| Appartement de Bettie en [2,4] | Garder, mais nécessite de traverser la ville entière | Encourage l'exploration et le déblocage progressif |
| Daily Challenge seed | Basé sur `YYYYMMDD` en UTC pour éviter les problèmes de timezone | Un joueur en Californie et un à Paris doivent avoir le même donjon |
| Marché Noir upgrades | Plafonner les upgrades permanents (+5 max chaque) | Éviter que le jeu devienne trivial après 10 runs |
| Demoscene murs invisibles | Ajouter un indice visuel subtil (léger scintillement) | Les murs 100% invisibles sans indice = frustration |

---

## 7. RISQUES IDENTIFIÉS

1. **Risque de régression** : Le fichier `down_over.jsx` est un monolithe de 6000+ lignes. Chaque modification peut casser des mécaniques existantes. → **Mitigation** : refactoring Phase 0 + tests manuels systématiques.

2. **Scope creep** : 25 écrans × POIs × ennemis × marchands = explosion combinatoire du contenu. → **Mitigation** : lancer avec 9 écrans (3×3 central), puis étendre.

3. **Performance mobile** : Les animations CSS (néons, eau, étoiles) sur 1050 cellules DOM sont déjà limites sur mobile bas de gamme. → **Mitigation** : mode "low-fi" optionnel qui désactive les glows et animations.

4. **Corruption localStorage** : Un joueur qui modifie manuellement le localStorage peut se donner des upgrades max. → **Mitigation** : checksum simple (pas de crypto, c'est un jeu solo).

---

## 8. PROPOSITION DE DÉMARRAGE MINIMAL VIABLE (MVP)

Pour une première itération fonctionnelle, commencer par :

1. **Phase 0** complète (modules utilitaires)
2. **Phase 1** réduite à **9 écrans** (3×3) au lieu de 25 :
   - [1,0] [2,0] [3,0] — Côte (Neon Bay au centre)
   - [1,1] [2,1] [3,1] — Ville centrale (Highway, Arcade)
   - [1,2] [2,2] [3,2] — Quartier haut (Garage, Café)
3. **Phase 2.1** (BBS Board seulement)
4. **Phase 3.1** (System Daemons — indépendant)

Cela donne un overworld navigable avec les lieux principaux, avant d'étendre à 5×5.
