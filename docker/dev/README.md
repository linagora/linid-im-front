# Environment: Development

This environment provides a mock backend for local development.  
The mock backend simulates the LinID API metadata endpoints.

## Quick Start

```bash
# Build
docker build -t linid-mock-backend docker/mock-backend/

# Clean
docker container prune -f

# Run
docker compose -f docker/dev/docker-compose.yml --env-files docker/dev/.env up
```

## Available Endpoints

| Method | Path                         | Description                              |
| ------ | ---------------------------- | ---------------------------------------- |
| GET    | `/health`                    | Health check                             |
| GET    | `/metadata/routes`           | Returns all route configurations         |
| GET    | `/metadata/entities`         | Returns all entity configurations        |
| GET    | `/metadata/entities/:entity` | Returns a specific entity config         |
| GET    | `/i18n/languages`            | Returns managed languages                |
| GET    | `/i18n/:lang.json`           | Returns messages for a specific language |

## Testing Endpoints

```bash
# Health check
curl http://localhost:8080/health

# Get all routes
curl http://localhost:8080/metadata/routes

# Get all entities
curl http://localhost:8080/metadata/entities

# Get specific entity
curl http://localhost:8080/metadata/entities/user
```

## Configuration

Environment variables can be defined in the `.env.dev` file:

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `PORT`   | `8080`  | Server port |

## Schema Validation

All responses are validated against Zod schemas to ensure compatibility with `linid-im-front-corelib` types:

- `LinIdRouteConfiguration`
- `LinIdEntityConfiguration`
- `LinIdAttributeConfiguration`

See [linid-im-api-corelib documentation](https://github.com/linagora/linid-im-api-corelib/blob/main/docs/plugins/example-config.yaml)
for the official schema reference.
