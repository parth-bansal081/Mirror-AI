# MIRROR — Design Document
**Version:** 1.0.0

---

## 1. Design Philosophy

Mirror is a tool about **seeing clearly** — seeing why your AI failed, seeing the holes in your thinking, seeing your agent drift before it crashes. The design must embody that. Not another dark dashboard with glowing green accents. Not a clean white SaaS tool. Something that feels like it's actively watching, processing, revealing.

**The aesthetic direction:** Deep space observatory meets surgical precision. The feeling of a system that sees more than you do — but hands control back to you every time. Calm intelligence. Not flashy. Not cold. Precise and alive.

**The one aesthetic risk:** The UI uses a **liquid glass morphism** approach — panels appear as if made of smoked glass, slightly refracting what's behind them, with light catching their edges. Not frosted glass (that's everywhere). Smoked. Like a one-way mirror. You see through it just enough.

**What this avoids deliberately:**
- Acid green on black (the default "hacker" look)
- Warm cream + serif (the default "thoughtful AI" look)
- Dashboard blue (the default "enterprise data" look)
- Floating cards with drop shadows (every SaaS ever)

---

## 2. Color System

```css
/* MIRROR Design Tokens — globals.css */
:root {
  /* Base — deep obsidian, not pure black */
  --color-void:        #080A0F;   /* App background — deepest */
  --color-depth:       #0D1017;   /* Panel background */
  --color-surface:     #131720;   /* Card / input background */
  --color-surface-hi:  #1C2333;   /* Hover surface */
  --color-rim:         #252D3D;   /* Borders, dividers */

  /* Glass effect */
  --glass-bg:          rgba(19, 23, 32, 0.72);
  --glass-border:      rgba(255, 255, 255, 0.06);
  --glass-blur:        blur(18px);
  --glass-rim:         rgba(255, 255, 255, 0.04);

  /* Primary — electric indigo, not purple, not blue */
  --color-signal:      #6C7FFF;   /* Primary actions, active states */
  --color-signal-dim:  #3D4A99;   /* Muted signal */
  --color-signal-glow: rgba(108, 127, 255, 0.15); /* Glow halos */

  /* Semantic */
  --color-valid:       #3ECFA4;   /* Confirmed / approved / good */
  --color-warn:        #F5A623;   /* High risk / warning */
  --color-danger:      #FF5C5C;   /* Irreversible / destructive */
  --color-neutral:     #8B95A8;   /* Overblown / not applicable */

  /* Text */
  --text-primary:      #E8ECF4;   /* Main readable text */
  --text-secondary:    #7A849A;   /* Supporting text */
  --text-muted:        #424D61;   /* Placeholder / disabled */
  --text-inverse:      #080A0F;   /* Text on light surfaces */

  /* Mode accent colors — each mode has its own identity */
  --mode-archaeology:  #A78BFA;   /* Soft violet — excavation, discovery */
  --mode-advocate:     #F97316;   /* Burnt orange — conflict, heat */
  --mode-babysitter:   #22D3EE;   /* Cyan — surveillance, monitoring */
  --mode-profile:      #6C7FFF;   /* Signal indigo — identity, self */
}
```

---

## 3. Typography

```css
/* Font imports — bundled via @fontsource (no CDN) */
/* npm install @fontsource/space-grotesk @fontsource/jetbrains-mono @fontsource/inter */

:root {
  /* Display — Space Grotesk: geometric, slightly technical, memorable */
  --font-display: 'Space Grotesk', system-ui, sans-serif;

  /* Body — Inter: clean, readable at small sizes */
  --font-body: 'Inter', system-ui, sans-serif;

  /* Mono — JetBrains Mono: for prompts, code, AI outputs */
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Scale */
  --text-xs:   11px;
  --text-sm:   13px;
  --text-base: 15px;
  --text-md:   17px;
  --text-lg:   20px;
  --text-xl:   24px;
  --text-2xl:  30px;
  --text-3xl:  38px;

  /* Weight */
  --weight-normal:   400;
  --weight-medium:   500;
  --weight-semibold: 600;
  --weight-bold:     700;

  /* Leading */
  --leading-tight:  1.2;
  --leading-snug:   1.4;
  --leading-normal: 1.6;
  --leading-relaxed:1.75;
}

/* Usage rules:
   Headlines (mode titles, section headers): Space Grotesk, Bold, --text-xl to --text-3xl
   Body copy, labels, descriptions: Inter, Normal/Medium, --text-sm to --text-base
   Prompts, outputs, AI-generated text: JetBrains Mono, Normal, --text-sm
   Step labels, metadata, timestamps: Inter, Normal, --text-xs, --text-muted
*/
```

