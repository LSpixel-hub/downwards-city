import { getScreenId } from "./citygrid.js";

export const initialCityState = {
  activeScreen: { x: 2, y: 0 },
  playerPos: { x: 1, y: 1 },
  screenStates: {},
  transition: { active: false, direction: null },
};

export function applyScreenDelta({ x, y }, dir) {
  const deltas = {
    north: { x: 0, y: -1 },
    south: { x: 0, y: 1 },
    west: { x: -1, y: 0 },
    east: { x: 1, y: 0 },
  };

  const delta = deltas[dir];
  if (!delta) return { x, y };

  return {
    x: x + delta.x,
    y: y + delta.y,
  };
}

export function ensureScreenState(state, x, y) {
  const screenId = getScreenId(x, y);
  const current = state.screenStates[screenId];
  if (current) return state;

  return {
    ...state,
    screenStates: {
      ...state.screenStates,
      [screenId]: {
        template: null,
        enemies: [],
        items: [],
        flags: {},
      },
    },
  };
}

export function cityReducer(state, action) {
  switch (action.type) {
    case "CITY_MOVE_REQUEST": {
      if (!action.payload?.direction) return state;
      return {
        ...state,
        transition: {
          active: true,
          direction: action.payload.direction,
        },
      };
    }

    case "CITY_SCREEN_CHANGED": {
      const nextScreen = action.payload?.screen;
      if (
        !nextScreen ||
        typeof nextScreen.x !== "number" ||
        typeof nextScreen.y !== "number"
      ) {
        return state;
      }

      const ensuredState = ensureScreenState(state, nextScreen.x, nextScreen.y);
      return {
        ...ensuredState,
        activeScreen: { x: nextScreen.x, y: nextScreen.y },
      };
    }

    case "CITY_UPDATE_SCREEN_STATE": {
      const x = action.payload?.x;
      const y = action.payload?.y;
      const patch = action.payload?.patch;
      if (typeof x !== "number" || typeof y !== "number" || !patch) return state;

      const ensuredState = ensureScreenState(state, x, y);
      const screenId = getScreenId(x, y);
      const currentScreenState = ensuredState.screenStates[screenId];

      return {
        ...ensuredState,
        screenStates: {
          ...ensuredState.screenStates,
          [screenId]: {
            ...currentScreenState,
            ...patch,
          },
        },
      };
    }

    case "CITY_SET_TRANSITION": {
      const active = Boolean(action.payload?.active);
      const direction = action.payload?.direction ?? null;
      return {
        ...state,
        transition: {
          active,
          direction,
        },
      };
    }

    default:
      return state;
  }
}
