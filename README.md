# Randstad GBS Learning Hub

## Project purpose
The Learning Hub is a static, multi-module site that centralizes Randstad GBS AI enablement programs, prompt libraries, sourcing tools, and leadership workshops behind a searchable landing page so teams can quickly reach the curriculum that fits their role.【F:index.html†L15-L118】【F:shared/scripts/pages/home-search.js†L1-L119】 Each module lives in its own folder but shares common utilities, styles, and components, letting the hub feel cohesive while still supporting deep, program-specific interactions.【F:shared/scripts/components/back-to-top.js†L1-L105】【F:shared/scripts/footer.js†L1-L34】

## Repository structure
- `index.html` – hub landing page with the global search experience that links every major program card to its dedicated module space.【F:index.html†L15-L142】
- `shared/`
  - `scripts/pages/home-search.js` powers the predictive global search, fetches the shared search index, and filters landing cards in place.【F:shared/scripts/pages/home-search.js†L14-L198】
  - `scripts/components/` and `scripts/utils/` expose reusable UI behaviors such as the back-to-top controller, dropdowns, storage helpers, and the RPO navigation manager used throughout the modules.【F:shared/scripts/components/back-to-top.js†L1-L105】【F:shared/scripts/components/dropdown.js†L1-L70】【F:shared/scripts/utils/navigation-manager.js†L1-L188】【F:shared/scripts/utils/storage-manager.js†L1-L128】
  - `scripts/footer.js` lazy-loads the shared footer and rewrites internal links so every module inherits a consistent footer with minimal markup.【F:shared/scripts/footer.js†L1-L34】
  - `styles/` and `vendor/` hold shared CSS skins plus vendored libraries (Firebase and chart-lite) used by modules like the AI workshop.【F:gbs-ai-workshop/src/services/firebase.js†L1-L130】
  - `search-index.json` provides the global search data set that the landing page loads before falling back to local card metadata.【F:shared/scripts/pages/home-search.js†L19-L33】
- `daily-focus/` – “Daily Sourcing Focus” experience with a featured card of the day, category navigation, persistent localStorage progress, and supporting JSON decks.【F:daily-focus/index.html†L18-L63】【F:shared/scripts/pages/daily-focus.js†L1-L200】
- `gbs-prompts/` – Gemini prompt library that loads prompt JSON, animates usage tips, renders category cards, and offers quick links and a Gem builder modal.【F:gbs-prompts/index.html†L21-L198】【F:shared/scripts/pages/gbs-prompts.js†L30-L200】【F:shared/scripts/pages/gbs-prompts-quick-links.js†L1-L10】
- `gbs-ai-workshop/`
  - `index.html` and `app.js` initialize the leader workshop SPA, wiring navigation, Firebase-backed prompt saving, simulators, and other section initializers.【F:gbs-ai-workshop/index.html†L1095-L1100】【F:gbs-ai-workshop/app.js†L1-L44】
  - `config/environment.js` is the template that exposes Firebase and Google AI credentials to the browser at build time.【F:gbs-ai-workshop/config/environment.js†L1-L25】
  - `src/components`, `src/data`, and `src/services` contain modular logic such as the prompt explorer, simulator engine, Firebase data layer, and Gemini API helper used by the workshop sections.【F:gbs-ai-workshop/src/components/PromptExplorer.js†L7-L118】【F:gbs-ai-workshop/src/components/ScenarioSimulator.js†L1-L120】【F:gbs-ai-workshop/src/services/firebaseService.js†L1-L169】【F:gbs-ai-workshop/src/services/aiService.js†L1-L104】
  - `vercel.json` defines the SPA rewrite so client-side navigation works on static hosts.【F:gbs-ai-workshop/vercel.json†L1-L4】