---

## 4. Spacing & Layout

```css
:root {
  /* Base unit: 4px */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Layout */
  --sidebar-width:    220px;
  --topbar-height:    56px;
  --panel-radius:     12px;
  --card-radius:      8px;
  --input-radius:     6px;
  --button-radius:    6px;

  /* Shadows — not drop shadows, inner light */
  --shadow-panel: 0 0 0 1px var(--glass-border), 0 8px 32px rgba(0,0,0,0.4);
  --shadow-card:  0 0 0 1px var(--rim), 0 2px 8px rgba(0,0,0,0.3);
  --shadow-signal: 0 0 20px var(--color-signal-glow);
  --shadow-input: inset 0 1px 0 rgba(255,255,255,0.04);
}
```

---

## 5. The Signature Element — Liquid Glass Panels

This is the one thing that makes Mirror unmistakable. Every major panel uses smoked glass morphism:

```css
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--panel-radius);
  box-shadow: var(--shadow-panel);
  position: relative;
  overflow: hidden;
}

/* Rim light — catches the "edge" of the glass */
.glass-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(255,255,255,0.06) 0%,
    transparent 50%,
    rgba(255,255,255,0.02) 100%
  );
  pointer-events: none;
}

/* Active state — panel glows with mode color */
.glass-panel[data-mode="archaeology"] { 
  border-color: rgba(167, 139, 250, 0.2); 
}
.glass-panel[data-mode="advocate"] { 
  border-color: rgba(249, 115, 22, 0.2); 
}
.glass-panel[data-mode="babysitter"] { 
  border-color: rgba(34, 211, 238, 0.2); 
}
```

---

## 6. Component Design Specs

### 6.1 Sidebar
```
Width: 220px
Background: var(--color-depth) — slightly lighter than void
Border-right: 1px solid var(--color-rim)

Logo area (top):
  Height: 56px (matches topbar)
  "MIRROR" — Space Grotesk Bold, --text-xl, --text-primary
  Small animated dot next to it: pulsing, --color-signal

Nav items:
  Height: 40px
  Padding: 0 16px
  Border-radius: 6px (inset, 8px from edges)
  Icon: 18px, colored with mode accent when active
  Label: Inter Medium, --text-sm
  
  Inactive: text-secondary, icon muted
  Hover: surface-hi background, text-primary
  Active: glass-panel effect + mode accent border-left 2px
         icon full mode color, label text-primary

Mode icons (custom, not generic):
  Archaeology: magnifying glass with layers (🔍+📚 concept)
  Advocate: broken sword / crossed out checkmark
  Babysitter: eye with a clock
  Profile: concentric user rings (improvement score indicator)

Bottom section:
  Thin divider (--color-rim)
  Session count badge: "12 sessions" — muted, tiny
```

### 6.2 TopBar
```
Height: 56px
Background: var(--color-depth) with border-bottom: 1px solid var(--color-rim)

Left: Breadcrumb — "Mirror / Prompt Archaeology"
      Space Grotesk, --text-sm, --text-secondary / --text-primary

Right: 
  Profile orb — circular avatar placeholder, 32px
  Shows session count badge
  Click → navigate to Profile
```

### 6.3 Input Areas (Prompt / Decision text)
```css
.mirror-input {
  background: var(--color-surface);
  border: 1px solid var(--color-rim);
  border-radius: var(--input-radius);
  color: var(--text-primary);
  font-family: var(--font-mono);  /* prompts are code */
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  padding: var(--space-4);
  resize: vertical;
  width: 100%;
  box-shadow: var(--shadow-input);
  transition: border-color 150ms ease;
}

.mirror-input:focus {
  outline: none;
  border-color: var(--color-signal);
  box-shadow: var(--shadow-input), 0 0 0 3px var(--color-signal-glow);
}

.mirror-input::placeholder {
  color: var(--text-muted);
  font-style: italic;
}
```

