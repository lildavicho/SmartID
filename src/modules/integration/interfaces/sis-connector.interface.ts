import { IntegrationMapping } from '../entities/integration-mapping.entity';

export interface SISConnector {
  connect(config: ConnectorConfig, credentials: ConnectorCredentials): Promise<boolean>;
  testConnection(): Promise<boolean>;
  syncStudents(institutionId: string): Promise<SyncResult>;
  syncCourses(institutionId: string): Promise<SyncResult>;
  sendAttendance(sessionId: string): Promise<SendResult>;
  disconnect(): Promise<void>;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  errors: string[];
  mappings: IntegrationMapping[];
}

export interface SendResult {
  success: boolean;
  sent: number;
  errors: string[];
}

export interface ConnectorConfig {
  apiUrl?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  timeout?: number;
  institutionCode?: string;
  importPath?: string;
  s3Bucket?: string;
  [key: string]: unknown;
}

export interface ConnectorCredentials {
  token?: string;
  apiKey?: string;
  secret?: string;
  username?: string;
  password?: string;
  wsToken?: string;
  [key: string]: unknown;
}
