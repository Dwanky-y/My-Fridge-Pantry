import test from "node:test";
import assert from "node:assert/strict";
import {
  matchRecipe,
  normalizeIngredient,
  readInventory,
  recipes,
  STORAGE_KEY,
} from "./recipes.js";

test("ingredient matching understands common aliases without substring false matches", () => {
  assert.equal(normalizeIngredient("  Cherry  Tomatoes "), "tomato");
  assert.equal(normalizeIngredient("Spaghetti"), "pasta");
  const pasta = recipes.find((recipe) => recipe.id === "pasta");
  const match = matchRecipe(
    pasta,
    ["Spaghetti", "Tomatoes", "Garlic cloves", "olive oil"].map((name) => ({
      name,
    })),
  );
  assert.equal(match.score, 1);
  assert.equal(match.missing.length, 0);
  assert.equal(matchRecipe(pasta, [{ name: "garlic powder" }]).owned, 0);
});

test("partial matches report the exact missing ingredients", () => {
  const salad = matchRecipe(
    recipes.find((recipe) => recipe.id === "salad"),
    [{ name: "canned chickpeas" }, { name: "lemon" }],
  );
  assert.equal(salad.owned, 2);
  assert.equal(salad.score, 2 / 5);
  assert.deepEqual(
    salad.missing.map((item) => item.name),
    ["cucumber", "tomato", "olive oil"],
  );
});

test("persisted inventory rejects malformed entries and deduplicates aliases", () => {
  const raw = [
    null,
    { name: 123, location: "Fridge" },
    { name: " ", location: "Fridge" },
    { name: "eggs", location: "Fridge" },
    { name: "egg", location: "Pantry" },
    { name: "rice", location: "Freezer" },
    { name: "beans", location: "Unknown" },
  ];
  const storage = {
    getItem(key) {
      assert.equal(key, STORAGE_KEY);
      return JSON.stringify(raw);
    },
  };
  assert.deepEqual(readInventory(storage), [
    { name: "eggs", location: "Fridge" },
    { name: "rice", location: "Freezer" },
  ]);
  assert.deepEqual(readInventory({ getItem: () => null }), []);
  assert.deepEqual(readInventory({ getItem: () => "{}" }), []);
});

test("every recipe has unique identity, usable quantities and instructions", () => {
  assert.equal(
    new Set(recipes.map((recipe) => recipe.id)).size,
    recipes.length,
  );
  for (const recipe of recipes) {
    assert.ok(recipe.time > 0 && recipe.servings > 0);
    assert.ok(recipe.steps.length >= 3);
    assert.ok(recipe.ingredients.every((item) => item.name && item.amount));
    assert.equal(matchRecipe(recipe, []).score, 0);
    assert.equal(matchRecipe(recipe, recipe.ingredients).score, 1);
  }
});
