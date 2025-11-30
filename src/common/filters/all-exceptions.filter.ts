import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message || message;
        error = (exceptionResponse as any).error || error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;

      // Log the full stack trace for unexpected errors
      this.logger.error(`Unexpected error: ${exception.message}`, exception.stack);
    } else {
      // Log unknown exception types
      this.logger.error('Unknown exception type:', exception);
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
    };

    // Log the error response
    this.logger.error(`${request.method} ${request.url} - Status: ${status} - ${message}`);

    response.status(status).json(errorResponse);
  }
}
