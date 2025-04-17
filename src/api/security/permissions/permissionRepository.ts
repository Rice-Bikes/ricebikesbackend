import { PrismaClient } from "@prisma/client";
import type { Permission } from "./permissionModel";

const prisma = new PrismaClient();

export class PermissionsRepository {
  async findAllAsync(): Promise<Permission[]> {
    return prisma.permissions.findMany();
  }

  async findByIdAsync(id: number): Promise<Permission | null> {
    return (
      prisma.permissions.findFirst({
        where: {
          id,
        },
        include: {
          // Role: true,
        },
      }) || null
    );
  }

  async findByRoleIdAsync(roleId: string): Promise<Permission[] | null> {
    const permissionsList = await prisma.rolePermissions.findMany({
      where: {
        role_id: roleId,
      },
      include: {
        Permission: true,
      },
    });
    if (permissionsList.length === 0) return null;
    return permissionsList
      .map((permission) => permission.Permission)
      .filter((permission): permission is Permission => permission !== undefined);
  }

  async create(Role: Permission): Promise<Permission> {
    return prisma.permissions.create({
      data: Role,
    });
  }
  async update(id: number, user: Permission): Promise<Permission> {
    return prisma.permissions.update({
      where: { id: id },
      data: user,
    });
  }
  async delete(id: number): Promise<Permission> {
    return prisma.permissions.delete({
      where: { id: id },
    });
  }
}
