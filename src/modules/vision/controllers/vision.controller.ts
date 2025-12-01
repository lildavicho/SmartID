import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { VisionService } from '../services/vision.service';
import { VisionHealthResponseDto } from '../dto/vision-health-response.dto';
import { VisionSnapshotDto } from '../dto/vision-snapshot.dto';
import { VisionSessionSummaryDto } from '../dto/vision-session-summary.dto';
import { YoloWebhookGuard } from '../guards/yolo-webhook.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Vision (YOLO Integration)')
@Controller('vision')
export class VisionController {
  constructor(private readonly visionService: VisionService) {}

  @Public()
  @Get('health')
  @ApiOperation({
    summary: 'Check YOLO service health',
    description: 'Returns the status of the YOLO microservice',
  })
  @ApiResponse({
    status: 200,
    description: 'YOLO service health status',
    type: VisionHealthResponseDto,
  })
  async checkHealth(): Promise<VisionHealthResponseDto> {
    return await this.visionService.checkHealth();
  }

  @Post('snapshots')
  @UseGuards(YoloWebhookGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive snapshot from YOLO service',
    description: 'Endpoint called by YOLO service to send detection snapshots',
  })
  @ApiHeader({
    name: 'x-yolo-secret',
    description: 'YOLO webhook secret for authentication',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Snapshot processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Session not IN_PROGRESS or invalid data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid YOLO webhook secret',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Session not found',
  })
  async handleSnapshot(@Body(ValidationPipe) dto: VisionSnapshotDto): Promise<{ success: boolean }> {
    await this.visionService.handleSnapshot(dto);
    return { success: true };
  }

  @Get('sessions/:sessionId/summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get attendance summary for a session',
    description: 'Returns attendance statistics and occupancy rate for a class session',
  })
  @ApiResponse({
    status: 200,
    description: 'Session summary retrieved successfully',
    type: VisionSessionSummaryDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Session not found',
  })
  async getSessionSummary(
    @Param('sessionId') sessionId: string,
  ): Promise<VisionSessionSummaryDto> {
    return await this.visionService.getSessionSummary(sessionId);
  }
}

