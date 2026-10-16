# Zephyr-Startr

> A fast web-based project generator for [Zephyr RTOS](https://www.zephyrproject.org/).

Zephyr-Startr generates minimal, ready-to-compile **West workspace** archives directly in your browser. It configures West manifests, CMake build scripts, Kconfig options, and starter C application source code tailored to your exact hardware board and selected subsystems.

No backend server is required — everything runs entirely client-side and can be hosted statically on **GitHub Pages**.

---

## Key Features

* **Zero-Bloat West Manifests (`name-allowlist`)**:
  Standard Zephyr West manifests often clone dozens of vendor HALs and third-party modules totaling gigabytes of download. Zephyr-Startr generates an allowlisted `west.yml` that only clones the specific HAL for your board (e.g. `hal_nordic`, `hal_stm32`, `hal_espressif`, `hal_rpi_pico`) and only the specific modules you enable (e.g. `mbedtls`, `littlefs`, `lvgl`).
* **1,750+ Verified Hardware Boards**:
  Search and filter across all official Zephyr dev boards and targets (ARM, RISC-V, Xtensa, x86, POSIX Simulator) with instant search, vendor chips, and architecture badges.
* **Online Sync with Resilient Offline Fallback**:
  Queries the latest official Zephyr releases and boards from the GitHub API on load, while bundling an offline database to ensure zero downtime even if GitHub rate limits are reached.
* **Fast, Intuitive UX**:
  * **Interactive Explorer (`Ctrl + Space`)**: View file tree and syntax-highlighted code preview before downloading.
  * **One-Click Generate (`Ctrl + ⏎`)**: Creates and downloads `{projectName}.zip` on the fly using JSZip.
  * **Shareable Links**: Encodes project configurations into the URL for instant sharing and bookmarking.
  * **Application Presets**: Quick templates for Blinky / Status LED, Minimal Hello World, Bluetooth LE, Shell CLI, Sensor Reader, and IoT Network Client.
* **Comprehensive Documentation (`README.md`)**:
  Every generated ZIP includes a detailed, standalone `README.md` with step-by-step instructions for Python virtual environments (`venv`), host preparation for **macOS** (Homebrew) and Linux/Windows, West workspace initialization (`west init -l <app>`), building (`west build -b <board>`), flashing (`west flash`), and serial terminal monitoring.

---

## Project Structure

```
zephyr-startr/
├── public/
│   └── data/
│       ├── boards.json       # 1,755 verified boards dataset
│       ├── modules.json      # 46 embedded subsystems and drivers catalog
│       └── releases.json     # Official Zephyr release tags & LTS markers
├── src/
│   ├── components/
│   │   ├── ActionBar.tsx     # Sticky footer with Generate, Explore, Share, Reset
│   │   ├── ApiTokenModal.tsx # Optional GitHub PAT for 5,000 req/hr rate limits
│   │   ├── BoardModal.tsx    # Searchable modal across 1,750+ boards
│   │   ├── Dependencies.tsx  # Categorized module & subsystem browser
│   │   ├── FileExplorerModal.tsx # File tree & syntax viewer (Ctrl + Space)
│   │   ├── Header.tsx        # Top navbar with live status and doc links
│   │   ├── KconfigEditor.tsx # Interactive Kconfig override editor & raw mode
│   │   ├── ProjectSettings.tsx # Name, Zephyr release, board picker, presets
│   │   └── Toast.tsx         # Notification toast system
│   ├── services/
│   │   ├── generator.ts      # West manifest, CMakeLists, prj.conf, main.c, zip builder
│   │   └── zephyrApi.ts      # Live GitHub API queries with caching and fallback
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces (Board, Module, Release, etc.)
│   ├── utils/
│   │   └── urlState.ts       # URL search params serialization & sharing
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
├── index.html
├── package.json
└── vite.config.ts
```

---

## Getting Started (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev

# 3. Build for production (outputs to dist/)
npm run build

# 4. Preview production build
npm run preview
```

---

## Deploying to GitHub Pages

Because Zephyr-Startr runs 100% client-side without any server requirement, it can be deployed directly to GitHub Pages:

1. **Configure Repository Settings on GitHub**:
   - Navigate to your repository on GitHub.
   - Go to **Settings** → **Pages**.
   - Under **Build and deployment** → **Source**, select **GitHub Actions**.

2. **Automated CI/CD Workflow**:
   - The included workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) automatically triggers on push to `main` or `master`.
   - It runs `npm ci`, verifies code quality with `npm run lint`, builds the production bundle with `npm run build`, and publishes `dist/` directly to GitHub Pages.

3. **Subpath & Custom Domain Compatibility**:
   - In `vite.config.ts`, `base: './'` is configured to resolve all assets relatively, ensuring out-of-the-box compatibility with repository subpaths (`https://<username>.github.io/<repo>/`) as well as custom apex/subdomains.

---

## License

Apache-2.0
