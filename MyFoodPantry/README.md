# Little Pantry

A React app that turns fridge, pantry, and freezer ingredients into recipe ideas.

## Run locally

Use Node.js 24 (or a Vite-compatible version: Node 20.19+ or 22.12+).

```sh
npm ci
npm run dev
```

## Features

- Add one ingredient or a comma-separated list and choose its storage location.
- Remove ingredients or filter your kitchen by location.
- Automatically save inventory in localStorage, including across browser restarts.
- Rank 10 included recipes by the proportion of ingredients you have.
- Filter recipes ready to cook, find meals taking 30 minutes or less, or search.
- Open each recipe for quantities, missing ingredients, servings, and instructions.
- Responsive layouts, keyboard-accessible recipe dialogs, and reduced-motion support.

Inventory stays in the same browser profile and site origin; it does not sync across devices. Clearing browser data removes it. Private browsing may discard it when closed. If browser storage is unavailable, the app displays a warning and continues working for that session.

Recipe matching recognizes common aliases, such as spaghetti/pasta and eggs/egg. It checks ingredient names rather than available amounts; check quantities before cooking. Water is assumed available, and salt and pepper are optional. Recipes are bundled with the app and require no external API or credentials.

## Validate

```sh
npm run build
npm run lint
node --test src/recipes.test.js
```

The unit checks cover matching, missing ingredients, saved-data validation, and recipe completeness. For a browser smoke check, add `pasta, tomatoes, garlic, olive oil`, confirm the pasta recipe is ready, open its instructions, close and reopen the browser to confirm persistence, then remove garlic and confirm it is missing from that recipe. Also check the app at a narrow mobile viewport.
