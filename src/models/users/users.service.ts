import { User } from '@prisma/client';
import { PrismaService } from '../../prisma.service';
import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaTransactionalClient } from 'utils/types';
import { firebaseAdmin } from 'src/firebase/firebase';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

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

  findByUIDIncludeData(uid: string) {
    return this.prisma.user.findUnique({
      where: {
        uid,
      },
      include: {
        doctor: {
          include: {
            specialty: true,
          },
        },
        pharmacist: true,
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
      throw new ConflictException('Multiple users found with the same email');
    }

    return users[0];
  }

  async deleteAll() {
    try {
      const listUsersResult = await firebaseAdmin.auth().listUsers();
      await Promise.all(
        listUsersResult.users.map(async (user) => {
          await firebaseAdmin.auth().deleteUser(user.uid);
        }),
      );
    } catch (error) {
      throw new Error(`Failed to delete all users: ${error.message}`);
    }
  }
}
