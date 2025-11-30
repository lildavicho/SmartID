/**
 * DTO representing a course from Idukay API
 */
export interface IdukayCourseDto {
  id: string; // External ID from Idukay
  nombre: string;
  codigo: string;
  nivel: string; // Grade level
  descripcion?: string;
  ano_academico: string;
  estado: 'ACTIVO' | 'INACTIVO';
  metadata?: {
    profesor_jefe?: string;
    sala?: string;
    [key: string]: any;
  };
}

/**
 * Response from Idukay courses endpoint
 */
export interface IdukayCoursesResponse {
  success: boolean;
  data: IdukayCourseDto[];
  total: number;
  page: number;
  per_page: number;
}