- `rpo-training/` – multi-phase RPO curriculum that loads module and session pages dynamically through `NavigationManager`, restoring scroll state and exposing a back-to-top control.【F:rpo-training/index.html†L21-L158】【F:rpo-training/js/app.js†L1-L61】
- `feedback/` – Google Forms powered feedback workflow plus an internal helper that extracts form entry IDs and action URLs for administrators.【F:feedback/index.html†L37-L188】【F:shared/scripts/pages/feedback.js†L1-L17】【F:feedback/get-entry-ids.html†L10-L28】【F:shared/scripts/pages/get-entry-ids.js†L1-L40】
- `knowledge-content/`, `ai-sme/`, and `use-cases/` – tailored module sites that reuse the shared button, scroll, and navigation utilities for curated knowledge, AI SME enablement, and success-story demos.【F:knowledge-content/index.html†L19-L112】【F:shared/scripts/pages/knowledge-content.js†L1-L3】【F:ai-sme/index.html†L17-L178】【F:shared/scripts/pages/ai-sme.js†L1-L68】【F:use-cases/index.html†L24-L180】【F:shared/scripts/pages/use-cases.js†L1-L192】

## Environment configuration
`gbs-ai-workshop/config/environment.js` reads build-time environment variables (via `process.env` or a pre-populated `window.__ENV__`) so the browser can talk to Firebase and the Gemini API.【F:gbs-ai-workshop/config/environment.js†L1-L25】 The workshop’s Firebase layer requires a complete client credential set and optionally a seeded auth token, while the AI service expects Google Generative AI keys.【F:gbs-ai-workshop/src/services/firebase.js†L1-L130】【F:gbs-ai-workshop/src/services/firebaseService.js†L84-L132】【F:gbs-ai-workshop/src/services/aiService.js†L33-L104】 The table below summarizes the variables the deployment pipeline must inject before serving the static assets.

| Variable | Required? | Purpose |
| --- | --- | --- |
| `FIREBASE_API_KEY` | Yes | API key passed into Firebase initialization; missing keys halt the workshop data layer.【F:gbs-ai-workshop/config/environment.js†L9-L21】【F:gbs-ai-workshop/src/services/firebase.js†L41-L72】 |
| `FIREBASE_AUTH_DOMAIN` | Yes | Auth domain used by Firebase Auth for anonymous/custom-token sessions.【F:gbs-ai-workshop/config/environment.js†L9-L15】【F:gbs-ai-workshop/src/services/firebase.js†L41-L72】 |
| `FIREBASE_PROJECT_ID` | Yes | Project ID required for Firestore access inside the workshop prompt library.【F:gbs-ai-workshop/config/environment.js†L9-L15】【F:gbs-ai-workshop/src/services/firebase.js†L41-L72】 |
| `FIREBASE_APP_ID`, `FIREBASE_DATABASE_URL`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_MEASUREMENT_ID` | Optional but recommended | Additional Firebase identifiers used when present for analytics, storage, or RTDB access.【F:gbs-ai-workshop/config/environment.js†L12-L21】【F:gbs-ai-workshop/src/services/firebase.js†L41-L55】 |
| `FIREBASE_COLLECTION_ROOT` | Optional | Overrides the Firestore collection namespace for saved prompts; defaults to `artifacts`.【F:gbs-ai-workshop/config/environment.js†L17-L21】【F:gbs-ai-workshop/src/services/firebaseService.js†L84-L109】 |
| `APP_ID` / `FIREBASE_APP_IDENTIFIER` | Optional | Custom app identifier stored alongside user libraries; defaults to `gbs-gemini-training`.【F:gbs-ai-workshop/config/environment.js†L17-L21】【F:gbs-ai-workshop/src/services/firebaseService.js†L84-L109】 |
| `FIREBASE_INITIAL_AUTH_TOKEN` / `FIREBASE_CUSTOM_TOKEN` | Optional | Allows seeding a custom Firebase auth session instead of anonymous sign-in when launching the workshop.【F:gbs-ai-workshop/src/services/firebaseService.js†L117-L132】 |
| `GOOGLE_AI_API_KEY` / `AI_API_KEY` | Yes for Gemini features | REST API key for Google’s Generative Language endpoint used by the reverse prompt and builder tools.【F:gbs-ai-workshop/config/environment.js†L19-L21】【F:gbs-ai-workshop/src/services/aiService.js†L37-L66】 |
| `GOOGLE_AI_API_URL` / `AI_API_URL` | Optional | Custom base URL for the Gemini endpoint; defaults to `https://generativelanguage.googleapis.com/v1beta`.【F:gbs-ai-workshop/config/environment.js†L19-L21】【F:gbs-ai-workshop/src/services/aiService.js†L37-L58】 |
| `GOOGLE_AI_MODEL` / `AI_MODEL` | Optional | Overrides the default Gemini model (`gemini-2.0-flash`).【F:gbs-ai-workshop/config/environment.js†L19-L21】【F:gbs-ai-workshop/src/services/aiService.js†L37-L58】 |

