import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { validateDatabaseConfig } from './config/database.config';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // Validar configuración de base de datos antes de iniciar
    logger.log('🔍 Validating database configuration...');
    validateDatabaseConfig();

    // Crear aplicación
    logger.log('🚀 Starting SmartPresence AI...');
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const configService = app.get(ConfigService);

    // Validar conexión a base de datos
    await validateDatabaseConnection(app);

    // Security - Helmet
    app.use(helmet());

    // Global prefix
    const apiPrefix = configService.get('API_PREFIX') || 'api/v1';
    app.setGlobalPrefix(apiPrefix);

    // CORS configuration
    const frontendUrl = configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const corsOrigin = configService.get('CORS_ORIGIN')?.split(',') || [frontendUrl];
    app.enableCors({
      origin: corsOrigin,
      credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Global exception filters
    app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

    // Swagger API Documentation
    const swaggerConfig = new DocumentBuilder()
      .setTitle('SmartPresence AI API')
      .setDescription(
        'API REST para plataforma de asistencia inteligente con IA embebida en pantallas Riotouch. ' +
          'Gestiona instituciones, dispositivos, cursos, sesiones de clase y asistencia automática.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('institutions', 'Gestión de instituciones y campus')
      .addTag('devices', 'Gestión de dispositivos y aulas')
      .addTag('academic', 'Gestión académica (cursos, estudiantes, docentes)')
      .addTag('sessions', 'Sesiones de clase y asistencia')
      .addTag('integrations', 'Integraciones con SIS externos')
      .addTag('auth', 'Autenticación y autorización')
      .addTag('users', 'Gestión de usuarios')
      .addTag('reports', 'Reportes y exportaciones')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    // Graceful shutdown
    app.enableShutdownHooks();

    const port = configService.get('PORT') || 3000;
    const nodeEnv = configService.get('NODE_ENV') || 'development';

    await app.listen(port);

    logger.log('='.repeat(60));
    logger.log(`🚀 SmartPresence AI is running!`);
    logger.log(`📍 Environment: ${nodeEnv}`);
    logger.log(`🌐 URL: http://localhost:${port}/${apiPrefix}`);
    logger.log(`📚 API Docs: http://localhost:${port}/api/docs`);
    logger.log('='.repeat(60));
  } catch (error) {
    logger.error('❌ Failed to start application:', error.message);
    logger.error(error.stack);
    process.exit(1);
  }
}

/**
 * Validar conexión a la base de datos
 */
async function validateDatabaseConnection(app: { get: (token: any) => any }): Promise<void> {
  const logger = new Logger('Database');

  try {
    const dataSource = app.get(DataSource);

    if (!dataSource.isInitialized) {
      logger.warn('⚠️  DataSource is not initialized');
      return;
    }

    // Ejecutar query simple para validar conexión
    await dataSource.query('SELECT 1');

    const dbConfig = dataSource.options;
    const dbType = dbConfig.type;
    const dbName = 'database' in dbConfig ? dbConfig.database : 'N/A';
    const dbHost = 'host' in dbConfig ? dbConfig.host : 'URL connection';

    logger.log('✅ Database connection established successfully');
    logger.log(`   Type: ${dbType}`);
    logger.log(`   Host: ${dbHost}`);
    logger.log(`   Database: ${dbName}`);

    // Verificar si hay migraciones pendientes
    const pendingMigrations = await dataSource.showMigrations();
    if (pendingMigrations) {
      logger.warn('⚠️  There are pending migrations. Run: npm run migration:run');
    } else {
      logger.log('✅ All migrations are up to date');
    }
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    logger.error('   Please check your database configuration in .env file');
    logger.error('   See POSTGRESQL_SETUP.md for help');
    throw error;
  }
}

bootstrap();
