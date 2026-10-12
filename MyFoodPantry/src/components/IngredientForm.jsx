import { useState } from "react";
import { UNITS } from "../lib/inventory";
import Icon from "./Icon";
export default function IngredientForm({ onAdd }) {
  const [name, setName] = useState(""),
    [quantity, setQuantity] = useState("1"),
    [unit, setUnit] = useState("piece"),
    [location, setLocation] = useState("Fridge"),
    [notice, setNotice] = useState("");
  function submit(event) {
    event.preventDefault();
    if (
      !name.trim() ||
      !Number.isFinite(Number(quantity)) ||
      Number(quantity) <= 0
    ) {
      setNotice("Enter a name and a positive quantity.");
      return;
    }
    onAdd({ name: name.trim(), quantity: Number(quantity), unit, location });
    setNotice(`Added ${name.trim()}.`);
    setName("");
  }
  return (
    <form className="ingredient-form" onSubmit={submit}>
      <label htmlFor="ingredient">What do you have?</label>
      <div className="input-wrap">
        <input
          id="ingredient"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. eggs or pasta"
          maxLength={80}
          required
        />
      </div>
      <div className="quantity-fields">
        <label>
          Quantity
          <input
            type="number"
            min="0.001"
            step="any"
            required
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
        </label>
        <label>
          Unit
          <select
            aria-label="Unit"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
          >
            {UNITS.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
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
          <option value="Fridge">Fridge / Freezer</option>
          <option>Pantry</option>
        </select>
        <button className="add-button" type="submit">
          <Icon name="plus" size={18} /> Add ingredient
        </button>
      </div>
      <p className="input-hint">
        Add one item at a time so each quantity is accurate.
      </p>
      <p className="form-notice" role="status">
        {notice}
      </p>
    </form>
  );
}
