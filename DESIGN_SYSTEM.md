# Design System & Style Guide: GetYourGuide Supply Aesthetic

> **Mandate:** All current and future pages, components, dashboards, and interactions in this project must adhere strictly to this design system. It combines the authentic **GetYourGuide Supply (Rebrand 2026)** identity with the elite design standards outlined in the `premium-website` and `high-end-visual-design` global skills.

---

## 1. Core Visual Identity & Tone

- **Aesthetic:** Editorial Commerce & Global Travel Marketplace.
- **Personality:** Confident, human, high-converting, clean, fluid, and trustworthy.
- **The Golden Rule:** High-contrast typographic headlines, generous macro-whitespace, authentic photography, interactive micro-widgets, and signature **GetYourGuide Guiding Red/Orange** accents.

---

## 2. Color Tokens

### Primary & Accent Colors
| Token Name | Hex Code | Usage |
| :--- | :--- | :--- |
| `--guiding-red` (Brand Emphasis) | `#fa4f2d` | Primary CTAs, active badges, highlights, key metrics |
| `--guiding-red-hover` | `#e03f1f` | Hover state for primary buttons |
| `--guiding-red-light` | `rgba(250, 79, 45, 0.08)` | Subtle tag backgrounds, active item fills |
| `--midnight-blue` (Deep Navy) | `#132338` | Primary display text, hero dark surfaces, high-contrast badges |
| `--navy-secondary` | `#1a2b49` | Secondary cards, headers, borders |

### Surface & Neutral Colors
| Token Name | Hex Code | Usage |
| :--- | :--- | :--- |
| `--surface-canvas` | `#ffffff` | Primary page background |
| `--surface-muted` | `#f8f9fb` | Section alternate backgrounds, bento card trays |
| `--surface-subtle` | `#f1f3f7` | Inputs, interactive tab tracks |
| `--border-grey` | `#e3e6ec` | Hairline borders, dividers |
| `--text-primary` | `#132338` | Headings, high-emphasis copy |
| `--text-secondary` | `#63687a` | Body descriptions, subtitles, metadata |
| `--text-muted` | `#8c92a4` | Footnotes, placeholders, disabled states |

### Accent Palettes (Categories & Badges)
- `--plant-green`: `#a1d55d` (Positive growth, earnings badges)
- `--poolside-blue`: `#81beff` (Informational tags, oceanic experiences)
- `--paradise-pink`: `#f4cdd7` (Festive, cultural badges)

---

## 3. Typography & Hierarchy

### Font Families
- **Primary Display & Headings:** `"GYG Sans VF"`, `"Gt Eesti Pro Display"`, `sans-serif`
- **Fallback Stack:** `"Plus Jakarta Sans"`, `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `sans-serif`
- **Handwritten / Expressive Accents:** `"Caveat"`, `cursive`

### Fluid Type Scale
- **Hero Display H1:** `clamp(2.75rem, 5.5vw, 5rem)` — `font-weight: 700`, `line-height: 0.95`, `letter-spacing: -0.03em`
- **Section Heading H2:** `clamp(2rem, 3.5vw, 3rem)` — `font-weight: 700`, `line-height: 1.05`, `letter-spacing: -0.02em`
- **Subheading H3:** `clamp(1.5rem, 2.2vw, 2rem)` — `font-weight: 600`, `line-height: 1.15`
- **Card Title H4:** `1.25rem - 1.5rem` — `font-weight: 600`, `line-height: 1.25`
- **Body Large:** `1.125rem (18px)` — `line-height: 1.6`
- **Body Base:** `1rem (16px)` — `line-height: 1.6`
- **Caption / Metadata:** `0.875rem (14px)` — `line-height: 1.5`
- **Eyebrow Badges:** `0.75rem (12px)` — `font-weight: 600`, `text-transform: uppercase`, `letter-spacing: 0.15em`

---

## 4. Component Patterns & UI Architecture

### A. CTA & Action Buttons
- **Shape:** Fully rounded pill (`border-radius: 9999px` or `50px`).
- **Primary CTA:**
  - Background: `#fa4f2d`
  - Text: `#ffffff`
  - Padding: `14px 28px` (desktop), `12px 24px` (mobile)
  - Hover: `transform: translateY(-2px) scale(1.01)`, shadow `0 10px 25px -5px rgba(250, 79, 45, 0.35)`
  - Active: `transform: translateY(0) scale(0.98)`
- **Secondary CTA:**
  - Background: Transparent or `rgba(255, 255, 255, 0.1)` on dark / `#ffffff` with subtle border on light.
  - Text: High-contrast primary.
- **Button-in-Button Trailing Icon:** When an arrow icon (`↗` or `→`) is included, it is enclosed in an inner circular badge with subtle opacity.

### B. Double-Bezel Card System (Doppelrand)
Every major feature card, bento cell, or preview widget uses concentric nested boundaries:
1. **Outer Shell / Tray:**
   - Background: `var(--surface-muted)` (`#f8f9fb`)
   - Border: `1px solid var(--border-grey)` (`#e3e6ec`)
   - Radius: `24px` to `32px` (`rounded-[2rem]`)
   - Padding: `8px` to `16px`
2. **Inner Content Box:**
   - Background: `#ffffff`
   - Radius: `calc(outer-radius - padding)` (e.g. `16px` to `24px`)
   - Shadow: `0 4px 20px rgba(19, 35, 56, 0.04)`

### C. Bento Grid Layouts
- Asymmetrical masonry layout: high-priority items take 2 columns or larger heights.
- Generous gap: `gap-6` (`24px`) to `gap-8` (`32px`).
- Mobile collapse: single column stack (`grid-cols-1`) with `gap-6`.

### D. Interactive Widgets
- **Live Revenue Calculator:** Interactive country/city select updating monthly estimated earnings with localized currency symbols.
- **Video Carousel:** Multi-slide testimonial rail with integrated Vimeo/HTML5 video players and synchronized quotes.
- **Marquee Logos:** Seamless infinite horizontal loop of partner logos with hover-to-pause capability.
- **Smooth FAQ Accordion:** Animated CSS grid rows (`grid-template-rows: 0fr -> 1fr`) with custom cubic-bezier transitions.

---

## 5. Motion Choreography & Transitions

- **Default Easing:** `cubic-bezier(0.32, 0.72, 0, 1)` (mass and spring physics).
- **Smooth Scrolling:** Powered by **Lenis** (`new Lenis()`) with GSAP ScrollTrigger synchronization.
- **3D Hero Tilt:** Interactive mouse move parallax with gyro fallback on mobile.
- **Never Use:** Generic `linear` or snappy instant transitions. Always use hardware-accelerated `transform` and `opacity`.

---

## 6. Strict Anti-Patterns (Do NOT use)

1. ❌ Never use generic Bootstrap-style 3-column feature boxes.
2. ❌ Never use neon AI gradients (purple-pink meshes) or glowing sci-fi orbs.
3. ❌ Never use pure `#000000` text; always use deep brand midnight blue (`#132338`).
4. ❌ Never place flat borders without inner padding or concentric radius.
5. ❌ Never break responsive touch targets on mobile (< 44px tap area).
