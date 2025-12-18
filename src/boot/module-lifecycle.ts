/*
 * Copyright (C) 2025 Linagora
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General
 * Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option)
 * any later version, provided you comply with the Additional Terms applicable for LinID Identity Manager software by
 * LINAGORA pursuant to Section 7 of the GNU Affero General Public License, subsections (b), (c), and (e), pursuant to
 * which these Appropriate Legal Notices must notably (i) retain the display of the "LinID™" trademark/logo at the top
 * of the interface window, the display of the “You are using the Open Source and free version of LinID™, powered by
 * Linagora © 2009–2013. Contribute to LinID R&D by subscribing to an Enterprise offer!” infobox and in the e-mails
 * sent with the Program, notice appended to any type of outbound messages (e.g. e-mail and meeting requests) as well
 * as in the LinID Identity Manager user interface, (ii) retain all hypertext links between LinID Identity Manager
 * and https://linid.org/, as well as between LINAGORA and LINAGORA.com, and (iii) refrain from infringing LINAGORA
 * intellectual property rights over its trademarks and commercial brands. Other Additional Terms apply, see
 * <http://www.linagora.com/licenses/> for more details.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License and its applicable Additional Terms for
 * LinID Identity Manager along with this program. If not, see <http://www.gnu.org/licenses/> for the GNU Affero
 * General Public License version 3 and <http://www.linagora.com/licenses/> for the Additional Terms applicable to the
 * LinID Identity Manager software.
 */

import {
  getModuleFederation,
  ModuleLifecyclePhase,
  type FederatedModule,
  type ModuleHostConfig,
  type ModuleLifecycleResult,
  type RemoteModule,
} from '@linagora/linid-im-front-corelib';
import { defineBoot } from '@quasar/app-vite/wrappers';
import { loadAndRegisterModuleRoutes } from 'src/router/route-manager';
import type { Router } from 'vue-router';

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
 * @param router - Vue Router instance.
 */
