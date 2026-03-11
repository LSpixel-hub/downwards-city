# Plan d’implantation — Événement « Défense de l’Appartement » (NEON BAY)

## 1) Objectif et résultat attendu

Faire de l’overworld (NEON BAY) un **espace récurrent de gameplay** au lieu d’un simple prologue :
- en donjon, un **accès bleu** rare permet de monter temporairement à la surface ;
- la surface devient une **arène de siège** avec vague(s) d’ennemis ;
- en cas de victoire, le joueur obtient **1 potion de soin + 1 arme aléatoire** selon la table du niveau courant ;
- retour ensuite au run du donjon sans casser la progression.

---

## 2) Lecture de l’existant (faisabilité)

### Ce qui existe déjà et réduit le risque

1. **Deux modes de carte déjà intégrés dans le même moteur** :
   - `level === 0` pour NEON BAY ;
   - `level >= 1` pour le donjon.
2. **Passerelles déjà en place** entre systèmes :
   - conversion overworld → tiles du moteur (`OW_TO_DUNGEON`) ;
   - gestion de l’entrée/sortie via l’usage des escaliers (`useStairs`).
3. **Génération et scalabilité déjà disponibles** :
   - monstres par niveau (`getMonsterForLevel`) ;
   - armes par niveau (`getWeaponForLevel`) ;
   - table des potions déjà existante.

### Conclusion faisabilité

👉 **Faisable sans refonte majeure**, car la base technique (états, map, transitions, génération de loot/monstres) existe déjà.

Le principal enjeu n’est pas la génération, mais la **gestion d’état de session événementielle** (sauvegarder/reprendre le run) et l’**équilibrage de fréquence**.

---

## 3) Contraintes techniques à anticiper

## A. État global du run (critique)

Aujourd’hui, les transitions ont un comportement « nouvelle partie » côté overworld initial.
Pour un événement en plein run, il faut éviter toute réinitialisation involontaire (HP, inventaire, progression challenge, etc.).

**Contrainte** : créer un état dédié `surfaceDefenseContext` (ou équivalent) plutôt que réutiliser le flux de start/prologue.

## B. Compatibilité avec objectifs/challenges de floor

Le moteur gère des objectifs par étage, des compteurs de tours et des règles de réussite/échec.

**Contrainte** : décider si l’événement surface :
- gèle les compteurs du floor courant (recommandé),
- ou les continue (plus punitif, plus confus).

## C. Fréquence et frustration

5% fixe à partir d’un niveau donné peut être trop rare/trop variable selon run.

**Contrainte** : prévoir un **bad luck protection** (ex: garantie d’apparition après X étages sans événement).

## D. Lisibilité UX

Une tuile bleue dans un environnement visuel déjà très néon peut être ratée.

**Contrainte** : ajouter au moins 2 signaux :
- sprite/char distinctif + pulsation ;
- message système explicite au reveal ou à proximité.

## E. IA « attaque les immeubles »

Le moteur IA semble centré sur la poursuite/errance autour du joueur.

**Contrainte** : un nouvel objectif IA (target bâtiment) peut coûter plus cher en dev/test qu’un MVP.

---

## 4) Ajustements recommandés (pour sécuriser l’implémentation)

1. **Version MVP d’abord (sprint court)**
   - 1 seule vague ;
   - IA standard (agro joueur), sans logique bâtiment ;
   - récompense immédiate à la victoire ;
   - retour direct au donjon.

2. **Déclenchement hybride (plus robuste)**
   - probabilité faible par étage + compteur pity timer ;
   - activation à partir d’un palier clair (ex: niveau 8 ou 10).

3. **Récompense bornée**
   - potion = aléatoire dans `POTIONS` (ou heal fixe moyen) ;
   - arme = `getWeaponForLevel(savedDungeonLevel)` ;
   - si inventaire plein/système de remplacement, réutiliser le flux de drop existant.

4. **Retour non ambigu**
   - retour au `savedDungeonLevel + 1` seulement si victoire ;
   - en cas d’échec/retrait (si prévu), définir une pénalité explicite.

5. **Feature flag**
   - activer via constante de config (`ENABLE_SURFACE_DEFENSE`) pour rollback facile.

---

## 5) Plan d’implantation en 6 phases

## Phase 1 — Modèle d’état et transitions

