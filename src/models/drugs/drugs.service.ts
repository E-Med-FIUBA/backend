import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { DrugDTO } from './dto/drug.dto';
import { Drug } from '@prisma/client';

@Injectable()
export class DrugsService {
  constructor(private prismaService: PrismaService) {}

  create(data: Omit<Drug, 'id'>) {
    return this.prismaService.drug.create({
      data,
    });
  }

  findAll() {
    return this.prismaService.drug.findMany();
  }

  findOne(id: number) {
    return this.prismaService.drug.findUnique({
      where: {
        id: id,
      },
      include: {
        presentations: {
          distinct: ['name'],
        },
      },
    });
  }

  update(id: number, data: DrugDTO) {
    return this.prismaService.drug.update({
      where: {
        id: id,
      },
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  remove(id: number) {
    return this.prismaService.drug.delete({
      where: {
        id: id,
      },
    });
  }

  // Get drug usage metrics for a pharmacist
  getMetrics(pharmacistId: number) {
    return this.prismaService.drug.findMany({
      select: {
        name: true,
        presentations: {
          select: {
            prescriptions: {
              where: {
                pharmacistId: pharmacistId,
              },
            },
          },
        },
      },
    });
  }

  search(query: string, page: number, limit: number) {
    return this.prismaService.drug.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            atc: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            presentations: {
              some: {
                name: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        presentations: true,
      },
    });
  }
}
