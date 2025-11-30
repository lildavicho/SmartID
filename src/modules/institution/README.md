# Institution Module

Módulo completo para la gestión de instituciones educativas y sus campus en SmartPresence AI.

## 📁 Estructura

```
institution/
├── dto/
│   ├── create-institution.dto.ts    # DTO para crear institución
│   ├── update-institution.dto.ts    # DTO para actualizar institución
│   ├── create-campus.dto.ts         # DTO para crear campus
│   ├── update-campus.dto.ts         # DTO para actualizar campus
│   ├── query-institution.dto.ts     # DTO para filtros y paginación
│   └── index.ts                     # Exportaciones
├── entities/
│   ├── institution.entity.ts        # Entidad Institution
│   ├── campus.entity.ts             # Entidad Campus
│   └── index.ts                     # Exportaciones
├── institution.controller.ts        # Controlador REST
├── institution.service.ts           # Lógica de negocio
├── institution.service.spec.ts      # Tests unitarios
├── institution.module.ts            # Módulo NestJS
└── README.md                        # Este archivo
```

## 🗄️ Entidades

### Institution

Representa una institución educativa.

**Campos:**
- `id` (UUID) - Identificador único
- `name` (string) - Nombre de la institución
- `code` (string, único) - Código único (formato: INST001)
- `country` (string) - País
- `timezone` (string) - Zona horaria (default: UTC)
- `config` (JSONB) - Configuración adicional
- `isActive` (boolean) - Estado activo/inactivo
- `campuses` (Campus[]) - Relación uno-a-muchos con Campus
- `createdAt` (Date) - Fecha de creación
- `updatedAt` (Date) - Fecha de actualización

### Campus

Representa un campus de una institución.

**Campos:**
- `id` (UUID) - Identificador único
- `institutionId` (UUID) - ID de la institución (FK)
- `name` (string) - Nombre del campus
- `address` (string) - Dirección
- `city` (string) - Ciudad
- `isActive` (boolean) - Estado activo/inactivo
- `institution` (Institution) - Relación muchos-a-uno con Institution
- `createdAt` (Date) - Fecha de creación
- `updatedAt` (Date) - Fecha de actualización

## 📝 DTOs

### CreateInstitutionDto

Validaciones:
- `name`: @IsString(), @IsNotEmpty(), @MaxLength(255)
- `code`: @IsString(), @IsNotEmpty(), @Matches(/^INST[0-9]{3,}$/)
- `country`: @IsString(), @IsNotEmpty(), @MaxLength(100)
- `timezone`: @IsString(), @IsOptional(), @MaxLength(100)
- `config`: @IsObject(), @IsOptional()
- `isActive`: @IsBoolean(), @IsOptional()

### QueryInstitutionDto

Parámetros de filtrado y paginación:
- `page` (number, default: 1) - Número de página
- `limit` (number, default: 10, max: 100) - Items por página
- `search` (string, opcional) - Búsqueda por nombre o código
- `country` (string, opcional) - Filtrar por país
- `isActive` (boolean, opcional) - Filtrar por estado

## 🔧 Servicio

### Métodos Principales

#### `create(createInstitutionDto: CreateInstitutionDto): Promise<Institution>`
Crea una nueva institución.
- ✅ Valida que el código sea único
- ❌ Lanza `ConflictException` si el código ya existe

#### `findAll(query: QueryInstitutionDto): Promise<PaginatedResult<Institution>>`
Lista instituciones con paginación y filtros.
- Soporta búsqueda por nombre o código (case-insensitive)
- Filtrado por país
- Filtrado por estado activo/inactivo
- Paginación con skip/take

#### `findOne(id: string, includeCampuses?: boolean): Promise<Institution>`
Busca una institución por ID.
- Opcionalmente incluye los campus asociados
- ❌ Lanza `NotFoundException` si no existe

#### `update(id: string, updateInstitutionDto: UpdateInstitutionDto): Promise<Institution>`
Actualiza una institución.
- ✅ Valida código único si se está cambiando
- ❌ Lanza `NotFoundException` si no existe
- ❌ Lanza `ConflictException` si el nuevo código ya existe

#### `remove(id: string): Promise<void>`
Elimina una institución.
- ✅ Valida que no tenga campus asociados
- ❌ Lanza `NotFoundException` si no existe
- ❌ Lanza `BadRequestException` si tiene campus asociados

