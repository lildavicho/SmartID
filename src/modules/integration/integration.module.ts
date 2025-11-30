import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Integration } from './entities/integration.entity';
import { IntegrationMapping } from './entities/integration-mapping.entity';
import { IntegrationService } from './services/integration.service';
import { MappingService } from './services/mapping.service';
import { ConnectorFactory } from './services/connector-factory.service';
import { IntegrationController } from './controllers/integration.controller';
import { AcademicModule } from '../academic/academic.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Integration, IntegrationMapping]),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    AcademicModule,
  ],
  controllers: [IntegrationController],
  providers: [IntegrationService, MappingService, ConnectorFactory],
  exports: [IntegrationService, MappingService, ConnectorFactory],
})
export class IntegrationModule {}
