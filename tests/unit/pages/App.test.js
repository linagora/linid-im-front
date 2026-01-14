import { uiEventSubject } from '@linagora/linid-im-front-corelib';
import { shallowMount } from '@vue/test-utils';
import { Notify } from 'quasar';
import App from 'src/App.vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('quasar', () => ({
  Notify: {
    create: vi.fn(),
  },
}));

describe('Test component: App.vue', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('test onMounted', () => {
    let subscribeSpy;

    beforeEach(() => {
      subscribeSpy = vi.spyOn(uiEventSubject, 'subscribe');
      wrapper = shallowMount(App, {
        global: {
          stubs: {
            RouterView: true,
          },
        },
      });
    });

    afterEach(() => {
      wrapper.unmount();
      wrapper = null;
      vi.restoreAllMocks();
    });

    it('should subscribe to uiEventSubject on mount', () => {
      expect(subscribeSpy).toHaveBeenCalledTimes(1);
    });

    it('should call Notify.create when receiving notify event', () => {
      const notifyOptions = {
        message: 'Test notification',
        type: 'positive',
      };

      uiEventSubject.next({
        key: 'notify',
        data: notifyOptions,
      });

      expect(Notify.create).toHaveBeenCalledWith(notifyOptions);
    });

    it('should not call Notify.create for non-notify events', () => {
      uiEventSubject.next({
        key: 'other-event',
        data: { some: 'data' },
      });

      expect(Notify.create).not.toHaveBeenCalled();
    });

    it('should handle multiple notify events', () => {
      const firstNotify = {
        message: 'First notification',
        type: 'positive',
      };

      const secondNotify = {
        message: 'Second notification',
        type: 'negative',
      };

      uiEventSubject.next({
        key: 'notify',
        data: firstNotify,
      });

      uiEventSubject.next({
        key: 'notify',
        data: secondNotify,
      });

      expect(Notify.create).toHaveBeenCalledTimes(2);
      expect(Notify.create).toHaveBeenNthCalledWith(1, firstNotify);
      expect(Notify.create).toHaveBeenNthCalledWith(2, secondNotify);
    });
  });

  describe('test onUnmounted', () => {
    it('should unsubscribe from uiEventSubject on unmount', () => {
      const unsubscribeSpy = vi.fn();
      vi.spyOn(uiEventSubject, 'subscribe').mockReturnValue({
        unsubscribe: unsubscribeSpy,
      });

      wrapper = shallowMount(App, {
        global: {
          stubs: {
            RouterView: true,
          },
        },
      });

      wrapper.unmount();
      wrapper = null;

      expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
    });
  });
});
