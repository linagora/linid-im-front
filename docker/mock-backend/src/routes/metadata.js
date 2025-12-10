import { Router } from 'express';
import mockEntities from '../data/entities.js';
import mockRoutes from '../data/routes.js';
import {
  validateEntities,
  validateRoutes,
} from '../validators/schemaValidator.js';

const router = Router();

// Validate static data once at startup
const routesValidation = validateRoutes(mockRoutes);
if (!routesValidation.success) {
  console.error(
    '[Mock Backend] Routes validation failed:',
    routesValidation.error.errors
  );
  throw new Error('Invalid routes data');
}

const entitiesValidation = validateEntities(mockEntities);
if (!entitiesValidation.success) {
  console.error(
    '[Mock Backend] Entities validation failed:',
    entitiesValidation.error.errors
  );
  throw new Error('Invalid entities data');
}

const validatedRoutes = routesValidation.data;
const validatedEntities = entitiesValidation.data;

/**
 * GET /metadata/routes
 * Returns all available routes metadata.
 */
router.get('/routes', (_req, res) => {
  res.json(validatedRoutes);
});

/**
 * GET /metadata/entities
 * Returns all entities metadata (without full attribute details).
 */
router.get('/entities', (_req, res) => {
  res.json(validatedEntities);
});

/**
 * GET /metadata/entities/:entity
 * Returns metadata for a specific entity.
 */
router.get('/entities/:entity', (req, res) => {
  const { entity } = req.params;
  const entityData = validatedEntities.find((e) => e.name === entity);

  if (!entityData) {
    return res.status(404).json({
      error: 'Entity not found',
      message: `Entity '${entity}' does not exist`,
      availableEntities: validatedEntities.map((e) => e.name),
    });
  }

  res.json(entityData);
});

export default router;
