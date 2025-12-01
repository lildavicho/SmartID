import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Guard para proteger el webhook de YOLO
 * Valida el header x-yolo-secret contra YOLO_WEBHOOK_SECRET
 */
@Injectable()
export class YoloWebhookGuard implements CanActivate {
  private readonly logger = new Logger(YoloWebhookGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const secret = request.headers['x-yolo-secret'];

    const expectedSecret = this.configService.get<string>('YOLO_WEBHOOK_SECRET');

    if (!expectedSecret) {
      this.logger.warn('YOLO_WEBHOOK_SECRET no configurado. Permitir acceso sin validación en desarrollo.');
      // En desarrollo, si no hay secret configurado, permitir acceso
      return true;
    }

    if (!secret || secret !== expectedSecret) {
      this.logger.warn(`Intento de acceso al webhook YOLO con secret inválido. IP: ${request.ip}`);
      throw new UnauthorizedException('Invalid YOLO webhook secret');
    }

    return true;
  }
}

