/**
 * Anna App Runtime SDK type declarations.
 *
 * The `anna` object is injected into the global scope by the Anna UI Runtime
 * before the bundle loads. We wait for it via waitForAnna() in main.tsx.
 *
 * API surface verified against matrix-nexus anna_app_rpc_dispatcher.py.
 */

export interface AnnaToolsAPI {
  /** Invoke a bundled or required Executa tool. */
  invoke(params: {
    tool_id: string;
    method: string;
    args: Record<string, unknown>;
  }): Promise<{ success: boolean; data?: unknown; error?: string }>;
  /** List available tools. */
  list(): Promise<{ tools: { tool_id: string; display_name: string }[] }>;
}

export interface AnnaStorageAPI {
  /** Read a value from Anna App Persistent Storage. */
  get(params: { key: string }): Promise<{ value: string | null }>;
  /** Write a value to Anna App Persistent Storage. */
  set(params: { key: string; value: string }): Promise<void>;
  /** Delete a key from Anna App Persistent Storage. */
  delete(params: { key: string }): Promise<void>;
}

export interface AnnaWindowAPI {
  /** Signal that the app is ready to receive input. */
  ready(): Promise<void>;
  /** Update the window title bar. */
  set_title(params: { title: string }): Promise<void>;
  /** Resize the app window. */
  resize(params: { w: number; h: number }): Promise<void>;
  /** Close the app window. */
  close(params?: { reason?: string }): Promise<void>;
}

export interface AnnaChatAPI {
  /** Write a message into the active chat. */
  write_message(params: { role: 'user' | 'assistant'; content: string }): Promise<void>;
}

export interface AnnaSDK {
  tools: AnnaToolsAPI;
  storage: AnnaStorageAPI;
  window: AnnaWindowAPI;
  chat: AnnaChatAPI;
}

declare global {
  interface Window {
    anna: AnnaSDK;
    /** Populated by anna-tool-ids.js at publish time. */
    __ANNA_TOOL_IDS__?: Record<string, string>;
  }
}

export {};
