import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import { StatusCodes } from "http-status-codes";

import type { Permission } from "./permissionModel";
import { PermissionsRepository } from "./permissionRepository";

export class PermissionsService {
  private PermissionsRepository: PermissionsRepository;

  constructor(repository: PermissionsRepository = new PermissionsRepository()) {
    this.PermissionsRepository = repository;
  }

  // Retrieves all permissions from the database
  async findAll(): Promise<ServiceResponse<Permission[] | null>> {
    try {
      const permissions = await this.PermissionsRepository.findAllAsync();
      if (!permissions || permissions.length === 0) {
        return ServiceResponse.failure("No permissions found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Permission[]>("permissions found", permissions);
    } catch (ex) {
      const errorMessage = `Error finding all permissions: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving permissions.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single permission by their ID
  async findById(id: number): Promise<ServiceResponse<Permission | null>> {
    try {
      const permission = await this.PermissionsRepository.findByIdAsync(id);
      if (!permission) {
        return ServiceResponse.failure("Permission not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Permission>("Permission found", permission);
    } catch (ex) {
      const errorMessage = `Error finding permission with id ${id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while finding permission.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Creates a permission
  async createPermission(permission: Permission): Promise<ServiceResponse<Permission | null>> {
    try {
      const newPermission = await this.PermissionsRepository.create(permission);
      return ServiceResponse.success<Permission>("Permission created", newPermission);
    } catch (ex) {
      const errorMessage = `Error creating permission: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while creating permission.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Updates a permission
  async updatePermission(id: number, permission: Permission): Promise<ServiceResponse<Permission | null>> {
    try {
      const updatedPermission = await this.PermissionsRepository.update(id, permission);
      if (!updatedPermission) {
        return ServiceResponse.failure("Permission not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Permission>("Permission updated", updatedPermission);
    } catch (ex) {
      const errorMessage = `Error updating permission with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while updating permission.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
  // Deletes a permission
  async deletePermission(id: number): Promise<ServiceResponse<Permission | null>> {
    try {
      const deletedPermission = await this.PermissionsRepository.delete(id);
      if (!deletedPermission) {
        return ServiceResponse.failure("Permission not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Permission>("Permission deleted", deletedPermission);
    } catch (ex) {
      const errorMessage = `Error deleting permission with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while deleting permission.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
  // Retrieves a permission by the role
  async findByRoleId(roleId: string): Promise<ServiceResponse<Permission[] | null>> {
    try {
      const permissions = await this.PermissionsRepository.findByRoleIdAsync(roleId);
      if (!permissions || permissions.length === 0) {
        return ServiceResponse.failure("No permissions found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Permission[]>("permissions found", permissions);
    } catch (ex) {
      const errorMessage = `Error finding all permissions: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving permissions.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const rolesService = new PermissionsService();
