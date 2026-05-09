import { HttpException, HttpStatus } from '@nestjs/common';

import type { ErrorCode } from './error-codes';

/**
 * Domain-level exception. The global filter renders it into the standard
 * `{code,message,details,traceId}` response.
 */
export class BusinessException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.CONFLICT,
    public readonly details?: Record<string, unknown>,
  ) {
    super({ code, message, details }, status);
  }
}
