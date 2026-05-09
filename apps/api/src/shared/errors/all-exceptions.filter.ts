import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ulid } from 'ulid';

import { BusinessException } from './business.exception';
import { ERROR_CODES, type ErrorCode } from './error-codes';

interface ErrorBody {
  code: ErrorCode | string;
  message: string;
  details?: Record<string, unknown>;
  traceId: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const traceId = (req.headers['x-request-id'] as string | undefined) ?? ulid();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorBody = {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Internal server error',
      traceId,
    };

    if (exception instanceof BusinessException) {
      status = exception.getStatus();
      body = {
        code: exception.code,
        message: exception.message,
        details: exception.details,
        traceId,
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      const asObj =
        typeof resp === 'object' && resp !== null
          ? (resp as Record<string, unknown>)
          : { message: String(resp) };
      body = {
        code: (asObj.code as string) ?? mapStatusToCode(status),
        message:
          (asObj.message as string) ??
          (Array.isArray((asObj as { message?: unknown }).message)
            ? ((asObj as { message: string[] }).message.join(', '))
            : exception.message),
        details: asObj.details as Record<string, unknown> | undefined,
        traceId,
      };
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled error [${traceId}]: ${exception.message}`, exception.stack);
    }

    res.status(status).json(body);
  }
}

function mapStatusToCode(status: number): ErrorCode {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return ERROR_CODES.VALIDATION_FAILED;
    case HttpStatus.UNAUTHORIZED:
      return ERROR_CODES.UNAUTHORIZED;
    case HttpStatus.FORBIDDEN:
      return ERROR_CODES.FORBIDDEN;
    case HttpStatus.NOT_FOUND:
      return ERROR_CODES.NOT_FOUND;
    default:
      return ERROR_CODES.INTERNAL_ERROR;
  }
}
