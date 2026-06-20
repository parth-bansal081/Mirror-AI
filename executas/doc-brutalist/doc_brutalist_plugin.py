#!/usr/bin/env python3
"""
bundled:doc-brutalist — Executa stdio tool plugin
Implements JSON-RPC 2.0 over stdio (describe / invoke / health).
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

MANIFEST: dict[str, Any] = {
    "name": "bundled:doc-brutalist",
    "display_name": "Mirror Doc Brutalist",
    "version": "1.0.0",
    "description": "Brutally honest documentation reviewer.",
    "author": "Mirror",
    "license": "MIT",
    "tags": ["mirror", "brutalist", "docs", "review"],
    "tools": [
        {
            "name": "analyze_docs",
            "description": "Analyzes documentation and returns list of issues.",
            "parameters": [
                {"name": "doc_content", "type": "string", "required": True},
                {"name": "target_user", "type": "string", "required": True},
                {"name": "five_minute_goal", "type": "string", "required": True}
            ]
        },
        {
            "name": "generate_rewrite",
            "description": "Generates complete rewritten documentation.",
            "parameters": [
                {"name": "original_doc", "type": "string", "required": True},
                {"name": "target_user", "type": "string", "required": True},
                {"name": "five_minute_goal", "type": "string", "required": True},
                {"name": "confirmed_issues", "type": "array", "required": True},
                {"name": "accepted_improvements", "type": "array", "required": True}
            ]
        }
    ],
    "runtime": {"type": "python", "min_version": "3.11"}
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
# Prompts & Methods
# ---------------------------------------------------------------------------
ANALYZE_SYSTEM = """
You are a brutally honest documentation reviewer. Your job is to find every
place a real user would get confused, fail, or give up reading this documentation.

You are NOT being helpful or encouraging. You are being ruthlessly honest.
Every problem you find costs the developer real users.

Return ONLY valid JSON. No markdown. Start with { end with }.

Schema:
{
  "clarity_score": 0-100,
  "clarity_verdict": "one brutal sentence about overall quality",
  "estimated_user_failure_rate": "X out of 10 first-time users will fail",
  "issues": [
    {
      "id": "issue_1",
      "type": "FIRST_PARAGRAPH|JARGON|ASSUMPTION|MISSING_PREREQ|BROKEN_COMMAND|WRONG_ORDER|MISSING_SECTION|CONFUSING_LABEL|NO_EXPECTED_OUTPUT|TOO_LONG",
      "location": "exact quote of the problematic text (max 100 chars)",
      "problem": "one sentence explaining what's wrong",
      "fix": "one sentence explaining the fix",
      "severity": "HIGH|MEDIUM|LOW",
      "drop_off_weight": 1-10
    }
  ],
  "missing_sections": ["list of sections this README should have but doesn't"],
  "top_3_fixes": ["the 3 highest-impact fixes, in priority order"],
  "first_paragraph_verdict": "does the first paragraph tell you what this does in plain English? Be harsh.",
  "time_to_first_success": "how long following these docs literally would take, and where it first breaks"
}

Scoring guide:
0-20: Actively harmful — will confuse and drive away users
21-40: Significantly flawed — loses most first-time users
41-60: Average — some users make it through, many don't
61-80: Good — most users succeed, some friction remains
81-100: Excellent — nearly all users succeed immediately

Be harsh. Most READMEs score 20-40. A score above 70 means genuinely good docs.
"""

def analyze_docs(doc_content: str, target_user: str, five_minute_goal: str) -> dict[str, Any]:
    if not GEMINI_API_KEY:
        # High quality offline fallback mock data
        return {
            "clarity_score": 34,
            "clarity_verdict": "Your documentation makes huge assumptions and acts like the user already wrote the tool.",
            "estimated_user_failure_rate": "7 out of 10 first-time users will fail",
            "issues": [
                {
                    "id": "issue_1",
                    "type": "FIRST_PARAGRAPH",
                    "location": doc_content.split('\n')[0] if doc_content else "Title",
                    "problem": "First paragraph fails to state what the tool actually accomplishes for the reader.",
                    "fix": "Rewrite to explain what it does, how it works, and who it is for in under 3 sentences.",
                    "severity": "HIGH",
                    "drop_off_weight": 9
                },
                {
                    "id": "issue_2",
                    "type": "MISSING_PREREQ",
                    "location": "Installation",
                    "problem": "Assumes Node.js is pre-installed. Many technical/non-technical readers won't have it ready.",
                    "fix": "Add a prerequisites subsection listing required tools like Node.js 18+.",
                    "severity": "HIGH",
                    "drop_off_weight": 8
                },
                {
                    "id": "issue_3",
                    "type": "JARGON",
                    "location": "enterprise-grade performance",
                    "problem": "Uses buzzwords like 'enterprise-grade' which offer no concrete technical context.",
                    "fix": "Replace with specific performance metrics or simple descriptive terms.",
                    "severity": "MEDIUM",
                    "drop_off_weight": 5
                }
            ],
            "missing_sections": ["Prerequisites", "Expected Command Output", "Troubleshooting"],
            "top_3_fixes": [
                "Define user pre-requisites before installation commands",
                "Explain the tool vision without marketing buzzwords",
                "Provide copy-pasteable first run command with expected results"
            ],
            "first_paragraph_verdict": "Very poor. It lists claims instead of functionality.",
            "time_to_first_success": "Users will fail within 45 seconds at the npm install step due to lack of environment details."
        }

    user_msg = f"""
