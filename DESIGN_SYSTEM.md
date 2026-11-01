# Amaras Travel Agency — Design System & Brand Identity

> **Mandate:** All current and future pages, components, dashboards, and interactions in this project must adhere strictly to this design system. It fuses the authentic **GetYourGuide Supply layout system** with the **Amaras Travel Agency** brand identity (derived directly from the official SVG vector logomarks) and the elite design standards outlined in the `premium-website` and `high-end-visual-design` global skills.

---

## 1. Official 4-Color Brand Palette

The entire website is built strictly from these **4 core colors**:

| Color Code | Name / Role | Visual Reference | Primary Usage |
| :--- | :--- | :--- | :--- |
| **`#FFFFFF`** | Pure White | Canvas & High Contrast | Light page backgrounds, cards, white typography in dark Hero/Footer, icon accents. |
| **`#312F2F`** | Deep Charcoal | Primary Dark & Core Text | Hero section background, footer background, navbar background, primary headings & body text on white surfaces, text on Lime buttons. |
| **`#586EFF`** | Electric Cobalt Blue | Brand Accent & Interactivity | Secondary action buttons, interactive icons, stats indicators, ticket borders, links, accordion states, focus rings. |
| **`#C7FF32`** | Neon Lime Green | High-Impact Action & Highlights | Primary CTA buttons ("Sell on Amaras", "Become a supplier"), eyebrow tags, video play buttons, notification badges, text selection. |

---

## 2. Component Token Mapping

### Typography & Surfaces
- **Hero & Navbar Background:** `#312F2F` (Deep Charcoal)
- **Footer Background:** `#312F2F` (Deep Charcoal)
- **Light Page Background:** `#FFFFFF` (Pure White)
- **Primary Text on White:** `#312F2F` (Deep Charcoal)
- **Primary Text on Dark/Hero:** `#FFFFFF` (Pure White)
- **Eyebrows & Highlights:** `#C7FF32` (Neon Lime)
- **Accent Text & Links:** `#586EFF` (Electric Cobalt Blue)

### Buttons & Interactive Components
- **Primary Button (`.rebrand-button.primary---md`):**
  - Background: `#C7FF32`
  - Text Color: `#312F2F` (High contrast, bold)
  - Hover: Scale `1.02`, translateY `-2px`, background `#b8f024`, glow `rgba(199, 255, 50, 0.5)`
- **Secondary Button (`.rebrand-button.secondary---md`):**
  - Background: `#586EFF`
  - Text Color: `#FFFFFF`
  - Hover: Scale `1.02`, translateY `-2px`, background `#485de0`, glow `rgba(88, 110, 255, 0.4)`
- **Video Player Overlay:**
  - Play button background: `#C7FF32`
  - Play icon fill: `#312F2F`
  - Progress bar: `#C7FF32`

---

## 3. Brand Assets & Logo Usage

All brand logos are centrally managed in `assets/`:
1. `assets/amaras-logo.svg`: Full official logo featuring the wordmark **AMARAS**, subtitle **TRAVEL AGENCY**, and circular badge **TOUR** in `#586EFF`, `#C7FF32`, and `#312F2F`. Used on white backgrounds.
2. `assets/amaras-logo-white.svg`: Full official logo with pure white typography (`#FFFFFF`, `#586EFF`, `#C7FF32`). Used on the charcoal hero navbar (`.rebrand-nav-bar`) and charcoal footer (`.rebrand-section-footer`).
3. `assets/amaras-logo-mark.svg`: Compact horizontal wordmark **AMARAS** in `#586EFF` and `#C7FF32`. Used for mobile headers, compact badges, or app icons.

---

## 4. Typography & Hierarchy

### Font Families
- **Primary Display & Headings:** `"GYG Sans VF"`, `"Gt Eesti Pro Display"`, `sans-serif`
- **Fallback Stack:** `"Plus Jakarta Sans"`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `sans-serif`
- **Handwritten / Expressive Accents:** `"Caveat"`, `cursive`

### Hierarchy Scale
- **Display 1 (Hero):** 64px–84px, clamp(3.5rem, 6vw, 5.25rem), weight 700, letter-spacing -0.03em, line-height 1.05.
- **Heading 1:** 48px–56px, clamp(2.5rem, 4vw, 3.5rem), weight 700, letter-spacing -0.025em.
- **Heading 2:** 36px–42px, clamp(2rem, 3vw, 2.625rem), weight 600, letter-spacing -0.02em.
- **Heading 3 (Card Titles):** 24px–28px, weight 600, letter-spacing -0.015em.
- **Body Large:** 18px–20px, line-height 1.6, weight 400/500.
- **Body Regular:** 15px–16px, line-height 1.5, weight 400.
- **Caption / Meta:** 12px–13px, weight 500/600, uppercase with 0.05em tracking.

---

## 5. Strict Development Guardrails

1. [X] Never introduce colors outside the 4 approved brand colors (`#FFFFFF`, `#312F2F`, `#586EFF`, `#C7FF32`).
2. [X] Never distort logo aspect ratios. Always let width or height scale proportionally with `height: auto` or `width: auto`.
3. [X] Never use pure black (`#000000`); always use deep brand charcoal (`#312F2F`).
4. [X] Never use unbranded orange (`#fa4f2d`) or navy (`#0C101D`).
5. [X] Never break responsive touch targets on mobile (< 44px tap area).
6. [X] NEVER use emojis anywhere in the website (no emojis in navigation, menus, headings, buttons, cards, badges, or text).
82: 7. [X] ALWAYS guarantee flawless mobile adaptation and responsiveness: zero horizontal scrolling (`scrollWidth === window.innerWidth`), compact scalable logos, mobile drawer menu with touch-friendly targets (>= 44px), and adaptive grids (desktop 4 cols, tablet 2 cols, mobile 1 col).
