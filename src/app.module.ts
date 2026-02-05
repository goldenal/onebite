import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { MenuModule } from './modules/menu/menu.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuthModule } from './modules/auth/auth.module';
import { StaffModule } from './modules/staff/staff.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { GroupOrdersModule } from './modules/group-orders/group-orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { LegacyOrdersModule } from './modules/legacy-orders/legacy-orders.module';
import { KitchenModule } from './modules/kitchen/kitchen.module';
import { AgentModule } from './modules/agent/agent.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { TabletModule } from './modules/tablet/tablet.module';
import { ChatModule } from './modules/chat/chat.module';
import { VoiceModule } from './modules/voice/voice.module';
import { LogBodyInterceptor } from './common/interceptors/log-body.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'info'),
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        autoLogging: false,
        serializers: {
          req(req) {
            return { method: req.method, url: req.url };
          },
          res(res) {
            return { statusCode: res.statusCode };
          },
        },
      },
    }),
    HealthModule,
    MenuModule,
    SettingsModule,
    AuthModule,
    StaffModule,
    InventoryModule,
    ReservationsModule,
    PromotionsModule,
    ReviewsModule,
    GroupOrdersModule,
    PaymentsModule,
    DeliveryModule,
    LegacyOrdersModule,
    KitchenModule,
    AgentModule,
    WebhooksModule,
    TabletModule,
    ChatModule,
    VoiceModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LogBodyInterceptor,
    },
  ],
})
export class AppModule {}
