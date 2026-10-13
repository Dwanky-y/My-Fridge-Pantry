import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
function PrivacyDialog({ kitchen, onClose }) {
  const ref = useRef(null),
    [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    ref.current.showModal();
  }, []);
  function exportKitchen() {
    const blob = new Blob(
      [JSON.stringify({ ingredients: kitchen.items }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "little-pantry-kitchen.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <dialog
      ref={ref}
      className="privacy-dialog"
      aria-labelledby="privacy-title"
      onClose={onClose}
    >
      <button
        className="modal-close"
        aria-label="Close privacy settings"
        onClick={() => ref.current.close()}
      >
        <Icon name="close" />
      </button>
      <span className="eyebrow">YOUR KITCHEN, YOUR CHOICE</span>
      <h2 id="privacy-title">Privacy & saved data</h2>
      <p>
        MyFridgePantry uses no cookies, analytics, advertising trackers, or
        external fonts. You can use it without saving anything.
      </p>
      <h3>Remembering your kitchen</h3>
      <p>
        With your permission, ingredients, quantities, storage locations, and
        the last cooking deduction are kept in this browser’s local storage
        until you delete them. Your saving preference is stored to remember your
        choice. Nothing syncs across devices.
      </p>
      <div className="privacy-choices">
        <button
          aria-pressed={kitchen.consent === "save"}
          className="secondary-button"
          onClick={() => kitchen.chooseStorage("save")}
        >
          Save on this device
        </button>
        <button
          aria-pressed={kitchen.consent === "session"}
          className="secondary-button"
          onClick={() => kitchen.chooseStorage("session")}
        >
          Use for this session only
        </button>
      </div>
      <p className="small">
        Session only removes stored inventory and cooking history immediately.
        Your current kitchen remains available until this tab closes. Private
        browsing may discard saved data.
      </p>
      <h3>Finding recipes</h3>
      <p>
        Only when you select Find recipes, ingredient names go through our
        server to Spoonacular. Opening a recipe sends its recipe ID. Quantities
        and storage locations remain on your device. Spoonacular processes
        requests under its own privacy policy. The server uses short-lived
        request counters and does not store your kitchen or set cookies.
      </p>
      <p>
        Recipe-source links open another site when you click them. Your hosting
        provider may process technical connection data such as IP addresses in
        its logs.
      </p>
      <a
        className="source-link"
        href="https://spoonacular.com/food-api/terms"
        target="_blank"
        rel="noopener noreferrer"
      >
        Spoonacular API terms & privacy information{" "}
        <Icon name="arrow" size={15} />
      </a>
      <h3>Your controls</h3>
      <div className="privacy-choices">
        <button className="secondary-button" onClick={exportKitchen}>
          Export my kitchen
        </button>
        <button
          className="secondary-button danger-button"
          onClick={() => setConfirmDelete(true)}
        >
          Delete my saved data
        </button>
      </div>
      {confirmDelete && (
        <div className="delete-confirm">
          <p>
            This clears your kitchen, saved history, and storage preference on
            this browser.
          </p>
          <button
            className="secondary-button danger-button"
            onClick={() => {
              kitchen.clearData();
              setConfirmDelete(false);
            }}
          >
            Confirm deletion
          </button>
          <button
            className="secondary-button"
            onClick={() => setConfirmDelete(false)}
          >
            Cancel
          </button>
        </div>
      )}
      {kitchen.error && (
        <p className="error-message" role="alert">
          {kitchen.error}
        </p>
      )}
    </dialog>
  );
}
export default function PrivacyControls({ kitchen }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <section className="privacy-banner" aria-label="Storage preference">
        {!kitchen.consent ? (
          <>
            <div>
              <strong>Remember your kitchen?</strong>
              <p>
                Save ingredients on this device, or keep them for this session.
                No tracking cookies.
              </p>
            </div>
            <div className="privacy-choices">
              <button
                className="secondary-button"
                onClick={() => kitchen.chooseStorage("save")}
              >
                Save on this device
              </button>
              <button
                className="secondary-button"
                onClick={() => kitchen.chooseStorage("session")}
              >
                Session only
              </button>
            </div>
          </>
        ) : (
          <p>
            {kitchen.consent === "save"
              ? "Your kitchen is saved on this device."
              : "Your kitchen is kept for this session only."}
          </p>
        )}
        <button className="privacy-link" onClick={() => setOpen(true)}>
          Privacy settings
        </button>
      </section>
      {open && (
        <PrivacyDialog kitchen={kitchen} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
