import { defineBoot } from '#q-app/wrappers';
import { createI18n } from 'vue-i18n';

import messages from 'src/i18n';

/**
 *  Type defining the available message languages
 */
export type MessageLanguages = keyof typeof messages;
// Type-define 'en-US' as the master schema for the resource
/**
 *  Type defining the message schema for the 'en-US' locale
 */
export type MessageSchema = (typeof messages)['en-US'];

// See https://vue-i18n.intlify.dev/guide/advanced/typescript.html#global-resource-schema-type-definition
/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module 'vue-i18n' {
  // define the locale messages schema
  /**
   *  Type defining the message schema for the 'en-US' locale
   */
  export interface DefineLocaleMessage extends MessageSchema {}

  // define the datetime format schema
  /**
   *  Type defining the datetime format schema for the 'en-US' locale
   */
  export interface DefineDateTimeFormat {}

  // define the number format schema
  /**
   *  Type defining the number format schema for the 'en-US' locale
   */
  export interface DefineNumberFormat {}
}
/* eslint-enable @typescript-eslint/no-empty-object-type */

export default defineBoot(({ app }) => {
  const i18n = createI18n<{ message: MessageSchema }, MessageLanguages>({
    locale: 'en-US',
    legacy: false,
    messages,
  });

  // Set i18n instance on app
  app.use(i18n);
});
