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

  async handleWorkflowStepCompletion(stepData: WorkflowStepData, transactionData: TransactionData): Promise<void> {
    try {
      // Only send notifications for specific workflow steps
      const stepName = stepData.step_name.toLowerCase();

      if (stepName.includes("build")) {
        await slackService.notifyBuildComplete(transactionData);
      } else if (stepName.includes("reserve")) {
        await slackService.notifyReservationComplete(transactionData);
      }
      // For all other steps (creation, checkout, etc.), don't send notifications
    } catch (error) {
      console.error("Failed to send workflow step completion notification:", error);
    }
  }
}

export default new NotificationTriggerService();
