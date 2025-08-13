# JWT Access Control Implementation Guide

This guide provides step-by-step instructions to implement JWT-based access control in the Rice Bikes backend project without password authentication.

## Overview

The implementation includes:
- JWT token generation and verification for frontend-generated tokens
- Authentication middleware for token validation
- Role-based authorization middleware
- Token validation and user profile endpoints
- Protected routes with role/permission-based access control

## Prerequisites

Ensure you have the following database schema already set up (which you do):
- `Users` table with roles
- `Roles` table
- `UserRoles` junction table
- `Permissions` table
- `RolePermissions` junction table

## Step 1: Install Dependencies

```bash
cd /Users/chasegeyer/actual-rice-bikes/ricebikesbackend
npm install jsonwebtoken @types/jsonwebtoken
```

## Step 2: Update Environment Configuration

### 2.1 Update `src/common/utils/envConfig.ts`

Add JWT configuration to your environment config:

```typescript
import dotenv from "dotenv";
import { cleanEnv, host, num, port, str, testOnly } from "envalid";

dotenv.config();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ devDefault: testOnly("test"), choices: ["development", "production", "test"] }),
  HOST: host({ devDefault: testOnly("localhost") }),
  PORT: port({ devDefault: testOnly(3000) }),
  CORS_ORIGIN: str({ devDefault: testOnly("http://localhost:3000") }),
  COMMON_RATE_LIMIT_MAX_REQUESTS: num({ devDefault: testOnly(1000) }),
  COMMON_RATE_LIMIT_WINDOW_MS: num({ devDefault: testOnly(1000) }),
  JWT_SECRET: str({ devDefault: testOnly("your-super-secret-jwt-key-change-in-production") }),
  JWT_EXPIRES_IN: str({ devDefault: testOnly("24h") }),
});
```

### 2.2 Update your `.env` file

Add these environment variables:

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-characters
JWT_EXPIRES_IN=24h
```

## Step 3: Update Prisma Schema (Optional)

Since we're not using password authentication, the existing schema is sufficient. However, if you want to track token-related information, you can optionally add fields:

### 3.1 Optional additions to Users model

Update `prisma/schema.prisma` if you want to track user sessions:

```prisma
model Users {
  user_id         String            @id @default(uuid()) @db.Uuid
  firstname       String
  lastname        String
  active          Boolean
  username        String            @unique
  email           String?           @unique // Optional: add email if not exists
  last_login      DateTime?         @db.Timestamp() // Optional: track last login
  created_at      DateTime          @default(now()) @db.Timestamp()
  updated_at      DateTime          @updatedAt @db.Timestamp()
  OrderRequests   OrderRequests[]
  TransactionLogs TransactionLogs[]
  UserRoles       UserRoles[]
}
```

### 3.2 Run Prisma migration (if you made changes)

```bash
npx prisma migrate dev --name add-user-tracking
npx prisma generate
```

**Important**: Use a strong, unique JWT secret in production (minimum 32 characters).

## Step 4: Create JWT Utilities

### 4.1 Create `src/common/utils/jwtUtils.ts`

```typescript
import jwt from "jsonwebtoken";
import { env } from "./envConfig";

export interface JWTPayload {
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
}

export class JWTUtils {
  private static readonly SECRET = env.JWT_SECRET;
  private static readonly EXPIRES_IN = env.JWT_EXPIRES_IN;

  /**
   * Generate JWT token with user data (for frontend or external services)
   */
  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.SECRET, {
      expiresIn: this.EXPIRES_IN,
      issuer: "rice-bikes-api",
      audience: "rice-bikes-frontend",
    });
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.SECRET, {
        issuer: "rice-bikes-api",
        audience: "rice-bikes-frontend",
      }) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.substring(7); // Remove "Bearer " prefix
  }

  /**
   * Generate a token for a user by ID (looks up user data from database)
   */
  static async generateTokenForUser(userId: string): Promise<string | null> {
    try {
      // This will be implemented in the auth service
      const { authRepository } = await import("../api/auth/authRepository");
      const user = await authRepository.findUserById(userId);
      
      if (!user || !user.active) {
        return null;
      }

      const roles = user.UserRoles.map(ur => ur.Role.name);
      const permissions = user.UserRoles.flatMap(ur => 
        ur.Role.RolePermissions.map(rp => rp.Permission.name)
      );
      const uniquePermissions = [...new Set(permissions)];

      const payload: JWTPayload = {
        userId: user.user_id,
        username: user.username,
        roles,
        permissions: uniquePermissions,
      };

      return this.generateToken(payload);
    } catch (error) {
      console.error("Error generating token for user:", error);
      return null;
    }
  }
}
```

## Step 5: Create Authentication Middleware

### 5.1 Update `src/common/middleware/authentication.ts`

```typescript
import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { JWTUtils, type JWTPayload } from "@/common/utils/jwtUtils";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = JWTUtils.extractTokenFromHeader(authHeader);

  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "Access token is required",
      statusCode: StatusCodes.UNAUTHORIZED,
    });
  }

  const payload = JWTUtils.verifyToken(token);
  if (!payload) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "Invalid or expired token",
      statusCode: StatusCodes.UNAUTHORIZED,
    });
  }

  req.user = payload;
  next();
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
        statusCode: StatusCodes.UNAUTHORIZED,
      });
    }

    const userRoles = req.user.roles;
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: `Access denied. Required roles: ${requiredRoles.join(", ")}`,
        statusCode: StatusCodes.FORBIDDEN,
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has required permission
 */
