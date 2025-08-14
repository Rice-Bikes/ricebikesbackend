# � Rice Bikes Backend API

[![Build](https://github.com/Rice-Bikes/ricebikesbackend/actions/workflows/build.yml/badge.svg)](https://github.com/Rice-Bikes/ricebikesbackend/actions/workflows/build.yml)
[![Test](https://github.com/Rice-Bikes/ricebikesbackend/actions/workflows/test.yml/badge.svg)](https://github.com/Rice-Bikes/ricebikesbackend/actions/workflows/test.yml)
[![Code Quality](https://github.com/Rice-Bikes/ricebikesbackend/actions/workflows/code-quality.yml/badge.svg)](https://github.com/Rice-Bikes/ricebikesbackend/actions/workflows/code-quality.yml)
[![Docker Image CI](https://github.com/Rice-Bikes/ricebikesbackend/actions/workflows/docker-image.yml/badge.svg)](https://github.com/Rice-Bikes/ricebikesbackend/actions/workflows/docker-image.yml)

## 🌟 Introduction

Rice Bikes Backend API is a comprehensive TypeScript-based backend service for managing bike shop operations, transactions, inventory, customer management, and user access control. Built with modern tools and practices using Express.js, TypeScript, Prisma ORM, and JWT authentication.

## 💡 Purpose

The Rice Bikes Backend API serves as the central system for:

- 🔧 **Bike Shop Management**: Complete bike inventory and service tracking
- 💰 **Transaction Processing**: Comprehensive transaction management with items, repairs, and billing
- 👥 **Customer Management**: Customer profiles, communication, and service history
- 🔐 **Access Control**: JWT-based passwordless authentication with role-based permissions
- 📊 **Inventory Control**: Item management, stock tracking, and automated catalog updates
- 📧 **Communication**: Automated email notifications and receipt generation

## 🏗️ Architecture

### Layered Architecture Pattern

Each API module follows a consistent 5-layer architecture:

```
src/api/{module}/
├── {module}Controller.ts    # Request handling & HTTP responses
├── {module}Service.ts       # Business logic & error handling
├── {module}Repository.ts    # Data access & Prisma interactions
├── {module}Model.ts         # Zod schemas & TypeScript types
└── {module}Router.ts        # Express routes & OpenAPI docs
```

### Database Schema

Built on PostgreSQL with Prisma ORM:
- **Users & Roles**: Role-based access control system
- **Transactions**: Complete transaction lifecycle management
- **Inventory**: Items, repairs, and catalog management
- **Customers**: Customer profiles and communication tracking

## 🚀 Features

### Core Features
- 📁 **Modular Structure**: Organized by domain for easy navigation and scalability
- � **JWT Authentication**: Passwordless token-based authentication system
- 👑 **Role-Based Access Control**: Granular permissions and role management
- 💨 **Fast Execution**: TypeScript execution with `tsx` and type checking with `tsc`
- 🌐 **Stable Environment**: Latest LTS Node version in `.nvmrc`
- 🔧 **Environment Management**: Secure configuration with Envalid
- 🔗 **Path Aliases**: Clean imports with shortcut paths
- 🔄 **Auto Updates**: Renovate integration for dependency management

### API Features
- 🚴 **Bike Management**: Track bikes, models, and service history
- 💳 **Transaction System**: Complete transaction lifecycle with items and repairs
- 📦 **Inventory Control**: Stock management, categories, and automated catalog updates
- 👤 **Customer Portal**: Customer profiles, communication, and service tracking
- 🔒 **Security Layer**: Helmet for HTTP headers, CORS setup, and rate limiting
- 📊 **Comprehensive Logging**: Efficient logging with `pino-http`
- 📧 **Email Integration**: Automated notifications via Gmail OAuth2

### Development Features
- 🧪 **Comprehensive Testing**: Setup with Vitest and Supertest
- 🔑 **Code Quality**: Husky and lint-staged for consistent quality
- ✅ **Unified Style**: Biomejs for consistent coding standards
- 📃 **API Standardization**: ServiceResponse class for consistent responses
- 🐳 **Docker Support**: Ready for containerization and deployment
- 📝 **Input Validation**: Strongly typed validation using Zod
- 🧩 **Swagger UI**: Interactive API documentation from Zod schemas

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: v18+ (LTS recommended)
- **PostgreSQL**: v14+ 
- **npm**: v8+
- **Git**: Latest version

### Step-by-Step Setup

#### Step 1: 🚀 Initial Setup

```bash
# Clone the repository
git clone https://github.com/Rice-Bikes/ricebikesbackend.git
cd ricebikesbackend

# Install dependencies
npm ci
```

#### Step 2: ⚙️ Environment Configuration

Create your environment file:
```bash
cp .env.template .env
```

Configure the following environment variables in `.env`:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ricebikes"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
JWT_EXPIRES_IN="24h"

# Server Configuration
NODE_ENV="development"
HOST="localhost"
PORT=3000
CORS_ORIGIN="http://localhost:3000"

# Rate Limiting
COMMON_RATE_LIMIT_MAX_REQUESTS=1000
COMMON_RATE_LIMIT_WINDOW_MS=60000

# Email Configuration (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CLIENT_REFRESH_TOKEN="your-refresh-token"
```

#### Step 3: �️ Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database (if seed file exists)
npx prisma db seed
```

#### Step 4: 🏃‍♂️ Running the Application

**Development Mode:**
```bash
npm run dev
```
The server will start at `http://localhost:3000` with hot reload enabled.

**Production Build:**
```bash
# Build the application
npm run build

# Start production server
npm run start
```

**Other Commands:**
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Clean build directory
npm run clean
```

### 🔐 JWT Authentication Setup

The Rice Bikes API uses a passwordless JWT authentication system. Follow the [JWT Access Control Implementation Guide](./JWT_ACCESS_CONTROL_IMPLEMENTATION.md) for complete setup instructions.

**Quick Start for Authentication:**

1. **Install JWT dependencies:**
   ```bash
   npm install jsonwebtoken @types/jsonwebtoken
   ```

2. **Add authentication environment variables** (already included in step 2 above)

3. **Follow the implementation guide** to set up the complete authentication system with:
   - JWT token generation and validation
   - Role-based access control middleware
   - User management endpoints
   - Frontend integration examples

## 📚 API Documentation

### Interactive Documentation
- **Swagger UI**: Available at `http://localhost:3000/docs` when running locally
- **OpenAPI Spec**: Auto-generated from Zod schemas

### API Endpoints

#### Authentication (`/auth`)
- `GET /auth/users` - Get list of active users
- `POST /auth/generate-token` - Generate JWT token for user
- `POST /auth/validate-token` - Validate existing token
- `GET /auth/profile` - Get current user profile
- `POST /auth/refresh-token` - Refresh current token

#### Core Resources
- `GET /bikes` - Bike inventory management
- `GET /customers` - Customer management
- `GET /transactions` - Transaction processing
- `GET /items` - Inventory item management
- `GET /repairs` - Repair service management
- `GET /users` - User management (protected)
- `GET /roles` - Role management (protected)
- `GET /permissions` - Permission management (protected)

#### Utilities
- `GET /health-check` - Service health status
- `GET /summary` - Dashboard summaries

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure, stateless authentication
- **Role-Based Access**: Granular permission system
- **Token Refresh**: Automatic token renewal
- **Rate Limiting**: Protection against abuse

### Security Headers
- **Helmet**: HTTP security headers
- **CORS**: Cross-origin resource sharing configuration
- **Request Validation**: Zod schema validation on all inputs

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure
```
test/
├── data/           # Test data files
└── **/*.test.ts    # Test files co-located with source
```

## 🐳 Docker Deployment

### Development
```bash
# Build development image
docker build -t ricebikes-backend:dev .

# Run with docker-compose
docker-compose up -d
```

### Production
```bash
# Build production image
docker build --target production -t ricebikes-backend:prod .

# Run production container
docker run -p 3000:3000 --env-file .env ricebikes-backend:prod
```

## 📁 Project Structure

```
ricebikesbackend/
├── prisma/                     # Database schema and migrations
│   └── schema.prisma
├── src/
│   ├── api/                    # API modules (layered architecture)
│   │   ├── auth/              # JWT authentication system
│   │   ├── bikes/             # Bike management
│   │   ├── customer/          # Customer management
│   │   ├── security/          # Users, roles, permissions
│   │   ├── summary/           # Dashboard summaries
│   │   └── transactionComponents/  # Transaction system
│   ├── api-docs/              # OpenAPI documentation
│   ├── common/                # Shared utilities
│   │   ├── middleware/        # Express middleware
│   │   ├── models/           # Shared models
│   │   └── utils/            # Utility functions
│   ├── server.ts             # Express server setup
│   └── index.ts              # Application entry point
├── emails/                    # Email templates (React Email)
├── test/                      # Test files and data
├── workflows/                 # GitHub Actions
├── Dockerfile                 # Container configuration
├── JWT_ACCESS_CONTROL_IMPLEMENTATION.md  # Auth setup guide
└── README.md                  # This file
```

## 🤝 Feedback and Contributions

We'd love to hear your feedback and suggestions for further improvements. Feel free to contribute and join us in making backend development cleaner and faster!

🎉 Happy coding!

## 📈 Observability

We recommend a private, self-hosted observability stack for internal deployments. See `OBSERVABILITY.md` for a full analysis, quickstart Docker Compose, and implementation checklist (Prometheus, Grafana, Loki, Jaeger, Alertmanager, and synthetic monitors).
