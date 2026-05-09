# Client

## Common Commands

Run these commands from `five_college_connect/client`.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Creates a production build. |
| `npm test` | Runs the client test suite once. |
| `npm run test:watch` | Runs the client tests in watch mode while developing. |
| `npm run coverage` | Runs client tests and generates a client-only coverage report. |
| `npm run lint` | Runs ESLint on the client codebase. |

For full local development with the database and backend, use the root
`npm run dev` command instead.

## Local Development

The Vite dev server runs on `http://localhost:3000`.

The client expects the backend API to be available separately, usually through
the root dev command or a server process running on port `4000`.

## Tests

Client tests live in `tests/` and use Vitest with Testing Library.

Shared test setup is in `tests/setupTests.js`, and shared render/fetch helpers
are in `tests/test-utils.jsx`.

Run the client test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run client-only coverage:

```bash
npm run coverage
```

## Directory Notes

```text
src/pages/       Page-level views
src/components/  Reusable UI components
src/context/     Auth context and provider
src/lib/         API, storage, logging, and small helpers
tests/           Frontend component tests
```
