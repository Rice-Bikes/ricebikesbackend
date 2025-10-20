import { ServiceResponse } from "@/common/models/serviceResponse";
import { serviceLogger as logger } from "@/common/utils/logger";
import { StatusCodes } from "http-status-codes";

import type { RolePermissions } from "./roleModel";
import type { Role } from "./roleModel";
import { RolesRepository } from "./roleRepository";

export class RolesService {
  private RolesRepository: RolesRepository;

  constructor(repository: RolesRepository = new RolesRepository()) {
    this.RolesRepository = repository;
  }

  // Retrieves all users from the database
  async findAll(): Promise<ServiceResponse<Role[] | null>> {
    try {
      const users = await this.RolesRepository.findAllAsync();
      if (!users || users.length === 0) {
        return ServiceResponse.failure("No users found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Role[]>("users found", users);
    } catch (ex) {
      const errorMessage = `Error finding all users: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving users.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Retrieves a single user by their ID
  async findById(id: string): Promise<ServiceResponse<Role[] | null>> {
    try {
      const user = await this.RolesRepository.findByIdAsync(id);
      if (!user) {
        return ServiceResponse.failure("Role not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Role[]>("Role found", user);
    } catch (ex) {
      const errorMessage = `Error finding user with id ${id}:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while finding user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  // Creates a user
  async createRole(user: Role): Promise<ServiceResponse<Role | null>> {
    try {
      const newRole = await this.RolesRepository.create(user);
      return ServiceResponse.success<Role>("Role created", newRole);
    } catch (ex) {
      const errorMessage = `Error creating user: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while creating user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  // Updates a user
  async updateRole(id: string, user: Role): Promise<ServiceResponse<Role | null>> {
    try {
      const updatedRole = await this.RolesRepository.update(id, user);
      if (!updatedRole) {
        return ServiceResponse.failure("Role not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Role>("Role updated", updatedRole);
    } catch (ex) {
      const errorMessage = `Error updating user with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while updating user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
  // Deletes a user
  async deleteRole(id: string): Promise<ServiceResponse<Role | null>> {
    try {
      const deletedRole = await this.RolesRepository.delete(id);
      if (!deletedRole) {
        return ServiceResponse.failure("Role not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Role>("Role deleted", deletedRole);
    } catch (ex) {
      const errorMessage = `Error deleting user with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while deleting user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
  async attachPermissionToRole(
    roleId: string,
    permission_id: number,
  ): Promise<ServiceResponse<RolePermissions | null>> {
    try {
      const updatedRole = await this.RolesRepository.attachPermissionToRole(roleId, permission_id);
      if (!updatedRole) {
        return ServiceResponse.failure("Role not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<RolePermissions>("Role updated", updatedRole);
    } catch (ex) {
      const errorMessage = `Error updating user with id ${roleId}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while updating user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async detachPermissionFromRole(
    roleId: string,
    permission_id: number,
  ): Promise<ServiceResponse<RolePermissions | null>> {
    try {
      const updatedRole = await this.RolesRepository.detachPermissionFromRole(roleId, permission_id);
      if (!updatedRole) {
        return ServiceResponse.failure("Role not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<RolePermissions>("Role updated", updatedRole);
    } catch (ex) {
      const errorMessage = `Error updating user with id ${roleId}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while updating user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}

export const rolesService = new RolesService();