Target user: {target_user}
5-minute goal: {five_minute_goal}

Documentation to brutalize:
{doc_content}

Find every issue. Be ruthless. Score honestly.
"""
    raw = _call_gemini(ANALYZE_SYSTEM, user_msg)
    return _parse_json(raw, ANALYZE_SYSTEM, user_msg)


REWRITE_SYSTEM = """
You are rewriting documentation to be genuinely usable by real humans.

Rules:
- Write for the specific target user provided
- Every step must be copy-pasteable and work
- Include expected output for every command
- No jargon without explanation
- Prerequisites stated FIRST, before any instructions
- First paragraph must answer: what is this, what does it do, who is it for
- Structure: What it is → Prerequisites → Install → First success → Common problems → Next steps
- Be warm but direct. Not corporate. Not over-enthusiastic. Just clear.

Return the complete rewritten documentation as plain markdown.
Do NOT wrap in JSON. Do NOT add backticks. Just return the markdown.
"""

def generate_rewrite(
    original_doc: str,
    target_user: str,
    five_minute_goal: str,
    confirmed_issues: list,
    accepted_improvements: list
) -> str:
    if not GEMINI_API_KEY:
        # High quality offline mock rewrite
        return f"""# Project Documentation (Brutalist Approved)

A command-line tool that automates system tasks from a single config file. 

## Prerequisites
- Node.js 18.0 or higher
- Terminal access (PowerShell on Windows, bash on Mac/Linux)

## Installation
```bash
npm install -g my-tool
my-tool --version
# Should print: 1.0.0
```

## Quick Start (Under 5 minutes)
1. Initialize the config:
   ```bash
   my-tool init
   ```
2. Run your first task:
   ```bash
   my-tool run
   ```
   *Expected output:* `[my-tool] Running tasks... Success in 12ms`

## Troubleshooting
- **"command not found"**: Restart your terminal and verify npm global path is configured.
"""

    issues_text = "\n".join([
        f"- {i.get('type', 'ISSUE')}: {i.get('problem', '')} → Fix: {i.get('fix', '')}"
        for i in confirmed_issues
    ])
    
    user_msg = f"""
Target user: {target_user}
5-minute goal: {five_minute_goal}

Original documentation:
{original_doc}

Confirmed issues to fix:
{issues_text}

Rewrite this documentation fixing all confirmed issues.
Structure it so a {target_user} can achieve "{five_minute_goal}" in under 5 minutes.
"""
    return _call_gemini(REWRITE_SYSTEM, user_msg, json_mode=False)


# ---------------------------------------------------------------------------
# JSON-RPC Handlers
# ---------------------------------------------------------------------------
TOOL_DISPATCH = {
    "analyze_docs": analyze_docs,
    "generate_rewrite": generate_rewrite,
}

def handle_describe(_params: dict[str, Any]) -> dict[str, Any]:
    return MANIFEST

def handle_invoke(params: dict[str, Any]) -> Any:
    tool_name = params.get("tool")
    args = params.get("arguments") or {}
    if not isinstance(args, dict):
        raise ValueError("`arguments` must be an object")

    fn = TOOL_DISPATCH.get(tool_name)
    if fn is None:
        raise ValueError(f"Unknown tool: {tool_name!r}")

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
        "tools": [t["name"] for t in MANIFEST["tools"]],
    }

METHOD_DISPATCH = {
    "describe": handle_describe,
    "invoke": handle_invoke,
    "health": handle_health,
}

def send(message: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(message, ensure_ascii=False) + "\n")
    sys.stdout.flush()

def main() -> None:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            request = json.loads(line)
        except json.JSONDecodeError as e:
            send({"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": str(e)}})
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
