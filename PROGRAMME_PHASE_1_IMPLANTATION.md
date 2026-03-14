# PROGRAMME FONCTIONNEL & SÉQUENTIEL — PHASE 1 (CARTOGRAPHIE 5x5)

Ce document transforme la **Phase 1** de `PLAN_OPEN_WORLD_UPDATE.md` en plan d'exécution concret, ordonné, testable et livrable en petites étapes.

---

## 0) Cible de la Phase 1

**But produit**: disposer d'une ville 5x5 réellement jouable, avec:
- navigation écran-par-écran (flip instantané),
- 25 écrans exploitables,
- POI interactifs,
- ennemis d'overworld basiques,
- persistance d'état en session pendant la partie.

**Critère de sortie global Phase 1**
- Le joueur peut se déplacer d'un écran à l'autre sur les 4 axes sans bug de collision ni blocage.
- Revenir sur un écran conserve son état (items/ennemis/flags de session).
- Au moins 5 POI fonctionnent avec interaction.
- Les ennemis overworld peuvent apparaître, agir et être vaincus.

---

## 1) Séquencement de livraison (ordre imposé)

> Optimisation validée: **1.1 (`citygrid.js`) et 1.2 (`citystate.js`) peuvent être développées en parallèle**.
> Le point de convergence reste 1.3 (intégration dans `down_over.jsx`), qui est le principal risque de régression.

## Étape 1 — Fondations runtime ville

### 1.1 Créer `citygrid.js`
**Objectif**: définir la topologie 5x5 et les métadonnées minimales par écran.

**À implémenter**
- Export d'une constante `CITY_SIZE = 5`.
- Export d'une fonction `getScreenId(x, y)` (`"x,y"`).
- Export d'une factory `createCityGrid()` qui retourne:
  - `screens` : dictionnaire de 25 écrans,
  - `getScreen(x,y)` : accès sécurisé (`null` hors bornes),
  - `canExit(x,y,dir)` : vérifie connexion.
- Chaque écran contient:
  - `coords`,
  - `templateType` (`hub` ou `street`),
  - `exits` (`north/south/east/west` booléens),
  - `pois` (array vide au début),
  - `spawnTable` (placeholder).

**Definition of done**
- `createCityGrid()` retourne exactement 25 écrans.
- Pas de sortie vers l'extérieur de la grille.

### 1.2 Créer `citystate.js`
**Objectif**: centraliser l'état runtime de la ville en reducer.

**Scope strict du reducer (important)**
- Le `cityReducer` gère uniquement l'état **navigationnel ville**:
  - écran actif,
  - cache/template/screenStates,
  - transitions et flags de navigation.
- L'état joueur (HP, inventaire, stats combat, position gameplay principale) reste dans les `useState` existants pour éviter toute désynchronisation.

**À implémenter**
- `initialCityState`:
  - `activeScreen: { x: 2, y: 0 }`,
  - `playerPos`,
  - `screenStates: {}` (persist session),
  - `transition: { active: false, direction: null }`.
- `cityReducer(state, action)` avec actions:
  - `CITY_MOVE_REQUEST`,
  - `CITY_SCREEN_CHANGED`,
  - `CITY_UPDATE_SCREEN_STATE`,
  - `CITY_SET_TRANSITION`.
- Helpers:
  - `ensureScreenState(state, x, y)` (lazy init),
  - `applyScreenDelta({x,y}, dir)`.

**Definition of done**
- Le reducer est pur, sans effets de bord.
- Une action invalide ne casse pas l'état.

### 1.3 Brancher dans `down_over.jsx`
**Objectif**: activer le mode multi-écrans sans casser le flux actuel.

**À implémenter**
- Injecter `useReducer(cityReducer, initialCityState)` pour overworld.
- Garder compatibilité avec l'overworld actuel via un flag `USE_CITY_GRID` (temporaire).
- Introduire explicitement:
  - `isInOverworld = level === 0`,
  - `isInCityGrid = isInOverworld && USE_CITY_GRID`.
- Appliquer `isInCityGrid` de manière chirurgicale sur les points de branchement overworld (les checks `level === 0`) pour limiter les effets de bord.
- Remplacer les accès statiques map overworld par `getScreen(...)` quand `USE_CITY_GRID` est actif.