During local development or in CI/CD, ensure this configuration file is rewritten with concrete values before the site is served. You can either run a bundler that replaces `process.env.*` or add a prebuild script that serializes `window.__ENV__` (for example, `node scripts/inject-env.mjs` that writes the JSON object into `config/environment.js`) so the browser receives real credentials.【F:gbs-ai-workshop/config/environment.js†L1-L25】 The Firebase layer falls back to anonymous auth when no custom token is provided, so leaving `FIREBASE_INITIAL_AUTH_TOKEN` blank is acceptable for sandbox testing.【F:gbs-ai-workshop/src/services/firebaseService.js†L117-L132】

## Build and local development
The repository is entirely static: each HTML page loads ES modules directly with `<script type="module">` tags, so no compilation step is required beyond making sure `config/environment.js` is populated.【F:rpo-training/index.html†L154-L158】【F:gbs-ai-workshop/index.html†L1095-L1100】 To preview the site locally:

1. Inject or hardcode the environment values as described above (for development you can temporarily set `window.__ENV__ = { ... }` inside `gbs-ai-workshop/config/environment.js`).【F:gbs-ai-workshop/config/environment.js†L4-L25】
2. Start any static server from the repository root, for example:
   ```bash
   npx http-server . --port 4173
   ```
   or
   ```bash
   python -m http.server 4173
   ```
3. Open `http://localhost:4173/` to use the landing page search and navigate into the module directories. Firebase- and Gemini-backed features require valid credentials to function, while purely static modules (Daily Focus, Prompt Library, etc.) work offline with the bundled JSON data.【F:shared/scripts/pages/daily-focus.js†L1-L200】【F:shared/scripts/pages/gbs-prompts.js†L30-L200】

