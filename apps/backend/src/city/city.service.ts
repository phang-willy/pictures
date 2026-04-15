import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type CityListItem = {
  id: string;
  countryId: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
};

@Injectable()
export class CityService {
  constructor(private readonly prisma: PrismaService) {}

  async listByCountry(countryId: string): Promise<CityListItem[]> {
    return this.prisma.city.findMany({
      where: { countryId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        countryId: true,
        name: true,
        slug: true,
        latitude: true,
        longitude: true,
      },
    });
  }

  async listByCountrySlug(countrySlug: string): Promise<CityListItem[]> {
    return this.prisma.city.findMany({
      where: {
        country: {
          slug: countrySlug,
        },
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        countryId: true,
        name: true,
        slug: true,
        latitude: true,
        longitude: true,
      },
    });
  }
}
