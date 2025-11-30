import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DeviceService, PaginatedResult } from './device.service';
import { ClassroomService } from './classroom.service';
import {
  CreateDeviceDto,
  UpdateDeviceDto,
  QueryDeviceDto,
  DeviceHeartbeatDto,
  UpdateDeviceStatusDto,
  BindDeviceToClassroomDto,
  CreateClassroomDto,
  UpdateClassroomDto,
  QueryClassroomDto,
} from './dto';
import { Device, Classroom } from './entities';
import { DeviceStatus } from './enums';

@ApiTags('devices')
@ApiBearerAuth()
@Controller('devices')
export class DeviceController {
  constructor(
    private readonly deviceService: DeviceService,
    private readonly classroomService: ClassroomService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new device' })
  @ApiResponse({
    status: 201,
    description: 'Device registered successfully',
    type: Device,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Validation failed' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Device code or serial number already exists',
  })
  create(@Body() createDeviceDto: CreateDeviceDto): Promise<Device> {
    return this.deviceService.create(createDeviceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all devices with filters' })
  @ApiResponse({
    status: 200,
    description: 'List of devices retrieved successfully',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'campusId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: DeviceStatus })
  @ApiQuery({ name: 'classroomId', required: false, type: String })
  findAll(@Query() query: QueryDeviceDto): Promise<PaginatedResult<Device>> {
    return this.deviceService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a device by ID' })
  @ApiParam({ name: 'id', description: 'Device UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Device found',
    type: Device,
  })
  @ApiResponse({ status: 404, description: 'Device not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Device> {
    return this.deviceService.findOne(id);
  }

  @Post(':id/heartbeat')
  @ApiOperation({ summary: 'Update device heartbeat (lastSeen timestamp)' })
  @ApiParam({ name: 'id', description: 'Device UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Heartbeat updated successfully',
    type: Device,
  })
  @ApiResponse({ status: 404, description: 'Device not found' })
  updateHeartbeat(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() heartbeatDto: DeviceHeartbeatDto,
  ): Promise<Device> {
    return this.deviceService.updateHeartbeat(id, heartbeatDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update device status' })
  @ApiParam({ name: 'id', description: 'Device UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
    type: Device,
  })
  @ApiResponse({ status: 404, description: 'Device not found' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateDeviceStatusDto,
  ): Promise<Device> {
    return this.deviceService.updateStatus(id, updateStatusDto);
  }

  @Patch(':id/bind-classroom')
  @ApiOperation({ summary: 'Bind device to a classroom' })
  @ApiParam({ name: 'id', description: 'Device UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Device bound to classroom successfully',
    type: Device,
  })
  @ApiResponse({ status: 404, description: 'Device or classroom not found' })
  @ApiResponse({
    status: 400,
    description: 'Classroom does not belong to the same campus',
  })
  bindToClassroom(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() bindDto: BindDeviceToClassroomDto,
  ): Promise<Device> {
    return this.deviceService.bindToClassroom(id, bindDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a device' })
  @ApiParam({ name: 'id', description: 'Device UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Device updated successfully',
    type: Device,
  })
  @ApiResponse({ status: 404, description: 'Device not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ): Promise<Device> {
    return this.deviceService.update(id, updateDeviceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a device' })
  @ApiParam({ name: 'id', description: 'Device UUID', type: String })
  @ApiResponse({ status: 204, description: 'Device deleted successfully' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deviceService.remove(id);
  }
}

@ApiTags('devices')
@ApiBearerAuth()
@Controller('classrooms')
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new classroom' })
  @ApiResponse({
    status: 201,
    description: 'Classroom created successfully',
    type: Classroom,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Validation failed' })
  create(@Body() createClassroomDto: CreateClassroomDto): Promise<Classroom> {
    return this.classroomService.create(createClassroomDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all classrooms' })
  @ApiResponse({
    status: 200,
    description: 'List of classrooms retrieved successfully',
    type: [Classroom],
  })
  @ApiQuery({ name: 'campusId', required: false, type: String })
  findAll(@Query() query: QueryClassroomDto): Promise<Classroom[]> {
    return this.classroomService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a classroom by ID' })
  @ApiParam({ name: 'id', description: 'Classroom UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Classroom found',
    type: Classroom,
  })
  @ApiResponse({ status: 404, description: 'Classroom not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Classroom> {
    return this.classroomService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a classroom' })
  @ApiParam({ name: 'id', description: 'Classroom UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Classroom updated successfully',
    type: Classroom,
  })
  @ApiResponse({ status: 404, description: 'Classroom not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClassroomDto: UpdateClassroomDto,
  ): Promise<Classroom> {
    return this.classroomService.update(id, updateClassroomDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a classroom' })
  @ApiParam({ name: 'id', description: 'Classroom UUID', type: String })
  @ApiResponse({ status: 204, description: 'Classroom deleted successfully' })
  @ApiResponse({ status: 404, description: 'Classroom not found' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.classroomService.remove(id);
  }
}