export default defineBoot(async ({ router }) => {
  await initializeModuleLifecycle(router);
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
 * @param router - Vue Router instance.
 */
async function initializeModuleLifecycle(router: Router): Promise<void> {
  console.log('[Module Lifecycle] Starting module lifecycle initialization');

  const moduleConfigs = await loadModuleConfigs();

  if (moduleConfigs.length === 0) {
    console.log('[Module Lifecycle] No enabled modules found');
    return;
  }

  for (const moduleConfig of moduleConfigs) {
    await loadAndRegisterModule(
      moduleConfig.remoteName,
      'lifecycle',
      moduleConfig
    );
  }

  if (moduleRegistry.size === 0) {
    console.log('[Module Lifecycle] No modules successfully loaded');
    return;
  }

  // Execute all five lifecycle phases in sequence
  await executePhaseForAllModules(ModuleLifecyclePhase.SETUP);
  await executePhaseForAllModules(ModuleLifecyclePhase.CONFIGURE);
  await executePhaseForAllModules(ModuleLifecyclePhase.INITIALIZE);

  console.log('[Module Lifecycle] Loading module routes');
  const registeredConfig = Array.from(moduleConfigRegistry.values());
  const routeLoadResults = await Promise.allSettled(
    registeredConfig.map((config) =>
      loadAndRegisterModuleRoutes(router, config.remoteName, config)
    )
  );

  registeredConfig.forEach((config, idx) => {
    const result = routeLoadResults[idx];
    if (!result) {
      return;
    }
    if (
      result.status === 'rejected' ||
      (result.status === 'fulfilled' && !result.value)
    ) {
      console.warn(
        `[Module Lifecycle] Failed to load routes for module: ${config.remoteName}`,
        result.status === 'rejected' ? result.reason : undefined
      );
    }
  });

  await executePhaseForAllModules(ModuleLifecyclePhase.READY);
  await executePhaseForAllModules(ModuleLifecyclePhase.POST_INIT);

  console.log('[Module Lifecycle] Module lifecycle initialization complete');
}

/**
 * Loads module configurations from /config directory.
 *
 * First loads /modules.json to get the list of modules,
 * then loads each module's configuration file from its url.
 * @returns Promise resolving to array of module configurations.
 */
export async function loadModuleConfigs(): Promise<ModuleHostConfig[]> {
  try {
    const modulesResponse = await fetch('/modules.json');

    if (!modulesResponse.ok) {
      throw new Error('Failed to fetch /modules.json');
    }

    const modulesData: {
      /**
       * List of module configuration file names.
       */
      modules: string[];
    } = await modulesResponse.json();
    const moduleConfigs: ModuleHostConfig[] = [];

    for (const moduleFile of modulesData.modules) {
      try {
        const configResponse = await fetch(moduleFile);

        if (configResponse.ok) {
          const config: ModuleHostConfig = await configResponse.json();

          moduleConfigs.push(config);
          console.log(
            `[Module Lifecycle] Loaded config for module: ${config.instanceId}`
          );
        } else {
          console.warn(
            `[Module Lifecycle] Config file not found: ${moduleFile}`
          );
        }
      } catch (error) {
        console.error(
          `[Module Lifecycle] Error loading config for module ${moduleFile}:`,
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
export async function loadAndRegisterModule(
  remoteName: string,
  modulePath: string,
  hostConfig: ModuleHostConfig
): Promise<RemoteModule | null> {
  try {
    const remoteKey = `${remoteName}/${modulePath}`;
    console.log(`[Module Lifecycle] Loading module: ${remoteKey}`);

    const mf = getModuleFederation();
    const module =
      await mf.loadRemote<FederatedModule<RemoteModule>>(remoteKey);

    if (!module?.default) {
      throw new Error(`Module ${remoteKey} does not export a default module`);
    }

    const remoteModule = module.default;

    if (!remoteModule.id || !remoteModule.name) {
      throw new Error(
        `Module ${remoteKey} is missing required fields (id, name)`
      );
    }

    if (remoteModule.id !== hostConfig.instanceId) {
      console.warn(
        `[Module Lifecycle] Module ID mismatch: expected "${hostConfig.instanceId}", got "${remoteModule.id}"`
      );
    }

    moduleRegistry.set(remoteModule.id, remoteModule);
    moduleConfigRegistry.set(hostConfig.instanceId, hostConfig);

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
 * Executes a lifecycle phase for all registered modules.
 *
 * All modules complete the current phase before moving to the next phase.
 * Uses Promise.allSettled to ensure one module's failure doesn't block others.
 * @param phase - The lifecycle phase to execute.
 */
export async function executePhaseForAllModules(
  phase: ModuleLifecyclePhase
): Promise<void> {
  currentPhase = phase;
  console.log(`[Module Lifecycle] Starting ${phase} phase for all modules`);

  const results = await Promise.allSettled(
    Array.from(moduleRegistry.values()).map((module) =>
      executeLifecyclePhase(module, phase)
    )
  );

  // Log failures and warnings
  results.forEach((result, index) => {
    const module = Array.from(moduleRegistry.values())[index];
    /* istanbul ignore if -- @preserve defensive check, should never happen */
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
 * Executes a specific lifecycle phase for a module.
 *
 * Calls the appropriate lifecycle hook (onSetup, onConfigure, etc.) if implemented.
 * For the configure phase, passes the host configuration as a second argument.
 *
 * Handles errors gracefully and validates return values.
 * @param module - The remote module.
 * @param phase - The lifecycle phase to execute.
 * @returns Promise resolving to the lifecycle result.
 */
export async function executeLifecyclePhase(
  module: RemoteModule,
  phase: ModuleLifecyclePhase
): Promise<ModuleLifecycleResult> {
  const hookName = phase;
  const hook = module[hookName];

  if (typeof hook !== 'function') {
    console.debug(
      `[Module Lifecycle] ${module.id}: Phase ${phase} hook not implemented, skipping`
    );
    return { success: true };
  }
  try {
    console.log(`[Module Lifecycle] ${module.id}: Executing ${phase} phase`);

    let result: ModuleLifecycleResult | undefined;

    if (phase === ModuleLifecyclePhase.CONFIGURE) {
      const hostConfig = moduleConfigRegistry.get(module.id);
      if (hostConfig) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result = await (hook as any).call(module, hostConfig);
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result = await (hook as any).call(module);
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
