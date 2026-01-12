import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { workflowStepsRepository } from "@/api/workflowSteps/workflowStepsRepository";
import { WorkflowStepsService } from "@/api/workflowSteps/workflowStepsService";

describe("WorkflowStepsService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("initializeWorkflow creates steps for bike_sales when none exist", async () => {
    // Arrange - repository reports transaction exists and no existing workflow
    vi.spyOn(workflowStepsRepository, "transactionExists").mockResolvedValue(true);
    vi.spyOn(workflowStepsRepository, "findByTransactionAndWorkflow").mockResolvedValue([] as any);

    const createdSteps = [
      {
        step_id: "s1",
        transaction_id: "t1",
        workflow_type: "bike_sales",
        step_name: "Inspection",
        step_order: 1,
        is_completed: false,
        created_by: "u1",
        completed_by: null,
        created_at: new Date(),
        completed_at: null,
        updated_at: new Date(),
      },
    ];

    vi.spyOn(workflowStepsRepository, "createMany").mockResolvedValue(createdSteps as any);

    const svc = new WorkflowStepsService();

    // Act
    const res = await svc.initializeWorkflow("t1", "bike_sales", "u1");

    // Assert
    expect(res.success).toBe(true);
    expect(res.statusCode).toBe(201);
    expect(Array.isArray(res.responseObject)).toBe(true);
    expect((res.responseObject as any)[0]).toHaveProperty("step_id", "s1");
    // created_at should be serialized to ISO string by the service
    expect((res.responseObject as any)[0].created_at).toEqual(createdSteps[0].created_at.toISOString());
  });

  it("completeWorkflowStep triggers notification and sends new-bike email for inspection step", async () => {
    // Arrange: step exists
    const existing = {
      step_id: "s-1",
      transaction_id: "tx-1",
      workflow_type: "bike_sales",
      step_name: "Inspection",
      step_order: 1,
      is_completed: false,
      created_by: "u1",
      completed_by: null,
      created_at: new Date(),
      completed_at: null,
      updated_at: new Date(),
    } as any;

    const updated = {
      ...existing,
      is_completed: true,
      completed_by: "u2",
      completed_at: new Date(),
      updated_at: new Date(),
    } as any;

    vi.spyOn(workflowStepsRepository, "findById").mockResolvedValue(existing);
    vi.spyOn(workflowStepsRepository, "update").mockResolvedValue(updated);

    // Mock getTransactionWithDetails to return a transaction that includes a customer and bike
    const txHelpers = await import("@/services/transactionHelpers");
    vi.spyOn(txHelpers, "getTransactionWithDetails").mockResolvedValue({
      transaction: {
        transaction_num: 42,
        transaction_id: "tx-1",
        total_cost: 200,
        is_completed: true,
        is_reserved: false,
      },
      bike: { make: "Brand", model: "Model" },
      customer: { first_name: "Alice", last_name: "Zephyr", email: "a@z.com" },
    } as any);

    // Spy on notification trigger service
    const notifyModule = await import("@/services/notificationTriggerService");
    const notifySpy = vi
      .spyOn(notifyModule.default, "handleWorkflowStepCompletion")
      .mockResolvedValue(undefined as any);

    // Spy on customersService.sendNewBikeEmail
    const customerModule = await import("@/api/customer/customerService");
    const sendNewBikeSpy = vi
      .spyOn(customerModule.customersService, "sendNewBikeEmail")
      .mockResolvedValue({ success: true, message: "email sent" } as any);

    const svc = new WorkflowStepsService();

    // Act
    const res = await svc.completeWorkflowStep("s-1", "u2");

    // Assert
    expect(res.success).toBe(true);
    expect(notifySpy).toHaveBeenCalled();
    expect(sendNewBikeSpy).toHaveBeenCalled();
  });
});
