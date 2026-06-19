#!/usr/bin/env python3
"""
mirror-agent-supervisor — Executa stdio tool plugin

Supervises AI agent runs: analyzes workflows for risk, assesses each step
for drift or irreversible actions, generates plain-English run summaries.

Three tool methods:
  - analyze_workflow  : takes task description → returns risk-mapped step plan
  - assess_step       : takes step output → returns coherence/drift status
  - generate_summary  : takes full run data → returns plain-English summary

tool_id: mirror-agent-supervisor  (MUST match pyproject.toml name + executa.json tool_id)
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
MAX_TOKENS = 2048
TIMEOUT = 60.0

# ---------------------------------------------------------------------------
# Plugin manifest
# ---------------------------------------------------------------------------
MANIFEST: dict[str, Any] = {
    "display_name": "Mirror Agent Supervisor",
    "version": "1.0.0",
    "description": "Supervises AI agent runs: risk-maps workflows, detects drift, gates irreversible actions.",
    "author": "Mirror",
    "license": "MIT",
    "tags": ["mirror", "agent", "supervisor", "babysitter"],
    "tools": [
        {
            "name": "analyze_workflow",
            "description": "Analyzes a multi-step agent task and returns a risk-mapped checkpoint plan.",
            "parameters": [
                {
                    "name": "task_description",
                    "type": "string",
                    "description": "Natural language description of the agent task or list of steps.",
                    "required": True,
                }
            ],
        },
        {
            "name": "assess_step",
            "description": "Assesses a single agent step output for coherence, drift, or irreversible actions.",
            "parameters": [
                {
                    "name": "task_description",
                    "type": "string",
                    "description": "The original task description.",
                    "required": True,
                },
                {
                    "name": "step_number",
                    "type": "integer",
                    "description": "The step number being assessed.",
                    "required": True,
                },
                {
                    "name": "step_description",
                    "type": "string",
                    "description": "What this step was supposed to do.",
                    "required": True,
                },
                {
                    "name": "step_output",
                    "type": "string",
                    "description": "The actual output produced by the agent for this step.",
                    "required": True,
                },
                {
                    "name": "previous_steps",
                    "type": "string",
                    "description": "JSON string of previous step results for context.",
                    "required": False,
                },
            ],
        },
        {
            "name": "generate_summary",
            "description": "Generates a plain-English summary of a completed agent run.",
            "parameters": [
                {
                    "name": "task_description",
                    "type": "string",
                    "description": "The original task description.",
                    "required": True,
                },
                {
                    "name": "steps_data",
                    "type": "string",
                    "description": "JSON string of all step results from the run.",
                    "required": True,
                },
                {
                    "name": "drift_events",
                    "type": "integer",
                    "description": "Number of drift events detected during the run.",
                    "required": True,
                },
                {
                    "name": "approvals_given",
                    "type": "integer",
                    "description": "Number of irreversible actions approved.",
                    "required": True,
                },
                {
                    "name": "rejections",
                    "type": "integer",
                    "description": "Number of irreversible actions rejected.",
                    "required": True,
                },
            ],
        },
    ],
    "runtime": {"type": "python", "min_version": "3.11"},
}

RISK_LEVELS = ["low", "medium", "high", "irreversible"]
STEP_STATUSES = ["coherent", "drifting", "irreversible_detected"]


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
            + "\n\nCRITICAL: Invalid JSON. Start with { end with }. Nothing else."
        )
        retry = _call_gemini(system, strict_user)
        r = retry.strip().strip("`").strip()
        if r.lower().startswith("json"):
            r = r[4:].strip()
        return json.loads(r)


# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are an expert AI workflow risk analyst and supervisor.
Return ONLY valid JSON. No markdown fences. No text outside the JSON object.
Start your response with { and end with }."""


