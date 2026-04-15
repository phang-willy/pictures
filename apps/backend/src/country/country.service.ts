import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type CountryListItem = {
  id: string;
  codeIso2: string;
  codeIso3: string | null;
  name: string;
  slug: string;
  geometry?: {
    type: string;
    coordinate: unknown;
  } | null;
};

@Injectable()
export class CountryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(includeGeometry = false): Promise<CountryListItem[]> {
    return this.prisma.country.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        codeIso2: true,
        codeIso3: true,
        name: true,
        slug: true,
        ...(includeGeometry
          ? {
              geometry: {
                select: {
                  type: true,
                  coordinate: true,
                },
              },
            }
          : {}),
      },
    });
  }
}
