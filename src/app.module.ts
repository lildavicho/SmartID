import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validateDatabaseConfig } from './config/database.config';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { InstitutionModule } from './modules/institution/institution.module';
import { DeviceModule } from './modules/device/device.module';
import { AcademicModule } from './modules/academic/academic.module';
import { SessionModule } from './modules/session/session.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { ReportingModule } from './modules/reporting/reporting.module';

@Module({
  imports: [
    // Global Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development', '.env.local'],
    }),
    
    // Database Configuration
    TypeOrmModule.forRoot(validateDatabaseConfig()),
    
    // Feature Modules
    AuthModule,
    UserModule,
    InstitutionModule,
    DeviceModule,
    AcademicModule,
    SessionModule,
    IntegrationModule,
    ReportingModule,
  ],
})
export class AppModule {}
