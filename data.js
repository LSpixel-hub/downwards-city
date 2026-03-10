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
    name: "UNDER TOWN",
    floorColor: "#6b624a", // Sable clair (sandBright)
    corridorColor: NEON.orange,
    floorChars: ["·", "·", "·", "⋅", "∙"],
    levels: [1, 5],
    // Plasma : bleu espace / indigo froid — remplace le rose/rouge par défaut
    plasmaColor1: "#302c20", // Sable sombre au fond
    plasmaColor2: "#002244", // Eau profonde au fond
    gridColor: "0,119,187", // Lueur de la grille en bleu océan (RGB de #0077bb)
    bgFrom: "#050a10", // Fond très sombre (abysses)
    bgTo: "#0f1520",
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

// ============================================
// MONSTERS - THE COMMODORE CULT & HARDWARE HORRORS
// ============================================

export const MONSTERS = [
  // Niveaux 1-5 : Les petits bugs et problèmes matériels de base
  {
    char: "r",
    ai: "COWARD",
    names: ["Raster Bug", "RAM Rot", "Read Error", "Ribbon Cable Rat", "Run-Time Reject", "ROM Roach"],
    hp: 2,
    dmg: 1,
    colors: [NEON.purple, NEON.pink, NEON.gray, NEON.red],
    effect: { type: "STEAL_GOLD", chance: 0.1, msg: "DATA THEFT" }, // Le vol d'or devient un vol de données
  },
  {
    char: "I",
    ai: "ERRATIC",
    names: ["Interrupt Request", "Infinite Loop", "Invalid Syntax", "I/O Imp", "Illegal Opcode", "Index Glitch"],
    hp: 4,
    dmg: 2,
    colors: [NEON.blue, NEON.red, NEON.orange, NEON.magenta],
    effect: { type: "SPAWN", chance: 0.15, msg: "FORK BOMB" }, // Le spawn devient une Fork Bomb
  },
  {
    char: "S",
    ai: "MELEE",
    names: ["Syntax Error", "Stack Overflow", "SID Static", "Sprite Ghost", "Sector Slime", "Spaghetti Code"],
    hp: 6,
    dmg: 3,
    colors: [NEON.green, NEON.lime, NEON.yellow, NEON.cyan],
    effect: { type: "PIERCE", chance: 0.2, msg: "GLITCH" },
  },
  // Niveaux 6-15 : Les erreurs plus graves et les esprits du hardware
  {
    char: "G",
    ai: "AMBUSH",
    names: ["Garbage Data", "Glitch Goblin", "GOSUB Ghoul", "Graphics Artifact", "GOTO Guardian", "Gateway Gremlin"],
    hp: 14,
    dmg: 4,
    colors: [NEON.green, NEON.yellow, NEON.gray, NEON.orange],
    effect: { type: "STEAL_GOLD", chance: 0.1, msg: "DATA THEFT" },
  },
  {
    char: "Z",
    ai: "MELEE",
    names: ["Zero Page Zombie", "Z80 Prisoner", "Zombie Process", "Zero-Day Zealot", "Z-Index Specter", "Zap Command"],
    // Note : Z80 Prisoner est un clin d'oeil génial. Ce sont les codes de l'Amstrad/ZX faits prisonniers !
    hp: 18,
    dmg: 5,
    colors: [NEON.green, NEON.cyan, NEON.lime, NEON.purple],
    effect: { type: "WITHER", chance: 0.15, msg: "MEMORY CORRUPTION" },
  },
  {
    char: "O",
    ai: "MELEE",
    names: ["Out of Memory", "Overclocked Ogre", "Overflow Ooze", "Orphaned Pointer", "Opcode Orc", "Overvolt"],
    hp: 25,
    dmg: 9,
    colors: [NEON.red, NEON.orange, NEON.gray, NEON.purple],
    effect: { type: "HEAVY_BLOW", chance: 0.15, msg: "SYSTEM CRASH" },
  },
  // Niveaux 16-30 : Menaces structurelles et démons du code
  {
    char: "M",
    ai: "MELEE",
    names: ["Memory Leak", "Malware Minotaur", "Motherboard Mutant", "Megahertz Mummy", "Modem Shriek", "Macro Menace"],
    hp: 30,
    dmg: 11,
    colors: [NEON.orange, NEON.red, NEON.yellow, NEON.purple],
    effect: { type: "HEAVY_BLOW", chance: 0.15, msg: "BAD SECTOR" },
  },
  {
    char: "W",
    ai: "ERRATIC",
    names: ["Warm Boot Wraith", "Worm", "Write Error", "Wait State", "Wiring Hazard", "Web Weaver"],
    hp: 35,
    dmg: 13,
    colors: [NEON.purple, NEON.cyan, NEON.blue, NEON.white],
    effect: { type: "DODGE", chance: 0.25, msg: "PHASE SHIFT" },
  },
  {
    char: "T",
    ai: "JUGGERNAUT",
    names: ["Trojan", "Tape Load Terror", "Timing Bug", "Transistor Troll", "Tape Error", "Track 0 Thug"],
    hp: 40,
    dmg: 16,
    colors: [NEON.cyan, NEON.green, NEON.lime, NEON.orange],
    effect: { type: "REGEN", chance: 1.0, value: 3, msg: "REBOOT" },
  },
  // Niveaux 31-40 : Entités destructrices et sectaires de haut niveau
  {
    char: "F",
    ai: "AMBUSH",
    names: ["Fatal Error", "Floppy Disk Fiend", "Floating Point Fault", "Fragmentation", "Formatting Fire", "Firmware Freak"],
    hp: 50,
    dmg: 21,
    colors: [NEON.magenta, NEON.red, NEON.purple, NEON.white],
    effect: { type: "HEAVY_BLOW", chance: 0.25, msg: "FORMAT C:" },
  },
  {
    char: "H",
    ai: "ERRATIC",
    names: ["Hexadecimal Horror", "Hardware Interrupt", "Heat Sink Hellhound", "Hacker Spirit", "Halt Command", "High-Byte Harpy"],
    hp: 70,
    dmg: 23,
    colors: [NEON.purple, NEON.red, NEON.orange, NEON.magenta],
    effect: { type: "VAMPIRISM", chance: 0.4, msg: "CPU DRAIN" },
  },
  {
    char: "V",
    ai: "MELEE",
    names: ["Virus", "VIC-II Vampire", "VBlank Voidling", "Variable Viper", "Voltage Spike", "Vector Vandal"],
    hp: 80,
    dmg: 26,
    colors: [NEON.red, NEON.magenta, NEON.purple, NEON.cyan],
    effect: { type: "VAMPIRISM", chance: 0.4, msg: "LEECH CYCLE" },
  },
  // Niveaux 41-50 : Les gardiens du KERNAL (boss de paliers)
  {
    char: "L",
    ai: "RANGED",
    names: ["Logic Bomb", "Load Error Lich", "Latency Leviathan", "Legacy Code", "Low-Byte Lurker", "Loophole"],
    hp: 90,
    dmg: 30,
    colors: [NEON.cyan, NEON.white, NEON.blue, NEON.purple],
    effect: { type: "DRAIN", chance: 0.25, msg: "DOWNGRADE" },
  },
  {
    char: "N",
    ai: "RANGED",
    names: ["Null Pointer", "Non-Maskable Interrupt", "Noise Channel Naga", "Network Necromancer", "Nybble Nightmare"],
    hp: 90,
    dmg: 34,
    colors: [NEON.purple, NEON.pink, NEON.red, NEON.white],
    effect: { type: "SPAWN", chance: 0.3, msg: "DUPLICATE" },
  },
  {
    char: "P",
    ai: "MELEE",
    names: ["PEEK Phantom", "POKE Paladin", "Parity Error", "Pixel Poltergeist", "Program Counter Pit-Fiend"],
    hp: 110,
    dmg: 37,
    colors: [NEON.cyan, NEON.white, NEON.red, NEON.magenta],
    effect: { type: "PIERCE", chance: 0.3, msg: "OVERWRITE" },
  },
  {
    char: "A",
    ai: "JUGGERNAUT",
    names: ["Assembler Abomination", "Address Bus Archangel", "ALU Assassin", "ASCII Anomaly", "Array Avenger"],
    hp: 120,
    dmg: 43,
    colors: [NEON.yellow, NEON.white, NEON.magenta, NEON.cyan],
    effect: { type: "AURA", chance: 1.0, value: 2, msg: "STATIC AURA" },
  },
  {
    char: "X",
    ai: "STALKER",
    names: ["XOR Executioner", "X-Modem Xeno", "X-Register Xorn", "X-Ray CRT Glitch"],
    hp: 130,
    dmg: 48,
    colors: [NEON.orange, NEON.yellow, NEON.purple, NEON.red],
    effect: { type: "WALL_PHASE", chance: 1.0, msg: "NOCLIP" },
  },
  {
    char: "Q",
    ai: "RANGED",
    names: ["Quote Mode Queen", "Queue Overflow", "Q-Link Phantom", "Query Quetzal", "QWERTY Quasher"],
    hp: 140,
    dmg: 51,
    colors: [NEON.magenta, NEON.purple, NEON.green, NEON.red],
    effect: { type: "CORRODE", chance: 0.3, msg: "DECOMPILE" },
  },
  {
    char: "K",
    ai: "JUGGERNAUT",
    names: ["KERNAL Panic", "Kilobyte Kraken", "Keylogger Knight", "Keyboard Killer"],
    // KERNAL est l'orthographe officielle (et erronée) de l'OS du Commodore 64 !
    hp: 160,
    dmg: 58,
    colors: [NEON.blue, NEON.cyan, NEON.purple, NEON.red],
    effect: { type: "PARRY", chance: 0.5, msg: "FIREWALL" },
  },
  {
    char: "D",
    ai: "STALKER",
    names: ["Data Bus Dragon", "Deadlock Demon", "Disk Drive Doom", "DMA Destroyer", "DOS Avenger"],
    hp: 180,
    dmg: 65,
    colors: [NEON.red, NEON.orange, NEON.magenta, NEON.white],
    effect: { type: "INFERNO", chance: 0.25, msg: "OVERHEAT" },
  },
];

