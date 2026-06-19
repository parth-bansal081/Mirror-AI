# MIRROR — V3 Complete UI/UX Makeover
**Paste this entire file into your IDE agent. Read every word before touching any code.**

---

## Design Direction Summary

- **Vibe:** Warm & approachable — like talking to a brilliant friend who happens to be an AI. Not robotic. Not cold. Feels alive and personal.
- **Colors:** Multi-color — each mode has its own strong identity. When you switch modes, the whole app shifts color personality.
- **Dashboard:** Data-heavy + interactive + story-like combined. Numbers that count up, charts that draw themselves, a narrative of your progress over time.
- **Hero element:** Personalized greeting + quick action buttons. Mirror knows who you are and says so the moment you open it.
- **Mode switching:** Smooth page slide — like swiping between apps on a phone.
- **Animation level:** Heavy. Everything is alive. Particles, glows, morphing shapes, numbers counting up, bars filling. Every interaction has a response.

---

## 1. NEW COLOR SYSTEM — Replace Everything In tokens.css

```css
:root {
  /* ── BASE ─────────────────────────────────────────── */
  --void:          #09090B;   /* deepest background */
  --depth:         #0F0F12;   /* sidebar, panels */
  --surface:       #18181B;   /* card backgrounds */
  --surface-hi:    #27272A;   /* hover states */
  --rim:           #3F3F46;   /* borders */
  --rim-soft:      rgba(255,255,255,0.06);

  /* ── MODE COLORS — each mode owns its palette ─────── */

  /* Prompt Archaeology — Deep Violet */
  --arch-primary:  #8B5CF6;
  --arch-soft:     #A78BFA;
  --arch-bg:       rgba(139, 92, 246, 0.08);
  --arch-border:   rgba(139, 92, 246, 0.25);
  --arch-glow:     rgba(139, 92, 246, 0.4);

  /* Devil's Advocate — Burning Amber */
  --devil-primary: #F59E0B;
  --devil-soft:    #FCD34D;
  --devil-bg:      rgba(245, 158, 11, 0.08);
  --devil-border:  rgba(245, 158, 11, 0.25);
  --devil-glow:    rgba(245, 158, 11, 0.4);

  /* Agent Babysitter — Electric Cyan */
  --baby-primary:  #06B6D4;
  --baby-soft:     #67E8F9;
  --baby-bg:       rgba(6, 182, 212, 0.08);
  --baby-border:   rgba(6, 182, 212, 0.25);
  --baby-glow:     rgba(6, 182, 212, 0.4);

  /* Learning Path — Emerald */
  --learn-primary: #10B981;
  --learn-soft:    #6EE7B7;
  --learn-bg:      rgba(16, 185, 129, 0.08);
  --learn-border:  rgba(16, 185, 129, 0.25);
  --learn-glow:    rgba(16, 185, 129, 0.4);

  /* Profile / Dashboard — Warm Rose Gold */
  --profile-primary: #F43F5E;
  --profile-soft:    #FB7185;
  --profile-bg:      rgba(244, 63, 94, 0.08);
  --profile-border:  rgba(244, 63, 94, 0.25);
  --profile-glow:    rgba(244, 63, 94, 0.4);

  /* ── SEMANTIC ─────────────────────────────────────── */
  --success:       #10B981;
  --warning:       #F59E0B;
  --danger:        #EF4444;
  --neutral:       #71717A;

  /* ── TEXT ────────────────────────────────────────── */
  --text-primary:   #FAFAFA;
  --text-secondary: #A1A1AA;
  --text-muted:     #52525B;
  --text-inverse:   #09090B;

  /* ── TYPOGRAPHY ──────────────────────────────────── */
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-body:    'Inter', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', monospace;

  /* ── SPACING ─────────────────────────────────────── */
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;
  --space-4: 16px;  --space-5: 20px;  --space-6: 24px;
  --space-8: 32px;  --space-10: 40px; --space-12: 48px;
  --space-16: 64px;

  /* ── RADII ───────────────────────────────────────── */
  --radius-sm:  6px;
  --radius-md:  12px;
  --radius-lg:  16px;
  --radius-xl:  24px;
  --radius-full: 9999px;

  /* ── SHADOWS ─────────────────────────────────────── */
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.4);
  --shadow-md:  0 4px 16px rgba(0,0,0,0.5);
  --shadow-lg:  0 8px 32px rgba(0,0,0,0.6);

  /* ── ACTIVE MODE (set dynamically via JS on mode switch) ── */
  --mode-primary:  var(--arch-primary);
  --mode-soft:     var(--arch-soft);
  --mode-bg:       var(--arch-bg);
  --mode-border:   var(--arch-border);
  --mode-glow:     var(--arch-glow);

  /* ── TRANSITIONS ─────────────────────────────────── */
  --ease-snap:    cubic-bezier(0.16, 1, 0.3, 1);
  --ease-smooth:  cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce:  cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### How Active Mode Colors Work
When user switches to a mode, add a data attribute to `<html>` or `<body>`:
```javascript
// On mode switch:
document.body.setAttribute('data-mode', 'archaeology'); // or advocate, babysitter, learning, profile

