import { useState } from "react";
import {
  INVENTORY_KEY,
  LEGACY_KEY,
  CONSENT_KEY,
  sanitizeItems,
  applyDeductions,
  undoDeductions,
  normalizeIngredient,
} from "../lib/inventory";
function loadKitchen() {
  try {
    const choice = localStorage.getItem(CONSENT_KEY);
    const consent = ["save", "session"].includes(choice) ? choice : null;
    const raw = JSON.parse(localStorage.getItem(INVENTORY_KEY) || "null");
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "[]");
    return {
      items: consent === "session" ? [] : sanitizeItems(raw?.items || legacy),
      lastCook:
        consent !== "session" &&
        raw?.lastCook?.id &&
        Array.isArray(raw.lastCook.deductions)
          ? raw.lastCook
          : null,
      consent,
      error: "",
    };
  } catch {
    return {
      items: [],
      lastCook: null,
      consent: null,
      error:
        "Browser storage is unavailable or damaged. Your kitchen works for this session.",
    };
  }
}
export default function useKitchen() {
  const [state, setState] = useState(loadKitchen);
  function commit(next) {
    const nextState = { ...state, ...next, error: "" };
    try {
      if (nextState.consent === "save") {
        localStorage.setItem(
          INVENTORY_KEY,
          JSON.stringify({
            items: nextState.items,
            lastCook: nextState.lastCook,
          }),
        );
        localStorage.removeItem(LEGACY_KEY);
      }
    } catch {
      nextState.error =
        "Could not save your kitchen. Changes remain in this tab only.";
    }
    setState(nextState);
  }
  function chooseStorage(consent) {
    let error = "";
    try {
      localStorage.setItem(CONSENT_KEY, consent);
      if (consent === "save") {
        localStorage.setItem(
          INVENTORY_KEY,
          JSON.stringify({ items: state.items, lastCook: state.lastCook }),
        );
        localStorage.removeItem(LEGACY_KEY);
      } else {
        localStorage.removeItem(INVENTORY_KEY);
        localStorage.removeItem(LEGACY_KEY);
      }
    } catch {
      error =
        "Could not update browser storage. Changes remain in this tab only.";
    }
    setState({ ...state, consent, error });
  }
  function addItem(item) {
    const existing = state.items.find(
      (entry) =>
        normalizeIngredient(entry.name) === normalizeIngredient(item.name) &&
        entry.location === item.location &&
        entry.unit === item.unit,
    );
    commit({
      items: existing
        ? state.items.map((entry) =>
            entry.id === existing.id
              ? { ...entry, quantity: (entry.quantity || 0) + item.quantity }
              : entry,
          )
        : [...state.items, { ...item, id: crypto.randomUUID() }],
    });
  }
  function editItem(id, changes) {
    commit({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...changes } : item,
      ),
    });
  }
  function removeItem(id) {
    commit({ items: state.items.filter((item) => item.id !== id) });
  }
  function cook(rows, eventId, title) {
    if (state.lastCook?.id === eventId)
      throw new Error("This cooking action has already been recorded.");
    const result = applyDeductions(state.items, rows, eventId, title);
    commit({ items: result.items, lastCook: result.event });
  }
  function undo() {
    if (!state.lastCook) return;
    commit({
      items: undoDeductions(state.items, state.lastCook),
      lastCook: null,
    });
  }
  function clearData() {
    try {
      localStorage.removeItem(INVENTORY_KEY);
      localStorage.removeItem(LEGACY_KEY);
      localStorage.removeItem(CONSENT_KEY);
    } catch {
      setState({
        ...state,
        error:
          "Could not delete browser data. You can clear site storage in your browser settings.",
      });
      return;
    }
    setState({ items: [], lastCook: null, consent: null, error: "" });
  }
  return {
    ...state,
    addItem,
    editItem,
    removeItem,
    cook,
    undo,
    chooseStorage,
    clearData,
  };
}
