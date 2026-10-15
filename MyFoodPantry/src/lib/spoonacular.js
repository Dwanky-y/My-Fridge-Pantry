export async function apiRequest(path, signal) {
  const response = await fetch(path, { signal });
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(
      "The recipe endpoint returned a web page instead of JSON. On Netlify, deploy the recipe function and API routing from netlify.toml, then set SPOONACULAR_API_KEY for Functions and redeploy.",
    );
  }
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(
      "The recipe service returned invalid JSON. Please try again later.",
    );
  }
  if (!response.ok) throw new Error(body.error || "Could not load recipes.");
  return body;
}
export function recipeSummary(raw) {
  const ingredients = [
    ...(raw.usedIngredients || []),
    ...(raw.missedIngredients || []),
  ];
  return {
    id: raw.id,
    title: raw.title,
    owned: raw.usedIngredientCount || 0,
    missing: raw.missedIngredientCount || 0,
    ingredients,
    art: /salad/i.test(raw.title)
      ? "salad"
      : /soup/i.test(raw.title)
        ? "soup"
        : "pasta",
  };
}
export function recipeDetails(raw) {
  return {
    id: raw.id,
    title: raw.title,
    servings: raw.servings || 1,
    time: raw.readyInMinutes,
    sourceName: raw.sourceName || "Recipe source",
    sourceUrl: /^https?:\/\//.test(raw.sourceUrl || "") ? raw.sourceUrl : null,
    ingredients: (raw.extendedIngredients || []).map((item, index) => ({
      id: item.id || index,
      name: item.name,
      amount: item.amount,
      unit: item.unit,
      original: item.original,
    })),
    steps: (raw.analyzedInstructions || []).flatMap((section) =>
      section.steps.map((step) => step.step),
    ),
    art: /salad/i.test(raw.title)
      ? "salad"
      : /soup/i.test(raw.title)
        ? "soup"
        : "pasta",
  };
}