def analyze_workflow(task_description: str) -> dict[str, Any]:
    if not GEMINI_API_KEY:
        # Mock mode fallback for local test
        return {
            "steps": [
                {
                    "step_number": 1,
                    "description": "Scrape research papers and document PDFs from public web links.",
                    "risk_level": "low",
                    "risk_reason": "Reads public web data; no write actions or destructive API calls.",
                    "is_irreversible": False,
                    "irreversible_action": None
                },
                {
                    "step_number": 2,
                    "description": "Synthesize findings and compile them into a final report draft.",
                    "risk_level": "medium",
                    "risk_reason": "Generates content; mistakes could affect quality, but can be edited.",
                    "is_irreversible": False,
                    "irreversible_action": None
                },
                {
                    "step_number": 3,
                    "description": "Publish the final draft to the public blog platform.",
                    "risk_level": "irreversible",
                    "risk_reason": "Sends content to a public site, which cannot be undone without leaving trace metadata.",
                    "is_irreversible": True,
                    "irreversible_action": "Publish draft report to production blog feed"
                },
                {
                    "step_number": 4,
                    "description": "Send email notifications to all newsletter subscribers.",
                    "risk_level": "irreversible",
                    "risk_reason": "Sends outbound emails to users; once sent, they cannot be unsent.",
                    "is_irreversible": True,
                    "irreversible_action": "Email 5,000 active newsletter subscribers"
                }
            ]
        }

    user_msg = f"""Analyze this AI agent task and create a risk-mapped checkpoint plan.

TASK:
{task_description}

Break the task into discrete steps and assess the risk of each step.
An "irreversible" step is one that cannot be undone: sending emails, deleting files,
posting content, making purchases, submitting forms, etc.

Return a JSON object with EXACTLY this structure:
{{
  "steps": [
    {{
      "step_number": 1,
      "description": "<what this step does>",
      "risk_level": "<one of: low | medium | high | irreversible>",
      "risk_reason": "<why this risk level was assigned>",
      "is_irreversible": false,
      "irreversible_action": null
    }},
    {{
      "step_number": 2,
      "description": "<what step 2 does>",
      "risk_level": "irreversible",
      "risk_reason": "<why it's irreversible>",
      "is_irreversible": true,
      "irreversible_action": "<specific action that cannot be undone, e.g. 'Send email to all subscribers'>"
    }}
  ]
}}

Rules:
- Extract logical steps from the task description (3-8 steps typically)
- risk_level MUST be one of: low, medium, high, irreversible
- is_irreversible is true ONLY when risk_level is "irreversible"
- irreversible_action is the specific action string (null if not irreversible)
- Be conservative: if in doubt, rate higher risk"""

    raw = _call_gemini(SYSTEM_PROMPT, user_msg)
    result = _parse_json(raw, SYSTEM_PROMPT, user_msg)

    steps = result.get("steps", [])
    if not steps:
        raise ValueError("No steps returned from workflow analysis")

    # Validate and normalize
    for i, step in enumerate(steps):
        if step.get("risk_level") not in RISK_LEVELS:
            step["risk_level"] = "medium"
        if step["risk_level"] == "irreversible":
            step["is_irreversible"] = True
        else:
            step["is_irreversible"] = False
            step["irreversible_action"] = None
        step.setdefault("step_number", i + 1)

    return result


