declare module 'catalog-ui/*' {
  import type { DefineComponent } from 'vue';

  /**
   * This declaration allows TypeScript to recognize imports
   * from the 'catalog-ui/*' path pattern as Vue components.
   */
  const component: DefineComponent<
    Record<string, unknown>,
    Record<string, unknown>,
    unknown
  >;
  export default component;
}
