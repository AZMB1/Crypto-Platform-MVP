# Design Philosophy

**Purpose:** Typography-forward design principles and UI/UX guidelines for consistent, premium interface  
**Last Updated:** November 15, 2025

---

## 📑 TABLE OF CONTENTS

| Section | Lines | Topic |
|---------|-------|-------|
| [Core Principle](#core-design-principle) | 20-25 | Typography-forward approach |
| [Typography System](#typography-system) | 30-110 | Fonts, scale, weights |
| [Color System](#color-system) | 115-155 | Palette and semantic colors |
| [Layout Principles](#layout-principles) | 160-190 | Spacing, grid, breakpoints |
| [Component Patterns](#component-design-patterns) | 195-280 | Buttons, cards, forms, tables, charts |
| [Animation & Transitions](#animation--transitions) | 285-310 | Motion and timing |
| [Iconography](#iconography) | 315-325 | Icon style and usage |
| [Dark Mode](#dark-mode) | 330-345 | Dark mode implementation |
| [Accessibility](#accessibility) | 350-364 | WCAG compliance |

---

## Core Design Principle

**Typography-Forward:** Text is the primary interface element. Every font choice, weight, size, and spacing decision drives hierarchy, clarity, and emotional resonance. UI components serve the type; type doesn't serve the UI.

---

## Typography System

### Font Families

**Primary (Body & Interface):**
- **Sans-serif:** Inter, SF Pro, or Geist
- **Usage:** All body text, buttons, labels, navigation
- **Why:** Clean, highly legible, professional, excellent at small sizes

**Secondary (Display & Headers):**
- **Sans-serif (Display):** Inter Display, Helvetica Neue, or custom geometric sans
- **Usage:** Hero headlines, section titles, large numbers
- **Why:** Strong presence, modern, pairs well with data-heavy interfaces

**Monospace (Data & Code):**
- **Mono:** JetBrains Mono, Fira Code, or SF Mono
- **Usage:** Prices, timestamps, code snippets, technical data
- **Why:** Tabular alignment, precise readability

---

### Type Scale

```
Display XL:  72px / 4.5rem    — Hero headlines (landing page only)
Display L:   56px / 3.5rem    — Major section headers
Display M:   48px / 3rem      — Page titles
Heading 1:   40px / 2.5rem    — Primary headings
Heading 2:   32px / 2rem      — Secondary headings
Heading 3:   24px / 1.5rem    — Tertiary headings
Heading 4:   20px / 1.25rem   — Sub-sections
Body L:      18px / 1.125rem  — Large body text, featured content
Body M:      16px / 1rem      — Default body text (most common)
Body S:      14px / 0.875rem  — Secondary information, captions
Label:       12px / 0.75rem   — Labels, metadata, micro-copy
Tiny:        10px / 0.625rem  — Fine print, legal disclaimers
```

**Line Heights:**
- Headings: 1.2 (tight, impactful)
- Body text: 1.6 (comfortable reading)
- Data/numbers: 1.4 (balanced density)

**Letter Spacing:**
- Headings: -0.02em (tighter, modern)
- Body: 0 (default)
- Uppercase labels: 0.05em (improved readability)

---

### Font Weights

```
Thin:       100  — Sparingly (large display only)
Light:      300  — Subtle emphasis, secondary text
Regular:    400  — Body text default
Medium:     500  — Slightly emphasized text, nav items
Semibold:   600  — Buttons, strong emphasis, sub-headers
Bold:       700  — Headings, primary CTAs
Black:      900  — Hero numbers, extreme emphasis (rare)
```

**Weight Pairing:**
- Display headlines: Semibold (600) or Bold (700)
- Body text: Regular (400)
- Buttons: Medium (500) or Semibold (600)
- Labels: Medium (500)
- Data values: Semibold (600) or Mono Regular (400)

---

## Color System

### Palette Philosophy
- **Minimal Color:** Let type and data shine. Use color sparingly for hierarchy and status.
- **High Contrast:** Ensure WCAG AAA compliance for text (7:1 ratio minimum).
- **Neutral Foundation:** Most interface elements are grayscale.

### Core Palette

**Neutrals (Typography & Backgrounds):**
```
Gray 950:  #0A0A0A   — Primary text (dark mode)
Gray 900:  #171717   — Background (dark mode)
Gray 800:  #262626   — Cards, panels (dark mode)
Gray 700:  #404040   — Borders (dark mode)
Gray 600:  #525252   — Muted text (dark mode)
Gray 500:  #737373   — Placeholder text
Gray 400:  #A3A3A3   — Disabled text
Gray 300:  #D4D4D4   — Borders (light mode)
Gray 200:  #E5E5E5   — Cards (light mode)
Gray 100:  #F5F5F5   — Background (light mode)
Gray 50:   #FAFAFA   — Off-white (light mode)
White:     #FFFFFF   — Primary text (light mode)
```

**Accent (Sparingly Used):**
```
Blue 600:  #2563EB   — Primary actions, links
Blue 500:  #3B82F6   — Hover states
Blue 700:  #1D4ED8   — Active states
```

**Semantic (Status & Alerts):**
```
Green 600: #16A34A   — Bullish, success, up
Red 600:   #DC2626   — Bearish, error, down
Yellow 600:#CA8A04   — Warning, neutral
```

---

## Layout Principles

### Spacing System (8px Grid)

```
0:    0px
1:    4px
2:    8px
3:    12px
4:    16px
5:    20px
6:    24px
8:    32px
10:   40px
12:   48px
16:   64px
20:   80px
24:   96px
32:   128px
```

**Application:**
- Inline spacing (padding, margin): Multiples of 4px
- Component spacing: Multiples of 8px
- Section spacing: Multiples of 16px

### Responsive Breakpoints

```
xs:  0px     — Mobile (default)
sm:  640px   — Tablet portrait
md:  768px   — Tablet landscape
lg:  1024px  — Desktop
xl:  1280px  — Large desktop
2xl: 1536px  — Extra-large desktop
```

**Strategy:** Desktop-first design for MVP (financial professionals), ensure mobile-friendly.

---

## Component Design Patterns

### Buttons

**Primary CTA:**
- Background: Blue 600
- Text: White, Semibold (600), Body M (16px)
- Padding: 12px 24px
- Border-radius: 8px
- Hover: Blue 500, slight scale (1.02)

**Secondary:**
- Border: 1px Gray 700
- Text: Gray 950 (light mode) / White (dark mode), Medium (500)
- Background: Transparent
- Hover: Gray 200 (light) / Gray 800 (dark)

**Ghost:**
- No border, no background
- Text: Blue 600, Medium (500)
- Hover: Underline

---

### Cards & Panels

**Style:**
- Background: Gray 50 (light) / Gray 800 (dark)
- Border: 1px Gray 300 (light) / Gray 700 (dark)
- Border-radius: 12px
- Padding: 24px
- Shadow: Subtle (0 1px 3px rgba(0,0,0,0.1))

**Glass Effect (Featured Sections):**
- Background: rgba(255,255,255,0.1) with backdrop blur
- Border: 1px rgba(255,255,255,0.2)
- Creates depth without heavy shadows

---

### Data Presentation

**Prices & Numbers:**
- Font: Monospace (JetBrains Mono)
- Size: Body L (18px) or Heading 4 (20px)
- Weight: Regular (400) or Semibold (600)
- Color: Green (up) / Red (down) / Gray (neutral)
- Alignment: Right-aligned in tables

**Tables:**
- Header: Gray 600, Label size (12px), Semibold (600), Uppercase, 0.05em tracking
- Row padding: 12px vertical
- Borders: 1px Gray 300/700 (subtle)
- Hover: Gray 100 (light) / Gray 750 (dark) background
- Striped rows: Optional for dense data

---

### Forms & Inputs

**Text Input:**
- Border: 1px Gray 300 (light) / Gray 700 (dark)
- Border-radius: 8px
- Padding: 10px 12px
- Font: Body M (16px), Regular (400)
- Focus: Blue 600 border, subtle shadow

**Labels:**
- Font: Body S (14px), Medium (500)
- Color: Gray 700 (light) / Gray 300 (dark)
- Margin-bottom: 8px

**Error State:**
- Border: Red 600
- Error text: Body S (14px), Red 600

---

### Charts

**Style:**
- Clean axis labels (Body S, Gray 600)
- Gridlines: 1px Gray 300/700 (very subtle, 0.3 opacity)
- Candlesticks: Green (bullish) / Red (bearish)
- Volume bars: Gray 400, lower opacity
- Indicators: Blue 600, Yellow 600 (secondary)

---

## Animation & Transitions

**Philosophy:** Subtle, purposeful motion. Never distract from data.

**Standard Transitions:**
- Duration: 150ms (fast), 300ms (standard), 500ms (slow)
- Easing: ease-in-out (most cases), ease-out (entrances)

**Common Animations:**
- Button hover: Scale 1.02, 150ms
- Card hover: Shadow increase, 200ms
- Modal entrance: Fade + scale (0.95 → 1), 300ms
- Page transitions: Fade, 200ms
- Loading: Skeleton shimmer or subtle spinner

**Avoid:**
- Excessive bounce
- Long durations (>500ms)
- Janky scrolling animations

---

## Iconography

**Style:** Line icons, 1.5px stroke weight (matches type weight)

**Size:**
- Small: 16px (inline with Body S)
- Medium: 20px (inline with Body M)
- Large: 24px (inline with Heading 4)

**Library:** Lucide, Heroicons, or custom SVGs

**Usage:** Pair with text labels (never icon-only unless universally understood)

---

## Dark Mode

**Default Mode:** Dark (financial traders prefer dark interfaces)

**Implementation:**
- Use CSS variables for colors
- Provide toggle in user settings
- Persist preference in localStorage
- Respect system preference (prefers-color-scheme)

**Dark Mode Adjustments:**
- Reduce pure black (#000) to Gray 900 (#171717) to prevent eye strain
- Lower opacity of shadows (less visible on dark)
- Slightly reduce text contrast (85% opacity for body text)

---

## Accessibility

**Requirements:**
- WCAG 2.1 Level AA minimum (AAA preferred)
- Keyboard navigation for all interactive elements
- Focus indicators (2px Blue 600 outline)
- Aria labels for screen readers
- Sufficient color contrast (7:1 for text)
- Responsive text scaling (support up to 200% zoom)

**Testing:**
- Lighthouse accessibility audit (score >95)
- NVDA/JAWS screen reader testing
- Keyboard-only navigation testing

---

## Inspiration References

**Typography Excellence:**
- Linear.app (clean, modern sans-serif, excellent hierarchy)
- Stripe.com (readable, professional, data-focused)
- Notion.so (flexible type system, clear hierarchy)

**Financial Dashboards:**
- TradingView (data density, readable charts)
- Bloomberg Terminal (information hierarchy)
- Robinhood (simplified, modern)

**Glass/Modern UI:**
- Apple.com (product pages, depth through blur)
- Vercel.com (subtle gradients, clean type)

---

## Design Checklist

Before shipping any UI:
- [ ] Typography hierarchy is clear (3+ levels visible)
- [ ] Font sizes follow type scale exactly
- [ ] Line heights are appropriate (1.6 for body, 1.2 for headings)
- [ ] Spacing follows 8px grid system
- [ ] Color contrast meets WCAG AAA (7:1)
- [ ] Interactive elements have hover/focus states
- [ ] Animations are subtle and purposeful (<300ms)
- [ ] Mobile breakpoints tested (responsive)
- [ ] Dark mode variant implemented
- [ ] Keyboard navigation works
- [ ] Screen reader labels present

---

**Key Takeaway:** Type is the interface. Make it legible, hierarchical, and beautiful. Everything else supports it.

