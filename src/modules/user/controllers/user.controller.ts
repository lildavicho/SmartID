import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ValidationPipe,
  Delete,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../enums/user-role.enum';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findAll() {
    const users = await this.userService.findAll();

    // Remove password from response
    return users.map((user) => {
      const userWithoutPassword = { ...user };
      delete userWithoutPassword.password;
      return userWithoutPassword;
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(id);
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    return userWithoutPassword;
  }

  @Patch(':id/password')
  async changePassword(
    @Param('id') id: string,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    // Users can only change their own password unless they are admin
    if (
      currentUser.userId !== id &&
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new Error('Unauthorized to change this password');
    }

    // Verify old password
    const user = await this.userService.findOne(id);
    const isOldPasswordValid = await this.userService.verifyPassword(
      changePasswordDto.oldPassword,
      user.password,
    );

    if (!isOldPasswordValid) {
      throw new Error('Old password is incorrect');
    }

    // Update password
    await this.userService.updatePassword(id, changePasswordDto.newPassword);

    return { message: 'Password updated successfully' };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  async remove(@Param('id') id: string) {
    await this.userService.remove(id);
    return { message: 'User deleted successfully' };
  }
}
