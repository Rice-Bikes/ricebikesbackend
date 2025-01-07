import { PrismaClient } from "@prisma/client";
import type { User } from "./userModel";

const prisma = new PrismaClient();

export class UsersRepository {
  async findAllAsync(): Promise<User[]> {
    return prisma.user.findMany();
  }

  async findByIdAsync(username: string): Promise<User | null> {
    return (
      prisma.user.findFirst({
        where: {
          username: username,
        },
      }) || null
    );
  }

  async create(User: User): Promise<User> {
    return prisma.user.create({
      data: User,
    });
  }
}
