#!/usr/bin/env python3
"""
mirror-prompt-analyzer — Executa stdio tool plugin

Forensically analyzes why a prompt failed and generates 3 targeted rewrites.
Implements JSON-RPC 2.0 over stdio (describe / invoke / health).

tool_id: mirror-prompt-analyzer  (MUST match pyproject.toml name + executa.json tool_id)
"""
from __future__ import annotations

import json
import os
import sys
import time
from typing import Any

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-1.5-flash"
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
MAX_TOKENS = 2048
TIMEOUT = 60.0

# ---------------------------------------------------------------------------
# Plugin manifest
# ---------------------------------------------------------------------------
MANIFEST: dict[str, Any] = {
    "display_name": "Mirror Prompt Analyzer",
    "version": "1.0.0",
    "description": "Forensically analyzes failed AI prompts and generates targeted rewrites.",
    "author": "Mirror",
    "license": "MIT",
    "tags": ["mirror", "prompt", "archaeology", "analysis"],
    "tools": [
        {
            "name": "analyze_prompt",
            "description": (
                "Forensically analyzes a failed prompt + bad output. "
                "Returns failure_type, assumptions the AI made, and 3 rewrite variants."
            ),
            "parameters": [
                {
                    "name": "prompt",
                    "type": "string",
                    "description": "The original failed prompt text.",
                    "required": True,
                },
                {
                    "name": "bad_output",
                    "type": "string",
                    "description": "The bad/unexpected output produced by the AI.",
                    "required": True,
                },
            ],
        }
    ],
    "runtime": {"type": "python", "min_version": "3.11"},
}


# ---------------------------------------------------------------------------
# Gemini API
# ---------------------------------------------------------------------------
def _call_gemini(system: str, user: str) -> str:
    try:
        import httpx
    except ImportError:
        raise RuntimeError("httpx is not installed. Run: uv sync")

    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not set. Add it in Anna Admin → Executa env vars.")

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
    """Parse JSON response, retry once with stricter prompt on failure."""
    cleaned = text.strip()
    # Strip markdown fences
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        # Remove first and last fence lines
        cleaned = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    if cleaned.lower().startswith("json"):
        cleaned = cleaned[4:].strip()
    cleaned = cleaned.strip("`").strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Retry once with stricter prompt
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
SYSTEM_PROMPT = """You are a forensic AI analyst specializing in prompt failure diagnosis.
Return ONLY valid JSON. No markdown fences. No explanation outside the JSON object.
Your response must be parseable by json.loads() or it fails.
Start your response with { and end with }."""

FAILURE_TYPES = [
    "ambiguity",
    "missing_context",
    "conflicting_instructions",
    "wrong_format",
    "scope_too_broad",
    "scope_too_narrow",
    "no_examples",
    "unknown",
]


