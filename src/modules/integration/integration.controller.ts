import { Controller, Get, Post, Body } from '@nestjs/common';
import { IntegrationService } from './integration.service';

@Controller('integrations')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Get('status')
  getStatus() {
    return this.integrationService.getStatus();
  }

  @Post('sync')
  syncData(@Body() data: any) {
    return this.integrationService.syncData(data);
  }
}
