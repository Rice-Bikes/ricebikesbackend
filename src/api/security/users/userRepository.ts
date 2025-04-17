import { PrismaClient } from "@prisma/client";
import type { Permission } from "../permissions/permissionModel";
import type { User, UserRole } from "./userModel";

const prisma = new PrismaClient();

export class UsersRepository {
  async findAllAsync(): Promise<User[]> {
    return prisma.users.findMany({
      include: {},
    });
  }

  // async findByIdAsync(username: string): Promise<User | null> {
  //   return (
  //     prisma.users.findFirst({
  //       where: {
  //         username: username,
  //         active: true,
  //       },
  //       include: {
  //         // Role: true,
  //       },
  //     }) || null
  //   );
  // }

  async findByIdAsync(username: string): Promise<User | null> {
    const user = await prisma.users.findFirst({
      where: {
        username: username,
        active: true,
      },
      include: {
        UserRoles: {
          include: {
            Role: {
              include: {
                RolePermissions: {
                  include: {
                    Permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    // Transform to flattened structure
    const roles = user.UserRoles.map((userRole) => ({
      role_id: userRole.Role.role_id,
      name: userRole.Role.name,
      description: userRole.Role.description,
      disabled: userRole.Role.disabled,
    }));

    // Extract all unique permission names
    const permissionSet = new Set<Permission>();
    user.UserRoles.forEach((userRole) => {
      if (!userRole.Role.disabled) {
        userRole.Role.RolePermissions.forEach((rp) => {
          permissionSet.add(rp.Permission);
        });
      }
    });
    return {
      user_id: user.user_id,
      firstname: user.firstname,
      lastname: user.lastname,
      username: user.username,
      active: user.active,
      permissions: Array.from(permissionSet),
    };
  }

  async create(User: User): Promise<User> {
    return prisma.users.create({
      data: User,
    });
  }
  async update(id: string, user: User): Promise<User> {
    return prisma.users.update({
      where: { user_id: id },
      data: user,
    });
  }
  async delete(id: string): Promise<User> {
    return prisma.users.delete({
      where: { user_id: id },
    });
  }

  async attachRoleToUser(userId: string, roleId: string): Promise<UserRole> {
    return prisma.userRoles.create({
      data: {
        user_id: userId,
        role_id: roleId,
      },
    });
  }
  async detachRoleFromUser(userId: string, roleId: string): Promise<UserRole> {
    return prisma.userRoles.delete({
      where: {
        user_id_role_id: {
          user_id: userId,
          role_id: roleId,
        },
      },
    });
  }
}
