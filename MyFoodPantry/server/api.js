// Server-only: never return the API key or upstream error bodies to the browser.
export function createApiHandler({
  getKey = () => process.env.SPOONACULAR_API_KEY,
  fetcher = fetch,
} = {}) {
  let windowStart = Date.now(),
    requestCount = 0;
  return async function apiHandler(
    req,
    res,
    next = () => {
      res.writeHead(404);
      res.end();
    },
  ) {
    const url = new URL(req.url, "http://localhost");
    if (!url.pathname.startsWith("/api/")) return next();
    const respond = (status, body) => {
      res.writeHead(status, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(JSON.stringify(body));
    };
    if (req.method !== "GET")
      return respond(405, { error: "Only GET requests are supported." });
    let destination;
    if (url.pathname === "/api/recipes") {
      const ingredients = (url.searchParams.get("ingredients") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      if (
        !ingredients.length ||
        ingredients.length > 50 ||
        ingredients.some((value) => value.length > 80)
      )
        return respond(400, {
          error:
            "Send between 1 and 50 ingredient names (80 characters maximum each).",
        });
      destination = new URL(
        "https://api.spoonacular.com/recipes/findByIngredients",
      );
      destination.searchParams.set("ingredients", ingredients.join(","));
      destination.searchParams.set("number", "12");
      destination.searchParams.set("ranking", "1");
      destination.searchParams.set("ignorePantry", "false");
    } else {
      const match = url.pathname.match(/^\/api\/recipes\/(\d+)$/);
      if (!match) return respond(404, { error: "Unknown API endpoint." });
      destination = new URL(
        `https://api.spoonacular.com/recipes/${match[1]}/information`,
      );
      destination.searchParams.set("includeNutrition", "false");
    }
    const key = getKey();
    if (!key)
      return respond(503, {
        error:
          "Recipe service is not configured. Set SPOONACULAR_API_KEY on the server.",
      });
    if (Date.now() - windowStart > 60000) {
      windowStart = Date.now();
      requestCount = 0;
    }
    if (++requestCount > 30)
      return respond(429, {
        error: "Too many recipe requests. Please try again in a minute.",
      });
    try {
      const response = await fetcher(destination, {
        headers: { "x-api-key": key, Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        const error =
          response.status === 401 || response.status === 403
            ? "Spoonacular rejected the server API key. Check the key and account access."
            : response.status === 402 || response.status === 429
              ? "Spoonacular quota is exhausted. Try again later or check your API plan."
              : "Spoonacular is temporarily unavailable. Please try again.";
        return respond(
          response.status === 402 || response.status === 429 ? 429 : 502,
          { error },
        );
      }
      return respond(200, await response.json());
    } catch {
      return respond(502, {
        error:
          "Could not reach Spoonacular. Check server network access and try again.",
      });
    }
  };
}
