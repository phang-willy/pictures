import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

dotenv.config({ path: '../../.env' });
dotenv.config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5432/postgres?schema=public',
  },
});
