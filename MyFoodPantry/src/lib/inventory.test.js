import test from "node:test";
import assert from "node:assert/strict";
import {
  convertQuantity,
  sanitizeItems,
  createPlan,
  applyDeductions,
  undoDeductions,
  normalizeIngredient,
} from "./inventory.js";
const pasta = {
  id: "p",
  name: "pasta",
  quantity: 1,
  unit: "kg",
  location: "Pantry",
};
test("safe conversions handle mass, US volume, and count without guessing density", () => {
  assert.equal(convertQuantity(500, "grams", "kg"), 0.5);
  assert.ok(Math.abs(convertQuantity(1, "cup", "ml") - 236.5882365) < 0.000001);
  assert.equal(convertQuantity(2, "", "piece"), 2);
  assert.equal(convertQuantity(1, "piece", "g"), null);
  assert.equal(convertQuantity(1, "clove", "piece"), null);
  assert.equal(convertQuantity(1, "ml", "g"), null);
  assert.equal(convertQuantity(NaN, "kg", "g"), null);
});
test("legacy migration merges freezer location and preserves unknown quantities", () => {
  const items = sanitizeItems([
    { name: "eggs", location: "Freezer" },
    { name: "rice", location: "Pantry", quantity: 2, unit: "kg" },
    null,
  ]);
  assert.equal(items[0].location, "Fridge");
  assert.equal(items[0].quantity, null);
  assert.equal(items[1].quantity, 2);
  assert.equal(items[1].unit, "kg");
});
test("cooking converts and scales, aggregates repeated ingredients, and leaves source state untouched", () => {
  const rows = createPlan(
    [
      { name: "spaghetti", amount: 200, unit: "g" },
      { name: "pasta", amount: 100, unit: "g" },
    ],
    [pasta],
    2,
  );
  assert.equal(rows[0].itemId, "p");
  assert.equal(rows[0].quantity, 0.4);
  const result = applyDeductions([pasta], rows, "meal-1", "Pasta");
  assert.equal(result.items[0].quantity, 0.4);
  assert.equal(pasta.quantity, 1);
  assert.equal(result.event.deductions.length, 1);
  assert.ok(Math.abs(result.event.deductions[0].quantity - 0.6) < 0.000001);
  assert.equal(undoDeductions(result.items, result.event)[0].quantity, 1);
});
test("deductions are atomic and reject insufficient, unknown, invalid, and deleted stock", () => {
  assert.throws(
    () =>
      applyDeductions([pasta], [{ itemId: "p", quantity: 2 }], "a", "Pasta"),
    /Not enough/,
  );
  assert.throws(
    () =>
      applyDeductions(
        [{ ...pasta, quantity: null }],
        [{ itemId: "p", quantity: 0.1 }],
        "a",
        "Pasta",
      ),
    /available quantity/,
  );
  for (const quantity of ["", -1, NaN, Infinity])
    assert.throws(() =>
      applyDeductions([pasta], [{ itemId: "p", quantity }], "a", "Pasta"),
    );
  assert.throws(
    () => applyDeductions([], [{ itemId: "p", quantity: 0.1 }], "a", "Pasta"),
    /available quantity/,
  );
  assert.equal(pasta.quantity, 1);
});
test("undo restores depleted or removed ingredients without overwriting later additions", () => {
  const result = applyDeductions(
    [pasta],
    [{ itemId: "p", quantity: 1 }],
    "a",
    "Pasta",
  );
  assert.equal(result.items[0].quantity, 0);
  assert.equal(
    undoDeductions([{ ...pasta, quantity: 0.5 }], result.event)[0].quantity,
    1.5,
  );
  assert.equal(undoDeductions([], result.event)[0].quantity, 1);
  assert.throws(
    () => undoDeductions([{ ...pasta, unit: "piece" }], result.event),
    /original unit/,
  );
});
test("aliases match whole ingredient names and cannot create false substring matches", () => {
  assert.equal(normalizeIngredient("  Cherry  Tomatoes "), "tomato");
  assert.equal(normalizeIngredient("garlic powder"), "garlic powder");
  assert.equal(
    createPlan(
      [{ name: "garlic", amount: 2, unit: "clove" }],
      [{ id: "g", name: "garlic powder", quantity: 3, unit: "g" }],
    )[0].itemId,
    "",
  );
});
