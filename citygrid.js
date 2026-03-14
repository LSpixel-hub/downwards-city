export const CITY_SIZE = 5;

export function getScreenId(x, y) {
  return `${x},${y}`;
}

function isHubScreen(x, y) {
  // Reserve a 3x3 central district for hubs (9 hubs total).
  return x >= 1 && x <= 3 && y >= 1 && y <= 3;
}

function createScreenMeta(x, y) {
  return {
    coords: { x, y },
    templateType: isHubScreen(x, y) ? "hub" : "street",
    exits: {
      north: y > 0,
      south: y < CITY_SIZE - 1,
      west: x > 0,
      east: x < CITY_SIZE - 1,
    },
    pois: [],
    spawnTable: { enemies: [] },
  };
}

export function createCityGrid() {
  const screens = {};

  for (let y = 0; y < CITY_SIZE; y += 1) {
    for (let x = 0; x < CITY_SIZE; x += 1) {
      screens[getScreenId(x, y)] = createScreenMeta(x, y);
    }
  }

  const getScreen = (x, y) => {
    if (x < 0 || x >= CITY_SIZE || y < 0 || y >= CITY_SIZE) return null;
    return screens[getScreenId(x, y)] || null;
  };

  const canExit = (x, y, dir) => {
    const screen = getScreen(x, y);
    if (!screen) return false;
    return Boolean(screen.exits?.[dir]);
  };

  return {
    screens,
    getScreen,
    canExit,
  };
}
