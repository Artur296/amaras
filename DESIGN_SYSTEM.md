# Amaras Travel Agency — Design System & Brand Identity

> **Mandate:** All current and future pages, components, dashboards, and interactions in this project must adhere strictly to this design system. It fuses the authentic **GetYourGuide Supply layout system** with the **Amaras Travel Agency** brand identity (derived directly from the official SVG vector logomarks) and the elite design standards outlined in the `premium-website` and `high-end-visual-design` global skills.

---

## 1. Core Visual Identity & Brand Philosophy

- **Brand:** Amaras Travel Agency
- **Aesthetic:** Editorial Commerce, Global Modern Tourism, High-Contrast Precision.
- **Personality:** Visionary, vibrant, premium, fluid, and trustworthy.
- **The Golden Rule:** High-contrast typographic headlines, generous macro-whitespace, authentic photography, interactive micro-widgets, and signature **Amaras Lime & Electric Cobalt Blue** accents against dark obsidian backgrounds and crisp white light surfaces.

---

## 2. Official Amaras Brand Color System

Extracted directly from the master vector SVG files (`Слой 1.svg` and `Слой 1-1.svg`):

### Primary Brand Palette
| Token Name | Hex Code | Visual Reference | Usage |
| :--- | :--- | :--- | :--- |
| `--amaras-lime` | `#C7FF32` | Neon Chartreuse / Lime Green | Primary Action CTAs ("Sell on Amaras", "Get started"), active badges, key stats, interactive highlights |
| `--amaras-lime-hover` | `#b8f024` | Slightly deeper neon lime | Hover & active state for primary lime buttons |
| `--amaras-lime-glow` | `rgba(199, 255, 50, 0.4)` | Lime aura | High-end button glows and focus rings |
| `--amaras-blue` | `#586EFF` | Electric Cobalt / Royal Blue | Secondary buttons, hero badge backgrounds, icon accents, ticket card borders |
| `--amaras-blue-hover` | `#485de0` | Deep cobalt | Hover state for cobalt buttons |
| `--amaras-blue-glow` | `rgba(88, 110, 255, 0.4)` | Cobalt aura | High-end button glows and elevation shadows |
| `--amaras-dark` | `#0C101D` | Midnight Obsidian / Dark Navy | Hero section background, dark mode cards, footer surface |
| `--amaras-charcoal` | `#312F2F` | Deep Charcoal | Primary logo typography, high-contrast dark text |

### Neutral & Surface Palettes
| Token Name | Hex Code | Usage |
| :--- | :--- | :--- |
| `--surface-canvas` | `#FFFFFF` | Primary light section backgrounds |
| `--surface-muted` | `#F8F9FB` | Alternating section backgrounds, bento card trays |
| `--surface-subtle` | `#EEF2FF` | Soft cobalt tint inputs, interactive tab tracks |
| `--border-grey` | `#E3E6EC` | Hairline dividers, subtle card borders |
| `--text-primary` | `#0C101D` | Headings, high-emphasis copy |
| `--text-secondary` | `#5A6275` | Body descriptions, subtitles, metadata |
| `--text-muted` | `#8C92A4` | Footnotes, placeholders, disabled states |

---

## 3. Brand Assets & Logo Usage

All brand logos are centrally managed in `assets/`:
1. `assets/amaras-logo.svg`: Full official logo featuring the wordmark **AMARAS**, subtitle **TRAVEL AGENCY**, and circular badge **TOUR**. Used on light backgrounds.
2. `assets/amaras-logo-white.svg`: Full official logo with pure white typography. Used on the obsidian hero navbar (`.rebrand-nav-bar`) and dark footer (`.rebrand-section-footer`).
3. `assets/amaras-logo-mark.svg`: Compact horizontal wordmark **AMARAS**. Used for mobile headers, compact badges, or app icons.

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

## 5. Component Patterns & Interactive Physics

### Primary Button ("Sell on Amaras")
- Background: `#C7FF32` (Neon Lime)
- Color: `#111625` (High-contrast dark charcoal)
- Padding: `14px 28px`
- Border-radius: `9999px` (Full pill shape)
- Shadow: `0 8px 24px rgba(199, 255, 50, 0.4)`
- Hover: Scale `1.02`, translateY `-2px`, box-shadow `0 12px 30px rgba(199, 255, 50, 0.5)`

### Secondary Button
- Background: `#586EFF` (Cobalt Blue)
- Color: `#FFFFFF`
- Padding: `14px 28px`
- Border-radius: `9999px`
- Shadow: `0 6px 20px rgba(88, 110, 255, 0.4)`

### Concentric Double-Bezel Containers
Every major feature card or bento cell uses concentric radii:
- Outer wrapper: `border-radius: 28px; padding: 12px; background: #f8f9fb; border: 1px solid #e3e6ec;`
- Inner container: `border-radius: 20px; background: #ffffff;`

---

## 6. Strict Development Guardrails

1. ❌ Never use generic unbranded orange `#fa4f2d` — always use Amaras Lime `#C7FF32` or Cobalt Blue `#586EFF`.
2. ❌ Never distort logo aspect ratios. Always let width or height scale proportionally with `height: auto` or `width: auto`.
3. ❌ Never use raw `#000000` text; always use deep brand midnight `#0C101D` or charcoal `#312F2F`.
4. ❌ Never remove Subresource Integrity without local file verification.
5. ❌ Never break responsive touch targets on mobile (< 44px tap area).
