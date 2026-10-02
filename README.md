# Vue Reference App

A small but complete **Vue 3 + TypeScript** application that doubles as a **reference project**. Copy
it, replace the "devices" example with your own domain, and keep the structure, the tooling and every
kind of test.

Two small features are enough to exercise every building block: a **status page** (a heartbeat API
called by a poller) and a **devices page** (list, add and delete, with a reusable modal dialog and a
reusable success/failure block).

## Quick start

```bash
nvm use                              # Node 22 (what this was verified on; Vite 7 needs >= 20.19)
npm ci                               # installs exactly what package-lock.json says
npm run dev                          # http://localhost:5173, a built-in mock API serves /api/*

npm run verify                       # lint + format + types + unit/integration/contract tests + coverage
npx playwright install chromium     # once, to run the browser tests
npm run test:api && npm run test:e2e
```

> **npm note.** In the environment this was built in, `npm install` on npm 10.9 crashed with
> `Cannot read properties of undefined (reading 'edgesOut')` while resolving Vitest 4 with Vite 7.
> The lockfile was generated with npm 11 (`npx npm@11 install`), and `npm ci` works on npm 10 with it.
> Use `npm ci`, and regenerate the lockfile with npm 11 if you ever hit the same error.

## Structure

```
.
├── src/                       the application; tests sit next to the code as *.spec.ts
│   ├── README.md              the layering contract (who may import whom)
│   ├── types/                 zod schemas + inferred types, DTOs, shared interfaces
│   ├── constants/             API paths, route names, thresholds
│   ├── utils/                 pure helpers: Poller, validation, formatters, result helpers
│   ├── models/                DTO <-> domain mapping, domain rules and labels
│   ├── infrastructure/        plumbing with no domain knowledge
│   │   ├── http/              axios client, safeRequest, typed requests
│   │   └── config/            typed environment variables (the only reader of import.meta.env)
│   ├── services/              domain-facing API clients: heartbeatService, deviceService
│   ├── composables/           reusable reactive logic: useApiAction, usePoller, useModal
│   ├── stores/                Pinia stores: heartbeat, devices
│   ├── components/
│   │   ├── base/              BaseButton, BaseInput, BaseModal (no knowledge of the domain)
│   │   ├── common/            ApiStateBlock, ConfirmDialog, StatusBadge (generic, built from base)
│   │   ├── devices/           DeviceTable, DeviceForm (domain components)
│   │   └── heartbeat/         HeartbeatIndicator
│   ├── views/                 route-level pages: Home (status), Devices, NotFound
│   ├── router/                route table and router factory
│   ├── assets/                global CSS and design tokens
│   └── App.vue  main.ts  vite-env.d.ts
├── tests/                     everything that cannot sit next to the code it tests
│   ├── api/                   Playwright: the HTTP API itself, no browser
│   ├── e2e/                   Playwright: browser journeys and accessibility checks
│   ├── visual/                Playwright: screenshot comparison (baselines in __snapshots__/)
│   ├── integration/           Vitest: the real app (router, stores, services) against a fake server
│   ├── contract/              Vitest: the fakes still match the real types
│   ├── fixtures/              builders for test data: buildDevice(), buildDeviceDto(), ...
│   ├── mocks/                 MSW handlers and the fake HTTP server
│   ├── helpers/               withSetup, mountApp, createDeferred, DOM helpers, resetBackend
│   └── setup/                 Vitest setup (auto-unmount, <dialog> stand-in, network guard)
├── tools/mock-api/            in-memory fake backend (a Vite plugin) for dev, preview and browser tests
├── docs/                      ARCHITECTURE.md, TESTING.md
├── Jenkinsfile                CI pipeline
└── configuration              package.json, tsconfig*.json, vite/vitest/playwright/stryker configs,
                               eslint, prettier, .editorconfig, .nvmrc, .env.example, ...
```

## What goes where

