import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the slack service used by the NotificationTriggerService
vi.mock("@/services/slackService", () => ({
  default: {
    notifyReservationComplete: vi.fn(),
    notifyTransactionComplete: vi.fn(),
    notifyBuildComplete: vi.fn(),
  },
}));

import notificationTriggerService from "@/services/notificationTriggerService";
import slackService from "@/services/slackService";

describe("NotificationTriggerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls notifyReservationComplete for bike reservations", async () => {
    const tx = {
      transaction: {
        transaction_num: 1,
        transaction_id: "tx-1",
        total_cost: 100,
        is_completed: false,
        is_reserved: true,
      },
      bike: { make: "Brand", model: "X", condition: "New", price: 100 },
      customer: { first_name: "A", last_name: "B", email: "a@b.com" },
    };

    await notificationTriggerService.handleBikeReservation(tx as any);

    expect(slackService.notifyReservationComplete).toHaveBeenCalledTimes(1);
    expect(slackService.notifyReservationComplete).toHaveBeenCalledWith(tx);
  });

  it("calls notifyTransactionComplete for bike sales", async () => {
    const tx = {
      transaction: {
        transaction_num: 2,
        transaction_id: "tx-2",
        total_cost: 200,
        is_completed: true,
        is_reserved: false,
      },
      bike: { make: "Brand", model: "Y", condition: "Used" },
      customer: { first_name: "C", last_name: "D", email: "c@d.com" },
    };

    await notificationTriggerService.handleBikeSale(tx as any);

    expect(slackService.notifyTransactionComplete).toHaveBeenCalledTimes(1);
    expect(slackService.notifyTransactionComplete).toHaveBeenCalledWith(tx);
  });

  it("calls notifyBuildComplete when workflow step name contains 'build' (case-insensitive)", async () => {
    const stepData = {
      step_id: "s-1",
      step_name: "Build Completed",
      is_completed: true,
      transaction_id: "tx-3",
      workflow_type: "assembly",
    };

    const tx = {
      transaction: {
        transaction_num: 3,
        transaction_id: "tx-3",
        total_cost: 300,
        is_completed: true,
        is_reserved: false,
      },
    };

    await notificationTriggerService.handleWorkflowStepCompletion(stepData as any, tx as any);

    expect(slackService.notifyBuildComplete).toHaveBeenCalledTimes(1);
    expect(slackService.notifyBuildComplete).toHaveBeenCalledWith(tx);
    // Ensure reservation notifier did NOT get called
    expect(slackService.notifyReservationComplete).not.toHaveBeenCalled();
  });

  it("calls notifyReservationComplete when workflow step name contains 'reserve' (case-insensitive)", async () => {
    const stepData = {
      step_id: "s-2",
      step_name: "Reserve Confirmed",
      is_completed: true,
      transaction_id: "tx-4",
      workflow_type: "reservation",
    };

    const tx = {
      transaction: {
        transaction_num: 4,
        transaction_id: "tx-4",
        total_cost: 400,
        is_completed: false,
        is_reserved: true,
      },
    };

    await notificationTriggerService.handleWorkflowStepCompletion(stepData as any, tx as any);

    expect(slackService.notifyReservationComplete).toHaveBeenCalledTimes(1);
    expect(slackService.notifyReservationComplete).toHaveBeenCalledWith(tx);
    expect(slackService.notifyBuildComplete).not.toHaveBeenCalled();
  });

  it("does not call any slack notifications for unrelated workflow steps", async () => {
    const stepData = {
      step_id: "s-3",
      step_name: "Checkout Started",
      is_completed: false,
      transaction_id: "tx-5",
      workflow_type: "checkout",
    };

    const tx = {
      transaction: {
        transaction_num: 5,
        transaction_id: "tx-5",
        total_cost: 500,
        is_completed: false,
        is_reserved: false,
      },
    };

    await notificationTriggerService.handleWorkflowStepCompletion(stepData as any, tx as any);

    expect(slackService.notifyBuildComplete).not.toHaveBeenCalled();
    expect(slackService.notifyReservationComplete).not.toHaveBeenCalled();
    expect(slackService.notifyTransactionComplete).not.toHaveBeenCalled();
  });

  it("handles errors from slackService.notifyReservationComplete without throwing", async () => {
    const tx = {
      transaction: {
        transaction_num: 6,
        transaction_id: "tx-6",
        total_cost: 600,
        is_completed: false,
        is_reserved: true,
      },
    };

    // Make the slack notifier reject to simulate an error
    (slackService.notifyReservationComplete as any).mockRejectedValueOnce(new Error("slack down"));

    await expect(notificationTriggerService.handleBikeReservation(tx as any)).resolves.toBeUndefined();
    expect(slackService.notifyReservationComplete).toHaveBeenCalledTimes(1);
  });

  it("handles errors from slackService.notifyTransactionComplete without throwing", async () => {
    const tx = {
      transaction: {
        transaction_num: 7,
        transaction_id: "tx-7",
        total_cost: 700,
        is_completed: true,
        is_reserved: false,
      },
    };

    (slackService.notifyTransactionComplete as any).mockRejectedValueOnce(new Error("slack fail"));

    await expect(notificationTriggerService.handleBikeSale(tx as any)).resolves.toBeUndefined();
    expect(slackService.notifyTransactionComplete).toHaveBeenCalledTimes(1);
  });
});