**Definition of done**
- Le jeu démarre sans crash.
- Le rendu overworld lit l'écran actif du reducer.

---

## Étape 2 — Navigation 5x5 + transitions flip

### 2.1 Détection de sortie d'écran
**Objectif**: quand le joueur sort d'un bord autorisé, charger écran voisin.

**À implémenter**
- À chaque mouvement:
  - si position hors bord et `canExit(...)` vrai → transition,
  - sinon bloquer (mur invisible).
- Repositionnement joueur côté opposé du nouvel écran.

### 2.2 Transition visuelle courte
**Objectif**: flip/fondu <= 150ms.

**À implémenter**
- Ajout styles dans `down_over_styles.js`:
  - classe `city-transition-enter`,
  - classe `city-transition-exit`.
- Piloter via `transition.active` dans le state.

**Definition of done**
- Pas de scroll continu.
- Changement d'écran lisible et instantané.

---

## Étape 3 — Templates des 25 écrans

### 3.1 Produire un générateur de template par rôle
**Objectif**: remplir 25 écrans sans handcraft total.

**À implémenter**
- Dans `overworldgenerator.js` (ou module dédié), créer:
  - `generateHubTemplate(screenMeta)`,
  - `generateStreetTemplate(screenMeta, seedLike)`.
- Démarrer avec:
  - **9 hubs** fixes,
  - **16 streets** procédurales légères.
- Conserver format map existant (50x21).

### 3.2 Cache des templates
**Objectif**: éviter régénération constante.

**À implémenter**
- Générer template une fois à l'init de run,
- stocker dans `screenStates[screenId].template`.

**Definition of done**
- Tous les écrans affichent une carte valide 50x21.
- Changer d'écran puis revenir ne modifie pas le layout.

---

## Étape 4 — POI interactifs

### 4.1 Nouveau type de tile ou marqueur POI
**Objectif**: détecter interaction contextuelle.

**À implémenter**
- Ajouter un marqueur `poiId` par coordonnée (pas forcément nouveau char rendu).
- Définir au minimum 5 POI:
  - Neon Bay spawn,
  - Garage,
  - Arcade,
  - Café,
  - Terminal BBS (placeholder interaction).

### 4.2 Interaction joueur
**Objectif**: déclencher overlay/confirm à l'entrée sur POI.

**À implémenter**
- Hook dans logique de mouvement:
  - `if (poiAtPlayerPos) openPoiInteraction(poiId)`.
