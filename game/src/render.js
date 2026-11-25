// Sizzle & Serve — everything the player sees: the kitchen floor, the
// stations, the food, the chef, the order rail, the HUD and the screens.
// All art is drawn with canvas paths, no image files.
import {
  BURNERS,
  COLORS,
  PANTRY_BINS,
  PLATE_SLOTS,
  STATIONS,
  VIEW_H,
  VIEW_W,
} from './config.js';
import {
  INGREDIENTS,
  RECIPES,
  ingredientName,
  possibleRecipes,
  recipeById,
} from './recipes.js';
import { orderUrgency } from './orders.js';

const TAU = Math.PI * 2;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function circle(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
}

function text(ctx, s, x, y, size, color, align = 'center', weight = '700') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// --- Food icons ----------------------------------------------------------

export function drawFood(ctx, finished, x, y, r) {
  const [id, state] = finished.split(':');
  const ing = INGREDIENTS[id];
  if (!ing) return;
  if (state === 'burnt') {
    circle(ctx, x, y, r, '#1c1c1c');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.5, y - r * 0.3);
    ctx.lineTo(x + r * 0.4, y + r * 0.3);
    ctx.moveTo(x + r * 0.5, y - r * 0.4);
    ctx.lineTo(x - r * 0.3, y + r * 0.4);
    ctx.stroke();
    return;
  }
  if (id === 'tomato') {
    if (state === 'chopped') {
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f2705f';
      ctx.beginPath();
      ctx.moveTo(x, y - r * 0.7);
      ctx.arc(x, y, r * 0.7, -Math.PI / 2, Math.PI / 2);
      ctx.closePath();
      ctx.fill();
    } else {
      circle(ctx, x, y, r, ing.color);
      circle(ctx, x - r * 0.3, y - r * 0.3, r * 0.25, '#f2705f');
      ctx.fillStyle = '#3e9e4d';
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x - r * 0.45, y - r * 1.25);
      ctx.lineTo(x, y - r * 0.8);
      ctx.lineTo(x + r * 0.45, y - r * 1.25);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }
  if (id === 'lettuce') {
    ctx.fillStyle = ing.color;
    if (state === 'chopped') {
      for (let i = -1; i <= 1; i++) {
        rr(ctx, x + i * r * 0.7 - r * 0.35, y - r * 0.5 + Math.abs(i) * r * 0.25, r * 0.7, r * 0.35, 3);
        ctx.fill();
      }
    } else {
      circle(ctx, x - r * 0.4, y, r * 0.62, ing.color);
      circle(ctx, x + r * 0.4, y, r * 0.62, ing.color);
      circle(ctx, x, y - r * 0.3, r * 0.62, '#6fc47e');
      ctx.strokeStyle = ing.dark;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y - r * 0.5);
      ctx.lineTo(x, y + r * 0.5);
      ctx.stroke();
    }
    return;
  }
  if (id === 'bread') {
    rr(ctx, x - r, y - r * 0.7, r * 2, r * 1.4, r * 0.5);
    ctx.fillStyle = ing.color;
    ctx.fill();
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.6, y);
    ctx.lineTo(x + r * 0.6, y);
    ctx.stroke();
    return;
  }
  if (id === 'bun') {
    ctx.beginPath();
    ctx.arc(x, y + r * 0.4, r, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = ing.color;
    ctx.fill();
    rr(ctx, x - r, y + r * 0.25, r * 2, r * 0.35, 3);
    ctx.fillStyle = ing.dark;
    ctx.fill();
    ctx.fillStyle = '#fff2cf';
    circle(ctx, x - r * 0.4, y - r * 0.35, r * 0.12, '#fff2cf');
    circle(ctx, x + r * 0.1, y - r * 0.55, r * 0.12, '#fff2cf');
    circle(ctx, x + r * 0.5, y - r * 0.2, r * 0.12, '#fff2cf');
    return;
  }
  if (id === 'patty') {
    circle(ctx, x, y, r, state === 'cooked' ? '#6b3f22' : ing.color);
    ctx.strokeStyle = state === 'cooked' ? '#3d2412' : ing.dark;
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * r * 0.55 - r * 0.3, y - r * 0.5);
      ctx.lineTo(x + i * r * 0.55 + r * 0.3, y + r * 0.5);
      ctx.stroke();
    }
    return;
  }
  if (id === 'cheese') {
    ctx.beginPath();
    ctx.moveTo(x - r, y + r * 0.7);
    ctx.lineTo(x + r, y + r * 0.7);
    ctx.lineTo(x + r * 0.8, y - r * 0.5);
    ctx.lineTo(x - r * 0.8, y - r * 0.2);
    ctx.closePath();
    ctx.fillStyle = ing.color;
    ctx.fill();
    ctx.fillStyle = ing.dark;
    circle(ctx, x - r * 0.2, y + r * 0.2, r * 0.16, ing.dark);
    circle(ctx, x + r * 0.35, y + r * 0.35, r * 0.12, ing.dark);
    return;
  }
  if (id === 'pasta') {
    ctx.strokeStyle = state === 'cooked' ? '#e8b93e' : ing.color;
    ctx.lineWidth = r * 0.32;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(x, y + i * r * 0.55, r * 0.55, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
    return;
  }
  if (id === 'sauce') {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#f4f1e6';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y - r * 0.1, r * 0.85, 0, Math.PI);
    ctx.closePath();
    ctx.fillStyle = ing.color;
    ctx.fill();
    return;
  }
}

