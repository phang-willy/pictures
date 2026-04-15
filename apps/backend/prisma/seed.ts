import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

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

async function getContinentByCode(code: string, label: string) {
  const continent = await prisma.continent.findUnique({
    where: { code },
  });
  if (!continent) {
    throw new Error(`[SEED]${label} continent not found`);
  }
  return continent;
}

async function getCountryByIso2(codeIso2: string, label: string) {
  const country = await prisma.country.findUnique({
    where: { codeIso2 },
  });
  if (!country) {
    throw new Error(`[SEED]${label} country not found`);
  }
  return country;
}

async function main() {
  console.log('[SEED]Starting database reset...');

  console.log('[SEED]Checking if ADMIN user exists...');
  const user = await prisma.user.findUnique({
    where: {
      email: DEFAULT_EMAIL,
    },
  });
  if (!user) {
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    await prisma.user.create({
      data: {
        email: DEFAULT_EMAIL,
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
  await prisma.password.deleteMany();
  await prisma.user.deleteMany({
    where: {
      NOT: { email: DEFAULT_EMAIL },
    },
  });
  await prisma.city.deleteMany();
  await prisma.country.deleteMany();
  await prisma.continent.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.place.deleteMany();

  console.log('[SEED]Database reset');

  console.log('[SEED]Creating default data...');

  console.log('[SEED]Creating continents...');
  const CONTINENTS = [
    {
      code: 'EU',
      name: 'Europe',
    },
    {
      code: 'AS',
      name: 'Asie',
    },
  ];

  for (const continent of CONTINENTS) {
    await prisma.continent.create({
      data: {
        code: continent.code,
        name: continent.name,
      },
    });
  }

  const EUROPE_CONTINENT = await getContinentByCode('EU', 'Europe');
  const ASIA_CONTINENT = await getContinentByCode('AS', 'Asia');

  console.log('[SEED]Continents created');

  console.log('[SEED]Creating countries...');
  const COUNTRIES = [
    {
      codeIso2: 'FR',
      codeIso3: 'FRA',
      name: 'France',
      slug: 'france',
      continentId: EUROPE_CONTINENT.id,
    },
    {
      codeIso2: 'LU',
      codeIso3: 'LUX',
      name: 'Luxembourg',
      slug: 'luxembourg',
      continentId: EUROPE_CONTINENT.id,
    },
    {
      codeIso2: 'JP',
      codeIso3: 'JPN',
      name: 'Japon',
      slug: 'japan',
      continentId: ASIA_CONTINENT.id,
    },
    {
      codeIso2: 'VN',
      codeIso3: 'VNM',
      name: 'Vietnam',
      slug: 'vietnam',
      continentId: ASIA_CONTINENT.id,
    },
    {
      codeIso2: 'TH',
      codeIso3: 'THA',
      name: 'Thailande',
      slug: 'thailand',
      continentId: ASIA_CONTINENT.id,
    },
    {
      codeIso2: 'ID',
      codeIso3: 'IDN',
      name: 'Indonesie',
      slug: 'indonesia',
      continentId: ASIA_CONTINENT.id,
    },
  ];

  for (const country of COUNTRIES) {
    await prisma.country.create({
      data: {
        continentId: country.continentId,
        codeIso2: country.codeIso2,
        codeIso3: country.codeIso3,
        name: country.name,
        slug: country.slug,
      },
    });
  }

  console.log('[SEED] Countries created');

  const FRANCE_COUNTRY = await getCountryByIso2('FR', 'France');
  const LUXEMBOURG_COUNTRY = await getCountryByIso2('LU', 'Luxembourg');
  const JAPAN_COUNTRY = await getCountryByIso2('JP', 'Japan');
  const VIETNAM_COUNTRY = await getCountryByIso2('VN', 'Vietnam');
  const THAILAND_COUNTRY = await getCountryByIso2('TH', 'Thailand');
  const INDONESIA_COUNTRY = await getCountryByIso2('ID', 'Indonesia');

  console.log('[SEED]Countries created');

  const CITIES = [
    {
      name: 'Paris',
      slug: 'paris',
      countryId: FRANCE_COUNTRY.id,
      latitude: 48.8566,
      longitude: 2.3522,
    },
    {
      name: 'Luxembourg Ville',
      slug: 'luxembourg',
      countryId: LUXEMBOURG_COUNTRY.id,
      latitude: 49.6117,
      longitude: 6.1319,
    },
    {
      name: 'Tokyo',
      slug: 'tokyo',
      countryId: JAPAN_COUNTRY.id,
      latitude: 35.6895,
      longitude: 139.6917,
    },
    {
      name: 'Ho Chi Minh',
      slug: 'ho-chi-minh',
      countryId: VIETNAM_COUNTRY.id,
      latitude: 10.8231,
      longitude: 106.6297,
    },
    {
      name: 'Bangkok',
      slug: 'bangkok',
      countryId: THAILAND_COUNTRY.id,
      latitude: 13.7563,
      longitude: 100.5018,
    },
    {
      name: 'Lombok Island',
      slug: 'lombok',
      countryId: INDONESIA_COUNTRY.id,
      latitude: -8.59,
      longitude: 116.23,
    },
  ];

  for (const city of CITIES) {
    await prisma.city.create({
      data: {
        countryId: city.countryId,
        name: city.name,
        slug: city.slug,
        latitude: city.latitude,
        longitude: city.longitude,
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
