# Rice Bikes Backend - Docker CI/CD Setup

This repository contains the GitHub Actions workflow for automated Docker image building and deployment of the Rice Bikes backend API.

## Overview

The backend application is built with:

- **Runtime**: Node.js 23.x
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based access control
- **Email**: React Email for templates

## Docker Image Build Process

### Automated Builds

The Docker image is automatically built and pushed to GitHub Container Registry (GHCR) when:

- **Push to `main` branch**: Creates `latest` tag and branch-specific tag
- **Push to `develop` branch**: Creates branch-specific tag
- **Pull Requests**: Builds image for testing (doesn't push)
- **Tags**: Creates versioned releases (e.g., `v1.0.0`, `1.0`, `1`)

### Workflow Steps

1. **Code Quality Checks**

   - Install dependencies
   - Generate Prisma client
   - Run tests (`npm test`)
   - Run linting (`npm run lint`)
   - Build application (`npm run build`)

2. **Docker Build**

   - Multi-platform build (AMD64, ARM64)
   - Efficient layer caching
   - Metadata extraction for proper tagging

3. **Security Scanning**
   - Vulnerability scanning with Trivy
   - Results uploaded to GitHub Security tab

### Image Registry

Images are published to: `ghcr.io/rice-bikes/ricebikesbackend`

Available tags:

- `latest` (latest main branch)
- `main` (main branch)
- `develop` (develop branch)
- `v1.0.0` (version tags)
- `pr-123` (pull request builds)

## Local Development

### Prerequisites

- Node.js 23.x
- npm
- Docker
- PostgreSQL (or use Docker Compose)

### Building Locally

```bash
# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Run tests
npm test

# Build application
npm run build

# Build Docker image
docker build -t ricebikes-backend .

# Run container (requires database connection)
docker run -p 7130:7130 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/ricebikes" \
  ricebikes-backend
```

### Development with Docker Compose

```bash
# Start all services (from root directory)
docker-compose up --build

# Backend will be available at http://localhost:7130
# Database will be available at localhost:5432
```

## Environment Variables

The backend requires the following environment variables:

### Required

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing

### Optional

- `CORS_ORIGIN`: Allowed CORS origins (default: `http://localhost:5173`)
- `PORT`: Server port (default: `7130`)
- `NODE_ENV`: Environment mode (`development`, `production`)

### Example `.env` file:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ricebikes"
JWT_SECRET="your-super-secret-jwt-key"
CORS_ORIGIN="http://localhost:5173"
PORT=7130
NODE_ENV=development
```

## Dockerfile Structure

```dockerfile
FROM node:23.11.0-slim
WORKDIR /usr/src/app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN apt-get update -y && apt-get install -y openssl
COPY . .
RUN npm run build
RUN npx prisma generate
EXPOSE 7130
CMD npm run start
```

## Database Management

### Prisma Migrations

```bash
# Create a new migration
npx prisma migrate dev --name description

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

### Database Seeding

```bash
# Seed the database
npx prisma db seed
```

## API Documentation

The backend provides automatic API documentation:

- **Swagger UI**: `http://localhost:7130/api-docs`
- **OpenAPI JSON**: `http://localhost:7130/api-docs/swagger.json`

## Deployment

### Manual Deployment

```bash
# Pull latest image
docker pull ghcr.io/rice-bikes/ricebikesbackend:latest

# Run container
docker run -d \
  --name ricebikes-backend \
  -p 7130:7130 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/ricebikes" \
  -e JWT_SECRET="your-jwt-secret" \
  ghcr.io/rice-bikes/ricebikesbackend:latest
```

### Production Deployment with Docker Compose

```yaml
version: "3.9"
services:
  backend:
    image: ghcr.io/rice-bikes/ricebikesbackend:latest
    ports:
      - "7130:7130"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/ricebikes
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGIN=https://your-frontend-domain.com
    depends_on:
      - db

  db:
    image: postgres:17
    environment:
      POSTGRES_DB: ricebikes
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ricebikes-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ricebikes-backend
  template:
    metadata:
      labels:
        app: ricebikes-backend
    spec:
      containers:
        - name: backend
          image: ghcr.io/rice-bikes/ricebikesbackend:latest
          ports:
            - containerPort: 7130
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: ricebikes-secrets
                  key: database-url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: ricebikes-secrets
                  key: jwt-secret
---
apiVersion: v1
kind: Service
metadata:
  name: ricebikes-backend-service
spec:
  selector:
    app: ricebikes-backend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 7130
  type: LoadBalancer
```

## Secrets Configuration

Configure these secrets in your GitHub repository settings:

### Required

- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

### Optional (for enhanced deployment)

- `DATABASE_URL`: Production database connection
- `JWT_SECRET`: JWT signing secret
- `DEPLOY_SSH_KEY`: SSH key for server deployment
- `DEPLOY_HOST`: Production server hostname
- `SLACK_WEBHOOK`: Notifications webhook

## Monitoring and Logging

### Health Checks

The backend provides health check endpoints:

- **Health**: `GET /health`
- **Database**: `GET /health/db`

### Logging

```bash
# View container logs
docker logs ricebikes-backend

# Follow logs in real-time
docker logs -f ricebikes-backend

# Check specific number of lines
docker logs --tail 100 ricebikes-backend
```

### Metrics

Production deployments should include:

- **Prometheus metrics**: `/metrics` endpoint
- **Application monitoring**: New Relic, DataDog, etc.
- **Database monitoring**: PostgreSQL statistics

## Security

### Container Security

- Regular base image updates
- Vulnerability scanning with Trivy
- Non-root user in container
- Minimal attack surface

### Application Security

- JWT token validation
- Input sanitization
- SQL injection prevention (Prisma)
- CORS configuration
- Rate limiting

## Troubleshooting

### Common Issues

1. **Build Failures**

   - Check Node.js version compatibility
   - Verify Prisma schema is valid
   - Review test failures in Actions logs

2. **Database Connection Issues**

   - Verify DATABASE_URL format
   - Check network connectivity
   - Ensure database is running and accessible

3. **Runtime Issues**
   - Check environment variables
   - Review container logs
   - Verify JWT_SECRET is set

### Debug Commands

```bash
# Check container status
docker ps

# Execute into container
docker exec -it ricebikes-backend sh

# Check database connection
docker exec ricebikes-backend npx prisma db push --preview-feature

# View environment variables
docker exec ricebikes-backend env

# Test API endpoints
curl http://localhost:7130/health
```

### Common Error Solutions

#### "Can't reach database server"

```bash
# Check if database is running
docker ps | grep postgres

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"
```

#### "JWT must be provided"

```bash
# Verify JWT_SECRET is set
echo $JWT_SECRET

# Check token format in requests
curl -H "Authorization: Bearer your-token" http://localhost:7130/api/protected
```

## Contributing

1. Create feature branch from `develop`
2. Make changes and test locally
3. Update database schema if needed:
   ```bash
   npx prisma migrate dev --name feature-description
   ```
4. Submit pull request
5. Automated tests and builds will run
6. Merge to `develop` for staging deployment
7. Merge to `main` for production deployment

## API Endpoints

### Authentication

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh JWT token

### Users

- `GET /api/users` - List users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Items

- `GET /api/items` - List items
- `POST /api/items` - Create item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Order Requests

- `GET /api/order-requests` - List order requests
- `POST /api/order-requests` - Create order request
- `PUT /api/order-requests/:id` - Update order request
- `DELETE /api/order-requests/:id` - Delete order request

## Links

- [Backend Repository](https://github.com/Rice-Bikes/ricebikesbackend)
- [Frontend Repository](https://github.com/Rice-Bikes/ricebikesapp)
- [Docker Images](https://github.com/orgs/Rice-Bikes/packages)
- [GitHub Actions](https://github.com/Rice-Bikes/ricebikesbackend/actions)
- [API Documentation](http://localhost:7130/api-docs)
