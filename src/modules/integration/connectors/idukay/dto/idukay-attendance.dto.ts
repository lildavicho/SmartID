/**
 * DTO for sending attendance to Idukay API
 */
export interface IdukayAttendanceDto {
  estudiante_id: string; // External student ID
  curso_id: string; // External course ID
  fecha: string; // ISO date string
  hora_inicio: string; // ISO datetime string
  hora_fin: string; // ISO datetime string
  estado: 'PRESENTE' | 'AUSENTE' | 'ATRASADO' | 'JUSTIFICADO';
  porcentaje_permanencia?: number;
  observaciones?: string;
  metadata?: {
    sesion_id?: string;
    profesor_id?: string;
    [key: string]: any;
  };
}

/**
 * Request body for sending attendance to Idukay
 */
export interface IdukayAttendanceRequest {
  institucion_codigo: string;
  asistencias: IdukayAttendanceDto[];
}

/**
 * Response from Idukay attendance endpoint
 */
export interface IdukayAttendanceResponse {
  success: boolean;
  procesadas: number;
  errores: Array<{
    estudiante_id: string;
    error: string;
  }>;
  mensaje?: string;
}
