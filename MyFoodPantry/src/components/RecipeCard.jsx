import Icon from "./Icon";
import FoodArt from "./FoodArt";
export default function RecipeCard({ recipe, onSelect }) {
  const total = recipe.owned + recipe.missing;
  return (
    <button className="recipe-card" onClick={() => onSelect(recipe)}>
      <div className="card-image">
        <FoodArt type={recipe.art} />
        {!recipe.missing && (
          <span className="ready-badge">
            <Icon name="check" size={13} />
            All ingredient names match
          </span>
        )}
      </div>
      <div className="card-body">
        <span className="recipe-category">Spoonacular recipe</span>
        <h3>{recipe.title}</h3>
        <p>
          {recipe.missing
            ? `${recipe.missing} ingredient ${recipe.missing === 1 ? "name is" : "names are"} missing. Open the recipe to check quantities.`
            : "Check quantities and make this your next good meal."}
        </p>
        <div className="match-track">
          <span
            style={{ width: `${total ? (recipe.owned / total) * 100 : 0}%` }}
          />
        </div>
        <div className="card-bottom">
          <span>
            {recipe.owned} of {total} ingredient names
          </span>
          <span className="view-recipe">
            View recipe <Icon name="arrow" size={15} />
          </span>
        </div>
      </div>
    </button>
  );
}
