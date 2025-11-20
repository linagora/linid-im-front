import { defineBoot } from '@quasar/app-vite/wrappers';
import { loadRemote } from '@module-federation/enhanced/runtime';
import type {
  ModuleLifecycleResult,
  RemoteModule,
  ModuleHostConfig,
} from 'src/types/module-lifecycle';
import { ModuleLifecyclePhase } from 'src/types/module-lifecycle';
import type { App } from 'vue';

/**
 * Registry of loaded remote modules.
 *
 * Maps module IDs to their RemoteModule instances.
 */
const moduleRegistry = new Map<string, RemoteModule>();

/**
 * Registry of module configurations from host.
 *
 * Maps module IDs to their ModuleHostConfig.
 */
const moduleConfigRegistry = new Map<string, ModuleHostConfig>();

/**
 * Current lifecycle phase being executed.
 *
 * Null when no phase is active.
 */
let currentPhase: ModuleLifecyclePhase | null = null;

/**
 * Boot file that initializes the module lifecycle management system.
 *
 * IMPORTANT: This boot file must run AFTER the 'remotes' boot file
 * to ensure all Module Federation remotes are registered before loading modules.
 *
 * This orchestrates the loading and initialization of all business modules
 * by executing the five lifecycle phases in sequence.
 * @param app - The Vue application instance.
 */
export default defineBoot(async ({ app }) => {
  await initializeModuleLifecycle(app);
});

/**
 * Gets the current lifecycle phase.
 *
 * Useful for debugging or conditional logic based on lifecycle state.
 * @returns The current phase or null if no phase is active.
 */
export function getCurrentPhase(): ModuleLifecyclePhase | null {
  return currentPhase;
}

/**
 * Gets all registered modules.
 *
 * Returns a read-only view of the module registry.
 * @returns Map of module IDs to module instances.
 */
export function getRegisteredModules(): ReadonlyMap<string, RemoteModule> {
  return moduleRegistry;
}

/**
 * Gets the host configuration for a specific module.
 * @param moduleId - The module ID to look up.
 * @returns The host configuration or undefined if not found.
 */
export function getModuleConfig(
  moduleId: string
): ModuleHostConfig | undefined {
  return moduleConfigRegistry.get(moduleId);
}

/**
 * Initializes the module lifecycle management system.
 *
 * This function orchestrates the entire lifecycle:
 * 1. Load module configurations from /config directory
 * 2. Load all modules via Module Federation
 * 3. Execute the five lifecycle phases in sequence.
 * @param app - The Vue application instance.
 */
async function initializeModuleLifecycle(app: App): Promise<void> {
  console.log('[Module Lifecycle] Starting module lifecycle initialization');

  const moduleConfigs = await loadModuleConfigs();

  if (moduleConfigs.length === 0) {
    console.log('[Module Lifecycle] No enabled modules found');
    return;
  }

  for (const moduleConfig of moduleConfigs) {
    await loadAndRegisterModule(
      moduleConfig.remoteName,
      './lifecycle',
      moduleConfig
    );
  }

  if (moduleRegistry.size === 0) {
    console.log('[Module Lifecycle] No modules successfully loaded');
    return;
  }

  // Execute all five lifecycle phases in sequence
  await executePhaseForAllModules(ModuleLifecyclePhase.SETUP, app);
  await executePhaseForAllModules(ModuleLifecyclePhase.CONFIGURE, app);
  await executePhaseForAllModules(ModuleLifecyclePhase.INITIALIZE, app);
  await executePhaseForAllModules(ModuleLifecyclePhase.READY, app);
  await executePhaseForAllModules(ModuleLifecyclePhase.POST_INIT, app);

  console.log('[Module Lifecycle] Module lifecycle initialization complete');
}

/**
 * Executes a lifecycle phase for all registered modules.
 *
 * All modules complete the current phase before moving to the next phase.
 * Uses Promise.allSettled to ensure one module's failure doesn't block others.
 * @param phase - The lifecycle phase to execute.
 * @param app - The Vue application instance.
 */
async function executePhaseForAllModules(
  phase: ModuleLifecyclePhase,
  app: App
): Promise<void> {
  currentPhase = phase;
  console.log(`[Module Lifecycle] Starting ${phase} phase for all modules`);

  const results = await Promise.allSettled(
    Array.from(moduleRegistry.values()).map((module) =>
      executeLifecyclePhase(module, phase, app)
    )
  );

  // Log failures and warnings
  results.forEach((result, index) => {
    const module = Array.from(moduleRegistry.values())[index];
    if (!module) {
      return;
    }

    if (result.status === 'rejected') {
      console.error(
        `[Module Lifecycle] ${module.id}: Phase ${phase} rejected:`,
        result.reason
      );
    } else if (!result.value.success) {
      console.warn(
        `[Module Lifecycle] ${module.id}: Phase ${phase} failed:`,
        result.value.error
      );
    }
  });

  console.log(`[Module Lifecycle] Completed ${phase} phase`);
}

