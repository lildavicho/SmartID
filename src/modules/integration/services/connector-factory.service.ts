import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IntegrationProvider } from '../enums/integration-provider.enum';
import { SISConnector } from '../interfaces/sis-connector.interface';
import { IdukayConnector } from '../connectors/idukay/idukay.connector';
import { MoodleConnector } from '../connectors/moodle.connector';
import { GenericCsvConnector } from '../connectors/generic-csv.connector';
import { MappingService } from './mapping.service';

@Injectable()
export class ConnectorFactory {
  constructor(
    private readonly httpService: HttpService,
    private readonly mappingService: MappingService,
  ) {}

  getSupportedProviders(): IntegrationProvider[] {
    return [
      IntegrationProvider.IDUKAY,
      IntegrationProvider.MOODLE,
      IntegrationProvider.GENERIC_CSV,
    ];
  }

  createConnector(provider: IntegrationProvider): SISConnector {
    switch (provider) {
      case IntegrationProvider.IDUKAY:
        return new IdukayConnector(this.httpService, this.mappingService);

      case IntegrationProvider.MOODLE:
        return new MoodleConnector();

      case IntegrationProvider.GENERIC_CSV:
        return new GenericCsvConnector();

      default:
        throw new Error(`Unsupported integration provider: ${provider}`);
    }
  }
}
