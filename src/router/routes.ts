import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    /**
     * Main layout route
     * @returns the MainLayout page component
     */
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        /**
         * Home page route
         * @returns the IndexPage component
         */
        component: () => import('pages/IndexPage.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    /**
     * Component to display when no matching route is found
     * @returns the ErrorNotFound page component
     */
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
