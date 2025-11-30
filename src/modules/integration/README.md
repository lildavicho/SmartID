# Integration Module

Pluggable connector architecture for SIS (Student Information System) integrations with support for multiple providers.

## Architecture

The module uses a **pluggable connector pattern** that allows easy addition of new integration providers without modifying core code.

### Components

1. **Base Interface** (`SISConnector`): Defines the contract all connectors must implement
2. **Connector Factory**: Creates appropriate connector instances based on provider
3. **Integration Service**: Manages integration configurations and orchestrates sync operations
4. **Mapping Service**: Maintains bidirectional mappings between internal and external IDs

## Entities

### Integration
- `id` (UUID)
- `institutionId` (UUID, FK)
- `provider` (ENUM: IDUKAY, MOODLE, GENERIC_CSV)
- `config` (JSONB) - Provider-specific configuration
- `credentials` (JSONB) - Encrypted credentials
- `status` (ENUM: ACTIVE, INACTIVE, ERROR)
- `lastSyncAt` (timestamp, nullable)
- `createdAt`, `updatedAt`

### IntegrationMapping
- `id` (UUID)
- `integrationId` (UUID, FK)
- `entityType` (ENUM: COURSE, GROUP, STUDENT, TEACHER)
- `internalId` (UUID) - ID in SmartID system
- `externalId` (string) - ID in external system
- `metadata` (JSONB) - Additional mapping data
- `createdAt`, `updatedAt`

**Unique Indexes:**
- `(integrationId, entityType, internalId)`
- `(integrationId, entityType, externalId)`

## Supported Providers

### IDUKAY
Chilean SIS platform integration.

**Config:**
```json
{
  "apiUrl": "https://api.idukay.cl",
  "timeout": 30000
}
```

**Credentials:**
```json
{
  "apiKey": "your-api-key",
  "institutionCode": "your-code"
}
```

### MOODLE
Moodle LMS integration via Web Services API.

**Config:**
```json
{
  "apiUrl": "https://moodle.institution.edu",
  "wsFunction": "core_webservice_get_site_info"
}
```

**Credentials:**
```json
{
  "wsToken": "your-web-service-token"
}
```

### GENERIC_CSV
File-based integration for CSV imports/exports.

**Config:**
```json
{
  "importPath": "/data/imports",
  "exportPath": "/data/exports",
  "s3Bucket": "institution-data"
}
```

**Credentials:**
```json
{
  "awsAccessKey": "key",
  "awsSecretKey": "secret"
}
```

## API Endpoints

### Create Integration
```http
POST /integrations
```
**Request:**
```json
{
  "institutionId": "uuid",
  "provider": "IDUKAY",
  "config": {
    "apiUrl": "https://api.idukay.cl"
  },
  "credentials": {
    "apiKey": "your-key"
  }
}
```

### Test Connection
```http
POST /integrations/:id/test
```
**Response:**
```json
{
  "success": true,
  "message": "Connection successful"
}
```

### Sync Data
```http
POST /integrations/:id/sync
```
**Request:**
```json
{
  "entityType": "STUDENT"
}
```
**Response:**
```json
{
  "success": true,
  "synced": 150,
  "errors": [],
  "mappings": [...]
}
```

### Send Attendance
```http
POST /integrations/:id/send-attendance
```
**Request:**
```json
{
  "sessionId": "session-uuid"
}
```
**Response:**
```json
{
  "success": true,
  "sent": 25,
  "errors": []
}
```

### Get Mappings
```http
GET /integrations/:id/mappings?entityType=STUDENT
```
**Response:** Array of mapping objects.

### Get Sync Logs
```http
GET /integrations/:id/logs
```
**Response:**
```json
{
  "integrationId": "uuid",
  "provider": "IDUKAY",
  "status": "ACTIVE",
  "lastSyncAt": "2024-01-15T10:30:00Z",
  "mappingsCount": 150
}
```

### List Integrations
```http
GET /integrations?institutionId=uuid
```

### Update Integration
```http
PATCH /integrations/:id
```

### Delete Integration
```http
DELETE /integrations/:id
```

## SISConnector Interface

All connectors must implement this interface:

```typescript
interface SISConnector {
  connect(config: any, credentials: any): Promise<boolean>;
  testConnection(): Promise<boolean>;
  syncStudents(institutionId: string): Promise<SyncResult>;
  syncCourses(institutionId: string): Promise<SyncResult>;
  sendAttendance(sessionId: string): Promise<SendResult>;
  disconnect(): Promise<void>;
}
```

### SyncResult
```typescript
interface SyncResult {
  success: boolean;
  synced: number;
  errors: string[];
  mappings: IntegrationMapping[];
}
```

### SendResult
```typescript
interface SendResult {
  success: boolean;
  sent: number;
  errors: string[];
}
```

## Adding a New Connector

### Step 1: Create Connector Class

