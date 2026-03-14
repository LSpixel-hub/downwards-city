// ============================================
// DOWNWARDS - OVERDRIVE ROGUE
// Seeded PRNG Singleton (Mulberry32)
// ============================================

function mulberry32(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let currentRNG = Math.random;

export const setSeed = (seed) => {
  if (seed == null) currentRNG = Math.random;
  else currentRNG = mulberry32(seed);
};

export const getRand = () => currentRNG();

export const getRandInt = (min, max) =>
  min + Math.floor(currentRNG() * (max - min + 1));