/**
 * Loads module configurations from /config directory.
 *
 * First loads /config/modules.json to get the list of modules,
 * then loads each module's configuration file (/config/module-<name>.json).
 *
 * Only enabled modules are returned.
 * @returns Promise resolving to array of module configurations.
 */
async function loadModuleConfigs(): Promise<ModuleHostConfig[]> {
  try {
    const modulesResponse = await fetch('/config/modules.json');

    if (!modulesResponse.ok) {
      throw new Error('Failed to fetch /config/modules.json');
    }

    const modulesData: {
      /**
       * List of module names to load.
       */
      modules: string[];
    } = await modulesResponse.json();
    const moduleConfigs: ModuleHostConfig[] = [];

    for (const moduleName of modulesData.modules) {
      try {
        const configPath = `/config/module-${moduleName}.json`;
        const configResponse = await fetch(configPath);

        if (configResponse.ok) {
          const config: ModuleHostConfig = await configResponse.json();

          if (config.enabled) {
            moduleConfigs.push(config);
            console.log(
              `[Module Lifecycle] Loaded config for module: ${config.id}`
            );
          } else {
            console.log(
              `[Module Lifecycle] Module ${config.id} is disabled, skipping`
            );
          }
        } else {
          console.warn(
            `[Module Lifecycle] Config file not found: ${configPath}`
          );
        }
      } catch (error) {
        console.error(
          `[Module Lifecycle] Error loading config for module ${moduleName}:`,
          error
        );
      }
    }

    return moduleConfigs;
  } catch (error) {
    console.error(
      '[Module Lifecycle] Failed to load module configurations:',
      error
    );
    return [];
  }
}

/**
 * Loads a remote module via Module Federation and adds it to the registry.
 *
 * Validates that the module exports the required structure (default export
 * with id and name fields) and that the module ID matches the host configuration.
 * @param remoteName - Name of the remote in Module Federation.
 * @param modulePath - Path to the module within the remote (typically './lifecycle').
 * @param hostConfig - Host configuration for this module.
 * @returns Promise resolving to the loaded module or null if loading failed.
 */
async function loadAndRegisterModule(
  remoteName: string,
  modulePath: string,
  hostConfig: ModuleHostConfig
): Promise<RemoteModule | null> {
  try {
    const remoteKey = `${remoteName}/${modulePath}`;
    console.log(`[Module Lifecycle] Loading module: ${remoteKey}`);

    const module = await loadRemote<{
      /**
       *
       */
      default: RemoteModule;
    }>(remoteKey);

    if (!module?.default) {
      throw new Error(`Module ${remoteKey} does not export a default module`);
    }

    const remoteModule = module.default;

    if (!remoteModule.id || !remoteModule.name) {
      throw new Error(
        `Module ${remoteKey} is missing required fields (id, name)`
      );
    }

    if (remoteModule.id !== hostConfig.id) {
      console.warn(
        `[Module Lifecycle] Module ID mismatch: expected "${hostConfig.id}", got "${remoteModule.id}"`
      );
    }

    moduleRegistry.set(remoteModule.id, remoteModule);
    moduleConfigRegistry.set(hostConfig.id, hostConfig);

    console.log(
      `[Module Lifecycle] Registered module: ${remoteModule.id} (${remoteModule.name})`
    );

    return remoteModule;
  } catch (error) {
    console.error(
      `[Module Lifecycle] Failed to load module ${remoteName}/${modulePath}:`,
      error
    );
    return null;
  }
}

/**
 * Executes a specific lifecycle phase for a module.
 *
 * Calls the appropriate lifecycle hook (onSetup, onConfigure, etc.) if implemented.
 * For the configure phase, passes the host configuration as a second argument.
 *
 * Handles errors gracefully and validates return values.
 * @param module - The remote module.
 * @param phase - The lifecycle phase to execute.
 * @param app - The Vue application instance.
 * @returns Promise resolving to the lifecycle result.
 */
async function executeLifecyclePhase(
  module: RemoteModule,
  phase: ModuleLifecyclePhase,
  app: App
): Promise<ModuleLifecycleResult> {
  const hookName =
    `on${phase.charAt(0).toUpperCase()}${phase.slice(1)}` as keyof RemoteModule;
  const hook = module[hookName];

  if (typeof hook === 'function') {
    try {
      console.log(`[Module Lifecycle] ${module.id}: Executing ${phase} phase`);

      let result: ModuleLifecycleResult | undefined;

      if (phase === ModuleLifecyclePhase.CONFIGURE) {
        const hostConfig = moduleConfigRegistry.get(module.id);
        if (hostConfig) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          result = await (hook as any).call(module, app, hostConfig);
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await (hook as any).call(module, app);
      }

      if (!result || typeof result.success !== 'boolean') {
        console.warn(
          `[Module Lifecycle] ${module.id}: Phase ${phase} returned invalid result, treating as success`
        );
        return { success: true };
      }

      return result;
    } catch (error) {
      console.error(
        `[Module Lifecycle] ${module.id}: Error in ${phase} phase:`,
        error
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  console.debug(
    `[Module Lifecycle] ${module.id}: Phase ${phase} hook not implemented, skipping`
  );
  return { success: true };
}
