// ============================================
// DOWNWARDS - OVERDRIVE ROGUE
// Game Data Constants
// ============================================

// Neon color palette
export const NEON = {
  pink: "#ff2a6d",
  hotPink: "#ff1493",
  magenta: "#ff00ff",
  purple: "#b026ff",
  blue: "#4d6dff",
  cyan: "#00fff9",
  green: "#39ff14",
  lime: "#ccff00",
  yellow: "#fff01f",
  orange: "#ff6b35",
  red: "#ff0055",
  white: "#ffffff",
  gray: "#aaaaaa", // Ajout pour les armes basiques
};

// Biomes
export const BIOMES = [
  {
    name: "FORGOTTEN DUNGEON",
    floorColor: NEON.purple,
    corridorColor: NEON.pink,
    floorChars: ["·", "·", "·", "⋅", "∙"],
    levels: [1, 5],
    // Plasma : bleu espace / indigo froid — remplace le rose/rouge par défaut
    plasmaColor1: "#0055ff",
    plasmaColor2: "#4400cc",
    gridColor: "138,0,255", // violet
    bgFrom: "#0a0015",
    bgTo: "#1a0035",
  },
  {
    name: "FLOODED CAVERNS",
    floorColor: NEON.blue,
    corridorColor: NEON.green,
    floorChars: ["·", "~", "≈", "∼", "·"],
    levels: [6, 10],
    // Plasma : bleu abysse + bleu-sarcelle profond — atténue la dominante verte
    plasmaColor2: "#0077aa",
    gridColor: "0,150,255", // bleu aqua
    bgFrom: "#000a1a",
    bgTo: "#001a2a",
  },
  {
    name: "TOXIC SWAMP",
    floorColor: NEON.green,
    corridorColor: NEON.yellow,
    floorChars: ["·", "∘", "ˑ", "·", "·"],
    levels: [11, 15],
    gridColor: "57,255,20", // vert néon
    bgFrom: "#000f00",
    bgTo: "#001a05",
  },
  {
    name: "ARCANE SANCTUARY",
    floorColor: NEON.magenta,
    corridorColor: NEON.cyan,
    floorChars: ["·", "⁂", "·", "·", "˙"],
    levels: [16, 20],
    gridColor: "255,0,255", // magenta
    bgFrom: "#0f0015",
    bgTo: "#1a0030",
  },
  {
    name: "MOSSY RUINS",
    floorColor: NEON.green,
    corridorColor: NEON.orange,
    floorChars: ["·", "∘", "·", "⋅", "·"],
    levels: [21, 25],
    gridColor: "80,200,60", // vert mousse
    bgFrom: "#060d00",
    bgTo: "#0d1800",
  },
  {
    name: "ASTRAL RIFT",
    floorColor: NEON.cyan,
    corridorColor: NEON.pink,
    floorChars: ["·", "⁚", "·", "˙", "·"],
    levels: [26, 30],
    gridColor: "0,255,249", // cyan
    bgFrom: "#000d1a",
    bgTo: "#00101f",
  },
  {
    name: "CRYSTAL CAVES",
    floorColor: NEON.purple,
    corridorColor: NEON.white,
    floorChars: ["·", "⟡", "·", "⊹", "·"],
    levels: [31, 35],
    gridColor: "176,38,255", // violet cristal
    bgFrom: "#080010",
    bgTo: "#120020",
  },
  {
    name: "INFERNAL FORGE",
    floorColor: NEON.red,
    corridorColor: NEON.yellow,
    floorChars: ["·", "▪", "·", "▫", "·"],
    levels: [36, 40],
    gridColor: "255,50,0", // rouge forge
    bgFrom: "#150000",
    bgTo: "#250500",
  },
  {
    name: "CELESTIAL TEMPLE",
    floorColor: NEON.yellow,
    corridorColor: NEON.purple,
    floorChars: ["·", "⁺", "·", "˚", "·"],
    levels: [41, 45],
    gridColor: "255,220,0", // or céleste
    bgFrom: "#0f0a00",
    bgTo: "#1a1200",
  },
  {
    name: "BLOODY NIGHTMARE",
    floorColor: NEON.red,
    corridorColor: NEON.cyan,
    floorChars: ["·", "×", "·", "·", "⁖"],
    levels: [46, 50],
    gridColor: "200,0,60", // rouge sang
    bgFrom: "#150000",
    bgTo: "#200010",
  },
];