### 6.4 Primary Button
```css
.btn-primary {
  background: var(--color-signal);
  color: var(--text-inverse);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  padding: 10px 24px;
  border-radius: var(--button-radius);
  border: none;
  cursor: pointer;
  transition: all 150ms ease;
  letter-spacing: 0.01em;
}

.btn-primary:hover {
  background: #7D8FFF;
  box-shadow: var(--shadow-signal);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: none;
}

.btn-primary:disabled {
  background: var(--color-surface-hi);
  color: var(--text-muted);
  cursor: not-allowed;
  transform: none;
}
```

### 6.5 Step Reveal Component (Critical UX moment)
```css
/* Steps appear one at a time with a slide-up + fade */
@keyframes stepReveal {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-item {
  animation: stepReveal 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Active step — pulsing dot */
@keyframes stepPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

.step-dot.active {
  background: var(--color-signal);
  animation: stepPulse 1.2s ease infinite;
}

.step-dot.complete {
  background: var(--color-valid);
}

.step-dot.pending {
  background: var(--color-rim);
}
```

### 6.6 Review Gate Cards (Human review moment)
```css
/* The most important UI moment — must feel deliberate */
.review-card {
  /* glass panel base */
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--card-radius);
  padding: var(--space-5);
  
  /* Slide in from right */
  animation: cardSlide 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes cardSlide {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}

.review-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.btn-valid   { background: rgba(62, 207, 164, 0.15); color: var(--color-valid);   border: 1px solid rgba(62,207,164,0.3); }
.btn-overblown{ background: rgba(139,149,168,0.1);   color: var(--color-neutral); border: 1px solid rgba(139,149,168,0.2);}
.btn-reject  { background: rgba(255, 92, 92, 0.1);  color: var(--color-danger);  border: 1px solid rgba(255,92,92,0.2); }

.btn-valid:hover    { background: rgba(62,207,164,0.25); }
.btn-overblown:hover{ background: rgba(139,149,168,0.2); }
.btn-reject:hover   { background: rgba(255,92,92,0.2);  }
```

### 6.7 Loading Orb (AI thinking indicator)
```css
/* Replaces generic spinners — an orbiting particle system */
.loading-orb {
  width: 48px;
  height: 48px;
  position: relative;
}

@keyframes orbit {
  from { transform: rotate(0deg) translateX(20px) rotate(0deg); }
  to   { transform: rotate(360deg) translateX(20px) rotate(-360deg); }
}

.orb-particle {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-signal);
  position: absolute;
  top: 50%; left: 50%;
  margin: -3px;
  animation: orbit 1.2s linear infinite;
}

.orb-particle:nth-child(2) {
  width: 4px; height: 4px;
  background: var(--mode-archaeology);
  animation-duration: 1.8s;
  animation-direction: reverse;
}

.orb-particle:nth-child(3) {
  width: 3px; height: 3px;
  background: var(--color-valid);
  animation-duration: 0.9s;
}
```

### 6.8 Score Ring (Readiness Score)
```css
/* SVG circle with animated stroke-dashoffset */
/* Score 0-100 maps to stroke fill */

.score-ring svg circle.track {
  stroke: var(--color-surface-hi);
  stroke-width: 6;
  fill: none;
}

.score-ring svg circle.fill {
  stroke: var(--color-signal);
  stroke-width: 6;
  fill: none;
  stroke-linecap: round;
  transition: stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1);
  /* stroke-dashoffset animated via React based on score */
}

.score-ring .score-value {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: var(--weight-bold);
  fill: var(--text-primary);
}

/* Color changes by score range */
/* 0-40: danger, 41-69: warn, 70-100: valid */
```

### 6.9 Irreversible Action Gate (Full-screen modal)
```css
/* This MUST feel serious. Full overlay, not a drawer. */
.irreversible-overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 10, 15, 0.92);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: overlayFade 200ms ease forwards;
}

.irreversible-modal {
  max-width: 480px;
  width: 90%;
  /* glass panel */
  background: var(--glass-bg);
  border: 1px solid rgba(255, 92, 92, 0.3); /* danger border */
  border-radius: var(--panel-radius);
  padding: var(--space-8);
  box-shadow: 0 0 60px rgba(255, 92, 92, 0.1);
}

.irreversible-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 92, 92, 0.1);
  border: 1px solid rgba(255, 92, 92, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-5);
  color: var(--color-danger);
}
```