def analyze_prompt(prompt: str, bad_output: str) -> dict[str, Any]:
    if not GEMINI_API_KEY:
        # Mock mode fallback for local test
        sub_scores = {
            "clarity": 65,
            "specificity": 40,
            "context": 25,
            "format_guidance": 10
        }
        integrity_score = int(sum(sub_scores.values()) / 4)
        return {
            "failure_type": "ambiguity",
            "failure_explanation": "The prompt lacked specific structure and formatting constraints, leading the model to output conversational text rather than a structured response.",
            "integrity_score": integrity_score,
            "sub_scores": sub_scores,
            "diagnosis_summary": f"Your prompt scored {integrity_score}/100 — primarily failing on context and format guidance. The AI had to guess both what you needed and how to present it.",
            "assumptions": [
                {
                    "assumption": "The user preferred a conversational tone over structured lists.",
                    "reality": "The user wanted short, clear markdown bullet points.",
                    "impact": "Conversational introductory text was included, cluttering the output."
                },
                {
                    "assumption": "The length of the output did not matter.",
                    "reality": "The output needed to be concise and under 50 words.",
                    "impact": "The response was overly verbose and took longer to process."
                },
                {
                    "assumption": "No specific data formatting or schema was required.",
                    "reality": "Strict adherence to a structured markdown representation was needed.",
                    "impact": "The content did not follow any formal layout."
                }
            ],
            "rewrites": [
                {
                    "id": "A",
                    "strategy": "Format-First",
                    "fixes": ["format_guidance", "specificity"],
                    "rewritten_prompt": f"Based on the following instruction, produce exactly 3 markdown bullet points summarizing the text. No chat intro or outro:\n\n{prompt}",
                    "predicted_output": "The model will output exactly three clean markdown bullet points containing the key insights."
                },
                {
                    "id": "B",
                    "strategy": "Context-First",
                    "fixes": ["context", "clarity"],
                    "rewritten_prompt": f"Follow this exact format:\nInput: summarize data\nOutput: [A, B, C]\n\nInput: {prompt}\nOutput:",
                    "predicted_output": "A formatted list matching the structure and brevity of the few-shot example."
                },
                {
                    "id": "C",
                    "strategy": "Constraint-First",
                    "fixes": ["specificity", "format_guidance"],
                    "rewritten_prompt": f"You are a professional copywriter. Condense this query into a single punchy sentence under 40 words:\n\n{prompt}",
                    "predicted_output": "A highly readable, single-sentence summary fitting within the strict limit."
                }
            ],
            "pattern_warning": None
        }

    user_msg = f"""Analyze this failed AI prompt and its bad output.

FAILED PROMPT:
{prompt}

BAD OUTPUT RECEIVED:
{bad_output}

Return a JSON object with EXACTLY this structure:
{{
  "failure_type": "<one of: ambiguity | missing_context | conflicting_instructions | wrong_format | scope_too_broad | scope_too_narrow | no_examples | unknown>",
  "failure_explanation": "<1-2 sentences explaining exactly why this prompt produced the bad output>",
  "integrity_score": <overall integrity score 0-100, must be the average of the 4 sub_scores>,
  "sub_scores": {{
    "clarity": <clarity score 0-100>,
    "specificity": <specificity score 0-100>,
    "context": <context score 0-100>,
    "format_guidance": <format_guidance score 0-100>
  }},
  "diagnosis_summary": "<a one-line diagnosis summary sentence in italic>",
  "assumptions": [
    {{
      "assumption": "<what AI assumed>",
      "reality": "<what you actually meant>",
      "impact": "<how this caused the bad output>"
    }}
  ],
  "rewrites": [
    {{
      "id": "A",
      "strategy": "Format-First",
      "fixes": ["format_guidance", "specificity"],
      "rewritten_prompt": "<the full improved prompt text>",
      "predicted_output": "<what the AI would likely return with this prompt, 1-2 sentences>"
    }},
    {{
      "id": "B",
      "strategy": "Context-First",
      "fixes": ["context", "clarity"],
      "rewritten_prompt": "<the full improved prompt text>",
      "predicted_output": "<predicted output>"
    }},
    {{
      "id": "C",
      "strategy": "Constraint-First",
      "fixes": ["specificity", "format_guidance"],
      "rewritten_prompt": "<the full improved prompt text>",
      "predicted_output": "<predicted output>"
    }}
  ],
  "pattern_warning": null
}}

Rules for scores:
Calculate integrity_score as the average of the 4 sub_scores.
For sub_scores:
- clarity: 0-100, how clearly the core intent was stated
- specificity: 0-100, how specific and constrained the requirements were  
- context: 0-100, how much relevant background context was provided
- format_guidance: 0-100, whether output format, length, tone were specified

Be honest and harsh. Most prompts score below 60. A prompt like "write code" scores:
clarity=20, specificity=10, context=5, format_guidance=0, overall=9.
A well-crafted prompt with context, constraints, and format guidance scores 75-90.

Ensure assumptions is an array of 2-4 objects with fields assumption, reality, and impact.
Each rewrite must follow the corresponding strategy name and ID.
Do not wrap in markdown fences. Return ONLY the JSON object."""

    raw = _call_gemini(SYSTEM_PROMPT, user_msg)
    result = _parse_json(raw, SYSTEM_PROMPT, user_msg)

    # Validate failure_type
    if result.get("failure_type") not in FAILURE_TYPES:
        result["failure_type"] = "unknown"

    # Calculate overall integrity score as average of the 4 sub-scores
    sub = result.get("sub_scores", {})
    if sub and isinstance(sub, dict):
        clarity = sub.get("clarity", 0)
        specificity = sub.get("specificity", 0)
        context = sub.get("context", 0)
        format_guidance = sub.get("format_guidance", 0)
        result["integrity_score"] = int((clarity + specificity + context + format_guidance) / 4)

    # Ensure rewrites array has 3 items
    rewrites = result.get("rewrites", [])
    if len(rewrites) != 3:
        raise ValueError(f"Expected 3 rewrites, got {len(rewrites)}")

    return result


TOOL_DISPATCH = {"analyze_prompt": analyze_prompt}


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
    key_set = bool(GEMINI_API_KEY)
    return {
        "status": "ok",
        "version": MANIFEST["version"],
        "api_key_set": key_set,
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
        f"[mirror-prompt-analyzer] {MANIFEST['display_name']} v{MANIFEST['version']} ready",
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
