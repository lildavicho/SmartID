/**
 * Fuente de registro de asistencia
 * - NFC: Registro mediante tarjeta NFC
 * - CAMERA_YOLO: Detección automática mediante cámara y modelo YOLO/RKNN
 * - MANUAL: Registro manual por el profesor
 */
export enum AttendanceSource {
  NFC = 'NFC',
  CAMERA_YOLO = 'CAMERA_YOLO',
  MANUAL = 'MANUAL',
}

