import { StatusCodes } from "http-status-codes";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { serviceLogger as logger } from "@/common/utils/logger";
import type { TransactionLog } from "./transactionLogsModel";
import { TransactionLogsRepositoryDrizzle } from "./transactionLogsRepositoryDrizzle";

export class TransactionLogService {
  private TransactionLogsRepository: TransactionLogsRepositoryDrizzle;

  constructor(repository: TransactionLogsRepositoryDrizzle = new TransactionLogsRepositoryDrizzle()) {
    this.TransactionLogsRepository = repository;
  }

  // Retrieves all transactionDetails from the database
  async findAll(): Promise<ServiceResponse<TransactionLog[] | null>> {
    try {
      const transactionDetails = await this.TransactionLogsRepository.findAllAsync();
      if (!transactionDetails || transactionDetails.length === 0) {
        return ServiceResponse.failure("No transactionDetails found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<TransactionLog[]>("transactionDetails found", transactionDetails);
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
  async findAllById(transaction_num: number): Promise<ServiceResponse<TransactionLog[] | null>> {
    try {
      const singeTransactionLog = await this.TransactionLogsRepository.findAllTransactionLogs(transaction_num);
      if (!singeTransactionLog) {
        return ServiceResponse.success(
          `transaction details for ${transaction_num} do not exist`,
          null,
          StatusCodes.NO_CONTENT,
        );
      }
      // console.log(singeTransactionLog);
      return ServiceResponse.success<TransactionLog[]>("transaction details found", singeTransactionLog);
    } catch (ex) {
      const errorMessage = `Error finding transaction details with id ${transaction_num}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while finding transaction details.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single transaction's details by their ID
  async createTransactionLog(
    transaction_num: number,
    created_by: string,
    description: string,
    change_type: string,
  ): Promise<ServiceResponse<TransactionLog | null>> {
    try {
      const transactionDetail = {
        log_id: crypto.randomUUID(),
        transaction_num: transaction_num,
        changed_by: created_by,
        date_modified: new Date(),
        description,
        change_type,
      } as TransactionLog;
      console.log("transaction detail in service", transactionDetail);
      const singeTransactionLog = await this.TransactionLogsRepository.createAsync(transactionDetail);
      if (!singeTransactionLog) {
        return ServiceResponse.failure("singeTransactionLog not created", null, StatusCodes.NOT_FOUND);
      }
      console.log(singeTransactionLog);

      return ServiceResponse.success<TransactionLog>("singeTransactionLog created", singeTransactionLog);
    } catch (ex) {
      const errorMessage = `Error creating singeTransactionLog with id ${transaction_num}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while creating singeTransactionLog.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const transactionLogService = new TransactionLogService();
