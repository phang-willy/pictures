import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type CountryGeometryListItem = {
  id: string;
  countryId: string;
  type: string;
  coordinate: unknown;
  country: {
    id: string;
    codeIso2: string;
    codeIso3: string | null;
    name: string;
    slug: string;
  };
};

@Injectable()
export class CountryGeometryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<CountryGeometryListItem[]> {
    return this.prisma.countryGeometry.findMany({
      orderBy: { country: { name: 'asc' } },
      select: {
        id: true,
        countryId: true,
        type: true,
        coordinate: true,
        country: {
          select: {
            id: true,
            codeIso2: true,
            codeIso3: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }
}
