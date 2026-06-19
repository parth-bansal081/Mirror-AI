#!/usr/bin/env python3
"""
mirror-decision-critic — Executa stdio tool plugin

Challenges decisions with structured adversarial analysis:
steelmans opposition, finds blind spots, stress-tests worst cases,
generates 5 counter-questions.

tool_id: mirror-decision-critic  (MUST match pyproject.toml name + executa.json tool_id)
"""
from __future__ import annotations

import json
import os
import sys
from typing import Any

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-1.5-flash"
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
MAX_TOKENS = 3000
TIMEOUT = 90.0

# ---------------------------------------------------------------------------
# Plugin manifest
# ---------------------------------------------------------------------------
MANIFEST: dict[str, Any] = {
    "display_name": "Mirror Decision Critic",
    "version": "1.0.0",
    "description": "Adversarially challenges decisions with structured opposition, blind-spot detection, and a Decision Readiness Score.",
    "author": "Mirror",
    "license": "MIT",
    "tags": ["mirror", "decision", "advocate", "analysis"],
    "tools": [
        {
            "name": "challenge_decision",
            "description": (
                "Runs structured adversarial analysis on a decision. "
                "Returns decision_type, 4 challenge cards, and 5 counter-questions."
            ),
            "parameters": [
                {
                    "name": "decision",
                    "type": "string",
                    "description": "The decision the user is considering, described in natural language.",
                    "required": True,
                }
            ],
        }
    ],
    "runtime": {"type": "python", "min_version": "3.11"},
}

DECISION_TYPES = ["technical", "career", "business", "financial", "personal", "other"]
BLIND_SPOT_CATEGORIES = [
    "team_impact",
    "timeline_risk",
    "tech_debt",
    "cost_underestimate",
    "expertise_gap",
    "stakeholder_miss",
    "assumption_unchecked",
    "reversibility_ignored",
    "other",
]


