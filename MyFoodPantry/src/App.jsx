import { useEffect, useRef, useState } from "react";
import {
  matchRecipe,
  normalizeIngredient,
  readInventory,
  recipes,
  STORAGE_KEY,
} from "./recipes";
import "./App.css";

function Icon({ name, size = 20, ...props }) {
  const paths = {
    leaf: (
      <>
        <path d="M20 4C8 2 2 9 6 16s16 2 14-12Z" />
        <path d="m4 21 11-11" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    fridge: (
      <>
        <rect x="6" y="2" width="12" height="20" rx="2" />
        <path d="M6 10h12M9 5v2m0 6v3" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

function FoodArt({ type }) {
  return (
    <div className={`food-art ${type}`} aria-hidden="true">
      <div className="napkin" />
      <div className="plate">
        <div className="meal">
          {Array.from({ length: 13 }, (_, i) => (
            <span key={i} style={{ "--i": i }} />
          ))}
        </div>
        <div className="herb">✦</div>
      </div>
      <div className="fork">╎</div>
    </div>
  );
}

function RecipeDialog({ recipe, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) ref.current.close();
      }}
      className="recipe-dialog"
      aria-labelledby="recipe-title"
    >
      <button
        className="icon-button modal-close"
        aria-label="Close recipe"
        onClick={() => ref.current.close()}
      >
        <Icon name="close" />
      </button>
      <FoodArt type={recipe.art} />
      <div className="dialog-body">
        <span className="eyebrow">LET’S MAKE SOMETHING GOOD</span>
        <h2 id="recipe-title">{recipe.title}</h2>
        <p>{recipe.description}</p>
        <div className="recipe-meta">
          <span>
            <Icon name="clock" size={16} /> {recipe.time} minutes
          </span>
          <span>
            {recipe.servings} {recipe.servings === 1 ? "serving" : "servings"}
          </span>
        </div>
        <h3>What you’ll need</h3>
        <p className="small">
          Water is assumed available. Salt and pepper are optional, to taste.
          Matches check ingredients, not quantities.
        </p>
        <ul className="ingredient-list">
          {recipe.ingredients.map((item) => (
            <li key={item.name}>
              <span
                className={
                  recipe.missing.some((m) => m.name === item.name)
                    ? "missing-dot"
                    : "owned-dot"
                }
              >
                {recipe.missing.some((m) => m.name === item.name) ? "+" : "✓"}
              </span>
              <span>
                {item.amount} {item.name}
              </span>
              <small>
                {recipe.missing.some((m) => m.name === item.name)
                  ? "To get"
                  : "You have it"}
              </small>
            </li>
          ))}
        </ul>
        <h3>Let’s cook</h3>
        <ol className="steps">
          {recipe.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
    </dialog>
  );
}

function App() {
  const [initialStorage] = useState(() => {
    try {
      return { inventory: readInventory(localStorage), error: false };
    } catch {
      return { inventory: [], error: true };
    }
  });
  const [inventory, setInventory] = useState(initialStorage.inventory);
  const [storageError, setStorageError] = useState(initialStorage.error);
  const [input, setInput] = useState("");
  const [location, setLocation] = useState("Fridge");
  const [locationFilter, setLocationFilter] = useState("All");
  const [mode, setMode] = useState("All ideas");
  const [search, setSearch] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [notice, setNotice] = useState("");
  const inputRef = useRef(null);
  function updateInventory(nextInventory) {
    setInventory(nextInventory);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextInventory));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }
  function addIngredients(value = input) {
    const names = value
      .split(",")
      .map((name) => name.trim().slice(0, 80))
      .filter(Boolean);
    if (!names.length) {
      setNotice("Enter an ingredient first.");
      inputRef.current.focus();
      return;
    }
    const existing = new Set(
      inventory.map((item) => normalizeIngredient(item.name)),
    );
    const additions = names.filter((name) => {
      const key = normalizeIngredient(name);
      if (existing.has(key)) return false;
      existing.add(key);
      return true;
    });
    updateInventory([
      ...inventory,
      ...additions.map((name) => ({ name, location })),
    ]);
    setInput("");
    setNotice(
      additions.length
        ? `Added ${additions.length} ${additions.length === 1 ? "ingredient" : "ingredients"}.`
        : "Those ingredients are already in your kitchen.",
    );
    inputRef.current.focus();
  }
  const matches = recipes
    .map((recipe) => matchRecipe(recipe, inventory))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.missing.length - b.missing.length ||
        a.time - b.time,
    );
  const ready = matches.filter((recipe) => recipe.missing.length === 0).length;
  const visibleRecipes = matches.filter(
    (recipe) =>
      (mode !== "Ready to cook" || !recipe.missing.length) &&
      (mode !== "30 minutes or less" || recipe.time <= 30) &&
      `${recipe.title} ${recipe.ingredients.map((item) => item.name).join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase().trim()),
  );
  const visibleInventory = inventory.filter(
    (item) => locationFilter === "All" || item.location === locationFilter,
  );
  return (
    <>
      <header className="site-header">
        <a className="brand" href="#">
          <span className="brand-icon">
            <Icon name="leaf" size={26} />
          </span>
          little pantry<span className="brand-period">.</span>
        </a>
        <nav aria-label="Main navigation">
          <a className="active" href="#kitchen">
            My kitchen
          </a>
          <a href="#recipes">Recipe ideas</a>
        </nav>
        <span className="header-note">
          <span className="status-dot" /> A little less waste. A lot more taste.
        </span>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <span /> GOOD FOOD STARTS AT HOME
            </span>
            <h1>
              Something delicious.
              <br />
              <em>Already in your kitchen.</em>
            </h1>
            <p>
              Give your everyday ingredients a little inspiration.
              <br className="desktop-break" /> Fill your pantry, find your next
              favorite meal.
            </p>
            <a href="#kitchen" className="hero-link">
              Let’s see what’s cooking <Icon name="arrow" size={18} />
            </a>
          </div>
          <div className="hero-illustration" aria-hidden="true">
            <span className="floating-label label-one">
              a pinch of possibility
            </span>
            <div className="hero-circle">
              <FoodArt type="salad" />
            </div>
            <span className="floating-label label-two">
              <Icon name="leaf" size={16} /> made with what you have
            </span>
            <span className="spark spark-one">✧</span>
            <span className="spark spark-two">✳</span>
          </div>
        </section>
        <div className="workspace">
          <aside id="kitchen" className="kitchen-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">YOUR INGREDIENTS</span>
                <h2>
                  My kitchen{" "}
                  <span className="count-badge">{inventory.length}</span>
                </h2>
              </div>
              <Icon name="fridge" size={28} />
            </div>
            <p className="panel-description">
              A little inventory. Endless possibilities.
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                addIngredients();
              }}
              className="ingredient-form"
            >
              <label htmlFor="ingredient">What do you have?</label>
              <div className="input-wrap">
                <input
                  id="ingredient"
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="e.g. eggs, spinach, pasta"
                  maxLength={400}
                  autoComplete="off"
                />
              </div>
              <div className="form-row">
                <label className="sr-only" htmlFor="location">
                  Store in
                </label>
                <select
                  id="location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                >
                  <option>Fridge</option>
                  <option>Pantry</option>
                  <option>Freezer</option>
                </select>
                <button className="add-button" type="submit">
                  <Icon name="plus" size={18} /> Add ingredients
                </button>
              </div>
              <p className="input-hint">
                Adding a few? Separate them with commas.
              </p>
            </form>
            <div className="inventory-tabs" aria-label="Filter ingredients">
              {["All", "Fridge", "Pantry", "Freezer"].map((tab) => (
                <button
                  key={tab}
                  aria-pressed={locationFilter === tab}
                  className={locationFilter === tab ? "selected" : ""}
                  onClick={() => setLocationFilter(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="inventory-items">
              {visibleInventory.length ? (
                visibleInventory.map((item) => (
                  <div
                    className="inventory-item"
                    key={normalizeIngredient(item.name)}
                  >
                    <span
                      className={`item-symbol ${item.location.toLowerCase()}`}
                    >
                      <Icon
                        name={item.location === "Fridge" ? "fridge" : "leaf"}
                        size={17}
                      />
                    </span>
                    <div>
                      <span className="ingredient-name">{item.name}</span>
                      <small>{item.location}</small>
                    </div>
                    <button
                      className="remove-button"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => {
                        updateInventory(
                          inventory.filter((i) => i.name !== item.name),
                        );
                        setNotice(`Removed ${item.name}.`);
                      }}
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="pantry-empty">
                  <span className="empty-icon">
                    <Icon name="fridge" size={32} />
                  </span>
                  <h3>
                    {inventory.length
                      ? `Nothing in your ${locationFilter.toLowerCase()} yet`
                      : "A fresh start"}
                  </h3>
                  <p>
                    {inventory.length
                      ? "Add an ingredient above to fill this shelf."
                      : "Add what’s in your fridge or pantry. We’ll take it from there."}
                  </p>
                </div>
              )}
            </div>
            {!inventory.length && (
              <div className="quick-add">
                <p>A few ideas to get you started</p>
                {["Eggs", "Pasta", "Tomatoes", "Rice"].map((name) => (
                  <button key={name} onClick={() => addIngredients(name)}>
                    <Icon name="plus" size={13} />
                    {name}
                  </button>
                ))}
              </div>
            )}
            <div
              className={`save-note ${storageError ? "save-error" : ""}`}
              role="status"
            >
              <Icon name="check" size={16} />
              {storageError
                ? "Saving is unavailable. Keep this tab open to retain ingredients."
                : "Automatically saved on this device"}
            </div>
            <p className="sr-only" role="status">
              {notice}
            </p>
          </aside>
          <section id="recipes" className="recipes-panel">
            <div className="recipes-heading">
              <div>
                <span className="eyebrow">LESS GUESSING, MORE COOKING</span>
                <h2>Your next good meal</h2>
                <p>
                  {inventory.length
                    ? `${ready} ${ready === 1 ? "recipe" : "recipes"} ready to cook. A few more just an ingredient away.`
                    : "A little inspiration now. Personal suggestions as you add ingredients."}
                </p>
              </div>
              <span className="recipe-total">
                {recipes.length} simple recipes
              </span>
            </div>
            <div className="recipe-toolbar">
              <div className="recipe-filters">
                {["All ideas", "Ready to cook", "30 minutes or less"].map(
                  (filter) => (
                    <button
                      key={filter}
                      className={mode === filter ? "selected" : ""}
                      aria-pressed={mode === filter}
                      onClick={() => setMode(filter)}
                    >
                      {filter === "Ready to cook" && (
                        <Icon name="check" size={15} />
                      )}{" "}
                      {filter}
                    </button>
                  ),
                )}
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
            {!inventory.length && (
              <div className="suggestion-note">
                <Icon name="leaf" size={18} />
                <span>
                  Your kitchen, your possibilities. Add ingredients to see your
                  best matches.
                </span>
              </div>
            )}
            <div className="recipe-grid">
              {visibleRecipes.map((recipe) => (
                <button
                  className="recipe-card"
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <div className="card-image">
                    <FoodArt type={recipe.art} />
                    <span className="time-badge">
                      <Icon name="clock" size={14} />
                      {recipe.time} min
                    </span>
                    {recipe.missing.length === 0 && (
                      <span className="ready-badge">
                        <Icon name="check" size={13} /> Ready to cook
                      </span>
                    )}
                  </div>
                  <div className="card-body">
                    <span className="recipe-category">{recipe.category}</span>
                    <h3>{recipe.title}</h3>
                    <p>{recipe.description}</p>
                    <div className="match-track">
                      <span style={{ width: `${recipe.score * 100}%` }} />
                    </div>
                    <div className="card-bottom">
                      <span
                        className={
                          recipe.missing.length === 0 ? "match-ready" : ""
                        }
                      >
                        {recipe.missing.length === 0
                          ? "You have everything!"
                          : `${recipe.owned} of ${recipe.ingredients.length} ingredients`}
                      </span>
                      <span className="view-recipe">
                        Let’s cook <Icon name="arrow" size={15} />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {!visibleRecipes.length && (
              <div className="recipes-empty">
                <Icon name="leaf" size={32} />
                <h3>
                  {mode === "Ready to cook"
                    ? "Your next meal is getting closer"
                    : "No recipes found"}
                </h3>
                <p>
                  {mode === "Ready to cook"
                    ? "Add more ingredients, or explore all ideas to see what’s missing."
                    : "Try another ingredient or a shorter search."}
                </p>
                <button
                  onClick={() => {
                    setMode("All ideas");
                    setSearch("");
                  }}
                >
                  Explore all recipes <Icon name="arrow" size={16} />
                </button>
              </div>
            )}
            <p className="recipe-footnote">
              Made for everyday cooking. Ingredients matched by name; check
              quantities before you start.
            </p>
          </section>
        </div>
        <section className="bottom-note">
          <Icon name="leaf" size={24} />
          <p>
            Good for your plate. <span>Better for the planet.</span>
          </p>
          <small>Small kitchen habits make a big difference.</small>
        </section>
      </main>
      <footer>
        <a className="footer-brand" href="#">
          little pantry.
        </a>
        <span>Make the most of what you have.</span>
        <span>Your kitchen stays on this browser. No account needed.</span>
      </footer>
      {selectedRecipe && (
        <RecipeDialog
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </>
  );
}
export default App;
