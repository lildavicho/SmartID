import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NfcTagService } from '../services/nfc-tag.service';
import { CreateNfcTagDto } from '../dto/create-nfc-tag.dto';
import { UpdateNfcTagDto } from '../dto/update-nfc-tag.dto';
import { NfcTag, NfcTagStatus } from '../entities/nfc-tag.entity';

@ApiTags('nfc-tags')
@ApiBearerAuth()
@Controller('nfc-tags')
export class NfcTagController {
  constructor(private readonly nfcTagService: NfcTagService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new NFC tag' })
  @ApiResponse({ status: 201, description: 'NFC tag registered successfully', type: NfcTag })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'NFC tag with this UID already exists' })
  async create(@Body() createNfcTagDto: CreateNfcTagDto): Promise<NfcTag> {
    return this.nfcTagService.create(createNfcTagDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all NFC tags' })
  @ApiQuery({ name: 'institutionId', required: false, type: 'string' })
  @ApiResponse({ status: 200, description: 'List of all NFC tags', type: [NfcTag] })
  async findAll(@Query('institutionId') institutionId?: string): Promise<NfcTag[]> {
    return this.nfcTagService.findAll(institutionId);
  }

  @Get('uid/:uid')
  @ApiOperation({ summary: 'Get NFC tag by UID' })
  @ApiParam({ name: 'uid', type: 'string' })
  @ApiResponse({ status: 200, description: 'NFC tag found', type: NfcTag })
  @ApiResponse({ status: 404, description: 'NFC tag not found' })
  async findByUid(@Param('uid') uid: string): Promise<NfcTag | null> {
    return this.nfcTagService.findByUid(uid);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get NFC tag by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'NFC tag found', type: NfcTag })
  @ApiResponse({ status: 404, description: 'NFC tag not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<NfcTag> {
    return this.nfcTagService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update NFC tag' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'NFC tag updated successfully', type: NfcTag })
  @ApiResponse({ status: 404, description: 'NFC tag not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNfcTagDto: UpdateNfcTagDto,
  ): Promise<NfcTag> {
    return this.nfcTagService.update(id, updateNfcTagDto);
  }

  @Post(':id/assign/:userId')
  @ApiOperation({ summary: 'Assign NFC tag to a user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'NFC tag assigned successfully', type: NfcTag })
  @ApiResponse({ status: 404, description: 'NFC tag not found' })
  async assignToUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<NfcTag> {
    return this.nfcTagService.assignToUser(id, userId);
  }

  @Post(':id/unassign')
  @ApiOperation({ summary: 'Unassign NFC tag from user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'NFC tag unassigned successfully', type: NfcTag })
  @ApiResponse({ status: 404, description: 'NFC tag not found' })
  async unassignFromUser(@Param('id', ParseUUIDPipe) id: string): Promise<NfcTag> {
    return this.nfcTagService.unassignFromUser(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update NFC tag status' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Status updated successfully', type: NfcTag })
  @ApiResponse({ status: 404, description: 'NFC tag not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: NfcTagStatus,
  ): Promise<NfcTag> {
    return this.nfcTagService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete NFC tag' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'NFC tag deleted successfully' })
  @ApiResponse({ status: 404, description: 'NFC tag not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.nfcTagService.remove(id);
  }
}

