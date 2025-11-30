import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../modules/user/enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
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
      return false;
    }

    // Normaliza roles para comparación (maneja diferencias entre "superadmin" y "SUPER_ADMIN")
    const normalizeRole = (role: string): string => {
      return role.toUpperCase().replace(/-/g, '_');
    };

    const userRoleNormalized = normalizeRole(user.role || '');
    
    return requiredRoles.some((role) => {
      const requiredRoleNormalized = normalizeRole(role);
      return userRoleNormalized === requiredRoleNormalized;
    });
  }
}
