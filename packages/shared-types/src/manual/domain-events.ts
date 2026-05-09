import type { NotificationType } from './notification-types';

export type DomainEvent =
  | {
      type: 'ApplicationCreated';
      applicationId: string;
      productId: string;
      creatorId: string;
      at: string;
    }
  | { type: 'ApplicationAccepted'; applicationId: string; at: string }
  | { type: 'ContentValidated'; applicationId: string; paymentId: string; at: string }
  | { type: 'PaymentScheduled'; paymentId: string; slaHours: number; at: string }
  | { type: 'CinSubmitted'; userId: string; at: string }
  | { type: 'CinValidated'; userId: string; adminId: string; at: string };

export type NotificationFanoutInput = {
  notificationType: NotificationType;
  recipientUserId: string;
  payload: Record<string, unknown>;
};
