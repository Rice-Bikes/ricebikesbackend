import { StatusCodes } from "http-status-codes";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { serviceLogger as logger } from "@/common/utils/logger";
import type { TransactionsSummary } from "./summaryModel";
import { SummaryRepository } from "./summaryRepository";

export class SummaryService {
  private SummaryRepository: SummaryRepository;

  constructor(repository: SummaryRepository = new SummaryRepository()) {
    this.SummaryRepository = repository;
  }

  async getTransactionsSummary(): Promise<ServiceResponse<TransactionsSummary | null>> {
    try {
      const transactionSummary = await this.SummaryRepository.getTransactionsSummary();
      if (!transactionSummary) {
        return ServiceResponse.failure("Transaction not updated", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<TransactionsSummary>("Transaction summary retrieved", transactionSummary);
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

export const summaryService = new SummaryService();
