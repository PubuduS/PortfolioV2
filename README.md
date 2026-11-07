# Portfolio v2

Personal portfolio for Pubudu Wijesooriya. The site is an Angular application in an Nx workspace. Content lives in Firebase Authentication, Firestore, Storage, and Cloud Functions. Local development uses the Firebase Emulator Suite, seeded from the sanitized snapshot in `db/baseline`.

## Setup

Node 22.23.4, npm 12.2.1, and JDK 21 (Eclipse Temurin) are declared in `mise.toml`. Angular, Nx, and the Firebase CLI are installed by `npm ci`.

1. Install [mise](https://mise.jdx.dev/getting-started.html), then activate it so a new terminal picks up this repo's tools.

On a Mac, install mise and add it to Zsh. Zsh is the shell Terminal and iTerm use:

```bash
curl -fsSL https://mise.run | sh
echo 'eval "$(~/.local/bin/mise activate zsh)"' >> "${ZDOTDIR:-$HOME}/.zshrc"
```

If Homebrew already installed mise, use `mise` in that line instead of `~/.local/bin/mise`.

On Windows, install mise and add it to PowerShell:

```powershell
winget install jdx.mise
if (-not (Test-Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force | Out-Null }
Add-Content $PROFILE '(&mise activate pwsh) | Out-String | Invoke-Expression'
```

Windows PowerShell 5.1 applies the tools at the next prompt. PowerShell 7 applies them when you change directories. Open a new terminal after either setup, then run `mise doctor`. It should report that mise is activated.

2. From this directory, install the pinned tools:

```bash
mise install
```

3. Install dependencies:

```bash
npm ci
npm ci --prefix functions
```

4. `environment.ts` and `environment.development.ts` stay on your machine. Git does not store them, so keep a copy of both outside this repository. On a new clone, create `environment.ts` only when it is missing:

```powershell
$destination = 'apps/portfolio-v2/src/environments/environment.ts'
if (-not (Test-Path $destination)) {
  Copy-Item apps/portfolio-v2/src/environments/environment.emulator.ts $destination
}
```

On macOS or Linux:

```bash
test -f apps/portfolio-v2/src/environments/environment.ts || cp apps/portfolio-v2/src/environments/environment.emulator.ts apps/portfolio-v2/src/environments/environment.ts
```

## Run

Use two terminals.

```bash
npm run emulators
npm start
```

`npm run emulators` builds the Cloud Functions, starts Auth, Firestore, Storage, and Functions with JDK 21, and loads `db/baseline`. Stopping that process stops the emulators and drops their data.

`npm start` serves the site against those emulators and opens a browser. The app is at [http://localhost:4200](http://localhost:4200). The emulator UI is at [http://127.0.0.1:4000](http://127.0.0.1:4000).

`npm run start:live` serves the same app against the live Firebase project. That configuration reads `environment.development.ts`, which stays on your machine.

## Build

```bash
npm run build
```

The production build is written to `dist/apps/portfolio-v2`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Serves the app on port 4200 with the emulator environment. |
| `npm run start:live` | Serves the app against the live Firebase project. |
| `npm run emulators` | Starts the Firebase emulators, builds Cloud Functions, and seeds `db/baseline`. |
| `npm run db:seed` | Writes `db/baseline` into emulators that are already running. |
| `npm run db:reset` | Clears Auth, Firestore, and Storage in the emulators, then seeds the baseline. |
| `npm run db:verify` | Compares the running emulators with `db/baseline`. |
| `npm run db:snapshot` | Reads the live Firestore and Storage data, sanitizes it, and rewrites `db/baseline`. |
| `npm run build` | Builds the production app into `dist/apps/portfolio-v2`. |
| `npm run clean` | Clears the Nx cache. |
| `npm test` | Runs the unit tests. |
| `npm run test:coverage` | Runs the unit tests with the CI coverage settings. |
| `npm run test-ci` | Runs Jest once with the JUnit reporter and coverage. |
| `npm run coverage:jest` | Merges the Jest coverage reports. |
| `npm run coverage:playwright` | Merges the Playwright coverage reports. |
| `npm run lint` | Runs ESLint and Stylelint. |
| `npm run e2e-tests` | Runs Playwright. It starts the emulators and the app at [http://127.0.0.1:4300](http://127.0.0.1:4300) when they are not already running. Install the browser once with `npx playwright install chromium`. |
| `npm run compodoc` | Builds the Compodoc site, including the Nx graph, into `documentation/`. |
| `npm run compodoc:site` | Builds the Compodoc site without the Nx graph. |
| `npm run compodoc:nx-graph` | Writes the Nx graph into an existing `documentation/` folder. |
| `npm run build-checks` | Runs the cache reset, both test commands, and lint. |

## Layout

- `apps/portfolio-v2` is the Angular site.
- `apps/portfolio-v2-e2e` holds the Playwright tests.
- `functions` holds the Cloud Functions.
- `libs/pages`, `libs/state`, `libs/shared`, and `libs/admin` hold the shared application code.
- `db/baseline` is the sanitized content loaded into the emulators.
- `tools/db` holds the emulator, seed, reset, verify, and snapshot scripts.
