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
docker compose -f docker/dev/docker-compose.yml --env-file docker/dev/.env up
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
| GET    | `/api/users`                 | Returns a list of users (for testing)    |
| GET    | `/api/users/:id`             | Returns a specific user (for testing)    |
| POST   | `/api/users`                 | Creates a new user (for testing)         |
| POST   | `/api/users/validate/:field` | Validates a specific field (for testing) |
| PUT    | `/api/users/:id`             | Updates a specific user (for testing)    |

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

# Get supported languages
curl http://localhost:8080/i18n/languages

# Get messages for a specific language
curl http://localhost:8080/i18n/en-US.json

# Get all users (testing)
curl http://localhost:8080/api/users

# Get specific user (testing)
curl http://localhost:8080/api/users/1

# Create a new user (testing)
curl -X POST http://localhost:8080/api/users -H "Content-Type: application/json" -d '{"firstName": "John", "lastName": "Doe", "displayName": "johndoe", "enabled": true, "role": "user", "dateOfBirth": "1990/01/01"}'

# Validate a specific field (testing)
curl -X POST http://localhost:8080/api/users/validate/firstName -H "Content-Type: application/json" -d 'johndoe'

# Update a specific user (testing)
curl -X PUT http://localhost:8080/api/users/1 -H "Content-Type: application/json" -d '{"firstName": "John", "lastName": "Doe", "displayName": "john.doe", "enabled": true, "role": "admin", "dateOfBirth": "1990/01/01"}'
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
