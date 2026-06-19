# MIRROR — Technical Specification
**Version:** 1.0.0

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    ANNA RUNTIME                          │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │              MIRROR REACT APP (SPA)              │   │
│  │         TypeScript + React + Vite                │   │
│  │                                                  │   │
│  │  ┌────────────┐ ┌─────────────┐ ┌────────────┐  │   │
│  │  │  Prompt    │ │  Devil's   │ │  Agent     │  │   │
│  │  │ Archaeology│ │  Advocate  │ │ Babysitter │  │   │
│  │  └─────┬──────┘ └──────┬─────┘ └─────┬──────┘  │   │
│  │        │               │             │           │   │
│  │  ┌─────▼───────────────▼─────────────▼──────┐   │   │
│  │  │           anna.tools.invoke()             │   │   │
│  │  │         Anna SDK Bridge Layer             │   │   │
│  │  └─────────────────────────────────────────-┘   │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                               │
│  ┌───────────────────────▼──────────────────────────┐   │
│  │              EXECUTA LAYER (Python)               │   │
│  │                                                   │   │
│  │  ┌─────────────────┐  ┌──────────────────────┐   │   │
│  │  │ prompt-analyzer │  │  decision-critic     │   │   │
│  │  │   _plugin.py    │  │    _plugin.py        │   │   │
│  │  └────────┬────────┘  └──────────┬───────────┘   │   │
│  │           │                      │                │   │
│  │  ┌────────▼──────────────────────▼───────────┐   │   │
│  │  │           agent-supervisor                │   │   │
│  │  │              _plugin.py                   │   │   │
│  │  └───────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────┘   │
│                          │                               │
│                   Google Gemini API                       │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| UI Framework | React 18 + TypeScript | Type safety, component model |
| UI Styling | CSS Modules + custom CSS variables | No CDN dependency (CSP constraint) |
| Build Tool | Vite | Fast bundling, static SPA output |
| Anna Integration | `@anna-ai/sdk` | Required for `anna` object + `tools.invoke` |
| AI Processing | Python 3.11 (Executas) | Anna supports Python plugins |
| HTTP Client (Executa) | `httpx` | Async HTTP for Gemini API calls |
| AI Model | Google Gemini (gemini-1.5-flash) | Via API key in Executa env |
| State Persistence | Anna APS (App Persistent Storage) | Native Anna state layer |
| Animation | CSS keyframes + Framer Motion (bundled) | No CDN — bundled via npm |
| Icons | Lucide React (bundled via npm) | No CDN |

---

## 3. Directory Structure

