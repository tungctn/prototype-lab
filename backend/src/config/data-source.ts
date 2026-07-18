import * as path from 'node:path';
import { loadEnvFile } from 'node:process';
import { DataSource, DataSourceOptions } from 'typeorm';

try {
  loadEnvFile();
} catch {
  // CI and production can inject environment variables without a local .env file.
}

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [path.join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '..', 'migrations', '*{.ts,.js}')],
  synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
  logging: process.env.TYPEORM_LOGGING === 'true',
};

export default new DataSource(dataSourceOptions);
