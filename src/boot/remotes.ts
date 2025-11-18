import { registerRemotes } from '@module-federation/enhanced/runtime';
import { defineBoot } from '@quasar/app-vite/wrappers';

/**
 * Boot file that registers remote Module Federation modules.
 *
 * Fetches the remotes configuration from /remotes.json and registers
 * them with the Module Federation runtime.
 * @throws {Error} When the remotes.json file cannot be fetched.
 */
export default defineBoot(async () => {
  const response = await fetch('/remotes.json');

  if (!response.ok) {
    throw new Error('Failed to fetch manifest');
  }

  const remotesJson: Record<string, string> = await response.json();
  const remotes = Object.entries(remotesJson).map(([name, entry]) => ({
    name,
    entry,
  }));

  registerRemotes(remotes);
});
