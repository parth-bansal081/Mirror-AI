#!/usr/bin/env python3
"""
bundled-learning-path — Executa stdio tool plugin

Generates 5 questions, assesses baseline level, creates weekly curricula,
and evaluates checkpoints using Gemini API.
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
MAX_TOKENS = 2548
TIMEOUT = 75.0

# ---------------------------------------------------------------------------
# Plugin manifest
# ---------------------------------------------------------------------------
MANIFEST: dict[str, Any] = {
    "display_name": "Learning Path Negotiator",
    "version": "1.0.0",
    "description": "Custom educational roadmap generator and knowledge assessor.",
    "author": "Mirror",
    "license": "MIT",
    "tags": ["mirror", "education", "learning-path", "curriculum"],
    "tools": [
        {
            "name": "generate_questions",
            "description": "Generates 5 targeted baseline assessment questions about a topic.",
            "parameters": [
                {
                    "name": "topic",
                    "type": "string",
                    "description": "The subject/topic the user wants to learn.",
                    "required": True,
                },
                {
                    "name": "goal",
                    "type": "string",
                    "description": "The user's goal/motivation for learning.",
                    "required": True,
                },
            ],
        },
        {
            "name": "assess_baseline",
            "description": "Assesses knowledge level and gaps from baseline answers.",
            "parameters": [
                {
                    "name": "topic",
                    "type": "string",
                    "description": "The learning topic.",
                    "required": True,
                },
                {
                    "name": "answers",
                    "type": "array",
                    "description": "List of objects with 'question' and 'answer' strings.",
                    "required": True,
                },
            ],
        },
        {
            "name": "generate_curriculum",
            "description": "Generates a customized week-by-week curriculum timeline.",
            "parameters": [
                {
                    "name": "topic",
                    "type": "string",
                    "description": "The learning topic.",
                    "required": True,
                },
                {
                    "name": "goal",
                    "type": "string",
                    "description": "The user's motivation goal.",
                    "required": True,
                },
                {
                    "name": "level",
                    "type": "string",
                    "description": "Determined knowledge level (beginner/intermediate/advanced).",
                    "required": True,
                },
                {
                    "name": "known_topics",
                    "type": "array",
                    "description": "List of topics/subtopics the user already knows.",
                    "required": False,
                },
            ],
        },
        {
            "name": "evaluate_checkpoint",
            "description": "Evaluates a checkpoint answer and highlights areas to review.",
            "parameters": [
                {
                    "name": "topic",
                    "type": "string",
                    "description": "The learning topic.",
                    "required": True,
                },
                {
                    "name": "question",
                    "type": "string",
                    "description": "The checkpoint question asked.",
                    "required": True,
                },
                {
                    "name": "user_answer",
                    "type": "string",
                    "description": "The user's short-answer response.",
                    "required": True,
                },
            ],
        },
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
# Tool implementations
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are a professional educational assessor and custom curriculum designer.
Return ONLY valid JSON. No markdown fences. No explanation outside the JSON.
Start your response with { and end with }."""


def generate_questions(topic: str, goal: str) -> dict[str, Any]:
    if not GEMINI_API_KEY:
        # Fallback Mock
        return {
            "questions": [
                f"What problem does {topic} solve that older paradigms don't?",
                f"What's the difference between a beginner's and an expert's approach to {topic}?",
                f"How would you diagnose a failure or bottle-neck when using {topic}?",
                f"What happens to execution flow or performance under high load in {topic}?",
                f"When would you explicitly decide NOT to use {topic}?"
            ]
        }

    user_msg = f"""Generate exactly 5 targeted short-answer questions to assess what a user already knows about the topic: '{topic}' with goal: '{goal}'.
These should not be multiple-choice. They should reveal actual knowledge depth through open short-answer questions.

Return a JSON object with EXACTLY this structure:
{{
  "questions": [
    "<Question 1>",
    "<Question 2>",
    "<Question 3>",
    "<Question 4>",
    "<Question 5>"
  ]
}}"""

    raw = _call_gemini(SYSTEM_PROMPT, user_msg)
    return _parse_json(raw, SYSTEM_PROMPT, user_msg)


def assess_baseline(topic: str, answers: list[dict[str, str]]) -> dict[str, Any]:
    if not GEMINI_API_KEY:
        # Fallback Mock
        return {
            "level": "intermediate",
            "what_they_know": [
                "Understands the core use-case and main boundaries.",
                "Knows standard terminology and structural definitions."
            ],
            "what_they_dont_know": [
                "Lacks depth in operational limits and scaling mechanisms.",
                "Unclear on specialized structures and failover strategies."
            ]
        }

    answers_str = json.dumps(answers, indent=2)
    user_msg = f"""Analyze the user's answers to the baseline assessment questions for the topic: '{topic}'.
Determine their knowledge level ('beginner' | 'intermediate' | 'advanced') and list what they know and what they don't know based on their explanations.

ANSWERS PROVIDED:
{answers_str}

Return a JSON object with EXACTLY this structure:
{{
  "level": "<one of: beginner | intermediate | advanced>",
  "what_they_know": [
    "<concept or skill they proved they understand #1>",
    "<concept or skill they proved they understand #2>"
  ],
  "what_they_dont_know": [
    "<knowledge gap or missed concept #1>",
    "<knowledge gap or missed concept #2>"
  ]
}}"""

    raw = _call_gemini(SYSTEM_PROMPT, user_msg)
    return _parse_json(raw, SYSTEM_PROMPT, user_msg)


