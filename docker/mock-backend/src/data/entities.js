/**
 * Mock entities data following LinIdEntityConfiguration schema
 * Based on: https://github.com/linagora/linid-im-api-corelib/blob/main/docs/plugins/example-config.yaml.
 */
export default [
  {
    name: 'user',
    attributes: [
      {
        name: 'id',
        type: 'UUID',
        required: true,
        hasValidations: true,
        input: 'text',
        inputSettings: { readonly: true },
      },
      {
        name: 'email',
        type: 'string',
        required: true,
        hasValidations: true,
        input: 'email',
        inputSettings: { placeholder: 'user@example.com' },
      },
      {
        name: 'firstName',
        type: 'string',
        required: true,
        hasValidations: false,
        input: 'text',
        inputSettings: {},
      },
      {
        name: 'lastName',
        type: 'string',
        required: true,
        hasValidations: false,
        input: 'text',
        inputSettings: {},
      },
      {
        name: 'displayName',
        type: 'string',
        required: false,
        hasValidations: false,
        input: 'text',
        inputSettings: {},
      },
      {
        name: 'enabled',
        type: 'boolean',
        required: false,
        hasValidations: false,
        input: 'checkbox',
        inputSettings: { default: true },
      },
      {
        name: 'role',
        type: 'string',
        required: false,
        hasValidations: true,
        input: 'select',
        inputSettings: {
          options: ['admin', 'user', 'guest'],
          default: 'user',
        },
      },
    ],
  },
  {
    name: 'group',
    attributes: [
      {
        name: 'id',
        type: 'UUID',
        required: true,
        hasValidations: true,
        input: 'text',
        inputSettings: { readonly: true },
      },
      {
        name: 'name',
        type: 'string',
        required: true,
        hasValidations: true,
        input: 'text',
        inputSettings: {},
      },
      {
        name: 'description',
        type: 'string',
        required: false,
        hasValidations: false,
        input: 'textarea',
        inputSettings: { rows: 3 },
      },
      {
        name: 'members',
        type: 'array',
        required: false,
        hasValidations: false,
        input: 'multiselect',
        inputSettings: { entity: 'user' },
      },
    ],
  },
];
