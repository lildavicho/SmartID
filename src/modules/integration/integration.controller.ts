import { Controller, Get, Post, Body } from '@nestjs/common';
import { IntegrationService } from './integration.service';

export interface SyncDataDto {
  institutionId?: string;
  entityType?: string;
  [key: string]: unknown;
}

@Controller('integrations')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get('status')
  getStatus() {
    return this.integrationService.getStatus();
  }

  @Post('sync')
  syncData(@Body() data: SyncDataDto) {
    return this.integrationService.syncData(data);
  }
}
