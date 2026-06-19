#!/usr/bin/env python3
"""
bundled:project-genesis — Executa stdio tool plugin

Turns a developer's vague idea into 8 production-ready build documents.
Implements JSON-RPC 2.0 over stdio (describe / invoke / health).

tool_id: bundled:project-genesis  (MUST match pyproject.toml name + executa.json tool_id)
"""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from typing import Any

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-1.5-flash"
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
MAX_TOKENS = 8192
TIMEOUT = 120.0

# ---------------------------------------------------------------------------
# Plugin manifest
# ---------------------------------------------------------------------------
MANIFEST: dict[str, Any] = {
    "name": "bundled:project-genesis",
    "display_name": "Mirror Project Genesis",
    "version": "1.0.0",
    "description": "Turns any developer idea into 8 production-ready build documents.",
    "author": "Mirror",
    "license": "MIT",
    "tags": ["mirror", "genesis", "project", "documentation"],
    "tools": [
        {
            "name": "assess_brief_depth",
            "description": "Analyzes a project brief to determine how much clarification is needed.",
            "parameters": [
                {
                    "name": "brief",
                    "type": "string",
                    "description": "The developer's project idea/description.",
                    "required": True,
                }
            ],
        },
        {
            "name": "generate_questions",
            "description": "Generates adaptive clarifying questions based on brief analysis.",
            "parameters": [
                {
                    "name": "brief",
                    "type": "string",
                    "description": "The project brief.",
                    "required": True,
                },
                {
                    "name": "missing_dimensions",
                    "type": "array",
                    "description": "List of missing dimensions from assess_brief_depth.",
                    "required": True,
                },
                {
                    "name": "count",
                    "type": "integer",
                    "description": "Number of questions to generate.",
                    "required": True,
                },
            ],
        },
        {
            "name": "validate_spec",
            "description": "Produces a clean validated specification summary from the brief + Q&A answers.",
            "parameters": [
                {
                    "name": "brief",
                    "type": "string",
                    "description": "The original project brief.",
                    "required": True,
                },
                {
                    "name": "answers",
                    "type": "object",
                    "description": "Map of question_id -> answer string.",
                    "required": True,
                },
            ],
        },
        {
            "name": "generate_documents",
            "description": "Generates all 8 production-ready build documents for the project.",
            "parameters": [
                {
                    "name": "spec",
                    "type": "object",
                    "description": "The validated spec from validate_spec.",
                    "required": True,
                }
            ],
        },
    ],
    "runtime": {"type": "python", "min_version": "3.11"},
}