// Classes
export const CLASSES = {
  1: {
    name: "WARRIOR",
    color: NEON.yellow,
    desc: "Melee fighter",
    glow: "0 0 10px #fff01f, 0 0 20px #fff01f",
  },
  2: {
    name: "ARCHER",
    color: NEON.green,
    desc: "Piercing arrows",
    glow: "0 0 10px #39ff14, 0 0 20px #39ff14",
  },
  3: {
    name: "PRIEST",
    color: NEON.white,
    desc: "Heal with gold",
    glow: "0 0 10px #ffffff, 0 0 20px #ffffff",
  },
  4: {
    name: "BERSERKER",
    color: NEON.red,
    desc: "Double damage",
    glow: "0 0 10px #ff0055, 0 0 20px #ff0055",
  },
  5: {
    name: "TRANSMUTER",
    color: NEON.cyan,
    desc: "Phase walls",
    glow: "0 0 10px #00fff9, 0 0 20px #00fff9",
  },
  6: {
    name: "MAGE",
    color: NEON.blue,
    desc: "Polymorph",
    glow: "0 0 10px #4d6dff, 0 0 20px #4d6dff",
  },
};

// Monsters 
export const MONSTERS = [
  {
    char: "r",
    ai: "COWARD",
    names: ["Rat", "Roach", "Rabid Rat", "Runt", "Rot Grub", "Reptile"],
    hp: 2,
    dmg: 1,
    colors: [NEON.purple, NEON.pink, NEON.gray, NEON.red],
    effect: { type: "STEAL_GOLD", chance: 0.1, msg: "PICKPOCKET" },
  },
  {
    char: "I",
    ai: "ERRATIC",
    names: ["Imp", "Insect Swarm", "Initiate", "Inkblot Slime", "Ice Mite", "Illusory Sprite"],
    hp: 4,
    dmg: 2,
    colors: [NEON.blue, NEON.red, NEON.orange, NEON.magenta],
    effect: { type: "SPAWN", chance: 0.15, msg: "SWARM" },
  },
  {
    char: "S",
    ai: "MELEE",
    names: ["Serpent", "Skeleton", "Slime", "Spider", "Specter", "Stirge"],
    hp: 6,
    dmg: 3,
    colors: [NEON.green, NEON.lime, NEON.yellow, NEON.cyan],
    effect: { type: "PIERCE", chance: 0.2, msg: "VENOM" },
  },
  {
    char: "G",
    ai: "AMBUSH",
    names: ["Goblin", "Ghoul", "Gnoll", "Grimlock", "Grease Rat", "Grave Robber"],
    hp: 14,
    dmg: 4,
    colors: [NEON.green, NEON.yellow, NEON.gray, NEON.orange],
    effect: { type: "STEAL_GOLD", chance: 0.1, msg: "PICKPOCKET" },
  },
  {
    char: "Z",
    ai: "MELEE",
    names: ["Zombie", "Zealot", "Zombified Orc", "Zealous Cultist", "Zhentarim Thug", "Zombie Lord"],
    hp: 18,
    dmg: 5,
    colors: [NEON.green, NEON.cyan, NEON.lime, NEON.purple],
    effect: { type: "WITHER", chance: 0.15, msg: "WITHER" },
  },
  {
    char: "O",
    ai: "MELEE",
    names: ["Orc", "Ogre", "Ooze", "Owlbear", "Orc Warlord", "Ogre Brute"],
    hp: 25,
    dmg: 9,
    colors: [NEON.red, NEON.orange, NEON.gray, NEON.purple],
    effect: { type: "HEAVY_BLOW", chance: 0.15, msg: "SMASH" },
  },
  {
    char: "M",
    ai: "MELEE",
    names: ["Minotaur", "Manticore", "Mummy", "Mind Flayer", "Mimic", "Marilith"],
    hp: 30,
    dmg: 11,
    colors: [NEON.orange, NEON.red, NEON.yellow, NEON.purple],
    effect: { type: "HEAVY_BLOW", chance: 0.15, msg: "CRUSH" },
  },
  {
    char: "W",
    ai: "ERRATIC",
    names: ["Wraith", "Warg", "Wendigo", "Wight", "Winter Wolf", "Warlock"],
    hp: 35,
    dmg: 13,
    colors: [NEON.purple, NEON.cyan, NEON.blue, NEON.white],
    effect: { type: "DODGE", chance: 0.25, msg: "ETHEREAL" },
  },
  {
    char: "T",
    ai: "JUGGERNAUT",
    names: ["Troll", "Treant", "Troglodyte", "Thornback", "Tomb Guardian", "Tiefling Warrior"],
    hp: 40,
    dmg: 16,
    colors: [NEON.cyan, NEON.green, NEON.lime, NEON.orange],
    effect: { type: "REGEN", chance: 1.0, value: 3, msg: "REGEN" },
  },
  {
    char: "F",
    ai: "AMBUSH",
    names: ["Fiend", "Fomorian", "Fire Elemental", "Flesh Golem", "Flind", "Fell Beast"],
    hp: 50,
    dmg: 21,
    colors: [NEON.magenta, NEON.red, NEON.purple, NEON.white],
    effect: { type: "HEAVY_BLOW", chance: 0.25, msg: "TERROR" },
  },
  {
    char: "H",
    ai: "ERRATIC",
    names: ["Hellhound", "Harpy", "Horror", "Hydra", "Hell Titan", "Hook Horror"],
    hp: 70,
    dmg: 23,
    colors: [NEON.purple, NEON.red, NEON.orange, NEON.magenta],
    effect: { type: "VAMPIRISM", chance: 0.4, msg: "DRAIN" },
  },
  {
    char: "V",
    ai: "MELEE",
    names: ["Vampire", "Vampire Spawn", "Vrock", "Viper Swarm", "Vengeful Spirit", "Voidling"],
    hp: 80,
    dmg: 26,
    colors: [NEON.red, NEON.magenta, NEON.purple, NEON.cyan],
    effect: { type: "VAMPIRISM", chance: 0.4, msg: "LEECH" },
  },
  {
    char: "L",
    ai: "RANGED",
    names: ["Lich", "Lycanthrope", "Leviathan", "Lamia", "Lurker Above", "Lord of Shadows"],
    hp: 90,
    dmg: 30,
    colors: [NEON.cyan, NEON.white, NEON.blue, NEON.purple],
    effect: { type: "DRAIN", chance: 0.25, msg: "CURSE" },
  },
  {
    char: "N",
    ai: "RANGED",
    names: ["Necromancer", "Nosferatu", "Nightmare", "Night Hag", "Naga", "Nalfeshnee"],
    hp: 90,
    dmg: 34,
    colors: [NEON.purple, NEON.pink, NEON.red, NEON.white],
    effect: { type: "SPAWN", chance: 0.3, msg: "SUMMON" },
  },
  {
    char: "P",
    ai: "MELEE",
    names: ["Pit Fiend", "Paladin Oathbreaker", "Pharaoh's Ghost", "Planetar", "Phase Spider", "Plague Wraith"],
    hp: 110,
    dmg: 37,
    colors: [NEON.cyan, NEON.white, NEON.red, NEON.magenta],
    effect: { type: "PIERCE", chance: 0.3, msg: "SMITE" },
  },
  {
    char: "A",
    ai: "JUGGERNAUT",
    names: ["Abomination", "Archangel", "Aboleth", "Astral Dreadnought", "Animated Colossus", "Arcane Golem"],
    hp: 120,
    dmg: 43,
    colors: [NEON.yellow, NEON.white, NEON.magenta, NEON.cyan],
    effect: { type: "AURA", chance: 1.0, value: 2, msg: "AURA" },
  },
  {
    char: "X",
    ai: "STALKER",
    names: ["Xorn", "Xeno-beast", "Xylomancer", "Xerik", "Xorn Elder", "Xenophobic Ooze"],
    hp: 130,
    dmg: 48,
    colors: [NEON.orange, NEON.yellow, NEON.purple, NEON.red],
    effect: { type: "WALL_PHASE", chance: 1.0, msg: "PHASE" },
  },
  {
    char: "Q",
    ai: "RANGED",
    names: ["Queen Spider", "Quetzalcoatlus", "Quantum Wraith", "Queen of Blades", "Quickling Lord", "Quester"],
    hp: 140,
    dmg: 51,
    colors: [NEON.magenta, NEON.purple, NEON.green, NEON.red],
    effect: { type: "CORRODE", chance: 0.3, msg: "CORRODE" },
  },
  {
    char: "K",
    ai: "JUGGERNAUT",
    names: ["Kraken", "Knight of Terror", "Kolyarut", "Kenku Shadowlord", "Kraken Spawn", "King of Doom"],
    hp: 160,
    dmg: 58,
    colors: [NEON.blue, NEON.cyan, NEON.purple, NEON.red],
    effect: { type: "PARRY", chance: 0.5, msg: "PARRY" },
  },
  {
    char: "D",
    ai: "STALKER",
    names: ["Dragon", "Demon Lord", "Devourer", "Dracolich", "Death Knight", "Drider"],
    hp: 180,
    dmg: 65,
    colors: [NEON.red, NEON.orange, NEON.magenta, NEON.white],
    effect: { type: "INFERNO", chance: 0.25, msg: "INFERNO" },
  },
];

