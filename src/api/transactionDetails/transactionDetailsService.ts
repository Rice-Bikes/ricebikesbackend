import { StatusCodes } from "http-status-codes";

import type { TransactionDetails } from "@/api/transactionDetails/transactionDetailsModel";
import { TransactionDetailsRepository } from "@/api/transactionDetails/transactionDetailsRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";

export class TransactionDetailsService {
  private TransactionDetailsRepository: TransactionDetailsRepository;

  constructor(repository: TransactionDetailsRepository = new TransactionDetailsRepository()) {
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
  async findById(transaction_id: string): Promise<ServiceResponse<TransactionDetails[] | null>> {
    try {
      const singeTransactionDetails = await this.TransactionDetailsRepository.findByIdAsync(transaction_id);
      if (!singeTransactionDetails) {
        return ServiceResponse.failure(
          "transaction details for",
          transaction_id,
          "not found",
          null,
          StatusCodes.NOT_FOUND,
        );
      }
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
  ): Promise<ServiceResponse<TransactionDetails | null>> {
    try {
      const transactionDetail = {
        transaction_detail_id: crypto.randomUUID(),
        transaction_id: transaction_id,
        item_id: item_id ? item_id : undefined,
        repair_id: repair_id ? repair_id : undefined,
        changed_by: created_by,
        completed: !item_id, // always want items to be true but want repairs to start as false
        quantity: quantity,
        date_modified: new Date(),
      } as TransactionDetails;
      console.log(transactionDetail);
      const singeTransactionDetails = await this.TransactionDetailsRepository.createAsync(transactionDetail);
      if (!singeTransactionDetails) {
        return ServiceResponse.failure("singeTransactionDetails not created", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<TransactionDetails>("singeTransactionDetails created", singeTransactionDetails);
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
  // Retrieves a single transaction's details by their ID
  async updateById(transaction_id: string, isDone: boolean): Promise<ServiceResponse<TransactionDetails | null>> {
    try {
      const singeTransactionDetails = await this.TransactionDetailsRepository.updateStatus(transaction_id, isDone);
      if (!singeTransactionDetails) {
        return ServiceResponse.failure("singeTransactionDetails not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<TransactionDetails>("singeTransactionDetails modified", singeTransactionDetails);
    } catch (ex) {
      const errorMessage = `Error finding singeTransactionDetails with id ${transaction_id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while finding singeTransactionDetails.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Deletes a single transaction's details by their ID
  async deleteById(transaction_detail_id: string): Promise<ServiceResponse<TransactionDetails | null>> {
    try {
      const singeTransactionDetails = await this.TransactionDetailsRepository.deleteAsync(transaction_detail_id);
      if (!singeTransactionDetails) {
        return ServiceResponse.failure("singeTransactionDetails not found", null, StatusCodes.NOT_FOUND);
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
