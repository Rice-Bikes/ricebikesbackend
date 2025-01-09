import { StatusCodes } from "http-status-codes";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import type { Repair } from "./repairModel";
import { RepairsRepository } from "./repairRepository";

export class RepairsService {
  private RepairsRepository: RepairsRepository;

  constructor(repository: RepairsRepository = new RepairsRepository()) {
    this.RepairsRepository = repository;
  }

  // Retrieves all repairs from the database
  async findAll(): Promise<ServiceResponse<Repair[] | null>> {
    try {
      const repairs = await this.RepairsRepository.findAllAsync();
      if (!repairs || repairs.length === 0) {
        return ServiceResponse.failure("No repairs found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Repair[]>("repairs found", repairs);
    } catch (ex) {
      const errorMessage = `Error finding all repairs: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving repairs.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single repair by their ID
  async findById(id: string): Promise<ServiceResponse<Repair | null>> {
    try {
      const repair = await this.RepairsRepository.findByIdAsync(id);
      if (!repair) {
        return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Repair>("Repair found", repair);
    } catch (ex) {
      const errorMessage = `Error finding user with id ${id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while finding user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  // Creates a repair
  async createRepair(repair: Repair): Promise<ServiceResponse<Repair | null>> {
    try {
      const newRepair = await this.RepairsRepository.create(repair);
      return ServiceResponse.success<Repair>("Repair created", newRepair);
    } catch (ex) {
      const errorMessage = `Error creating repair: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while creating repair.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const repairsService = new RepairsService();
