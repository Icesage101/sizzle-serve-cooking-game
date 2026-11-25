// Sizzle & Serve — ingredients and recipes. An ingredient is raw, chopped or
// cooked; a recipe is the exact set of finished ingredients a plate must hold.
// The judge reads these names, so they say what the food is.

// Every ingredient the pantry stocks. prep says what the kitchen must do to
// it before it can go on a plate: none, chop or cook.
export const INGREDIENTS = {
  tomato: { id: 'tomato', name: 'Tomato', prep: 'chop', color: '#e23b2e', dark: '#a91f14' },
  lettuce: { id: 'lettuce', name: 'Lettuce', prep: 'chop', color: '#58b368', dark: '#2f7d3d' },
  bread: { id: 'bread', name: 'Bread', prep: 'none', color: '#e8b96a', dark: '#b98a3e' },
  bun: { id: 'bun', name: 'Bun', prep: 'none', color: '#e0a854', dark: '#a87a30' },
  patty: { id: 'patty', name: 'Patty', prep: 'cook', color: '#8a5a33', dark: '#5d3a1e' },
  cheese: { id: 'cheese', name: 'Cheese', prep: 'none', color: '#f5c542', dark: '#c99a1e' },
  pasta: { id: 'pasta', name: 'Pasta', prep: 'cook', color: '#f2d06b', dark: '#c9a13a' },
  sauce: { id: 'sauce', name: 'Sauce', prep: 'none', color: '#c0392b', dark: '#8e2318' },
};

// A finished ingredient on a plate is named by id plus prep state, e.g.
// "tomato:chopped" or "patty:cooked". Ready ingredients keep prep "none".
export function finishedId(id) {
  const prep = INGREDIENTS[id].prep;
  if (prep === 'chop') return `${id}:chopped`;
  if (prep === 'cook') return `${id}:cooked`;
  return `${id}:ready`;
}

export function baseId(finished) {
  return finished.split(':')[0];
}

export function ingredientName(finished) {
  const ing = INGREDIENTS[baseId(finished)];
  if (finished.endsWith(':chopped')) return `Chopped ${ing.name}`;
  if (finished.endsWith(':cooked')) return `Cooked ${ing.name}`;
  return ing.name;
}

// The menu. Each recipe lists the finished ingredients its plate must hold,
// in any order, and what the window pays for it.
export const RECIPES = [
  {
    id: 'garden-sandwich',
    name: 'Garden Sandwich',
    needs: ['bread:ready', 'tomato:chopped', 'lettuce:chopped'],
    price: 14,
    blurb: 'Bread, chopped tomato, chopped lettuce',
  },
  {
    id: 'cheeseburger',
    name: 'Cheeseburger',
    needs: ['bun:ready', 'patty:cooked', 'cheese:ready'],
    price: 18,
    blurb: 'Bun, grilled patty, cheese',
  },
  {
    id: 'pasta-plate',
    name: 'Pasta Plate',
    needs: ['pasta:cooked', 'sauce:ready'],
    price: 16,
    blurb: 'Cooked pasta, sauce',
  },
  {
    id: 'salad-bowl',
    name: 'Salad Bowl',
    needs: ['lettuce:chopped', 'tomato:chopped', 'cheese:ready'],
    price: 12,
    blurb: 'Chopped lettuce, chopped tomato, cheese',
  },
  {
    id: 'marinara-pasta',
    name: 'Marinara Pasta',
    needs: ['pasta:cooked', 'sauce:ready', 'tomato:chopped'],
    price: 20,
    blurb: 'Cooked pasta, sauce, chopped tomato',
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

// Does this plate's contents match a recipe exactly, ingredient for
// ingredient? Returns the recipe or null.
export function matchRecipe(plateItems) {
  const sorted = [...plateItems].sort();
  for (const recipe of RECIPES) {
    const needs = [...recipe.needs].sort();
    if (needs.length === sorted.length && needs.every((n, i) => n === sorted[i])) {
      return recipe;
    }
  }
  return null;
}

// Which recipes could this plate still become? Used for the plating hint.
export function possibleRecipes(plateItems) {
  return RECIPES.filter((recipe) =>
    plateItems.every((item) => recipe.needs.includes(item)) &&
    plateItems.length < recipe.needs.length,
  );
}