| Directory            | Put here                                                                      | May import from                                                               | Verified by                        |
| -------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------- |
| `src/types`          | zod schemas, `z.infer` types, DTOs. Declarations only.                        | nothing but zod                                                               | unit (parsing), type-level checks  |
| `src/constants`      | values that never change at run time                                          | types                                                                         | no tests needed: no logic          |
| `src/utils`          | framework-free helpers that could be copied to any project                    | types, constants                                                              | unit                               |
| `src/models`         | mappers (DTO to domain) and domain rules: code with behaviour                 | types, utils, constants                                                       | unit                               |
| `src/infrastructure` | HTTP client, `safeRequest`, typed environment: plumbing, no domain            | types, utils, constants                                                       | unit (HTTP against MSW)            |
| `src/services`       | one function per backend operation; returns `ApiResult`, never throws         | infrastructure, models, types, utils, constants                               | unit against MSW                   |
| `src/composables`    | reusable reactive logic with no markup                                        | types, utils, constants, infrastructure/config                                | unit with `withSetup`              |
| `src/stores`         | app state and the actions that change it                                      | services, composables, models, types, utils, constants, infrastructure/config | unit, services mocked; integration |
| `src/components`     | reusable UI: props down, events up, no fetching                               | composables, models, types, utils                                             | component tests                    |
| `src/views`          | pages: compose components, read and call stores                               | components, composables, stores, models, utils                                | view tests; integration; e2e       |
| `src/router`         | routes (lazy-loaded views) and the router factory                             | views, constants                                                              | unit                               |
| `tests/`             | fixtures, fakes, helpers, and every test that spans layers or needs a browser | anything                                                                      | -                                  |
| `tools/mock-api`     | a fake backend that obeys the same schemas as the app                         | types                                                                         | contract and API tests             |

The import rules are checked by ESLint. See [src/README.md](src/README.md) and
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Tools, and where each one is used

| Tool                                                | Role                                                       | Used in                                      |
| --------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------- |
| Vue 3 (`<script setup>`, Composition API)           | UI framework                                               | `components/`, `views/`, `composables/`      |
| Vite                                                | dev server and bundler                                     | `vite.config.ts`, `tools/mock-api`           |
| TypeScript, vue-tsc                                 | static typing, including `.vue` files                      | `tsconfig*.json`, `npm run type-check`       |
| Pinia                                               | application state                                          | `stores/`                                    |
| Vue Router                                          | routing, lazy-loaded views                                 | `router/`                                    |
| axios                                               | HTTP client                                                | `infrastructure/http`                        |
| zod                                                 | runtime validation; the schema is also the TypeScript type | `types/`, `infrastructure/http/typedRequest` |
| Vitest, jsdom, v8 coverage                          | unit, integration and contract tests; coverage             | `src/**/*.spec.ts`, `tests/`                 |
| Vue Test Utils, `@pinia/testing`                    | mount components; stub stores in view tests                | component and view specs                     |
| MSW (Mock Service Worker)                           | fake HTTP server inside the test process                   | `tests/mocks`, service and integration tests |
| Playwright                                          | API, browser and screenshot tests                          | `tests/api`, `tests/e2e`, `tests/visual`     |
| axe-core                                            | accessibility checks in the browser                        | `tests/e2e/accessibility.spec.ts`            |
| Stryker                                             | mutation testing: do the tests notice bugs?                | `stryker.config.mjs`                         |
| ESLint (typescript-eslint, vue, vitest, playwright) | code rules and the layer rules                             | `eslint.config.js`                           |
| Prettier, EditorConfig                              | formatting                                                 | `.prettierrc.json`, `.editorconfig`          |
| Jenkins                                             | CI: per push and nightly                                   | `Jenkinsfile`                                |

## The reusable building blocks

| Block                                | Where                                                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Poller (takes an API and a callback) | `src/utils/poller.ts`, `src/composables/usePoller.ts`                                                       |
| Heartbeat API                        | `src/services/heartbeatService.ts`, `src/stores/heartbeatStore.ts`, `HeartbeatIndicator.vue`                |
| Reusable API success / failure       | `safeRequest` + `ApiResult` (logic), `useApiAction` (state), `ApiStateBlock.vue` (UI)                       |
| Reusable modal dialog                | `BaseModal.vue` (native `<dialog>`), `ConfirmDialog.vue`, `useModal.ts`                                     |
| Strict typing                        | zod schemas are the types; strict `tsconfig`; `no-explicit-any` in ESLint                                   |
| DRY                                  | one schema per shape, one request wrapper, one state composable, one modal, one builder per entity in tests |

## Tests

| Kind                                  | Command                                         | Tool                        | Folder                       |
| ------------------------------------- | ----------------------------------------------- | --------------------------- | ---------------------------- |
| Static                                | `npm run lint:ci`, `format:check`, `type-check` | ESLint, Prettier, vue-tsc   | whole repo                   |
| Unit, component, store, service, view | `npm run test:unit`                             | Vitest, Vue Test Utils, MSW | `src/**/*.spec.ts`           |
| Integration                           | `npm run test:integration`                      | Vitest, MSW                 | `tests/integration`          |
| Contract                              | `npm run test:contract`                         | Vitest, zod                 | `tests/contract`             |
| All of the above + coverage           | `npm test`                                      | Vitest, v8 coverage         |                              |
| API                                   | `npm run test:api`                              | Playwright (no browser)     | `tests/api`                  |
| End-to-end and accessibility          | `npm run test:e2e`                              | Playwright, axe-core        | `tests/e2e`                  |
| Visual                                | `npm run test:visual`                           | Playwright screenshots      | `tests/visual`               |
| Mutation                              | `npm run test:mutate`                           | Stryker                     | report in `reports/mutation` |

