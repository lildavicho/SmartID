import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserStatus } from '../enums/user-status.enum';

@Injectable()
export class UserService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, this.SALT_ROUNDS);

    const user = this.userRepository.create({
      email: createUserDto.email,
      password: hashedPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      legacyRole: createUserDto.role,
      institutionId: createUserDto.institutionId || null,
      status: createUserDto.status || UserStatus.ACTIVE,
      isActive: true,
    });

    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'legacyRole', 'roleId', 'status', 'createdAt', 'updatedAt'],
      relations: ['role'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'legacyRole',
        'roleId',
        'status',
        'institutionId',
        'createdAt',
        'updatedAt',
      ],
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ 
      where: { email },
      relations: ['role'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, this.SALT_ROUNDS);
    }

    const updateData: Partial<User> = {};

    if (updateUserDto.email) updateData.email = updateUserDto.email;
    if (updateUserDto.password) updateData.password = updateUserDto.password;
    if (updateUserDto.firstName) updateData.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName) updateData.lastName = updateUserDto.lastName;
    if (updateUserDto.role) updateData.legacyRole = updateUserDto.role;
    if (updateUserDto.status) updateData.status = updateUserDto.status as UserStatus;
    if (updateUserDto.institutionId !== undefined)
      updateData.institutionId = updateUserDto.institutionId;

    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async updatePassword(id: string, newPassword: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.password = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    return this.userRepository.save(user);
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async assignRole(userId: string, roleId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    user.roleId = roleId;
    return this.userRepository.save(user);
  }
}
