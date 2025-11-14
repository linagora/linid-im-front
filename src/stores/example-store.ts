import { acceptHMRUpdate, defineStore } from 'pinia';

export const useCounterStore = defineStore('counter', {
  /**
   * Reac
   * @returns the initial state containing a counter set to 0
   */
  state: () => ({
    counter: 0,
  }),

  getters: {
    /**
     * Returns the double of the current counter value
     * @param state - the current state of the store
     * @returns the double of the counter
     */
    doubleCount: (state) => state.counter * 2,
  },

  actions: {
    /**
     * Increments the counter by 1
     */
    increment() {
      this.counter++;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCounterStore, import.meta.hot));
}