// Weapons
export const WEAPONS = {
  1: [
    {
      names: ["Rust Blade", "Bone Blade"],
      dmg: [2, 4],
      short: "BLDE",
      chance: 60,
      family: "NONE",
    },
    {
      names: ["Elven Dagger", "Steel Dagger"],
      dmg: [3, 5],
      short: "DAG",
      chance: 40,
      family: "CRIT",
    },
  ],
  2: [
    {
      names: ["Elven Dagger", "Steel Dagger"],
      dmg: [3, 5],
      short: "DAG",
      chance: 35,
      family: "CRIT",
    },
    {
      names: ["Iron Sword", "Bronze Sword"],
      dmg: [4, 6],
      short: "SWD",
      chance: 40,
      family: "NONE",
    },
    {
      names: ["Oak Mace", "Stone Mace"],
      dmg: [5, 7],
      short: "MACE",
      chance: 20,
      family: "KNOCKBACK",
    },
    {
      names: ["Dwarven Pick", "Runed Pick"],
      dmg: [6, 8],
      short: "PICK",
      chance: 5,
      family: "CRIT",
    },
  ],
  3: [
    {
      names: ["Soldier Sword", "Merc Sword"],
      dmg: [5, 7],
      short: "SWD",
      chance: 30,
      family: "NONE",
    },
    {
      names: ["Silver Sabre", "Obsidian Sabre"],
      dmg: [6, 9],
      short: "SABR",
      chance: 35,
      family: "NONE",
    },
    {
      names: ["War Hammer", "Forge Hammer"],
      dmg: [7, 10],
      short: "HAMR",
      chance: 25,
      family: "KNOCKBACK",
    },
    {
      names: ["Tempered Blade", "Keen Blade"],
      dmg: [8, 12],
      short: "BLDE",
      chance: 10,
      family: "NONE",
    },
  ],
  4: [
    {
      names: ["Silver Sabre", "Obsidian Sabre"],
      dmg: [7, 10],
      short: "SABR",
      chance: 25,
      family: "NONE",
    },
    {
      names: ["Steel Longsword", "Knight Longsword"],
      dmg: [8, 12],
      short: "LSWD",
      chance: 40,
      family: "NONE",
    },
    {
      names: ["Viking Axe", "Heavy Axe"],
      dmg: [9, 14],
      short: "AXE",
      chance: 25,
      family: "CLEAVE",
    },
    {
      names: ["Master Blade", "Runed Blade"],
      dmg: [11, 16],
      short: "BLDE",
      chance: 10,
      family: "NONE",
    },
  ],
  5: [
    {
      names: ["Steel Longsword", "Knight Longsword"],
      dmg: [9, 13],
      short: "LSWD",
      chance: 25,
      family: "NONE",
    },
    {
      names: ["Heavy Axe", "Dwarven Axe"],
      dmg: [11, 16],
      short: "AXE",
      chance: 35,
      family: "CLEAVE",
    },
    {
      names: ["Guard Halberd", "Black Halberd"],
      dmg: [12, 18],
      short: "HLBD",
      chance: 25,
      family: "REACH",
    },
    {
      names: ["Champion Weapon", "Runic Weapon"],
      dmg: [14, 20],
      short: "ELIT",
      chance: 15,
      family: "ARCANE",
    },
  ],
  6: [
    {
      names: ["Dwarven Axe", "Execution Axe"],
      dmg: [12, 18],
      short: "AXE",
      chance: 25,
      family: "CLEAVE",
    },
    {
      names: ["Black Halberd", "War Halberd"],
      dmg: [14, 22],
      short: "HLBD",
      chance: 35,
      family: "REACH",
    },
    {
      names: ["Runic Sword", "Glyph Sword"],
      dmg: [16, 24],
      short: "RSWD",
      chance: 25,
      family: "ARCANE",
    },
    {
      names: ["Hero Weapon", "Ancient Weapon"],
      dmg: [18, 28],
      short: "HERO",
      chance: 15,
      family: "ARCANE",
    },
  ],
  7: [
    {
      names: ["War Halberd", "Royal Halberd"],
      dmg: [16, 24],
      short: "HLBD",
      chance: 25,
      family: "REACH",
    },
    {
      names: ["Glyph Sword", "Arcane Sword"],
      dmg: [18, 28],
      short: "ASWD",
      chance: 35,
      family: "ARCANE",
    },
    {
      names: ["Berserk Axe", "Titan Axe"],
      dmg: [20, 32],
      short: "GAXE",
      chance: 25,
      family: "CLEAVE",
    },
    {
      names: ["Relic Weapon", "Sacred Relic"],
      dmg: [24, 36],
      short: "RELC",
      chance: 15,
      family: "ARCANE",
    },
  ],
  8: [
    {
      names: ["Arcane Sword", "Astral Sword"],
      dmg: [20, 30],
      short: "ASWD",
      chance: 25,
      family: "ARCANE",
    },
    {
      names: ["Titan Axe", "Doom Axe"],
      dmg: [24, 38],
      short: "GAXE",
      chance: 35,
      family: "CLEAVE",
    },
    {
      names: ["Sacred Relic", "Elder Relic"],
      dmg: [28, 42],
      short: "RELC",
      chance: 25,
      family: "ARCANE",
    },
    {
      names: ["Legendary Blade", "Mythic Blade"],
      dmg: [35, 50],
      short: "LGND",
      chance: 15,
      family: "ARCANE",
    },
  ],
};

