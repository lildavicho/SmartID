/**
 * DTO representing a student from Idukay API
 */
export interface IdukayStudentDto {
  id: string; // External ID from Idukay
  rut: string;
  nombres: string;
  apellidos: string;
  email: string;
  codigo_estudiante: string;
  fecha_matricula: string; // ISO date string
  curso_id?: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'RETIRADO';
  metadata?: {
    telefono?: string;
    direccion?: string;
    apoderado?: string;
    [key: string]: any;
  };
}

/**
 * Response from Idukay students endpoint
 */
export interface IdukayStudentsResponse {
  success: boolean;
  data: IdukayStudentDto[];
  total: number;
  page: number;
  per_page: number;
}