# ---------------------------------------------------------------------------
# Gemini API
# ---------------------------------------------------------------------------
def _call_gemini(system: str, user: str, json_mode: bool = True) -> str:
    try:
        import httpx
    except ImportError:
        raise RuntimeError("httpx is not installed. Run: uv sync")

    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not set. Add it in Anna Admin → Executa env vars.")

    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
    headers = {"content-type": "application/json"}
    body: dict[str, Any] = {
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "systemInstruction": {"parts": [{"text": system}]},
        "generationConfig": {
            "maxOutputTokens": MAX_TOKENS,
        },
    }
    if json_mode:
        body["generationConfig"]["responseMimeType"] = "application/json"

    resp = httpx.post(url, json=body, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()["candidates"][0]["content"]["parts"][0]["text"]


def _parse_json(text: str, system: str, user: str) -> dict[str, Any]:
    """Parse JSON response, retry once with stricter prompt on failure."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        cleaned = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    if cleaned.lower().startswith("json"):
        cleaned = cleaned[4:].strip()
    cleaned = cleaned.strip("`").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        strict_user = (
            user
            + "\n\nCRITICAL: Your previous response was not valid JSON. "
            "Start your response with { and end with }. Nothing else."
        )
        retry_text = _call_gemini(system, strict_user)
        retry_cleaned = retry_text.strip().strip("`").strip()
        if retry_cleaned.lower().startswith("json"):
            retry_cleaned = retry_cleaned[4:].strip()
        return json.loads(retry_cleaned)


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------
ASSESS_SYSTEM = """You are analyzing a project brief to determine how much clarification is needed.
Return ONLY valid JSON. No markdown fences. Start with { and end with }."""

ASSESS_PROMPT = """Analyze this project brief and determine how much clarification is needed.

BRIEF:
{brief}

Return ONLY valid JSON with EXACTLY this structure:
{{
  "vagueness_score": <integer 0-100>,
  "missing_dimensions": ["list of what's missing: users/platform/stack/scope/ai/team/etc"],
  "question_count_needed": <integer 3-10>,
  "what_is_clear": ["list of things already clearly stated in the brief"]
}}

vagueness_score guide:
- 0-30: Brief is detailed → 3-4 questions needed
- 31-60: Moderate detail → 5-7 questions needed
- 61-100: Very vague → 8-10 questions needed"""

QUESTIONS_SYSTEM = """You are generating adaptive clarifying questions for a developer's project brief.
Return ONLY valid JSON. No markdown fences. Start with { and end with }."""

QUESTIONS_PROMPT = """Generate adaptive clarifying questions for this project brief.

Brief: {brief}
Missing dimensions: {missing_dimensions}
Number of questions needed: {count}

Return ONLY valid JSON with EXACTLY this structure:
{{
  "questions": [
    {{
      "id": "q1",
      "question": "Who are the primary users of this app?",
      "dimension": "users",
      "why_asking": "Determines complexity and feature depth"
    }}
  ]
}}

Rules:
- Never ask about something already in the brief
- Ask the most impactful questions first
- Questions should be specific, not generic
- Each question targets exactly one missing dimension
- Generate exactly {count} questions"""

VALIDATE_SYSTEM = """You are producing a clean validated specification from a project brief and Q&A answers.
Return ONLY valid JSON. No markdown fences. Start with { and end with }."""

VALIDATE_PROMPT = """Given a project brief and answers to clarifying questions, produce a clean validated spec.

ORIGINAL BRIEF:
{brief}

ANSWERS TO CLARIFYING QUESTIONS:
{answers_str}

Return ONLY valid JSON with EXACTLY this structure:
{{
  "product_name": "short name for the project",
  "one_liner": "one sentence describing what it does",
  "users": "who uses it",
  "platform": "web/mobile/desktop/CLI/extension/etc",
  "core_action": "the one thing users must be able to do",
  "tech_stack": ["list of technologies"],
  "has_backend": true,
  "has_database": true,
  "has_ai": false,
  "ai_details": "which model/API if applicable, or empty string",
  "out_of_scope": ["explicit v1 exclusions"],
  "done_when": "definition of done",
  "deployment": "where it will be deployed",
  "solo_or_team": "solo or team"
}}"""

GENERATE_SYSTEM = """You are a senior software architect generating production-ready documentation.
Return raw markdown only — no JSON wrapper, no backticks, no code fences around the whole document.
Be concrete and specific — no placeholders, no TBD, no generic advice.
Every section must be filled with real content for THIS project."""

GENERATE_PROMPT_BASE = """Generate a complete, detailed {doc_type} for this specific project.

Project Specification:
{spec_json}

Already generated docs (for consistency):
{context}

{doc_specific_instructions}

Return the complete markdown document as a plain string.
Do NOT wrap in JSON. Do NOT add backtick fences around the entire document. Just return raw markdown."""

DOC_INSTRUCTIONS = {
    "PRD": """Generate a Product Requirements Document with these sections:
# [Project Name] — Product Requirements Document
## 1. Product Vision (2-3 sentences)
## 2. The Problem (specific pain being solved)
## 3. Users (who, their context, their goals)
## 4. Core Features (MVP only — what must work)
## 5. Out of Scope (explicit v1 exclusions)
## 6. Success Metrics (how to know it's working, with numbers)
## 7. Constraints (tech, time, budget, platform)

Include specific feature descriptions, exact user flows, concrete success metrics with numbers.""",

    "TECH_SPEC": """Generate a Technical Specification with these sections:
# [Project Name] — Technical Specification
## 1. Architecture Overview (ASCII diagram)
## 2. Tech Stack (every technology, why chosen)
## 3. Directory Structure (full file tree)
## 4. Key Components (each major component explained)
## 5. API Design (endpoints if applicable)
## 6. Third-party Integrations
## 7. Error Handling Strategy
## 8. Build & Run Instructions

Include exact package names and versions, full directory tree, ASCII architecture diagram, exact commands to run.""",

    "APP_FLOW": """Generate an App Flow document with these sections:
# [Project Name] — App Flow
## 1. Entry & Initialization
## 2. Navigation Structure (ASCII diagram)
## For each core user flow:
   ## Flow N — [Flow Name]
   - Step by step with ASCII UI mockups
   - Data flow arrows
   - State transitions

Include ASCII UI mockups for every screen, exact state transitions, data flow with arrows.""",

    "DESIGN": """Generate a Design Document with these sections:
# [Project Name] — Design Document
## 1. Design Philosophy (3 sentences)
## 2. Color System (CSS variables with exact hex values)
## 3. Typography (fonts, sizes, weights)
## 4. Component Specs (each key component with exact measurements)
## 5. Animation System (transitions, durations, easing)
## 6. Empty & Error States

Include exact CSS custom property values, specific color hex codes, font choices with fallbacks.""",

    "SCHEMA": """Generate a Data Schema document with these sections:
# [Project Name] — Data Schema
## 1. Storage Strategy
## 2. TypeScript Types (all interfaces — complete, no 'any' types)
## 3. Database Schema (if applicable — exact SQL or schema definition)
## 4. API Response Schemas
## 5. State Management Types

Include complete TypeScript interfaces with all fields typed, no 'any' types.""",

    "IMPLEMENTATION_PLAN": """Generate an Implementation Plan with these sections:
# [Project Name] — Implementation Plan
## Pre-Build Checklist (installs, accounts, API keys needed)
## Phase 0 — Scaffold (exact commands)
## Phase 1 — Foundation
## Phase N — [Feature Name]

Each phase must have:
- Goal
- Steps with exact bash/npm commands
- Verify condition (how to confirm it worked)

## Troubleshooting Reference

Include exact bash commands, specific npm package names, clear verify conditions per phase.""",

    "TRACKER": """Generate a Build Tracker with these sections:
# [Project Name] — Build Tracker
## Overall Progress
## Phase N tasks (markdown checkboxes — [ ] for each)
## Blockers Log
## Key Decisions Made
## File Creation Checklist ([ ] for every file that must be created)

Include every file that needs to be created as a checkbox item. Be exhaustive.""",

    "RULES": """Generate Agent Rules with these sections:
# [Project Name] — Agent Rules
## 1. Never stop until complete
## 2. Read docs before coding
## 3. Follow phase order exactly
## 4. [Platform-specific rules based on the tech stack in the spec]
## 5. TypeScript rules (if applicable)
## 6. CSS rules (if applicable)
## 7. Error handling rules
## 8. Final delivery definition (exact checklist of what done looks like)

Include platform-specific rules based on the tech stack. Be strict and specific.""",
}


# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------
def assess_brief_depth(brief: str) -> dict[str, Any]:
    if not GEMINI_API_KEY:
        # Mock fallback
        word_count = len(brief.split())
        if word_count > 80:
            score = 20
            count = 3
            missing = ["platform"]
        elif word_count > 40:
            score = 45
            count = 5
            missing = ["users", "platform", "stack"]
        else:
            score = 75
            count = 8
            missing = ["users", "platform", "stack", "scope", "done_when"]

        return {
            "vagueness_score": score,
            "missing_dimensions": missing,
            "question_count_needed": count,
            "what_is_clear": ["core idea"],
        }

    user_msg = ASSESS_PROMPT.format(brief=brief)
    raw = _call_gemini(ASSESS_SYSTEM, user_msg)
    result = _parse_json(raw, ASSESS_SYSTEM, user_msg)

    # Normalize
    score = int(result.get("vagueness_score", 50))
    score = max(0, min(100, score))
    result["vagueness_score"] = score

    if score <= 30:
        result["question_count_needed"] = max(3, min(4, result.get("question_count_needed", 3)))
    elif score <= 60:
        result["question_count_needed"] = max(5, min(7, result.get("question_count_needed", 5)))
    else:
        result["question_count_needed"] = max(8, min(10, result.get("question_count_needed", 8)))

    return result


def generate_questions(brief: str, missing_dimensions: list[str], count: int) -> dict[str, Any]:
    if not GEMINI_API_KEY:
        # Mock fallback
        all_questions = [
            {"id": "q1", "question": "Who are the primary users of this app?", "dimension": "users", "why_asking": "Determines complexity and feature depth"},
            {"id": "q2", "question": "What platform is this for? (web / mobile / desktop / CLI / browser extension)", "dimension": "platform", "why_asking": "Defines the technical architecture"},
            {"id": "q3", "question": "What is the ONE core action users must be able to do in v1?", "dimension": "core_action", "why_asking": "Focuses the MVP scope"},
            {"id": "q4", "question": "Do you have a preferred tech stack, or should we recommend one?", "dimension": "stack", "why_asking": "Determines technologies to use"},
            {"id": "q5", "question": "Does this need a backend and database, or is it frontend-only?", "dimension": "backend", "why_asking": "Architecture decision"},
            {"id": "q6", "question": "What is explicitly OUT of scope for v1?", "dimension": "scope", "why_asking": "Prevents scope creep"},
            {"id": "q7", "question": "What does 'done' look like — how will you know when v1 is working?", "dimension": "done_when", "why_asking": "Defines success criteria"},
            {"id": "q8", "question": "Are there any third-party APIs or services involved?", "dimension": "integrations", "why_asking": "Identifies external dependencies"},
        ]
        return {"questions": all_questions[:count]}

    user_msg = QUESTIONS_PROMPT.format(
        brief=brief,
        missing_dimensions=json.dumps(missing_dimensions),
        count=count,
    )
    raw = _call_gemini(QUESTIONS_SYSTEM, user_msg)
    result = _parse_json(raw, QUESTIONS_SYSTEM, user_msg)

    # Ensure IDs are sequential
    questions = result.get("questions", [])
    for i, q in enumerate(questions):
        q["id"] = f"q{i+1}"

    return {"questions": questions[:count]}


def validate_spec(brief: str, answers: dict[str, str]) -> dict[str, Any]:
    if not GEMINI_API_KEY:
        # Mock fallback
        return {
            "product_name": "My Project",
            "one_liner": "A tool that helps developers build faster.",
            "users": "Developers and technical users",
            "platform": "Web app (React)",
            "core_action": "Create and manage project documentation",
            "tech_stack": ["React", "TypeScript", "Node.js"],
            "has_backend": True,
            "has_database": True,
            "has_ai": False,
            "ai_details": "",
            "out_of_scope": ["Mobile app", "Team collaboration"],
            "done_when": "Core features work end-to-end without errors",
            "deployment": "Vercel",
            "solo_or_team": "solo",
        }

    answers_str = "\n".join([f"Q: {qid}\nA: {answer}" for qid, answer in answers.items()])
    user_msg = VALIDATE_PROMPT.format(brief=brief, answers_str=answers_str)
    raw = _call_gemini(VALIDATE_SYSTEM, user_msg)
    return _parse_json(raw, VALIDATE_SYSTEM, user_msg)


def generate_documents(spec: dict[str, Any]) -> dict[str, Any]:
    spec_json = json.dumps(spec, indent=2)
    doc_order = ["PRD", "TECH_SPEC", "APP_FLOW", "DESIGN", "SCHEMA", "IMPLEMENTATION_PLAN", "TRACKER", "RULES"]
    docs: dict[str, str] = {}

    for doc_type in doc_order:
        # Pass previously generated docs as context for consistency
        if docs:
            context_preview = json.dumps(
                {k: v[:600] + "..." if len(v) > 600 else v for k, v in docs.items()},
                indent=2,
            )
        else:
            context_preview = "None yet — this is the first document."

        prompt = GENERATE_PROMPT_BASE.format(
            doc_type=doc_type,
            spec_json=spec_json,
            context=context_preview,
            doc_specific_instructions=DOC_INSTRUCTIONS[doc_type],
        )

        if not GEMINI_API_KEY:
            # Mock fallback
            docs[doc_type] = f"# {spec.get('product_name', 'Project')} — {doc_type}\n\n*Mock content for {doc_type}. Connect Gemini API for real generation.*\n\nSpec: {spec.get('one_liner', '')}\n"
        else:
            content = _call_gemini(GENERATE_SYSTEM, prompt, json_mode=False)
            docs[doc_type] = content

    return {
        "documents": docs,
        "product_name": spec.get("product_name", "Your Project"),
        "generated_at": datetime.now().isoformat(),
    }


TOOL_DISPATCH = {
    "assess_brief_depth": assess_brief_depth,
    "generate_questions": generate_questions,
    "validate_spec": validate_spec,
    "generate_documents": generate_documents,
}


# ---------------------------------------------------------------------------
# JSON-RPC handlers
# ---------------------------------------------------------------------------
def handle_describe(_params: dict[str, Any]) -> dict[str, Any]:
    return MANIFEST


def handle_invoke(params: dict[str, Any]) -> Any:
    tool_name = params.get("tool")
    args = params.get("arguments") or {}
    if not isinstance(args, dict):
        raise ValueError("`arguments` must be an object")

    fn = TOOL_DISPATCH.get(tool_name)
    if fn is None:
        raise ValueError(f"Unknown tool: {tool_name!r}. Available: {list(TOOL_DISPATCH)}")

    try:
        payload = fn(**args)
    except Exception as exc:
        return {"success": False, "error": f"{type(exc).__name__}: {exc}"}

    return {"success": True, "data": payload}


def handle_health(_params: dict[str, Any]) -> dict[str, Any]:
    return {
        "status": "ok",
        "version": MANIFEST["version"],
        "api_key_set": bool(GEMINI_API_KEY),
        "model": GEMINI_MODEL,
        "tools": [t["name"] for t in MANIFEST["tools"]],
    }


METHOD_DISPATCH = {
    "describe": handle_describe,
    "invoke": handle_invoke,
    "health": handle_health,
}


# ---------------------------------------------------------------------------
# Stdio loop
# ---------------------------------------------------------------------------
def send(message: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(message, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def main() -> None:
    print(
        f"[bundled:project-genesis] {MANIFEST['display_name']} v{MANIFEST['version']} ready",
        file=sys.stderr,
    )
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            request = json.loads(line)
        except json.JSONDecodeError as e:
            send({"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": f"parse error: {e}"}})
            continue

        req_id = request.get("id")
        method = request.get("method")
        params = request.get("params") or {}
        handler = METHOD_DISPATCH.get(method)

        if handler is None:
            send({"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"method not found: {method}"}})
            continue

        try:
            result = handler(params)
            send({"jsonrpc": "2.0", "id": req_id, "result": result})
        except Exception as exc:
            send({"jsonrpc": "2.0", "id": req_id, "error": {"code": -32000, "message": str(exc)}})


if __name__ == "__main__":
    main()
