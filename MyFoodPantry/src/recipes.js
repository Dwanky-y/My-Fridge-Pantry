export const STORAGE_KEY = "little-pantry.inventory.v1";
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
export function readInventory(storage) {
  const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "[]");
  if (!Array.isArray(parsed)) return [];
  const seen = new Set();
  return parsed
    .filter((item) => {
      if (
        !item ||
        typeof item.name !== "string" ||
        !item.name.trim() ||
        !["Fridge", "Pantry", "Freezer"].includes(item.location)
      )
        return false;
      const key = normalizeIngredient(item.name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((item) => ({
      name: item.name.trim().slice(0, 80),
      location: item.location,
    }));
}
export function matchRecipe(recipe, inventory) {
  const available = new Set(
    inventory.map((item) => normalizeIngredient(item.name)),
  );
  const missing = recipe.ingredients.filter(
    (item) => !available.has(normalizeIngredient(item.name)),
  );
  return {
    ...recipe,
    missing,
    owned: recipe.ingredients.length - missing.length,
    score:
      (recipe.ingredients.length - missing.length) / recipe.ingredients.length,
  };
}
const ingredient = (name, amount) => ({ name, amount });
export const recipes = [
  {
    id: "pasta",
    title: "Tomato & garlic pasta",
    description: "A little garlic, juicy tomatoes, and a very good dinner.",
    time: 20,
    category: "Vegetarian",
    art: "pasta",
    servings: 2,
    ingredients: [
      ingredient("pasta", "200 g"),
      ingredient("tomato", "3 medium, chopped"),
      ingredient("garlic", "2 cloves, minced"),
      ingredient("olive oil", "2 tbsp"),
    ],
    steps: [
      "Cook pasta in boiling water according to the packet. Reserve half a cup of cooking water, then drain.",
      "Warm olive oil in a skillet over medium heat. Add garlic and stir for 30 seconds.",
      "Add tomatoes and cook for 8–10 minutes until soft and saucy.",
      "Toss in pasta, adding a splash of reserved water to loosen the sauce. Taste and serve.",
    ],
  },
  {
    id: "salad",
    title: "Sunny chickpea salad",
    description: "Fresh, crunchy, and just the thing for a light lunch.",
    time: 10,
    category: "Vegan",
    art: "salad",
    servings: 2,
    ingredients: [
      ingredient("chickpea", "400 g can, drained and rinsed"),
      ingredient("cucumber", "½, diced"),
      ingredient("tomato", "2, diced"),
      ingredient("lemon", "½, juiced"),
      ingredient("olive oil", "1 tbsp"),
    ],
    steps: [
      "Combine drained chickpeas, cucumber, and tomatoes in a bowl.",
      "Whisk lemon juice and olive oil together.",
      "Toss the dressing through the salad and serve.",
    ],
  },
  {
    id: "rice",
    title: "Better-than-takeout fried rice",
    description: "Turn leftover rice into something worth looking forward to.",
    time: 15,
    category: "Vegetarian",
    art: "rice",
    servings: 2,
    ingredients: [
      ingredient("rice", "2 cups cooked and chilled"),
      ingredient("egg", "2"),
      ingredient("carrot", "1, finely diced"),
      ingredient("soy sauce", "2 tbsp"),
      ingredient("olive oil", "1 tbsp"),
    ],
    steps: [
      "Use rice chilled promptly after cooking and stored in the fridge; cook fresh rice first if needed (allow extra time).",
      "Heat oil in a skillet. Cook carrot for 4–5 minutes until tender.",
      "Push carrot to one side. Add beaten eggs and scramble until set.",
      "Add rice and soy sauce. Stir-fry until everything is steaming hot, then serve immediately.",
    ],
  },
  {
    id: "soup",
    title: "Cozy carrot & potato soup",
    description: "A comforting bowl made from everyday staples.",
    time: 30,
    category: "Vegan",
    art: "soup",
    servings: 2,
    ingredients: [
      ingredient("carrot", "3, chopped"),
      ingredient("potato", "2, diced"),
      ingredient("onion", "1, chopped"),
      ingredient("olive oil", "1 tbsp"),
    ],
    steps: [
      "Warm oil in a saucepan and soften onion for 5 minutes.",
      "Add carrots, potatoes, and 750 ml water. Bring to a boil.",
      "Cover and simmer for 20 minutes until the vegetables are tender.",
      "Mash or blend carefully until smooth. Add water if needed and serve warm.",
    ],
  },
  {
    id: "omelette",
    title: "Spinach & cheese omelette",
    description: "Your fridge essentials, folded into a fluffy favorite.",
    time: 10,
    category: "Vegetarian",
    art: "egg",
    servings: 1,
    ingredients: [
      ingredient("egg", "2"),
      ingredient("spinach", "1 handful"),
      ingredient("cheese", "30 g, grated"),
      ingredient("butter", "1 tsp"),
    ],
    steps: [
      "Beat eggs in a small bowl.",
      "Melt butter in a nonstick skillet over medium-low heat. Wilt the spinach for a minute.",
      "Pour in eggs and cook gently until almost set. Sprinkle cheese over one half.",
      "Fold in half and cook until the egg is fully set and cheese has melted.",
    ],
  },
  {
    id: "toast",
    title: "Avocado & egg toast",
    description: "An easy breakfast that feels like a café morning.",
    time: 10,
    category: "Vegetarian",
    art: "toast",
    servings: 1,
    ingredients: [
      ingredient("bread", "2 slices"),
      ingredient("avocado", "1"),
      ingredient("egg", "1"),
      ingredient("lemon", "¼, juiced"),
    ],
    steps: [
      "Boil the egg for 10–12 minutes, cool, peel, and slice.",
      "Toast bread. Mash avocado with lemon juice.",
      "Spread avocado on toast and top with sliced egg.",
    ],
  },
  {
    id: "quesadilla",
    title: "Black bean quesadillas",
    description: "Crisp outside, melty inside, ready in minutes.",
    time: 15,
    category: "Vegetarian",
    art: "toast",
    servings: 2,
    ingredients: [
      ingredient("tortilla", "4 small"),
      ingredient("black bean", "400 g can, drained"),
      ingredient("cheese", "100 g, grated"),
      ingredient("bell pepper", "1, finely diced"),
    ],
    steps: [
      "Mash beans roughly and mix with finely diced pepper.",
      "Spread bean mixture and cheese over two tortillas. Cover with the remaining tortillas.",
      "Cook in a dry nonstick skillet over medium-low heat for 3–4 minutes per side until golden and hot through.",
      "Cut into wedges and serve.",
    ],
  },
  {
    id: "oats",
    title: "Banana breakfast oats",
    description: "A warm, naturally sweet start to your day.",
    time: 10,
    category: "Vegetarian",
    art: "oats",
    servings: 1,
    ingredients: [
      ingredient("oats", "½ cup"),
      ingredient("milk", "1 cup"),
      ingredient("banana", "1"),
    ],
    steps: [
      "Combine oats and milk in a saucepan.",
      "Simmer gently for 5 minutes, stirring often.",
      "Mash half the banana into the oats. Slice the rest over the top and serve.",
    ],
  },
  {
    id: "chicken",
    title: "Lemon garlic chicken",
    description: "A simple skillet supper with bright, fresh flavor.",
    time: 25,
    category: "Chicken",
    art: "rice",
    servings: 2,
    ingredients: [
      ingredient("chicken", "2 boneless breasts"),
      ingredient("lemon", "1, juiced"),
      ingredient("garlic", "2 cloves, minced"),
      ingredient("olive oil", "1 tbsp"),
    ],
    steps: [
      "Flatten chicken to an even thickness.",
      "Heat oil in a skillet over medium heat. Cook chicken for 6–8 minutes on each side.",
      "Add garlic and lemon juice for the final minute, plus a splash of water if needed.",
      "Use a food thermometer to check the thickest part reaches 74°C / 165°F; continue cooking if needed. Rest for 3 minutes and serve.",
    ],
  },
  {
    id: "potatoes",
    title: "Crispy garlic potatoes",
    description: "Golden edges, soft centers, and nothing complicated.",
    time: 35,
    category: "Vegan",
    art: "potato",
    servings: 2,
    ingredients: [
      ingredient("potato", "500 g, cut into 2 cm chunks"),
      ingredient("garlic", "3 cloves, minced"),
      ingredient("olive oil", "2 tbsp"),
    ],
    steps: [
      "Heat oven to 220°C / 425°F.",
      "Toss potatoes with olive oil and spread on a baking tray.",
      "Roast for 25 minutes, turning halfway through.",
      "Toss with garlic and roast for another 5 minutes until golden and tender.",
    ],
  },
];
