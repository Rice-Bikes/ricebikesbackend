import { PrismaClient } from "@prisma/client";
import type { User } from "./userModel";

const prisma = new PrismaClient();

export class UsersRepository {
  async findAllAsync(): Promise<User[]> {
    return prisma.users.findMany();
  }

  async findByIdAsync(username: string): Promise<User | null> {
    return (
      prisma.users.findFirst({
        where: {
          username: username,
        },
      }) || null
    );
  }

  async create(User: User): Promise<User> {
    return prisma.users.create({
      data: User,
    });
  }
}