// ============================================
// WEAPONS - THE Z80 RESISTANCE ARSENAL
// ============================================
export const WEAPONS = {
  1: [
    { names: ["Spectrum Rubber Key", "Frayed Cassette Ribbon"], dmg: [2, 4], short: "WIRE", chance: 60, family: "NONE" },
    { names: ["Broken MSX Cartridge", "Amstrad Volume Knob"], dmg: [3, 5], short: "PIN", chance: 40, family: "CRIT" },
  ],
  2: [
    { names: ["Broken MSX Cartridge", "Amstrad Volume Knob"], dmg: [3, 5], short: "PIN", chance: 35, family: "CRIT" },
    { names: ["Kempston Joystick", "Amstrad JY-2"], dmg: [4, 6], short: "JOY", chance: 40, family: "NONE" },
    { names: ["ZX Microdrive", "MSX Data Recorder"], dmg: [5, 7], short: "DRVE", chance: 20, family: "KNOCKBACK" },
    { names: ["Aztec C Compiler", "Sinclair ZX Printer"], dmg: [6, 8], short: "TOOL", chance: 5, family: "CRIT" },
  ],
  3: [
    { names: ["Z80 RAM Stick", "AY-3-8912 Chip"], dmg: [5, 7], short: "CHIP", chance: 30, family: "NONE" },
    { names: ["Amstrad 3-inch Disk", "MSX Floppy Shard"], dmg: [6, 9], short: "DISK", chance: 35, family: "NONE" },
    { names: ["Sinclair Power Brick", "CPC Monitor Brick"], dmg: [7, 10], short: "BRCK", chance: 25, family: "KNOCKBACK" },
    { names: ["Spectrum Edge Connector", "MSX Slot Cleaner"], dmg: [8, 12], short: "IRON", chance: 10, family: "NONE" },
  ],
  4: [
    { names: ["Amstrad 3-inch Disk", "MSX Floppy Shard"], dmg: [7, 10], short: "DISK", chance: 25, family: "NONE" },
    { names: ["Centronics Cable", "ZX Interface 1 Cable"], dmg: [8, 12], short: "CABL", chance: 40, family: "NONE" },
    { names: ["Tape Splicer", "Data Shredder"], dmg: [9, 14], short: "SHRD", chance: 25, family: "CLEAVE" },
    { names: ["Multiface Two", "MSX Expansion Cartridge"], dmg: [11, 16], short: "CART", chance: 10, family: "NONE" },
  ],
  5: [
    { names: ["Centronics Cable", "ZX Interface 1 Cable"], dmg: [9, 13], short: "CABL", chance: 25, family: "NONE" },
    { names: ["Data Shredder", "Locomotive Smasher"], dmg: [11, 16], short: "SHRD", chance: 35, family: "CLEAVE" },
    { names: ["RS232 Whip", "Amstrad Joystick Cord"], dmg: [12, 18], short: "WHIP", chance: 25, family: "REACH" },
    { names: ["Multiface One", "Poke Finder"], dmg: [14, 20], short: "HACK", chance: 15, family: "ARCANE" },
  ],
  6: [
    { names: ["Locomotive Smasher", "Z80 Bus Terminator"], dmg: [12, 18], short: "TERM", chance: 25, family: "CLEAVE" },
    { names: ["RS232 Whip", "VDP Display Cord"], dmg: [14, 22], short: "WHIP", chance: 35, family: "REACH" },
    { names: ["Z80 Hex Injector", "Assembly Blade"], dmg: [16, 24], short: "CODE", chance: 25, family: "ARCANE" },
    { names: ["AMSDOS FastLoad", "MSX-DOS Boot Disk"], dmg: [18, 28], short: "FAST", chance: 15, family: "ARCANE" },
  ],
  7: [
    { names: ["VDP Display Cord", "Spectrum RGB Scart"], dmg: [16, 24], short: "FIBR", chance: 25, family: "REACH" },
    { names: ["Assembly Blade", "Z80 Machine Code"], dmg: [18, 28], short: "CODE", chance: 35, family: "ARCANE" },
    { names: ["Sinclair BASIC Smasher", "Z80 Decompiler"], dmg: [20, 32], short: "COMP", chance: 25, family: "CLEAVE" },
    { names: ["TMS9918 Video Engine", "Holy Z80 Processor"], dmg: [24, 36], short: "CPU", chance: 15, family: "ARCANE" },
  ],
  8: [
    { names: ["Z80 Machine Code", "MSX BIOS Rootkit"], dmg: [20, 30], short: "ROOT", chance: 25, family: "ARCANE" },
    { names: ["Locomotive Crusher", "AMSDOS Kernel Smasher"], dmg: [24, 38], short: "CRSH", chance: 35, family: "CLEAVE" },
    { names: ["Holy Z80 Processor", "AY-3 Masterpiece"], dmg: [28, 42], short: "CHIP", chance: 25, family: "ARCANE" },
    { names: ["The Z80 Source Code", "Sinclair Admin Rights"], dmg: [35, 50], short: "ADMN", chance: 15, family: "ARCANE" },
  ],
};

