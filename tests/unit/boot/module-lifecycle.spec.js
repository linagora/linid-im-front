import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadRemote } from '@module-federation/enhanced/runtime';

vi.mock('@module-federation/enhanced/runtime', () => ({
  loadRemote: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Test: module-lifecycle', () => {
  let getCurrentPhase,
    getRegisteredModules,
    getModuleConfig,
    loadModuleConfigs,
    loadAndRegisterModule,
    executePhaseForAllModules,
    executeLifecyclePhase,
    moduleLifecycleBoot,
    consoleSpy;

  const mockApp = {
    config: { globalProperties: { $pinia: {}, $router: {}, $i18n: {} } },
  };

  const createMockModule = (overrides = {}) => ({
    default: {
      id: 'test-module',
      name: 'Test Module',
      version: '1.0.0',
      onSetup: vi.fn().mockResolvedValue({ success: true }),
      onConfigure: vi.fn().mockResolvedValue({ success: true }),
      onInitialize: vi.fn().mockResolvedValue({ success: true }),
      onReady: vi.fn().mockResolvedValue({ success: true }),
      'onPost-init': vi.fn().mockResolvedValue({ success: true }),
      ...overrides,
    },
  });

  const createMockModuleConfig = (overrides = {}) => ({
    id: 'test-module',
    remoteName: 'testRemote',
    ...overrides,
  });

  const mockFetchResponse = (ok, data) => ({
    ok,
    status: ok ? 200 : 404,
    json: () => Promise.resolve(data),
  });

  const createTrackedModule = (executionOrder, failingPhase = null) => {
    const createHook = (phase) =>
      vi.fn().mockImplementation(() => {
        executionOrder.push(phase);
        if (phase === failingPhase) {
          return Promise.reject(new Error(`${phase} error`));
        }
        return Promise.resolve({ success: true });
      });
    return {
      default: {
        id: 'test-module',
        name: 'Test Module',
        version: '1.0.0',
        onSetup: createHook('setup'),
        onConfigure: createHook('configure'),
        onInitialize: createHook('initialize'),
        onReady: createHook('ready'),
        'onPost-init': createHook('post-init'),
      },
    };
  };

  const setupBootTest = (moduleConfig, mockModule) => {
    mockFetch
      .mockResolvedValueOnce(
        mockFetchResponse(true, { modules: ['module.json'] })
      )
      .mockResolvedValueOnce(mockFetchResponse(true, moduleConfig));
    loadRemote.mockResolvedValueOnce(mockModule);
  };

  beforeEach(async () => {
    vi.resetModules();
    mockFetch.mockReset();
    loadRemote.mockReset();
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    };
    const module = await import('src/boot/module-lifecycle');
    ({
      getCurrentPhase,
      getRegisteredModules,
      getModuleConfig,
      loadModuleConfigs,
      loadAndRegisterModule,
      executePhaseForAllModules,
      executeLifecyclePhase,
    } = module);
    moduleLifecycleBoot = module.default;
  });

  afterEach(() => {
    Object.values(consoleSpy).forEach((spy) => spy.mockRestore());
  });

  describe('Test function: getCurrentPhase', () => {
    it('should return null when no phase is active', () => {
      expect(getCurrentPhase()).toBeNull();
    });
  });

  describe('Test function: getRegisteredModules', () => {
    it('should return an empty map initially', () => {
      expect(getRegisteredModules()).toBeInstanceOf(Map);
      expect(getRegisteredModules().size).toBe(0);
    });
  });

  describe('Test function: getModuleConfig', () => {
    it('should return undefined when config registry is empty', () => {
      expect(getModuleConfig('any-module')).toBeUndefined();
    });
  });

  describe('Test function: loadModuleConfigs', () => {
    it('should return empty array when no modules are found', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse(true, { modules: [] }));
      expect(await loadModuleConfigs()).toEqual([]);
    });

    it.each([
      [
        'fetch failure',
        () => mockFetch.mockRejectedValueOnce(new Error('Network error')),
      ],
      [
        'non-ok response',
        () => mockFetch.mockResolvedValueOnce({ ok: false, status: 404 }),
      ],
    ])('should handle modules.json %s', async (_, setupMock) => {
      setupMock();
      expect(await loadModuleConfigs()).toEqual([]);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[Module Lifecycle] Failed to load module configurations:',
        expect.any(Error)
      );
    });

    it('should load module configurations from file paths', async () => {
      mockFetch
        .mockResolvedValueOnce(
          mockFetchResponse(true, { modules: ['module-a.json'] })
        )
        .mockResolvedValueOnce(
          mockFetchResponse(true, { id: 'module-a', remoteName: 'remoteA' })
        );
      const configs = await loadModuleConfigs();
      expect(mockFetch).toHaveBeenCalledWith('/modules.json');
      expect(mockFetch).toHaveBeenCalledWith('module-a.json');
      expect(configs).toHaveLength(1);
      expect(configs[0].id).toBe('module-a');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[Module Lifecycle] Loaded config for module: module-a'
      );
    });

    it('should load multiple module configurations', async () => {
      mockFetch
        .mockResolvedValueOnce(
          mockFetchResponse(true, {
            modules: ['module-a.json', 'module-b.json'],
          })
        )
        .mockResolvedValueOnce(
          mockFetchResponse(true, { id: 'module-a', remoteName: 'remoteA' })
        )
        .mockResolvedValueOnce(
          mockFetchResponse(true, { id: 'module-b', remoteName: 'remoteB' })
        );
      const configs = await loadModuleConfigs();
      expect(configs).toHaveLength(2);
      expect(configs.map((c) => c.id)).toEqual(['module-a', 'module-b']);
    });

    it('should handle module config fetch failure gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce(
          mockFetchResponse(true, { modules: ['module-test.json'] })
        )
        .mockResolvedValueOnce({ ok: false, status: 404 });
      expect(await loadModuleConfigs()).toEqual([]);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Config file not found')
      );
    });

    it('should handle module config fetch error gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce(
          mockFetchResponse(true, { modules: ['module-test.json'] })
        )
        .mockRejectedValueOnce(new Error('Network error'));
      expect(await loadModuleConfigs()).toEqual([]);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Error loading config for module'),
        expect.any(Error)
      );
    });

    it('should continue loading other modules when one config fetch fails', async () => {
      mockFetch
        .mockResolvedValueOnce(
          mockFetchResponse(true, {
            modules: ['module-missing.json', 'module-working.json'],
          })
        )
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce(
          mockFetchResponse(true, {
            id: 'working-module',
            remoteName: 'workingRemote',
          })
        );
      const configs = await loadModuleConfigs();
      expect(configs).toHaveLength(1);
      expect(configs[0].id).toBe('working-module');
    });
  });

  describe('Test function: loadAndRegisterModule', () => {
    it('should load and register a valid module with config in registry', async () => {
      const config = createMockModuleConfig({ customField: 'value' });
      loadRemote.mockResolvedValueOnce(createMockModule());
      const result = await loadAndRegisterModule(
        'testRemote',
        './lifecycle',
        config
      );
      expect(loadRemote).toHaveBeenCalledWith('testRemote/lifecycle');
      expect(result).not.toBeNull();
      expect(result.id).toBe('test-module');
      expect(getRegisteredModules().size).toBe(1);
      expect(getRegisteredModules().has('test-module')).toBe(true);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[Module Lifecycle] Registered module: test-module (Test Module)'
      );
      const retrievedConfig = getModuleConfig('test-module');
      expect(retrievedConfig.customField).toBe('value');
    });

    it('should return null on loadRemote failure', async () => {
      loadRemote.mockRejectedValueOnce(new Error('Failed to load remote'));
      const result = await loadAndRegisterModule(
        'testRemote',
        './lifecycle',
        createMockModuleConfig()
      );
      expect(result).toBeNull();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load module'),
        expect.any(Error)
      );
      expect(getRegisteredModules().size).toBe(0);
    });

    it.each([
      [
        'without default export',
        { notDefault: {} },
        'does not export a default module',
      ],
      [
        'with missing id field',
        { default: { name: 'Test', version: '1.0.0' } },
        'missing required fields',
      ],
      [
        'with missing name field',
        { default: { id: 'test', version: '1.0.0' } },
        'missing required fields',
      ],
    ])('should reject module %s', async (_, mockModule, expectedError) => {
      loadRemote.mockResolvedValueOnce(mockModule);
      const result = await loadAndRegisterModule(
        'testRemote',
        './lifecycle',
        createMockModuleConfig()
      );
      expect(result).toBeNull();
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load module'),
        expect.objectContaining({
          message: expect.stringContaining(expectedError),
        })
      );
    });

    it('should warn when module id does not match host config id', async () => {
      loadRemote.mockResolvedValueOnce(
        createMockModule({ id: 'different-id' })
      );
      await loadAndRegisterModule(
        'testRemote',
        './lifecycle',
        createMockModuleConfig({ id: 'expected-id' })
      );
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Module ID mismatch')
      );
    });
  });

  describe('Test function: executeLifecyclePhase', () => {
    it('should skip phase and return success when hook is not implemented', async () => {
      const result = await executeLifecyclePhase(
        { id: 'test-module', name: 'Test Module' },
        'setup',
        mockApp
      );
      expect(result).toEqual({ success: true });
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('hook not implemented, skipping')
      );
    });

    it('should execute hook and return result', async () => {
      const module = {
        id: 'test-module',
        name: 'Test Module',
        onSetup: vi.fn().mockResolvedValue({ success: true }),
      };
      const result = await executeLifecyclePhase(module, 'setup', mockApp);
      expect(module.onSetup).toHaveBeenCalledWith(mockApp);
      expect(result).toEqual({ success: true });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[Module Lifecycle] test-module: Executing setup phase'
      );
    });

    it('should handle phase returning failure', async () => {
      const module = {
        id: 'test-module',
        name: 'Test Module',
        onSetup: vi
          .fn()
          .mockResolvedValue({ success: false, error: 'Setup failed' }),
      };
      expect(await executeLifecyclePhase(module, 'setup', mockApp)).toEqual({
        success: false,
        error: 'Setup failed',
      });
    });

    it.each([
      ['Error', new Error('Unexpected error'), 'Unexpected error'],
      ['non-Error value', 'string error', 'string error'],
    ])(
      'should handle phase throwing %s',
      async (_, thrownValue, expectedError) => {
        const module = {
          id: 'test-module',
          name: 'Test Module',
          onSetup: vi.fn().mockRejectedValue(thrownValue),
        };
        const result = await executeLifecyclePhase(module, 'setup', mockApp);
        expect(result).toEqual({ success: false, error: expectedError });
        expect(consoleSpy.error).toHaveBeenCalledWith(
          expect.stringContaining('Error in setup phase'),
          thrownValue
        );
      }
    );

    it.each([
      ['invalid result (no success boolean)', { data: 'some data' }],
      ['null', null],
      ['undefined', undefined],
    ])('should handle phase returning %s', async (_, returnValue) => {
      const module = {
        id: 'test-module',
        name: 'Test Module',
        onReady: vi.fn().mockResolvedValue(returnValue),
      };
      expect(await executeLifecyclePhase(module, 'ready', mockApp)).toEqual({
        success: true,
      });
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('returned invalid result')
      );
    });

    it('should pass host config to onConfigure hook', async () => {
      const config = createMockModuleConfig({ customSetting: 'value' });
      loadRemote.mockResolvedValueOnce(createMockModule());
      await loadAndRegisterModule('testRemote', './lifecycle', config);
      const module = {
        id: 'test-module',
        name: 'Test Module',
        onConfigure: vi.fn().mockResolvedValue({ success: true }),
      };
      await executeLifecyclePhase(module, 'configure', mockApp);
      expect(module.onConfigure).toHaveBeenCalledWith(
        mockApp,
        expect.objectContaining({ id: 'test-module', customSetting: 'value' })
      );
    });
  });

  describe('Test function: executePhaseForAllModules', () => {
    beforeEach(async () => {
      loadRemote.mockResolvedValueOnce(createMockModule());
      await loadAndRegisterModule(
        'testRemote',
        './lifecycle',
        createMockModuleConfig()
      );
    });

    it('should execute phase for all registered modules and set currentPhase', async () => {
      expect(getCurrentPhase()).toBeNull();
      await executePhaseForAllModules('setup', mockApp);
      expect(getCurrentPhase()).toBe('setup');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[Module Lifecycle] Starting setup phase for all modules'
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[Module Lifecycle] Completed setup phase'
      );
    });

    it('should log error when phase promise is rejected', async () => {
      // Register a module that will cause executeLifecyclePhase to throw
      // We need to mock the module's hook to throw synchronously before returning a promise
      const failingModule = {
        default: {
          id: 'failing-module',
          name: 'Failing Module',
          version: '1.0.0',
          get onSetup() {
            throw new Error('Sync error in hook getter');
          },
        },
      };
      loadRemote.mockResolvedValueOnce(failingModule);
      await loadAndRegisterModule(
        'failingRemote',
        './lifecycle',
        createMockModuleConfig({
          id: 'failing-module',
          remoteName: 'failingRemote',
        })
      );
      await executePhaseForAllModules('setup', mockApp);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        '[Module Lifecycle] failing-module: Phase setup rejected:',
        expect.any(Error)
      );
    });

    it('should log warning when phase returns failure result', async () => {
      loadRemote.mockResolvedValueOnce(
        createMockModule({
          id: 'warning-module',
          name: 'Warning Module',
          onSetup: vi
            .fn()
            .mockResolvedValue({ success: false, error: 'Setup warning' }),
        })
      );
      await loadAndRegisterModule(
        'warningRemote',
        './lifecycle',
        createMockModuleConfig({
          id: 'warning-module',
          remoteName: 'warningRemote',
        })
      );
      await executePhaseForAllModules('setup', mockApp);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        '[Module Lifecycle] warning-module: Phase setup failed:',
        'Setup warning'
      );
    });

    it('should continue with other modules when one phase fails', async () => {
      loadRemote.mockResolvedValueOnce(
        createMockModule({
          id: 'failing-module',
          name: 'Failing Module',
          onSetup: vi.fn().mockRejectedValue(new Error('Setup error')),
        })
      );
      await loadAndRegisterModule(
        'failingRemote',
        './lifecycle',
        createMockModuleConfig({
          id: 'failing-module',
          remoteName: 'failingRemote',
        })
      );
      expect(getRegisteredModules().size).toBe(2);
      await executePhaseForAllModules('setup', mockApp);
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[Module Lifecycle] Completed setup phase'
      );
    });
  });

  describe('Integration: moduleLifecycleBoot', () => {
    it('should complete full lifecycle initialization with all phases in order', async () => {
      const executionOrder = [];
      setupBootTest(
        createMockModuleConfig(),
        createTrackedModule(executionOrder)
      );
      await moduleLifecycleBoot({ app: mockApp });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[Module Lifecycle] Starting module lifecycle initialization'
      );
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[Module Lifecycle] Module lifecycle initialization complete'
      );
      expect(executionOrder).toEqual([
        'setup',
        'configure',
        'initialize',
        'ready',
        'post-init',
      ]);
    });

    it('should log no modules found when modules array is empty', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponse(true, { modules: [] }));
      await moduleLifecycleBoot({ app: mockApp });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[Module Lifecycle] No enabled modules found'
      );
    });

    it('should log no modules loaded when all modules fail', async () => {
      mockFetch
        .mockResolvedValueOnce(
          mockFetchResponse(true, { modules: ['module.json'] })
        )
        .mockResolvedValueOnce(
          mockFetchResponse(true, createMockModuleConfig())
        );
      loadRemote.mockRejectedValueOnce(new Error('Load failed'));
      await moduleLifecycleBoot({ app: mockApp });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '[Module Lifecycle] No modules successfully loaded'
      );
    });

    it('should continue executing all phases even if one fails', async () => {
      const executionOrder = [];
      setupBootTest(
        createMockModuleConfig(),
        createTrackedModule(executionOrder, 'setup')
      );
      await moduleLifecycleBoot({ app: mockApp });
      expect(executionOrder).toEqual([
        'setup',
        'configure',
        'initialize',
        'ready',
        'post-init',
      ]);
    });

    it('should handle multiple modules with mixed success and failure', async () => {
      const executionOrderA = [];
      const executionOrderB = [];
      const moduleA = createTrackedModule(executionOrderA, 'configure');
      const moduleB = createTrackedModule(executionOrderB);
      moduleB.default.id = 'module-b';
      moduleB.default.name = 'Module B';
      mockFetch
        .mockResolvedValueOnce(
          mockFetchResponse(true, {
            modules: ['module-a.json', 'module-b.json'],
          })
        )
        .mockResolvedValueOnce(
          mockFetchResponse(
            true,
            createMockModuleConfig({ id: 'test-module', remoteName: 'remoteA' })
          )
        )
        .mockResolvedValueOnce(
          mockFetchResponse(
            true,
            createMockModuleConfig({ id: 'module-b', remoteName: 'remoteB' })
          )
        );
      loadRemote.mockResolvedValueOnce(moduleA).mockResolvedValueOnce(moduleB);
      await moduleLifecycleBoot({ app: mockApp });
      expect(getRegisteredModules().size).toBe(2);
      expect(executionOrderA).toEqual([
        'setup',
        'configure',
        'initialize',
        'ready',
        'post-init',
      ]);
      expect(executionOrderB).toEqual([
        'setup',
        'configure',
        'initialize',
        'ready',
        'post-init',
      ]);
    });
  });
});
