import { User } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { UserDTO } from './dto/user.dto';
import { Injectable } from '@nestjs/common';
import { PrismaTransactionalClient } from 'utils/types';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  create(data: Omit<User, 'id'>, tx: PrismaTransactionalClient = this.prisma) {
    return tx.user.create({
      data,
    });
  }

  findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  findOne(id: number): Promise<User> {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  update(
    id: number,
    data: Partial<User>,
    tx: PrismaTransactionalClient = this.prisma,
  ): Promise<User> {
    return tx.user.update({
      where: {
        id,
      },
      data,
    });
  }

  remove(id: number): Promise<User> {
    return this.prisma.user.delete({
      where: {
        id,
      },
    });
  }

  findByUID(uid: string): Promise<User> {
    return this.prisma.user.findUnique({
      where: {
        uid,
      },
    });
  }

  async findByEmail(email: string): Promise<User> {
    const users = await this.prisma.user.findMany({
      where: {
        email,
      },
    });

    if (users.length > 1) {
      throw new Error('Multiple users found with the same email');
    }

    return users[0];
  }
}
