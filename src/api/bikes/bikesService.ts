import { StatusCodes } from "http-status-codes";

import type { Bike, CreateBikeInput, UpdateBikeInput } from "@/api/bikes/bikesModel";
import type { BikeFilters } from "@/api/bikes/bikesRepository";
import type { BikesRepository } from "@/api/bikes/bikesRepository";
import type { BikesRepositoryDrizzle } from "@/api/bikes/bikesRepositoryDrizzle";
import { createBikeRepository, createBikeRepositorySync } from "@/api/bikes/bikesRepositoryFactory";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { serviceLogger as logger } from "@/common/utils/logger";
import notificationTriggerService from "@/services/notificationTriggerService";

export class BikesService {
  private BikesRepository: BikesRepository | BikesRepositoryDrizzle;
  private repositoryInitialized = false;

  constructor(repository?: BikesRepository | BikesRepositoryDrizzle) {
    // If repository is provided, use it directly
    if (repository) {
      this.BikesRepository = repository;
      this.repositoryInitialized = true;
    } else {
      // Otherwise use the sync version to have something immediately available
      this.BikesRepository = createBikeRepositorySync();

      // But also initialize the proper repository asynchronously
      this.initializeRepository();
    }
  }

  private async initializeRepository(): Promise<void> {
    try {
      this.BikesRepository = await createBikeRepository();
      this.repositoryInitialized = true;
      logger.debug("Bike repository initialized successfully");
    } catch (error) {
      logger.error(`Failed to initialize bike repository: ${error}`);
      // We already have the sync version, so we can continue
    }
  }

  // Helper method to ensure repository is initialized
  private async ensureRepository(): Promise<void> {
    if (!this.repositoryInitialized) {
      await this.initializeRepository();
    }
  }

  // Retrieves all bikes from the database with optional filtering
  async findAll(filters?: BikeFilters): Promise<ServiceResponse<Bike[] | null>> {
    try {
      await this.ensureRepository();
      const bikes = await this.BikesRepository.findAll(filters);
      if (!bikes || bikes.length === 0) {
        return ServiceResponse.failure("No bikes found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Bike[]>("Bikes found", bikes);
    } catch (ex) {
      const errorMessage = `Error finding all bikes: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving bikes.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves bikes available for sale
  async findAvailableForSale(filters?: BikeFilters): Promise<ServiceResponse<Bike[] | null>> {
    try {
      await this.ensureRepository();
      const bikes = await this.BikesRepository.findAvailableForSale(filters);
      if (!bikes || bikes.length === 0) {
        return ServiceResponse.failure("No bikes available for sale", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Bike[]>("Available bikes found", bikes);
    } catch (ex) {
      const errorMessage = `Error finding available bikes: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving available bikes.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single bike by their ID
  async findById(id: string): Promise<ServiceResponse<Bike | null>> {
    try {
      await this.ensureRepository();
      const bike = await this.BikesRepository.findByIdAsync(id);
      if (!bike) {
        return ServiceResponse.failure("Bike not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Bike>("Bike found", bike);
    } catch (ex) {
      const errorMessage = `Error finding bike with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while finding bike.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  // Creates a bike
  async createBike(bikeData: CreateBikeInput): Promise<ServiceResponse<Bike | null>> {
    try {
      await this.ensureRepository();
      const newBike = await this.BikesRepository.create(bikeData);
      return ServiceResponse.success<Bike>("Bike created successfully", newBike, StatusCodes.CREATED);
    } catch (ex) {
      const errorMessage = `Error creating bike: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while creating bike.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  // Updates a bike
  async updateBike(bike_id: string, updateData: UpdateBikeInput): Promise<ServiceResponse<Bike | null>> {
    await this.ensureRepository();
    const oldBike = await this.BikesRepository.findByIdAsync(bike_id);
    if (!oldBike) {
      return ServiceResponse.failure("Bike not found", null, StatusCodes.NOT_FOUND);
    }
    try {
      const updatedBike = await this.BikesRepository.update(bike_id, updateData);
      if (!updatedBike) {
        return ServiceResponse.failure("Bike not found", null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Bike>("Bike updated successfully", updatedBike);
    } catch (ex) {
      const errorMessage = `Error updating bike: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while updating bike.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  // Deletes a bike
  async deleteBike(bike_id: string): Promise<ServiceResponse<null>> {
    try {
      await this.ensureRepository();
      const deleted = await this.BikesRepository.delete(bike_id);
      if (!deleted) {
        return ServiceResponse.failure("Bike not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success("Bike deleted successfully", null);
    } catch (ex) {
      const errorMessage = `Error deleting bike: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while deleting bike.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  // Reserve a bike for a customer
  async reserveBike(
    bike_id: string,
    customer_id: string,
    deposit_amount?: number,
  ): Promise<ServiceResponse<Bike | null>> {
    try {
      await this.ensureRepository();
      const reservedBike = await this.BikesRepository.reserveBike(bike_id, customer_id, deposit_amount);
      if (!reservedBike) {
        return ServiceResponse.failure("Bike not found or already reserved", null, StatusCodes.NOT_FOUND);
      }

      // Trigger notification for bike reservation
      try {
        // For bike reservations, we need to construct transaction data from available info
        const transactionData = {
          transaction: {
            transaction_num: 0, // Will be filled when linked to actual transaction
            transaction_id: "", // Will be filled when linked to actual transaction
            total_cost: deposit_amount || 0,
            is_completed: false,
            is_reserved: true,
          },
          bike: {
            make: reservedBike.make || "Unknown",
            model: reservedBike.model || "Unknown",
            condition: (reservedBike.condition as "New" | "Refurbished" | "Used") || "Used",
            price: reservedBike.price ?? undefined,
          },
          customer: undefined, // Will need customer lookup if needed
        };

        await notificationTriggerService.handleBikeReservation(transactionData);
      } catch (notificationError) {
        // Log the notification error but don't fail the reservation
        console.error("Failed to send bike reservation notification:", notificationError);
      }

      return ServiceResponse.success<Bike>("Bike reserved successfully", reservedBike);
    } catch (ex) {
      const errorMessage = `Error reserving bike: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while reserving bike.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Unreserve a bike
  async unreserveBike(bike_id: string): Promise<ServiceResponse<Bike | null>> {
    try {
      await this.ensureRepository();
      const unreservedBike = await this.BikesRepository.unreserveBike(bike_id);
      if (!unreservedBike) {
        return ServiceResponse.failure("Bike not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Bike>("Bike unreserved successfully", unreservedBike);
    } catch (ex) {
      const errorMessage = `Error unreserving bike: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while unreserving bike.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const bikesService = new BikesService();