```
mirror/                                  ← ROOT
│
├── docs/                                ← All planning docs (this folder)
│   ├── PRD.md
│   ├── TECH_SPEC.md
│   ├── APP_FLOW.md
│   ├── DESIGN.md
│   ├── SCHEMA.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── TRACKER.md
│   └── RULES.md
│
├── app/                                 ← React SPA (TypeScript)
│   ├── index.html                       ← Single entry point
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── src/
│       ├── main.tsx                     ← Anna SDK init → mount React
│       ├── App.tsx                      ← Root router + layout
│       ├── anna.d.ts                    ← Anna SDK type declarations
│       ├── vite-env.d.ts                ← Vite env client types (resolves css modules)
│       │
│       ├── components/                  ← Shared UI components
│       │   ├── Layout/
│       │   │   ├── Sidebar.tsx          ← Mode navigation
│       │   │   ├── TopBar.tsx           ← App header + profile indicator
│       │   │   └── Layout.tsx           ← Shell wrapper
│       │   ├── UI/
│       │   │   ├── StepReveal.tsx       ← Animated step-by-step reveal
│       │   │   ├── ScoreRing.tsx        ← Circular score visualization
│       │   │   ├── LoadingOrb.tsx       ← Animated AI thinking indicator
│       │   │   └── Toast.tsx            ← Muted toast notification
│       │   └── IrreversibleGate.tsx     ← Full-screen approval modal
│       │
│       ├── modes/                       ← The three main modes
│       │   ├── PromptArchaeology/
│       │   │   ├── index.tsx            ← Mode root
│       │   │   ├── PromptInput.tsx      ← Dual panel: prompt + bad output
│       │   │   ├── AnalysisSteps.tsx    ← 4-step forensic reveal
│       │   │   ├── RewriteVariants.tsx  ← 3 side-by-side rewrites
│       │   │   └── PromptLibrary.tsx    ← Saved prompts list
│       │   │
        ├── DevilsAdvocate/
        │   ├── index.tsx            ← Mode root
        │   ├── DecisionInput.tsx    ← Decision description input
        │   ├── ChallengeCards.tsx   ← 4 adversarial challenge cards + marking review
        │   └── ReadinessScore.tsx   ← Final score + breakdown
        │
        ├── AgentBabysitter/
        │   ├── index.tsx            ← Mode root
        │   ├── WorkflowInput.tsx    ← Task description input
        │   ├── CheckpointPlan.tsx   ← Risk-mapped step list
        │   ├── StepLogger.tsx       ← Log step outputs + live coherence & drift
        │   └── RunSummary.tsx       ← Post-run plain English summary
        │
        └── Profile/
            ├── index.tsx            ← Profile dashboard root
            ├── PromptDNA.tsx        ← Prompt failure DNA bars
            ├── DecisionMap.tsx      ← Blind spot frequencies
            ├── AgentLog.tsx         ← Workflow pattern stats
            └── ImprovementScore.tsx ← Trajectory ring + breakdown
        │
        ├── hooks/                       ← Custom React hooks
        │   ├── useAnna.ts               ← Anna SDK wrapper hook
        │   ├── useProfile.ts            ← Profile read/write via APS
        │   ├── usePromptAnalysis.ts     ← Prompt Archaeology logic
        │   ├── useDecisionCritic.ts     ← Devil's Advocate logic
        │   └── useAgentSupervisor.ts    ← Agent Babysitter logic
        │
        └── store/                       ← App state
            ├── profileStore.ts          ← Zustand store for profile
            └── types.ts                 ← All TypeScript types
│       │
│       └── styles/                      ← Global styles
│           ├── globals.css              ← CSS variables + resets
│           ├── tokens.css               ← Design token system
│           └── animations.css           ← Keyframe animations
│
├── executas/                            ← Anna Executa tools (Python)
│   │
│   ├── prompt-analyzer/                 ← Executa 1: Prompt Archaeology
│   │   ├── prompt_analyzer_plugin.py    ← initialize/describe/invoke/health
│   │   ├── executa.json                 ← Anna descriptor
│   │   ├── pyproject.toml               ← Python manifest (name = tool_id)
│   │   ├── uv.lock                      ← Pinned dependencies
│   │   └── README.md
│   │
│   ├── decision-critic/                 ← Executa 2: Devil's Advocate
│   │   ├── decision_critic_plugin.py    ← initialize/describe/invoke/health
│   │   ├── executa.json
│   │   ├── pyproject.toml
│   │   ├── uv.lock
│   │   └── README.md
│   │
│   └── agent-supervisor/               ← Executa 3: Agent Babysitter
│       ├── agent_supervisor_plugin.py   ← initialize/describe/invoke/health
│       ├── executa.json
│       ├── pyproject.toml
│       ├── uv.lock
│       └── README.md
│
├── manifest.json                        ← Anna App manifest (permissions + executas)
├── app.json                             ← Anna App descriptor
└── README.md                            ← Setup + run instructions
```

---

## 4. Anna Integration Details

### 4.1 manifest.json
```json
{
  "id": "mirror-app",
  "name": "Mirror",
  "version": "1.0.0",
  "permissions": ["tools.invoke", "storage.read", "storage.write"],
  "required_executas": [
    { "tool_id": "mirror-prompt-analyzer", "min_version": "1.0.0" },
    { "tool_id": "mirror-decision-critic", "min_version": "1.0.0" },
    { "tool_id": "mirror-agent-supervisor", "min_version": "1.0.0" }
  ],
  "host_api": {
    "tools": ["invoke"],
    "storage": ["get", "set", "list", "delete"]
  },
  "csp": {
    "script-src": ["'self'"],
    "style-src": ["'self'", "'unsafe-inline'"]
  }
}
```

### 4.2 Anna SDK Initialization (main.tsx)
```typescript
// CRITICAL: Anna SDK must initialize before React mounts
declare global {
  interface Window {
    anna: AnnaSDK;
  }
}

async function bootstrap() {
  // Wait for Anna runtime to inject the `anna` object
  await waitForAnna();
  
  // Mount React only after anna is available
  const root = createRoot(document.getElementById('root')!);
  root.render(<App />);
}

function waitForAnna(): Promise<void> {
  return new Promise((resolve) => {
    if (window.anna) { resolve(); return; }
    const interval = setInterval(() => {
      if (window.anna) { clearInterval(interval); resolve(); }
    }, 50);
  });
}

bootstrap();
```

### 4.3 Tool Invocation Pattern
```typescript
// useAnna.ts hook
export async function invokeAnna(toolId: string, method: string, args: object) {
  const result = await window.anna.tools.invoke({
    tool_id: toolId,
    method: method,
    args: args
  });
  return result;
}

// Usage in a mode:
const analysis = await invokeAnna(
  'mirror-prompt-analyzer',
  'analyze_prompt',
  { prompt: userPrompt, bad_output: badOutput }
);
```

### 4.4 Executa Tool ID Matching Rule (CRITICAL)
All four of these MUST be identical strings:
1. `describe()['name']` in `*_plugin.py`
2. `name` in `pyproject.toml`
3. `tool_id` in `executa.json`
4. Tool ID minted in Anna Admin

**Example for prompt-analyzer:**
- `plugin.describe()['name']` → `"mirror-prompt-analyzer"`
- `pyproject.toml [project] name` → `"mirror-prompt-analyzer"`
- `executa.json tool_id` → `"mirror-prompt-analyzer"`
- Anna Admin tool_id → `"mirror-prompt-analyzer"`

