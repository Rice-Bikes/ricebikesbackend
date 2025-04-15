import { PrismaClient } from "@prisma/client";
import type { Role } from "./roleModel";

const prisma = new PrismaClient();

export class RolesRepository {
  async findAllAsync(): Promise<Role[]> {
    return prisma.roles.findMany();
  }

  async findByIdAsync(username: string): Promise<Role | null> {
    return (
      prisma.roles.findFirst({
        where: {
          name: username,
          disabled: true,
        },
        include: {
          // Role: true,
        },
      }) || null
    );
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
}
