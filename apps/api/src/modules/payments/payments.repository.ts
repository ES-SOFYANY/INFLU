import { Injectable } from '@nestjs/common';
import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

import { DynamoDbService } from '../../shared/dynamodb/dynamodb.service';

import type { PaymentStatus, PaymentType } from './dto/payment-summary.dto';

/**
 * Persistence layer for `Payment` (data-model §24). PK/SK = `PAY#<id>` / `META`.
 *
 * MVP — multi-tenant filtering is computed in-memory via `Scan` filtered on
 * `entity = Payment`. The future `GSI4` (`BUSINESS#<userId>#<type>#<status>`)
 * will replace the scan once volumes grow.
 */
export interface PaymentRecord {
  id: string;
  type: PaymentType;
  status: PaymentStatus;
  /** Beneficiary creator user id (multi-tenant filter for `/creator/me/payments`). */
  creatorUserId: string;
  /** Business owner user id (multi-tenant filter for `/business/payments`). */
  ownerUserId: string;
  brandId: string;
  amount: number;
  currency: 'MAD';
  requestedAt: string;
  completedAt: string | null;
}

@Injectable()
export class PaymentsRepository {
  constructor(protected readonly db: DynamoDbService) {}

  static pk(paymentId: string): string {
    return `PAY#${paymentId}`;
  }

  async putPayment(record: PaymentRecord): Promise<void> {
    await this.db.client.send(
      new PutCommand({
        TableName: this.db.mainTable,
        Item: {
          PK: PaymentsRepository.pk(record.id),
          SK: 'META',
          entity: 'Payment',
          ...record,
          GSI4PK: `BUSINESS#${record.ownerUserId}#${record.type}#${record.status}`,
          GSI4SK: `PAY#${record.requestedAt}#${record.id}`,
        },
      }),
    );
  }

  /**
   * MVP — full-table scan filtered by `entity = Payment`. Returns ALL payments;
   * service applies multi-tenant + filter logic and pagination in-memory.
   */
  async scanAll(): Promise<PaymentRecord[]> {
    const out: PaymentRecord[] = [];
    let cursor: Record<string, unknown> | undefined;
    do {
      const res = await this.db.client.send(
        new ScanCommand({
          TableName: this.db.mainTable,
          ExclusiveStartKey: cursor,
          FilterExpression: '#e = :p',
          ExpressionAttributeNames: { '#e': 'entity' },
          ExpressionAttributeValues: { ':p': 'Payment' },
        }),
      );
      for (const it of res.Items ?? []) {
        const {
          PK: _p,
          SK: _s,
          entity: _e,
          GSI4PK: _g4p,
          GSI4SK: _g4s,
          ...rest
        } = it;
        out.push(rest as unknown as PaymentRecord);
      }
      cursor = res.LastEvaluatedKey;
    } while (cursor);
    return out;
  }
}
