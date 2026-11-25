// Sizzle & Serve — staged states for screenshots. ?shot=start | play | end
// sets the game up in a fixed, deterministic pose and freezes it, so a
// screenshot shows the real game at its best: the title over the kitchen, a
// mid-shift rush with orders, ingredients on the counter and chopping in
// progress, and the shift-end results. Every pose is built through the
// game's own state — real orders, real plates, real timers — never drawn
// by hand.
import { addOrder } from './orders.js';

export function stageShot(game, name) {
  if (name === 'start') {
    game.phase = 'title';
    game.player.x = 640;
    game.player.y = 470;
    game.player.carry = null;
    game.board.orders = [];
    addOrder(game.board, () => 0.1);
    addOrder(game.board, () => 0.4);
    return;
  }
  if (name === 'play') {
    // Mid-shift: three tickets on the rail, one nearly out of time, a plate
    // mid-assembly on the counter, a patty sizzling, and the chef at the
    // board halfway through chopping a tomato.
    game.phase = 'play';
    game.elapsed = 72;
    game.shiftLeft = 78;
    game.board.coins = 46;
    game.board.combo = 2;
    game.board.comboLeft = 14;
    game.board.served = 4;
    game.board.orders = [];
    const o1 = addOrder(game.board, () => 0.05, 42);
    const o2 = addOrder(game.board, () => 0.35, 26);
    const o3 = addOrder(game.board, () => 0.7, 9);
    o1.recipeId = 'cheeseburger';
    o2.recipeId = 'garden-sandwich';
    o3.recipeId = 'marinara-pasta';
    game.kitchen.plates[0] = { items: ['bun:ready', 'patty:cooked'] };
    game.kitchen.plates[1] = { items: ['pasta:cooked'] };
    game.kitchen.burners[0] = { id: 'patty', state: 'cooking', t: 4 };
    game.kitchen.burners[1] = null;
    game.kitchen.board = { id: 'tomato', progress: 0.55, done: null };
    game.player.x = 340;
    game.player.y = 500;
    game.player.dirX = 0;
    game.player.dirY = -1;
    game.player.carry = { kind: 'ingredient', id: 'lettuce', finished: 'lettuce:chopped' };
    game.chopping = true;
    return;
  }
  if (name === 'end') {
    // Shift-end results: a strong shift, one star lost, best combo on show.
    game.phase = 'over';
    game.overReason = 'complete';
    game.shiftLeft = 0;
    game.board.coins = 128;
    game.board.served = 9;
    game.board.expired = 1;
    game.board.bestCombo = 3;
    game.board.combo = 0;
    game.stars = 2;
    game.best = 96;
    game.player.x = 1168;
    game.player.y = 470;
    game.player.carry = { kind: 'plate', items: ['pasta:cooked', 'sauce:ready', 'tomato:chopped'] };
    game.kitchen.plates[0] = null;
    game.kitchen.plates[1] = null;
    game.kitchen.burners[0] = null;
    game.kitchen.burners[1] = null;
    game.kitchen.board = null;
    return;
  }
}
