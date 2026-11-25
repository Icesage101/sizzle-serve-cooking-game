// Sizzle & Serve — the kitchen itself: what sits on the chopping board, what
// is cooking on each burner, and which plates wait on the plating counter.
// Chopping needs the key held; cooking runs on its own clock and burns.
import { BURNERS, CHOP_SECONDS, COOK_SECONDS, PLATE_SLOTS, READY_SECONDS } from './config.js';
import { INGREDIENTS, finishedId } from './recipes.js';

export function createKitchen() {
  return {
    // { id, progress } while a raw ingredient waits on the board.
    board: null,
    // One slot per burner: { id, state: 'cooking'|'ready'|'burnt', t }.
    burners: BURNERS.map(() => null),
    // One plate per slot: { items: [finishedId, ...] } or null.
    plates: PLATE_SLOTS.map(() => null),
    // Floating feedback shown above the kitchen ("+24", "Burnt!", ...).
    toasts: [],
  };
}

export function toast(kitchen, text, x, y, color = '#fff7e6') {
  kitchen.toasts.push({ text, x, y, color, life: 1.4 });
}

export function updateKitchen(kitchen, dt) {
  for (let i = 0; i < kitchen.burners.length; i++) {
    const slot = kitchen.burners[i];
    if (!slot) continue;
    slot.t += dt;
    if (slot.state === 'cooking' && slot.t >= COOK_SECONDS) {
      slot.state = 'ready';
      slot.t = 0;
    } else if (slot.state === 'ready' && slot.t >= READY_SECONDS) {
      slot.state = 'burnt';
      slot.t = 0;
    }
  }
  for (const t of kitchen.toasts) t.life -= dt;
  kitchen.toasts = kitchen.toasts.filter((t) => t.life > 0);
}

// Hold-to-chop: call every frame while the key is held near the board.
// When the ring fills, the item stays on the board, finished, ready to take.
export function chopTick(kitchen, dt) {
  if (!kitchen.board || kitchen.board.done) return false;
  kitchen.board.progress += dt / CHOP_SECONDS;
  if (kitchen.board.progress >= 1) {
    kitchen.board.done = finishedId(kitchen.board.id);
    kitchen.board.progress = 1;
    return true;
  }
  return false;
}

// What happens when the chef presses E at a station. Returns a short event
// the main loop turns into a sound or a toast; the player's hands change in
// player.js through the returned action.
export function interact(kitchen, stationId, carry) {
  if (stationId === 'board') {
    if (!kitchen.board && carry && carry.kind === 'ingredient') {
      const ing = INGREDIENTS[carry.id];
      if (ing.prep === 'chop') {
        kitchen.board = { id: carry.id, progress: 0, done: null };
        return { action: 'place-board', takeCarry: true };
      }
      return { action: 'no-chop' };
    }
    if (kitchen.board && kitchen.board.done && !carry) {
      const done = kitchen.board.done;
      const id = kitchen.board.id;
      kitchen.board = null;
      return { action: 'take-chopped', give: { kind: 'ingredient', id, finished: done } };
    }
    if (kitchen.board) return { action: 'chopping' };
    return { action: 'empty-board' };
  }
  if (stationId === 'stove') {
    const free = kitchen.burners.findIndex((b) => b === null);
    if (carry && carry.kind === 'ingredient') {
      const ing = INGREDIENTS[carry.id];
      if (ing.prep !== 'cook') return { action: 'no-cook' };
      if (free < 0) return { action: 'stove-full' };
      kitchen.burners[free] = { id: carry.id, state: 'cooking', t: 0 };
      return { action: 'place-stove', takeCarry: true, burner: free };
    }
    const ready = kitchen.burners.findIndex((b) => b && b.state === 'ready');
    const burnt = kitchen.burners.findIndex((b) => b && b.state === 'burnt');
    if (carry) return { action: 'hands-full' };
    if (ready >= 0) {
      const id = kitchen.burners[ready].id;
      kitchen.burners[ready] = null;
      return { action: 'take-cooked', give: { kind: 'ingredient', id, finished: finishedId(id) } };
    }
    if (burnt >= 0) {
      const id = kitchen.burners[burnt].id;
      kitchen.burners[burnt] = null;
      return { action: 'take-burnt', give: { kind: 'ingredient', id, finished: 'burnt', burnt: true } };
    }
    return { action: 'empty-stove' };
  }
  if (stationId === 'plating') {
    const slot = kitchen.plates.findIndex((p) => p !== null);
    const free = kitchen.plates.findIndex((p) => p === null);
    if (carry && carry.kind === 'plate') {
      if (free < 0) return { action: 'counter-full' };
      kitchen.plates[free] = { items: [...carry.items] };
      return { action: 'put-plate', takeCarry: true };
    }
    if (carry && carry.kind === 'ingredient' && carry.finished) {
      if (slot < 0) return { action: 'no-plate' };
      const plate = kitchen.plates[slot];
      if (plate.items.length >= 3) return { action: 'plate-full' };
      if (plate.items.includes(carry.finished)) return { action: 'already-on' };
      plate.items.push(carry.finished);
      return { action: 'add-to-plate', takeCarry: true };
    }
    if (!carry && slot >= 0) {
      const plate = kitchen.plates[slot];
      kitchen.plates[slot] = null;
      return { action: 'take-plate', give: { kind: 'plate', items: [...plate.items] } };
    }
    if (!carry && slot < 0) {
      return { action: 'take-fresh-plate', give: { kind: 'plate', items: [] } };
    }
    return { action: 'nothing-here' };
  }
  if (stationId === 'trash') {
    if (carry) return { action: 'trash', takeCarry: true };
    return { action: 'nothing-here' };
  }
  return { action: 'nothing-here' };
}