// ============================================
// BOW REGISTRY — 5 Tiers, D&D-inspired names
// ============================================
export const BOWS = [
  // TIER 1: Levels 1-5 (Bonus +0 to +1)
  {
    names: ["Shortbow", "Light Crossbow", "Hunting Bow", "Simple Wood Bow", "Worn Shortbow"],
    minBonus: 0,
    maxBonus: 1,
    minLevel: 1,
    maxLevel: 5,
  },
  // TIER 2: Levels 6-15 (Bonus +1 to +3)
  {
    names: ["Longbow", "Heavy Crossbow", "Composite Bow", "Yew Longbow", "Ranger's Bow"],
    minBonus: 1,
    maxBonus: 3,
    minLevel: 6,
    maxLevel: 15,
  },
  // TIER 3: Levels 16-30 (Bonus +3 to +6)
  {
    names: ["Masterwork Longbow", "Elven Shortbow", "Reinforced Crossbow", "Bone-crafted Bow", "Recurve Bow"],
    minBonus: 3,
    maxBonus: 6,
    minLevel: 16,
    maxLevel: 30,
  },
  // TIER 4: Levels 31-45 (Bonus +6 to +8)
  {
    names: ["Radiant Bow", "Shadow-strike Bow", "Frost-runed Bow", "Storm Longbow", "Flame-kissed Bow"],
    minBonus: 6,
    maxBonus: 8,
    minLevel: 31,
    maxLevel: 45,
  },
  // TIER 5: Levels 46-50 (Bonus +8 to +10)
  {
    names: ["Oathbow", "Dragon-bone Longbow", "Celestial Greatbow", "Sylvan Greatbow", "Fiend-slayer Bow"],
    minBonus: 8,
    maxBonus: 10,
    minLevel: 46,
    maxLevel: 50,
  },
];