// In CSS:
body[data-mode="archaeology"] {
  --mode-primary: var(--arch-primary);
  --mode-soft:    var(--arch-soft);
  --mode-bg:      var(--arch-bg);
  --mode-border:  var(--arch-border);
  --mode-glow:    var(--arch-glow);
}
body[data-mode="advocate"] {
  --mode-primary: var(--devil-primary);
  --mode-soft:    var(--devil-soft);
  --mode-bg:      var(--devil-bg);
  --mode-border:  var(--devil-border);
  --mode-glow:    var(--devil-glow);
}
body[data-mode="babysitter"] {
  --mode-primary: var(--baby-primary);
  --mode-soft:    var(--baby-soft);
  --mode-bg:      var(--baby-bg);
  --mode-border:  var(--baby-border);
  --mode-glow:    var(--baby-glow);
}
body[data-mode="learning"] {
  --mode-primary: var(--learn-primary);
  --mode-soft:    var(--learn-soft);
  --mode-bg:      var(--learn-bg);
  --mode-border:  var(--learn-border);
  --mode-glow:    var(--learn-glow);
}
body[data-mode="profile"] {
  --mode-primary: var(--profile-primary);
  --mode-soft:    var(--profile-soft);
  --mode-bg:      var(--profile-bg);
  --mode-border:  var(--profile-border);
  --mode-glow:    var(--profile-glow);
}
```

---

## 2. ANIMATIONS — Replace animations.css Entirely

```css
/* ── PARTICLE FLOAT ─────────────────────────── */
@keyframes particleFloat {
  0%   { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.6; }
  33%  { transform: translateY(-20px) translateX(10px) scale(1.1); opacity: 1; }
  66%  { transform: translateY(-10px) translateX(-8px) scale(0.9); opacity: 0.7; }
  100% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.6; }
}

/* ── MODE GLOW PULSE ────────────────────────── */
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 20px var(--mode-glow), 0 0 40px transparent; }
  50%       { box-shadow: 0 0 30px var(--mode-glow), 0 0 60px var(--mode-glow); }
}

/* ── SLIDE IN FROM RIGHT (mode transition) ─── */
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ── SLIDE OUT TO LEFT (mode transition) ────── */
@keyframes slideOutLeft {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(-40px); }
}

/* ── CONTENT REVEAL ─────────────────────────── */
@keyframes revealUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── CARD APPEAR ────────────────────────────── */
@keyframes cardAppear {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── NUMBER COUNT UP (trigger via JS) ──────── */
/* Handled in JS with requestAnimationFrame */

/* ── BAR FILL ───────────────────────────────── */
@keyframes barFill {
  from { width: 0%; }
  to   { width: var(--target-width); }
}

/* ── SCORE RING FILL ────────────────────────── */
/* Handled via SVG stroke-dashoffset in JS */

/* ── FLOATING ORB (background decoration) ─── */
@keyframes floatOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(30px, -20px) scale(1.05); }
  66%       { transform: translate(-20px, 15px) scale(0.95); }
}

/* ── SHIMMER (loading state) ────────────────── */
@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position: 200% 0; }
}

