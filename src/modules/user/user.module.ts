import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './controllers/user.controller';
import { RoleController } from './controllers/role.controller';
import { NfcTagController } from './controllers/nfc-tag.controller';
import { AuditLogController } from './controllers/audit-log.controller';
import { UserService } from './services/user.service';
import { RoleService } from './services/role.service';
import { NfcTagService } from './services/nfc-tag.service';
import { AuditLogService } from './services/audit-log.service';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { NfcTag } from './entities/nfc-tag.entity';
import { AuditLog } from './entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, NfcTag, AuditLog]),
  ],
  controllers: [
    UserController,
    RoleController,
    NfcTagController,
    AuditLogController,
  ],
  providers: [
    UserService,
    RoleService,
    NfcTagService,
    AuditLogService,
  ],
  exports: [
    UserService,
    RoleService,
    NfcTagService,
    AuditLogService,
  ],
})
export class UserModule {}
