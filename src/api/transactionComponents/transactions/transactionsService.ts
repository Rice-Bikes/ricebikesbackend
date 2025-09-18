import { StatusCodes } from "http-status-codes";

import { CustomersService, customersService } from "@/api/customer/customerService";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import notificationTriggerService from "@/services/notificationTriggerService";
import { getTransactionWithDetails } from "@/services/transactionHelpers";
import type {
  AggTransaction,
  Transaction,
  TransactionsSummary,
  UpdateTransaction,
} from "../transactions/transactionModel";
import { TransactionRepository } from "../transactions/transactionRepository";

export class TransactionsService {
  private TransactionRepository: TransactionRepository;

  constructor(repository: TransactionRepository = new TransactionRepository()) {
    this.TransactionRepository = repository;
  }

  // Retrieves all Transactions from the database

  async findAll(after_id: number, page_limit: number): Promise<ServiceResponse<Transaction[] | null>> {
    try {
      const transactions = await this.TransactionRepository.findAll(after_id, page_limit);
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

  async findAllAgg(after_id: number, page_limit: number): Promise<ServiceResponse<AggTransaction[] | null>> {
    try {
      const transactions = await this.TransactionRepository.findAllAggregate(after_id, page_limit);
      if (!transactions || transactions.length === 0) {
        return ServiceResponse.failure("No transactions found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<AggTransaction[]>("Transactions found", transactions);
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
  async findById(id: string): Promise<ServiceResponse<Transaction | null>> {
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

  // Creates a Transaction
  async createTransaction(transaction: Transaction): Promise<ServiceResponse<Transaction | null>> {
    try {
      const newTransaction = await this.TransactionRepository.createTransaction(transaction);
      if (!newTransaction) {
        return ServiceResponse.failure("Transaction not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Transaction>("Transaction found", newTransaction);
    } catch (ex) {
      const errorMessage = `Error creating Transaction with content ${transaction}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while creating Transaction.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Creates a Transaction
  async deleteTransactionByID(transaction_id: string): Promise<ServiceResponse<Transaction | null>> {
    try {
      const deletedTransaction = await this.TransactionRepository.deleteById(transaction_id);
      if (!deletedTransaction) {
        return ServiceResponse.failure("Transaction not deleted", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Transaction>("Transaction deleted", deletedTransaction);
    } catch (ex) {
      const errorMessage = `Error deleting Transaction with id ${transaction_id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while deleting Transaction.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Updates a Transaction
  async updateTransactionByID(
    transaction_id: string,
    transaction: UpdateTransaction,
  ): Promise<ServiceResponse<Transaction | null>> {
    try {
      // Get the old transaction state before updating
      const oldTransaction = await this.TransactionRepository.findByIdAggregate(transaction_id);

      const updatedTransaction = await this.TransactionRepository.updateById(transaction_id, transaction);
      console.log("updated transaction", updatedTransaction);
      if (!updatedTransaction) {
        return ServiceResponse.failure("Transaction not updated", null, StatusCodes.NOT_FOUND);
      }

      const detailedTransaction = await getTransactionWithDetails(transaction_id);

      // Only send notification if payment status changed from false to true (avoiding duplicates)
      if (
        updatedTransaction.transaction_type.toLowerCase() === "retrospec" &&
        detailedTransaction &&
        updatedTransaction.is_paid &&
        oldTransaction &&
        !oldTransaction.is_paid // Only notify when transitioning from unpaid to paid
      ) {
        notificationTriggerService.handleBikeSale({
          transaction: {
            transaction_num: updatedTransaction.transaction_num,
            transaction_id: updatedTransaction.transaction_id,
            total_cost: updatedTransaction.total_cost,
            is_completed: updatedTransaction.is_completed,
            is_reserved: updatedTransaction.is_reserved,
          },
          bike: detailedTransaction.bike,
          customer: detailedTransaction.customer,
        });
      }

      return ServiceResponse.success<Transaction>("Transaction updated", updatedTransaction);
    } catch (ex) {
      const errorMessage = `Error updating Transaction with id ${transaction_id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while updating Transaction.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getTransactionsSummary(): Promise<ServiceResponse<TransactionsSummary | null>> {
    try {
      const transactionSummary = await this.TransactionRepository.getTransactionsSummary();
      if (!transactionSummary) {
        return ServiceResponse.failure("Transaction not updated", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<TransactionsSummary>("Transaction updated", transactionSummary);
    } catch (ex) {
      const errorMessage = `Error finding transaction summary data:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while updating Transaction.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const transactionsService = new TransactionsService();