---

## 5. Executa Plugin Structure

### 5.1 Python Plugin Template (all three executas follow this)
```python
import json
import os
import httpx
from typing import Any

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-1.5-flash"
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

def initialize(config: dict) -> None:
    """Called once when the executa starts."""
    pass

def health() -> dict:
    """Health check endpoint."""
    return {"status": "ok", "version": "1.0.0"}

def describe() -> dict:
    """Returns tool schema — name must match tool_id everywhere."""
    return {
        "name": "mirror-prompt-analyzer",  # MUST MATCH tool_id
        "version": "1.0.0",
        "tools": [
            {
                "name": "analyze_prompt",
                "description": "Forensically analyzes a failed prompt and generates fixes",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "prompt": {"type": "string", "description": "The failed prompt"},
                        "bad_output": {"type": "string", "description": "The bad output received"}
                    },
                    "required": ["prompt", "bad_output"]
                }
            }
        ]
    }

def invoke(params: dict) -> dict:
    """Routes tool calls to the right handler."""
    tool = params.get("tool")
    args = params.get("arguments", {})
    
    if tool == "analyze_prompt":
        return analyze_prompt(**args)
    
    return {"error": f"Unknown tool: {tool}"}

def call_gemini(system: str, user: str) -> str:
    """Shared Gemini API caller."""
    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
    headers = {
        "content-type": "application/json"
    }
    body = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": user}]
            }
        ],
        "systemInstruction": {
            "parts": [{"text": system}]
        },
        "generationConfig": {
            "responseMimeType": "application/json",
            "maxOutputTokens": 2048,
        }
    }
    response = httpx.post(url, json=body, headers=headers, timeout=60.0)
    response.raise_for_status()
    return response.json()["candidates"][0]["content"]["parts"][0]["text"]
```

### 5.2 executa.json Template
```json
{
  "slug": "prompt-analyzer",
  "name": "Mirror Prompt Analyzer",
  "version": "1.0.0",
  "executa_type": "tool",
  "tool_id": "mirror-prompt-analyzer",
  "type": "python",
  "enabled": true,
  "distribution": {
    "profiles": {
      "local": {
        "type": "local"
      }
    }
  }
}
```

### 5.3 pyproject.toml Template
```toml
[project]
name = "mirror-prompt-analyzer"   # MUST MATCH tool_id
version = "1.0.0"
requires-python = ">=3.11"
dependencies = [
    "httpx>=0.27.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["."]
```

---

## 6. State Schema (Anna APS)

All persistent data stored via `window.anna.storage`:

```
mirror:profile:prompt_dna          → JSON (PromptDNA object)
mirror:profile:decision_map        → JSON (DecisionMap object)  
mirror:profile:agent_log           → JSON (AgentLog object)
mirror:sessions:prompt:{uuid}      → JSON (PromptSession)
mirror:sessions:decision:{uuid}    → JSON (DecisionSession)
mirror:sessions:agent:{uuid}       → JSON (AgentSession)
mirror:library:prompts             → JSON (PromptLibrary[])
```

Full schema in SCHEMA.md.

---

## 7. Environment Variables

Required before running:

| Variable | Where set | Value |
|---|---|---|
| `GEMINI_API_KEY` | Anna Admin → Executa env | Your Gemini API key |

No other env vars required. All other config is in Anna manifest.

---

## 8. Build & Run

### Development
```bash
# Install Anna CLI
npm install -g @anna-ai/cli

# Install app dependencies
cd app && npm install

# Run in dev mode (Anna agent must be running)
anna-app dev

# In parallel — Vite dev server for UI hot reload
cd app && npm run dev
```

### Production Build
```bash
cd app && npm run build
# Output: app/dist/ — static SPA
# Anna bundles dist/ with executas automatically via anna-app push
```

---

## 9. Claude API Prompting Strategy

Each Executa uses structured JSON output prompting:

```python
system = """You are a forensic AI analyst. 
Return ONLY valid JSON. No markdown. No explanation outside the JSON.
Your response must parse with json.loads() or it fails."""
```

Every Claude call requests JSON with a defined schema. The Executa validates the response before returning to the frontend. If Claude returns malformed JSON, the Executa retries once with a stricter prompt, then returns an error object the frontend handles gracefully.

---

## 10. Error Handling

| Scenario | Frontend behavior | Executa behavior |
|---|---|---|
| Gemini API key missing | Show setup instructions modal | Return `{"error": "GEMINI_API_KEY not set"}` |
| Gemini API timeout | Show retry button after 30s | Raise HTTPx timeout, return error object |
| Malformed Gemini response | Show "Analysis incomplete" with retry | Retry once, then return partial result |
| Anna tool invoke fails | Toast error + keep inputs intact | N/A |
| APS storage read fails | Use empty profile defaults | N/A |
| Network offline | Disable Analyze buttons, show status | N/A |