## Interactive modules and entry points
| Module | Location | Primary entry script(s) | Key interactions |
| --- | --- | --- | --- |
| Hub landing search | `index.html` | `shared/scripts/pages/home-search.js` | Loads the global search index, attaches suggestion chips, scores results, and filters landing cards in place.【F:index.html†L23-L142】【F:shared/scripts/pages/home-search.js†L14-L198】 |
| RPO AI Acceleration Program | `rpo-training/index.html` | `rpo-training/js/app.js` | Configures `NavigationManager`, fetches session HTML fragments, restores scroll position, and exposes a reusable back-to-top control.【F:rpo-training/index.html†L21-L158】【F:rpo-training/js/app.js†L1-L61】【F:shared/scripts/utils/navigation-manager.js†L1-L188】 |
| GBS AI Workshop | `gbs-ai-workshop/index.html` | `gbs-ai-workshop/app.js` | Initializes section controllers, hooks Firebase prompt libraries, and refreshes navigation once credentials load.【F:gbs-ai-workshop/index.html†L1095-L1100】【F:gbs-ai-workshop/app.js†L1-L44】【F:gbs-ai-workshop/src/services/firebaseService.js†L78-L138】 |
| Prompt Library | `gbs-prompts/index.html` | `shared/scripts/pages/gbs-prompts.js`, `shared/scripts/pages/gbs-prompts-quick-links.js` | Fetches prompt JSON, animates hero subtitles, renders category/detail views, and filters quick links client-side.【F:gbs-prompts/index.html†L21-L154】【F:shared/scripts/pages/gbs-prompts.js†L30-L200】【F:shared/scripts/pages/gbs-prompts-quick-links.js†L1-L10】 |
| Daily Sourcing Focus | `daily-focus/index.html` | `shared/scripts/pages/daily-focus.js` | Builds action cards, persists completion progress, rotates the card of the day, and filters decks by category.【F:daily-focus/index.html†L18-L63】【F:shared/scripts/pages/daily-focus.js†L1-L182】 |
| AI SME Enablement | `ai-sme/index.html` | `shared/scripts/pages/ai-sme.js` | Toggles the mobile menu, orchestrates accordions/tabs, and highlights navigation targets on scroll.【F:ai-sme/index.html†L17-L178】【F:shared/scripts/pages/ai-sme.js†L1-L68】 |
| AI Success Stories | `use-cases/index.html` | `shared/scripts/pages/use-cases.js` | Applies category filters, launches interactive demos (boolean search and JD generator), and exposes copy actions.【F:use-cases/index.html†L24-L180】【F:shared/scripts/pages/use-cases.js†L1-L192】 |
| Knowledge Content | `knowledge-content/index.html` | `shared/scripts/pages/knowledge-content.js` | Presents accordion-based training resources and enables the shared back-to-top component for long scroll pages.【F:knowledge-content/index.html†L19-L112】【F:shared/scripts/pages/knowledge-content.js†L1-L3】 |
| Feedback form | `feedback/index.html` | `shared/scripts/pages/feedback.js` | Posts responses to Google Forms through a hidden iframe and reveals a success message once the submission completes.【F:feedback/index.html†L37-L188】【F:shared/scripts/pages/feedback.js†L1-L17】 |
| Google Form entry ID helper | `feedback/get-entry-ids.html` | `shared/scripts/pages/get-entry-ids.js` | Guides admins through deriving form entry IDs and action URLs, dynamically rendering the instructions from the supplied form link.【F:feedback/get-entry-ids.html†L10-L28】【F:shared/scripts/pages/get-entry-ids.js†L1-L40】 |

## Deployment guidance
### Deploying to Vercel
1. **Create the Vercel project** targeting the repository root so that every module and asset is included in the static output.【F:index.html†L15-L142】【F:gbs-ai-workshop/index.html†L1095-L1100】
2. **Set environment variables** in the Vercel dashboard for every Firebase and Google AI key listed above; these values will be available during the build step.【F:gbs-ai-workshop/config/environment.js†L9-L21】【F:gbs-ai-workshop/src/services/aiService.js†L37-L66】
3. **Inject the runtime environment file** before deployment. Add a build script (for example, `node scripts/inject-env.mjs`) that serializes `window.__ENV__` with the configured variables so the static `config/environment.js` ships real credentials.【F:gbs-ai-workshop/config/environment.js†L4-L25】
4. **Run a static export** (`vercel --prod` or Vercel’s CI build) after the injection step. The included `gbs-ai-workshop/vercel.json` ensures every workshop route rewrites to `index.html`, keeping section-based navigation working under client-side routing.【F:gbs-ai-workshop/vercel.json†L1-L4】
5. **Verify protected features** by loading the deployed workshop, confirming the Firebase library loads sessions and the Gemini-powered tools respond. Errors surface through the inline Firebase error banner configured in `app.js`.【F:gbs-ai-workshop/app.js†L13-L44】

### Other static hosts
The site can be served from any static host (Netlify, Cloudflare Pages, S3 + CloudFront, Azure Static Web Apps) as long as you:
- Run the same environment-injection step that produces a `window.__ENV__` object before uploading the assets.【F:gbs-ai-workshop/config/environment.js†L4-L25】
- Configure SPA-style rewrites for the workshop (e.g., Netlify `_redirects` entry `/* /gbs-ai-workshop/index.html 200`) mirroring the provided Vercel rule.【F:gbs-ai-workshop/vercel.json†L1-L4】
- Serve the repository root so every module remains reachable at its folder path and shared scripts stay relative.【F:index.html†L15-L142】【F:rpo-training/index.html†L21-L158】 Once these requirements are met, the remaining modules run entirely in the browser with the JSON data committed in the repository.【F:shared/scripts/pages/daily-focus.js†L1-L182】【F:shared/scripts/pages/gbs-prompts.js†L30-L200】
