# Shared Design System — For Antigravity Agent

> Drop this file into the project root as `DESIGN.md` (or keep it as the
> project design reference) and tell Antigravity: "Follow this design system
> exactly." Do not invent a new look for each page or each site.

## 0. Agent Instruction — Read This First

You are building or editing a website for PhotoPixc and its sister sites.
Follow this file exactly. If this file and a previous design choice conflict,
this file wins.

Rules that override everything else:

1. Use ONLY the colors, fonts, spacing, and components in this file.
   Never invent a new color, font, button style, or card style.
2. Never copy another brand's colors, logo style, or UI verbatim.
   This system is inspired by clean premium layouts, but the palette below
   is PhotoPixc's own.
3. Content language is English (international US/UK sellers are the audience).
   This instruction file is in English on purpose, so any coding agent reads
   it without ambiguity.
4. Mobile-first. Check the mobile layout first, desktop second.
5. Accessibility is not optional. Every page must pass Section 8 before
   you call the work done.
6. If a design decision is not covered here, use the closest existing
   component. Do not create a one-off style. Ask the human only if no
   existing component fits at all.

Sites this system covers (same tokens, same components, same rules):

- photopixc.com — main agency site
- learn.photopixc.com — learning portal
- audit site — audit / diagnostic pages
- zaynshopbd.com — main site (when built)
- preorder.zaynshopbd.com — preorder site

Note: Third-party hosted shops (for example Fourthwall) do not allow full
theme control. On those platforms, apply these tokens only where the theme
allows. Do not claim full unification there.

## 1. Visual Identity In One Paragraph

Founder-led, premium, proof-driven, not agency-heavy. A seller must
understand in 3 seconds: what the studio does, who it is for, and where the
free audit CTA is. Images and case studies are the hero, decoration is not.
Clean, confident, lots of whitespace. No heavy gradients, no glow, no neon,
no fake urgency (no countdown timers, no fake popups).

## 2. Design Tokens — Copy These Exactly

Use these CSS custom properties. Do not hard-code hex values in components;
always reference a variable.

```css
:root {
  /* Surfaces */
  --color-canvas: #ffffff;
  --color-surface: #f6f9f8;
  --color-blog-surface: #f7f6f3;
  --color-dark: #0b1f33;
  --color-dark-card: #162e44;

  /* Text */
  --color-ink: #102a43;
  --color-muted: #52606d;
  --color-text-on-dark: #ffffff;
  --color-text-on-accent: #ffffff;

  /* Borders */
  --color-border: #d9dee8;

  /* Accent — teal family ONLY */
  --color-accent: #0e7c6b;        /* primary buttons, large accents */
  --color-accent-dark: #0a5c50;   /* small text links, button hover */
  --color-accent-bright: #2ab69e; /* accent ONLY on dark backgrounds */

  /* Highlight — pilot / limited badges ONLY, never a primary CTA */
  --color-highlight: #ffb020;
  --color-text-on-highlight: #102a43;

  /* Feedback */
  --color-success: #0e7c6b;
  --color-warning-text: #8a5a00;
  --color-error: #c0392b;

  /* Type */
  --font-ui: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-blog-heading: Georgia, "Times New Roman", serif;

  /* Shape + spacing (8px base scale) */
  --radius: 8px;
  --radius-card: 12px;
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-6: 48px;
  --space-8: 64px;
  --space-12: 96px;

  /* Layout */
  --max-width-site: 1120px;
  --max-width-reading: 720px;
}
```

### 2.1 Verified Contrast (WCAG AA, normal text needs 4.5:1)

These pairs were calculated and pass AA. Keep them; do not swap them for
lower-contrast combinations:

| Pair | Ratio | Use |
| --- | --- | --- |
| Ink `#102A43` on white | 14.64:1 | Body + headings |
| Muted `#52606D` on white | 6.46:1 | Secondary text, captions |
| Accent Dark `#0A5C50` on white | 7.90:1 | Small text links |
| White on Accent `#0E7C6B` | 5.10:1 | Primary button text |
| Ink `#102A43` on Highlight `#FFB020` | 8.01:1 | Pilot badge text |
| White on Dark `#0B1F33` | 16.69:1 | Dark section text |
| Accent Bright `#2AB69E` on Dark `#0B1F33` | 6.58:1 | Accent on dark only |
| Ink `#37352F` on Blog `#F7F6F3` | 11.35:1 | Blog body (blog ink variant) |

Rule: small text (under 16px) must use Accent Dark, never plain Accent.
Accent Bright must never be used on a light background.

### 2.2 Color Usage Rules

