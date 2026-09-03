# UAV Fleet Digital Twin — Figma Design Spec

**Project:** AI-Enabled Digital Twin for MALE UAV Piston Engine Health Monitoring
**Client type:** Government / Defence & Private Fleet Operators
**Style:** Military-grade classified ops console — dark, tactical, data-dense

---

## 1. Visual Language

### 1.1 Theme
"Classified terminal" aesthetic — like a mission control / SCADA system, not a consumer SaaS app.

### 1.2 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `bg-primary` | `#0A0B0D` | Base canvas background |
| `bg-surface` | `#111318` | Panel / card background |
| `bg-surface-raised` | `#181B21` | Elevated cards, modals |
| `border-hairline` | `#242832` | Panel dividers, grid lines |
| `text-primary` | `#E4E7EB` | Primary text |
| `text-secondary` | `#8B92A0` | Labels, metadata |
| `text-muted` | `#4E5566` | Disabled / tertiary |
| `accent-green` | `#39FF88` | Nominal / healthy status, primary CTA |
| `accent-green-dim` | `#1C7A45` | Green at low opacity for fills/glow |
| `accent-red` | `#FF3B3B` | Critical / fault status |
| `accent-red-dim` | `#7A1C1C` | Red fills/glow |
| `accent-amber` | `#FFB13B` | Warning / degraded status (3rd state) |
| `scanline-overlay` | `#39FF88` @ 3% | Optional subtle texture on hero panels |

Status color mapping (used everywhere — fleet cards, part health, alerts):
- **Green** = Nominal (health ≥ 85%)
- **Amber** = Advisory / degraded (health 60–84%)
- **Red** = Critical (health < 60%)

### 1.3 Typography
- **Headings / data readouts:** Monospace, e.g. `JetBrains Mono` or `IBM Plex Mono` — reinforces "terminal" feel
- **Body / UI labels:** Grotesk sans, e.g. `Inter` or `IBM Plex Sans` — for legibility in dense panels
- Use uppercase + letterspacing (0.05–0.1em) for section headers and status tags, mono numerals for all telemetry values

### 1.4 Texture & Motifs
- Thin 1px hairline borders on every panel (`border-hairline`)
- Corner brackets (`⌐ ¬` style tactical HUD corners) on key panels — optional but reinforces military feel
- Subtle scanline/grid texture on background, very low opacity
- Status glow: green/red/amber elements get a subtle outer glow (box-shadow blur) rather than flat fill
- Classification banner strip (cosmetic): thin top bar reading "FLEET OPS // RESTRICTED ACCESS" in mono caps

---

## 2. Information Architecture / Routes

```
/                          → redirects to /fleet
/fleet                     → Fleet Dashboard (default landing page)
/fleet/add                 → Add Engine modal or route
/fleet/:fleetId            → Single fleet view (if orgs manage multiple fleets)
/engine/:engineId          → Engine Blueprint View
/engine/:engineId/part/:partId   → Expanded part / sub-component health view
/alerts                    → Full notifications/alerts log (right panel "see all")
/reports                   → Mission-wise health reports, replay
/settings                  → Org, users, thresholds config
/login                     → Auth
```

Routing notes for Figma:
- Design each route as a separate Frame/Page in Figma named to match the path (e.g. `fleet`, `engine-blueprint`, `part-detail`)
- Left rail and right rail are persistent across `/fleet*` and `/engine*` routes — build as a Figma Component so it's reusable across frames
- Only the center content region swaps between routes

---

## 3. Global Layout Shell

Three-column persistent shell, used on Fleet and Engine views:

```
┌─────────────────────────────────────────────────────────────┐
│  TOP BAR: Logo/Org name · classification strip · user menu   │
├───────────┬───────────────────────────────┬──────────────────┤
│           │                               │                  │
│  LEFT     │        CENTER                 │   RIGHT          │
│  RAIL     │        CONTENT                │   RAIL           │
│  (~220px) │        (fluid)                │   (~300px)       │
│           │                               │                  │
│  Controls │  Fleet grid / Engine blueprint│  Notifications/  │
│  Fleet    │                               │  Alerts          │
│  summary  │                               │                  │
│           │                               │                  │
└───────────┴───────────────────────────────┴──────────────────┘
```

Suggested frame width: 1440px desktop. Also design a 1024px tablet breakpoint minimum (collapse rails into drawers).

### 3.1 Left Rail — Controls & Fleet Summary
Persistent, contains:
- **Primary CTA:** `+ ADD ENGINE` button (accent-green, prominent)
- **Fleet health summary widget:** aggregate ring/gauge showing % of fleet nominal/degraded/critical, small counts (e.g. "18 Nominal · 3 Advisory · 1 Critical")
- **Navigation list:** Fleet / Reports / Alerts / Settings (icon + label, mono caps)
- **Filter controls:** filter fleet grid by status, engine type, base/location
- Org/unit selector at top if multi-fleet (dropdown)

