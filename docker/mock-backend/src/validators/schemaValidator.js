import { z } from 'zod';

/**
 * Schema for LinIdRouteConfiguration
 * Must match the TypeScript interface in linid-im-front-corelib.
 */
const RouteSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  path: z.string().min(1),
  entity: z.string().nullable(),
  variables: z.array(z.string()),
});

const RoutesArraySchema = z.array(RouteSchema);

/**
 * Schema for LinIdAttributeConfiguration.
 */
const AttributeSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean(),
  hasValidations: z.boolean(),
  input: z.string().min(1),
  inputSettings: z.record(z.unknown()),
});

/**
 * Schema for LinIdEntityConfiguration.
 */
const EntitySchema = z.object({
  name: z.string().min(1),
  attributes: z.array(AttributeSchema),
});

const EntitiesArraySchema = z.array(EntitySchema);

/**
 * Validates routes data against schema.
 * @param data - Data to validate.
 * @returns Validation result.
 */
export function validateRoutes(data) {
  return RoutesArraySchema.safeParse(data);
}

/**
 * Validates entities data against schema.
 * @param data - Data to validate.
 * @returns Validation result.
 */
export function validateEntities(data) {
  return EntitiesArraySchema.safeParse(data);
}

// Export schemas for external use
export { RouteSchema, AttributeSchema, EntitySchema };