def generate_curriculum(
    topic: str, goal: str, level: str, known_topics: list[str] | None = None
) -> dict[str, Any]:
    known_topics = known_topics or []
    if not GEMINI_API_KEY:
        # Fallback Mock
        return {
            "level": level.capitalize() + " to Advanced",
            "goal": goal,
            "estimated_time": "3 weeks",
            "weeks": [
                {
                    "week": 1,
                    "title": "CORE CONCEPTS",
                    "topics": [
                        {"title": f"Intro to {topic} basics", "known": "core" in "".join(known_topics).lower(), "key": "intro"},
                        {"title": f"Configuring {topic} environments", "known": False, "key": "config"},
                        {"title": f"Resource limits and settings", "known": False, "key": "limits"}
                    ]
                },
                {
                    "week": 2,
                    "title": "ADVANCED OPERATIONS",
                    "topics": [
                        {"title": f"Scaling out {topic} nodes", "known": False, "key": "scaling"},
                        {"title": f"Failures & disaster recovery", "known": False, "key": "dr"},
                        {"title": f"State persistence & Storage", "known": False, "key": "state"}
                    ]
                },
                {
                    "week": 3,
                    "title": "interview & prep",
                    "topics": [
                        {"title": f"Common interview scenarios for {topic}", "known": False, "key": "interview"},
                        {"title": f"Debugging production scenarios", "known": False, "key": "debugging"}
                    ]
                }
            ]
        }

    known_str = ", ".join(known_topics)
    user_msg = f"""Generate a customized 3-week study roadmap for learning '{topic}' with goal: '{goal}'.
Baseline level: {level}.
User already knows (skip/mark these): {known_str}

Return a JSON object with EXACTLY this structure:
{{
  "level": "<roadmap difficulty range, e.g. 'Intermediate → Production-Ready'>",
  "goal": "{goal}",
  "estimated_time": "3 weeks",
  "weeks": [
    {{
      "week": 1,
      "title": "<Week 1 Title, e.g. CORE CONCEPTS>",
      "topics": [
        {{
          "title": "<subtopic title>",
          "known": <true if this overlaps with known_topics, otherwise false>,
          "key": "<unique short lowercase identifier, e.g. 'pods'>"
        }}
      ]
    }},
    {{
      "week": 2,
      "title": "<Week 2 Title, e.g. CLUSTER OPERATIONS>",
      "topics": [
        {{
          "title": "<subtopic title>",
          "known": false,
          "key": "<unique key>"
        }}
      ]
    }},
    {{
      "week": 3,
      "title": "<Week 3 Title, e.g. INTERVIEW PREP>",
      "topics": [
        {{
          "title": "<subtopic title>",
          "known": false,
          "key": "<unique key>"
        }}
      ]
    }}
  ]
}}"""

    raw = _call_gemini(SYSTEM_PROMPT, user_msg)
    return _parse_json(raw, SYSTEM_PROMPT, user_msg)


def evaluate_checkpoint(topic: str, question: str, user_answer: str) -> dict[str, Any]:
    if not GEMINI_API_KEY:
        # Fallback Mock
        return {
            "evaluation": "correct",
            "explanation": "You correctly identified the main difference and explained the underlying mechanism clearly.",
            "what_to_review": "No review needed for this subtopic. Ready to move forward."
        }

    user_msg = f"""Evaluate the user's short-answer to this checkup question for topic '{topic}':

QUESTION:
{question}

USER'S ANSWER:
{user_answer}

Assess if their answer is correct, partial, or incorrect.

Return a JSON object with EXACTLY this structure:
{{
  "evaluation": "<one of: correct | partial | incorrect>",
  "explanation": "<1-3 sentences explaining what was good or what was missing in their answer>",
  "what_to_review": "<if partial or incorrect, what specific concept to review. If correct, state they are ready to proceed>"
}}"""

    raw = _call_gemini(SYSTEM_PROMPT, user_msg)
    return _parse_json(raw, SYSTEM_PROMPT, user_msg)


TOOL_DISPATCH = {
    "generate_questions": generate_questions,
    "assess_baseline": assess_baseline,
    "generate_curriculum": generate_curriculum,
    "evaluate_checkpoint": evaluate_checkpoint,
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
        f"[bundled-learning-path] {MANIFEST['display_name']} v{MANIFEST['version']} ready",
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
