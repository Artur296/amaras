# Amaras (GetYourGuide Supply Style)

High-converting, responsive web experience inspired by and cloned from [getyourguide.supply](https://getyourguide.supply/). Engineered with authentic design tokens, high visual hierarchy, bespoke typography, and smooth micro-interactions.

---

## 🌟 Key Features

- **Pixel-Perfect Clone of GetYourGuide Supply:**
  - Hero Section with interactive earnings calculator (`$5,232/month` offer by country)
  - Interactive rotating activity badges (`workshop`, `tour`, `experience`, `activity`)
  - Trust & Social Proof statistics (`4.8★`, `#1 app`, `200k+ activities`, `37 languages`)
  - Multi-slide Video Testimonials carousel with synchronized partner quotes
  - Asymmetric Bento Grid showcasing platform benefits
  - Infinite Marquee showing 250+ connectivity partners (Bokun, Bookingkit, Fareharbor, etc.)
  - 3-Step Onboarding Walkthrough
  - Animated Accordion FAQ with smooth CSS grid transitions
  - Mega-menu overlay navigation with mobile drawer
- **Aesthetic & Design Engineering System:**
  - Strict adherence to `DESIGN_SYSTEM.md`
  - GetYourGuide brand palette: `#fa4f2d` (Guiding Red), `#132338` (Midnight Blue)
  - Lenis smooth scrolling & GSAP animations
  - Double-bezel container architecture (nested concentric shells)
  - Responsive mobile collapse for all viewports

---

## 🚀 How to Run Locally

You can run the project locally with any static server:

```bash
# Using npm
npm start
# or
npm run dev
```

Then open `http://localhost:3000` in your browser.

Or simply open `index.html` directly in any web browser.

---

## 📐 Design System & Future Development

All future pages, components, dashboards, and additions in this project must strictly comply with [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).

---

## 📂 Project Structure

```
AMARAS WEBSITE/
├── css/
│   ├── gyg-style.css    # Complete Webflow / GetYourGuide stylesheet & fonts
│   └── custom.css       # Bespoke micro-interactions & enhancements
├── js/                  # Modular interactive scripts & plugins
├── assets/              # Static media & icons
├── DESIGN_SYSTEM.md     # Single Source of Truth for design rules & tokens
├── index.html           # Main landing page
├── package.json         # Scripts & metadata
└── README.md            # Documentation
```
