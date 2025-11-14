declare namespace NodeJS {
  /**
   * Environment variables interface.
   */
  interface ProcessEnv {
    /**
     * Node environment.
     */
    NODE_ENV: string;
    /**
     * Vue router mode.
     */
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    /**
     * Vue router base path.
     */
    VUE_ROUTER_BASE: string | undefined;
  }
}
