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
  loadAsyncComponent,
  type FederatedModule,
  type LinidRoute,
  type ModuleHostConfig,
} from '@linagora/linid-im-front-corelib';
import nunjucksEnv from 'src/boot/nunjucks';
import type { RouteRecordRaw, Router } from 'vue-router';

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
  const vueRoute: RouteRecordRaw = {
    path: nunjucksEnv.renderString(route.path, config),
    component: () => loadAsyncComponent(route.component),
    children:
      route.children?.map((child) => toRouteRecordRaw(child, config)) || [],
  };

  return vueRoute;
}

/**
 * Loads routes from a remote module and registers them in the Vue Router.
 * @param router - The Vue Router instance.
 * @param remoteName - The name of the remote module.
 * @param config - Module host configuration for templating.
 * @returns Promise resolving to true if routes were registered successfully, false otherwise.
 */
export async function loadAndRegisterModuleRoutes(
  router: Router,
  remoteName: string,
  config: ModuleHostConfig
): Promise<boolean> {
  try {
    // Dynamically load the routes module via Module Federation
    const mf = getModuleFederation();
    const routesModule = await mf.loadRemote<FederatedModule<LinidRoute[]>>(
      `${remoteName}/routes`
    );

    if (!routesModule?.default) {
      console.log(`[Routes] No routes for ${remoteName}`);
      return true;
    }

    const linidRoutes: LinidRoute[] = routesModule.default;

    if (!Array.isArray(linidRoutes) || linidRoutes.length === 0) {
      console.log(
        `[Routes] Empty or invalid routes to register from ${remoteName}`
      );
      return true;
    }

    const vueRoutes: RouteRecordRaw[] = linidRoutes.map((route) =>
      toRouteRecordRaw(route, config)
    );

    vueRoutes.forEach((route) => {
      router.addRoute(route);
      console.log(`[Routes] Registered route: ${route.path}`);
    });

    console.log(
      `[Routes]Successfully registered ${vueRoutes.length} route(s) from ${remoteName}`
    );

    return true;
  } catch (error) {
    console.error(
      `[Routes] Failed to load routes from ${remoteName}/routes`,
      error
    );
    return false;
  }
}
