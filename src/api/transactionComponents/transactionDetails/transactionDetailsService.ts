import { StatusCodes } from "http-status-codes";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { serviceLogger as logger } from "@/common/utils/logger";
import { detailAddedEntry, detailCompletionEntry, detailRemovedEntry } from "@/common/utils/transactionLogging";
import { transactionHistoryService } from "@/services/transactionHistoryService";
import type {
  TransactionDetails,
  TransactionDetailsWithForeignKeys,
} from "../transactionDetails/transactionDetailsModel";
import { TransactionDetailsRepositoryDrizzle } from "./transactionDetailsRepositoryDrizzle";

export class TransactionDetailsService {
  private TransactionDetailsRepository: TransactionDetailsRepositoryDrizzle;

  constructor(repository: TransactionDetailsRepositoryDrizzle = new TransactionDetailsRepositoryDrizzle()) {
    this.TransactionDetailsRepository = repository;
  }

  // Retrieves all transactionDetails from the database
  async findAll(): Promise<ServiceResponse<TransactionDetails[] | null>> {
    try {
      const transactionDetails = await this.TransactionDetailsRepository.findAllAsync();
      if (!transactionDetails || transactionDetails.length === 0) {
        return ServiceResponse.failure("No transactionDetails found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<TransactionDetails[]>("transactionDetails found", transactionDetails);
    } catch (ex) {
      const errorMessage = `Error finding all transactionDetails: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving transactionDetails.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single transaction's details by their ID
  async findAllById(transaction_id: string): Promise<ServiceResponse<TransactionDetails[] | null>> {
    try {
      const singeTransactionDetails = await this.TransactionDetailsRepository.findAllTransactionDetails(transaction_id);
      if (!singeTransactionDetails) {
        return ServiceResponse.success<TransactionDetails[]>("no transaction details found", []);
      }
      // console.log(singeTransactionDetails);
      return ServiceResponse.success<TransactionDetails[]>("transaction details found", singeTransactionDetails);
    } catch (ex) {
      const errorMessage = `Error finding transaction details with id ${transaction_id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while finding transaction details.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findItems(transaction_id: string): Promise<ServiceResponse<TransactionDetails[] | null>> {
    try {
      const singeTransactionDetails = await this.TransactionDetailsRepository.findAllItems(transaction_id);
      if (!singeTransactionDetails) {
        return ServiceResponse.success<TransactionDetails[]>("no transaction details found", []);
      }
      // console.log(singeTransactionDetails);
      return ServiceResponse.success<TransactionDetails[]>("transaction details found", singeTransactionDetails);
    } catch (ex) {
      const errorMessage = `Error finding transaction details with id ${transaction_id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while finding transaction details.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findRepairs(transaction_id: string): Promise<ServiceResponse<TransactionDetails[] | null>> {
    try {
      const singeTransactionDetails = await this.TransactionDetailsRepository.findAllRepairs(transaction_id);
      if (!singeTransactionDetails) {
        return ServiceResponse.success<TransactionDetails[]>("no transaction details found", []);
      }
      console.log(singeTransactionDetails);
      return ServiceResponse.success<TransactionDetails[]>("transaction details found", singeTransactionDetails);
    } catch (ex) {
      const errorMessage = `Error finding transaction details with id ${transaction_id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while finding transaction details.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single transaction's details by their ID
  async createTransactionDetail(
    transaction_id: string,
    created_by: string,
    quantity: number,
    item_id?: string,
    repair_id?: string,
    tune_up_id?: string,
  ): Promise<ServiceResponse<TransactionDetailsWithForeignKeys | null>> {
    try {
      const transactionDetail = {
        transaction_detail_id: crypto.randomUUID(),
        transaction_id: transaction_id,
        item_id: item_id ? item_id.trim() : undefined,
        repair_id: repair_id ? repair_id.trim() : undefined,
        tune_up_id: tune_up_id ? tune_up_id.trim() : undefined,
        changed_by: created_by,
        completed: repair_id === null, // always want items to be true but want repairs/tune ups to start as false
        quantity: quantity,
        date_modified: new Date(),
      } as TransactionDetails;
      const singeTransactionDetails = await this.TransactionDetailsRepository.createAsync(transactionDetail);
      if (!singeTransactionDetails) {
        return ServiceResponse.failure("singeTransactionDetails not created", null, StatusCodes.NOT_FOUND);
      }

      // Recorded here rather than by the client so that adding a part or repair
      // always shows up in the history, and only once it has actually landed.
      await transactionHistoryService.recordByTransactionId(transaction_id, created_by, [
        detailAddedEntry({
          item_name: singeTransactionDetails.Item?.name ?? null,
          repair_name: singeTransactionDetails.Repair?.name ?? null,
          tune_up_name: null,
          quantity: singeTransactionDetails.quantity,
        }),
      ]);

      return ServiceResponse.success<TransactionDetailsWithForeignKeys>(
        "singeTransactionDetails created",
        singeTransactionDetails,
      );
    } catch (ex) {
      const errorMessage = `Error creating singeTransactionDetails with id ${transaction_id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while creating singeTransactionDetails.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
  // Marks a transaction detail complete or incomplete, recording it in the
  // transaction's history.
  async updateById(
    transaction_detail_id: string,
    isDone: boolean,
    changed_by?: string,
  ): Promise<ServiceResponse<TransactionDetails | null>> {
    try {
      // Read before updating: the status decides whether anything changed, and
      // the names are needed to describe it either way.
      const context = await this.TransactionDetailsRepository.findHistoryContext(transaction_detail_id);

      const singeTransactionDetails = await this.TransactionDetailsRepository.updateStatus(
        transaction_detail_id,
        isDone,
      );
      if (!singeTransactionDetails) {
        return ServiceResponse.failure("singeTransactionDetails not found", null, StatusCodes.NOT_FOUND);
      }

      // Checking off a repair that was already checked off changes nothing, so
      // it is not worth a history row.
      if (context && context.completed !== isDone) {
        await transactionHistoryService.record(context.transaction_num, changed_by, [
          detailCompletionEntry(context, isDone),
        ]);
      }

      return ServiceResponse.success<TransactionDetails>("singeTransactionDetails modified", singeTransactionDetails);
    } catch (ex) {
      const errorMessage = `Error finding singeTransactionDetails with id ${transaction_detail_id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while finding singeTransactionDetails.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Deletes a single transaction detail, recording it in the transaction's
  // history.
  async deleteById(
    transaction_detail_id: string,
    changed_by?: string,
  ): Promise<ServiceResponse<TransactionDetails | null>> {
    try {
      // Read before deleting: afterwards there is no row left to find the
      // transaction or the name of what was removed.
      const context = await this.TransactionDetailsRepository.findHistoryContext(transaction_detail_id);

      const singeTransactionDetails = await this.TransactionDetailsRepository.deleteAsync(transaction_detail_id);
      if (!singeTransactionDetails) {
        return ServiceResponse.failure("singeTransactionDetails not found", null, StatusCodes.NOT_FOUND);
      }

      if (context) {
        await transactionHistoryService.record(context.transaction_num, changed_by, [detailRemovedEntry(context)]);
      }

      return ServiceResponse.success<TransactionDetails>("singeTransactionDetails deleted", singeTransactionDetails);
    } catch (ex) {
      const errorMessage = `Error finding singeTransactionDetails with id ${transaction_detail_id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while finding singeTransactionDetails.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const transactionDetailsService = new TransactionDetailsService();
