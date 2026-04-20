import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import { slugify } from '@/domain/utils/slugify';
type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];
type JsonNonNullValue = Exclude<JsonValue, null>;

function getRequiredEnv(
  name: 'DEFAULT_EMAIL' | 'DEFAULT_PASSWORD' | 'DATABASE_URL',
): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set in environment variables.`);
  }
  return value;
}

const DEFAULT_EMAIL = getRequiredEnv('DEFAULT_EMAIL');
const DEFAULT_PASSWORD = getRequiredEnv('DEFAULT_PASSWORD');
const DATABASE_URL = getRequiredEnv('DATABASE_URL');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: DATABASE_URL }),
});
const COUNTRIES_GEOJSON_URL =
  'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json';
const MLEDOZE_COUNTRIES_JSON_URL =
  'https://raw.githubusercontent.com/mledoze/countries/refs/heads/master/dist/countries.json';
const ALLOWED_COUNTRY_ISO2 = new Set(['FR', 'LU', 'JP', 'TH', 'VN', 'ID']);
const CITIES_DATABASE_URL =
  'https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/refs/heads/master/contributions/cities';

type GeoCountryFeature = {
  id?: string;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
};

type MledozeCountry = {
  cca2?: string;
  cca3?: string;
  region?: string;
  translations?: {
    fra?: {
      common?: string;
    };
  };
  name?: {
    common?: string;
  };
};

type CountryCityEntry = {
  name?: string;
  latitude?: string;
  longitude?: string;
};

function normalizeForLookup(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const countryCityCoordinatesCache = new Map<
  string,
  Map<string, { latitude: number; longitude: number }>
>();

async function fetchCityCoordinatesByCountryIso2(
  countryIso2: string,
): Promise<Map<string, { latitude: number; longitude: number }>> {
  const normalizedIso2 = countryIso2.toUpperCase();
  const cached = countryCityCoordinatesCache.get(normalizedIso2);
  if (cached) {
    return cached;
  }
  const response = await fetch(`${CITIES_DATABASE_URL}/${normalizedIso2}.json`);
  if (!response.ok) {
    throw new Error(
      `[SEED]Unable to download cities for ${normalizedIso2} - ${response.statusText}`,
    );
  }
  const payload = (await response.json()) as CountryCityEntry[];
  const cityCoordinates = new Map<string, { latitude: number; longitude: number }>();
  for (const city of payload) {
    const name = city.name?.trim();
    if (!name || !city.latitude || !city.longitude) {
      continue;
    }
    const latitude = Number(city.latitude);
    const longitude = Number(city.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      continue;
    }
    cityCoordinates.set(normalizeForLookup(name), { latitude, longitude });
  }
  countryCityCoordinatesCache.set(normalizedIso2, cityCoordinates);
  return cityCoordinates;
}

async function getCoordinatesByCityName(
  cityName: string,
  countryCode: string,
): Promise<{ latitude: number; longitude: number } | null> {
  const cityCoordinates = await fetchCityCoordinatesByCountryIso2(countryCode);
  return cityCoordinates.get(normalizeForLookup(cityName)) ?? null;
}

async function fetchCountriesGeometryByIso3(): Promise<
  Map<string, { type: string; coordinates: JsonNonNullValue }>
> {
  const response = await fetch(COUNTRIES_GEOJSON_URL);
  if (!response.ok) {
    throw new Error('[SEED]Unable to download countries geojson');
  }
  const payload = (await response.json()) as { features?: GeoCountryFeature[] };
  const byIso3 = new Map<
    string,
    {
      type: string;
      coordinates: JsonNonNullValue;
    }
  >();
  for (const feature of payload.features ?? []) {
    const iso3 = typeof feature.id === 'string' ? feature.id.toUpperCase() : '';
    const geometryType = feature.geometry?.type;
    const coordinates = feature.geometry?.coordinates;
    if (
      !iso3 ||
      typeof geometryType !== 'string' ||
      coordinates === undefined ||
      coordinates === null
    ) {
      continue;
    }
    byIso3.set(iso3, {
      type: geometryType,
      coordinates: coordinates as JsonNonNullValue,
    });
  }
  return byIso3;
}

async function fetchCountriesCatalog(): Promise<MledozeCountry[]> {
  const response = await fetch(MLEDOZE_COUNTRIES_JSON_URL);
  if (!response.ok) {
    throw new Error('[SEED]Unable to download countries list');
  }
  return (await response.json()) as MledozeCountry[];
}

async function getCountryByIso2(iso2: string, label: string) {
  const country = await prisma.country.findUnique({
    where: { iso2 },
  });
  if (!country) {
    throw new Error(`[SEED]${label} country not found`);
  }
  return country;
}

/** Libellés français pour les valeurs `region` du catalogue mledoze (anglais). */
const REGION_EN_TO_FR: Record<string, string> = {
  Africa: 'Afrique',
  Americas: 'Amériques',
  Antarctica: 'Antarctique',
  Antarctic: 'Antarctique',
  Asia: 'Asie',
  Europe: 'Europe',
  Oceania: 'Océanie',
};

/**
 * Code stable par continent (catalogue mledoze en anglais, ou libellé français déjà en base).
 */
const REGION_TO_CONTINENT_CODE: Record<string, string> = {
  Africa: 'AF',
  Americas: 'AM',
  Antarctica: 'AN',
  Antarctic: 'AN',
  Asia: 'AS',
  Europe: 'EU',
  Oceania: 'OC',
  Afrique: 'AF',
  Amériques: 'AM',
  Antarctique: 'AN',
  Asie: 'AS',
  Océanie: 'OC',
};

function continentNameFr(regionFromCatalog: string): string {
  const trimmed = regionFromCatalog.trim();
  return REGION_EN_TO_FR[trimmed] ?? trimmed;
}

function getContinentCode(region: string): string {
  const trimmed = region.trim();
  return (
    REGION_TO_CONTINENT_CODE[trimmed] ??
    slugify(trimmed).slice(0, 8).toUpperCase()
  );
}

async function main() {
  console.log('[SEED]Starting database reset...');

  console.log('[SEED]Checking if ADMIN user exists...');
  const adminEmail = "admin" + DEFAULT_EMAIL;
  const testAdmin = await prisma.user.findUnique({
    where: {
      email: adminEmail,
    },
  });
  if (!testAdmin) {
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        role: 'ADMIN',
        isActive: true,
        verifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        passwords: {
          create: {
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      },
    });
    console.log('[SEED]ADMIN created');
  } else {
    console.log('[SEED]ADMIN already exists');
  }

  console.log('[SEED]Deleting all data...');
  await prisma.forgotPassword.deleteMany();
  await prisma.userTwoFactorCode.deleteMany();
  await prisma.password.deleteMany({
    where: {
      user: {
        NOT: { email: adminEmail },
      },
    },
  });
  await prisma.user.deleteMany({
    where: {
      NOT: { email: adminEmail },
    },
  });
  await prisma.countryGeometry.deleteMany();
  await prisma.city.deleteMany();
  await prisma.country.deleteMany();
  await prisma.continent.deleteMany();
  await prisma.photo.deleteMany();

  console.log('[SEED]Database reset');

  console.log('[SEED]Creating default data...');

  console.log('[SEED]Creating users...');
  for (let i = 1; i <= 3; i++) {
    const email = `user${i}${DEFAULT_EMAIL}`;
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    await prisma.user.create({
      data: {
        email,
        role: 'USER',
        isActive: true,
        verifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        passwords: {
          create: {
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      },
    });
    console.log(`[SEED]User ${email} created`);
  }

  console.log('[SEED]Users created');


  console.log('[SEED]Creating continents...');
  const countryCatalog = await fetchCountriesCatalog();
  const restrictedCountryCatalog = countryCatalog.filter((country) =>
    ALLOWED_COUNTRY_ISO2.has(country.cca2?.toUpperCase() ?? ''),
  );
  const regions = Array.from(
    new Set(
      restrictedCountryCatalog
        .map((country) => country.region?.trim())
        .filter((region): region is string => Boolean(region)),
    ),
  );
  for (const region of regions) {
    await prisma.continent.create({
      data: {
        code: getContinentCode(region),
        name: continentNameFr(region),
      },
    });
  }
  console.log('[SEED]Continents created');

  console.log('[SEED]Creating countries...');
  const continentsByCode = new Map(
    (
      await prisma.continent.findMany({
        select: { id: true, code: true },
      })
    ).map((continent: { code: string; id: string }) => [
      continent.code,
      continent.id,
    ]),
  );
  const baseCountries = restrictedCountryCatalog
    .map((country) => {
      const iso2 = country.cca2?.toUpperCase();
      const iso3 = country.cca3?.toUpperCase();
      const region = country.region?.trim();
      const continentCode = region ? getContinentCode(region) : '';
      const continentId = continentCode ? continentsByCode.get(continentCode) : '';
      const translatedName = country.translations?.fra?.common?.trim();
      const fallbackName = country.name?.common?.trim();
      const name = translatedName || fallbackName || '';
      return {
        iso2,
        iso3,
        continentId,
        name,
        slug: slugify(name),
      };
    })
    .filter(
      (country): country is {
        iso2: string;
        iso3: string;
        continentId: string;
        name: string;
        slug: string;
      } =>
        Boolean(
          country.iso2 &&
            country.iso3 &&
            country.continentId &&
            country.name &&
            country.slug,
        ),
    );
  const usedCountrySlugs = new Set<string>();
  const COUNTRIES = baseCountries.map((country) => {
    let slug = country.slug;
    if (usedCountrySlugs.has(slug)) {
      slug = `${slug}-${country.iso2.toLowerCase()}`;
    }
    usedCountrySlugs.add(slug);
    return { ...country, slug };
  });

  for (const country of COUNTRIES) {
    await prisma.country.create({
      data: {
        continentId: country.continentId,
        iso2: country.iso2,
        iso3: country.iso3,
        name: country.name,
        slug: country.slug,
      },
    });
  }

  const countriesGeometryByIso3 = await fetchCountriesGeometryByIso3();
  for (const country of COUNTRIES) {
    if (!country.iso3) {
      continue;
    }
    const geo = countriesGeometryByIso3.get(country.iso3.toUpperCase());
    if (!geo) {
      continue;
    }
    const createdCountry = await prisma.country.findUnique({
      where: { iso2: country.iso2 },
      select: { id: true },
    });
    if (!createdCountry) {
      continue;
    }
    await prisma.countryGeometry.upsert({
      where: { countryId: createdCountry.id },
      update: {
        type: geo.type,
        coordinate: geo.coordinates,
      },
      create: {
        countryId: createdCountry.id,
        type: geo.type,
        coordinate: geo.coordinates,
      },
    });
  }

  console.log('[SEED]Countries created');

  console.log('[SEED]Creating cities...');

  const CITIES = [
    {
      name: 'Paris',
      countryIso2: 'FR',
    },
    {
      name: 'Deauville',
      countryIso2: 'FR',
    },
    {
      name: 'Luxembourg',
      countryIso2: 'LU',
    },
    {
      name: 'Tokyo',
      countryIso2: 'JP',
    },
    {
      name: 'Kyoto',
      countryIso2: 'JP',
    },
    {
      name: 'Hô Chi Minh-Ville',
      lookupName: 'Ho Chi Minh City',
      countryIso2: 'VN',
    },
    {
      name: 'Hanoï',
      lookupName: 'Ha Noi',
      countryIso2: 'VN',
      latitude: 21.0277644,
      longitude: 105.8341598,
    },
    {
      name: 'Bangkok',
      countryIso2: 'TH',
    },
    {
      name: 'Lombok',
      lookupName: 'Lombok Barat',
      countryIso2: 'ID',
    },
  ];

  for (const city of CITIES) {
    const country = await getCountryByIso2(city.countryIso2, city.name);
    const lookedUpCoordinates = await getCoordinatesByCityName(
      city.lookupName ?? city.name,
      city.countryIso2,
    );
    const coordinates =
      lookedUpCoordinates ??
      (city.latitude !== undefined && city.longitude !== undefined
        ? { latitude: city.latitude, longitude: city.longitude }
        : null);
    if (!coordinates) {
      console.warn(
        `[SEED]Skipping city without coordinates: ${city.name} (${city.countryIso2})`,
      );
      continue;
    }
    await prisma.city.create({
      data: {
        countryId: country.id,
        name: city.name,
        slug: slugify(city.name),
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      },
    });
  }

  await prisma.$executeRaw`
    UPDATE "City"
    SET "location" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography
    WHERE "location" IS NULL
  `;

  console.log('[SEED]Cities created');

  console.log('[SEED]Ending seed...');
  console.log('[SEED]Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());