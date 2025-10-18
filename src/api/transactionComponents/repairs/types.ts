/**
 * Repair Repository Interface
 *
 * This defines the contract that all repair repository implementations must adhere to.
 */

import type { CreateRepairInput, Repair, UpdateRepairInput } from "./repairModel";

export interface RepairRepository {
  /**
   * Find all repairs, optionally filtered
   */
  findAll(): Promise<Repair[]>;

  /**
   * Find a repair by ID
   */
  findById(id: string): Promise<Repair | null>;

  /**
   * Create a new repair
   */
  create(repairData: CreateRepairInput | Repair): Promise<Repair>;

  /**
   * Update an existing repair
   */
  update(id: string, repairData: UpdateRepairInput | Repair): Promise<Repair | null>;

  /**
   * Delete a repair
   */
  delete(id: string): Promise<Repair | null>;

  /**
   * Find unassigned repairs
   */
  findUnassigned?(): Promise<Repair[]>;

  /**
   * Find repairs assigned to a specific user
   */
  findAssignedToUser?(userId: string): Promise<Repair[]>;

  /**
   * Assign a repair to a user
   */
  assignRepair?(repairId: string, userId: string): Promise<Repair | null>;

  /**
   * Unassign a repair
   */
  unassignRepair?(repairId: string): Promise<Repair | null>;

  /**
   * Mark a repair as complete
   */
  completeRepair?(repairId: string): Promise<Repair | null>;

  /**
   * Mark a repair as incomplete
   */
  uncompleteRepair?(repairId: string): Promise<Repair | null>;

  /**
   * Update a repair's status
   */
  updateStatus?(repairId: string, status: string): Promise<Repair | null>;

  // Legacy method aliases for backward compatibility
  findAllAsync?(): Promise<Repair[]>;
  findByIdAsync?(id: string): Promise<Repair | null>;
}