---

## 7. Mode-Specific Visual Identity

Each mode has a distinct color treatment so users immediately know where they are:

### Prompt Archaeology — Violet
```
Active sidebar border: var(--mode-archaeology) #A78BFA
Panel accent: violet rim glow
Step dots: violet
Section label color: violet
Metaphor: excavation layers, revealing what's buried
```

### Devil's Advocate — Orange  
```
Active sidebar border: var(--mode-advocate) #F97316
Panel accent: orange rim, warmer feel
Challenge cards: orange left border stripe
Counter-question highlights: orange
Metaphor: fire, heat, confrontation
```

### Agent Babysitter — Cyan
```
Active sidebar border: var(--mode-babysitter) #22D3EE
Panel accent: cyan rim, technical feel
Live monitor pulse: cyan
Drift indicator: shifts toward warn/danger based on risk
Metaphor: surveillance, monitoring, signal
```

### Profile — Indigo
```
Active sidebar border: var(--mode-profile) #6C7FFF
Prompt DNA chart: indigo bar chart
Score ring: indigo fill
Timeline: indigo trail
Metaphor: self-reflection, identity, depth
```

---

## 8. Motion Design

### Principles
- Every AI analysis step reveals sequentially — never all at once
- Human review cards slide in one at a time — feels deliberate, not rushed  
- Score rings animate from 0 to final value — you watch it calculate
- Mode transitions: fade through void color — never a jarring cut
- Loading orbs replace all spinners — nothing generic

### Timing Functions
```css
/* Snap — for UI response (button clicks, toggles) */
--ease-snap: cubic-bezier(0.16, 1, 0.3, 1);  /* 150ms */

/* Reveal — for content appearing (steps, cards) */
--ease-reveal: cubic-bezier(0.16, 1, 0.3, 1); /* 350-400ms */

/* Score — for ring animation (satisfying fill) */
--ease-score: cubic-bezier(0.16, 1, 0.3, 1);  /* 1200ms */

/* Transition — for page/mode changes */
--ease-transition: ease;                        /* 200ms */
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Responsive Behavior

Mirror runs inside the Anna desktop agent. Target viewport: **1024px minimum width.**

Layout:
- **≥ 1200px:** Sidebar + main panel, full two-column layouts in modes
- **1024–1199px:** Sidebar collapses to icon-only (48px wide), main panel expands
- **< 1024px:** Not officially supported (Anna desktop minimum)

---

## 10. Empty States & Error States

### Empty Profile (first launch)
```
Center of profile panel:
[Icon: concentric rings, muted]
"Your intelligence profile is empty."
"Run your first analysis to start building it."
[Button: Go to Prompt Archaeology]
```
Not sad. Not apologetic. An invitation.

### Analysis Error
```
[Icon: signal broken]
"Analysis incomplete."
"Claude couldn't parse the response. This happens rarely."
[Button: Retry]  [Button: Copy raw response]
```
Explains what happened. Offers a path forward. No apology.

### Irreversible Action — Rejected
```
Toast (bottom-right, danger color):
"Action rejected. Agent should stop here."
Auto-dismiss: 5 seconds
```

---

## 11. Typography Usage Examples

```
Mode title:        Space Grotesk Bold 24px — "Prompt Archaeology"
Section header:    Space Grotesk SemiBold 17px — "Forensic Analysis"
Body text:         Inter Regular 15px — descriptions, explanations
Prompt/output:     JetBrains Mono Regular 13px — all AI-generated/input text
Step label:        Inter Medium 13px — "Step 2: Identifying assumptions..."
Metadata:          Inter Regular 11px, --text-muted — timestamps, counts
Button:            Inter SemiBold 13px — "Analyze Failure"
Score number:      Space Grotesk Bold 38px — "62%"
Score label:       Inter Medium 13px — "DECISION READINESS"
```

---

## 12. CSS File Checklist for Agent

The agent must create these CSS files:
- `app/src/styles/globals.css` — resets, body, scrollbar styling
- `app/src/styles/tokens.css` — all CSS variables above
- `app/src/styles/animations.css` — all @keyframes above
- Each component gets its own `.module.css` file
- No Tailwind — pure CSS modules for CSP compliance and design precision
- No external CSS CDN links anywhere
