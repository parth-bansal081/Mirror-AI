/**
 * useAnna — Anna SDK wrapper hook.
 *
 * Provides typed wrappers around window.anna.tools.invoke,
 * window.anna.storage, and window.anna.window APIs.
 *
 * The `anna` object must be present before calling any methods
 * (guaranteed by waitForAnna() in main.tsx).
 */

const TOOL_IDS = {
  PROMPT_ANALYZER: 'mirror-prompt-analyzer',
  DECISION_CRITIC: 'mirror-decision-critic',
  AGENT_SUPERVISOR: 'mirror-agent-supervisor',
  LEARNING_PATH: 'bundled-learning-path',
  PROJECT_GENESIS: 'bundled:project-genesis',
} as const;

type ToolId = (typeof TOOL_IDS)[keyof typeof TOOL_IDS];

function getAnna() {
  if (!window.anna) {
    throw new Error('Anna SDK not initialized. waitForAnna() must resolve before using this hook.');
  }
  return window.anna;
}

function mapError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('api_key') || msg.includes('anthropic_api_key') || msg.includes('gemini_api_key')) {
      return 'Add your Gemini API key in Anna Admin → Executa environment variables.';
    }
    if (msg.includes('timeout')) {
      return 'Analysis timed out. Check your connection and try again.';
    }
    if (msg.includes('parse') || msg.includes('json')) {
      return 'Analysis incomplete — Gemini returned an unexpected format. Please try again.';
    }
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

/**
 * Invoke an Executa tool and return typed data.
 * Throws a user-friendly error string on failure.
 */
export async function invokeAnna<T>(
  toolId: ToolId,
  method: string,
  args: Record<string, unknown>
): Promise<T> {
  const anna = getAnna();
  
  let resolvedToolId: string = toolId;
  const toolIdsMap = typeof window !== 'undefined' ? window.__ANNA_TOOL_IDS__ : null;
  if (toolIdsMap) {
    if (toolId === TOOL_IDS.PROMPT_ANALYZER && toolIdsMap['prompt-analyzer']) {
      resolvedToolId = toolIdsMap['prompt-analyzer'];
    } else if (toolId === TOOL_IDS.DECISION_CRITIC && toolIdsMap['decision-critic']) {
      resolvedToolId = toolIdsMap['decision-critic'];
    } else if (toolId === TOOL_IDS.AGENT_SUPERVISOR && toolIdsMap['agent-supervisor']) {
      resolvedToolId = toolIdsMap['agent-supervisor'];
    } else if (toolId === TOOL_IDS.LEARNING_PATH && toolIdsMap['learning-path']) {
      resolvedToolId = toolIdsMap['learning-path'];
    } else if (toolId === TOOL_IDS.PROJECT_GENESIS && toolIdsMap['project-genesis']) {
      resolvedToolId = toolIdsMap['project-genesis'];
    }
  }

  try {
    const rawResult = await anna.tools.invoke({ tool_id: resolvedToolId, method, args });
    
    // Support both wrapped { success, data } response and raw unwrapped payload
    if (rawResult && typeof rawResult === 'object' && 'success' in rawResult) {
      const typedResult = rawResult as { success: boolean; data?: unknown; error?: string };
      if (!typedResult.success) {
        const errMsg = typedResult.error ?? 'Unknown error from Executa';
        throw new Error(errMsg);
      }
      return typedResult.data as T;
    }
    
    return rawResult as T;
  } catch (err) {
    throw new Error(mapError(err));
  }
}

/** Convenient tool ID exports */
export const TOOLS = TOOL_IDS;

// ── Storage helpers ──────────────────────────────────────────

export async function storageGet(key: string): Promise<string | null> {
  try {
    const anna = getAnna();
    const { value } = await anna.storage.get({ key });
    return value;
  } catch {
    return null;
  }
}

export async function storageSet(key: string, value: string): Promise<void> {
  const anna = getAnna();
  await anna.storage.set({ key, value });
}

export async function storageDelete(key: string): Promise<void> {
  try {
    const anna = getAnna();
    await anna.storage.delete({ key });
  } catch {
    // Non-fatal
  }
}

export async function storageGetJSON<T>(key: string, fallback: T): Promise<T> {
  const raw = await storageGet(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function storageSetJSON(key: string, value: unknown): Promise<void> {
  await storageSet(key, JSON.stringify(value));
}

// ── Window helpers ───────────────────────────────────────────

export async function setWindowTitle(title: string): Promise<void> {
  try {
    const anna = getAnna();
    await anna.window.set_title({ title });
  } catch {
    // Non-fatal — may not be connected
  }
}

// ── isConnected ──────────────────────────────────────────────

export function isAnnaConnected(): boolean {
  return typeof window !== 'undefined' && !!window.anna;
}