function drawPlate(ctx, x, y, r, items) {
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.72, 0, 0, TAU);
  ctx.fillStyle = COLORS.plate;
  ctx.fill();
  ctx.strokeStyle = '#c9bd9d';
  ctx.lineWidth = 2;
  ctx.stroke();
  items.forEach((item, i) => {
    const a = -Math.PI / 2 + (i * TAU) / Math.max(1, items.length);
    drawFood(ctx, item, x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.3, r * 0.34);
  });
}

function progressRing(ctx, x, y, r, frac, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * TAU);
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.stroke();
}

// --- The room ------------------------------------------------------------

function drawFloor(ctx, game) {
  ctx.fillStyle = COLORS.floorA;
  ctx.fillRect(0, 176, VIEW_W, VIEW_H - 176);
  ctx.fillStyle = COLORS.floorB;
  const tile = 64;
  for (let y = 176; y < VIEW_H; y += tile) {
    for (let x = ((y / tile) % 2) * tile; x < VIEW_W; x += tile * 2) {
      ctx.fillRect(x, y, tile, tile);
    }
  }
  // Top wall.
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 56, VIEW_W, 120);
  ctx.fillStyle = COLORS.wallTop;
  ctx.fillRect(0, 56, VIEW_W, 10);
  // A warm strip of tiles along the wall, like a real kitchen backsplash.
  ctx.fillStyle = '#e8dcc3';
  ctx.fillRect(0, 168, VIEW_W, 8);
}

