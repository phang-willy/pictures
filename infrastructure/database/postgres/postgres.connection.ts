export type PostgresConnectionConfig = {
  url: string;
};

export function resolvePostgresConnectionConfig(): PostgresConnectionConfig {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }
  return { url };
}
