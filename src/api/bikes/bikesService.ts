import { StatusCodes } from "http-status-codes";

import type { Bike } from "@/api/bikes/bikeModel";
import { BikesRepository } from "@/api/bikes/bikesRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";

export class BikesService {
  private BikesRepository: BikesRepository;

  constructor(repository: BikesRepository = new BikesRepository()) {
    this.BikesRepository = repository;
  }

  // Retrieves all users from the database
  async findAll(): Promise<ServiceResponse<Bike[] | null>> {
    try {
      const users = await this.BikesRepository.findAllAsync();
      if (!users || users.length === 0) {
        return ServiceResponse.failure("No Users found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Bike[]>("Users found", users);
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
  async findById(id: string): Promise<ServiceResponse<Bike | null>> {
    try {
      const bike = await this.BikesRepository.findByIdAsync(id);
      if (!bike) {
        return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Bike>("Bike found", bike);
    } catch (ex) {
      const errorMessage = `Error finding user with id ${id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while finding user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}

export const bikesService = new BikesService();
