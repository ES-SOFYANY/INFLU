import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { BrandModule } from '../brand/brand.module';

import {
  BusinessPaymentsController,
  CreatorPaymentsController,
  PaymentsController,
} from './payments.controller';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';

/**
 * PaymentsModule — bounded context shell.
 * US-160 / US-161 — payments listing for business + creator views.
 */
@Module({
  imports: [AuthModule, BrandModule],
  controllers: [
    BusinessPaymentsController,
    CreatorPaymentsController,
    PaymentsController,
  ],
  providers: [PaymentsService, PaymentsRepository],
  exports: [PaymentsService, PaymentsRepository],
})
export class PaymentsModule {}
