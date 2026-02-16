/**
 * Mock entities data following LinIdEntityConfiguration schema
 * Based on: https://github.com/linagora/linid-im-api-corelib/blob/main/docs/plugins/example-config.yaml.
 */
export default [
  {
    name: 'user',
    route: 'users',
    attributes: [
      {
        name: 'id',
        type: 'UUID',
        required: true,
        hasValidations: true,
        input: 'Text',
        inputSettings: { readonly: true },
      },
      {
        name: 'email',
        type: 'String',
        required: true,
        hasValidations: true,
        input: 'Text',
        inputSettings: {
          placeholder: 'user@example.com',
          maxLength: 255,
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        },
      },
      {
        name: 'firstName',
        type: 'String',
        required: true,
        hasValidations: true,
        input: 'Text',
        inputSettings: {
          maxLength: 100,
        },
      },
      {
        name: 'lastName',
        type: 'String',
        required: true,
        hasValidations: false,
        input: 'Text',
        inputSettings: {
          maxLength: 100,
        },
      },
      {
        name: 'displayName',
        type: 'String',
        required: false,
        hasValidations: false,
        input: 'Text',
        inputSettings: {},
      },
      {
        name: 'enabled',
        type: 'Boolean',
        required: false,
        hasValidations: false,
        input: 'Boolean',
        inputSettings: { default: true },
      },
      {
        name: 'role',
        type: 'String',
        required: false,
        hasValidations: true,
        input: 'List',
        inputSettings: {
          values: ['admin', 'user', 'guest'],
          defaultValue: 'user',
        },
      },
      {
        name: 'dateOfBirth',
        type: 'Date',
        required: false,
        hasValidations: false,
        input: 'Date',
        inputSettings: {},
      },
    ],
  },
  {
    name: 'group',
    route: 'groups',
    attributes: [
      {
        name: 'id',
        type: 'UUID',
        required: true,
        hasValidations: true,
        input: 'Text',
        inputSettings: { readonly: true },
      },
      {
        name: 'name',
        type: 'String',
        required: true,
        hasValidations: true,
        input: 'Text',
        inputSettings: {},
      },
      {
        name: 'description',
        type: 'String',
        required: false,
        hasValidations: false,
        input: 'Textarea',
        inputSettings: { rows: 3 },
      },
      {
        name: 'members',
        type: 'Array',
        required: false,
        hasValidations: false,
        input: 'Multiselect',
        inputSettings: { entity: 'user' },
      },
    ],
  },
  {
    name: 'restrictedDomain',
    route: 'restrictedDomains',
    attributes: [
      {
        name: 'id',
        type: 'UUID',
        required: true,
        hasValidations: true,
        input: 'Text',
        inputSettings: { readonly: true },
      },
      {
        name: 'name',
        type: 'String',
        required: true,
        hasValidations: true,
        input: 'Text',
        inputSettings: {},
      },
    ],
  },
];