- One primary CTA color per screen: teal Accent. Nothing else competes.
- Highlight amber is a badge only (for example "Pilot offer"). It is never
  a button, never a section background, never a second CTA color.
- Dark sections are for portfolio / case-study showcases only.
  The whole site must never be dark.
- Gradients: only a very light accent line or one corner of a hero.
  Never a full button, never a full section.
- Never use red, orange, and purple together as decoration. Feedback colors
  are for feedback only (success, warning, error states).

## 3. Typography

- UI + sales headings: Inter (with system fallbacks). Weight 700–800,
  tight letter-spacing.
- Blog headings: Georgia serif. This gives long guides an editorial,
  readable feel.
- Never use more than 2 font families on one page.
- Never load heavy custom fonts if they slow the page. System fallbacks
  are acceptable and preferred over a slow font.

| Element | Size | Weight | Line-height |
| --- | --- | --- | --- |
| Hero headline | 40–56px (mobile 32–36px) | 750–800 | 1.15 |
| Section headline | 28–36px | 700 | 1.2 |
| Card headline | 20–22px | 700 | 1.3 |
| Body | 16–18px | 400 | 1.5 (sales), 1.6–1.7 (blog) |
| Caption / meta | 13–14px | 400 | 1.4, Muted color |

- Body text must never be smaller than 16px.
- Paragraph reading width must never exceed about 720px (blog) — long
  lines hurt readability.

## 4. Components — Reuse, Do Not Reinvent

### 4.1 Buttons

```html
<!-- Primary: only one per screen section -->
<a class="btn btn-primary" href="/free-audit">Get my free audit</a>

<!-- Secondary -->
<a class="btn btn-secondary" href="/pricing">See pricing</a>

<!-- Pilot badge (NOT a button) -->
<span class="badge-pilot">Pilot offer — 40% off</span>
```

```css
.btn {
  display: inline-block;
  padding: 12px 20px;
  border-radius: var(--radius);
  font-weight: 600;
  text-decoration: none;
}
.btn-primary {
  background: var(--color-accent);
  color: var(--color-text-on-accent);
}
.btn-primary:hover { background: var(--color-accent-dark); }
.btn-secondary {
  background: var(--color-canvas);
  color: var(--color-ink);
  border: 1px solid var(--color-border);
}
.btn-secondary:hover { border-color: var(--color-ink); }
.badge-pilot {
  background: var(--color-highlight);
  color: var(--color-text-on-highlight);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}
```

Dark-section primary button: background Accent Bright, text Dark
(`#0B1F33`). Never use plain Accent on a dark background.

### 4.2 Cards

- Sales card: white background, 1px Border, 12px radius, no heavy shadow.
- Pricing card: the price is the hero. Show USD clearly, for example
  "from $179". Never hide the price in small text.
- Case-study card: large image on top, metric below. Metric number large,
  metric label in Muted.
- Concept-project card: MUST always show a visible "Concept project"
  label, so fictional work is never mistaken for real client work.

### 4.3 Header / Navigation

- Links: Services, Work / Case Studies, Pricing, Blog, Free Audit.
- Free Audit button is always visible in the header, in Accent.
- Mobile: hamburger menu, tap targets at least 44px, large readable links.

### 4.4 Forms and Audit Tool

```html
<label for="store-url">Shopify store or Amazon ASIN</label>
<input id="store-url" name="store-url" type="text"
       aria-describedby="store-url-hint" />
<p id="store-url-hint">We only use this to run the free check.</p>
```

- Every input has a real `<label>`. A placeholder is never a label.
- Focus state: border becomes Accent. Focus must always be visible.
- On submit, always show a clear success or error message in text.
  Never fail silently. Never show an error by color alone.

### 4.5 Trust Stack (directly under the primary CTA)

Exactly 3 short lines, for example:

- Fixed quote in writing before work starts
- Your ad accounts stay in your name
- Month-to-month, no long contract

Do not bury trust badges in the footer only.

### 4.6 Sticky Mobile CTA

- Slim bottom bar on mobile: short offer + Free Audit button.
- Hidden while the hero CTA is visible; appears on scroll.
- Must never cover form inputs or footer links.

## 5. Layout Rules

- Spacing scale: 8, 16, 24, 32, 48, 64, 96px. No random values.
- Site max-width 1120px. Blog reading max-width 720px.
- Section gap: 64–96px desktop, 48px mobile.
- Hero: one main message, one primary CTA, one secondary link.
  Never 3+ buttons in a hero.
- Homepage section order:
  Hero → Real numbers / proof → Services + pricing → Who it is for /
  who it is not for → How it works → Pilot offer → Concept projects →
  Why PhotoPixc → FAQ → Final CTA.
