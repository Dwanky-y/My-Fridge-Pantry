import test from "node:test";
import assert from "node:assert/strict";
import { createNetlifyHandler } from "../netlify/functions/recipes.js";
import { createApiHandler } from "./api.js";

test("Netlify discovery and detail rewrites reach the same server-only API", async () => {
  const destinations = [];
  const handler = createNetlifyHandler(
    createApiHandler({
      getKey: () => "test-key",
      fetcher: async (url, options) => {
        destinations.push(url);
        assert.equal(options.headers["x-api-key"], "test-key");
        return new Response(JSON.stringify({ id: 123 }));
      },
    }),
  );
  for (const path of [
    "/.netlify/functions/recipes?ingredients=egg,pasta",
    "/.netlify/functions/recipes/123",
    "/api/recipes/123",
  ]) {
    const response = await handler(
      new Request("https://example.netlify.app" + path),
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "application/json");
    assert.deepEqual(await response.json(), { id: 123 });
  }
  assert.equal(destinations[0].searchParams.get("ingredients"), "egg,pasta");
  assert.equal(destinations[0].pathname, "/recipes/findByIngredients");
  assert.equal(destinations[1].pathname, "/recipes/123/information");
});

test("Netlify returns JSON for configuration, invalid routes, and methods", async () => {
  const handler = createNetlifyHandler(createApiHandler({ getKey: () => "" }));
  for (const [path, method, expected] of [
    ["/.netlify/functions/recipes?ingredients=egg", "GET", 503],
    ["/.netlify/functions/recipes/nope", "GET", 404],
    ["/.netlify/functions/recipes?ingredients=egg", "POST", 405],
    ["/unrelated", "GET", 404],
  ]) {
    const response = await handler(
      new Request("https://example.netlify.app" + path, { method }),
    );
    assert.equal(response.status, expected);
    assert.equal(response.headers.get("content-type"), "application/json");
    assert.ok((await response.json()).error);
  }
});