Ajouter des états dédiés (noms indicatifs) :
- `isSurfaceDefenseActive` (bool)
- `savedDungeonLevel` (number)
- `savedDungeonSnapshot` (facultatif : position/mini-contexte si nécessaire)
- `surfaceWaveMonsters` / réutilisation de `monsters`
- `surfaceDefenseStatus`: `idle | active | won | failed`

Définir les transitions :
1. Donjon → (tuile accès bleu) → NEON BAY siège.
2. NEON BAY siège → victoire → retour donjon niveau+1.
3. (Optionnel) défaite/fuite → gestion de pénalité.

## Phase 2 — Tuile « escalier bleu » en donjon

- Ajouter une nouvelle tuile/variant (ex: `TILE.BLUE_STAIRS` ou méta flag sur `TILE.STAIRS`).
- Au spawn d’étage (si `level >= threshold`) : tirage d’apparition avec pity timer.
- Empêcher apparition sur cases non valides (mur, objet critique, spawn joueur, etc.).
- Rendu : couleur cyan/bleue + effet pulsé.

## Phase 3 — Entrée en mode siège surface

Au trigger :
- sauvegarder `savedDungeonLevel = level` ;
- charger la map NEON BAY sans reset run ;
- positionner joueur au point d’entrée ;
- générer `N` monstres selon `savedDungeonLevel` ;
- afficher message d’alerte.

Règles spawn recommandées :
- positions périphériques (plage/bords rue), distance minimale au joueur ;
- éviter overlap avec tuiles bloquantes ;
- densité progressive (`N = base + scaling(level)`).

## Phase 4 — Boucle de combat événementielle

- Condition de victoire : plus aucun monstre vivant en mode siège.
- Pendant l’événement :
  - bloquer certaines interactions non pertinentes (ex: escaliers normaux) ;
  - conserver HUD habituel pour limiter coût UX.

## Phase 5 — Récompenses + retour donjon

À la victoire :
- message `APARTMENT SECURED` ;
- donner 1 potion + 1 arme niveau courant ;
- activer point de retour (escalier/portail surface).

Au retour :
- charger `level = savedDungeonLevel + 1` via flux de génération standard ;
- nettoyer l’état événementiel.

## Phase 6 — Corruption progressive visuelle (itérative)

Implémenter en second temps via un `surfaceCorruptionStage` calculé depuis la profondeur atteinte.

- **Stage 1 (10–20)** : ambiance (ciel/eau/éclairage) sans impact gameplay.
- **Stage 2 (21–35)** : conversion de flaques en `VOID_FLUX` avec dégâts.
- **Stage 3 (36–49)** : variantes chars eau + trous de vide bloquants + effets statiques.

Important : isoler ces changements dans le rendu/tiles overworld pour éviter régression donjon.

---

## 6) Estimation effort & risques

## Estimation (ordre de grandeur)

- **MVP fonctionnel** (accès bleu + siège + reward + retour) : **2 à 4 jours**.
- **Version polish** (pity timer, UI claire, tuning difficulté) : **+1 à 2 jours**.
- **Corruption visuelle 3 phases complète** : **+3 à 6 jours** selon profondeur FX/rendu.

## Risques principaux

1. Régression de transition de niveau (bloquante).
2. Déséquilibre difficulté/récompense (farm exploitable).
3. Surcharge visuelle si effets trop agressifs sur mobile.

---

## 7) Critères d’acceptation (DoD)

1. À partir du seuil choisi, un accès bleu peut apparaître en donjon.
2. L’accès téléporte vers NEON BAY en mode siège, sans reset du run.
3. Les ennemis sont bien scalés selon le niveau sauvegardé.
4. Quand tous les ennemis meurent : récompenses exactes (1 potion + 1 arme niveau).
5. Le joueur revient au donjon au niveau `savedDungeonLevel + 1`.
6. Aucun soft-lock (retour impossible, escalier non interactif, etc.).
7. Les saves/continue (si existants) ne corrompent pas l’état.

---

## 8) Recommandation produit/game design (ajustements)

Pour garder une boucle saine :
- limiter l’événement à **1 occurrence tous les X étages** minimum ;
- monter légèrement la difficulté si le joueur déclenche plusieurs défenses ;
- rendre la récompense attractive mais pas supérieure à un étage complet « gratuit » ;
- ajouter une micro-variation d’objectif plus tard (ex: survivre 12 tours / tuer un elite).

👉 Recommandation finale : **livrer le MVP d’abord**, instrumenter (taux d’activation, taux de victoire, impact sur mortalité), puis activer les 3 phases de corruption visuelle en patch successif.