// ============================================
// BOW REGISTRY — Z80 RANGED PERIPHERALS
// ============================================
export const BOWS = [
  { names: ["Amstrad Light Pen", "Sinclair ZX Printer", "Cassette Audio Blaster", "MSX Joypad Port", "Worn Kempston Port"], minBonus: 0, maxBonus: 1, minLevel: 1, maxLevel: 5 },
  { names: ["Magnum Light Phaser", "GunStick", "Cheetah Defender", "Spectrum Bar Code Reader", "MSX Infrared"], minBonus: 1, maxBonus: 3, minLevel: 6, maxLevel: 15 },
  { names: ["Amstrad RS232 Interface", "ZX Interface 1", "MSX Modem Cartridge", "Overclocked Light Gun", "Z80 DMA Emitter"], minBonus: 3, maxBonus: 6, minLevel: 16, maxLevel: 30 },
  { names: ["Locomotive Compiler", "TMS9918 Disruptor", "AMSDOS Packet Sniper", "Spectrum +3 Disk Laser", "MSX-DOS Router"], minBonus: 6, maxBonus: 8, minLevel: 31, maxLevel: 45 },
  { names: ["Holy Z80 Uplink", "Sinclair ULA Beam", "VDP Orbital Laser", "AY-3-8912 Sonic Cannon", "The Z-Network"], minBonus: 8, maxBonus: 10, minLevel: 46, maxLevel: 50 },
];

