import { StatusCodes } from "http-status-codes";

import { CustomersService, customersService } from "@/api/customer/customerService";
import { stepBundleService } from "@/api/stepBundles/stepBundleService";
import { tuneUpService } from "@/api/tuneUpComponents/tuneUps/tuneUpService";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { serviceLogger as logger } from "@/common/utils/logger";
import { diffTransaction, transactionCreatedEntry } from "@/common/utils/transactionLogging";
import notificationTriggerService from "@/services/notificationTriggerService";
import { getTransactionWithDetails } from "@/services/transactionHelpers";
import { transactionHistoryService } from "@/services/transactionHistoryService";
import type {
  AggTransaction,
  Transaction,
  TransactionsSummary,
  UpdateTransaction,
} from "../transactions/transactionModel";
import type {
  ListTransactionsOptions,
  TransactionRepositoryDrizzle,
} from "../transactions/transactionRepositoryDrizzle";
import {
  createTransactionRepository,
  createTransactionRepositorySync,
} from "../transactions/transactionRepositoryFactory";

export class TransactionsService {
  private TransactionRepository: TransactionRepositoryDrizzle;
  private repositoryInitialized = false;

  constructor(repository?: TransactionRepositoryDrizzle) {
    this.TransactionRepository = repository || createTransactionRepositorySync();
    this.repositoryInitialized = !!repository;
  }

  private async initializeRepository(): Promise<void> {
    try {
      this.TransactionRepository = await createTransactionRepository();
      this.repositoryInitialized = true;
      logger.debug("Transaction repository initialized successfully");
    } catch (error) {
      logger.error(`Failed to initialize transaction repository: ${error}`);
      // We already have the sync version, so we can continue
    }
  }

  // Helper method to ensure repository is initialized
  private async ensureRepository(): Promise<void> {
    if (!this.repositoryInitialized) {
      await this.initializeRepository();
    }
  }

  // Retrieves all Transactions from the database

  async findAll(options: ListTransactionsOptions): Promise<ServiceResponse<Transaction[] | null>> {
    try {
      await this.ensureRepository();
      const { transactions, next_cursor, total } = await this.TransactionRepository.findAll(options);
      // An empty page is a valid result for a collection, not a missing
      // resource: a filter that matches nothing, or paging past the end,
      // returns 200 with an empty list rather than 404.
      return ServiceResponse.success<Transaction[]>("Transactions found", transactions ?? [], StatusCodes.OK, {
        next_cursor,
        total,
      });
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

  async findAllAgg(options: ListTransactionsOptions): Promise<ServiceResponse<AggTransaction[] | null>> {
    try {
      await this.ensureRepository();
      const { transactions, next_cursor, total } = await this.TransactionRepository.findAllAggregate(options);
      // See findAll: an empty page is a 200 with an empty list, not a 404.
      return ServiceResponse.success<AggTransaction[]>("Transactions found", transactions ?? [], StatusCodes.OK, {
        next_cursor,
        total,
      });
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
      await this.ensureRepository();
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

  // Creates a Transaction. If stepBundleId is provided, that bundle's steps
  // are copied onto the newly created transaction. If quantity is greater
  // than 1, that many independent copies of the transaction are created
  // (each with its own step bundle/tune up applied), and an array is
  // returned instead of a single transaction.
  async createTransaction(
    transaction: Transaction,
    changed_by?: string,
    stepBundleId?: string,
    tuneUpId?: string,
    quantity = 1,
  ): Promise<ServiceResponse<Transaction | Transaction[] | null>> {
    try {
      await this.ensureRepository();

      if (stepBundleId) {
        const bundle = await stepBundleService.findById(stepBundleId);
        if (!bundle.success) {
          return ServiceResponse.failure("Step bundle not found", null, StatusCodes.NOT_FOUND);
        }
      }
      if (tuneUpId) {
        const tuneUp = await tuneUpService.findById(tuneUpId);
        if (!tuneUp.success) {
          return ServiceResponse.failure("Tune up not found", null, StatusCodes.NOT_FOUND);
        }
      }

      const createdTransactions: Transaction[] = [];
      for (let i = 0; i < quantity; i++) {
        const newTransaction = await this.TransactionRepository.createTransaction(transaction);
        if (!newTransaction) {
          return ServiceResponse.failure("Transaction not found", null, StatusCodes.NOT_FOUND);
        }

        if (stepBundleId) {
          const applyResult = await stepBundleService.applyToTransaction(stepBundleId, newTransaction.transaction_id);
          if (!applyResult.success) {
            logger.error(
              `Failed to apply step bundle ${stepBundleId} to transaction ${newTransaction.transaction_id}: ${applyResult.message}`,
            );
          }
        }
        if (tuneUpId) {
          const applyResult = await tuneUpService.applyToTransaction(tuneUpId, null, newTransaction.transaction_id);
          if (!applyResult.success) {
            logger.error(
              `Failed to apply tune up ${tuneUpId} to transaction ${newTransaction.transaction_id}: ${applyResult.message}`,
            );
          }
        }

        await transactionHistoryService.record(newTransaction.transaction_num, changed_by, [
          transactionCreatedEntry(newTransaction),
        ]);

        createdTransactions.push(newTransaction);
      }

      if (createdTransactions.length === 1) {
        return ServiceResponse.success<Transaction>("Transaction found", createdTransactions[0]);
      }
      return ServiceResponse.success<Transaction[]>("Transactions created", createdTransactions);
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
      await this.ensureRepository();
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
    changed_by?: string,
  ): Promise<ServiceResponse<Transaction | null>> {
    try {
      await this.ensureRepository();
      // Get the old transaction state before updating
      const oldTransaction = await this.TransactionRepository.findByIdAggregate(transaction_id);

      const updatedTransaction = await this.TransactionRepository.updateById(transaction_id, transaction);
      logger.debug(`Updated transaction ${transaction_id}`);
      if (!updatedTransaction) {
        return ServiceResponse.failure("Transaction not updated", null, StatusCodes.NOT_FOUND);
      }

      // The history is written here rather than by the client so that every
      // edit is recorded, whichever client made it, and only once the edit has
      // actually landed. Comparing the stored rows rather than the request body
      // means a field set to the value it already had is not logged as a change.
      if (oldTransaction) {
        await transactionHistoryService.record(
          updatedTransaction.transaction_num,
          changed_by,
          diffTransaction(oldTransaction, updatedTransaction),
        );
      }

      const detailedTransaction = await getTransactionWithDetails(transaction_id);

      // Only send notification if payment status changed from false to true (avoiding duplicates)
      if (
        updatedTransaction.transaction_type!.toLowerCase() === "retrospec" &&
        detailedTransaction &&
        updatedTransaction.is_paid &&
        oldTransaction &&
        !oldTransaction.is_paid // Only notify when transitioning from unpaid to paid
      ) {
        notificationTriggerService.handleBikeSale({
          transaction: {
            transaction_num: updatedTransaction.transaction_num,
            transaction_id: updatedTransaction.transaction_id,
            total_cost: updatedTransaction.total_cost!,
            is_completed: updatedTransaction.is_completed!,
            is_reserved: updatedTransaction.is_reserved!,
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
      await this.ensureRepository();
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