- Dark sections appear only for portfolio / case studies, alternating
  with light sections.

## 6. Images and Media

- Compress images. Hero image must not exceed 850 KB.
- Critical text must be real HTML text, not text baked into an image.
  If an image contains text, provide the same information as HTML text
  or alt text nearby.
- Informative images: meaningful alt text.
  Decorative images: empty alt (`alt=""`).
- No autoplay audio. Video needs captions or a transcript.
- Respect `prefers-reduced-motion`: reduce or disable animation for users
  who request it. No flashing content.

## 7. What NOT To Do (Hard Bans)

- Do not invent new colors, fonts, or button styles.
- Do not copy Stripe, Framer, Notion, or any other brand's palette verbatim.
- Do not promise guaranteed rankings or guaranteed sales.
- Do not use countdown timers, fake "someone just bought" popups, or
  fake urgency.
- Do not use `user-scalable=no` or disable browser zoom.
- Do not use a `<div>` as a button. Use `<button>` for actions and
  `<a>` for navigation.
- Do not skip heading levels (H2 then H4). Do not use multiple H1s.
- Do not put critical information only in color (for example, error =
  red border only). Always add text and an icon.
- Do not invent client results, stats, or testimonials. Real client work
  keeps real numbers; fictional work is always labeled "Concept project".

## 8. Accessibility Checklist — WCAG 2.2 AA (Required Before Done)

Target: Lighthouse Accessibility 95–100 AND all manual checks below.
A Lighthouse 100 alone does not prove full accessibility.

### 8.1 Contrast and readability

- [ ] Normal text contrast at least 4.5:1, large text at least 3:1.
- [ ] UI components and focus indicators contrast at least 3:1.
- [ ] Body font at least 16px, line-height at least 1.5.
- [ ] Links are distinguishable without color alone (underline or
      clear visual difference).

### 8.2 Structure and keyboard

- [ ] One H1 per page, heading order never skips a level.
- [ ] Semantic landmarks: `<header>`, `<nav>`, `<main>`, `<footer>`.
- [ ] `lang` attribute is correct (for example `lang="en"`).
- [ ] Every interactive element is reachable by Tab, in logical order.
- [ ] Focus indicator is always visible (at least 2px outline, with offset).
- [ ] No keyboard trap. Esc closes menus, dialogs, and modals.
- [ ] "Skip to content" link is present as the first focusable element.

### 8.3 Forms, images, motion, touch

- [ ] Every form field has a label and an accessible error message.
- [ ] Required fields are marked in text, not color only.
- [ ] Images have correct alt text (meaningful, or empty if decorative).
- [ ] No content flashes more than 3 times per second.
- [ ] `prefers-reduced-motion` is respected.
- [ ] Touch targets at least 24×24px (target 44×44px).
- [ ] Page reflows at 320px width and at 200% zoom without horizontal scroll.

### 8.4 How to test (run these before finishing)

1. Lighthouse (Chrome DevTools) → Accessibility audit.
2. axe DevTools extension → scan the page, fix all critical + serious issues.
3. Keyboard-only walkthrough: Tab through the whole page, submit every form.
4. Screen reader spot-check: VoiceOver (Mac) or NVDA (Windows), at least
   the hero, navigation, one form, and one CTA.
5. Contrast check for any new text/background combination you introduced
   (there should be none — use Section 2 pairs only).

If any check fails, fix it and re-test. Do not report the work as done
with a known accessibility failure still open.

## 9. Agent Workflow — How To Use This File

1. Read this file fully before writing any code.
2. Copy Section 2 tokens into the project's CSS. Reuse them everywhere.
3. Build pages from Section 4 components only. Do not create new variants.
4. Follow Section 5 layout order for homepages; adapt only the content,
   not the structure, for other pages.
5. Run the Section 8 checklist. Fix failures before finishing.
6. In your final summary, list: what you changed, which components you
   reused, and the accessibility checks you ran (with results). Never
   claim "accessible" or "done" without those test results.

## 10. Quick Prompt To Give Antigravity

Paste this along with the file:

> Follow the attached design system exactly. Light canvas #FFFFFF, ink
> #102A43, primary CTA teal #0E7C6B, highlight amber #FFB020 only for
> pilot badges, dark portfolio sections #0B1F33, warm blog surface
> #F7F6F3, Inter for UI, Georgia for blog headings, mobile-first, one
> primary CTA per screen, WCAG 2.2 AA. Reuse the components in the file,
> do not invent new colors or styles, and run the accessibility checklist
> before you finish.