// ============================================
// ARMORS - PROTECTIVE CASINGS & SHIELDING
// ============================================
export const ARMORS = [
  // PALIER 1: Niveaux 1-5 (AR 2-4)
  { names: ["Spectrum Rubber Mat", "Amstrad Dust Cover", "Cassette Tape Case"], baseAR: 2, minLevel: 1, maxLevel: 5 },
  { names: ["Cardboard Game Box", "Styrofoam Packing", "ZX81 Membrane"], baseAR: 3, minLevel: 1, maxLevel: 5 },
  { names: ["3-inch Floppy Sleeve", "Locomotive Manual", "MSX Cartridge Box"], baseAR: 4, minLevel: 1, maxLevel: 5 },
  // PALIER 2: Niveaux 6-10 (AR 5-8)
  { names: ["ZX81 Plastic Shell", "Rubber Key Vest", "Spectrum + Casing"], baseAR: 5, minLevel: 6, maxLevel: 10 },
  { names: ["CPC 464 Shell", "Hitachi MSX Frame", "Tape Deck Casing"], baseAR: 6, minLevel: 6, maxLevel: 10 },
  { names: ["Kempston Interface Box", "Membrane Keyboard Suit", "Amstrad Ribbon Vest"], baseAR: 8, minLevel: 6, maxLevel: 10 },
  // PALIER 3: Niveaux 11-15 (AR 10-14)
  { names: ["CTM644 Monitor Shell", "Copper Braid", "Z80 Solder Shield"], baseAR: 10, minLevel: 11, maxLevel: 15 },
  { names: ["ZX Spectrum Motherboard", "MSX PCB Plating", "Fiberglass Vest"], baseAR: 12, minLevel: 11, maxLevel: 15 },
  { names: ["Amstrad 6128 Chassis", "Aluminum Heat Sink", "MSX Cartridge Shield"], baseAR: 14, minLevel: 11, maxLevel: 15 },
  // PALIER 4: Niveaux 16-20 (AR 17-22)
  { names: ["Spectrum +2 Heat Sink", "Cooling Fins", "Thermal Paste Rig"], baseAR: 17, minLevel: 16, maxLevel: 20 },
  { names: ["DDI-1 Disk Drive Bay", "Amstrad Steel Casing", "MSX Engine Armor"], baseAR: 19, minLevel: 16, maxLevel: 20 },
  { names: ["Green Phosphor CRT Shell", "Glass Tube Armor", "Color Monitor Housing"], baseAR: 22, minLevel: 16, maxLevel: 20 },
  // PALIER 5: Niveaux 21-30 (AR 25-30)
  { names: ["ZX Spectrum 128k Heatsink", "Amstrad PCW Tower", "Yamaha MSX Frame"], baseAR: 25, minLevel: 21, maxLevel: 30 },
  { names: ["Z80 Server Rack", "Rackmount Frame", "Sinclair QL Panel"], baseAR: 27, minLevel: 21, maxLevel: 30 },
  { names: ["Faraday Cage", "Lead Shielding", "TMS9918 EMP Proof Suit"], baseAR: 30, minLevel: 21, maxLevel: 30 },
  // PALIER 6: Niveaux 31-40 (AR 34-45)
  { names: ["Overclocked Z80 Rig", "Liquid Cooled CPC Shell", "Freon Jacket"], baseAR: 34, minLevel: 31, maxLevel: 40 },
  { names: ["Silicon Wafers", "Titanium Frame", "Diecast Chassis"], baseAR: 38, minLevel: 31, maxLevel: 40 },
  { names: ["Quantum Plating", "Nano-Carbon Shell", "Cybernetic Z80 Carapace"], baseAR: 42, minLevel: 31, maxLevel: 40 },
  // PALIER 7: Niveaux 41-50 (AR 48-55)
  { names: ["Locomotive OS Admin Shell", "AMSDOS Kernel Armor", "MSX-DOS Root Access Suit"], baseAR: 48, minLevel: 41, maxLevel: 50 },
  { names: ["Holy Z80 Architecture", "Sinclair ULA Forcefield", "Perfect AY-3-8912 Rig"], baseAR: 55, minLevel: 41, maxLevel: 50 },
];

// ============================================
// CONSUMABLES - HACKER'S SURVIVAL (remplace les Potions)
// ============================================
export const POTIONS = [
  { name: "FRESH SODA", effect: "hp", value: 5 },         
  { name: "LEMON COLA", effect: "maxHp", value: 5 },      
  { name: "SYNTH-VITAMINS", effect: "armor", value: 1 },    
  { name: "ENERGY DRINK", effect: "dmgBonus", value: 2 },
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
