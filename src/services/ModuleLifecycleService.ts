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

import type {
  FederatedModule,
  LinidRoute,
  ModuleHostConfig,
  RemoteModule,
} from '@linagora/linid-im-front-corelib';
import { registerModuleHostConfiguration } from '@linagora/linid-im-front-corelib';
import { loadRemote } from '@module-federation/enhanced/runtime';
import nunjucksEnv from 'boot/nunjucks';
import type { Component } from 'vue';
import type { RouteRecordRaw } from 'vue-router';
import type { BootFileParams } from '#q-app';

/**
 * Loads and aggregates configuration files for all federated modules.
 *
 * This function performs a multi-step fetch process:
 *
 * 1. Fetches the root `/modules.json` manifest.
 * 2. Extracts the list of module configuration file URLs.
 * 3. Fetches each module configuration in parallel.
 * 4. Filters out any modules that failed to load.
 *
 * The function is intentionally fault-tolerant:
 * - A failure to load an individual module configuration does not
 *   abort the overall process.
 * - If the root manifest cannot be loaded, an empty configuration
 *   list is returned.
 * @returns A promise resolving to the list of successfully loaded module host configurations.
 */
export async function getModulesConfiguration(): Promise<ModuleHostConfig[]> {
  try {
    const response = await fetch('/modules.json');

    if (!response.ok) {
      throw new Error('Failed to fetch /modules.json');
    }

    const {
      modules,
    }: {
      /**
       * Modules files.
       */
      modules: string[];
    } = await response.json();

    const moduleConfigs = await Promise.all(
      modules.map(async (moduleFile) => {
        try {
          const moduleResponse = await fetch(moduleFile);

          if (!moduleResponse.ok) {
            return null;
          }

          console.debug(
            `[Module Lifecycle] Loaded config for module: ${moduleResponse.url}`
          );
          return moduleResponse.json();
        } catch {
          console.error(
            `[Module Lifecycle] Config file not found: ${moduleFile}`
          );
          return null;
        }
      })
    );

    // Filter out failed fetches
    return moduleConfigs.filter(
      (config): config is ModuleHostConfig => config !== null
    );
  } catch (error) {
    console.error(
      '[Module Lifecycle] Failed to load module configurations:',
      error
    );
    return [];
  }
}

/**
 * Loads route definitions exposed by a remote federated module.
 *
 * This function attempts to dynamically import the remote module's
 * route entry point and extract its default export.
 *
 * If the remote module does not expose any routes (or the export
 * is missing or empty), the function returns `null` to signal that
 * no routes should be registered for this module.
 * @param config - The host configuration describing the remote module, including its remote name and instance metadata.
 * @returns A promise resolving to the list of routes exposed by the module, or `null` if the module defines no routes.
 */
async function getRoutes(
  config: ModuleHostConfig
): Promise<LinidRoute[] | null> {
  const routes = await loadRemote<FederatedModule<LinidRoute[]>>(
    `${config.remoteName}/routes`
  );

  if (!routes?.default || routes.default.length === 0) {
    return null;
  }

  return routes.default;
}

/**
 * Converts a LinidRoute to a Vue Router RouteRecordRaw.
 *
 * Applies Nunjucks templating to paths and loads components asynchronously
 * via Module Federation.
 * @param route - The LinidRoute to convert.
 * @param config - Module host configuration for templating.
 * @returns Promise resolving to Vue Router route record.
 */
export function toRouteRecordRaw(
  route: LinidRoute,
  config: ModuleHostConfig
): RouteRecordRaw {
  return {
    path: nunjucksEnv.renderString(route.path, { config }),
    component: async () =>
      (await loadRemote<FederatedModule<Component>>(route.component))!.default,
    children:
      route.children?.map((child) => toRouteRecordRaw(child, config)) || [],
  };
}

/**
 * Executes the SETUP lifecycle phase for a remote module.
 *
 * This phase is the earliest point in the module lifecycle and is
 * executed immediately after the module is loaded.
 *
 * Responsibilities of this phase:
 * - Register the module host configuration for later lifecycle phases.
 * - Perform early validation and preparation logic inside the module.
 *
 * No application artifacts (routes, stores, etc.) should be registered
 * during this phase.
 * @param module - The remote module lifecycle implementation.
 * @param config - The host configuration associated with this module instance.
 * @param _boot - The application boot context.
 * @returns A promise resolving to the module's setup result.
 */
export async function setup(
  module: RemoteModule,
  config: ModuleHostConfig,
  _boot: BootFileParams
) {
  registerModuleHostConfiguration(config);

  return module.setup();
}

/**
 * Executes the CONFIGURE lifecycle phase for a remote module.
 *
 * During this phase, the module is configured with host-provided
 * settings and may contribute application-level artifacts such as
 * routes.
 *
 * Responsibilities of this phase:
 * - Load and register module routes, if any are exposed.
 * - Pass validated host configuration to the module.
 *
 * This phase is executed after SETUP and before INITIALIZE.
 * @param module - The remote module lifecycle implementation.
 * @param config - The host configuration associated with this module instance.
 * @param boot - The application boot context, used here to register routes.
 * @returns A promise resolving to the module's configuration result.
 */
export async function configure(
  module: RemoteModule,
  config: ModuleHostConfig,
  boot: BootFileParams
) {
  const routes = await getRoutes(config);

  if (routes) {
    routes
      .map((route) => toRouteRecordRaw(route, config))
      .forEach(boot.router.addRoute);
  }

  return module.configure(config);
}

/**
 * Executes the INITIALIZE lifecycle phase for a remote module.
 *
 * During this phase, the module should initialize its core
 * functionality and register any required runtime resources.
 *
 * Typical responsibilities include:
 * - Registering Pinia stores.
 * - Initializing services or SDKs.
 * - Allocating long-lived resources.
 *
 * This phase is executed after CONFIGURE and before READY.
 * @param module - The remote module lifecycle implementation.
 * @param _config - The host configuration associated with this module instance.
 * @param _boot - The application boot context.
 * @returns A promise resolving to the module's initialization result.
 */
export async function initialize(
  module: RemoteModule,
  _config: ModuleHostConfig,
  _boot: BootFileParams
) {
  return module.initialize();
}

/**
 * Executes the READY lifecycle phase for a remote module.
 *
 * This phase signals that the module is fully initialized and
 * ready for interaction.
 *
 * At this point:
 * - All modules have completed INITIALIZE.
 * - Shared application services are available.
 *
 * Use this phase for:
 * - Emitting ready events.
 * - Performing final validation.
 * @param module - The remote module lifecycle implementation.
 * @param _config - The host configuration associated with this module instance.
 * @param _boot - The application boot context.
 * @returns A promise resolving to the module's ready result.
 */
export async function ready(
  module: RemoteModule,
  _config: ModuleHostConfig,
  _boot: BootFileParams
) {
  return module.ready();
}

/**
 * Executes the POST_INIT lifecycle phase for a remote module.
 *
 * This phase is executed after all modules have reached READY.
 *
 * Use this phase for:
 * - Cross-module integrations.
 * - Late-bound dependencies.
 * - Final application wiring that requires all modules to be available.
 * @param module - The remote module lifecycle implementation.
 * @param _config - The host configuration associated with this module instance.
 * @param _boot - The application boot context.
 * @returns A promise resolving to the module's post-initialization result.
 */
export async function postInit(
  module: RemoteModule,
  _config: ModuleHostConfig,
  _boot: BootFileParams
) {
  return module.postInit();
}
