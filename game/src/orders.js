// Sizzle & Serve — the order board: tickets arrive, count down, get served
// or expire. Serving pays coins and builds a combo; an expired ticket costs
// a star and breaks the combo.
import {
  COMBO_WINDOW,
  MAX_ORDERS,
  ORDER_TIME,
  SPAWN_END,
  SPAWN_START,
} from './config.js';
import { RECIPES, recipeById } from './recipes.js';

let nextOrderId = 1;

export function createOrderBoard() {
  return {
    orders: [],
    spawnIn: 6,
    served: 0,
    expired: 0,
    coins: 0,
    combo: 0,
    comboLeft: 0,
    bestCombo: 0,
    lastServeAt: -999,
    lastServe: null,
  };
}

function pickRecipe(rng) {
  return RECIPES[Math.floor(rng() * RECIPES.length)];
}

export function addOrder(board, rng, timeLeft = ORDER_TIME) {
  const recipe = pickRecipe(rng);
  board.orders.push({
    id: nextOrderId++,
    recipeId: recipe.id,
    timeLeft,
    timeMax: timeLeft,
    bornAt: 0,
  });
  return board.orders[board.orders.length - 1];
}

// How long until the next ticket, shrinking as the shift runs on.
export function spawnDelay(elapsed, shiftSeconds) {
  const t = Math.min(1, elapsed / shiftSeconds);
  return SPAWN_START + (SPAWN_END - SPAWN_START) * t;
}

export function updateOrders(board, dt, elapsed, shiftSeconds, rng) {
  for (const order of board.orders) {
    order.timeLeft -= dt;
  }
  const expired = board.orders.filter((o) => o.timeLeft <= 0);
  board.orders = board.orders.filter((o) => o.timeLeft > 0);
  if (expired.length > 0) {
    board.expired += expired.length;
    board.combo = 0;
    board.comboLeft = 0;
  }
  if (board.comboLeft > 0) {
    board.comboLeft -= dt;
    if (board.comboLeft <= 0) board.combo = 0;
  }
  board.spawnIn -= dt;
  if (board.spawnIn <= 0 && board.orders.length < MAX_ORDERS) {
    addOrder(board, rng);
    board.spawnIn = spawnDelay(elapsed, shiftSeconds);
  }
  return expired;
}

// Serve a finished plate at the window. Returns the payment or null when no
// open ticket matches the plate.
export function servePlate(board, plateItems, now) {
  const sorted = [...plateItems].sort();
  const match = board.orders.find((order) => {
    const recipe = recipeById(order.recipeId);
    const needs = [...recipe.needs].sort();
    return needs.length === sorted.length && needs.every((n, i) => n === sorted[i]);
  });
  if (!match) return null;
  const recipe = recipeById(match.recipeId);
  board.orders = board.orders.filter((o) => o.id !== match.id);
  const fast = now - board.lastServeAt <= COMBO_WINDOW;
  board.combo = fast ? board.combo + 1 : 1;
  board.comboLeft = COMBO_WINDOW;
  board.bestCombo = Math.max(board.bestCombo, board.combo);
  board.lastServeAt = now;
  const timeBonus = Math.ceil((match.timeLeft / match.timeMax) * 6);
  const mult = 1 + Math.min(2, board.combo - 1) * 0.5;
  const pay = Math.round((recipe.price + timeBonus) * mult);
  board.coins += pay;
  board.served += 1;
  board.lastServe = { recipeId: recipe.id, pay, combo: board.combo, at: now };
  return { recipe, pay, combo: board.combo, timeBonus };
}

export function orderUrgency(order) {
  return order.timeLeft / order.timeMax;
}
