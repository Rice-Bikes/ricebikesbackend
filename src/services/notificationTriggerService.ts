import slackService from "./slackService";

interface WorkflowStepData {
  step_id: string;
  step_name: string;
  is_completed: boolean;
  transaction_id: string;
  workflow_type: string;
}

interface TransactionData {
  transaction: {
    transaction_num: number;
    transaction_id: string;
    total_cost: number;
    is_completed: boolean;
    is_reserved: boolean;
  };
  bike?: {
    make: string;
    model: string;
    condition: "New" | "Refurbished" | "Used";
    price?: number;
  };
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Transaction {
  transaction_num: number;
  transaction_id: string;
  total_cost: number;
  is_completed: boolean;
  is_reserved: boolean;
}

class NotificationTriggerService {
  async handleWorkflowStepCompletion(stepData: WorkflowStepData, transactionData: TransactionData): Promise<void> {
    const { step_name, is_completed } = stepData;

    if (!is_completed) return;

    try {
      switch (step_name.toLowerCase()) {
        case "build":
          await slackService.notifyBuildComplete(transactionData);
          break;
        case "reservation":
          await slackService.notifyReservationComplete(transactionData);
          break;
        case "checkout":
          await slackService.notifyTransactionComplete(transactionData);
          break;
        default:
          // Send generic workflow step notification for other steps
          await slackService.notifyWorkflowStepComplete(step_name, transactionData);
          break;
      }
    } catch (error) {
      console.error("Failed to send workflow step notification:", error);
    }
  }

  async handleTransactionUpdate(
    oldTransaction: Transaction,
    newTransaction: Transaction,
    transactionData: TransactionData,
  ): Promise<void> {
    try {
      // Handle specific transaction field changes
      if (!oldTransaction.is_reserved && newTransaction.is_reserved) {
        await slackService.notifyReservationComplete(transactionData);
      }

      if (!oldTransaction.is_completed && newTransaction.is_completed) {
        await slackService.notifyTransactionComplete(transactionData);
      }
    } catch (error) {
      console.error("Failed to send transaction update notification:", error);
    }
  }

  async handleBikeReservation(transactionData: TransactionData): Promise<void> {
    try {
      await slackService.notifyReservationComplete(transactionData);
    } catch (error) {
      console.error("Failed to send bike reservation notification:", error);
    }
  }

  async handleBikeSale(transactionData: TransactionData): Promise<void> {
    try {
      await slackService.notifyTransactionComplete(transactionData);
    } catch (error) {
      console.error("Failed to send bike sale notification:", error);
    }
  }
}

export default new NotificationTriggerService();