#### `getCampuses(institutionId: string): Promise<Campus[]>`
Obtiene todos los campus de una institución.
- ❌ Lanza `NotFoundException` si la institución no existe

## 🌐 Endpoints REST

Todos los endpoints están documentados con Swagger.

### POST /institutions
Crear nueva institución.

**Request Body:**
```json
{
  "name": "Universidad Nacional",
  "code": "INST001",
  "country": "Colombia",
  "timezone": "America/Bogota",
  "config": {
    "academicYear": 2024,
    "maxStudents": 5000
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Universidad Nacional",
  "code": "INST001",
  "country": "Colombia",
  "timezone": "America/Bogota",
  "config": {
    "academicYear": 2024,
    "maxStudents": 5000
  },
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /institutions
Listar instituciones con paginación.

**Query Parameters:**
- `page` (opcional, default: 1)
- `limit` (opcional, default: 10)
- `search` (opcional)
- `country` (opcional)
- `isActive` (opcional)

**Response:** `200 OK`
```json
{
  "data": [...],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

### GET /institutions/:id
Obtener institución por ID.

**Response:** `200 OK`

### GET /institutions/:id/campuses
Obtener campus de una institución.

**Response:** `200 OK`
```json
[
  {
    "id": "...",
    "institutionId": "...",
    "name": "Campus Central",
    "address": "Av. Principal 123",
    "city": "Bogotá",
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

### PATCH /institutions/:id
Actualizar institución.

**Request Body:** (todos los campos opcionales)
```json
{
  "name": "Universidad Nacional Actualizada",
  "timezone": "America/Lima"
}
```

**Response:** `200 OK`

### DELETE /institutions/:id
Eliminar institución.

**Response:** `204 No Content`

## 🧪 Tests

### Ejecutar Tests

```bash
# Tests unitarios del servicio
npm run test -- institution.service.spec

# Tests con coverage
npm run test:cov -- institution.service.spec

# Tests en modo watch
npm run test:watch -- institution.service.spec
```

### Cobertura

Los tests cubren:
- ✅ Creación de instituciones
- ✅ Validación de código único
- ✅ Paginación y filtros
- ✅ Búsqueda por ID
- ✅ Actualización
- ✅ Eliminación con validación de campus
- ✅ Obtención de campus
- ✅ Manejo de errores (NotFoundException, ConflictException, BadRequestException)

## 🔒 Validaciones de Negocio

### Código Único
El código de institución debe ser único en el sistema.
- Formato: `INST001`, `INST002`, etc.
- Validado en creación y actualización

### Eliminación Protegida
No se puede eliminar una institución que tenga campus asociados.
- Primero se deben eliminar todos los campus
- Retorna error 400 con mensaje descriptivo

### Paginación
- Límite máximo: 100 items por página
- Página mínima: 1
- Límite mínimo: 1

## 📚 Uso en Otros Módulos

```typescript
import { InstitutionModule } from './modules/institution/institution.module';
import { InstitutionService } from './modules/institution/institution.service';

@Module({
  imports: [InstitutionModule],
})
export class OtroModule {
  constructor(private institutionService: InstitutionService) {}
  
  async ejemplo() {
    const institutions = await this.institutionService.findAll({ page: 1, limit: 10 });
  }
}
```

## 🔄 Relaciones

### Institution → Campus (Uno a Muchos)
```typescript
// Obtener institución con sus campus
const institution = await institutionService.findOne(id, true);
console.log(institution.campuses); // Campus[]

// Obtener solo los campus
const campuses = await institutionService.getCampuses(id);
```

## 🚀 Próximas Mejoras

- [ ] Agregar soft delete para instituciones
- [ ] Implementar caché para consultas frecuentes
- [ ] Agregar endpoints para gestión de campus
- [ ] Implementar búsqueda full-text
- [ ] Agregar validación de timezone válido
- [ ] Implementar exportación de datos (CSV, Excel)

## 📖 Documentación Swagger

Una vez iniciada la aplicación, la documentación Swagger está disponible en:
```
http://localhost:3000/api/v1/docs
```

Buscar la sección **"Institutions"** para ver todos los endpoints documentados.

---

**Última actualización:** Noviembre 2024
