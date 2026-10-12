import { useEffect, useRef, useState } from "react";
import { apiRequest, recipeSummary } from "../lib/spoonacular";
import RecipeCard from "./RecipeCard";
import Icon from "./Icon";
export default function RecipeBrowser({ items, onSelect }) {
  const [results, setResults] = useState([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [readyOnly, setReadyOnly] = useState(false),
    [searched, setSearched] = useState(false),
    [snapshot, setSnapshot] = useState("");
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  const names = [
    ...new Set(
      items.filter((item) => item.quantity !== 0).map((item) => item.name),
    ),
  ]
    .sort()
    .join(",");
  async function findRecipes() {
    controller.current?.abort();
    const active = new AbortController();
    controller.current = active;
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(
        `/api/recipes?ingredients=${encodeURIComponent(names)}`,
        active.signal,
      );
      if (!Array.isArray(data))
        throw new Error("The recipe service returned an unexpected response.");
      setResults(data.map(recipeSummary));
      setSnapshot(names);
      setSearched(true);
    } catch (failure) {
      if (failure.name !== "AbortError") setError(failure.message);
    } finally {
      if (controller.current === active) setLoading(false);
    }
  }
  const visible = results.filter(
    (recipe) =>
      (!readyOnly || !recipe.missing) &&
      recipe.title.toLowerCase().includes(search.trim().toLowerCase()),
  );
  return (
    <section id="recipes" className="recipes-panel">
      <div className="recipes-heading">
        <div>
          <span className="eyebrow">LESS GUESSING, MORE COOKING</span>
          <h2>Your next good meal</h2>
          <p>Real recipes, inspired by the ingredients in your kitchen.</p>
        </div>
      </div>
      <div className="api-search-note">
        <p>
          Finding recipes sends ingredient names to Spoonacular. Quantities and
          storage locations stay in your browser.
        </p>
        <button
          className="primary-button"
          disabled={loading || !names}
          onClick={findRecipes}
        >
          {loading
            ? "Finding recipes…"
            : searched
              ? "Refresh recipe ideas"
              : "Find recipes"}
          <Icon name="arrow" size={16} />
        </button>
      </div>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {searched && snapshot !== names && (
        <p className="suggestion-note">
          Your kitchen changed. Refresh recipe ideas to use your current
          ingredients.
        </p>
      )}
      {searched && (
        <div className="recipe-toolbar">
          <div className="recipe-filters">
            <button
              className={!readyOnly ? "selected" : ""}
              aria-pressed={!readyOnly}
              onClick={() => setReadyOnly(false)}
            >
              All ideas
            </button>
            <button
              className={readyOnly ? "selected" : ""}
              aria-pressed={readyOnly}
              onClick={() => setReadyOnly(true)}
            >
              All ingredient names match
            </button>
          </div>
          <div className="recipe-search">
            <Icon name="search" size={17} />
            <input
              aria-label="Search recipes"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find a recipe"
            />
          </div>
        </div>
      )}
      <div className="recipe-grid">
        {visible.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} onSelect={onSelect} />
        ))}
      </div>
      {!loading && !visible.length && !error && (
        <div className="recipes-empty">
          <Icon name="leaf" size={32} />
          <h3>
            {searched
              ? "No matching recipes"
              : "Your ingredients. A world of ideas."}
          </h3>
          <p>
            {searched
              ? "Try another search, show all ideas, or refresh with more ingredients."
              : names
                ? "Find recipes when you’re ready. We’ll help you plan what to use."
                : "Add ingredients to your kitchen, then find something delicious."}
          </p>
        </div>
      )}
      <p className="recipe-footnote">
        Powered by Spoonacular. Always check quantities, allergens, and recipe
        instructions.
      </p>
    </section>
  );
}
