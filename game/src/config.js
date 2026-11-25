// Sizzle & Serve — shared constants: canvas size, shift length, the kitchen
// floor plan and the look of the room. Every other module reads from here so
// the layout lives in exactly one place.
export const VIEW_W = 1280;
export const VIEW_H = 800;

// A full shift lasts two and a half minutes of play.
export const SHIFT_SECONDS = 150;

// How fast the chef walks, in pixels per second.
export const CHEF_SPEED = 270;
// How close the chef must be to a station to use it.
export const REACH = 96;

// Order pressure: tickets arrive this often at the start of the shift, and
// this often by the end. The kitchen gets busier without adding chores.
export const SPAWN_START = 15;
export const SPAWN_END = 7;
export const MAX_ORDERS = 4;
export const ORDER_TIME = 48;

// Chopping takes this long while the key is held; a burner finishes a dish
// in this time, then stays good for this long before it burns.
export const CHOP_SECONDS = 2.4;
export const COOK_SECONDS = 6;
export const READY_SECONDS = 9;

// Serving quickly in a row builds a combo; the window to keep it alive.
export const COMBO_WINDOW = 20;

// The room's palette: warm wood, cream tile and one hot red accent.
export const COLORS = {
  floorA: '#c98f4e',
  floorB: '#bd8342',
  wall: '#7a4a2b',
  wallTop: '#5d3620',
  counter: '#e8dcc3',
  counterEdge: '#b09a72',
  pantry: '#8a5a33',
  board: '#d9b380',
  stove: '#3c3f46',
  stoveHot: '#c0392b',
  window: '#2e6f8e',
  plate: '#f4f1e6',
  ink: '#2b1d12',
  cream: '#fff7e6',
  gold: '#f5b942',
  red: '#d23b2e',
  green: '#3e9e4d',
};

// The floor plan. Each station is a rectangle the chef walks around; the
// pantry holds one bin per ingredient, the stove two burners, the plating
// counter two plate slots.
export const STATIONS = {
  pantry: { id: 'pantry', label: 'PANTRY', x: 24, y: 216, w: 196, h: 424 },
  board: { id: 'board', label: 'CHOPPING BOARD', x: 296, y: 300, w: 190, h: 120 },
  stove: { id: 'stove', label: 'STOVE', x: 560, y: 204, w: 260, h: 108 },
  plating: { id: 'plating', label: 'PLATING COUNTER', x: 480, y: 612, w: 340, h: 116 },
  window: { id: 'window', label: 'SERVING WINDOW', x: 1080, y: 216, w: 176, h: 208 },
  trash: { id: 'trash', label: 'TRASH', x: 1080, y: 612, w: 120, h: 116 },
};

// Burner centres, relative to the stove rectangle.
export const BURNERS = [
  { x: 625, y: 258 },
  { x: 755, y: 258 },
];

// Plate slots on the plating counter.
export const PLATE_SLOTS = [
  { x: 565, y: 670 },
  { x: 735, y: 670 },
];

// Pantry bins: two columns of four, inside the pantry rectangle.
export const PANTRY_BINS = [
  { id: 'tomato', x: 44, y: 240 },
  { id: 'lettuce', x: 124, y: 240 },
  { id: 'bread', x: 44, y: 348 },
  { id: 'bun', x: 124, y: 348 },
  { id: 'patty', x: 44, y: 456 },
  { id: 'cheese', x: 124, y: 456 },
  { id: 'pasta', x: 44, y: 564 },
  { id: 'sauce', x: 124, y: 564 },
];

export const BEST_KEY = 'sizzle-and-serve-best';
