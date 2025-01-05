import { StatusCodes } from "http-status-codes";

import type { Transaction } from "@/api/transactions/transactionModel";
import { TransactionRepository } from "@/api/transactions/transactionRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";

export class TransactionsService {
  private TransactionRepository: TransactionRepository;

  constructor(repository: TransactionRepository = new TransactionRepository()) {
    this.TransactionRepository = repository;
  }

  // Retrieves all users from the database
  async findAll(): Promise<ServiceResponse<Transaction[] | null>> {
    try {
      const users = await this.TransactionRepository.findAllAsync();
      if (!users || users.length === 0) {
        return ServiceResponse.failure("No Users found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Transaction[]>("Users found", users);
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
  async findById(id: number): Promise<ServiceResponse<Transaction | null>> {
    try {
      const user = await this.TransactionRepository.findByIdAsync(id);
      if (!user) {
        return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Transaction>("User found", user);
    } catch (ex) {
      const errorMessage = `Error finding user with id ${id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while finding user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}

export const transactionsService = new TransactionsService();
