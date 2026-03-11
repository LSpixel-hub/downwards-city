# Rapport d'avancement — PLAN_DEFENSE_SURFACE

## Méthode
- Lecture du plan `PLAN_DEFENSE_SURFACE.md`.
- Revue de l'implémentation actuelle dans `down_over.jsx`, `down_over_helpers.jsx`, `overworldgenerator.js`, `itemgeneration.js` et `data.js`.
- Évaluation point par point par rapport aux 6 phases et aux critères d'acceptation.

## Synthèse exécutive
- **État global**: l'événement "Défense de surface" est **majoritairement implémenté en MVP** (accès bleu, transition vers NEON BAY, vague de monstres, récompense, retour au donjon).
- **Avancement estimé**: **~75–85% du plan MVP**.
- **Points manquants/écarts principaux**:
  1. La récompense ne donne pas une *potion* objet: elle applique un **soin fixe +6 HP**.
  2. En mode surface (`level === 0`), la boucle IA des monstres est court-circuitée: les monstres ne jouent pas leur tour.
  3. Le "snapshot" de run n'est pas explicite (retour via régénération standard, pas reprise d'un état de floor en cours).
  4. La corruption visuelle est branchée côté rendu overworld, mais la variable de stage semble incomplète/incohérente dans `down_over.jsx` (références sans définition visible dans le fichier).

## Vérification détaillée par phase

### Phase 1 — Modèle d'état et transitions
**Statut: Implémenté (avec variante de nommage)**

Implémenté:
- `surfaceDefenseActive`, `surfaceDefenseReadyToReturn`, `surfaceDefenseSourceLevel`.
- Transition donjon -> surface via `TILE.BLUE_STAIRS`.
- Retour surface -> donjon après victoire via `sourceLevel + 1`.

Écart:
- Pas de `savedDungeonSnapshot` explicite (position/mini-contexte), ce qui colle au flux "nouvel étage" mais pas à une reprise d'instance de floor.

### Phase 2 — Tuile "escalier bleu" en donjon
**Statut: Implémenté**

Implémenté:
- Nouvelle tuile `BLUE_STAIRS`.
- Spawn conditionnel dans la génération de niveau.
- Fréquence: seuil de niveau + aléatoire + pity timer (`>=8` étages sans apparition).
- Rendu distinct (cyan + flash) pour lisibilité.

### Phase 3 — Entrée en mode siège surface
**Statut: Implémenté (MVP)**

Implémenté:
- Sauvegarde du niveau source.
- Chargement de NEON BAY (conversion OW -> dungeon tiles).
- Spawn d'une vague de monstres scalée par niveau source.
- Message d'alerte et placement joueur.

### Phase 4 — Boucle de combat événementielle
**Statut: Partiellement implémenté**

Implémenté:
- Condition de victoire: tous les monstres morts.
- Blocage du retour tant que la ville n'est pas sécurisée.

Écart critique:
- La logique de tour monstre est court-circuitée pour `level === 0`, donc en défense de surface les monstres ne semblent pas exécuter d'IA.

### Phase 5 — Récompenses + retour donjon
**Statut: Implémenté (avec écart sur la potion)**

Implémenté:
- Message de victoire `APARTMENT SECURED`.
- Arme récompense via `getWeaponForLevel(sourceLevel)`.
- Retour au donjon sur `sourceLevel + 1`.

Écart:
- Le plan demande `1 potion + 1 arme`; l'implémentation actuelle applique un soin fixe (`+6 HP`) sans ajout d'objet potion.

### Phase 6 — Corruption progressive visuelle
**Statut: Partiellement implémenté / à sécuriser**

Implémenté côté rendu overworld:
- Support de `corruptionStage` dans `getTileRender`.
- Effets visuels stage 1/2/3 (ciel/fenêtres, flaques corrompues, eau glitchée).

Point à vérifier/corriger:
- Dans `down_over.jsx`, des références à `surfaceCorruptionStage`/`surfaceCorruptionStageRef` existent, mais la déclaration n'apparaît pas dans le fichier inspecté: risque d'incohérence ou de régression build.

## Critères d'acceptation (DoD)
1. Accès bleu en donjon après seuil: **OK**.
2. Téléportation vers NEON BAY sans reset run complet: **OK (MVP)**.
3. Ennemis scalés sur niveau sauvegardé: **OK**.
4. Récompense exacte `1 potion + 1 arme`: **PARTIEL** (arme OK, potion non conforme).
5. Retour au niveau `savedDungeonLevel + 1`: **OK**.
6. Soft-locks (retour impossible, etc.): **GLOBAL OK**, avec garde-fou "CLEAR THE CITY FIRST".
7. Saves/continue non corrompus: **NON VÉRIFIABLE** depuis cette revue statique.

## Recommandations prioritaires
1. **Corriger la récompense potion**: ajouter une vraie potion (ou formaliser que le design final est "heal direct" et mettre à jour le plan).
2. **Activer les tours monstres en mode surface**: isoler la condition `level===0` pour exclure uniquement l'overworld prologue, pas la défense active.
3. **Sécuriser le stage de corruption**: déclarer explicitement `surfaceCorruptionStage` (+ ref) et la source de calcul (profondeur max atteinte).
4. Ajouter un mini test de non-régression sur transitions: `BLUE_STAIRS -> SURFACE -> APARTMENT SECURED -> return level+1`.
