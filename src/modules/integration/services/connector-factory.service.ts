import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IntegrationProvider } from '../enums/integration-provider.enum';
import { SISConnector } from '../interfaces/sis-connector.interface';
import { IdukayConnector } from '../connectors/idukay/idukay.connector';
import { MoodleConnector } from '../connectors/moodle.connector';
import { GenericCsvConnector } from '../connectors/generic-csv.connector';
import { MappingService } from './mapping.service';

/**
 * Factory para crear conectores de plataformas LMS/SIS
 * 
 * Este factory permite agregar nuevas plataformas fácilmente:
 * 1. Crea un conector que implemente SISConnector
 * 2. Agrega el caso en createConnector()
 * 3. Agrega el provider al enum IntegrationProvider
 * 
 * El sistema es completamente extensible y compatible con cualquier plataforma.
 */
@Injectable()
export class ConnectorFactory {
  private readonly logger = new Logger(ConnectorFactory.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly mappingService: MappingService,
  ) {}

  /**
   * Obtiene la lista de proveedores soportados
   * 
   * Nota: Algunos proveedores pueden estar en el enum pero no tener conector implementado aún.
   * Solo se listan aquí los que tienen implementación completa.
   */
  getSupportedProviders(): IntegrationProvider[] {
    return [
      IntegrationProvider.IDUKAY,
      IntegrationProvider.MOODLE,
      IntegrationProvider.GENERIC_CSV,
      // Futuros: GOOGLE_CLASSROOM, CANVAS, BLACKBOARD, etc.
      // Se agregan aquí cuando se implementa el conector correspondiente
    ];
  }

  /**
   * Crea una instancia del conector apropiado para la plataforma especificada
   * 
   * @param provider Plataforma LMS/SIS
   * @returns Instancia del conector que implementa SISConnector
   * @throws Error si la plataforma no está soportada
   */
  createConnector(provider: IntegrationProvider): SISConnector {
    switch (provider) {
      case IntegrationProvider.IDUKAY:
        return new IdukayConnector(this.httpService, this.mappingService);

      case IntegrationProvider.MOODLE:
        return new MoodleConnector();

      case IntegrationProvider.GENERIC_CSV:
        return new GenericCsvConnector();

      // Placeholders para futuras implementaciones
      case IntegrationProvider.GOOGLE_CLASSROOM:
      case IntegrationProvider.CANVAS:
      case IntegrationProvider.BLACKBOARD:
      case IntegrationProvider.SCHOOLOGY:
      case IntegrationProvider.BRIGHTSPACE:
      case IntegrationProvider.SAKAI:
        this.logger.warn(
          `Conector para ${provider} aún no implementado. Usando conector genérico.`,
        );
        // Por ahora, usar CSV genérico como fallback
        return new GenericCsvConnector();

      case IntegrationProvider.CUSTOM:
        this.logger.warn('Conector CUSTOM requiere configuración personalizada');
        return new GenericCsvConnector();

      default:
        throw new Error(
          `Plataforma de integración no soportada: ${provider}. ` +
            `Plataformas soportadas: ${this.getSupportedProviders().join(', ')}`,
        );
    }
  }

  /**
   * Verifica si una plataforma está soportada (tiene conector implementado)
   */
  isProviderSupported(provider: IntegrationProvider): boolean {
    return this.getSupportedProviders().includes(provider);
  }
}
