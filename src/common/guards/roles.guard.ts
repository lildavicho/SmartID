import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../modules/user/enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      this.logger.warn('RolesGuard: No user found in request');
      return false;
    }

    // Log para depuración (usando log en lugar de debug para que siempre se muestre)
    this.logger.log(
      `[RolesGuard] Usuario ID=${user.userId || 'N/A'}, Email=${user.email || 'N/A'}, Rol="${user.role || 'N/A'}"`,
    );
    this.logger.log(`[RolesGuard] Roles requeridos=${JSON.stringify(requiredRoles)}`);

    // Normaliza roles para comparación (maneja "superadmin" -> "SUPER_ADMIN", etc.)
    const normalizeRole = (role: string): string => {
      if (!role) return '';
      // Convierte a mayúsculas y reemplaza guiones por guiones bajos
      let normalized = role.toUpperCase().replace(/-/g, '_');
      // Maneja casos especiales de mapeo
      // "SUPERADMIN" -> "SUPER_ADMIN"
      if (normalized === 'SUPERADMIN') {
        normalized = 'SUPER_ADMIN';
      }
      return normalized;
    };

    const userRoleNormalized = normalizeRole(user.role || '');
    this.logger.log(`[RolesGuard] Rol usuario normalizado="${userRoleNormalized}"`);

    const hasAccess = requiredRoles.some((role) => {
      const requiredRoleNormalized = normalizeRole(role);
      const matches = userRoleNormalized === requiredRoleNormalized;
      this.logger.log(
        `[RolesGuard] Comparando "${userRoleNormalized}" con "${requiredRoleNormalized}" -> ${matches ? '✓ COINCIDE' : '✗ NO COINCIDE'}`,
      );
      return matches;
    });

    if (!hasAccess) {
      this.logger.warn(
        `[RolesGuard] ❌ Acceso DENEGADO. Usuario rol="${user.role}" (normalizado="${userRoleNormalized}") no coincide con roles requeridos=${JSON.stringify(requiredRoles)}`,
      );
    } else {
      this.logger.log(`[RolesGuard] ✅ Acceso PERMITIDO`);
    }

    return hasAccess;
  }
}
