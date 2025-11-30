import { IntegrationMapping } from '../entities/integration-mapping.entity';

export interface SISConnector {
  connect(config: any, credentials: any): Promise<boolean>;
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
  [key: string]: any;
}

export interface ConnectorCredentials {
  token?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  [key: string]: any;
}
