import { Module } from '@nestjs/common';

import { AppConfigModule } from './config/config.module';
import { AdminValidationModule } from './modules/admin-validation/admin-validation.module';
import { AiCampaignModule } from './modules/ai-campaign/ai-campaign.module';
import { AiCoachModule } from './modules/ai-coach/ai-coach.module';
import { AuthModule } from './modules/auth/auth.module';
import { BrandModule } from './modules/brand/brand.module';
import { BusinessProfileModule } from './modules/business-profile/business-profile.module';
import { CreatorProfileModule } from './modules/creator-profile/creator-profile.module';
import { CrmModule } from './modules/crm/crm.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SupportModule } from './modules/support/support.module';
import { AiModule } from './shared/ai/ai.module';
import { AuditModule } from './shared/audit/audit.module';
import { SharedAuthModule } from './shared/auth/auth.module';
import { DynamoDbModule } from './shared/dynamodb/dynamodb.module';
import { ErrorsModule } from './shared/errors/errors.module';
import { I18nModule } from './shared/i18n/i18n.module';
import { NotificationsSharedModule } from './shared/notifications/notifications.module';
import { SocialModule } from './shared/social/social.module';
import { StorageModule } from './shared/storage/storage.module';

@Module({
  imports: [
    // Cross-cutting
    AppConfigModule,
    DynamoDbModule,
    SharedAuthModule,
    StorageModule,
    AiModule,
    SocialModule,
    I18nModule,
    NotificationsSharedModule,
    AuditModule,
    ErrorsModule,
    // Bounded contexts (14)
    AuthModule,
    CreatorProfileModule,
    BusinessProfileModule,
    BrandModule,
    MarketplaceModule,
    AiCampaignModule,
    AiCoachModule,
    DiscoveryModule,
    CrmModule,
    MessagingModule,
    PaymentsModule,
    NotificationsModule,
    SupportModule,
    AdminValidationModule,
  ],
})
export class AppModule {}
