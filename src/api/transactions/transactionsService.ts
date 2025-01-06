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

  // Retrieves all Transactions from the database
  async findAll(): Promise<ServiceResponse<Transaction[] | null>> {
    try {
      const transactions = await this.TransactionRepository.findAllAsync();
      if (!transactions || transactions.length === 0) {
        return ServiceResponse.failure("No transactions found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Transaction[]>("Transactions found", transactions);
    } catch (ex) {
      const errorMessage = `Error finding all Transactions: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving Transactions.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single Transaction by their ID
  async findById(id: number): Promise<ServiceResponse<Transaction | null>> {
    try {
      const transaction = await this.TransactionRepository.findByIdAggregate(id);
      if (!transaction) {
        return ServiceResponse.failure("Transaction not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Transaction>("Transaction found", transaction);
    } catch (ex) {
      const errorMessage = `Error finding Transaction with id ${id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while finding Transaction.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const transactionsService = new TransactionsService();