// Grand Registre des Armures (20 archetypes, 60 variantes)
export const ARMORS = [
  // PALIER 1: Niveaux 1-5 (AR 2-4)
  {
    names: ["Tattered Tunic", "Beggar Rags", "Threadbare Cloak"],
    baseAR: 2,
    minLevel: 1,
    maxLevel: 5,
  },
  {
    names: ["Padded Jack", "Thick Cloth", "Woven Vest"],
    baseAR: 3,
    minLevel: 1,
    maxLevel: 5,
  },
  {
    names: ["Beast Pelt", "Rough Hide", "Scavenger Wrap"],
    baseAR: 4,
    minLevel: 1,
    maxLevel: 5,
  },
  // PALIER 2: Niveaux 6-10 (AR 5-8)
  {
    names: ["Leather Tunic", "Trapper Suit", "Stitched Leather"],
    baseAR: 5,
    minLevel: 6,
    maxLevel: 10,
  },
  {
    names: ["Boiled Carapace", "Hardened Leather", "Cured Hide"],
    baseAR: 6,
    minLevel: 6,
    maxLevel: 10,
  },
  {
    names: ["Studded Vest", "Riveted Leather", "Spiked Jacket"],
    baseAR: 8,
    minLevel: 6,
    maxLevel: 10,
  },
  // PALIER 3: Niveaux 11-15 (AR 10-14)
  {
    names: ["Ringmail Shirt", "Linked Chain", "Iron Mesh"],
    baseAR: 10,
    minLevel: 11,
    maxLevel: 15,
  },
  {
    names: ["Scale Armor", "Dragon Scales", "Drake Suit"],
    baseAR: 12,
    minLevel: 11,
    maxLevel: 15,
  },
  {
    names: ["Chainmail Hauberk", "Steel Links", "Knight's Chain"],
    baseAR: 14,
    minLevel: 11,
    maxLevel: 15,
  },
  // PALIER 4: Niveaux 16-20 (AR 17-22)
  {
    names: ["Splint Mail", "Banded Iron", "Plated Mail"],
    baseAR: 17,
    minLevel: 16,
    maxLevel: 20,
  },
  {
    names: ["Bronze Cuirass", "Hoplite Chest", "Brass Shell"],
    baseAR: 19,
    minLevel: 16,
    maxLevel: 20,
  },
  {
    names: ["Steel Half-Plate", "Guard's Plate", "Mercenary Armor"],
    baseAR: 22,
    minLevel: 16,
    maxLevel: 20,
  },
  // PALIER 5: Niveaux 21-30 (AR 25-30)
  {
    names: ["Full Plate", "Paladin Armor", "Crusader Suit"],
    baseAR: 25,
    minLevel: 21,
    maxLevel: 30,
  },
  {
    names: ["Titanium Shell", "Alloy Carapace", "Heavy Rig"],
    baseAR: 27,
    minLevel: 21,
    maxLevel: 30,
  },
  {
    names: ["Crystal Mail", "Prismatic Plate", "Quartz Armor"],
    baseAR: 30,
    minLevel: 21,
    maxLevel: 30,
  },
  // PALIER 6: Niveaux 31-40 (AR 34-45)
  {
    names: ["Obsidian Plate", "Volcanic Shell", "Magma Cuirass"],
    baseAR: 34,
    minLevel: 31,
    maxLevel: 40,
  },
  {
    names: ["Mithril Vest", "Elven Silver", "Moonlight Chain"],
    baseAR: 38,
    minLevel: 31,
    maxLevel: 40,
  },
  {
    names: ["Void Mantle", "Abyssal Plate", "Shadow Carapace"],
    baseAR: 42,
    minLevel: 31,
    maxLevel: 40,
  },
  // PALIER 7: Niveaux 41-50 (AR 48-55)
  {
    names: ["Neon Juggernaut", "Overdrive Suit", "Synth-Plate"],
    baseAR: 48,
    minLevel: 41,
    maxLevel: 50,
  },
  {
    names: ["Aegis Relic", "Astral Armor", "Celestial Harness"],
    baseAR: 55,
    minLevel: 41,
    maxLevel: 50,
  },
];

