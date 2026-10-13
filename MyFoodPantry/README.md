# Little Pantry

A React app for quantity-aware fridge/freezer and pantry inventory, with Spoonacular recipe discovery and ingredient deductions.

## Setup

Use Node.js 20.19+ or 22.12+ (Node 24 is also supported). Startup automatically enables HTTPS-proxy support when your Node version provides it; older supported versions start without that optional flag. On older versions, use direct API network access or upgrade to Node 24 if your host requires an environment-configured HTTPS proxy.

```sh
npm ci
cp .env.example .env.local
```

Enter your Spoonacular key securely in `.env.local` as `SPOONACULAR_API_KEY`, or configure that variable on your server. `.env.local` is ignored by Git. Never put this key in a `VITE_` variable, source file, browser bundle, or repository. Restart the development server after changing local environment files.

```sh
npm run dev
```

Vite serves the React app and the server-only `/api/recipes` middleware. The key is sent to Spoonacular via the `x-api-key` header, never to the browser. Network access to `api.spoonacular.com` is required. In Codex cloud, enter the value through environment settings rather than chat. Network and key settings saved as a draft must be saved/applied before live API access works.

## Production

```sh
npm run build
npm start
```

The Node server serves `dist` and the same API handler. Configure `SPOONACULAR_API_KEY`, `PORT`, and (if your host requires it) `HOST=0.0.0.0`. Deploy behind HTTPS. A static-only host cannot run this server-side integration. `npm run preview` also includes API middleware for local testing.

The server distinguishes missing configuration, invalid API keys, exhausted quota, and connectivity errors. Requests time out after 15 seconds. A process-wide cap of 30 requests per minute limits accidental repeated usage; it is not a substitute for hosting-level abuse protection for a public deployment. Recipe requests are deliberately user-triggered to avoid automatically consuming quota with each inventory edit.

## App structure

- `src/App.jsx`: composition only.
- `src/components/`: header, hero, ingredient form, visible inventory shelves, kitchen panel, recipe browser/card/dialog, cooking planner, privacy controls.
- `src/hooks/useKitchen.js`: inventory state, explicit browser persistence choice, cooking history, undo.
- `src/lib/inventory.js`: legacy migration, units, matching, atomic deductions, and undo.
- `src/lib/spoonacular.js`: client API helpers and response adapters.
- `server/api.js`: shared server-only Spoonacular integration.
- `server/index.js`: production server.

## Inventory and cooking

Fridge and Freezer are one location, shown alongside Pantry without tabs. Each item has a quantity and unit. Existing saved ingredients migrate; old entries without quantities are marked for quantity entry, and Freezer moves into Fridge/Freezer.

Open a recipe, select servings, and review the proposed ingredient deductions. Weight units convert to weight units; volume units convert to volume units using US customary cup/tbsp/tsp measures. Counts match identical units. The app never guesses density or the weight of a whole ingredient. When names or units do not match, select an inventory item and enter the amount in its stored unit yourself.

Start cooking or record a recipe already made to deduct all planned amounts atomically. Insufficient or unknown stock blocks the operation. Ingredients obtained separately can be excluded from deductions after explicit confirmation. Both cooking actions deduct once per open recipe; after recording, controls are disabled. Opening the same recipe again represents another meal. Undo the last recorded meal in My kitchen. Items at zero remain visible as out of stock. Editing an item's unit clears its quantity to prevent accidental reinterpretation. Adding the same name/location/unit increases existing stock.

Recipe discovery matches names, not guaranteed quantities. Review the full recipe and verify allergies and safe cooking temperatures. Recipe instructions and original-source attribution come from Spoonacular; missing instructions are clearly reported. Local decorative illustrations avoid third-party image requests.

## Privacy

There are no cookies, analytics, tracking scripts, or third-party fonts. Visitors choose whether to store their kitchen in localStorage; before choosing, new changes stay in memory. Save and session-only choices have equal prominence. The essential saving preference remembers the choice. Saved inventory and the last undoable cooking action remain until deletion. Privacy settings let users withdraw storage permission, export inventory, or delete saved data and the preference. Withdrawal deletes saved inventory while preserving the current tab's working state.

Finding recipes sends ingredient names through the server to Spoonacular. Recipe detail requests send recipe IDs. Quantities and locations are not sent. Data is not sent automatically on entry. The app server does not persist inventories or use tracking cookies; hosting infrastructure may produce access logs. Spoonacular and external recipe sites have their own privacy policies.

These controls implement privacy-conscious defaults; they do not certify compliance with every jurisdiction. Before public deployment, the operator must review applicable laws, hosting logs, vendor terms, and any operator/contact disclosures required for their deployment. Adding analytics or advertising requires a separate consent and privacy review.

## Validation

```sh
npm test
npm run lint
npm run build
```

Unit tests cover conversions, legacy migration, scaled and aggregated deductions, insufficient/unknown stock, undo, secure API routing, and sanitized error handling. Browser checks use explicitly mocked Spoonacular responses when real network access or credentials are unavailable. A passing mocked check does not establish live vendor access.

The repeatable mocked browser smoke test is `tests/browser_smoke.py`. It requires Python Playwright and Chromium, with the dev server running. Set `APP_URL` and `CHROMIUM_PATH` if needed:

```sh
python tests/browser_smoke.py
```
