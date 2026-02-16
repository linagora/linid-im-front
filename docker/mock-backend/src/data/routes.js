/**
 * Mock routes data following LinIdRouteConfiguration schema
 * Based on: https://github.com/linagora/linid-im-api-corelib/blob/main/docs/plugins/example-config.yaml.
 */
export default [
  {
    method: 'GET',
    path: '/entities/{entity}',
    entity: null,
    variables: ['entity'],
  },
  {
    method: 'GET',
    path: '/entities/{entity}/{id}',
    entity: null,
    variables: ['entity', 'id'],
  },
  {
    method: 'POST',
    path: '/entities/{entity}',
    entity: null,
    variables: ['entity'],
  },
  {
    method: 'PUT',
    path: '/entities/{entity}/{id}',
    entity: null,
    variables: ['entity', 'id'],
  },
  {
    method: 'DELETE',
    path: '/entities/{entity}/{id}',
    entity: null,
    variables: ['entity', 'id'],
  },
  {
    method: 'GET',
    path: '/users',
    entity: 'user',
    variables: [],
  },
  {
    method: 'GET',
    path: '/users/{id}',
    entity: 'user',
    variables: ['id'],
  },
  {
    method: 'POST',
    path: '/users',
    entity: 'user',
    variables: [],
  },
  {
    method: 'PUT',
    path: '/users/{id}',
    entity: 'user',
    variables: ['id'],
  },
  {
    method: 'GET',
    path: '/groups',
    entity: 'group',
    variables: [],
  },
  {
    method: 'GET',
    path: '/groups/{id}',
    entity: 'group',
    variables: ['id'],
  },
  {
    method: 'POST',
    path: '/groups',
    entity: 'group',
    variables: [],
  },
  {
    method: 'GET',
    path: '/restrictedDomains',
    entity: 'restrictedDomain',
    variables: [],
  },
];
