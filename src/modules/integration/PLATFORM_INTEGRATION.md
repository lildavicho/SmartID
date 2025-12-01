# Guía de Integración con Plataformas LMS/SIS

## Sistema Genérico de Integración

SmartPresence está diseñado para ser **compatible con cualquier plataforma LMS/SIS** que implemente el contrato `SISConnector`. El sistema es completamente extensible y no está limitado a una sola plataforma.

## Arquitectura

### Componentes Principales

1. **SISConnector Interface**: Contrato que todas las plataformas deben implementar
2. **ConnectorFactory**: Crea instancias de conectores según la plataforma
3. **PlatformSyncService**: Servicio genérico que sincroniza datos con cualquier plataforma
4. **IntegrationService**: Gestiona configuraciones de integración
5. **MappingService**: Mantiene mapeos bidireccionales entre IDs internos y externos

### Entidades de Mapeo

- **ExternalTeacherAccount**: Mapea profesores internos con cuentas externas
- **ExternalClassMapping**: Mapea clases/grupos internos con clases externas
- **IntegrationMapping**: Mapeo genérico para cualquier entidad (estudiantes, cursos, etc.)

## Plataformas Soportadas

### Implementadas

- ✅ **IDUKAY**: Sistema chileno
- ✅ **Moodle**: LMS open source
- ✅ **GENERIC_CSV**: Importación/exportación CSV

### Preparadas (enum listo, conector pendiente)

- 🔄 **GOOGLE_CLASSROOM**: Google Classroom
- 🔄 **CANVAS**: Instructure Canvas
- 🔄 **BLACKBOARD**: Blackboard Learn
- 🔄 **SCHOOLOGY**: Schoology
- 🔄 **BRIGHTSPACE**: D2L Brightspace
- 🔄 **SAKAI**: Sakai LMS
- 🔄 **CUSTOM**: Conector personalizado

## Cómo Agregar una Nueva Plataforma

### Paso 1: Crear el Conector

Crea un nuevo archivo en `connectors/`:

```typescript
// connectors/google-classroom.connector.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SISConnector, SyncResult, SendResult, ConnectorConfig, ConnectorCredentials } from '../interfaces/sis-connector.interface';
import { MappingService } from '../services/mapping.service';
import { IntegrationMapping } from '../entities/integration-mapping.entity';

@Injectable()
export class GoogleClassroomConnector implements SISConnector {
  private config: ConnectorConfig;
  private credentials: ConnectorCredentials;
  private connected: boolean = false;

  constructor(
    private readonly httpService: HttpService,
    private readonly mappingService: MappingService,
  ) {}

  async connect(config: ConnectorConfig, credentials: ConnectorCredentials): Promise<boolean> {
    this.config = config;
    this.credentials = credentials;
    
    // Implementar lógica de conexión con Google Classroom API
    // Validar credenciales, obtener tokens, etc.
    
    this.connected = true;
    return true;
  }

  async testConnection(): Promise<boolean> {
    // Probar conexión con la API
    try {
      // Hacer una llamada de prueba
      return true;
    } catch (error) {
      return false;
    }
  }

  async syncStudents(institutionId: string): Promise<SyncResult> {
    // 1. Obtener estudiantes desde Google Classroom
    // 2. Mapear con estudiantes internos
    // 3. Crear/actualizar registros
    // 4. Guardar mapeos
    
    return {
      success: true,
      synced: 0,
      errors: [],
      mappings: [],
    };
  }

  async syncCourses(institutionId: string): Promise<SyncResult> {
    // Similar a syncStudents pero para cursos/clases
    return {
      success: true,
      synced: 0,
      errors: [],
      mappings: [],
    };
  }

  async sendAttendance(sessionId: string): Promise<SendResult> {
    // 1. Obtener datos de asistencia de la sesión
    // 2. Transformar al formato de Google Classroom
    // 3. Enviar a la API
    // 4. Manejar errores
    
    return {
      success: true,
      sent: 0,
      errors: [],
    };
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    // Limpiar recursos, cerrar conexiones, etc.
  }
}
```

### Paso 2: Agregar al Enum

El enum ya incluye las plataformas más comunes. Si necesitas una nueva:

```typescript
// enums/integration-provider.enum.ts
export enum IntegrationProvider {
  // ... existentes
  TU_NUEVA_PLATAFORMA = 'TU_NUEVA_PLATAFORMA',
}
```

### Paso 3: Registrar en ConnectorFactory

```typescript
// services/connector-factory.service.ts
import { GoogleClassroomConnector } from '../connectors/google-classroom.connector';

createConnector(provider: IntegrationProvider): SISConnector {
  switch (provider) {
    // ... casos existentes
    case IntegrationProvider.GOOGLE_CLASSROOM:
      return new GoogleClassroomConnector(this.httpService, this.mappingService);
    
    default:
      throw new Error(`Unsupported integration provider: ${provider}`);
  }
}
```

### Paso 4: Actualizar getSupportedProviders()

```typescript
getSupportedProviders(): IntegrationProvider[] {
  return [
    // ... existentes
    IntegrationProvider.GOOGLE_CLASSROOM,
  ];
}
```

¡Listo! La nueva plataforma ya está disponible.

## Uso del Sistema Genérico

### Crear una Integración

```typescript
const integration = await integrationService.createIntegration({
  institutionId: 'institution-uuid',
  provider: IntegrationProvider.GOOGLE_CLASSROOM,
  config: {
    apiUrl: 'https://classroom.googleapis.com',
    timeout: 30000,
  },
  credentials: {
    token: 'oauth-token',
    refreshToken: 'refresh-token',
  },
});
```

### Sincronizar Datos

```typescript
// Usar PlatformSyncService (genérico para todas las plataformas)
await platformSyncService.syncTeachers(integration.id);
await platformSyncService.syncStudents(integration.id);
await platformSyncService.syncClasses(integration.id);

// O sincronizar todo
await platformSyncService.syncAll(integration.id);
```

### Enviar Asistencia

```typescript
await platformSyncService.pushAttendanceForSession(integration.id, sessionId);
```

## Ventajas del Sistema Genérico

1. **Extensible**: Agregar nuevas plataformas es simple
2. **Mantenible**: Código centralizado, sin duplicación
3. **Testeable**: Cada conector se puede testear independientemente
4. **Escalable**: Soporta múltiples integraciones simultáneas
5. **Flexible**: Cada plataforma puede tener su propia lógica sin afectar otras

## Mejores Prácticas

1. **Manejo de Errores**: Siempre maneja errores de red y API
2. **Logging**: Registra todas las operaciones importantes
3. **Mapeos**: Mantén mapeos bidireccionales actualizados
4. **Validación**: Valida datos antes de sincronizar
5. **Rate Limiting**: Respeta límites de la API externa
6. **Retry Logic**: Implementa reintentos para operaciones críticas

## Ejemplo Completo: Integración con Canvas

Ver `connectors/idukay/` como referencia de una implementación completa.