### 3.2 Center — Fleet Dashboard (default `/fleet` view)
- Header row: fleet name, total engine count, last sync timestamp
- **Engine grid/list** — each item is a card:
  - Engine ID / tail number
  - Thumbnail/icon of engine or UAV silhouette
  - Overall health score (large mono number, color-coded ring or bar)
  - Key live params inline: RPM, CHT, EGT (small readouts)
  - Status badge (NOMINAL / ADVISORY / CRITICAL)
  - Click → routes to `/engine/:engineId`
- Toggle between grid view and dense table view (nice-to-have)
- Sort/filter bar above grid (by health, status, base)

### 3.3 Right Rail — Notifications & Alerts
Persistent, contains:
- **Section header:** "ACTIVE ALERTS" with count badge
- Alert cards, most critical first, each with:
  - Severity icon/color (red/amber)
  - Engine ID + affected part
  - Short description (e.g. "EGT drift detected — Cyl 3")
  - Timestamp
  - Click → deep-links to `/engine/:id/part/:partId`
- **Maintenance advisory section** below alerts: "Parts requiring inspection/replacement" list
- "View all" link → `/alerts`

---

## 4. Engine Blueprint View (`/engine/:engineId`)

Core interactive screen. Center content replaces fleet grid with:

- **Header:** Engine ID, tail number, overall health score (large), status badge, last telemetry sync
- **Main blueprint canvas:**
  - Technical line-art / schematic illustration of the piston engine (side or exploded view)
  - Major parts marked with numbered pins/markers (1, 2, 3...) — each pin colored per that part's health status
  - Pin numbers correspond to a legend/list beside or below the blueprint
  - Hover pin → tooltip with part name + health %
  - Click pin → expands that part's detail panel (in place, or navigates to `/engine/:id/part/:partId`)
- **Parts legend list** (can live in a slim panel beside the blueprint): scrollable list of all major parts with numbered index, name, health %, status color — mirrors the pins

Major parts to mark (from problem statement — use as the numbered pin list):
1. Cylinder Head
2. Exhaust Gas Path / EGT sensor zone
3. Oil System (pressure/temp)
4. Fuel Injection System
5. Cooling System
6. Vibration/Bearing assembly
7. Battery/Alternator
8. Ignition/Timing system

- **Parameter graphs section** below or in a tab: time-series charts for RPM, CHT, EGT, oil pressure/temp, fuel flow, vibration, battery voltage — small multiples grid, mono-styled axis labels, green/red threshold bands overlaid on each chart
- **Tabs** on this view: `Overview` (blueprint) / `Telemetry` (graphs) / `History & Replay` / `Maintenance Log`

---

## 5. Part Detail / Expanded View (`/engine/:engineId/part/:partId`)

Triggered by clicking a numbered part on the blueprint:
- Breadcrumb: `Engine EX-104 / Cylinder Head`
- Overall part health score, large, color-coded
- **Sub-parts list**: if the part has sub-components, show them as a secondary numbered diagram or nested list, each with its own health score (e.g. Cylinder Head → Valve Assembly, Spark Plug, Head Gasket, Coolant Jacket)
- Relevant parameter graphs scoped to this part only
- Fault history / predicted RUL for this specific component
- Back button returns to full blueprint view with this pin highlighted

This should be built as a **nested/recursive component** in Figma — the same "part card + health + expand" pattern repeats at both engine-level and sub-part level, so design it once as a component with variants (collapsed/expanded, depth-1/depth-2).

---

## 6. Key Reusable Components to Build in Figma

- `StatusBadge` (variants: Nominal / Advisory / Critical)
- `HealthRing` / `HealthBar` (circular or linear gauge, color-coded, mono % label)
- `EngineCard` (fleet grid item)
- `AlertCard` (right rail)
- `BlueprintPin` (numbered marker, variants: default/hover/selected, colored by status)
- `PartRow` (legend list item, and reusable in expanded sub-parts view)
- `ParamGraph` (small-multiple chart card: title, unit, sparkline/line chart, current value, threshold band)
- `NavItem` (left rail)
- `TopBar`
- `Button` (primary/green, secondary/outline, danger/red)

---

## 7. Notes for Frontend Handoff (post-Figma)

- Charts: parameter graphs should be built with a real charting lib (e.g. Recharts) — design static representations in Figma but keep axis/legend structure consistent for dev handoff
- Blueprint pins: coordinate-based overlay on a static SVG/image — Figma should export exact pin (x,y) positions per part for dev to replicate
- All health scores are computed values (0–100%) — Figma should show realistic sample data (mixed green/amber/red) to demonstrate the color system, not all-green happy-path mockups
