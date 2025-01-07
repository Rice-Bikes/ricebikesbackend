import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import { StatusCodes } from "http-status-codes";

import type { User } from "./userModel";
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
}

export const usersService = new UsersService();
