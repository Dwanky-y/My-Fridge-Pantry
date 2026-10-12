import { useState } from "react";
import {
  createPlan,
  convertQuantity,
  formatQuantity,
  applyDeductions,
} from "../lib/inventory";
import Icon from "./Icon";
export default function CookingPlan({
  recipe,
  servings,
  kitchen,
  eventId,
  recorded,
  onRecorded,
}) {
  const multiplier = servings / recipe.servings;
  const [rows, setRows] = useState(() =>
    createPlan(recipe.ingredients, kitchen.items, multiplier),
  );
  const [externalConfirmed, setExternalConfirmed] = useState(false),
    [error, setError] = useState("");
  function update(index, changes) {
    setRows((previous) =>
      previous.map((row, i) => (i === index ? { ...row, ...changes } : row)),
    );
  }
  function selectItem(index, id) {
    const row = rows[index],
      item = kitchen.items.find((entry) => entry.id === id);
    const converted = item
      ? convertQuantity(
          row.ingredient.amount * multiplier,
          row.ingredient.unit,
          item.unit,
        )
      : null;
    update(index, {
      itemId: id,
      quantity: converted === null ? "" : Number(converted.toFixed(6)),
    });
  }
  const external = rows.some((row) => !row.itemId);
  let validation = "";
  try {
    applyDeductions(kitchen.items, rows, eventId, recipe.title);
  } catch (failure) {
    validation = failure.message;
  }
  function cook() {
    try {
      if (external && !externalConfirmed)
        throw new Error(
          "Confirm that you have the remaining ingredients separately.",
        );
      kitchen.cook(rows, eventId, recipe.title);
      onRecorded();
      setError("");
    } catch (failure) {
      setError(failure.message);
    }
  }
  return (
    <section className="cooking-plan" aria-label="Ingredient deductions">
      <h3>What you’ll use</h3>
      <p className="small">
        Amounts below are deducted once when you start cooking or record a meal
        you’ve already made. Check matches and adjust amounts to what you
        actually use. Cup, tbsp, and tsp use US measures.
      </p>
      <div className="deduction-rows">
        {rows.map((row, index) => {
          const item = kitchen.items.find((entry) => entry.id === row.itemId);
          return (
            <div className="deduction-row" key={row.rowId}>
              <div className="deduction-heading">
                <strong>
                  {formatQuantity(row.ingredient.amount * multiplier)}{" "}
                  {row.ingredient.unit} {row.ingredient.name}
                </strong>
                {row.ingredient.original && (
                  <small>{row.ingredient.original}</small>
                )}
              </div>
              <label>
                Take from
                <select
                  aria-label={`Take ${row.ingredient.name} from`}
                  disabled={recorded}
                  value={row.itemId}
                  onChange={(event) => selectItem(index, event.target.value)}
                >
                  <option value="">Not from my saved kitchen</option>
                  {kitchen.items.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name} ·{" "}
                      {entry.location === "Fridge"
                        ? "Fridge / Freezer"
                        : "Pantry"}{" "}
                      (
                      {entry.quantity === null
                        ? "?"
                        : formatQuantity(entry.quantity)}{" "}
                      {entry.unit})
                    </option>
                  ))}
                </select>
              </label>
              {item ? (
                <div className="deduction-amount">
                  <label>
                    Amount to use
                    <input
                      aria-label={`Use quantity of ${row.ingredient.name}`}
                      type="number"
                      step="any"
                      min="0.000001"
                      value={row.quantity}
                      disabled={recorded}
                      onChange={(event) =>
                        update(index, { quantity: event.target.value })
                      }
                    />
                  </label>
                  <span>{item.unit}</span>
                  <small>
                    {recorded
                      ? "Recorded"
                      : item.quantity === null
                        ? "Set available quantity in your kitchen first"
                        : `${formatQuantity(item.quantity)} ${item.unit} available`}
                  </small>
                  {row.quantity === "" && !recorded && (
                    <p className="quantity-warning">
                      These units cannot be converted automatically. Enter the
                      amount in your kitchen’s unit.
                    </p>
                  )}
                </div>
              ) : (
                <p className="small">
                  No deduction from your saved ingredients.
                </p>
              )}
            </div>
          );
        })}
      </div>
      {!recorded && external && (
        <label className="external-confirm">
          <input
            type="checkbox"
            checked={externalConfirmed}
            onChange={(event) => setExternalConfirmed(event.target.checked)}
          />
          I have the ingredients not taken from my saved kitchen separately.
        </label>
      )}
      {!recorded && validation && (
        <p className="quantity-warning">{validation}</p>
      )}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {recorded ? (
        <p className="cooking-success" role="status">
          <Icon name="check" />
          Ingredient use recorded. You can undo it from My kitchen.
        </p>
      ) : (
        <div className="cooking-actions">
          <button
            className="primary-button"
            disabled={Boolean(validation) || (external && !externalConfirmed)}
            onClick={cook}
          >
            Start cooking & deduct
          </button>
          <button
            className="secondary-button"
            disabled={Boolean(validation) || (external && !externalConfirmed)}
            onClick={cook}
          >
            I’ve made this · deduct
          </button>
        </div>
      )}
    </section>
  );
}
