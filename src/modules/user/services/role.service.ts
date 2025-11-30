import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException(`Role with name '${createRoleDto.name}' already exists`);
    }

    const role = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' not found`);
    }

    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { name },
    });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name },
      });

      if (existingRole) {
        throw new ConflictException(`Role with name '${updateRoleDto.name}' already exists`);
      }
    }

    Object.assign(role, updateRoleDto);
    return this.roleRepository.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    await this.roleRepository.remove(role);
  }

  async getDefaultRoles(): Promise<Role[]> {
    const defaultRoleNames = ['superadmin', 'admin', 'employee'];
    const roles: Role[] = [];

    for (const name of defaultRoleNames) {
      let role = await this.findByName(name);
      
      if (!role) {
        role = await this.create({
          name,
          description: `Default ${name} role`,
          permissions: this.getDefaultPermissions(name),
          isActive: true,
        });
      }
      
      roles.push(role);
    }

    return roles;
  }

  private getDefaultPermissions(roleName: string): Record<string, boolean | string[]> {
    const permissionsMap: Record<string, Record<string, boolean | string[]>> = {
      superadmin: {
        canManageUsers: true,
        canManageRoles: true,
        canManageDevices: true,
        canManageInstitutions: true,
        canViewReports: true,
        canExportData: true,
        canManageIntegrations: true,
        canViewAuditLogs: true,
        allowedModules: ['*'],
      },
      admin: {
        canManageUsers: true,
        canManageDevices: true,
        canViewReports: true,
        canExportData: true,
        allowedModules: ['users', 'devices', 'reports', 'sessions'],
      },
      employee: {
        canViewReports: true,
        allowedModules: ['reports', 'sessions'],
      },
    };

    return permissionsMap[roleName] || {};
  }
}