export const requirePermission = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
        statusCode: StatusCodes.UNAUTHORIZED,
      });
    }

    const userPermissions = req.user.permissions;
    const hasRequiredPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );

    if (!hasRequiredPermission) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: `Access denied. Required permissions: ${requiredPermissions.join(", ")}`,
        statusCode: StatusCodes.FORBIDDEN,
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = JWTUtils.extractTokenFromHeader(authHeader);

  if (token) {
    const payload = JWTUtils.verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
};
```

## Step 6: Create Authentication Service

### 6.1 Create `src/api/auth/authModel.ts`

```typescript
import { z } from "zod";

export const TokenRequestSchema = z.object({
  userId: z.string().uuid("Valid user ID is required"),
});

export const ValidateTokenRequestSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export type TokenRequest = z.infer<typeof TokenRequestSchema>;
export type ValidateTokenRequest = z.infer<typeof ValidateTokenRequestSchema>;

export interface TokenResponse {
  token: string;
  user: {
    id: string;
    username: string;
    firstname: string;
    lastname: string;
    email?: string;
    roles: string[];
    permissions: string[];
  };
}

export interface UserProfile {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  email?: string;
  active: boolean;
  roles: string[];
  permissions: string[];
  lastLogin?: string;
}
```

### 6.2 Create `src/api/auth/authRepository.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class AuthRepository {
  async findUserByUsername(username: string) {
    return prisma.users.findUnique({
      where: { username },
      include: {
        UserRoles: {
          include: {
            Role: {
              include: {
                RolePermissions: {
                  include: {
                    Permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findUserById(userId: string) {
    return prisma.users.findUnique({
      where: { user_id: userId },
      include: {
        UserRoles: {
          include: {
            Role: {
              include: {
                RolePermissions: {
                  include: {
                    Permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async updateUserLastLogin(userId: string) {
    return prisma.users.update({
      where: { user_id: userId },
      data: { 
        last_login: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async getAllActiveUsers() {
    return prisma.users.findMany({
      where: { active: true },
      select: {
        user_id: true,
        username: true,
        firstname: true,
        lastname: true,
        email: true,
        active: true,
        created_at: true,
        last_login: true,
      },
    });
  }
}

export const authRepository = new AuthRepository();
```

### 6.3 Create `src/api/auth/authService.ts`

```typescript
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { JWTUtils } from "@/common/utils/jwtUtils";
import { authRepository } from "./authRepository";
import type { TokenRequest, ValidateTokenRequest, TokenResponse, UserProfile } from "./authModel";

export class AuthService {
  /**
   * Generate a token for a specific user (for frontend to request)
   */
  async generateTokenForUser(tokenData: TokenRequest): Promise<ServiceResponse<TokenResponse | null>> {
    try {
      const user = await authRepository.findUserById(tokenData.userId);

      if (!user) {
        return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
      }

      if (!user.active) {
        return ServiceResponse.failure("User account is deactivated", null, StatusCodes.FORBIDDEN);
      }

      // Extract roles and permissions
      const roles = user.UserRoles.map(ur => ur.Role.name);
      const permissions = user.UserRoles.flatMap(ur => 
        ur.Role.RolePermissions.map(rp => rp.Permission.name)
      );

      // Remove duplicates
      const uniquePermissions = [...new Set(permissions)];

      const tokenPayload = {
        userId: user.user_id,
        username: user.username,
        roles,
        permissions: uniquePermissions,
      };

      const token = JWTUtils.generateToken(tokenPayload);

      // Update last login time
      await authRepository.updateUserLastLogin(user.user_id);

      const tokenResponse: TokenResponse = {
        token,
        user: {
          id: user.user_id,
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email || undefined,
          roles,
          permissions: uniquePermissions,
        },
      };

      return ServiceResponse.success("Token generated successfully", tokenResponse);
    } catch (error) {
      const errorMessage = `Error generating token: ${error}`;
      return ServiceResponse.failure(errorMessage, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Validate a token and return user info
   */
  async validateToken(validateData: ValidateTokenRequest): Promise<ServiceResponse<UserProfile | null>> {
    try {
      const payload = JWTUtils.verifyToken(validateData.token);
      if (!payload) {
        return ServiceResponse.failure("Invalid or expired token", null, StatusCodes.UNAUTHORIZED);
      }

      // Verify user still exists and is active
      const user = await authRepository.findUserById(payload.userId);
      if (!user || !user.active) {
        return ServiceResponse.failure("User not found or deactivated", null, StatusCodes.UNAUTHORIZED);
      }

      // Get fresh roles and permissions (in case they changed)
      const roles = user.UserRoles.map(ur => ur.Role.name);
      const permissions = user.UserRoles.flatMap(ur => 
        ur.Role.RolePermissions.map(rp => rp.Permission.name)
      );
      const uniquePermissions = [...new Set(permissions)];

      const userProfile: UserProfile = {
        id: user.user_id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email || undefined,
        active: user.active,
        roles,
        permissions: uniquePermissions,
        lastLogin: user.last_login?.toISOString(),
      };

      return ServiceResponse.success("Token is valid", userProfile);
    } catch (error) {
      const errorMessage = `Error validating token: ${error}`;
      return ServiceResponse.failure(errorMessage, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get user profile from token in request
   */
  async getUserProfile(userId: string): Promise<ServiceResponse<UserProfile | null>> {
    try {
      const user = await authRepository.findUserById(userId);
      if (!user) {
        return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
      }

      const roles = user.UserRoles.map(ur => ur.Role.name);
      const permissions = user.UserRoles.flatMap(ur => 
        ur.Role.RolePermissions.map(rp => rp.Permission.name)
      );
      const uniquePermissions = [...new Set(permissions)];

      const userProfile: UserProfile = {
        id: user.user_id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email || undefined,
        active: user.active,
        roles,
        permissions: uniquePermissions,
        lastLogin: user.last_login?.toISOString(),
      };

      return ServiceResponse.success("User profile retrieved", userProfile);
    } catch (error) {
      const errorMessage = `Error retrieving user profile: ${error}`;
      return ServiceResponse.failure(errorMessage, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get all active users (for frontend to choose from)
   */
  async getActiveUsers(): Promise<ServiceResponse<any[] | null>> {
    try {
      const users = await authRepository.getAllActiveUsers();
      return ServiceResponse.success("Active users retrieved", users);
    } catch (error) {
      const errorMessage = `Error retrieving active users: ${error}`;
      return ServiceResponse.failure(errorMessage, null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}

export const authService = new AuthService();
```

### 6.4 Create `src/api/auth/authController.ts`

```typescript
import type { Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { handleServiceResponse } from "@/common/utils/httpHandlers";
import { authService } from "./authService";
import { TokenRequestSchema, ValidateTokenRequestSchema } from "./authModel";

class AuthController {
  public generateToken: RequestHandler = async (req: Request, res: Response) => {
    try {
      const tokenData = TokenRequestSchema.parse(req.body);
      const serviceResponse = await authService.generateTokenForUser(tokenData);
      return handleServiceResponse(serviceResponse, res);
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid request data",
        statusCode: StatusCodes.BAD_REQUEST,
        data: null,
      });
    }
  };

  public validateToken: RequestHandler = async (req: Request, res: Response) => {
    try {
      const validateData = ValidateTokenRequestSchema.parse(req.body);
      const serviceResponse = await authService.validateToken(validateData);
      return handleServiceResponse(serviceResponse, res);
    } catch (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid request data",
        statusCode: StatusCodes.BAD_REQUEST,
        data: null,
      });
    }
  };

  public getProfile: RequestHandler = async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
        statusCode: StatusCodes.UNAUTHORIZED,
        data: null,
      });
    }

    const serviceResponse = await authService.getUserProfile(userId);
    return handleServiceResponse(serviceResponse, res);
  };

  public getActiveUsers: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await authService.getActiveUsers();
    return handleServiceResponse(serviceResponse, res);
  };

  public refreshToken: RequestHandler = async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required",
        statusCode: StatusCodes.UNAUTHORIZED,
        data: null,
      });
    }

    try {
      const serviceResponse = await authService.generateTokenForUser({ userId });
      return handleServiceResponse(serviceResponse, res);
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error refreshing token",
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        data: null,
      });
    }
  };
}

export const authController = new AuthController();
```

### 6.5 Create `src/api/auth/authRouter.ts`

```typescript
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { authenticateToken } from "@/common/middleware/authentication";
import { authController } from "./authController";
import { TokenRequestSchema, ValidateTokenRequestSchema } from "./authModel";

export const authRegistry = new OpenAPIRegistry();
export const authRouter: Router = express.Router();

// Schemas for OpenAPI documentation
authRegistry.register("TokenResponse", z.object({
  token: z.string(),
  user: z.object({
    id: z.string(),
    username: z.string(),
    firstname: z.string(),
    lastname: z.string(),
    email: z.string().optional(),
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
  }),
}));

authRegistry.register("UserProfile", z.object({
  id: z.string(),
  username: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  email: z.string().optional(),
  active: z.boolean(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  lastLogin: z.string().optional(),
}));

authRegistry.register("ActiveUser", z.object({
  user_id: z.string(),
  username: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  email: z.string().optional(),
  active: z.boolean(),
  created_at: z.string(),
  last_login: z.string().optional(),
}));

// Generate token endpoint
authRegistry.registerPath({
  method: "post",
  path: "/auth/generate-token",
  tags: ["Authentication"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: TokenRequestSchema,
        },
      },
    },
  },
  responses: createApiResponse(z.object({
    token: z.string(),
    user: z.object({
      id: z.string(),
      username: z.string(),
      firstname: z.string(),
      lastname: z.string(),
      email: z.string().optional(),
      roles: z.array(z.string()),
      permissions: z.array(z.string()),
    }),
  }), "Token generated successfully"),
});

// Validate token endpoint
authRegistry.registerPath({
  method: "post",
  path: "/auth/validate-token",
  tags: ["Authentication"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ValidateTokenRequestSchema,
        },
      },
    },
  },
  responses: createApiResponse(z.object({
    id: z.string(),
    username: z.string(),
    firstname: z.string(),
    lastname: z.string(),
    email: z.string().optional(),
    active: z.boolean(),
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
    lastLogin: z.string().optional(),
  }), "Token is valid"),
});

// Get active users endpoint
authRegistry.registerPath({
  method: "get",
  path: "/auth/users",
  tags: ["Authentication"],
  responses: createApiResponse(z.array(z.object({
    user_id: z.string(),
    username: z.string(),
    firstname: z.string(),
    lastname: z.string(),
    email: z.string().optional(),
    active: z.boolean(),
    created_at: z.string(),
    last_login: z.string().optional(),
  })), "Active users retrieved"),
});

// Routes
authRouter.post("/generate-token", authController.generateToken);
authRouter.post("/validate-token", authController.validateToken);
authRouter.get("/profile", authenticateToken, authController.getProfile);
authRouter.get("/users", authController.getActiveUsers);
authRouter.post("/refresh-token", authenticateToken, authController.refreshToken);
```

## Step 7: Update Server Configuration

### 7.1 Update `src/server.ts`

Add the auth router to your server:

```typescript
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";

import { openAPIRouter } from "@/api-docs/openAPIRouter";
import errorHandler from "@/common/middleware/errorHandler";
import requestLogger from "@/common/middleware/requestLogger";
import { env } from "@/common/utils/envConfig";
import { authRouter } from "./api/auth/authRouter"; // Add this import
import { bikesRouter } from "./api/bikes/bikesRouter";
import { customerRouter } from "./api/customer/customerRouter";
import { healthCheckRouter } from "./api/healthCheck/healthCheckRouter";
import { permissionsRouter } from "./api/security/permissions/permissionRouter";
import { roleRouter } from "./api/security/roles/roleRouter";
import { userRouter } from "./api/security/users/userRouter";
import { summaryRouter } from "./api/summary/summaryRouter";
import { itemRouter } from "./api/transactionComponents/items/itemRouter";
import { OrderRequestsRouter } from "./api/transactionComponents/orderRequests/orderRequestsRouter";
import { repairRouter } from "./api/transactionComponents/repairs/repairRouter";
import { transactionDetailsRouter } from "./api/transactionComponents/transactionDetails/transactionDetailsRouter";
import { transactionLogsRouter } from "./api/transactionComponents/transactionLogs/transactionLogsRouter";
import { transactionRouter } from "./api/transactionComponents/transactions/transactionRouter";

const logger = pino({ name: "server start" });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set("trust proxy", true);

// Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
// app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Public routes (no authentication required)
app.use("/health-check", healthCheckRouter);
app.use("/auth", authRouter); // Add this line

// Protected routes (require authentication)
// You can add authentication middleware here or to individual routes
app.use("/transactions", transactionRouter);
app.use("/transactionDetails", transactionDetailsRouter);
app.use("/bikes", bikesRouter);
app.use("/customers", customerRouter);
app.use("/users", userRouter);
app.use("/items", itemRouter);
app.use("/repairs", repairRouter);
app.use("/summary", summaryRouter);
app.use("/orderRequests", OrderRequestsRouter);
app.use("/transactionLogs", transactionLogsRouter);
app.use("/roles", roleRouter);
app.use("/permissions", permissionsRouter);

// Swagger UI
app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());

export { app, logger };
```

## Step 8: Protect Existing Routes

To protect your existing routes, you have several options:

### Option A: Protect all routes with global middleware

Add authentication middleware before your route definitions in `server.ts`:

```typescript
// Request logging
app.use(requestLogger);

// Public routes (no authentication required)
app.use("/health-check", healthCheckRouter);
app.use("/auth", authRouter);

// Apply authentication to all remaining routes
app.use(authenticateToken);

// Protected routes
app.use("/transactions", transactionRouter);
// ... rest of your routes
```

### Option B: Protect individual routes

Add authentication to specific routers. For example, in `src/api/bikes/bikesRouter.ts`:

```typescript
import { authenticateToken, requireRole, requirePermission } from "@/common/middleware/authentication";

// Protect all bike routes
bikesRouter.use(authenticateToken);

// Or protect specific routes
bikesRouter.get("/", authenticateToken, bikesController.getBikes);
bikesRouter.post("/", authenticateToken, requireRole(["admin", "manager"]), bikesController.createBike);
bikesRouter.delete("/:id", authenticateToken, requirePermission(["delete_bikes"]), bikesController.deleteBike);
```

## Step 9: Testing the Implementation

### 9.1 Test the authentication endpoints

```bash
# Get list of active users (to get user IDs)
curl -X GET http://localhost:3000/auth/users

# Generate token for a specific user
curl -X POST http://localhost:3000/auth/generate-token \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID_HERE"
  }'

# Validate a token
curl -X POST http://localhost:3000/auth/validate-token \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_JWT_TOKEN_HERE"
  }'

# Test protected route (use token from generate-token response)
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Refresh token (get a new token with same user info)
curl -X POST http://localhost:3000/auth/refresh-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Step 10: Frontend Integration

### 10.1 Frontend Authentication Flow

1. **Get Users**: Fetch list of active users from `/auth/users`
2. **User Selection**: Allow user to select their account (or use some other identification method)
3. **Generate Token**: Send user ID to `/auth/generate-token` to get a JWT
4. **Store Token**: Save the JWT token in localStorage, sessionStorage, or a secure cookie
5. **Send Token**: Include the token in the Authorization header for all API requests
6. **Handle Errors**: Redirect to user selection on 401 responses
7. **Token Refresh**: Use `/auth/refresh-token` to get a new token before expiration

### 10.2 Example Frontend Code (JavaScript/TypeScript)

```typescript
// Authentication service
class AuthService {
  private static TOKEN_KEY = 'rice-bikes-token';
  private static USER_KEY = 'rice-bikes-user';

  // Get list of available users
  static async getUsers() {
    const response = await fetch('/auth/users');
    if (response.ok) {
      const data = await response.json();
      return data.data;
    }
    throw new Error('Failed to fetch users');
  }

  // Generate token for selected user
  static async generateToken(userId: string) {
    const response = await fetch('/auth/generate-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem(this.TOKEN_KEY, data.data.token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(data.data.user));
      return data.data;
    }
    throw new Error('Token generation failed');
  }

  // Validate current token
  static async validateToken() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return false;

    const response = await fetch('/auth/validate-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    return response.ok;
  }

  // Make authenticated API call
  static async apiCall(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem(this.TOKEN_KEY);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    // If unauthorized, try to refresh token once
    if (response.status === 401 && token) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry the original request with new token
        const newToken = localStorage.getItem(this.TOKEN_KEY);
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newToken}`,
          },
        });
      }
    }

    return response;
  }

  // Refresh current token
  static async refreshToken() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return false;

    try {
      const response = await fetch('/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem(this.TOKEN_KEY, data.data.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(data.data.user));
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  // Get current user info
  static getCurrentUser() {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if user has role
  static hasRole(role: string) {
    const user = this.getCurrentUser();
    return user && user.roles.includes(role);
  }

  // Check if user has permission
  static hasPermission(permission: string) {
    const user = this.getCurrentUser();
    return user && user.permissions.includes(permission);
  }

  // Logout
  static logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
}

// Example usage in a React component
function LoginComponent() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    AuthService.getUsers().then(setUsers);
  }, []);

  const handleLogin = async () => {
    try {
      await AuthService.generateToken(selectedUser);
      // Redirect to main app
      window.location.href = '/dashboard';
    } catch (error) {
      alert('Login failed');
    }
  };

  return (
    <div>
      <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
        <option value="">Select User</option>
        {users.map(user => (
          <option key={user.user_id} value={user.user_id}>
            {user.firstname} {user.lastname} ({user.username})
          </option>
        ))}
      </select>
      <button onClick={handleLogin} disabled={!selectedUser}>
        Login
      </button>
    </div>
  );
}
```

## Security Best Practices

1. **Use HTTPS in production** - Never send JWT tokens over HTTP
2. **Short token expiration** - Use short-lived tokens (15-30 minutes) with refresh functionality
3. **Secure token storage** - Use secure, httpOnly cookies instead of localStorage for better security
4. **Rate limiting** - Enable rate limiting on token generation endpoints
5. **Token validation** - Always validate tokens on the backend and check user status
6. **Audit logging** - Log token generation and access to sensitive resources
7. **User verification** - Implement additional verification before token generation in production

## Troubleshooting

### Common Issues:

1. **"Cannot read property 'user' of undefined"** - Ensure authentication middleware is applied before authorization middleware
2. **"Invalid token"** - Check that the JWT_SECRET is consistent and the token hasn't expired
3. **Database connection errors** - Ensure Prisma is properly configured and the database is running
4. **CORS errors** - Update CORS_ORIGIN in your environment variables
5. **"User not found"** - Ensure the user ID exists in the database and the user is active

### Environment Variables Checklist:

- [ ] `JWT_SECRET` - Strong, unique secret (32+ characters)
- [ ] `JWT_EXPIRES_IN` - Token expiration time (e.g., "24h", "15m")
- [ ] `DATABASE_URL` - Prisma database connection string
- [ ] `CORS_ORIGIN` - Frontend URL for CORS

## Production Considerations

### Additional Security Layers

1. **User Verification**: Before generating tokens, implement additional verification:
   ```typescript
   // Example: PIN verification, biometric check, etc.
   const verifyUserIdentity = async (userId: string, verificationData: any) => {
     // Implement your verification logic
     return true; // or false
   };
   ```

2. **Rate Limiting**: Add rate limiting to token generation:
   ```typescript
   import rateLimit from 'express-rate-limit';

   const tokenRateLimit = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 5, // limit each user to 5 token requests per windowMs
     message: 'Too many token requests, please try again later',
   });

   authRouter.post("/generate-token", tokenRateLimit, authController.generateToken);
   ```

3. **Token Blacklisting**: Implement token blacklisting for logout:
   ```typescript
   // Store revoked tokens in Redis or database
   const revokedTokens = new Set();

   export const checkTokenRevocation = (req: Request, res: Response, next: NextFunction) => {
     const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
     if (token && revokedTokens.has(token)) {
       return res.status(401).json({ message: 'Token has been revoked' });
     }
     next();
   };
   ```

### Alternative Authentication Methods

You can extend this system to support multiple authentication methods:

1. **QR Code Authentication**: Generate QR codes that contain user tokens
2. **RFID/NFC**: Use card-based authentication that maps to user IDs
3. **Biometric**: Integrate with biometric systems
4. **SSO Integration**: Connect with university SSO systems

## Next Steps

1. Implement additional user verification before token generation
2. Add token refresh automation in frontend
3. Implement audit logging for security events
4. Set up monitoring and alerts for suspicious token usage
5. Consider implementing session management for better control
6. Add automated token cleanup for expired tokens

---

This implementation provides a passwordless, token-based authentication system that's secure and flexible. The frontend can generate tokens for users without requiring password input, while still maintaining proper authorization and access control through your existing role and permission system.
