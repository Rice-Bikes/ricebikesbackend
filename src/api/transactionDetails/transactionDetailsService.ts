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
  async findById(id: number): Promise<ServiceResponse<TransactionDetails[] | null>> {
    try {
      const singeTransactionDetails = await this.TransactionDetailsRepository.findByIdAsync(id);
      if (!singeTransactionDetails) {
        return ServiceResponse.failure("singeTransactionDetails not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<TransactionDetails[]>("singeTransactionDetails found", singeTransactionDetails);
    } catch (ex) {
      const errorMessage = `Error finding singeTransactionDetails with id ${id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while finding singeTransactionDetails.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single transaction's details by their ID
  async createTransactionDetail(
    transaction_id: number,
    created_by: string,
    quantity: number,
    item_id?: string,
    repair_id?: string,
  ): Promise<ServiceResponse<TransactionDetails | null>> {
    try {
      const transactionDetail = {
        transaction_detail_id: crypto.randomUUID(),
        transaction_id: transaction_id,
        item_id: item_id,
        repair_id: repair_id,
        changed_by: created_by,
        quantity: quantity,
        date_modified: new Date(),
      } as TransactionDetails;
      const singeTransactionDetails = await this.TransactionDetailsRepository.createAsync(transactionDetail);
      if (!singeTransactionDetails) {
        return ServiceResponse.failure("singeTransactionDetails not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<TransactionDetails>("singeTransactionDetails found", singeTransactionDetails);
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
}

export const transactionDetailsService = new TransactionDetailsService();
