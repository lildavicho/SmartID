import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';
import { SISConnector, SyncResult, SendResult } from '../../interfaces/sis-connector.interface';
import { MappingService } from '../../services/mapping.service';
import { IdukayConfig, IdukayCredentials } from './types';
import {
  IdukayStudentDto,
  IdukayStudentsResponse,
  IdukayCourseDto,
  IdukayCoursesResponse,
  IdukayAttendanceDto,
  IdukayAttendanceRequest,
  IdukayAttendanceResponse,
} from './dto';

/**
 * Idukay SIS Connector
 *
 * Implements integration with Idukay student information system.
 * Handles authentication, data synchronization, and attendance reporting.
 */
@Injectable()
export class IdukayConnector implements SISConnector {
  private readonly logger = new Logger(IdukayConnector.name);
  private config: IdukayConfig;
  private credentials: IdukayCredentials;
  private connected: boolean = false;
  private integrationId: string;

  // Default configuration
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly DEFAULT_RETRY_ATTEMPTS = 3;
  private readonly DEFAULT_RETRY_DELAY = 1000; // 1 second

  constructor(
    private readonly httpService: HttpService,
    private readonly mappingService: MappingService,
  ) {}

  /**
   * Connect to Idukay API
   */
  async connect(config: any, credentials: any): Promise<boolean> {
    this.logger.log('Connecting to Idukay API...');

    // Validate configuration
    if (!config.apiUrl || !config.institutionCode) {
      throw new BadRequestException('Missing required config: apiUrl and institutionCode');
    }

    if (!credentials.apiKey || !credentials.secret) {
      throw new BadRequestException('Missing required credentials: apiKey and secret');
    }

    this.config = {
      apiUrl: config.apiUrl,
      institutionCode: config.institutionCode,
      timeout: config.timeout || this.DEFAULT_TIMEOUT,
      retryAttempts: config.retryAttempts || this.DEFAULT_RETRY_ATTEMPTS,
      retryDelay: config.retryDelay || this.DEFAULT_RETRY_DELAY,
    };

    this.credentials = {
      apiKey: credentials.apiKey,
      secret: credentials.secret,
    };

    // Test authentication
    try {
      const response = await this.makeRequest<{ success: boolean; message: string }>(
        'GET',
        '/auth/validate',
      );

      if (response.success) {
        this.connected = true;
        this.logger.log('Successfully connected to Idukay API');
        return true;
      } else {
        this.logger.error('Failed to authenticate with Idukay API');
        return false;
      }
    } catch (error) {
      this.logger.error('Connection failed:', error.message);
      throw new BadRequestException(`Failed to connect to Idukay: ${error.message}`);
    }
  }