// Potions
export const POTIONS = [
  { name: "HEALING", effect: "hp", value: 5 },
  { name: "STRENGTH", effect: "maxHp", value: 5 },
  { name: "TOUGHNESS", effect: "armor", value: 1 },
  { name: "PRECISION", effect: "dmgBonus", value: 2 },
];

// Vendor scrolls
export const VENDOR_SCROLLS = {
  A: [
    { name: "Healing", effect: "fullHp", price: 8 },
    { name: "Vitality", effect: "maxHp5", price: 14 },
    { name: "Toughness", effect: "armor1", price: 18 },
    { name: "Precision", effect: "dmg1", price: 20 },
  ],
  B: [
    { name: "Restore", effect: "fullHp", price: 12 },
    { name: "Strength", effect: "maxHp10", price: 22 },
    { name: "Shell", effect: "armor2", price: 28 },
    { name: "Mastery", effect: "dmg2", price: 30 },
  ],
  C: [
    { name: "Old Blood", effect: "maxHp15", price: 35 },
    { name: "Aegis", effect: "armor3", price: 40 },
    { name: "Pure Strike", effect: "dmg3", price: 42 },
  ],
  D: [
    { name: "Titan", effect: "maxHp20", price: 55 },
    { name: "Steel", effect: "armor4", price: 55 },
    { name: "Destruction", effect: "dmg4", price: 60 },
    { name: "Treasure", effect: "gold2x", price: 40 },
    { name: "Master TP", effect: "masterTp", price: 30 },
  ],
  E: [
    { name: "Immortal", effect: "maxHp30", price: 80 },
    { name: "Fortress", effect: "armor5", price: 75 },
    { name: "Executioner", effect: "dmg5", price: 80 },
    { name: "The Pact", effect: "pact", price: 45 },
  ],
};

// Gems
export const GEMS = [
  { class: 2, color: NEON.green, name: "GREEN GEM", unlock: "ARCHER" },
  { class: 3, color: NEON.white, name: "WHITE GEM", unlock: "PRIEST" },
  { class: 4, color: NEON.red, name: "RED GEM", unlock: "BERSERKER" },
  { class: 5, color: NEON.cyan, name: "CYAN GEM", unlock: "TRANSMUTER" },
  { class: 6, color: NEON.blue, name: "BLUE GEM", unlock: "MAGE" },
];
