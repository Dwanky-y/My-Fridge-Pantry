import Icon from "./Icon";
import { UNITS } from "../lib/inventory";
export default function InventorySection({
  title,
  location,
  items,
  onEdit,
  onRemove,
}) {
  return (
    <section className="inventory-section" aria-label={title}>
      <div className="inventory-section-heading">
        <h3>
          <Icon name={location === "Fridge" ? "fridge" : "leaf"} size={18} />
          {title}
        </h3>
        <span>{items.length} items</span>
      </div>
      {items.length ? (
        items.map((item) => (
          <div className="quantity-item" key={item.id}>
            <div className="quantity-item-heading">
              <span className="ingredient-name">{item.name}</span>
              <button
                className="remove-button"
                aria-label={`Remove ${item.name} from ${title}`}
                onClick={() => onRemove(item.id)}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="editable-quantity">
              <input
                aria-label={`Quantity of ${item.name} in ${title}`}
                type="number"
                min="0"
                step="any"
                value={item.quantity ?? ""}
                placeholder="Set quantity"
                onChange={(event) => {
                  if (event.target.value === "")
                    return onEdit(item.id, { quantity: null });
                  const value = Number(event.target.value);
                  if (Number.isFinite(value) && value >= 0)
                    onEdit(item.id, { quantity: value });
                }}
              />
              <span>{item.unit}</span>
              <select
                aria-label={`Unit of ${item.name} in ${title}`}
                value={item.unit}
                onChange={(event) =>
                  onEdit(item.id, { unit: event.target.value, quantity: null })
                }
              >
                {UNITS.map((unit) => (
                  <option key={unit}>{unit}</option>
                ))}
              </select>
            </div>
            {item.quantity === null && (
              <small className="quantity-warning">
                Set a quantity before cooking.
              </small>
            )}
            {item.quantity === 0 && (
              <small className="quantity-warning">Out of stock</small>
            )}
          </div>
        ))
      ) : (
        <p className="shelf-empty">
          Nothing here yet. Add your first ingredient above.
        </p>
      )}
    </section>
  );
}