  /**
   * Test connection to Idukay API
   */
  async testConnection(): Promise<boolean> {
    if (!this.connected) {
      throw new Error('Not connected. Call connect() first.');
    }

    this.logger.log('Testing Idukay API connection...');

    try {
      const response = await this.makeRequest<{ success: boolean }>('GET', '/health');

      return response.success;
    } catch (error) {
      this.logger.error('Connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Sync students from Idukay
   */
  async syncStudents(institutionId: string): Promise<SyncResult> {
    if (!this.connected) {
      throw new Error('Not connected. Call connect() first.');
    }

    this.logger.log(`Syncing students from Idukay for institution ${institutionId}`);
    this.integrationId = institutionId;

    const errors: string[] = [];
    let synced = 0;

    try {
      // Fetch students from Idukay API (with pagination)
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await this.makeRequest<IdukayStudentsResponse>(
          'GET',
          `/instituciones/${this.config.institutionCode}/estudiantes`,
          { page, per_page: 100 },
        );

        if (!response.success || !response.data) {
          throw new Error('Invalid response from Idukay API');
        }

        // Process each student
        for (const idukayStudent of response.data) {
          try {
            await this.processStudent(idukayStudent);
            synced++;
          } catch (error) {
            const errorMsg = `Failed to sync student ${idukayStudent.codigo_estudiante}: ${error.message}`;
            this.logger.error(errorMsg);
            errors.push(errorMsg);
          }
        }

        // Check if there are more pages
        hasMore = response.data.length === response.per_page;
        page++;
      }

      this.logger.log(`Successfully synced ${synced} students from Idukay`);

      return {
        success: errors.length === 0,
        synced,
        errors,
        mappings: [], // Mappings are created in processStudent
      };
    } catch (error) {
      this.logger.error('Student sync failed:', error.message);
      return {
        success: false,
        synced,
        errors: [...errors, error.message],
        mappings: [],
      };
    }
  }

  /**
   * Sync courses from Idukay
   */
  async syncCourses(institutionId: string): Promise<SyncResult> {
    if (!this.connected) {
      throw new Error('Not connected. Call connect() first.');
    }

    this.logger.log(`Syncing courses from Idukay for institution ${institutionId}`);
    this.integrationId = institutionId;

    const errors: string[] = [];
    let synced = 0;

    try {
      // Fetch courses from Idukay API (with pagination)
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await this.makeRequest<IdukayCoursesResponse>(
          'GET',
          `/instituciones/${this.config.institutionCode}/cursos`,
          { page, per_page: 100 },
        );

        if (!response.success || !response.data) {
          throw new Error('Invalid response from Idukay API');
        }

        // Process each course
        for (const idukayCourse of response.data) {
          try {
            await this.processCourse(idukayCourse);
            synced++;
          } catch (error) {
            const errorMsg = `Failed to sync course ${idukayCourse.codigo}: ${error.message}`;
            this.logger.error(errorMsg);
            errors.push(errorMsg);
          }
        }

        // Check if there are more pages
        hasMore = response.data.length === response.per_page;
        page++;
      }

      this.logger.log(`Successfully synced ${synced} courses from Idukay`);

      return {
        success: errors.length === 0,
        synced,
        errors,
        mappings: [],
      };
    } catch (error) {
      this.logger.error('Course sync failed:', error.message);
      return {
        success: false,
        synced,
        errors: [...errors, error.message],
        mappings: [],
      };
    }
  }

  /**
   * Send attendance to Idukay
   */
  async sendAttendance(sessionId: string): Promise<SendResult> {
    if (!this.connected) {
      throw new Error('Not connected. Call connect() first.');
    }

    this.logger.log(`Sending attendance to Idukay for session ${sessionId}`);

    const errors: string[] = [];
    let sent = 0;

    try {
      // TODO: Fetch session and attendance records from database
      // This would require injecting SessionService and AttendanceService
      // For now, this is a placeholder showing the structure

      const attendanceRecords: IdukayAttendanceDto[] = [];

      // Example of how to build attendance records:
      // 1. Get session details
      // 2. Get all attendance records for the session
      // 3. For each record, get the student mapping
      // 4. Transform to Idukay format

      /*
      const session = await this.sessionService.findOne(sessionId);
      const records = await this.attendanceService.getAttendanceBySession(sessionId);

      for (const record of records) {
        // Get mapping for student
        const mapping = await this.mappingService.getMapping(
          this.integrationId,
          MappingEntityType.STUDENT,
          record.studentId,
        );

        if (!mapping) {
          errors.push(`No mapping found for student ${record.studentId}`);
          continue;
        }

        // Get course mapping
        const courseMapping = await this.mappingService.getMapping(
          this.integrationId,
          MappingEntityType.COURSE,
          session.groupId,
        );

        // Transform to Idukay format
        const idukayAttendance: IdukayAttendanceDto = {
          estudiante_id: mapping.externalId,
          curso_id: courseMapping?.externalId || '',
          fecha: session.scheduledStart.toISOString().split('T')[0],
          hora_inicio: session.scheduledStart.toISOString(),
          hora_fin: session.scheduledEnd.toISOString(),
          estado: this.mapAttendanceStatus(record.status),
          porcentaje_permanencia: record.permanencePercentage,
          metadata: {
            sesion_id: sessionId,
            origen: record.origin,
          },
        };

        attendanceRecords.push(idukayAttendance);
      }
      */

      // Send to Idukay API
      if (attendanceRecords.length > 0) {
        const request: IdukayAttendanceRequest = {
          institucion_codigo: this.config.institutionCode,
          asistencias: attendanceRecords,
        };

        const response = await this.makeRequest<IdukayAttendanceResponse>(
          'POST',
          '/asistencias',
          request,
        );

        if (response.success) {
          sent = response.procesadas;

          // Log errors from Idukay
          if (response.errores && response.errores.length > 0) {
            response.errores.forEach((err) => {
              errors.push(`Student ${err.estudiante_id}: ${err.error}`);
            });
          }
        }
      }

      this.logger.log(`Successfully sent ${sent} attendance records to Idukay`);

      return {
        success: errors.length === 0,
        sent,
        errors,
      };
    } catch (error) {
      this.logger.error('Send attendance failed:', error.message);
      return {
        success: false,
        sent,
        errors: [...errors, error.message],
      };
    }
  }

  /**
   * Disconnect from Idukay API
   */
  async disconnect(): Promise<void> {
    this.logger.log('Disconnecting from Idukay API');
    this.connected = false;
    this.config = null;
    this.credentials = null;
  }

  /**
   * Process a single student from Idukay
   */
  private async processStudent(idukayStudent: IdukayStudentDto): Promise<void> {
    // TODO: This would require injecting StudentService
    // For now, this is a placeholder showing the transformation logic

    /*
    // Transform Idukay student to our Student entity
    const studentData = {
      institutionId,
      firstName: idukayStudent.nombres,
      lastName: idukayStudent.apellidos,
      email: idukayStudent.email,
      studentCode: idukayStudent.codigo_estudiante,
      enrollmentDate: new Date(idukayStudent.fecha_matricula),
      external_id: idukayStudent.id,
    };

    // Check if student already exists by external_id mapping
    const existingMapping = await this.mappingService.findByExternalId(
      this.integrationId,
      MappingEntityType.STUDENT,
      idukayStudent.id,
    );

    let student;
    if (existingMapping) {
      // Update existing student
      student = await this.studentService.update(existingMapping.internalId, studentData);
    } else {
      // Create new student
      student = await this.studentService.create(studentData);
      
      // Create mapping
      await this.mappingService.createMapping(
        this.integrationId,
        MappingEntityType.STUDENT,
        student.id,
        idukayStudent.id,
        { rut: idukayStudent.rut },
      );
    }
    */

    this.logger.debug(`Processed student: ${idukayStudent.codigo_estudiante}`);
  }

  /**
   * Process a single course from Idukay
   */
  private async processCourse(idukayCourse: IdukayCourseDto): Promise<void> {
    // TODO: This would require injecting CourseService
    // Similar to processStudent but for courses

    this.logger.debug(`Processed course: ${idukayCourse.codigo}`);
  }

  /**
   * Map internal attendance status to Idukay format
   */
  private mapAttendanceStatus(status: string): 'PRESENTE' | 'AUSENTE' | 'ATRASADO' | 'JUSTIFICADO' {
    const statusMap: Record<string, 'PRESENTE' | 'AUSENTE' | 'ATRASADO' | 'JUSTIFICADO'> = {
      PRESENT: 'PRESENTE',
      ABSENT: 'AUSENTE',
      LATE: 'ATRASADO',
      EXCUSED: 'JUSTIFICADO',
    };

    return statusMap[status] || 'AUSENTE';
  }

  /**
   * Make HTTP request to Idukay API with retry logic
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
  ): Promise<T> {
    const url = `${this.config.apiUrl}${endpoint}`;

    const config: AxiosRequestConfig = {
      method,
      url,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.credentials.apiKey,
        'X-API-Secret': this.credentials.secret,
      },
    };

    if (method === 'GET' && data) {
      config.params = data;
    } else if (data) {
      config.data = data;
    }

    const maxAttempts = this.config?.retryAttempts ?? this.DEFAULT_RETRY_ATTEMPTS;
    const baseDelay = this.config?.retryDelay ?? this.DEFAULT_RETRY_DELAY;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await firstValueFrom(this.httpService.request<T>(config));
        return response.data as T;
      } catch (error) {
        if (attempt === maxAttempts) {
          this.handleRequestError(error);
        }

        const delay = Math.pow(2, attempt) * baseDelay;
        this.logger.warn(
          `Request failed (attempt ${attempt}/${maxAttempts}). Retrying in ${delay}ms...`,
        );
        await this.sleep(delay);
      }
    }

    throw new Error('Max retry attempts reached');
  }

  /**
   * Handle HTTP request errors
   */
  private handleRequestError(error: any): never {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      this.logger.error(`Idukay API error (${status}):`, data);

      if (status === 401) {
        throw new Error('Authentication failed. Check API credentials.');
      } else if (status === 403) {
        throw new Error('Access forbidden. Check API permissions.');
      } else if (status === 404) {
        throw new Error('Resource not found.');
      } else if (status >= 500) {
        throw new Error('Idukay server error. Please try again later.');
      } else {
        throw new Error(data?.error?.message || 'Request failed');
      }
    } else if (error.request) {
      // Request made but no response received
      this.logger.error('No response from Idukay API:', error.message);
      throw new Error('No response from Idukay API. Check network connection.');
    } else {
      // Error setting up request
      this.logger.error('Request setup error:', error.message);
      throw new Error(`Request error: ${error.message}`);
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
