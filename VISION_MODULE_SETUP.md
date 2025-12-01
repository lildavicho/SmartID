# Vision Module - Configuración

## Variables de Entorno

Agregar al archivo `.env` o `.env.development`:

```env
# YOLO Service Configuration
YOLO_BASE_URL=http://localhost:8000
YOLO_WEBHOOK_SECRET=your-secret-webhook-key-change-in-production
```

### Descripción

- **YOLO_BASE_URL**: URL base del microservicio YOLO (ej: `http://localhost:8000` o `https://yolo-service.example.com`)
- **YOLO_WEBHOOK_SECRET**: Secret compartido para autenticar webhooks del servicio YOLO. Debe coincidir con el secret configurado en el servicio YOLO.

## Endpoints

### GET /api/v1/vision/health
- **Público**: Sí
- **Descripción**: Verifica el estado del servicio YOLO
- **Respuesta**: `{ status: "ok", model: "yolov8n", device: "cuda:0" }`

### POST /api/v1/vision/snapshots
- **Público**: No (requiere `x-yolo-secret` header)
- **Descripción**: Recibe snapshots de detección del servicio YOLO
- **Header**: `x-yolo-secret: <YOLO_WEBHOOK_SECRET>`
- **Body**: Ver `VisionSnapshotDto`

### GET /api/v1/vision/sessions/:sessionId/summary
- **Público**: No (requiere JWT)
- **Descripción**: Obtiene resumen de asistencia de una sesión
- **Respuesta**: Ver `VisionSessionSummaryDto`

## Integración con Cierre de Sesión

Al cerrar una sesión (`POST /sessions/:id/close`), el sistema automáticamente:

1. Calcula asistencia desde snapshots
2. Marca como `ABSENT` a estudiantes sin registro de asistencia
3. Finaliza la sesión con status `FINISHED`