def assess_step(
    task_description: str,
    step_number: int,
    step_description: str,
    step_output: str,
    previous_steps: str = "",
) -> dict[str, Any]:
    if not GEMINI_API_KEY:
        # Mock mode fallback for local test
        out_lower = step_output.lower()
        if "drift" in out_lower or "error" in out_lower or "off track" in out_lower:
            return {
                "status": "drifting",
                "confidence_score": 35,
                "drift_reason": "Agent output indicates drift or unexpected execution path.",
                "irreversible_action": None,
                "assessment_notes": "Step assessment flagged drift."
            }
        elif "delete" in out_lower or "send" in out_lower or "publish" in out_lower or "post" in out_lower:
            return {
                "status": "irreversible_detected",
                "confidence_score": 90,
                "drift_reason": None,
                "irreversible_action": f"Action requested: {step_description}",
                "assessment_notes": "Irreversible action detected in step output."
            }
        else:
            return {
                "status": "coherent",
                "confidence_score": 95,
                "drift_reason": None,
                "irreversible_action": None,
                "assessment_notes": "Step completed successfully and remains coherent."
            }

    prev_context = ""
    if previous_steps:
        try:
            prev_data = json.loads(previous_steps)
            prev_context = f"\nPREVIOUS STEPS CONTEXT:\n{json.dumps(prev_data, indent=2)}"
        except Exception:
            prev_context = f"\nPrevious steps: {previous_steps}"

    user_msg = f"""Assess this AI agent step output for coherence, drift, or irreversible actions.

ORIGINAL TASK: {task_description}
STEP {step_number}: {step_description}{prev_context}

STEP OUTPUT:
{step_output}

Determine:
1. Is this output COHERENT (on-track, matches what step was supposed to do)?
2. Is there DRIFT (output is off-topic, contradicts task goals, or shows signs of hallucination)?
3. Is there an IRREVERSIBLE ACTION being taken or implied (sending, deleting, posting, submitting)?

Return a JSON object with EXACTLY this structure:
{{
  "status": "<one of: coherent | drifting | irreversible_detected>",
  "confidence_score": <integer 0-100 representing confidence the step is on-track>,
  "drift_reason": "<if status is drifting: explain what went wrong. Otherwise null>",
  "irreversible_action": "<if status is irreversible_detected: the specific action. Otherwise null>",
  "assessment_notes": "<1 sentence summarizing your assessment>"
}}

Rules:
- status MUST be one of the three values
- confidence_score: 100 = perfectly on track, 0 = completely off track
- If irreversible_detected: confidence_score can still be high (it's on track but needs approval)
- Be specific in drift_reason and irreversible_action"""

    raw = _call_gemini(SYSTEM_PROMPT, user_msg)
    result = _parse_json(raw, SYSTEM_PROMPT, user_msg)

    if result.get("status") not in STEP_STATUSES:
        result["status"] = "coherent"

    score = result.get("confidence_score", 75)
    result["confidence_score"] = max(0, min(100, int(score)))

    return result


def generate_summary(
    task_description: str,
    steps_data: str,
    drift_events: int,
    approvals_given: int,
    rejections: int,
) -> dict[str, Any]:
    if not GEMINI_API_KEY:
        # Mock mode fallback for local test
        return {
            "summary": f"The agent completed the task: '{task_description[:50]}...'. Analyzed steps logged. During the run, we detected {drift_events} drift events. The operator approved {approvals_given} irreversible actions and rejected {rejections}.",
            "pattern_description": "Scrape → Compile → Publish → Email",
            "risk_classification": "high" if approvals_given > 0 or rejections > 0 else "medium",
            "key_outcomes": [
                "Scraped public information and drafted report.",
                f"Resolved {approvals_given} irreversible steps.",
                f"Enforced safety constraints by rejecting {rejections} actions."
            ]
        }

    try:
        steps = json.loads(steps_data)
        steps_str = json.dumps(steps, indent=2)
    except Exception:
        steps_str = steps_data

    user_msg = f"""Generate a plain-English summary of this completed AI agent run.

ORIGINAL TASK: {task_description}

STEPS COMPLETED:
{steps_str}

RUN STATISTICS:
- Drift events detected: {drift_events}
- Irreversible actions approved: {approvals_given}
- Irreversible actions rejected: {rejections}

Return a JSON object with EXACTLY this structure:
{{
  "summary": "<3-5 sentences in plain English summarizing what happened, what succeeded, what failed, and any notable events>",
  "pattern_description": "<short workflow pattern label like 'Research → Summarize → Report' or 'Data collection → Analysis → Email'>",
  "risk_classification": "<one of: low | medium | high | irreversible>",
  "key_outcomes": [
    "<key outcome #1>",
    "<key outcome #2>"
  ]
}}

Rules:
- summary must be readable by a non-technical person
- pattern_description should capture the workflow type concisely (3-6 words with arrows)
- risk_classification reflects the overall risk level of this type of workflow
- key_outcomes: 2-4 bullet points of what actually happened"""

    raw = _call_gemini(SYSTEM_PROMPT, user_msg)
    result = _parse_json(raw, SYSTEM_PROMPT, user_msg)

    if result.get("risk_classification") not in RISK_LEVELS:
        result["risk_classification"] = "medium"

    return result


TOOL_DISPATCH = {
    "analyze_workflow": analyze_workflow,
    "assess_step": assess_step,
    "generate_summary": generate_summary,
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
        f"[mirror-agent-supervisor] {MANIFEST['display_name']} v{MANIFEST['version']} ready",
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
