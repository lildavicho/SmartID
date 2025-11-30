import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';

/**
 * Configuración de base de datos en memoria para tests
 * Usa SQLite en memoria en lugar de PostgreSQL
 */
export const getTestDatabaseConfig = () => ({
  type: 'better-sqlite3' as const,
  database: ':memory:',
  entities: [__dirname + '/../../src/**/*.entity{.ts,.js}'],
  synchronize: true,
  dropSchema: true,
  logging: false,
});

/**
 * Crea una aplicación Nest de prueba con BD en memoria
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      // Sobrescribir TypeORM con configuración de test
      TypeOrmModule.forRoot(getTestDatabaseConfig()),
      AppModule,
    ],
  })
    .overrideModule(AppModule)
    .useModule(
      class TestAppModule {
        // Módulo vacío para sobrescribir imports de BD
      },
    )
    .compile();

  const app = moduleFixture.createNestApplication();

  // Configurar pipes globales igual que en producción
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
}

/**
 * Cierra la aplicación de test y limpia la BD
 */
export async function closeTestApp(app: INestApplication): Promise<void> {
  if (app) {
    const dataSource = app.get(DataSource, { strict: false });
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  }
}

/**
 * Helper para crear un usuario de prueba
 */
export function createTestUser(role: string = 'ADMIN') {
  return {
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!@#',
    firstName: 'Test',
    lastName: 'User',
    role: role,
  };
}

/**
 * Helper para crear datos de prueba de institución
 */
export function createTestInstitution() {
  return {
    name: `Test Institution ${Date.now()}`,
    code: `INST${Date.now()}`,
    country: 'Ecuador',
    timezone: 'America/Guayaquil',
  };
}
