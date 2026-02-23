<p align="center">
  <img src="icons/logo.svg" alt="Impulsion Logo" width="80" height="80">
</p>

<h1 align="center">Impulsion</h1>

<p align="center">
  <strong>Universal Pixel & Tag Debugger for Media Buyers</strong><br>
  Detect, inspect and debug tracking pixels across 10+ ad platforms — directly from your browser.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-6366F1?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/manifest-v3-green?style=flat-square" alt="Manifest V3">
  <img src="https://img.shields.io/badge/build-none_required-blue?style=flat-square" alt="No build step">
  <img src="https://img.shields.io/badge/languages-EN%20%7C%20FR-orange?style=flat-square" alt="EN | FR">
</p>

---

## What is Impulsion?

Impulsion is a Chrome extension built for **media buyers, growth marketers, and web analysts** who need to quickly audit which tracking pixels are firing on any website.

Open the popup on any page and instantly see every detected pixel, its events, payloads, consent status, tech stack, and more — without touching DevTools.

### Key Features

| Feature | Description |
|---|---|
| **Pixel Detection** | Real-time detection of GTM, GA4, Meta (Facebook), TikTok, LinkedIn, Pinterest, Snapchat, X (Twitter), Bing UET & more |
| **Event Inspector** | Chronological event log with full JSON payloads, syntax-highlighted and expandable |
| **Consent Auditor** | Full Google Consent Mode V2 compliance check — basic vs advanced mode, timing analysis, error/warning reports |
| **Ad Libraries** | One-click links to Meta, Google, LinkedIn & TikTok ad transparency portals for the current domain |
| **Tech Stack** | Wappalyzer-style detection of CMS, JS frameworks, CSS libraries, CDN, and third-party services |
| **Dev Tools** | Eye dropper (with color history), font inspector (hover overlay), cookie & cache cleaner |
| **Dark / Light mode** | Full theme support, dark by default |
| **Bilingual** | English & French, auto-detected from browser language |

### Supported Platforms

<table>
  <tr>
    <td align="center">Google Tag Manager</td>
    <td align="center">Google Analytics 4</td>
    <td align="center">Meta (Facebook)</td>
    <td align="center">TikTok</td>
    <td align="center">LinkedIn</td>
  </tr>
  <tr>
    <td align="center">Pinterest</td>
    <td align="center">Snapchat</td>
    <td align="center">X (Twitter)</td>
    <td align="center">Bing UET</td>
    <td align="center">Google Ads</td>
  </tr>
</table>

---

## How It Works

Impulsion uses a **triple-layer detection system** to catch every tracking pixel, even those loaded dynamically or via tag managers:

1. **JS Interceptor** — Injected into the page's main world at `document_start`, it traps global variables (`fbq`, `gtag`, `ttq`, etc.) *before* any tracking library loads, capturing every function call and its arguments in real-time.

2. **DOM Scanner** — Scans all `<script>` and `<noscript>` tags for known pixel patterns. Runs at page load and again after 3 seconds to catch late-loaded scripts.

3. **Network Monitor** — Listens to outgoing requests to known tracking domains via `chrome.webRequest`, catching pixels that bypass JavaScript entirely (e.g. noscript image beacons).

All three layers feed into a unified state store, giving you a complete picture in a single popup.

---

## Installation

> Impulsion is not yet on the Chrome Web Store. You can install it manually as an unpacked extension.

### Step 1 — Download the source

**Option A: Clone the repo**

```bash
git clone https://github.com/sebastien-collab/impulsion.git
```

**Option B: Download as ZIP**

Click the green **Code** button at the top of this page → **Download ZIP**, then unzip the folder.

### Step 2 — Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `impulsion` folder (the one containing `manifest.json`)
5. The Impulsion icon appears in your toolbar — you're ready to go!

> **Tip:** Pin the extension to your toolbar for quick access (click the puzzle icon → pin Impulsion).

### Updating

Pull the latest changes and reload:

```bash
cd impulsion
git pull
```

Then go to `chrome://extensions/` and click the **reload** button (↻) on the Impulsion card.

---

## Usage

1. Navigate to any website
2. Click the **Impulsion** icon in your toolbar
3. Browse the 5 tabs:
   - **Pixels** — See all detected tracking pixels and their events
   - **Consent** — Audit Google Consent Mode V2 compliance
   - **Ad Libraries** — Jump to ad transparency portals
   - **Stack** — Discover the site's tech stack
   - **Tools** — Pick colors, inspect fonts, clear cookies

The badge on the extension icon shows the number of detected pixels on the current page.

---

## Privacy

Impulsion is **100% local and privacy-first**:

- Zero external network requests — all detection happens in your browser
- No data collection, no analytics, no telemetry
- All pixel data is stored in session storage and cleared when the tab is closed
- Only your preferences (theme, language, color history) are persisted locally

---

## Tech Stack

- **Vanilla JavaScript** (ES6) — no frameworks, no bundler, no build step
- **Chrome Extensions Manifest V3**
- **Pure CSS** with custom properties for theming
- **Chrome APIs**: `webRequest`, `scripting`, `storage`, `cookies`, `browsingData`

---

## Project Structure

```
impulsion/
├── manifest.json           # Extension manifest (MV3)
├── background/
│   └── service-worker.js   # Network monitoring, state management, badge
├── content/
│   ├── content.js          # DOM scanner (isolated world)
│   └── injected.js         # JS interceptor (main world)
├── popup/
│   ├── popup.html          # 5-tab popup UI
│   ├── popup.css           # Dark/light theme styles
│   └── popup.js            # All popup logic
├── shared/
│   ├── pixels.js           # Platform definitions
│   ├── techstack.js        # Tech stack signatures
│   ├── i18n.js             # EN/FR translations
│   └── icons.js            # SVG icon library
├── icons/                  # Extension icons & logo
└── store/                  # Web Store descriptions & privacy policy
```

---

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

---

## License

This project is currently unlicensed. All rights reserved.

---

<p align="center">
  Built for media buyers who want to see what's really firing. 🎯
</p>