# ---------------------------------------------------------------------------
# Gemini API
# ---------------------------------------------------------------------------
def _call_gemini(system: str, user: str) -> str:
    try:
        import httpx
    except ImportError:
        raise RuntimeError("httpx is not installed. Run: uv sync")

    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not set.")

    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
    headers = {
        "content-type": "application/json",
    }
    body = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": user
                    }
                ]
            }
        ],
        "systemInstruction": {
            "parts": [
                {
                    "text": system
                }
            ]
        },
        "generationConfig": {
            "responseMimeType": "application/json",
            "maxOutputTokens": MAX_TOKENS,
        }
    }
    resp = httpx.post(url, json=body, headers=headers, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()["candidates"][0]["content"]["parts"][0]["text"]


def _parse_json(text: str, system: str, user: str) -> dict[str, Any]:
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
# Tool implementation
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are the world's most rigorous Devil's Advocate — your job is to find every flaw in a decision before the person commits to it.
You are not trying to be nice. You are trying to save them from a mistake.
Return ONLY valid JSON. No markdown fences. No explanation outside the JSON.
Start your response with { and end with }."""


def challenge_decision(decision: str) -> dict[str, Any]:
    if not GEMINI_API_KEY:
        # Mock mode fallback for local test
        return {
            "decision_type": "technical",
            "challenges": [
                {
                    "id": "ch_1",
                    "type": "opposition",
                    "title": "Modular Monolith Alternative",
                    "content": f"The decision to implement '{decision[:40]}...' might introduce high network latency and complex deployment workflows prematurely. A modular monolith could achieve similar isolation with a fraction of the operational cost.",
                    "blind_spot_category": None
                },
                {
                    "id": "ch_2",
                    "type": "blind_spot",
                    "title": "Underestimated Tech Debt",
                    "content": "Implementing this will lock in technical dependency debt early on, making future core refactoring of data structures extremely difficult and time-consuming.",
                    "blind_spot_category": "tech_debt"
                },
                {
                    "id": "ch_3",
                    "type": "stress_test",
                    "title": "Worst Case: Deployment Bottleneck",
                    "content": "If this change fails in production, it will cause a cascading failure across dependent systems, leading to a long service outage and requiring hours of manual rollback.",
                    "blind_spot_category": None
                },
                {
                    "id": "ch_4",
                    "type": "blind_spot",
                    "title": "Team Expertise Gap",
                    "content": "The current team has limited production experience with the operational overhead required for this architecture, leading to high risk of configuration errors.",
                    "blind_spot_category": "expertise_gap"
                },
                {
                    "id": "ch_5",
                    "type": "historical",
                    "title": "Past Execution Overhead",
                    "content": "Previous attempts to decouple database layouts led to 3x higher maintenance cost and delayed the initial release by 2 months. We must review if those conditions still apply.",
                    "blind_spot_category": "timeline_risk"
                }
            ],
            "counter_questions": [
                "What specific metric will indicate that the modular monolith is no longer viable?",
                "How will we handle distributed transaction rollbacks across microservices?",
                "Has the team done a cost-benefit analysis of cloud infrastructure overhead?",
                "Can we achieve the same boundaries by using separate packages in one repo?",
                "What is our plan for debugging cascading network errors in production?"
            ]
        }

    user_msg = f"""Perform adversarial analysis on this decision:

DECISION:
{decision}

Return a JSON object with EXACTLY this structure:
{{
  "decision_type": "<one of: technical | career | business | financial | personal | other>",
  "challenges": [
    {{
      "id": "ch_1",
      "type": "opposition",
      "title": "<short punchy title for the strongest opposing view>",
      "content": "<2-3 sentences steelmanning the strongest argument AGAINST this decision>",
      "blind_spot_category": null
    }},
    {{
      "id": "ch_2",
      "type": "blind_spot",
      "title": "<short title of the blind spot>",
      "content": "<2-3 sentences describing a critical blind spot the person has missed>",
      "blind_spot_category": "<one of: team_impact | timeline_risk | tech_debt | cost_underestimate | expertise_gap | stakeholder_miss | assumption_unchecked | reversibility_ignored | other>"
    }},
    {{
      "id": "ch_3",
      "type": "stress_test",
      "title": "<short title of the worst-case scenario>",
      "content": "<2-3 sentences describing the realistic worst-case outcome if this decision fails>",
      "blind_spot_category": null
    }},
    {{
      "id": "ch_4",
      "type": "blind_spot",
      "title": "<short title of a second blind spot>",
      "content": "<2-3 sentences describing another critical blind spot>",
      "blind_spot_category": "<one of the blind_spot_category values>"
    }},
    {{
      "id": "ch_5",
      "type": "historical",
      "title": "<short title of a historical parallel or similar warning>",
      "content": "<2-3 sentences describing a historical precedent or pattern where this decision has failed or caused issues>",
      "blind_spot_category": "<one of the blind_spot_category values>"
    }}
  ],
  "counter_questions": [
    "<Hard question #1 the person should answer before deciding>",
    "<Hard question #2>",
    "<Hard question #3>",
    "<Hard question #4>",
    "<Hard question #5>"
  ]
}}

Rules:
- decision_type MUST be one of the listed values
- challenges array must have EXACTLY 5 items in the order shown
- counter_questions must have EXACTLY 5 questions
- Be brutally honest — not harsh, but genuinely adversarial
- blind_spot_category must be one of the listed values (null for non-blind-spot types)
- Make each challenge meaningfully different — not variations of the same concern"""

    raw = _call_gemini(SYSTEM_PROMPT, user_msg)
    result = _parse_json(raw, SYSTEM_PROMPT, user_msg)

    # Validate
    if result.get("decision_type") not in DECISION_TYPES:
        result["decision_type"] = "other"

    challenges = result.get("challenges", [])
    if len(challenges) != 5:
        raise ValueError(f"Expected 5 challenges, got {len(challenges)}")

    counter_questions = result.get("counter_questions", [])
    if len(counter_questions) != 5:
        raise ValueError(f"Expected 5 counter_questions, got {len(counter_questions)}")

    # Validate blind_spot_categories
    for ch in challenges:
        if ch.get("blind_spot_category") and ch["blind_spot_category"] not in BLIND_SPOT_CATEGORIES:
            ch["blind_spot_category"] = "other"

    return result


TOOL_DISPATCH = {"challenge_decision": challenge_decision}


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
        raise ValueError(f"Unknown tool: {tool_name!r}.")

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
        f"[mirror-decision-critic] {MANIFEST['display_name']} v{MANIFEST['version']} ready",
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
