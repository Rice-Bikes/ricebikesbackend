import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import { StatusCodes } from "http-status-codes";

import type { User, UserRole } from "./userModel";
import { UsersRepository } from "./userRepository";

export class UsersService {
  private UsersRepository: UsersRepository;

  constructor(repository: UsersRepository = new UsersRepository()) {
    this.UsersRepository = repository;
  }

  // Retrieves all users from the database
  async findAll(): Promise<ServiceResponse<User[] | null>> {
    try {
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
