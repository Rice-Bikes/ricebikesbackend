import { StatusCodes } from "http-status-codes";

import type { Bike, CreateBikeInput, UpdateBikeInput } from "@/api/bikes/bikesModel";
import { type BikeFilters, BikesRepository } from "@/api/bikes/bikesRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import notificationTriggerService from "@/services/notificationTriggerService";

export class BikesService {
  private BikesRepository: BikesRepository;

  constructor(repository: BikesRepository = new BikesRepository()) {
    this.BikesRepository = repository;
  }

  // Retrieves all bikes from the database with optional filtering
  async findAll(filters?: BikeFilters): Promise<ServiceResponse<Bike[] | null>> {
    try {
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
      // Validate required fields
      if (!bikeData.make || !bikeData.model) {
        return ServiceResponse.failure("Make and model are required", null, StatusCodes.BAD_REQUEST);
      }

      // Validate size_cm range if provided
      if (bikeData.size_cm !== null && bikeData.size_cm !== undefined) {
        if (bikeData.size_cm < 30 || bikeData.size_cm > 80) {
          return ServiceResponse.failure("Size must be between 30cm and 80cm", null, StatusCodes.BAD_REQUEST);
        }
      }

      // Validate condition if provided
      if (bikeData.condition && !["New", "Refurbished", "Used"].includes(bikeData.condition)) {
        return ServiceResponse.failure("Condition must be New, Refurbished, or Used", null, StatusCodes.BAD_REQUEST);
      }

      // Validate price if provided
      if (bikeData.price !== null && bikeData.price !== undefined && bikeData.price < 0) {
        return ServiceResponse.failure("Price must be non-negative", null, StatusCodes.BAD_REQUEST);
      }

      // Validate weight if provided
      if (bikeData.weight_kg !== null && bikeData.weight_kg !== undefined && bikeData.weight_kg <= 0) {
        return ServiceResponse.failure("Weight must be positive", null, StatusCodes.BAD_REQUEST);
      }

      // Validate deposit if provided
      if (bikeData.deposit_amount !== null && bikeData.deposit_amount !== undefined && bikeData.deposit_amount < 0) {
        return ServiceResponse.failure("Deposit amount must be non-negative", null, StatusCodes.BAD_REQUEST);
      }

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
    const oldBike = await this.BikesRepository.findByIdAsync(bike_id);
    if (!oldBike) {
      return ServiceResponse.failure("Bike not found", null, StatusCodes.NOT_FOUND);
    }
    try {
      // Validate condition if provided
      if (updateData.condition && !["New", "Refurbished", "Used"].includes(updateData.condition)) {
        return ServiceResponse.failure("Condition must be New, Refurbished, or Used", null, StatusCodes.BAD_REQUEST);
      }

      // Validate price if provided
      if (updateData.price !== null && updateData.price !== undefined && updateData.price < 0) {
        return ServiceResponse.failure("Price must be non-negative", null, StatusCodes.BAD_REQUEST);
      }

      // Validate weight if provided
      if (updateData.weight_kg !== null && updateData.weight_kg !== undefined && updateData.weight_kg <= 0) {
        return ServiceResponse.failure("Weight must be positive", null, StatusCodes.BAD_REQUEST);
      }

      // Validate deposit if provided
      if (
        updateData.deposit_amount !== null &&
        updateData.deposit_amount !== undefined &&
        updateData.deposit_amount < 0
      ) {
        return ServiceResponse.failure("Deposit amount must be non-negative", null, StatusCodes.BAD_REQUEST);
      }

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
