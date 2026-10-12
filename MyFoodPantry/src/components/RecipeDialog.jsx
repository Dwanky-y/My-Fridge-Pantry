import { useEffect, useRef, useState } from "react";
import { apiRequest, recipeDetails } from "../lib/spoonacular";
import Icon from "./Icon";
import FoodArt from "./FoodArt";
import CookingPlan from "./CookingPlan";
export default function RecipeDialog({ summary, kitchen, onClose }) {
  const ref = useRef(null);
  const [eventId] = useState(() => crypto.randomUUID());
  const [recorded, setRecorded] = useState(false);
  const [recipe, setRecipe] = useState(null),
    [error, setError] = useState(""),
    [servings, setServings] = useState(1),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    ref.current.showModal();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    apiRequest(`/api/recipes/${summary.id}`, controller.signal)
      .then((data) => {
        const detail = recipeDetails(data);
        setRecipe(detail);
        setServings(detail.servings);
        setError("");
      })
      .catch((failure) => {
        if (failure.name !== "AbortError") setError(failure.message);
      });
    return () => controller.abort();
  }, [summary.id, retry]);
  return (
    <dialog
      ref={ref}
      className="recipe-dialog"
      aria-labelledby="recipe-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) ref.current.close();
      }}
    >
      <button
        className="modal-close"
        aria-label="Close recipe"
        onClick={() => ref.current.close()}
      >
        <Icon name="close" />
      </button>
      <FoodArt type={summary.art} />
      <div className="dialog-body">
        <span className="eyebrow">LET’S MAKE SOMETHING GOOD</span>
        <h2 id="recipe-title">{summary.title}</h2>
        {!recipe && !error && (
          <p role="status">Loading ingredients and instructions…</p>
        )}
        {error && (
          <div>
            <p className="error-message" role="alert">
              {error}
            </p>
            <button
              className="secondary-button"
              onClick={() => setRetry((value) => value + 1)}
            >
              Try again
            </button>
          </div>
        )}
        {recipe && (
          <>
            <div className="recipe-meta">
              {recipe.time && (
                <span>
                  <Icon name="clock" size={16} />
                  {recipe.time} minutes
                </span>
              )}
              <label className="servings-control">
                Servings
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  disabled={recorded}
                  value={servings}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isInteger(value) && value >= 1 && value <= 100)
                      setServings(value);
                  }}
                />
              </label>
            </div>
            {recipe.ingredients.length ? (
              <CookingPlan
                key={`${recipe.id}-${servings}`}
                recipe={recipe}
                servings={servings}
                kitchen={kitchen}
                eventId={eventId}
                recorded={recorded}
                onRecorded={() => setRecorded(true)}
              />
            ) : (
              <p className="error-message">
                This recipe has no ingredient quantities, so automatic
                deductions are unavailable.
              </p>
            )}
            <h3>Let’s cook</h3>
            {recipe.steps.length ? (
              <ol className="steps">
                {recipe.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            ) : (
              <p className="small">
                Spoonacular has no step-by-step instructions for this recipe.
                Check the original source before cooking.
              </p>
            )}
            {recipe.sourceUrl && (
              <a
                className="source-link"
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View original recipe · {recipe.sourceName}{" "}
                <Icon name="arrow" size={15} />
              </a>
            )}
            <p className="small recipe-credit">
              Recipe data provided by{" "}
              <a
                href="https://spoonacular.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Spoonacular
              </a>
              . Check allergens and safe cooking temperatures.
            </p>
          </>
        )}
      </div>
    </dialog>
  );
}
