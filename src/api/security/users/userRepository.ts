import { PrismaClient } from "@prisma/client";
import type { User, UserRole } from "./userModel";

const prisma = new PrismaClient();

export class UsersRepository {
  async findAllAsync(): Promise<User[]> {
    return prisma.users.findMany({
      include: {},
    });
  }

  async findByIdAsync(username: string): Promise<User | null> {
    return (
      prisma.users.findFirst({
        where: {
          username: username,
          active: true,
        },
        include: {
          // Role: true,
        },
      }) || null
    );
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
