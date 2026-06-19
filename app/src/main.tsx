import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import App from './App';
import { createMockAnna } from './hooks/mockAnna';

let sdkInitAttempted = false;

/**
 * Wait for the Anna SDK to be initialized.
 * If dynamic connection has already been attempted, resolves immediately.
 */
function waitForAnna(): Promise<void> {
  return new Promise((resolve) => {
    if (window.anna || sdkInitAttempted) {
      resolve();
      return;
    }

    const interval = setInterval(() => {
      if (window.anna || sdkInitAttempted) {
        clearInterval(interval);
        resolve();
      }
    }, 50);
  });
}

async function bootstrap() {
  try {
    console.log('[mirror] Attempting to connect to Anna SDK...');
    const sdkPath = '/static/anna-apps/_sdk/latest/index.js';
    // @ts-ignore
    const { AnnaAppRuntime } = await import(/* @vite-ignore */ sdkPath);
    const anna = await AnnaAppRuntime.connect();
    window.anna = anna;
    console.log('[mirror] Anna SDK connected successfully');
  } catch (err) {
    console.error('[mirror] Anna SDK connection failed:', err);
    console.log('[mirror] Falling back to standalone mock preview mode...');
    window.anna = createMockAnna();
  } finally {
    sdkInitAttempted = true;
  }

  await waitForAnna();

  const rootEl = document.getElementById('root');
  if (!rootEl) {
    throw new Error('[mirror] #root element not found');
  }

  const root = createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