- **Ne pas réutiliser `showConfirm` tel quel** (actuellement orienté picker d'items/vendor).
- Choisir l'une de ces options:
  - **Option A (rapide)**: étendre `showConfirm` avec un type `"poi"` + rendu dédié dans `ConfirmPromptDialog`.
  - **Option B (recommandée)**: créer un composant séparé `PoiInteractionDialog` pour éviter le couplage avec l'UI d'item pick.

**Definition of done**
- Chaque POI défini déclenche une interaction visible.
- L'interaction n'empêche pas la reprise de mouvement.

---

## Étape 5 — Ennemis en ville (MVP)

### 5.1 Spawn et stockage par écran
**Objectif**: introduire un danger minimal en overworld.

**À implémenter**
- À l'init d'écran: générer 0..N ennemis via `spawnTable`.
- Stocker dans `screenStates[screenId].enemies`.

### 5.2 Boucle d'IA simple
**Objectif**: réutiliser logique monstre existante avec variante safe.

**À implémenter**
- Introduire un flag dédié `cityEnemiesActive` (ou équivalent) pour ne pas dépendre du mécanisme `surfaceDefenseActiveRef`.
- Conserver la compatibilité Surface Defense:
  - mode Surface Defense continue d'utiliser son guard existant,
  - mode City Grid utilise `isInCityGrid && cityEnemiesActive`.
- Tick ennemis seulement sur écran actif.
- Comportement MVP:
  - errance aléatoire hors LOS,
  - poursuite en LOS courte.
- Combat: brancher pipeline existant sans loot complexe.

**Definition of done**
- Au moins un écran peut contenir des ennemis actifs.
- Éliminer un ennemi le retire durablement de l'écran pendant la session.

---

## Étape 6 — Stabilisation et durcissement

### 6.1 Tests manuels scriptés (checklist)
- Tour complet des bords sur la grille.
- Aller-retour entre 3 écrans en vérifiant la persistance.
- Déclenchement des 5 POI.
- Combat overworld basique.

### 6.2 Correctifs structurels prioritaires
- Limiter les re-render à l'écran actif.
- Vérifier absence de fuites de timers/transitions.
- Protéger toutes les lectures écran par garde de nullité.

**Definition of done final Phase 1**
- Build jouable 20+ minutes sans blocage critique.
- Aucun crash console sur navigation standard.

---

## 2) Backlog séquentiel prêt à copier (tickets)

1. `P1-001` Créer `citygrid.js` + API de base.
2. `P1-002` Créer `citystate.js` + reducer + actions.
3. `P1-003` Intégrer reducer overworld dans `down_over.jsx` (flag + `isInCityGrid`).
4. `P1-004` Implémenter franchissement bord + repositionnement écran voisin.
5. `P1-005` Ajouter classes CSS transition et orchestration state.
6. `P1-006` Ajouter générateur `hub/street` format 50x21.
7. `P1-007` Mettre en cache templates au niveau `screenStates`.
8. `P1-008` Ajouter registre POI (>=5) + détection contact.
9. `P1-009` Implémenter `PoiInteractionDialog` (ou extension `showConfirm` type `poi`).
10. `P1-010` Spawn ennemis par écran + flag `cityEnemiesActive` + persistance session.
11. `P1-011` Tick IA overworld écran actif uniquement.
12. `P1-012` Campagne QA manuelle + corrections.

---

## 3) Planning recommandé (10 jours ouvrés)

- **J1**: P1-001 et P1-002 en parallèle (fondations découplées).
- **J2**: P1-003 (intégration `down_over.jsx`, étape la plus sensible).
- **J3–J4**: P1-004 à P1-005 (navigation + transition).
- **J5–J6**: P1-006 à P1-007 (25 écrans templates + cache).
- **J7**: P1-008 à P1-009 (POI).
- **J8–J9**: P1-010 à P1-011 (ennemis ville).
- **J10**: P1-012 (hardening + validation).

---

## 4) Garde-fous d'implémentation (anti-régression)

- Ne pas changer la taille de grille de rendu (50x21).
- Pas de scroll caméra; uniquement changement d'écran.
- Isoler strictement l'état ville de l'état run donjon.
- Toute donnée d'écran doit être indexée par `screenId` stable (`"x,y"`).
- Aucun accès direct à `Math.random()` dans les modules nouveaux de la ville (préparer la phase seedée).

---

## 5) Démonstrateur minimal attendu (fin de Phase 1)

**Parcours de démo**
1. Spawn à Neon Bay.
2. Passage vers 2 écrans voisins avec transition.
3. Entrée sur POI Garage (popup).
4. Rencontre d'un ennemi ville + combat.
5. Retour au premier écran et vérification que l'ennemi vaincu reste absent.

Si ce parcours passe sans erreur, la Phase 1 est considérée **fonctionnelle**.


---

## 3) État d’avancement constaté (audit rapide)

Statut estimé dans le code actuel:

- ✅ `P1-001` Créer `citygrid.js` + API de base.
- ✅ `P1-002` Créer `citystate.js` + reducer + actions.
- ✅ `P1-003` Intégrer reducer overworld dans `down_over.jsx` (flag + `isInCityGrid`).
- ✅ `P1-004` Implémenter franchissement bord + repositionnement écran voisin.
- ✅ `P1-005` Ajouter classes CSS transition et orchestration state.
- ✅ `P1-006` Ajouter générateur `hub/street` format 50x21.
- ✅ `P1-007` Mettre en cache templates au niveau `screenStates`.
- ⏳ `P1-008` Ajouter registre POI (>=5) + détection contact. *(reste à faire)*

### Prochaine étape recommandée

Prioriser `P1-008` (POI interactifs) pour finaliser le cœur fonctionnel de la phase 1 avant l’ajout/raffinement IA ennemis.
