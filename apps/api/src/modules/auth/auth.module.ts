import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

/**
 * AuthModule — bounded context shell.
 * Story Implementers fill controllers / services / repositories per US.
 */
@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
  exports: [AuthService, AuthRepository],
})
export class AuthModule {}
