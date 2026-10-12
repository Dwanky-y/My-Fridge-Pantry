import test from "node:test";
import assert from "node:assert/strict";
import { createApiHandler } from "./api.js";
async function request(handler, url, method = "GET") {
  const result = {};
  await handler(
    { url, method },
    {
      writeHead(status, headers) {
        result.status = status;
        result.headers = headers;
      },
      end(body) {
        result.body = JSON.parse(body);
      },
    },
  );
  return result;
}
test("recipe discovery uses server authentication and a fixed destination", async () => {
  let upstream;
  const handler = createApiHandler({
    getKey: () => "test-only-key",
    fetcher: async (url, options) => {
      upstream = { url, options };
      return new Response(JSON.stringify([{ id: 1 }]), { status: 200 });
    },
  });
  const result = await request(handler, "/api/recipes?ingredients=egg,pasta");
  assert.equal(result.status, 200);
  assert.equal(upstream.url.hostname, "api.spoonacular.com");
  assert.equal(upstream.url.pathname, "/recipes/findByIngredients");
  assert.equal(upstream.url.searchParams.get("ingredients"), "egg,pasta");
  assert.equal(upstream.url.searchParams.has("apiKey"), false);
  assert.equal(upstream.options.headers["x-api-key"], "test-only-key");
  assert.equal(result.headers["Cache-Control"], "no-store");
  assert.equal(JSON.stringify(result).includes("test-only-key"), false);
});
test("recipe details use information endpoint and untrusted paths cannot choose upstream destinations", async () => {
  let calls = 0;
  const handler = createApiHandler({
    getKey: () => "test-only-key",
    fetcher: async (url) => {
      calls++;
      assert.equal(url.pathname, "/recipes/123/information");
      return new Response("{}");
    },
  });
  assert.equal((await request(handler, "/api/recipes/123")).status, 200);
  assert.equal(
    (await request(handler, "/api/recipes/https://bad.example")).status,
    404,
  );
  assert.equal(
    (await request(handler, "/api/recipes?ingredients=")).status,
    400,
  );
  assert.equal(
    (await request(handler, "/api/recipes?ingredients=egg", "POST")).status,
    405,
  );
  assert.equal(calls, 1);
});
test("missing configuration, quota exhaustion, and authentication errors are distinct and sanitized", async () => {
  assert.equal(
    (
      await request(
        createApiHandler({ getKey: () => "" }),
        "/api/recipes?ingredients=egg",
      )
    ).status,
    503,
  );
  for (const status of [401, 402, 429]) {
    const handler = createApiHandler({
      getKey: () => "test-only-key",
      fetcher: async () =>
        new Response("secret upstream diagnostics", { status }),
    });
    const result = await request(handler, "/api/recipes?ingredients=egg");
    assert.equal(result.status, status === 401 ? 502 : 429);
    assert.equal(JSON.stringify(result).includes("secret upstream"), false);
  }
});
test("connection failures produce a recoverable message", async () => {
  const result = await request(
    createApiHandler({
      getKey: () => "test-only-key",
      fetcher: async () => {
        throw new Error("private network diagnostics");
      },
    }),
    "/api/recipes?ingredients=egg",
  );
  assert.equal(result.status, 502);
  assert.match(result.body.error, /network access/);
});
