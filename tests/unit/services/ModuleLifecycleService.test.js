import { registerModuleHostConfiguration } from '@linagora/linid-im-front-corelib';
import { loadRemote } from '@module-federation/enhanced/runtime';
import {
  getModulesConfiguration,
  setup,
  configure,
  initialize,
  ready,
  postInit,
  renderMeta,
} from 'src/services/ModuleLifecycleService';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@module-federation/enhanced/runtime', () => ({
  loadRemote: vi.fn(),
}));

vi.mock('@linagora/linid-im-front-corelib', () => ({
  registerModuleHostConfiguration: vi.fn(),
  loadAsyncComponent: vi.fn(),
  renameKeys: () => null,
}));

global.fetch = vi.fn();

describe('Test service: ModuleLifecycleService', () => {
  const mockModule = {
    setup: vi.fn().mockResolvedValue('setup-done'),
    configure: vi.fn().mockResolvedValue('configure-done'),
    initialize: vi.fn().mockResolvedValue('initialize-done'),
    ready: vi.fn().mockResolvedValue('ready-done'),
    postInit: vi.fn().mockResolvedValue('postInit-done'),
  };

  const mockConfig = {
    remoteName: 'testRemote',
    instanceId: 'id1',
  };

  const mockBoot = {
    router: { addRoute: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Test function: getModulesConfiguration', () => {
    it('should return loaded module configurations', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ modules: ['/module1.json'] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ name: 'mod1' }),
        });

      const configs = await getModulesConfiguration();
      expect(configs).toEqual([{ name: 'mod1' }]);
    });

    it('should return empty array if root fetch fails', async () => {
      fetch.mockResolvedValueOnce({ ok: false });
      const configs = await getModulesConfiguration();
      expect(configs).toEqual([]);
    });

    it('should skip module if its fetch fails and continue', async () => {
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ modules: ['/module1.json', '/module2.json'] }),
        })
        // module1.json succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ name: 'mod1' }),
        })
        // module2.json fails
        .mockRejectedValueOnce(new Error('Network error'));

      const configs = await getModulesConfiguration();
      // Only the successful module should remain
      expect(configs).toEqual([{ name: 'mod1' }]);
    });
  });

  describe('Test function: setup', () => {
    it('should register module configuration and call setup', async () => {
      const result = await setup(mockModule, mockConfig, mockBoot);
      expect(registerModuleHostConfiguration).toHaveBeenCalledWith(mockConfig);
      expect(mockModule.setup).toHaveBeenCalled();
      expect(result).toBe('setup-done');
    });
  });

  describe('Test function: configure', () => {
    it('should load routes and call configure on the module', async () => {
      loadRemote.mockResolvedValue({
        default: [{ path: '/test', component: 'Comp' }],
      });

      const result = await configure(mockModule, mockConfig, mockBoot);
      expect(mockBoot.router.addRoute).toHaveBeenCalled();
      expect(mockModule.configure).toHaveBeenCalledWith(mockConfig);
      expect(result).toBe('configure-done');
    });

    it('should handle null routes', async () => {
      loadRemote.mockResolvedValue({ default: [] });
      const result = await configure(mockModule, mockConfig, mockBoot);
      expect(mockBoot.router.addRoute).not.toHaveBeenCalled();
      expect(result).toBe('configure-done');
    });
  });

  describe('Test function: initialize', () => {
    it('should call initialize on the module', async () => {
      const result = await initialize(mockModule, mockConfig, mockBoot);
      expect(mockModule.initialize).toHaveBeenCalled();
      expect(result).toBe('initialize-done');
    });
  });

  describe('Test function: ready', () => {
    it('should call ready on the module', async () => {
      const result = await ready(mockModule, mockConfig, mockBoot);
      expect(mockModule.ready).toHaveBeenCalled();
      expect(result).toBe('ready-done');
    });
  });

  describe('Test function: postInit', () => {
    it('should call postInit on the module', async () => {
      const result = await postInit(mockModule, mockConfig, mockBoot);
      expect(mockModule.postInit).toHaveBeenCalled();
      expect(result).toBe('postInit-done');
    });
  });

  describe('Test function: renderMeta', () => {
    const config = {
      id: 'my-module',
      userName: 'Alice',
      defaultRole: 'editor',
    };

    it('renders a simple string', () => {
      const input = 'Dashboard for {{ config.id }}';
      const output = renderMeta(input, config);
      expect(output).toBe('Dashboard for my-module');
    });

    it('renders strings inside an object', () => {
      const input = {
        title: 'Hello {{ config.userName }}',
        requiresAuth: true,
      };
      const output = renderMeta(input, config);
      expect(output).toEqual({
        title: 'Hello Alice',
        requiresAuth: true,
      });
    });

    it('renders strings inside a nested object', () => {
      const input = {
        layout: {
          header: 'Welcome {{ config.userName }}',
          footer: 'Module {{ config.id }}',
        },
        roles: ['admin', '{{ config.defaultRole }}'],
      };
      const output = renderMeta(input, config);
      expect(output).toEqual({
        layout: { header: 'Welcome Alice', footer: 'Module my-module' },
        roles: ['admin', 'editor'],
      });
    });

    it('renders strings inside an array', () => {
      const input = ['user: {{ config.userName }}', 'module: {{ config.id }}'];
      const output = renderMeta(input, config);
      expect(output).toEqual(['user: Alice', 'module: my-module']);
    });

    it('keeps numbers, booleans and null unchanged', () => {
      const input = { count: 5, active: true, missing: null };
      const output = renderMeta(input, config);
      expect(output).toEqual({ count: 5, active: true, missing: null });
    });

    it('handles empty objects and arrays', () => {
      expect(renderMeta({}, config)).toEqual({});
      expect(renderMeta([], config)).toEqual([]);
    });

    it('handles deeply nested mixed objects and arrays', () => {
      const input = {
        users: [
          {
            name: '{{ config.userName }}',
            roles: ['{{ config.defaultRole }}'],
          },
          { name: 'Bob', roles: ['admin'] },
        ],
        module: '{{ config.id }}',
      };
      const output = renderMeta(input, config);
      expect(output).toEqual({
        users: [
          { name: 'Alice', roles: ['editor'] },
          { name: 'Bob', roles: ['admin'] },
        ],
        module: 'my-module',
      });
    });
  });
});
