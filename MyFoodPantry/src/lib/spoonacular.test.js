import test from "node:test";
import assert from "node:assert/strict";
import { apiRequest } from "./spoonacular.js";

test("HTML deployment fallbacks produce an actionable error instead of a JSON parse exception", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response("<!DOCTYPE html><html>App</html>", {
      headers: { "Content-Type": "text/html" },
    });
  try {
    await assert.rejects(
      apiRequest("/api/recipes?ingredients=egg"),
      /deploy the recipe function and API routing/,
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("JSON recipe data and server errors preserve their intended behavior", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json([{ id: 123 }]);
    assert.deepEqual(await apiRequest("/api/recipes?ingredients=egg"), [
      { id: 123 },
    ]);
    globalThis.fetch = async () =>
      Response.json({ error: "Server key is missing." }, { status: 503 });
    await assert.rejects(
      apiRequest("/api/recipes?ingredients=egg"),
      /Server key is missing/,
    );
    globalThis.fetch = async () =>
      new Response("invalid", {
        headers: { "Content-Type": "application/json" },
      });
    await assert.rejects(
      apiRequest("/api/recipes?ingredients=egg"),
      /invalid JSON/,
    );
  } finally {
    globalThis.fetch = original;
  }
});
