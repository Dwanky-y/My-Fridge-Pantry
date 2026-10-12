const aliases = {
  eggs: "egg",
  tomatoes: "tomato",
  onions: "onion",
  potatoes: "potato",
  carrots: "carrot",
  "bell peppers": "bell pepper",
  peppers: "bell pepper",
  "red pepper": "bell pepper",
  "green pepper": "bell pepper",
  "red bell pepper": "bell pepper",
  "green bell pepper": "bell pepper",
  chickpeas: "chickpea",
  "garbanzo beans": "chickpea",
  "canned chickpeas": "chickpea",
  "black beans": "black bean",
  "canned black beans": "black bean",
  "chicken breast": "chicken",
  "chicken breasts": "chicken",
  "white rice": "rice",
  "brown rice": "rice",
  spaghetti: "pasta",
  penne: "pasta",
  "cherry tomatoes": "tomato",
  "canned tomatoes": "tomato",
  "garlic cloves": "garlic",
  "clove of garlic": "garlic",
  "rolled oats": "oats",
  bananas: "banana",
  lemons: "lemon",
  tortillas: "tortilla",
  "cheddar cheese": "cheese",
  cheddar: "cheese",
};
export function normalizeIngredient(value) {
  const key = value.trim().toLowerCase().replace(/\s+/g, " ");
  return aliases[key] || key;
}

export const INVENTORY_KEY = "little-pantry.kitchen.v2";
export const LEGACY_KEY = "little-pantry.inventory.v1";
export const CONSENT_KEY = "little-pantry.storage-choice.v1";
export const UNITS = [
  "piece",
  "g",
  "kg",
  "oz",
  "lb",
  "ml",
  "l",
  "tsp",
  "tbsp",
  "cup",
  "clove",
  "can",
  "package",
];
const unitAliases = {
  "": "piece",
  pieces: "piece",
  whole: "piece",
  medium: "piece",
  large: "piece",
  small: "piece",
  grams: "g",
  gram: "g",
  kilograms: "kg",
  kilogram: "kg",
  ounces: "oz",
  ounce: "oz",
  pounds: "lb",
  pound: "lb",
  milliliters: "ml",
  milliliter: "ml",
  liters: "l",
  liter: "l",
  teaspoons: "tsp",
  teaspoon: "tsp",
  tablespoons: "tbsp",
  tablespoon: "tbsp",
  cups: "cup",
  cloves: "clove",
  cans: "can",
  packages: "package",
};
const conversions = {
  g: ["mass", 1],
  kg: ["mass", 1000],
  oz: ["mass", 28.349523125],
  lb: ["mass", 453.59237],
  ml: ["volume", 1],
  l: ["volume", 1000],
  tsp: ["volume", 4.92892159375],
  tbsp: ["volume", 14.78676478125],
  cup: ["volume", 236.5882365],
};
export function normalizeUnit(unit) {
  const value = String(unit || "")
    .toLowerCase()
    .trim();
  return unitAliases[value] || value;
}
export function convertQuantity(amount, from, to) {
  if (!Number.isFinite(amount) || amount < 0) return null;
  from = normalizeUnit(from);
  to = normalizeUnit(to);
  if (from === to) return amount;
  const a = conversions[from],
    b = conversions[to];
  return a && b && a[0] === b[0] ? (amount * a[1]) / b[1] : null;
}
export const formatQuantity = (value) =>
  Number(value.toFixed(3)).toLocaleString();
export function sanitizeItems(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item) =>
        item &&
        typeof item.name === "string" &&
        item.name.trim() &&
        ["Fridge", "Freezer", "Pantry"].includes(item.location),
    )
    .map((item, index) => ({
      id: typeof item.id === "string" ? item.id : `migrated-${index}`,
      name: item.name.trim().slice(0, 80),
      location: item.location === "Freezer" ? "Fridge" : item.location,
      quantity:
        Number.isFinite(item.quantity) && item.quantity >= 0
          ? item.quantity
          : null,
      unit: UNITS.includes(normalizeUnit(item.unit))
        ? normalizeUnit(item.unit)
        : "piece",
    }))
    .filter(
      (item, index, all) =>
        all.findIndex((other) => other.id === item.id) === index,
    );
}
export function findInventoryItem(ingredient, items) {
  return items.find(
    (item) =>
      item.quantity !== 0 &&
      normalizeIngredient(item.name) === normalizeIngredient(ingredient.name),
  );
}
export function createPlan(ingredients, items, multiplier = 1) {
  return ingredients.map((ingredient, index) => {
    const item = findInventoryItem(ingredient, items);
    const converted = item
      ? convertQuantity(
          ingredient.amount * multiplier,
          ingredient.unit,
          item.unit,
        )
      : null;
    return {
      rowId: index,
      ingredient,
      itemId: item?.id || "",
      quantity: converted === null ? "" : Number(converted.toFixed(6)),
    };
  });
}
export function applyDeductions(items, rows, eventId, recipeTitle) {
  const totals = new Map();
  for (const row of rows) {
    if (!row.itemId) continue;
    const quantity = Number(row.quantity);
    if (row.quantity === "" || !Number.isFinite(quantity) || quantity <= 0)
      throw new Error(
        "Enter a positive amount for each ingredient you will use.",
      );
    totals.set(row.itemId, (totals.get(row.itemId) || 0) + quantity);
  }
  const deductions = [];
  for (const [id, quantity] of totals) {
    const item = items.find((entry) => entry.id === id);
    if (!item || item.quantity === null)
      throw new Error(
        "Set the available quantity for every ingredient you will use.",
      );
    if (quantity > item.quantity + 0.000001)
      throw new Error(
        `Not enough ${item.name}: you have ${formatQuantity(item.quantity)} ${item.unit}.`,
      );
    deductions.push({ item: { ...item }, quantity });
  }
  return {
    items: items.map((item) =>
      totals.has(item.id)
        ? {
            ...item,
            quantity: Math.max(
              0,
              Number((item.quantity - totals.get(item.id)).toFixed(6)),
            ),
          }
        : item,
    ),
    event: { id: eventId, title: recipeTitle, deductions },
  };
}
export function undoDeductions(items, event) {
  const next = items.map((item) => ({ ...item }));
  for (const { item, quantity } of event.deductions) {
    const current = next.find((entry) => entry.id === item.id);
    if (current) {
      const converted = convertQuantity(quantity, item.unit, current.unit);
      if (converted === null || current.quantity === null)
        throw new Error(
          `Restore ${item.name} to its original unit before undoing.`,
        );
      current.quantity = Number((current.quantity + converted).toFixed(6));
    } else next.push({ ...item, quantity });
  }
  return next;
}
