import { StatusCodes } from "http-status-codes";

import type { Bike } from "@/api/bikes/bikesModel";
import { BikesRepository } from "@/api/bikes/bikesRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";

export class BikesService {
  private BikesRepository: BikesRepository;

  constructor(repository: BikesRepository = new BikesRepository()) {
    this.BikesRepository = repository;
  }

  // Retrieves all bikes from the database
  async findAll(): Promise<ServiceResponse<Bike[] | null>> {
    try {
      const bikes = await this.BikesRepository.findAll();
      if (!bikes || bikes.length === 0) {
        return ServiceResponse.failure("No bikes found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Bike[]>("bikes found", bikes);
    } catch (ex) {
      const errorMessage = `Error finding all bikes: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving bikes.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single bike by their ID
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

  // Creates a bike
  async createBike(bike: Bike): Promise<ServiceResponse<Bike | null>> {
    try {
      const newBike = await this.BikesRepository.create(bike);
      return ServiceResponse.success<Bike>("Bike created", newBike);
    } catch (ex) {
      const errorMessage = `Error creating bike: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while creating bike.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}

export const bikesService = new BikesService();
