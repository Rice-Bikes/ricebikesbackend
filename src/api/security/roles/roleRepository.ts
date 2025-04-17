import { PrismaClient, type RolePermissions } from "@prisma/client";
import type { Role, RoleUser } from "./roleModel";

const prisma = new PrismaClient();

export class RolesRepository {
  async findAllAsync(): Promise<Role[]> {
    return prisma.roles.findMany();
  }

  async findByIdAsync(username: string): Promise<Role[] | null> {
    const rolesList = await prisma.userRoles.findMany({
      where: {
        user_id: username,
      },
      include: {
        Role: true,
      },
    });

    if (rolesList.length === 0) return null;

    return rolesList.map((role: RoleUser) => role.Role).filter((role): role is Role => role !== undefined);
  }

  async create(Role: Role): Promise<Role> {
    return prisma.roles.create({
      data: Role,
    });
  }
  async update(id: string, user: Role): Promise<Role> {
    return prisma.roles.update({
      where: { role_id: id },
      data: user,
    });
  }
  async delete(id: string): Promise<Role> {
    return prisma.roles.delete({
      where: { role_id: id },
    });
  }

  async attachPermissionToRole(roleId: string, permission_id: number): Promise<RolePermissions> {
    return prisma.rolePermissions.create({
      data: {
        permission_id,
        role_id: roleId,
      },
    });
  }

  async detachPermissionFromRole(roleId: string, permission_id: number): Promise<RolePermissions> {
    return prisma.rolePermissions.delete({
      where: {
        role_id_permission_id: {
          role_id: roleId,
          permission_id,
        },
      },
    });
  }
}