function stationCard(ctx, s, highlight) {
  rr(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fillStyle = COLORS.counter;
  ctx.fill();
  ctx.strokeStyle = highlight ? COLORS.gold : COLORS.counterEdge;
  ctx.lineWidth = highlight ? 4 : 2;
  ctx.stroke();
  text(ctx, s.label, s.x + s.w / 2, s.y + 16, 12, COLORS.ink, 'center', '800');
}

function drawKitchen(ctx, game) {
  const { kitchen, player } = game;
  const near = game.nearStation;
  drawFloor(ctx, game);

  // Pantry: wooden shelves with one bin per ingredient.
  const p = STATIONS.pantry;
  rr(ctx, p.x, p.y, p.w, p.h, 12);
  ctx.fillStyle = COLORS.pantry;
  ctx.fill();
  ctx.strokeStyle = '#5d3620';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, p.label, p.x + p.w / 2, p.y + 16, 12, '#ffe9c4', 'center', '800');
  for (const bin of PANTRY_BINS) {
    rr(ctx, bin.x, bin.y, 72, 92, 8);
    ctx.fillStyle = '#f4ead2';
    ctx.fill();
    ctx.strokeStyle = '#b09a72';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawFood(ctx, `${bin.id}:ready`, bin.x + 36, bin.y + 32, 20);
    text(ctx, INGREDIENTS[bin.id].name, bin.x + 36, bin.y + 76, 11, COLORS.ink);
  }
  if (near && near.id === 'pantry') {
    text(ctx, 'E: take ingredient', p.x + p.w / 2, p.y + p.h + 18, 13, '#fff', 'center', '700');
  }

  // Chopping board.
  const b = STATIONS.board;
  stationCard(ctx, b, near && near.id === 'board');
  rr(ctx, b.x + 18, b.y + 34, b.w - 36, b.h - 48, 8);
  ctx.fillStyle = COLORS.board;
  ctx.fill();
  ctx.strokeStyle = '#a87f4e';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (kitchen.board) {
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2 + 8;
    if (kitchen.board.done) {
      drawFood(ctx, kitchen.board.done, cx, cy, 24);
      text(ctx, 'chopped — E to take', cx, b.y + b.h - 8, 11, COLORS.ink);
    } else {
      drawFood(ctx, `${kitchen.board.id}:raw`, cx, cy, 24);
      progressRing(ctx, cx, cy, 34, kitchen.board.progress, COLORS.gold);
      text(ctx, 'hold E to chop', cx, b.y + b.h - 8, 11, COLORS.ink);
    }
  } else {
    text(ctx, 'bring tomato or lettuce', b.x + b.w / 2, b.y + b.h / 2 + 8, 12, '#8a6a45');
  }

  // Stove with two burners.
  const s = STATIONS.stove;
  rr(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fillStyle = COLORS.stove;
  ctx.fill();
  ctx.strokeStyle = '#23252b';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, s.label, s.x + s.w / 2, s.y + 16, 12, '#cfd3da', 'center', '800');
  BURNERS.forEach((burner, i) => {
    const slot = kitchen.burners[i];
    circle(ctx, burner.x, burner.y, 30, '#17181c');
    ctx.strokeStyle = '#55585f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(burner.x, burner.y, 30, 0, TAU);
    ctx.stroke();
    if (slot) {
      if (slot.state === 'cooking') {
        drawFood(ctx, `${slot.id}:raw`, burner.x, burner.y, 20);
        progressRing(ctx, burner.x, burner.y, 38, slot.t / 6, '#ff8c42');
      } else if (slot.state === 'ready') {
        drawFood(ctx, `${slot.id}:cooked`, burner.x, burner.y, 20);
        const pulse = 0.6 + 0.4 * Math.sin(game.time * 6);
        ctx.strokeStyle = `rgba(245,185,66,${pulse})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(burner.x, burner.y, 38, 0, TAU);
        ctx.stroke();
        text(ctx, 'READY', burner.x, burner.y - 46, 11, COLORS.gold, 'center', '800');
      } else {
        drawFood(ctx, 'patty:burnt', burner.x, burner.y, 20);
        text(ctx, 'BURNT!', burner.x, burner.y - 46, 11, '#ff6b5e', 'center', '800');
      }
    }
  });

  // Plating counter with two plate slots.
  const pl = STATIONS.plating;
  stationCard(ctx, pl, near && near.id === 'plating');
  PLATE_SLOTS.forEach((slotPos, i) => {
    const plate = kitchen.plates[i];
    if (plate) {
      drawPlate(ctx, slotPos.x, slotPos.y, 44, plate.items);
      const match = possibleRecipes(plate.items);
      if (plate.items.length > 0 && match.length > 0) {
        text(ctx, match.map((r) => r.name).join(' / '), slotPos.x, pl.y - 12, 11, '#fff', 'center', '700');
      }
    } else {
      ctx.beginPath();
      ctx.ellipse(slotPos.x, slotPos.y, 44, 32, 0, 0, TAU);
      ctx.strokeStyle = 'rgba(43,29,18,0.35)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'empty plate spot', slotPos.x, slotPos.y, 11, '#8a6a45');
    }
  });

  // Serving window.
  const w = STATIONS.window;
  rr(ctx, w.x, w.y, w.w, w.h, 12);
  ctx.fillStyle = COLORS.window;
  ctx.fill();
  ctx.strokeStyle = '#1d4a61';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, w.label, w.x + w.w / 2, w.y + 16, 12, '#dff2fa', 'center', '800');
  ctx.fillStyle = '#bfe3f2';
  rr(ctx, w.x + 16, w.y + 36, w.w - 32, 54, 8);
  ctx.fill();
  text(ctx, 'SERVE HERE', w.x + w.w / 2, w.y + 63, 14, '#1d4a61', 'center', '800');
  text(ctx, 'E: hand over the plate', w.x + w.w / 2, w.y + 110, 12, '#dff2fa');
  text(ctx, 'wrong dish = no sale', w.x + w.w / 2, w.y + 132, 12, '#bfe3f2');
  text(ctx, 'expired ticket = -1 star', w.x + w.w / 2, w.y + 154, 12, '#bfe3f2');

  // Trash.
  const t = STATIONS.trash;
  rr(ctx, t.x, t.y, t.w, t.h, 12);
  ctx.fillStyle = '#4a4d52';
  ctx.fill();
  ctx.strokeStyle = '#2c2e32';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, t.label, t.x + t.w / 2, t.y + 16, 12, '#d7d9dc', 'center', '800');
  text(ctx, 'E: toss it', t.x + t.w / 2, t.y + 58, 12, '#d7d9dc');
}

// --- Order rail and HUD --------------------------------------------------

function drawTickets(ctx, game) {
  const board = game.board;
  const railY = 64;
  const railH = 104;
  ctx.fillStyle = 'rgba(43,29,18,0.92)';
  ctx.fillRect(0, railY, VIEW_W, railH);
  text(ctx, 'ORDERS', 52, railY + railH / 2, 15, '#f5b942', 'left', '800');
  board.orders.forEach((order, i) => {
    const recipe = recipeById(order.recipeId);
    const x = 110 + i * 296;
    const y = railY + 8;
    const w = 284;
    const h = railH - 16;
    const urgent = order.timeLeft < 12;
    rr(ctx, x, y, w, h, 10);
    ctx.fillStyle = urgent ? '#ffe3de' : '#fff7e6';
    ctx.fill();
    ctx.strokeStyle = urgent ? '#d23b2e' : '#b09a72';
    ctx.lineWidth = urgent ? 3 : 2;
    ctx.stroke();
    text(ctx, recipe.name, x + 12, y + 16, 15, COLORS.ink, 'left', '800');
    text(ctx, `$${recipe.price}`, x + w - 12, y + 16, 15, COLORS.green, 'right', '800');
    recipe.needs.forEach((need, j) => {
      drawFood(ctx, need, x + 24 + j * 34, y + 42, 13);
    });
    text(ctx, recipe.blurb, x + 12, y + 60, 10, '#6b5a44', 'left', '500');
    text(ctx, `${Math.ceil(order.timeLeft)}s`, x + w - 12, y + 60, 11, urgent ? COLORS.red : '#6b5a44', 'right', '800');
    // Timer bar.
    const frac = Math.max(0, orderUrgency(order));
    ctx.fillStyle = '#e5dcc8';
    rr(ctx, x + 12, y + h - 12, w - 24, 7, 3);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? COLORS.green : frac > 0.25 ? COLORS.gold : COLORS.red;
    if (frac > 0) {
      rr(ctx, x + 12, y + h - 12, (w - 24) * frac, 7, 3);
      ctx.fill();
    }
  });
  if (board.orders.length === 0) {
    text(ctx, 'No orders yet — the lunch rush is coming.', 640, railY + railH / 2, 15, '#f5b942');
  }
}

function drawHUD(ctx, game) {
  ctx.fillStyle = '#2b1d12';
  ctx.fillRect(0, 0, VIEW_W, 56);
  text(ctx, 'SIZZLE & SERVE', 20, 29, 20, '#f5b942', 'left', '800');
  // Shift timer.
  const frac = Math.max(0, game.shiftLeft / game.shiftSeconds);
  ctx.fillStyle = '#4a3826';
  rr(ctx, 300, 18, 420, 20, 10);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? COLORS.green : frac > 0.25 ? COLORS.gold : COLORS.red;
  if (frac > 0) {
    rr(ctx, 300, 18, 420 * frac, 20, 10);
    ctx.fill();
  }
  const mm = Math.floor(game.shiftLeft / 60);
  const ss = Math.floor(game.shiftLeft % 60);
  text(ctx, `SHIFT ${mm}:${String(ss).padStart(2, '0')}`, 510, 29, 14, '#fff', 'center', '800');
  circle(ctx, 782, 28, 11, '#f5b942');
  ctx.strokeStyle = '#c99a1e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(782, 28, 11, 0, TAU);
  ctx.stroke();
  text(ctx, '$', 782, 29, 13, '#7a5a10', 'center', '800');
  text(ctx, `${game.board.coins}`, 800, 29, 18, '#ffd76a', 'left', '800');
  if (game.board.combo > 1) {
    text(ctx, `COMBO x${game.board.combo}`, 920, 29, 16, '#ff8c42', 'left', '800');
  }
  let stars = '';
  for (let i = 0; i < 3; i++) stars += i < game.stars ? '★' : '☆';
  text(ctx, stars, 1180, 29, 20, '#f5b942', 'center', '800');
}

// --- The chef ------------------------------------------------------------

function drawChef(ctx, game) {
  const p = game.player;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 18, 22, 8, 0, 0, TAU);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();
  // Body: white apron over a red shirt.
  circle(ctx, p.x, p.y, 22, '#d23b2e');
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 6, 15, 13, 0, 0, TAU);
  ctx.fillStyle = '#fff7e6';
  ctx.fill();
  // Face.
  circle(ctx, p.x + p.dirX * 6, p.y - 4 + p.dirY * 4, 9, '#f2c89b');
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  rr(ctx, p.x - 13, p.y - 30, 26, 10, 4);
  ctx.fill();
  circle(ctx, p.x - 8, p.y - 30, 8, '#ffffff');
  circle(ctx, p.x, p.y - 33, 9, '#ffffff');
  circle(ctx, p.x + 8, p.y - 30, 8, '#ffffff');
  // Carried item floats above the hat.
  if (p.carry) {
    const cy = p.y - 52;
    circle(ctx, p.x, cy, 20, 'rgba(255,247,230,0.9)');
    ctx.strokeStyle = '#b09a72';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, cy, 20, 0, TAU);
    ctx.stroke();
    if (p.carry.kind === 'plate') {
      drawPlate(ctx, p.x, cy, 16, p.carry.items);
    } else if (p.carry.burnt) {
      drawFood(ctx, 'patty:burnt', p.x, cy, 13);
    } else {
      drawFood(ctx, p.carry.finished || `${p.carry.id}:raw`, p.x, cy, 13);
    }
  }
  // Click-to-move target marker.
  if (p.target) {
    ctx.strokeStyle = 'rgba(245,185,66,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.target.x, p.target.y, 8, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.target.x - 12, p.target.y);
    ctx.lineTo(p.target.x + 12, p.target.y);
    ctx.moveTo(p.target.x, p.target.y - 12);
    ctx.lineTo(p.target.x, p.target.y + 12);
    ctx.stroke();
  }
}

function drawParticles(ctx, game) {
  for (const pt of game.particles) {
    const a = Math.max(0, pt.life / pt.maxLife);
    ctx.globalAlpha = a;
    if (pt.text) {
      text(ctx, pt.text, pt.x, pt.y, 20, pt.color, 'center', '800');
    } else {
      circle(ctx, pt.x, pt.y, pt.size * a + 1, pt.color);
    }
  }
  ctx.globalAlpha = 1;
  for (const t of game.kitchen.toasts) {
    ctx.globalAlpha = Math.min(1, t.life);
    text(ctx, t.text, t.x, t.y - (1.4 - t.life) * 30, 18, t.color, 'center', '800');
  }
  ctx.globalAlpha = 1;
}

// --- Screens -------------------------------------------------------------

function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(20,12,6,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'SIZZLE & SERVE', 640, 150, 72, '#f5b942', 'center', '800');
  text(ctx, 'Run the kitchen. Chop it, grill it, plate it, serve it.', 640, 205, 22, '#fff7e6');
  text(ctx, 'WASD / arrows to walk · click to walk there · E to use a station · hold E to chop', 640, 250, 17, '#ffd76a');
  text(ctx, 'Serve orders before their timers run out. Three strikes and the shift ends.', 640, 280, 17, '#ffd76a');
  let y = 340;
  text(ctx, '— TODAY\u2019S MENU —', 640, y, 16, '#f5b942', 'center', '800');
  y += 30;
  for (const recipe of RECIPES) {
    text(ctx, `${recipe.name}  ·  $${recipe.price}  ·  ${recipe.blurb}`, 640, y, 16, '#fff7e6', 'center', '600');
    y += 26;
  }
  const blink = 0.6 + 0.4 * Math.sin(game.time * 4);
  ctx.globalAlpha = blink;
  text(ctx, 'Press ENTER or click to start your shift', 640, 560, 24, '#ffffff', 'center', '800');
  ctx.globalAlpha = 1;
  if (game.best > 0) text(ctx, `Best shift so far: ${game.best} coins`, 640, 600, 16, '#ffd76a');
  text(ctx, 'M mute · P pause', 640, 640, 14, '#b09a72');
}

function drawPaused(ctx, game) {
  ctx.fillStyle = 'rgba(20,12,6,0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'PAUSED', 640, 360, 56, '#fff7e6', 'center', '800');
  text(ctx, 'Press P or click to get back to the pass', 640, 420, 18, '#ffd76a');
}

function drawOver(ctx, game) {
  ctx.fillStyle = 'rgba(20,12,6,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const won = game.overReason === 'complete';
  text(ctx, won ? 'SHIFT COMPLETE!' : 'SHIFT OVER', 640, 170, 56, won ? '#f5b942' : '#ff6b5e', 'center', '800');
  text(ctx, won ? 'The lunch rush is done — the pass is clear.' : 'Three strikes — the kitchen closed early.', 640, 220, 20, '#fff7e6');
  const b = game.board;
  const rows = [
    ['Coins earned', `${b.coins}`],
    ['Dishes served', `${b.served}`],
    ['Orders lost', `${b.expired}`],
    ['Best combo', `x${b.bestCombo}`],
  ];
  let y = 300;
  for (const [label, value] of rows) {
    text(ctx, label, 520, y, 20, '#ffd76a', 'left', '600');
    text(ctx, value, 760, y, 20, '#fff7e6', 'right', '800');
    y += 40;
  }
  let stars = '';
  for (let i = 0; i < 3; i++) stars += i < game.stars ? '★' : '☆';
  text(ctx, stars, 640, y + 20, 36, '#f5b942');
  if (b.coins > game.best) text(ctx, 'New best shift!', 640, y + 70, 20, '#7be382');
  else if (game.best > 0) text(ctx, `Best shift: ${game.best} coins`, 640, y + 70, 18, '#ffd76a');
  const blink = 0.6 + 0.4 * Math.sin(game.time * 4);
  ctx.globalAlpha = blink;
  text(ctx, 'Press ENTER to cook again', 640, y + 130, 22, '#ffffff', 'center', '800');
  ctx.globalAlpha = 1;
}

// --- Entry point ---------------------------------------------------------

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = VIEW_W * dpr;
  canvas.height = VIEW_H * dpr;
  ctx.scale(dpr, dpr);
  return {
    draw(game) {
      ctx.clearRect(0, 0, VIEW_W, VIEW_H);
      drawKitchen(ctx, game);
      drawTickets(ctx, game);
      drawHUD(ctx, game);
      drawChef(ctx, game);
      drawParticles(ctx, game);
      if (game.phase === 'title') drawTitle(ctx, game);
      else if (game.phase === 'paused') drawPaused(ctx, game);
      else if (game.phase === 'over') drawOver(ctx, game);
      if (game.toast) {
        ctx.globalAlpha = Math.min(1, game.toast.life);
        text(ctx, game.toast.text, 640, 700, 20, game.toast.color, 'center', '800');
        ctx.globalAlpha = 1;
      }
    },
  };
}
