/**
 * Configuration for Idukay connector
 */
export interface IdukayConfig {
  apiUrl: string;
  institutionCode: string;
  timeout?: number; // Request timeout in milliseconds (default: 30000)
  retryAttempts?: number; // Number of retry attempts (default: 3)
  retryDelay?: number; // Initial retry delay in milliseconds (default: 1000)
}

/**
 * Credentials for Idukay connector
 */
export interface IdukayCredentials {
  apiKey: string;
  secret: string;
}

/**
 * Idukay API error response
 */
export interface IdukayErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