/* ── STEP REVEAL ────────────────────────────── */
@keyframes stepReveal {
  from { opacity: 0; transform: translateX(-12px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ── CHALLENGE CARD SLIDE ───────────────────── */
@keyframes challengeSlide {
  from { opacity: 0; transform: translateX(30px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ── GREETING APPEAR ────────────────────────── */
@keyframes greetingAppear {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── IRREVERSIBLE GATE SLAM ─────────────────── */
@keyframes gateSlamIn {
  from { opacity: 0; transform: scale(1.05); }
  to   { opacity: 1; transform: scale(1); }
}

/* ── SIDEBAR NAV INDICATOR ──────────────────── */
@keyframes indicatorSlide {
  from { transform: scaleY(0); }
  to   { transform: scaleY(1); }
}

/* ── TOOLTIP APPEAR ─────────────────────────── */
@keyframes tooltipAppear {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── REDUCED MOTION OVERRIDE ─────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 3. SIDEBAR — Complete Redesign

### Visual Design
```
Width: 240px
Background: var(--depth)
Border-right: 1px solid var(--rim-soft)
Padding: 0

Structure (top to bottom):
├── Logo area (72px tall)
├── Nav items (modes)
├── Divider
└── Profile + session count (bottom)
```

### Logo Area
```html
<!-- Top of sidebar -->
<div class="sidebar-logo">
  <!-- Animated logo mark: two overlapping circles that morph -->
  <div class="logo-mark">
    <div class="logo-orb logo-orb-1"></div>
    <div class="logo-orb logo-orb-2"></div>
  </div>
  <span class="logo-text">MIRROR</span>
  <!-- Small live indicator dot -->
  <div class="live-dot"></div>
</div>
```

```css
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--rim-soft);
}

.logo-mark {
  width: 32px;
  height: 32px;
  position: relative;
}

.logo-orb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  position: absolute;
  animation: floatOrb 6s ease-in-out infinite;
}

.logo-orb-1 {
  background: var(--mode-primary);
  top: 0; left: 0;
  opacity: 0.9;
}

.logo-orb-2 {
  background: var(--mode-soft);
  bottom: 0; right: 0;
  opacity: 0.6;
  animation-delay: -3s;
  animation-direction: reverse;
}

.logo-text {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.12em;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--mode-primary);
  margin-left: auto;
  animation: glowPulse 2s ease infinite;
}
```

### Nav Items
```css
.nav-section {
  padding: 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  text-transform: uppercase;
  padding: 8px 8px 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  position: relative;
  transition: all 200ms var(--ease-smooth);
  text-decoration: none;
}

.nav-item:hover {
  background: var(--surface);
}

.nav-item.active {
  background: var(--mode-bg);
  border: 1px solid var(--mode-border);
}

/* Active left indicator bar */
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  bottom: 20%;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--mode-primary);
  animation: indicatorSlide 200ms var(--ease-bounce) forwards;
}

.nav-icon {
  width: 18px;
  height: 18px;
  color: var(--text-muted);
  transition: color 200ms;
  flex-shrink: 0;
}

.nav-item.active .nav-icon {
  color: var(--mode-primary);
}

.nav-item:hover .nav-icon {
  color: var(--text-secondary);
}

.nav-item-label {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color 200ms;
}

.nav-item.active .nav-item-label {
  color: var(--text-primary);
  font-weight: 600;
}

/* Mode color dot on active item */
.nav-mode-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-left: auto;
  background: var(--mode-primary);
  opacity: 0;
  transition: opacity 200ms;
}

.nav-item.active .nav-mode-dot {
  opacity: 1;
}

/* Bottom of sidebar */
.sidebar-footer {
  margin-top: auto;
  padding: 12px;
  border-top: 1px solid var(--rim-soft);
}

.session-count {
  font-size: 11px;
  color: var(--text-muted);
  padding: 4px 8px;
}
```

---

## 4. TOPBAR — Redesign

```css
.topbar {
  height: 56px;
  background: var(--depth);
  border-bottom: 1px solid var(--rim-soft);
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 100;
  /* Subtle backdrop blur for content scrolling under */
  backdrop-filter: blur(8px);
}

.topbar-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.breadcrumb-root {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 500;
}

.breadcrumb-sep {
  color: var(--text-muted);
  font-size: 13px;
}

.breadcrumb-current {
  font-size: 13px;
  font-weight: 600;
  color: var(--mode-primary);  /* Current mode's color */
  transition: color 300ms;
}

/* Mode color indicator strip at very top of topbar */
.topbar::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--mode-primary), var(--mode-soft), transparent);
  transition: background 400ms var(--ease-smooth);
}

/* Right side: settings icon */
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topbar-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 150ms;
  border: none;
  background: transparent;
}

.topbar-icon-btn:hover {
  background: var(--surface);
  color: var(--text-primary);
}
```

---

## 5. MODE TRANSITION — Page Slide

Wrap each mode's content in a transition container. When the route changes:

```typescript
// In App.tsx or router setup
// Use React Router's useLocation to detect route change
// Apply exit animation to leaving page, enter animation to entering page

// CSS for the page wrapper:
.page-enter {
  animation: slideInRight 350ms var(--ease-snap) forwards;
}

.page-exit {
  animation: slideOutLeft 350ms var(--ease-snap) forwards;
  position: absolute;
  width: 100%;
}
```

Use React Router v6 with `<AnimatePresence>` from framer-motion OR implement manually:
```typescript
// On route change:
// 1. Set body data-mode attribute immediately (color shift)
// 2. Animate old page out (slideOutLeft, 300ms)
// 3. Animate new page in (slideInRight, 350ms)
// The color shift via CSS variables happens instantly during slide
```

---

## 6. BACKGROUND DECORATION — Alive & Breathing

Add floating background orbs to the main content area. These are purely decorative:

```tsx
// BackgroundOrbs.tsx component
// Renders 3 blurred orbs that float slowly
// Colors match current mode

function BackgroundOrbs() {
  return (
    <div className="bg-orbs" aria-hidden="true">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
    </div>
  );
}
```

```css
.bg-orbs {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.12;
  transition: background 600ms var(--ease-smooth);
}

.bg-orb-1 {
  width: 400px;
  height: 400px;
  background: var(--mode-primary);
  top: -100px;
  right: 10%;
  animation: floatOrb 12s ease-in-out infinite;
}

.bg-orb-2 {
  width: 300px;
  height: 300px;
  background: var(--mode-soft);
  bottom: 10%;
  left: 5%;
  animation: floatOrb 16s ease-in-out infinite reverse;
  animation-delay: -5s;
}

.bg-orb-3 {
  width: 200px;
  height: 200px;
  background: var(--mode-primary);
  top: 50%;
  left: 40%;
  animation: floatOrb 20s ease-in-out infinite;
  animation-delay: -8s;
  opacity: 0.06;
}
```

All main content must be `position: relative; z-index: 1` above these orbs.

---

## 7. DASHBOARD — Complete New Design

The dashboard is now the HOME route `/` or `/dashboard`. Replace the current empty dashboard with:

### Hero Section — Personalized Greeting
```tsx
function DashboardHero({ sessionCount, topMode, improvementScore }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = 'Parth'; // from Anna profile or default

  return (
    <div className="hero">
      {/* Greeting */}
      <div className="hero-greeting" style={{ animation: 'greetingAppear 600ms var(--ease-snap) forwards' }}>
        <span className="greeting-text">{greeting}, {name}.</span>
        {sessionCount === 0 && (
          <span className="greeting-sub">Mirror is ready. Start your first analysis.</span>
        )}
        {sessionCount > 0 && (
          <span className="greeting-sub">
            You've completed {sessionCount} session{sessionCount !== 1 ? 's' : ''}. 
            Your intelligence score is <strong style={{ color: 'var(--mode-primary)' }}>{improvementScore}/100</strong>.
          </span>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="hero-actions">
        <QuickActionCard
          mode="archaeology"
          label="Analyze a Prompt"
          description="Why did your AI fail?"
          icon={<SearchIcon />}
          color="var(--arch-primary)"
          href="/archaeology"
        />
        <QuickActionCard
          mode="advocate"
          label="Challenge a Decision"
          description="Before you commit"
          icon={<SwordsIcon />}
          color="var(--devil-primary)"
          href="/advocate"
        />
        <QuickActionCard
          mode="babysitter"
          label="Supervise an Agent"
          description="Gate irreversible actions"
          icon={<EyeIcon />}
          color="var(--baby-primary)"
          href="/babysitter"
        />
        <QuickActionCard
          mode="learning"
          label="Learn Something"
          description="Adaptive curriculum"
          icon={<BookIcon />}
          color="var(--learn-primary)"
          href="/learning"
        />
      </div>
    </div>
  );
}
```

```css
.hero {
  padding: var(--space-8) var(--space-8) var(--space-6);
}

.greeting-text {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  display: block;
  margin-bottom: 8px;
}

.greeting-sub {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.hero-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 28px;
}

.quick-action-card {
  background: var(--surface);
  border: 1px solid var(--rim-soft);
  border-radius: var(--radius-lg);
  padding: 20px;
  cursor: pointer;
  transition: all 200ms var(--ease-smooth);
  text-decoration: none;
  display: block;
  position: relative;
  overflow: hidden;
}

.quick-action-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--mode-bg);
  opacity: 0;
  transition: opacity 200ms;
}

.quick-action-card:hover {
  border-color: var(--card-color, var(--mode-border));
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}

.quick-action-card:hover::before {
  opacity: 1;
}

.quick-action-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  /* background set via inline style to card color at 15% opacity */
}

.quick-action-label {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.quick-action-desc {
  font-size: 12px;
  color: var(--text-muted);
}
```

### Dashboard Stats Row
Below the hero, a row of 4 stat cards:

```tsx
<div className="stats-row">
  <StatCard label="Intelligence Score" value={score} suffix="/100" trend="+12" color="var(--profile-primary)" animated />
  <StatCard label="Prompts Analyzed" value={promptCount} color="var(--arch-primary)" animated />
  <StatCard label="Decisions Challenged" value={decisionCount} color="var(--devil-primary)" animated />
  <StatCard label="Agent Runs Supervised" value={agentCount} color="var(--baby-primary)" animated />
</div>
```

```css
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 0 var(--space-8) var(--space-6);
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--rim-soft);
  border-radius: var(--radius-md);
  padding: 20px;
  position: relative;
  overflow: hidden;
  animation: cardAppear 400ms var(--ease-snap) forwards;
}

/* Colored top edge */
.stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--stat-color);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 36px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-trend {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--success);
  background: rgba(16, 185, 129, 0.1);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}
```

**Number animation:** All stat values count up from 0 to their value over 1.2 seconds using requestAnimationFrame when the dashboard mounts. Use this utility:
```typescript
function animateCount(element: HTMLElement, target: number, duration = 1200) {
  const start = performance.now();
  function update(now: number) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(eased * target).toString();
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}
```

### Dashboard Charts Section
Two side-by-side panels:

**Left: Prompt DNA Radar (SVG)**
Pure SVG, no libraries. 5 axes: Clarity / Specificity / Context / Format / Consistency
- Pentagon shape for the track
- Filled polygon for user's scores, colored with `--arch-primary`
- Labels at each point
- Animates from center outward on mount

**Right: Recent Activity Feed**
```tsx
<div className="activity-feed">
  <h3>Recent Sessions</h3>
  {sessions.map((session, i) => (
    <ActivityItem
      key={session.id}
      mode={session.mode}
      title={session.title}
      time={session.date}
      score={session.score}
      style={{ animationDelay: `${i * 80}ms` }}
    />
  ))}
</div>
```

```css
.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--rim-soft);
  animation: revealUp 400ms var(--ease-snap) both;
}

.activity-mode-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.activity-title {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.activity-time {
  font-size: 11px;
  color: var(--text-muted);
}

.activity-score {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--surface-hi);
  color: var(--text-secondary);
}
```

---

## 8. MODE PAGE REDESIGN

### General Pattern For All Mode Pages

Every mode page must follow this layout:

```
┌─────────────────────────────────────────────┐
│  MODE HEADER                                 │
│  Large colored title + subtitle             │
│  Stat badge (Sessions: 0) top right         │
├─────────────────────────────────────────────┤
│  CONTENT AREA                                │
│  Warm glass panel (not cold dark)           │
│  Input section                              │
│  Results section (appears below)            │
└─────────────────────────────────────────────┘
```

### Mode Header
```css
.mode-header {
  padding: var(--space-8) var(--space-8) var(--space-6);
  animation: revealUp 400ms var(--ease-snap) forwards;
}

.mode-title {
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 700;
  color: var(--mode-primary);  /* Mode's own color */
  margin-bottom: 6px;
}

.mode-subtitle {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.mode-stat-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: var(--mode-bg);
  border: 1px solid var(--mode-border);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  color: var(--mode-primary);
}
```

### Glass Panel (warmer version)
```css
.mode-panel {
  margin: 0 var(--space-8) var(--space-6);
  background: rgba(24, 24, 27, 0.8);
  border: 1px solid var(--mode-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  backdrop-filter: blur(12px);
  position: relative;
  animation: cardAppear 400ms var(--ease-snap) forwards;
}

/* Warm top glow instead of cold rim */
.mode-panel::before {
  content: '';
  position: absolute;
  top: 0; left: 10%; right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--mode-primary), transparent);
  border-radius: var(--radius-full);
}
```

### Input Fields (warmer)
```css
.mirror-input {
  width: 100%;
  background: var(--void);
  border: 1px solid var(--rim);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.7;
  padding: 14px 16px;
  resize: vertical;
  transition: border-color 200ms, box-shadow 200ms;
  box-sizing: border-box;
}

.mirror-input:focus {
  outline: none;
  border-color: var(--mode-primary);
  box-shadow: 0 0 0 3px var(--mode-bg), 0 0 20px var(--mode-glow);
}

.mirror-input::placeholder {
  color: var(--text-muted);
  font-style: italic;
}
```

### Primary Button (with glow)
```css
.btn-primary {
  background: var(--mode-primary);
  color: var(--text-inverse);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  padding: 10px 24px;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all 200ms var(--ease-smooth);
  letter-spacing: 0.01em;
  position: relative;
  overflow: hidden;
}

/* Shine sweep on hover */
.btn-primary::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  transition: left 400ms;
}

.btn-primary:hover::after {
  left: 100%;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px var(--mode-glow);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: none;
}

.btn-primary:disabled {
  background: var(--surface-hi);
  color: var(--text-muted);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-primary:disabled::after { display: none; }
```

---

## 9. LOADING STATES — Alive & Warm

### Shimmer Skeleton (for loading cards)
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface) 25%,
    var(--surface-hi) 50%,
    var(--surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
```

### Analyzing State (replaces old spinner)
Show a pulsing panel with step indicators and a message that changes:
```
Analyzing your prompt...        [0.5s]
Diagnosing failure patterns...  [1.5s]
Generating rewrites...          [2.5s]
Calculating integrity score...  [3.5s]
```

Messages cycle via a JS interval while the executa call is pending.

### Loading Orb
Three orbiting particles, now colored with mode color:
```css
.loading-orb-particle {
  background: var(--mode-primary);
  box-shadow: 0 0 8px var(--mode-glow);
}
```

---

## 10. SCORE RING — Enhanced

The score ring must now:
1. Have a glowing track (not just a flat background ring)
2. Show the number counting up as the ring fills
3. Change color based on score: red → orange → green
4. Have a soft pulse animation when it reaches its final value

```css
/* Score ring glow state */
.score-ring.complete circle.fill {
  filter: drop-shadow(0 0 8px var(--score-color));
  animation: glowPulse 2s ease infinite;
}
```

---

## 11. REVIEW BUTTONS — Warmer Design

```css
.review-btn {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 150ms var(--ease-snap);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.review-btn-valid {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
  color: #10B981;
}
.review-btn-valid:hover {
  background: rgba(16, 185, 129, 0.2);
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.3);
}
.review-btn-valid.selected {
  background: #10B981;
  color: white;
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.4);
}

.review-btn-overblown {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
  color: #F59E0B;
}
.review-btn-overblown:hover {
  background: rgba(245, 158, 11, 0.2);
}
.review-btn-overblown.selected {
  background: #F59E0B;
  color: white;
}

.review-btn-na {
  background: rgba(113, 113, 122, 0.1);
  border-color: rgba(113, 113, 122, 0.3);
  color: #71717A;
}
.review-btn-na:hover {
  background: rgba(113, 113, 122, 0.2);
}
.review-btn-na.selected {
  background: #71717A;
  color: white;
}
```

---

## 12. REWRITE VARIANT CARDS — Final Design

```css
.rewrite-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 24px;
}

.rewrite-card {
  background: var(--void);
  border: 1px solid var(--rim);
  border-radius: var(--radius-lg);
  padding: 20px;
  cursor: pointer;
  transition: all 200ms var(--ease-smooth);
  animation: cardAppear 400ms var(--ease-snap) both;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rewrite-card:nth-child(2) { animation-delay: 100ms; }
.rewrite-card:nth-child(3) { animation-delay: 200ms; }

.rewrite-card:hover {
  border-color: var(--arch-border);
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3), 0 0 20px var(--arch-glow);
}

.rewrite-card.selected {
  border-color: var(--arch-primary);
  background: var(--arch-bg);
  box-shadow: 0 0 0 1px var(--arch-primary), 0 0 30px var(--arch-glow);
}

.rewrite-strategy-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: var(--arch-bg);
  color: var(--arch-primary);
  border: 1px solid var(--arch-border);
}

.rewrite-prompt-box {
  background: var(--surface);
  border-radius: var(--radius-sm);
  padding: 12px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
  flex: 1;
  white-space: pre-wrap;
  word-break: break-word;
}

.rewrite-predicted {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
  line-height: 1.5;
}

.btn-select-fix {
  width: 100%;
  padding: 8px;
  border-radius: var(--radius-sm);
  background: transparent;
  border: 1px solid var(--rim);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms;
  text-align: center;
}

.rewrite-card:hover .btn-select-fix {
  border-color: var(--arch-border);
  color: var(--arch-primary);
}

.rewrite-card.selected .btn-select-fix {
  background: var(--arch-primary);
  border-color: var(--arch-primary);
  color: white;
}
```

---

## 13. IMPLEMENTATION RULES FOR THIS SESSION

1. **Do NOT rebuild from scratch** — modify existing files only
2. **Order of changes:**
   - tokens.css first (all new CSS variables)
   - animations.css second (new keyframes)
   - globals.css third (body bg, scrollbar, font)
   - Layout/Sidebar.tsx + its CSS
   - TopBar.tsx + its CSS
   - BackgroundOrbs.tsx (new component)
   - App.tsx (add mode switching + data-mode attribute + page slide transition)
   - Dashboard/index.tsx (new hero + stats + activity feed)
   - Each mode page (header redesign + panel style + warm inputs)
   - Score rings + review buttons
   - Rewrite variant cards
3. **Test after each section** — `anna-app dev` must stay running
4. **No external CDN** — all via npm
5. **HashRouter stays** — don't switch to BrowserRouter
6. **data-mode attribute** on `<body>` must be set immediately on route change, before animation starts — this ensures color shift happens during the slide transition, not after
7. **All numbers animate on mount** — use the animateCount utility
8. **Background orbs** must be rendered in the main layout shell, not inside individual mode pages
9. **Run `npm run build`** after all changes and confirm no TypeScript errors

---

## 14. VERIFICATION CHECKLIST

- [ ] Dashboard shows: personalized greeting + 4 quick action cards + 4 stat cards with animated numbers
- [ ] Background orbs float and change color when mode switches
- [ ] Topbar shows 2px colored strip that transitions with mode
- [ ] Sidebar active item shows mode-colored left bar + mode dot
- [ ] Logo mark orbs animate with floatOrb
- [ ] Mode switching has smooth slide animation (old page slides left, new page slides right)
- [ ] Body data-mode attribute updates on every route change
- [ ] All mode titles are colored with their mode's primary color
- [ ] Mode panels have warm top glow line instead of cold rim
- [ ] Input fields glow with mode color on focus
- [ ] Primary buttons have shine sweep on hover + glow shadow
- [ ] Score rings glow and count up
- [ ] Review buttons show colored selected state with glow
- [ ] Rewrite variant cards animate in with stagger + hover lift
- [ ] All stat numbers count up from 0 on dashboard mount
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] `anna-app dev` works end to end
