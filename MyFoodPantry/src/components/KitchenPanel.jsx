import { useState } from "react";
import Icon from "./Icon";
import IngredientForm from "./IngredientForm";
import InventorySection from "./InventorySection";
export default function KitchenPanel({ kitchen }) {
  const [error, setError] = useState("");
  return (
    <aside id="kitchen" className="kitchen-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">YOUR INGREDIENTS</span>
          <h2>
            My kitchen{" "}
            <span className="count-badge">{kitchen.items.length}</span>
          </h2>
        </div>
        <Icon name="fridge" size={28} />
      </div>
      <p className="panel-description">Keep track. Cook more. Waste less.</p>
      <IngredientForm onAdd={kitchen.addItem} />
      <div className="inventory-shelves">
        {["Fridge", "Pantry"].map((location) => (
          <InventorySection
            key={location}
            title={location === "Fridge" ? "Fridge / Freezer" : "Pantry"}
            location={location}
            items={kitchen.items.filter((item) => item.location === location)}
            onEdit={kitchen.editItem}
            onRemove={kitchen.removeItem}
          />
        ))}
      </div>
      {kitchen.lastCook && (
        <div className="undo-note">
          <span>Recorded: {kitchen.lastCook.title}</span>
          <button
            onClick={() => {
              try {
                kitchen.undo();
                setError("");
              } catch (failure) {
                setError(failure.message);
              }
            }}
          >
            Undo ingredient use
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      <div className="save-note" role="status">
        <Icon name="check" size={16} />
        {kitchen.error ||
          (kitchen.consent === "save"
            ? "Saved on this device"
            : "Session only · choose saving in Privacy settings")}
      </div>
    </aside>
  );
}
