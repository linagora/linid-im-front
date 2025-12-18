import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@linagora/linid-im-front-corelib', () => ({
  loadAsyncComponent: vi.fn(
    (componentPath) => () =>
      Promise.resolve({
        __name: componentPath,
        template: `<div>Mock component: ${componentPath}</div>`,
      })
  ),
}));

const loadRemote = vi.fn();
vi.mock('@linagora/linid-im-front-corelib', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getModuleFederation: () => ({
      loadRemote,
    }),
    setModuleFederation: vi.fn(),
  };
});

describe('Test: route-manager', () => {
  let toRouteRecordRaw, loadAndRegisterModuleRoutes, consoleSpy;

  const createMockRouter = () => ({
    addRoute: vi.fn(),
  });

  const createMockConfig = (overrides = {}) => ({
    instanceId: 'test-module',
    remoteName: 'testRemote',
    basePath: '/test',
    ...overrides,
  });

  beforeEach(async () => {
    vi.resetModules();
    loadRemote.mockReset();
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
    const module = await import('src/router/route-manager');
    ({ toRouteRecordRaw, loadAndRegisterModuleRoutes } = module);
  });

  afterEach(() => {
    Object.values(consoleSpy).forEach((spy) => spy.mockRestore());
  });

  describe('Test function: toRouteRecordRaw', () => {
    const baseRoute = (overrides = {}) => ({
      path: '/settings',
      component: 'testModule/Settings',
      ...overrides,
    });

    it('should convert a simple LinidRoute to Vue route', () => {
      const config = createMockConfig();
      const result = toRouteRecordRaw(baseRoute(), config);
      expect(result).toHaveProperty('path', '/settings');
      expect(result).toHaveProperty('component');
      expect(result.children).toEqual([]);
    });

    it('should apply templating to path', () => {
      const config = createMockConfig({ basePath: '/admin' });
      const route = baseRoute({ path: '{{ basePath }}/settings' });
      const result = toRouteRecordRaw(route, config);
      expect(result.path).toBe('/admin/settings');
    });

    it('should convert children routes and apply templating', () => {
      const config = createMockConfig({ section: 'users' });
      const route = baseRoute({
        path: '/parent',
        component: 'testModule/Parent',
        children: [
          { path: '{{ section }}/child1', component: 'testModule/Child1' },
          { path: 'child2', component: 'testModule/Child2' },
        ],
      });
      const result = toRouteRecordRaw(route, config);
      expect(result.children).toHaveLength(2);
      expect(result.children[0].path).toBe('users/child1');
      expect(result.children[1].path).toBe('child2');
    });

    it('should handle route without children', () => {
      const config = createMockConfig();
      const route = baseRoute({ path: '/simple' });
      const result = toRouteRecordRaw(route, config);
      expect(result.children).toEqual([]);
    });

    it('should convert nested children recursively', () => {
      const config = createMockConfig();
      const route = {
        path: '/parent',
        component: 'Parent',
        children: [
          {
            path: 'child',
            component: 'Child',
            children: [{ path: 'grandchild', component: 'GrandChild' }],
          },
        ],
      };
      const result = toRouteRecordRaw(route, config);
      expect(result.children[0].children[0].path).toBe('grandchild');
    });
  });

  describe('Test function: loadAndRegisterModuleRoutes', () => {
    it('should register routes when valid', async () => {
      const mockRouter = createMockRouter();
      const config = createMockConfig();
      const mockRoutes = [
        { path: '/route1', component: 'test/Route1', children: [] },
        { path: '/route2', component: 'test/Route2', children: [] },
      ];
      loadRemote.mockResolvedValueOnce({ default: mockRoutes });

      const result = await loadAndRegisterModuleRoutes(
        mockRouter,
        'testRemote',
        config
      );

      expect(result).toBe(true);
      expect(loadRemote).toHaveBeenCalledWith('testRemote/routes');
      expect(mockRouter.addRoute).toHaveBeenCalledTimes(2);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[Routes] Registered route: /route1'
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[Routes] Registered route: /route2'
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[Routes]Successfully registered 2 route(s) from testRemote'
      );
    });

    it.each([
      [
        'missing default export',
        { noDefault: [] },
        '[Routes] No routes for testRemote',
      ],
      [
        'non-array default export',
        { default: { notAnArray: true } },
        '[Routes] Empty or invalid routes to register from testRemote',
      ],
      [
        'empty routes array',
        { default: [] },
        '[Routes] Empty or invalid routes to register from testRemote',
      ],
    ])('should handle %s', async (_, remoteExport, expectedLog) => {
      const mockRouter = createMockRouter();
      const config = createMockConfig();
      loadRemote.mockResolvedValueOnce(remoteExport);
      const result = await loadAndRegisterModuleRoutes(
        mockRouter,
        'testRemote',
        config
      );
      expect(result).toBe(true);
      expect(consoleSpy.log).toHaveBeenCalledWith(expectedLog);
      expect(mockRouter.addRoute).not.toHaveBeenCalled();
    });

    it('should handle loadRemote failure', async () => {
      const mockRouter = createMockRouter();
      const config = createMockConfig();
      loadRemote.mockRejectedValueOnce(new Error('Failed to load remote'));

      const result = await loadAndRegisterModuleRoutes(
        mockRouter,
        'testRemote',
        config
      );

      expect(result).toBe(false);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[Routes] Failed to load routes from testRemote/routes',
        expect.any(Error)
      );
    });

    it('should apply templating to all route paths', async () => {
      const mockRouter = createMockRouter();
      const config = createMockConfig({ basePath: '/custom' });
      const mockRoutes = [
        {
          path: '{{ basePath }}/route1',
          component: 'test/Route1',
          children: [],
        },
      ];
      loadRemote.mockResolvedValueOnce({ default: mockRoutes });

      await loadAndRegisterModuleRoutes(mockRouter, 'testRemote', config);

      expect(mockRouter.addRoute).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/custom/route1' })
      );
    });
  });
});