Create a new file in `connectors/`:

```typescript
// connectors/new-provider.connector.ts
import { SISConnector, SyncResult, SendResult } from '../interfaces/sis-connector.interface';

export class NewProviderConnector implements SISConnector {
  private config: any;
  private credentials: any;
  private connected: boolean = false;

  async connect(config: any, credentials: any): Promise<boolean> {
    this.config = config;
    this.credentials = credentials;
    
    // Implement connection logic
    
    this.connected = true;
    return true;
  }

  async testConnection(): Promise<boolean> {
    // Test the connection
    return true;
  }

  async syncStudents(institutionId: string): Promise<SyncResult> {
    // Implement student sync
    return {
      success: true,
      synced: 0,
      errors: [],
      mappings: [],
    };
  }

  async syncCourses(institutionId: string): Promise<SyncResult> {
    // Implement course sync
    return {
      success: true,
      synced: 0,
      errors: [],
      mappings: [],
    };
  }

  async sendAttendance(sessionId: string): Promise<SendResult> {
    // Implement attendance sending
    return {
      success: true,
      sent: 0,
      errors: [],
    };
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }
}
```

### Step 2: Add to Enum

Update `enums/integration-provider.enum.ts`:

```typescript
export enum IntegrationProvider {
  IDUKAY = 'IDUKAY',
  MOODLE = 'MOODLE',
  GENERIC_CSV = 'GENERIC_CSV',
  NEW_PROVIDER = 'NEW_PROVIDER', // Add here
}
```

### Step 3: Register in Factory

Update `services/connector-factory.service.ts`:

```typescript
import { NewProviderConnector } from '../connectors/new-provider.connector';

private connectors: Map<IntegrationProvider, new () => SISConnector> = new Map([
  [IntegrationProvider.IDUKAY, IdukayConnector],
  [IntegrationProvider.MOODLE, MoodleConnector],
  [IntegrationProvider.GENERIC_CSV, GenericCsvConnector],
  [IntegrationProvider.NEW_PROVIDER, NewProviderConnector], // Add here
]);
```

That's it! The new connector is now available.

## Usage Example

### 1. Create Integration

```typescript
const integration = await integrationService.createIntegration({
  institutionId: 'institution-uuid',
  provider: IntegrationProvider.IDUKAY,
  config: { apiUrl: 'https://api.idukay.cl' },
  credentials: { apiKey: 'secret-key' },
});
```

### 2. Test Connection

```typescript
const result = await integrationService.testConnection(integration.id);
// { success: true, message: 'Connection successful' }
```

### 3. Sync Students

```typescript
const syncResult = await integrationService.syncData(
  integration.id,
  MappingEntityType.STUDENT,
);
// { success: true, synced: 150, errors: [], mappings: [...] }
```

### 4. Get Mapping

```typescript
const mapping = await mappingService.getMapping(
  integration.id,
  MappingEntityType.STUDENT,
  'internal-student-uuid',
);
// { externalId: 'external-123', ... }
```

### 5. Send Attendance

```typescript
const sendResult = await integrationService.sendAttendance(
  integration.id,
  'session-uuid',
);
// { success: true, sent: 25, errors: [] }
```

## Security Considerations

### Credentials Encryption

**Important:** In production, credentials should be encrypted before storing in the database.

Recommended approach:
1. Use a library like `crypto` or `bcrypt`
2. Encrypt credentials in `createIntegration` before saving
3. Decrypt credentials when passing to connectors

Example:
```typescript
import { createCipheriv, createDecipheriv } from 'crypto';

// Encrypt before saving
const encryptedCredentials = encrypt(credentials, encryptionKey);

// Decrypt before using
const decryptedCredentials = decrypt(integration.credentials, encryptionKey);
```

### API Key Management

- Store encryption keys in environment variables
- Use different keys per environment
- Rotate keys periodically
- Never commit credentials to version control

## Error Handling

All connectors should:
- Throw descriptive errors
- Return errors in the `errors` array of results
- Set integration status to ERROR on failure
- Log errors for debugging

## Testing

Create tests for each connector:

```typescript
describe('IdukayConnector', () => {
  it('should connect successfully', async () => {
    const connector = new IdukayConnector();
    const result = await connector.connect(config, credentials);
    expect(result).toBe(true);
  });

  it('should sync students', async () => {
    const result = await connector.syncStudents('institution-id');
    expect(result.success).toBe(true);
  });
});
```

## Future Enhancements

- **Webhook Support**: Receive real-time updates from external systems
- **Batch Operations**: Optimize large syncs with batching
- **Conflict Resolution**: Handle conflicts when data exists in both systems
- **Audit Logs**: Track all sync operations and changes
- **Scheduled Syncs**: Automatic periodic synchronization
- **Data Validation**: Validate data before syncing
- **Rollback Support**: Undo failed syncs