How to write each kind, with examples from this repository: [docs/TESTING.md](docs/TESTING.md).

## Configuration files

| File                                  | What it does                                                                            |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| `package.json`                        | dependencies, the `npm run` commands, the supported Node version (`engines`)            |
| `package-lock.json`                   | exact versions of everything installed. Commit it; CI installs with `npm ci`            |
| `.nvmrc`                              | the Node version for nvm and CI                                                         |
| `tsconfig.json`                       | only lists the three projects below                                                     |
| `tsconfig.base.json`                  | the strict compiler flags shared by all three                                           |
| `tsconfig.app.json`                   | type-checks `src/` as browser code (specs excluded)                                     |
| `tsconfig.vitest.json`                | type-checks specs, `tests/` (Vitest side) and `tools/` (adds Node and test types)       |
| `tsconfig.node.json`                  | type-checks the config files, `tools/` and the Playwright suites as Node code           |
| `vite.config.ts`                      | dev server and build, the `@` and `@tests` aliases, the mock API plugin                 |
| `vitest.config.ts`                    | test runner: jsdom, three projects, guard rails, coverage thresholds, JUnit output      |
| `playwright.config.ts`                | API, e2e and visual projects, the web server it starts, reporters, locale and time zone |
| `stryker.config.mjs`                  | mutation testing: what to mutate, thresholds                                            |
| `eslint.config.js`                    | code rules, the layer (import direction) rules, test rules                              |
| `.prettierrc.json`, `.prettierignore` | code formatting                                                                         |
| `.editorconfig`                       | indentation, line endings and charset for any editor                                    |
| `.env.example`                        | the environment variables the app understands (copy to `.env.local`)                    |
| `.gitignore`                          | what Git must not track (dependencies, build and report output)                         |
| `.vscode/extensions.json`             | extensions VS Code suggests (Vue, ESLint, Prettier, Vitest, Playwright)                 |
| `index.html`                          | the single HTML page Vite starts from                                                   |
| `src/vite-env.d.ts`                   | tells TypeScript about Vite's `import.meta.env` and the names of our variables          |
| `Jenkinsfile`                         | the CI pipeline                                                                         |

Why three `tsconfig` projects? Browser code must not see Node types, and test code needs both. Splitting
them lets the compiler flag, for example, `process` used inside a component.

## Using this as the starting point of a new project

1. Copy the folder, change `name` in `package.json`, run `npm ci`.
2. Keep everything generic: configs, `src/utils`, `src/infrastructure`, `src/composables`,
   `src/components/base` and `common`, the `tests/` infrastructure and `tools/`.
3. Replace the devices example (`types/device.ts`, `models/device.ts`, `deviceService`, `deviceStore`,
   `components/devices`, `DevicesView`, mock seeds and their tests) by following the checklist in
   [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#adding-a-feature-checklist).
4. Point `VITE_API_BASE_URL` at your real backend. Delete `tools/mock-api/` when you no longer need it,
   and run the API tests against a real environment with `BASE_URL=https://... npm run test:api`.
5. Create the visual baselines in your CI environment (`npm run test:visual:update`) and commit them.
6. Raise the coverage thresholds in `vitest.config.ts` as the suite grows.

## Continuous integration

The `Jenkinsfile` runs the fast checks on every push and the slow suites (API, browser, visual,
mutation) nightly. Test results and coverage are published to Jenkins as JUnit and Cobertura reports;
Playwright HTML reports, traces and screenshot diffs are archived as build artifacts. The pipeline was
written for this reference but has not been run on a Jenkins server, so check the agent, plugins and
notification step against your installation.

## Things to know

- **Visual baselines are not included.** Screenshots depend on the operating system and fonts, so
  generate them where CI runs: `npm run test:visual:update`, review the images, commit them.
- **The mock API only exists in dev and preview.** It is a Vite plugin with no effect on the production
  bundle, and it is switched off under Vitest (MSW plays that role there).
- **Versions** follow the majors of the OpenNMS UI-extension project this was modelled on (Vue 3.5,
  Vite 7, Vitest 4, TypeScript 5.9, ESLint 10, Pinia 3). Playwright is pinned to 1.56 because the browser
  tests need the Chromium build that matches the Playwright version; upgrade both together.
