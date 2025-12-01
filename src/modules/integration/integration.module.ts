import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Integration } from './entities/integration.entity';
import { IntegrationMapping } from './entities/integration-mapping.entity';
import { ExternalTeacherAccount } from './entities/external-teacher-account.entity';
import { ExternalClassMapping } from './entities/external-class-mapping.entity';
import { IntegrationService } from './services/integration.service';
import { MappingService } from './services/mapping.service';
import { ConnectorFactory } from './services/connector-factory.service';
import { PlatformSyncService } from './services/platform-sync.service';
import { IntegrationController } from './controllers/integration.controller';
import { AcademicModule } from '../academic/academic.module';
import { Teacher } from '../academic/entities/teacher.entity';
import { Group } from '../academic/entities/group.entity';
import { Student } from '../academic/entities/student.entity';
import { ClassSession } from '../session/entities/class-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Integration,
      IntegrationMapping,
      ExternalTeacherAccount,
      ExternalClassMapping,
      Teacher,
      Group,
      Student,
      ClassSession,
    ]),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    AcademicModule,
  ],
  controllers: [IntegrationController],
  providers: [
    IntegrationService,
    MappingService,
    ConnectorFactory,
    PlatformSyncService,
  ],
  exports: [
    IntegrationService,
    MappingService,
    ConnectorFactory,
    PlatformSyncService,
  ],
})
export class IntegrationModule {}
