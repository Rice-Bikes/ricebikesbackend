import { ServiceResponse } from "@/common/models/serviceResponse";
import { serviceLogger as logger } from "@/common/utils/logger";
import { StatusCodes } from "http-status-codes";

import type { User, UserRole } from "./userModel";
// Removed unused Prisma repository import
import type { UsersRepositoryDrizzle } from "./userRepositoryDrizzle";
import { createUserRepository, createUserRepositorySync } from "./userRepositoryFactory";

export class UsersService {
  private UsersRepository: UsersRepositoryDrizzle;
  private repositoryInitialized = false;

  constructor(repository?: UsersRepositoryDrizzle) {
    // If repository is provided, use it directly
    if (repository) {
      this.UsersRepository = repository;
      this.repositoryInitialized = true;
    } else {
      // Otherwise use the sync version to have something immediately available
      this.UsersRepository = createUserRepositorySync();

      // But also initialize the proper repository asynchronously
      this.initializeRepository();
    }
  }

  private async initializeRepository(): Promise<void> {
    try {
      this.UsersRepository = await createUserRepository();
      this.repositoryInitialized = true;
      logger.debug("User repository initialized successfully");
    } catch (error) {
      logger.error(`Failed to initialize user repository: ${error}`);
      // We already have the sync version, so we can continue
    }
  }

  // Helper method to ensure repository is initialized
  private async ensureRepository(): Promise<void> {
    if (!this.repositoryInitialized) {
      await this.initializeRepository();
    }
  }

  // Retrieves all users from the database
  async findAll(): Promise<ServiceResponse<User[] | null>> {
    try {
      await this.ensureRepository();
      const users = await this.UsersRepository.findAllAsync();
      if (!users || users.length === 0) {
        return ServiceResponse.failure("No users found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<User[]>("users found", users);
    } catch (ex) {
      const errorMessage = `Error finding all users: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving users.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single user by their ID
  async findById(id: string): Promise<ServiceResponse<User | null>> {
    try {
      await this.ensureRepository();
      const user = await this.UsersRepository.findByIdAsync(id);
      if (!user) {
        return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<User>("User found", user);
    } catch (ex) {
      const errorMessage = `Error finding user with id ${id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while finding user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  // Creates a user
  async createUser(user: User): Promise<ServiceResponse<User | null>> {
    try {
      await this.ensureRepository();
      const newUser = await this.UsersRepository.create(user);
      return ServiceResponse.success<User>("User created", newUser);
    } catch (ex) {
      const errorMessage = `Error creating user: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while creating user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  // Updates a user
  async updateUser(id: string, user: User): Promise<ServiceResponse<User | null>> {
    try {
      await this.ensureRepository();
      const updatedUser = await this.UsersRepository.update(id, user);
      if (!updatedUser) {
        return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<User>("User updated", updatedUser);
    } catch (ex) {
      const errorMessage = `Error updating user with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while updating user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
  // Deletes a user
  async deleteUser(id: string): Promise<ServiceResponse<User | null>> {
    try {
      await this.ensureRepository();
      const deletedUser = await this.UsersRepository.delete(id);
      if (!deletedUser) {
        return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<User>("User deleted", deletedUser);
    } catch (ex) {
      const errorMessage = `Error deleting user with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while deleting user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async attachRoleToUser(userId: string, roleId: string): Promise<ServiceResponse<UserRole | null>> {
    try {
      await this.ensureRepository();
      const user = await this.UsersRepository.attachRoleToUser(userId, roleId);
      if (!user) {
        return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<UserRole>("User updated", user);
    } catch (ex) {
      const errorMessage = `Error updating user with id ${userId}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while updating user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
  async detachRoleFromUser(userId: string, roleId: string): Promise<ServiceResponse<UserRole | null>> {
    try {
      await this.ensureRepository();
      const user = await this.UsersRepository.detachRoleFromUser(userId, roleId);
      if (!user) {
        return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<UserRole>("User updated", user);
    } catch (ex) {
      const errorMessage = `Error detaching user with id ${userId}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while detaching user.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a user by their username
}

export const usersService = new UsersService();
