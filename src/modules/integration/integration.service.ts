import { Injectable } from '@nestjs/common';

export interface SyncDataDto {
  institutionId?: string;
  entityType?: string;
  [key: string]: unknown;
}

@Injectable()
export class IntegrationService {
  getStatus() {
    return {
      status: 'active',
      integrations: [],
      message: 'Integration module ready',
    };
  }

  syncData(data: SyncDataDto) {
    return {
      success: true,
      message: 'Data synchronized successfully',
      data,
    };
  }
}
